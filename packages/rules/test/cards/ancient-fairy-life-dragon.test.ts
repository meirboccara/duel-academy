import { describe, expect, it } from "vitest";
import { ask, askSpecialSummon, CARD_DEFS, type CardDef, cites, destroyCard, type Duel, effectDestruction, moveCards, other, printedFacts, targetsOf } from "../../src";
import { attackCards } from "../rules/attack-fixtures";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "ancient-fairy-life-dragon";
const attackFixtures = attackCards();
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...extraDeckFixtures,
	...Object.fromEntries(["fixture-silence", "fixture-3500", "huge"].map((code) => [code, attackFixtures[code]!])),
	// A Trap: "When an opponent's monster declares an attack: Destroy the attacking monster."
	"fixture-armor": { code: "fixture-armor", kind: "trap", effects: [{ type: "activation", event: (_duel, event) => event.type === "attack-declared", operation: (duel, link) => (duel.battle ? destroyCard(duel, duel.battle.attacker.id, { destruction: effectDestruction(link) }) : duel) }] },
	// A Trap: "When an opponent's monster declares an attack: Destroy all your opponent's Attack Position monsters."
	"fixture-mirror": {
		code: "fixture-mirror",
		kind: "trap",
		effects: [{ type: "activation", event: (_duel, event) => event.type === "attack-declared", condition: (duel, { player }) => duel.piles[other(player)].monster.some((id) => duel.cards[id]!.position === "attack"), operation: (duel, link) => moveCards(duel, duel.piles[other(link.player)].monster.filter((id) => duel.cards[id]!.position === "attack"), { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) }) }],
	},
	// A Spell: "Special Summon 1 monster from your Extra Deck" (not a Synchro Summon).
	"fixture-extra-revive": { code: "fixture-extra-revive", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].extra, (board, picked) => askSpecialSummon(board, link.player, picked)) }] },
	// A Quick-Play Spell: "Target 1 Spell/Trap on the field; destroy it."
	"fixture-spell-smite": {
		code: "fixture-spell-smite",
		kind: "quick-play",
		effects: [{ type: "activation", target: (duel) => [...duel.piles.you.spell, ...duel.piles.rival.spell], operation: (duel, link) => targetsOf(duel, link).reduce((next, target) => destroyCard(next, target.id, { destruction: effectDestruction(link) }), duel) }],
	},
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, phase: Duel["turn"]["phase"] = "main1") => position({ defs, options, you, rival, phase });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
/** The player Synchro Summons the card with a Level 3 Tuner and a Level 5 monster. */
const summoned = (you: SideSpec = {}, rival: SideSpec = {}): Duel => {
	const start = board({ monsters: ["fixture-tuner-3", "fixture-plain-5"], extra: [card], ...you }, rival, { everyWindow: true });
	return play(start, `special-summon ${card}`, "place 5", "pass", "pass");
};
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));

describe("Ancient Fairy Life Dragon, written as effect records", () => {
	it(`${cites("ancient-fairy-life-dragon", "facts")} is a LIGHT Dragon Synchro Effect Monster of Level 8 with 2500 ATK and 3300 DEF, that mentions "Ancient Fairy Dragon", "World of Spirits" and "Eternal Sunshine"`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({
			name: "Ancient Fairy Life Dragon",
			attribute: "LIGHT",
			monsterType: "Dragon",
			frame: "synchro",
			level: 8,
			atk: 2500,
			def: 3300,
			mentions: ["Ancient Fairy Dragon", "World of Spirits", "Eternal Sunshine", "Ancient Fairy Life Dragon"],
		});
	});

	describe("its Synchro Summon", () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		it(`${cites("ancient-fairy-life-dragon", "procedure")} needs 1 Tuner and 1 or more non-Tuner monsters whose Levels add up to 8, and sends them to the Graveyard`, () => {
			// 3 + 5 = 8, and 2 + 3 + 3 = 8 with two non-Tuners.
			const one = board({ monsters: ["fixture-tuner-3", "fixture-plain-5"], extra: [card] });
			expect(summons(one)).toEqual([`special-summon ${card}`]);
			const several = board({ monsters: ["fixture-tuner-2", "fixture-plain-3", "fixture-plain-3"], extra: [card] });
			expect(summons(several)).toEqual([`special-summon ${card}`]);
			const done = play(one, `special-summon ${card}`, "place 5");
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-plain-5", "fixture-tuner-3"]);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
		});
		it(`${cites("ancient-fairy-life-dragon", "procedure")} is not offered with no Tuner, with two Tuners, or when the Levels do not add up to 8`, () => {
			expect(summons(board({ monsters: ["fixture-plain-4", "fixture-plain-4"], extra: [card] }))).toEqual([]);
			expect(summons(board({ monsters: ["fixture-tuner-2", "fixture-tuner-3", "fixture-plain-3"], extra: [card] }))).toEqual([]);
			expect(summons(board({ monsters: ["fixture-tuner-3", "fixture-plain-4"], extra: [card] }))).toEqual([]);
			expect(summons(board({ monsters: ["fixture-tuner-3"], extra: [card] }))).toEqual([]);
		});
	});

	describe("its Synchro Summon effect", () => {
		it(`${cites("ancient-fairy-life-dragon", "draw")} ${cites("ancient-fairy-life-dragon", "notes-draw")} ${cites("ancient-fairy-life-dragon", "notes-trigger")} draws 1 card when it is Synchro Summoned, as an optional Trigger Effect of the Monster Zone`, () => {
			const duel = summoned({ deck: ["fixture-plain-1", "fixture-plain-2"] });
			expect(own(duel, `activate ${card}`)).toEqual([`activate ${card}`]);
			const done = settle(play(duel, `activate ${card}`));
			expect(codes(done, "you", "hand")).toEqual(["fixture-plain-1"]);
		});
		it(`${cites("ancient-fairy-life-dragon", "draw")} is not offered when it is Special Summoned by an effect that is not a Synchro Summon, nor from the Deck to draw with none`, () => {
			const start = board({ hand: ["fixture-extra-revive"], extra: [card], deck: ["fixture-plain-1"] }, {}, { everyWindow: true });
			const effect = settle(play(start, "activate fixture-extra-revive"));
			expect(find(effect, card)).toMatchObject({ zone: "monster", face: "up" });
			expect(own(effect, `activate ${card}`)).toEqual([]);
			// Synchro Summoned with an empty Deck: drawing would lose the Duel, so the effect is not offered.
			expect(own(summoned({ deck: [] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("ancient-fairy-life-dragon", "search")} ${cites("ancient-fairy-life-dragon", "notes-search-world")} adds a LIGHT Beast, Plant or Fairy monster or "Eternal Sunshine" from the Deck instead of drawing, when "World of Spirits" is on the field, the card chosen when it resolves`, () => {
			const deck = ["fixture-plain-1", "fixture-light-beast", "fixture-light-plant", "fixture-light-fairy", "fixture-eternal-sunshine", "fixture-dark-beast", "fixture-light-dragon", "fixture-light-warrior"];
			const duel = summoned({ deck, faceupSpells: ["fixture-world-of-spirits"] });
			const asked = play(duel, `activate ${card}`, "pass", "pass");
			expect(offered(asked)).toEqual(["choose fixture-eternal-sunshine", "choose fixture-light-beast", "choose fixture-light-fairy", "choose fixture-light-plant"]);
			const done = play(asked, "choose fixture-light-plant");
			// Nothing was drawn.
			expect(codes(done, "you", "hand")).toEqual(["fixture-light-plant"]);
		});
		it(`${cites("ancient-fairy-life-dragon", "search")} ${cites("ancient-fairy-life-dragon", "notes-search-world")} reads "World of Spirits" on either player's field, face-up`, () => {
			const deck = ["fixture-plain-1", "fixture-eternal-sunshine"];
			const theirs = settle(play(summoned({ deck }, { faceupSpells: ["fixture-world-of-spirits"] }), `activate ${card}`, "pass", "pass"));
			expect(codes(theirs, "you", "hand")).toEqual(["fixture-eternal-sunshine"]);
			// A "World of Spirits" that is Set has no name: the card draws.
			const set = summoned({ deck, set: ["fixture-world-of-spirits"] });
			expect(codes(settle(play(set, `activate ${card}`, "pass", "pass")), "you", "hand")).toEqual(["fixture-plain-1"]);
		});
		it(`${cites("ancient-fairy-life-dragon", "search")} ${cites("ancient-fairy-life-dragon", "notes-search-world")} is not offered with "World of Spirits" on the field and nothing to add, although a card could be drawn`, () => {
			expect(own(summoned({ deck: ["fixture-plain-1"], faceupSpells: ["fixture-world-of-spirits"] }), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("ancient-fairy-life-dragon", "notes-search-world")} reads "World of Spirits" when the effect resolves: gone by then, it draws instead of adding`, () => {
			const deck = ["fixture-plain-1", "fixture-eternal-sunshine"];
			const duel = summoned({ deck, faceupSpells: ["fixture-world-of-spirits"] }, { set: ["fixture-spell-smite"] });
			const chained = play(duel, `activate ${card}`);
			// The opponent destroys "World of Spirits" in response (Chain Link 2): it is gone when this effect resolves.
			const done = settle(play(chained, "activate fixture-spell-smite > fixture-world-of-spirits"));
			expect(codes(done, "you", "hand")).toEqual(["fixture-plain-1"]);
		});
		it(`${cites("ancient-fairy-life-dragon", "once")} can be used once per turn, by name`, () => {
			const duel = summoned({ deck: ["fixture-plain-1", "fixture-plain-2"] });
			const done = settle(play(duel, `activate ${card}`));
			expect(own(done, `activate ${card}`)).toEqual([]);
		});
	});

	describe("its Continuous Effect", () => {
		it(`${cites("ancient-fairy-life-dragon", "defense")} ${cites("ancient-fairy-life-dragon", "notes-continuous")} lets "Ancient Fairy Dragon" and the monsters that mention it attack in face-up Defense Position, itself included, and not other monsters`, () => {
			const start = board({ monsters: [card], defense: ["fixture-ancient-fairy-dragon", "fixture-mentions-ancient-fairy-dragon", "fixture-bystander"] }, { monsters: ["fixture-plain-2"] }, {}, "battle");
			expect(attacks(start)).toEqual([`attack ${card} > fixture-plain-2`, "attack fixture-ancient-fairy-dragon > fixture-plain-2", "attack fixture-mentions-ancient-fairy-dragon > fixture-plain-2"].sort());
			// The card itself in Defense Position.
			const itself = board({ defense: [card] }, { monsters: ["fixture-plain-2"] }, {}, "battle");
			expect(attacks(itself)).toEqual([`attack ${card} > fixture-plain-2`]);
		});
		it(`${cites("ancient-fairy-life-dragon", "defense")} reaches only the controller's monsters and applies only while the card is face-up in the Monster Zone`, () => {
			// The opponent's "Ancient Fairy Dragon" in Defense Position cannot attack on their turn.
			const theirs = position({ defs, you: { monsters: [card] }, rival: { defense: ["fixture-ancient-fairy-dragon"] }, phase: "battle", turn: "rival" });
			expect(attacks(theirs)).toEqual([]);
			const hand = board({ hand: [card], defense: ["fixture-ancient-fairy-dragon"] }, { monsters: ["fixture-plain-2"] }, {}, "battle");
			expect(attacks(hand)).toEqual([]);
		});
	});

	describe("attacking in Defense Position", () => {
		const every = { everyWindow: true };
		const battle = (you: SideSpec, rival: SideSpec = {}) => board(you, rival, every, "battle");
		it(`${cites("ancient-fairy-life-dragon", "qa-damage")} uses its DEF as its ATK for the damage calculation: the controller of the lower value takes the difference as battle damage, and the lower monster is destroyed (Konami's Q&A fid 24407)`, () => {
			// DEF 3300 against ATK 3500 in Attack Position: 200 battle damage to the player, and the card is destroyed.
			const lost = play(position({ defs, phase: "battle", you: { defense: [card] }, rival: { monsters: ["fixture-3500"] } }), `attack ${card} > fixture-3500`);
			expect([lost.lp.you, lost.lp.rival, codes(lost, "you", "graveyard"), codes(lost, "rival", "monster")]).toEqual([8000 - 200, 8000, [card], ["fixture-3500"]]);
			// Against 3000 ATK it wins, in Defense Position still.
			const won = play(position({ defs, phase: "battle", you: { defense: [card] }, rival: { monsters: ["huge"] } }), `attack ${card} > huge`);
			expect([won.lp.rival, won.lp.you, codes(won, "rival", "graveyard"), find(won, card).position]).toEqual([8000 - 300, 8000, ["huge"], "defense"]);
		});
		it(`${cites("ancient-fairy-life-dragon", "qa-negated")} loses its permission before the Damage Step: it can no longer attack, the attack ends with no Damage Step; negated in the Damage Step before damage calculation: no damage calculation, the Damage Step ends (Konami's Q&A fid 23968)`, () => {
			const start = battle({ defense: [card] }, { monsters: ["huge"], set: ["fixture-silence"] });
			const stopped = play(start, `attack ${card} > huge`, "pass", `activate fixture-silence > ${card}`, "pass", "pass", "pass", "pass");
			expect([stopped.battle, stopped.lp, codes(stopped, "rival", "monster"), attacks(stopped)]).toEqual([null, { you: 8000, rival: 8000 }, ["huge"], []]);
			const inStep = toStep(play(start, `attack ${card} > huge`), "start");
			const ended = toStep(play(inStep, "pass", `activate fixture-silence > ${card}`), null);
			expect([ended.lp, codes(ended, "rival", "monster"), codes(ended, "you", "monster")]).toEqual([{ you: 8000, rival: 8000 }, ["huge"], [card]]);
		});
		it(`${cites("ancient-fairy-life-dragon", "qa-attacker")} is an attacking monster even in Defense Position: a Trap that destroys the attacking monster destroys it, and one that destroys Attack Position monsters does not, nor can it be activated with only Defense Position monsters (Konami's Q&A fid 14252)`, () => {
			const armor = play(battle({ defense: [card] }, { set: ["fixture-armor"] }), `attack ${card} directly`, "pass");
			expect(offered(armor)).toContain("activate fixture-armor");
			expect(codes(play(armor, "activate fixture-armor", "pass", "pass"), "you", "graveyard")).toEqual([card]);
			// "Mirror Force" with only Defense Position monsters on the attacker's side cannot be activated; with an Attack Position one it destroys only that one.
			const none = play(battle({ defense: [card] }, { set: ["fixture-mirror"] }), `attack ${card} directly`, "pass");
			expect(offered(none)).not.toContain("activate fixture-mirror");
			const some = play(battle({ defense: [card], monsters: ["fixture-plain-2"] }, { set: ["fixture-mirror"] }), `attack ${card} directly`, "pass");
			expect(offered(some)).toContain("activate fixture-mirror");
			const done = play(some, "activate fixture-mirror", "pass", "pass");
			expect(codes(done, "you", "graveyard")).toEqual(["fixture-plain-2"]);
			expect(find(done, card).zone).toBe("monster");
		});
	});
});
