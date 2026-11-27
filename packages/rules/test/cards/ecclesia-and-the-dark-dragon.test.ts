import { describe, expect, it } from "vitest";
import { atk, cardsIn, cites, type Duel, moveCard, printedFacts, type Side, type Zone } from "../../src";
import { codes, offered, play } from "../rules/fixtures";
import { board8 } from "./sky-striker-batch8-fixtures";
import { effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";
import { find, resolve } from "./sky-striker-fixtures";

const card = "ecclesia-and-the-dark-dragon";
const BANISH = 0;
const SHUFFLE = 1;
const summon = `special-summon ${card}`;
const idOf = (duel: Duel, code: string): number => find(duel, code).id;
const idIn = (duel: Duel, side: Side, zone: Zone, code: string): number => cardsIn(duel, side, zone).find((entry) => entry.code === code)!.id;

/** Passes until the turn player holds priority in an open game state of `phase` in turn `turn`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"], turn = duel.turn.number): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.number === turn && next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}
/** Answers every question that is open with its first zone (or its first card), until none is. */
function settle(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && next.asking; guard++) next = play(next, offered(next).find((label) => label.startsWith("place")) ?? offered(next)[0]!);
	return next;
}
/** Passes until `label` is on offer. */
function untilOffered(duel: Duel, label: string): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && !offered(next).includes(label); guard++) next = play(next, "pass");
	return next;
}
/** A card of the player's Graveyard banished face-up (the board helpers have no banished pile). */
const banished = (duel: Duel, side: Side, code: string, face: "up" | "down" = "up"): Duel => moveCard(duel, idIn(duel, side, "graveyard", code), { zone: "banished", face });

/** Ecclesia on the field with "Fallen of Albaz" in the Deck: its first effect is on offer. */
const onField = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = {}, log: string[] = []) => board8(log, { monsters: [card, "fixture-filler"], deck: ["fixture-albaz"], ...you }, rival, {}, "you");
/**
 * Ecclesia and a Level 8 Fusion Monster in the Graveyard (cards of the Extra Deck, sent there: they go back to the Extra Deck), a monster of each player on the
 * field: its second effect is on offer. `sent`: the cards of the player's Extra Deck that are in the Graveyard; `rivalSent`: the opponent's.
 */
const inGraveyard = (sent: string[] = [card, "fixture-fusion-8"], rival: Record<string, string[]> = {}, rivalSent: string[] = [], you: Record<string, string[]> = {}, log: string[] = []) => {
	const duel = board8(log, { monsters: ["fixture-filler"], extra: sent, ...you }, { monsters: ["fixture-big"], extra: rivalSent, ...rival });
	const mine = sent.reduce((board, code) => moveCard(board, idIn(board, "you", "extra", code), { zone: "graveyard" }), duel);
	return rivalSent.reduce((board, code) => moveCard(board, idIn(board, "rival", "extra", code), { zone: "graveyard" }), mine);
};

describe("Ecclesia and the Dark Dragon, written as effect records", () => {
	it(`${cites("ecclesia-and-the-dark-dragon", "facts")} is a LIGHT Spellcaster Synchro Effect Monster of Level 8, 2500/2500, an "Ecclesia" monster by its name, whose text names "Fallen of Albaz" and itself`, () => {
		const duel = board8([], { extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, idOf(duel, card))).toEqual({ name: "Ecclesia and the Dark Dragon", attribute: "LIGHT", monsterType: "Spellcaster", frame: "synchro", level: 8, atk: 2500, def: 2500, archetypes: ["Ecclesia"], mentions: ["Fallen of Albaz", "Ecclesia and the Dark Dragon"] });
	});
	it(`${cites("ecclesia-and-the-dark-dragon", "procedure")} is Synchro Summoned with 1 Tuner and 1 or more non-Tuners whose Levels add up to 8, and sends them to the Graveyard`, () => {
		expect(offered(board8([], { monsters: ["fixture-tuner-3", "fixture-nontuner-5"], extra: [card] }))).toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-tuner-3", "fixture-nontuner-4"], extra: [card] }))).not.toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-nontuner-5", "fixture-nontuner-4"], extra: [card] }))).not.toContain(summon);
		const done = play(board8([], { monsters: ["fixture-tuner-3", "fixture-nontuner-5"], extra: [card] }), summon, "place 5", "pass", "pass");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-nontuner-5", "fixture-tuner-3"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", summonedBy: "synchro", proper: true });
	});

	describe("the first effect: banish this card until the End Phase and Special Summon", () => {
		it(`${cites("ecclesia-and-the-dark-dragon", "banish")} ${cites("ecclesia-and-the-dark-dragon", "notes-banish-quick")} ${cites("ecclesia-and-the-dark-dragon", "notes-banish-then-summon")} ${cites("ecclesia-and-the-dark-dragon", "notes-banish-mentions")} it banishes itself, then Special Summons "Fallen of Albaz" or a Level 4 or lower monster whose text names it, from the Deck or the Graveyard: not from the hand, not Level 5 or higher, not a monster that does not name it`, () => {
			const duel = onField({ hand: ["fixture-mentions-4"], deck: ["fixture-albaz", "fixture-mentions-7", "fixture-unrelated-4"], graveyard: ["fixture-mentions-4"] });
			expect(effectsOffered(duel, card)).toEqual([BANISH]);
			const ecclesia = idOf(duel, card);
			const asked = resolve(playEffect(duel, card, BANISH));
			// This card is banished first, face-up.
			expect(asked.cards[ecclesia]).toMatchObject({ zone: "banished", face: "up" });
			expect(offered(asked).sort()).toEqual(["choose fixture-albaz", "choose fixture-mentions-4"]);
			const done = settle(play(asked, "choose fixture-mentions-4"));
			// The one of the Graveyard was Summoned; the one of the hand stays there.
			expect(codes(done, "you", "monster").sort()).toEqual(["fixture-filler", "fixture-mentions-4"]);
			expect(codes(done, "you", "hand")).toEqual(["fixture-mentions-4"]);
			expect(codes(done, "you", "graveyard")).toEqual([]);
			const fromDeck = settle(play(asked, "choose fixture-albaz"));
			expect(codes(fromDeck, "you", "monster").sort()).toEqual(["fixture-albaz", "fixture-filler"]);
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "banish")} it comes back in the End Phase, face-up, to a Main Monster Zone its controller chooses; not a Special Summon, and a monster it summoned stays`, () => {
			const duel = onField();
			const ecclesia = idOf(duel, card);
			// One monster to Special Summon: it is taken, and the player chooses its zone.
			const done = settle(resolve(playEffect(duel, card, BANISH)));
			expect(done.delayed).toMatchObject([{ player: "you", mandatory: true, due: { phase: "end", turn: 3 } }]);
			const asked = play(toPhase(done, "end"), `apply ${card}`);
			expect(asked.asking).toMatchObject({ player: "you" });
			const back = settle(asked);
			expect(back.cards[ecclesia]).toMatchObject({ zone: "monster", controller: "you", face: "up", position: "attack" });
			expect(back.cards[ecclesia]!.slot).toBeLessThan(5);
			expect(back.summons.filter((summoned) => summoned.code === card)).toEqual([]);
			expect(find(back, "fixture-albaz").zone).toBe("monster");
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "banish")} ${cites("ecclesia-and-the-dark-dragon", "notes-banish-quick")} it can be activated in the Main Phase of either player, and not in another phase`, () => {
			const rivalMain = play(board8([], { monsters: [card], deck: ["fixture-albaz"] }, {}, {}, "rival"), "pass");
			expect([rivalMain.turn.player, rivalMain.turn.phase, effectsOffered(rivalMain, card)]).toEqual(["rival", "main1", [BANISH]]);
			expect(effectsOffered(board8([], { monsters: [card], deck: ["fixture-albaz"] }, {}, {}, "you", "main2"), card)).toEqual([BANISH]);
			expect(effectsOffered(board8([], { monsters: [card], deck: ["fixture-albaz"] }, {}, {}, "you", "battle"), card)).toEqual([]);
			expect(effectsOffered(board8([], { monsters: [card], deck: ["fixture-albaz"] }, {}, {}, "you", "end"), card)).toEqual([]);
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "banish")} it cannot be activated with no monster to Special Summon (nothing in the Deck or the Graveyard that is "Fallen of Albaz" or names it)`, () => {
			expect(effectsOffered(onField({ deck: ["fixture-unrelated-4", "fixture-mentions-7"], graveyard: ["fixture-filler"] }), card)).toEqual([]);
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-banish-five-monsters")} ${cites("ecclesia-and-the-dark-dragon", "notes-banish-no-zone")} it can be activated with 5 monsters in the Main Monster Zones, itself included: the monster takes the zone it frees; with no free zone in the End Phase it is placed in the Graveyard, not sent there`, () => {
			const five = onField({ monsters: [card, "fixture-filler", "fixture-filler", "fixture-filler", "fixture-filler"] });
			expect(effectsOffered(five, card)).toEqual([BANISH]);
			const ecclesia = idOf(five, card);
			const done = settle(resolve(playEffect(five, card, BANISH)));
			expect(codes(done, "you", "monster").length).toBe(5);
			expect(done.cards[ecclesia]!.zone).toBe("banished");
			const end = toPhase(done, "end");
			const back = settle(play(end, `apply ${card}`));
			expect(back.cards[ecclesia]!.zone).toBe("graveyard");
			expect(back.delayed).toEqual([]);
			// It was placed there, not sent: its own "sent to the GY" triggers would not see it (nothing was raised).
			expect(back.waiting.filter((waiting) => waiting.card.id === ecclesia)).toEqual([]);
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-banish-face-down")} a card that was turned face-down meanwhile is banished face-down, the monster is Special Summoned, and it comes back face-down in Defense Position`, () => {
			const log: string[] = [];
			const start = board8(log, { monsters: [card], deck: ["fixture-albaz"] }, { hand: ["fixture-flip-all"] }, {}, "rival");
			const ecclesia = idOf(start, card);
			const chained = playEffect(play(start, "pass"), card, BANISH);
			const done = settle(resolve(play(chained, "activate fixture-flip-all")));
			expect(log).toEqual([`flipped ${card}`]);
			expect(done.cards[ecclesia]).toMatchObject({ zone: "banished", face: "down" });
			expect(find(done, "fixture-albaz").zone).toBe("monster");
			const back = settle(play(toPhase(done, "end"), "pass", `apply ${card}`));
			expect(back.cards[ecclesia]).toMatchObject({ zone: "monster", face: "down", position: "defense" });
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-banish-then-summon")} when it was not banished (it left the field in answer) nothing is Special Summoned`, () => {
			const start = onField({}, { set: ["fixture-trap-destroy"] });
			const chained = playEffect(start, card, BANISH);
			const done = resolve(play(chained, "activate fixture-trap-destroy > ecclesia-and-the-dark-dragon"));
			expect(find(done, card).zone).toBe("graveyard");
			expect(find(done, "fixture-albaz").zone).toBe("deck");
			expect(done.asking).toBeNull();
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "qa-from-graveyard-23215")} it includes a Special Summon from the Graveyard even when the Deck is the only source`, () => {
			expect(playEffect(onField(), card, BANISH).chain[0]!.categories).toEqual(["banish", "special-summon", "summon-from-deck", "summon-from-graveyard"]);
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "banish")} a monster Special Summoned from the Graveyard is one that can be: "Fallen of Albaz" in the Graveyard and a Level 4 monster that names it in the Deck are both on offer`, () => {
			const duel = onField({ deck: ["fixture-mentions-4"], graveyard: ["fixture-albaz"] });
			expect(offered(resolve(playEffect(duel, card, BANISH))).sort()).toEqual(["choose fixture-albaz", "choose fixture-mentions-4"]);
		});
	});

	describe("the second effect: shuffle a Fusion Monster, a card on the field and this card into the Deck", () => {
		it(`${cites("ecclesia-and-the-dark-dragon", "shuffle")} ${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-graveyard")} from the Graveyard it targets 1 Level 8 Fusion Monster of the player's Graveyard or face-up banishment and 1 card on the field, and shuffles them and itself into the Deck: a Fusion Monster to the Extra Deck`, () => {
			const base = inGraveyard([card, "fixture-fusion-8", "fixture-fusion-7", "fixture-synchro-8", "fixture-albaz-a"], { set: ["fixture-activator-trap"] }, ["fixture-fusion-8"], { set: ["fixture-trap"] });
			// One Level 8 Fusion Monster is banished face-up (a target), another face-down (no target); the Level 7 one and the Synchro Monster stay in the Graveyard.
			const duel = banished(banished(base, "you", "fixture-albaz-a", "down"), "you", "fixture-fusion-8", "up");
			// A card on the field of the player's own: a Set Trap.
			expect(effectsOffered(duel, card)).toEqual([SHUFFLE]);
			const labels = offered(duel).filter((label) => label.startsWith(`activate ${card}`));
			expect(new Set(labels.map((label) => label.split(" > ")[1]))).toEqual(new Set(["fixture-fusion-8"]));
			expect(new Set(labels.map((label) => label.split(" > ")[2]!.replace(/ \{.*\}$/, "")))).toEqual(new Set(["fixture-filler", "fixture-big", "fixture-trap", "fixture-activator-trap"]));
			const fusion = idIn(duel, "you", "banished", "fixture-fusion-8");
			const done = resolve(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-big"));
			expect(done.cards[fusion]!.zone).toBe("extra");
			expect(find(done, card).zone).toBe("extra");
			expect(find(done, "fixture-big")).toMatchObject({ zone: "deck", owner: "rival" });
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "shuffle")} a Level 8 Fusion Monster of the Graveyard is a target too, not a Level 7 one, not a Synchro Monster of Level 8, not a card of the opponent's Graveyard`, () => {
			const duel = inGraveyard([card, "fixture-fusion-8", "fixture-fusion-7", "fixture-synchro-8"], {}, ["fixture-fusion-8"]);
			const labels = offered(duel).filter((label) => label.startsWith(`activate ${card} > `));
			expect(new Set(labels.map((label) => label.split(" > ")[1]))).toEqual(new Set(["fixture-fusion-8"]));
			const mine = idIn(duel, "you", "graveyard", "fixture-fusion-8");
			const done = resolve(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-big"));
			expect(done.cards[mine]!.zone).toBe("extra");
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-fusion-8"]);
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-all-or-nothing")} when this card is no longer in the Graveyard at resolution nothing is shuffled`, () => {
			const duel = inGraveyard(undefined, { set: ["fixture-gy-banish-all"] });
			const done = resolve(play(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-big"), "activate fixture-gy-banish-all"));
			expect(find(done, card).zone).toBe("banished");
			expect(find(done, "fixture-big").zone).toBe("monster");
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-all-or-nothing")} when one of the targets is no longer there at resolution nothing is shuffled: not the other target, not this card`, () => {
			const duel = inGraveyard(undefined, { set: ["fixture-trap-destroy"] });
			const done = resolve(play(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-big"), "activate fixture-trap-destroy > fixture-big"));
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("graveyard");
			expect(find(done, "fixture-fusion-8").zone).toBe("graveyard");
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-face-down")} a monster of the field that was turned face-down meanwhile is shuffled all the same`, () => {
			const log: string[] = [];
			const duel = inGraveyard(undefined, { set: ["fixture-flip-all"] }, [], {}, log);
			const done = resolve(play(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-big"), "activate fixture-flip-all"));
			expect(log).toEqual(["flipped fixture-filler,fixture-big"]);
			expect(find(done, "fixture-big")).toMatchObject({ zone: "deck", owner: "rival" });
			expect(find(done, "fixture-fusion-8").zone).toBe("extra");
			expect(find(done, card).zone).toBe("extra");
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-unaffected")} a target that is unaffected by the effect stays, and the others are shuffled`, () => {
			const duel = inGraveyard(undefined, { monsters: ["fixture-unaffected"] });
			const done = resolve(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-unaffected"));
			expect(find(done, "fixture-unaffected").zone).toBe("monster");
			expect(find(done, "fixture-fusion-8").zone).toBe("extra");
			expect(find(done, card).zone).toBe("extra");
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-set-card-activated")} when a Set Normal Trap it targeted is activated in the same Chain, so that it cannot be returned, nothing is done for the Fusion Monster and this card either`, () => {
			const duel = inGraveyard(undefined, { set: ["fixture-activator-trap"] });
			const control = resolve(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-activator-trap"));
			expect([find(control, "fixture-activator-trap").zone, find(control, "fixture-fusion-8").zone, find(control, card).zone]).toEqual(["deck", "extra", "extra"]);
			const done = resolve(play(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "fixture-activator-trap"), "activate fixture-activator-trap"));
			expect(find(done, "fixture-fusion-8").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("graveyard");
		});
		it(`${cites("ecclesia-and-the-dark-dragon", "notes-shuffle-set-card-activated")} the real Set "The Fallen & The Virtuous" (a Quick-Play Spell) targeted and then activated in the same Chain cannot be returned: nothing is done for the Fusion Monster and this card either`, () => {
			const rival = { monsters: ["fixture-big"], set: ["the-fallen-and-the-virtuous"], extra: ["fixture-albaz-a"] };
			const duel = inGraveyard(undefined, rival);
			const chained = playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "the-fallen-and-the-virtuous");
			const done = resolve(play(chained, "activate the-fallen-and-the-virtuous ~ fixture-albaz-a > fixture-big"));
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(find(done, "the-fallen-and-the-virtuous").zone).toBe("graveyard");
			expect(find(done, "fixture-fusion-8").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("graveyard");
			// Control: left alone, the Set card is shuffled with the rest.
			const control = resolve(playEffect(duel, card, SHUFFLE, "fixture-fusion-8", "the-fallen-and-the-virtuous"));
			expect([find(control, "the-fallen-and-the-virtuous").zone, find(control, "fixture-fusion-8").zone, find(control, card).zone]).toEqual(["deck", "extra", "extra"]);
		});
	});

	describe("each effect once per turn", () => {
		it(`${cites("ecclesia-and-the-dark-dragon", "once")} each effect of the name can be used once a turn: a second copy cannot use the effect that was used, and the other effect is not used up`, () => {
			const duel = board8([], { monsters: [card, card], graveyard: [card, card, "fixture-fusion-8"], deck: ["fixture-albaz"] }, { monsters: ["fixture-big"] });
			expect(effectsOffered(duel, card)).toEqual([BANISH, SHUFFLE]);
			const first = settle(resolve(playEffect(duel, card, BANISH)));
			// The effect of the field is used up; the effect of the Graveyard is not.
			expect(effectsOffered(untilOffered(first, `activate ${card} > fixture-fusion-8 > fixture-big`), card)).toEqual([SHUFFLE]);
			const second = resolve(playEffect(untilOffered(first, `activate ${card} > fixture-fusion-8 > fixture-big`), card, SHUFFLE, "fixture-fusion-8", "fixture-big"));
			expect(effectsOffered(untilOffered(second, "pass"), card)).toEqual([]);
		});
	});

	it(`${cites("ecclesia-and-the-dark-dragon", "facts")} counts as an "Ecclesia" monster for the cards that read the archetype: "The Dragon that Devours the Dogma" gains 500 ATK while it is in the Graveyard or face-up on the field`, () => {
		const without = board8([], { monsters: ["the-dragon-that-devours-the-dogma"] });
		expect(atk(without, idOf(without, "the-dragon-that-devours-the-dogma"))).toBe(3000);
		const inGy = board8([], { monsters: ["the-dragon-that-devours-the-dogma"], graveyard: [card] });
		expect(atk(inGy, idOf(inGy, "the-dragon-that-devours-the-dogma"))).toBe(3500);
		const onTheField = board8([], { monsters: ["the-dragon-that-devours-the-dogma", card] });
		expect(atk(onTheField, idOf(onTheField, "the-dragon-that-devours-the-dogma"))).toBe(3500);
	});
});
