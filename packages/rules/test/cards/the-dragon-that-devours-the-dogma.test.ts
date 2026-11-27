import { describe, expect, it } from "vitest";
import { atk, type CardDef, cites, type Duel, moveCard, moveCards, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { equipCards } from "../rules/equip-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { aceFixtures } from "./sky-striker-ace-fixtures";
import { batch6Defs } from "./sky-striker-batch6-fixtures";
import { activations, find, resolve } from "./sky-striker-fixtures";

const card = "the-dragon-that-devours-the-dogma";
const activate = `activate ${card}`;

/**
 * Made-up cards for The Dragon that Devours the Dogma (none registered in CARD_SOURCES): its Fusion Materials ("Fallen of Albaz" by name, LIGHT or
 * DARK monsters, Effect Monsters, and monsters that are neither), "Dogmatika" and "Tri-Brigade" cards to add, and Quick-Play Spells that send it from
 * the Extra Deck or the field to the GY, or banish the monsters of the player's own GY. The real "The Fallen & The Virtuous" is a "Dogmatika" card.
 */
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, ...facts }, ...more });
const quickPlay = (code: string, operation: NonNullable<NonNullable<CardDef["effects"]>[number]["operation"]>): CardDef => ({ code, kind: "quick-play", facts: { name: code }, effects: [{ type: "activation", operation }] });
const dogmaIn = (duel: Duel, player: "you" | "rival", zone: "extra" | "monster" | "graveyard") => duel.piles[player][zone].find((id) => duel.cards[id]!.code === card);
const fixtures: Record<string, CardDef> = {
	"fixture-fallen-albaz": monster("fixture-fallen-albaz", { name: "Fallen of Albaz", attribute: "DARK", monsterType: "Dragon", level: 4, atk: 1800, def: 0, effect: true }),
	"fixture-light-normal": monster("fixture-light-normal", { attribute: "LIGHT", monsterType: "Fairy", level: 4, atk: 1000, def: 1000, normal: true }),
	"fixture-earth-effect": monster("fixture-earth-effect", { attribute: "EARTH", monsterType: "Rock", level: 4, atk: 1000, def: 1000, effect: true }),
	"fixture-earth-normal": monster("fixture-earth-normal", { attribute: "EARTH", monsterType: "Rock", level: 4, atk: 1000, def: 1000, normal: true }),
	"fixture-dogmatika-spell": { code: "fixture-dogmatika-spell", kind: "spell", facts: { name: "Fixture Dogmatika Spell", archetypes: ["Dogmatika"] } },
	"fixture-tri-brigade": monster("fixture-tri-brigade", { attribute: "DARK", monsterType: "Beast", level: 4, atk: 1500, def: 0, effect: true, archetypes: ["Tri-Brigade"] }),
	"fixture-ecclesia-down": monster("fixture-ecclesia-down", { level: 4, atk: 1000, def: 1000, effect: true, archetypes: ["Ecclesia"] }),
	// "Send 1 "The Dragon that Devours the Dogma" from your Extra Deck to the GY" / "from your field to the GY".
	"fixture-dogma-sender": quickPlay("fixture-dogma-sender", (duel, link) => { const id = dogmaIn(duel, link.player, "extra"); return id === undefined ? duel : moveCard(duel, id, { zone: "graveyard", effect: link }); }),
	"fixture-dogma-dropper": quickPlay("fixture-dogma-dropper", (duel, link) => { const id = dogmaIn(duel, link.player, "monster"); return id === undefined ? duel : moveCard(duel, id, { zone: "graveyard", effect: link }); }),
	// "Banish all monsters in your GY."
	"fixture-own-exile": quickPlay("fixture-own-exile", (duel, link) => moveCards(duel, duel.piles[link.player].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster"), { zone: "banished", effect: link })),
	// "Special Summon 1 "The Dragon that Devours the Dogma" from your Extra Deck" (treated as a Fusion Summon, so it is properly Summoned).
	"fixture-dogma-caller": quickPlay("fixture-dogma-caller", (duel, link) => { const id = dogmaIn(duel, link.player, "extra"); return id === undefined ? duel : specialSummon(duel, link.player, id, { kind: "fusion" }); }),
	// The same, as a monster's Quick Effect: nothing goes to the GY.
	"fixture-dogma-summoner": monster("fixture-dogma-summoner", { level: 4, atk: 1000, def: 1000, effect: true }, { effects: [{ type: "quick", operation: (duel, link) => { const id = dogmaIn(duel, link.player, "extra"); return id === undefined ? duel : specialSummon(duel, link.player, id, { kind: "fusion", slot: 2 }); } }] }),
	// A monster with a Quick Effect usable in the Damage Step: "Special Summon 1 "The Dragon that Devours the Dogma" from your GY" (it must have been properly Summoned).
	"fixture-dogma-reviver": monster("fixture-dogma-reviver", { level: 4, atk: 2000, def: 0, effect: true }, { effects: [{ type: "quick", damageStep: true, operation: (duel, link) => { const id = dogmaIn(duel, link.player, "graveyard"); return id === undefined ? duel : specialSummon(duel, link.player, id, { slot: 2 }); } }] }),
};
const equips = equipCards();
const defs: Record<string, CardDef> = { ...batch6Defs, ...aceFixtures, "fixture-polymerization": equips["fixture-polymerization"]!, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, turn: "you" | "rival" = "you", phase?: "main1" | "battle" | "main2" | "end") => position({ defs, options: { everyWindow: true }, you, rival, turn, ...(phase ? { phase } : {}) });
/** Passes until the turn player holds priority in the open game state of the End Phase. */
function toEnd(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === "end" && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 60; guard++) next = play(next, "pass");
	return next;
}
/** Answers every question of a Summon with its first zone, and passes while a chain is open; stops when a trigger is to be chosen. */
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 16; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
/** The Fusion Summon of the Dragon by "fixture-polymerization", with the three monsters of `field` as its materials. */
const fused = (you: SideSpec = {}, rival: SideSpec = {}) => settle(play(board({ hand: ["fixture-polymerization"], monsters: ["fixture-fallen-albaz", "fixture-light-normal", "fixture-earth-effect"], extra: [card], ...you }, rival), "activate fixture-polymerization"));
/** Passes until the chain has resolved (or a question or a choice of Trigger Effects is open). */
const chainDone = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 8 && next.chain.length > 0 && !next.asking && !next.building; guard++) next = play(next, "pass");
	return next;
};
/** A Dragon Special Summoned from the Extra Deck by "fixture-dogma-caller" in Main Phase 1: its Trigger Effect is now to be chosen. */
const summoned = (you: SideSpec = {}, rival: SideSpec = {}) => chainDone(play(board({ extra: [card], ...you, hand: ["fixture-dogma-caller", ...(you.hand ?? [])] }, rival), "activate fixture-dogma-caller"));

describe("The Dragon that Devours the Dogma, written as effect records", () => {
	it(`${cites("the-dragon-that-devours-the-dogma", "facts")} is a DARK Beast Fusion Effect Monster of Level 8 with 3000 ATK and 2500 DEF, that mentions "Fallen of Albaz" and itself, and is no "Dogmatika" card`, () => {
		const duel = board({ extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "The Dragon that Devours the Dogma", attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 8, atk: 3000, def: 2500, mentions: ["Fallen of Albaz", "The Dragon that Devours the Dogma"] });
	});

	describe("its Fusion Summon (no card of the Sky Striker list can perform it: made-up materials and Polymerization)", () => {
		const can = (monsters: string[]) => activations(board({ hand: ["fixture-polymerization"], monsters, extra: [card] }), "fixture-polymerization").length > 0;
		it(`${cites("the-dragon-that-devours-the-dogma", "procedure")} needs "Fallen of Albaz", 1 LIGHT or DARK monster and 1 Effect Monster, one card each`, () => {
			expect(can(["fixture-fallen-albaz", "fixture-light-normal", "fixture-earth-effect"])).toBe(true);
			// A DARK Effect Monster is either of the last two.
			expect(can(["fixture-fallen-albaz", "fixture-dark", "fixture-earth-effect"])).toBe(true);
			expect(can(["fixture-fallen-albaz", "fixture-light-normal", "fixture-dark"])).toBe(true);
			// No "Fallen of Albaz"; no LIGHT or DARK monster besides it; no Effect Monster besides it; only two monsters.
			expect(can(["fixture-dark", "fixture-light-normal", "fixture-earth-effect"])).toBe(false);
			expect(can(["fixture-fallen-albaz", "fixture-earth-normal", "fixture-earth-effect"])).toBe(false);
			expect(can(["fixture-fallen-albaz", "fixture-light-normal", "fixture-earth-normal"])).toBe(false);
			expect(can(["fixture-fallen-albaz", "fixture-dark"])).toBe(false);
			const done = fused();
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "fusion" });
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-earth-effect", "fixture-fallen-albaz", "fixture-light-normal", "fixture-polymerization"]);
		});
	});

	describe("while an \"Ecclesia\" monster is on the field or in either GY", () => {
		it(`${cites("the-dragon-that-devours-the-dogma", "ecclesia")} ${cites("the-dragon-that-devours-the-dogma", "notes-ecclesia-continuous")} ${cites("the-dragon-that-devours-the-dogma", "notes-ecclesia-where")} gains 500 ATK while an "Ecclesia" monster is face-up in either Monster Zone or in either GY; not face-down, not in the hand; not while its effects are negated`, () => {
			const dragon = (you: SideSpec, rival: SideSpec = {}) => { const duel = board({ ...you, monsters: [card, ...(you.monsters ?? [])] }, rival); return atk(duel, find(duel, card).id); };
			expect(dragon({})).toBe(3000);
			expect(dragon({ graveyard: ["fixture-ecclesia"] })).toBe(3500);
			expect(dragon({}, { graveyard: ["fixture-ecclesia"] })).toBe(3500);
			expect(dragon({ monsters: ["fixture-ecclesia"] })).toBe(3500);
			expect(dragon({}, { monsters: ["fixture-ecclesia"] })).toBe(3500);
			expect(dragon({ facedown: ["fixture-ecclesia-down"] })).toBe(3000);
			expect(dragon({ hand: ["fixture-ecclesia"] })).toBe(3000);
			const start = board({ monsters: [card], graveyard: ["fixture-ecclesia"] });
			expect(atk(negateCardEffects(start, find(start, card).id, start.turn.number), find(start, card).id)).toBe(3000);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "ecclesia")} is unaffected by the effects of every other card, its own controller's too; with no "Ecclesia" monster it is affected again`, () => {
			const hit = (you: SideSpec, rival: SideSpec) => resolve(play(board({ monsters: [card], ...you }, rival, "rival"), `activate fixture-destroy > ${card}`));
			expect(find(hit({ graveyard: ["fixture-ecclesia"] }, { hand: ["fixture-destroy"] }), card).zone).toBe("monster");
			expect(find(hit({}, { hand: ["fixture-destroy"] }), card).zone).toBe("graveyard");
			const own = resolve(play(board({ monsters: [card], hand: ["fixture-destroy"], graveyard: ["fixture-ecclesia"] }), `activate fixture-destroy > ${card}`));
			expect(find(own, card).zone).toBe("monster");
		});
	});

	describe("its effect when Special Summoned", () => {
		it(`${cites("the-dragon-that-devours-the-dogma", "shuffle")} ${cites("the-dragon-that-devours-the-dogma", "notes-shuffle-trigger")} Fusion Summoned, it shuffles up to 2 cards from either GY or banishment into the Deck: chosen when it resolves, back to each owner's Deck`, () => {
			const start = fused({}, { graveyard: ["fixture-big"] });
			expect(offered(start)).toContain(activate);
			const asked = play(start, activate);
			const choosing = resolve(asked);
			expect(choosing.asking).toBeTruthy();
			const one = play(choosing, "choose fixture-big");
			const done = resolve(play(one, "choose fixture-fallen-albaz"));
			expect(codes(done, "rival", "graveyard")).toEqual([]);
			expect(codes(done, "rival", "deck")).toContain("fixture-big");
			expect(codes(done, "you", "deck")).toContain("fixture-fallen-albaz");
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-earth-effect", "fixture-light-normal", "fixture-polymerization"]);
			expect(asked.chain[0]!.categories).toEqual(["return-to-deck"]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "shuffle")} "up to 2": 1 card is enough, and a banished card may be chosen; with no card in any GY or banishment it is not offered`, () => {
			const start = summoned({ graveyard: ["fixture-filler"] }, { graveyard: ["fixture-normal"] });
			const asked = resolve(play(start, activate));
			const one = play(asked, "choose fixture-normal");
			expect(offered(one)).toContain("pass");
			const done = resolve(play(one, "pass"));
			expect(codes(done, "rival", "deck")).toEqual(["fixture-normal"]);
			// The resolved "fixture-dogma-caller" stays in the GY.
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-dogma-caller", "fixture-filler"]);
			// Summoned by a monster's effect, which stays on the field: no card in any GY or banishment.
			const empty = chainDone(play(board({ monsters: ["fixture-dogma-summoner"], extra: [card] }), "activate fixture-dogma-summoner"));
			expect(find(empty, card).zone).toBe("monster");
			expect(offered(empty)).not.toContain(activate);
			// One banished card is enough.
			const lone = board({ monsters: ["fixture-dogma-summoner"], extra: [card], graveyard: ["fixture-normal"] });
			const banishedOne = moveCard(lone, find(lone, "fixture-normal").id, { zone: "banished" });
			expect(offered(chainDone(play(banishedOne, "activate fixture-dogma-summoner")))).toContain(activate);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "notes-shuffle-face-down")} ${cites("the-dragon-that-devours-the-dogma", "qa-face-down-banished-24417")} a card banished face-down may be chosen too`, () => {
			const placed = board({ hand: ["fixture-dogma-caller"], extra: [card], graveyard: ["fixture-filler"] });
			const filler = find(placed, "fixture-filler").id;
			const down = moveCard(placed, filler, { zone: "banished", face: "down" });
			expect(down.cards[filler]).toMatchObject({ zone: "banished", face: "down" });
			const asked = resolve(play(chainDone(play(down, "activate fixture-dogma-caller")), activate));
			expect(offered(asked)).toEqual(["choose fixture-dogma-caller", "choose fixture-filler"]);
			const done = resolve(play(asked, "choose fixture-filler", "pass"));
			expect(codes(done, "you", "deck")).toEqual(["fixture-filler"]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "notes-shuffle-extra")} a Fusion, Synchro, Xyz or Link Monster chosen goes back face-down to its owner's Extra Deck`, () => {
			const placed = board({ hand: ["fixture-dogma-caller"], extra: [card] }, { extra: ["fixture-link"] });
			const start = chainDone(play(moveCard(placed, find(placed, "fixture-link").id, { zone: "graveyard" }), "activate fixture-dogma-caller"));
			const done = resolve(play(resolve(play(start, activate)), "choose fixture-link", "pass"));
			expect(find(done, "fixture-link")).toMatchObject({ zone: "extra", face: "down", owner: "rival" });
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "notes-shuffle-damage-step")} it is activated in the Damage Step too`, () => {
			const start = board({ monsters: ["fixture-dogma-reviver"], graveyard: [card, "fixture-filler"] }, { monsters: ["fixture-normal"] }, "you", "battle");
			const proper = { ...start, cards: { ...start.cards, [find(start, card).id]: { ...find(start, card), proper: true } } };
			const declared = play(proper, "attack fixture-dogma-reviver > fixture-normal");
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			const revived = chainDone(play(mine, "activate fixture-dogma-reviver"));
			expect(find(revived, card).zone).toBe("monster");
			expect(revived.battle?.step).toBe("start");
			expect(offered(revived)).toContain(activate);
		});
	});

	describe("its effect in the End Phase, from the GY", () => {
		const deck = ["fixture-dogmatika-spell", "fixture-tri-brigade", "the-fallen-and-the-virtuous", "fixture-filler", "fixture-other-spell"];
		const sentInMain = (you: SideSpec = {}) => resolve(play(board({ hand: ["fixture-dogma-sender"], extra: [card], deck, ...you }), "activate fixture-dogma-sender"));
		it(`${cites("the-dragon-that-devours-the-dogma", "search")} ${cites("the-dragon-that-devours-the-dogma", "notes-search-graveyard")} ${cites("the-dragon-that-devours-the-dogma", "notes-search-stayed")} sent to the GY this turn, it adds 1 "Dogmatika" or "Tri-Brigade" card from the Deck in the End Phase; "The Fallen & The Virtuous" is a "Dogmatika" card`, () => {
			const sent = sentInMain();
			expect(find(sent, card).zone).toBe("graveyard");
			// Not before the End Phase.
			expect(activations(sent, card)).toEqual([]);
			const end = toEnd(sent);
			expect(activations(end, card)).toEqual([activate]);
			const asked = resolve(play(end, activate));
			expect(offered(asked).sort()).toEqual(["choose fixture-dogmatika-spell", "choose fixture-tri-brigade", "choose the-fallen-and-the-virtuous"]);
			const done = resolve(play(asked, "choose the-fallen-and-the-virtuous"));
			expect(codes(done, "you", "hand")).toEqual(["the-fallen-and-the-virtuous"]);
			expect(play(end, activate).chain[0]!.categories).toEqual(["search"]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "notes-search-stayed")} ${cites("rules", "sent-this-turn-stayed-in-graveyard")} not offered when it was sent to the GY on an earlier turn, nor once it has left the GY`, () => {
			expect(activations(toEnd(board({ graveyard: [card], deck })), card)).toEqual([]);
			const gone = resolve(play(sentInMain({ hand: ["fixture-dogma-sender", "fixture-own-exile"] }), "activate fixture-own-exile"));
			expect(find(gone, card).zone).toBe("banished");
			expect(activations(toEnd(gone), card)).toEqual([]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "search")} not offered with no "Dogmatika" or "Tri-Brigade" card in the Deck`, () => {
			expect(activations(toEnd(sentInMain({ deck: ["fixture-filler", "fixture-other-spell"] })), card)).toEqual([]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "notes-search-end-phase-sent")} sent to the GY during the End Phase, it is activated in that End Phase`, () => {
			const end = toEnd(board({ hand: ["fixture-dogma-sender"], extra: [card], deck }));
			expect(activations(end, card)).toEqual([]);
			const sent = resolve(play(end, "activate fixture-dogma-sender"));
			expect([sent.turn.phase, find(sent, card).zone]).toEqual(["end", "graveyard"]);
			const open = toEnd(sent);
			expect(activations(open, card)).toEqual([activate]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "search")} ${cites("rules", "end-phase-other-player-next")} in the opponent's turn too ("During the End Phase"): sent as the cost of "The Fallen & The Virtuous" in their turn, it is offered once they have passed in the End Phase`, () => {
			const start = board({ set: ["the-fallen-and-the-virtuous"], extra: [card], deck }, { monsters: ["fixture-filler"] }, "rival");
			const sent = resolve(play(start, "pass", `activate the-fallen-and-the-virtuous ~ ${card} > fixture-filler`));
			expect(find(sent, card).zone).toBe("graveyard");
			const end = toEnd(sent);
			expect([end.turn.player, end.priority.holder, activations(end, card)]).toEqual(["rival", "rival", []]);
			const mine = play(end, "pass");
			expect([mine.priority.holder, activations(mine, card)]).toEqual(["you", [activate]]);
			const done = resolve(play(resolve(play(mine, activate)), "choose fixture-tri-brigade"));
			expect(codes(done, "you", "hand")).toEqual(["fixture-tri-brigade"]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "search")} a field Dragon sent to the GY this turn counts as well (any way of being sent)`, () => {
			const sent = resolve(play(board({ monsters: [card], hand: ["fixture-dogma-dropper"], deck }), "activate fixture-dogma-dropper"));
			expect(find(sent, card).zone).toBe("graveyard");
			expect(activations(toEnd(sent), card)).toEqual([activate]);
		});
	});

	describe("each effect once per turn", () => {
		it(`${cites("the-dragon-that-devours-the-dogma", "once")} the End Phase effect: two Dragons sent this turn, only one adds a card`, () => {
			const deck = ["fixture-dogmatika-spell", "fixture-tri-brigade"];
			const start = board({ hand: ["fixture-dogma-sender", "fixture-dogma-sender"], extra: [card, card], deck });
			const sent = resolve(play(resolve(play(start, "activate fixture-dogma-sender")), "activate fixture-dogma-sender"));
			expect(codes(sent, "you", "graveyard").filter((code) => code === card)).toHaveLength(2);
			const end = toEnd(sent);
			const used = resolve(play(resolve(play(end, activate)), "choose fixture-tri-brigade"));
			expect(codes(used, "you", "hand")).toEqual(["fixture-tri-brigade"]);
			expect(activations(used, card)).toEqual([]);
		});
		it(`${cites("the-dragon-that-devours-the-dogma", "once")} the effect when Special Summoned: a second Dragon Special Summoned the same turn cannot use it`, () => {
			const start = summoned({ extra: [card, card], hand: ["fixture-dogma-caller"], graveyard: ["fixture-filler", "fixture-normal"] });
			const first = resolve(play(start, activate));
			const done = resolve(play(first, "choose fixture-filler", "pass"));
			expect(codes(done, "you", "deck")).toEqual(["fixture-filler"]);
			// The second caller Summons the second Dragon: no Trigger Effect is offered for it.
			const second = chainDone(play(done, "activate fixture-dogma-caller"));
			expect(Object.values(second.cards).filter((entry) => entry.code === card && entry.zone === "monster")).toHaveLength(2);
			expect(offered(second)).not.toContain(activate);
		});
	});
});
