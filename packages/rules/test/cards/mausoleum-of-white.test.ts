import { describe, expect, it } from "vitest";
import { atk, CARD_DEFS, type CardDef, cites, def, type Duel, destroyCard, effectDestruction, moveCard, targetsOf } from "../../src";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { summonExtrasCards } from "../rules/summon-extras-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "mausoleum-of-white";
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	// A Quick-Play Spell: "Target 1 monster on the field; banish it", and one that destroys the Field Spell ("Destroy 1 Field Spell on the field").
	"fixture-banisher": { code: "fixture-banisher", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => targetsOf(duel, link).reduce((board, target) => moveCard(board, target.id, { zone: "banished", effect: link }), duel) }] },
	// "Your opponent cannot banish cards from your GY."
	"fixture-warden": { code: "fixture-warden", kind: "monster", facts: { name: "Test Warden", level: 4, atk: 0, def: 0 }, effects: [{ type: "continuous", modifies: (_duel, source) => [{ kind: "lock", what: "banish-from-graveyard", who: source.controller, banisher: "opponent" }] }] },
	"fixture-field-breaker": { code: "fixture-field-breaker", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => { const id = [...duel.piles.you.field, ...duel.piles.rival.field][0]; return id === undefined ? duel : destroyCard(duel, id, { destruction: effectDestruction(link) }); } }] },
};
// The made-up Normal Summon permits of the rules tests (a second effect that gives an additional Normal Summon) beside the real cards.
const extras = summonExtrasCards();
const defs: Record<string, CardDef> = { ...extras, ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("summon") || label.startsWith("set "));
const activations = (duel: Duel) => offered(duel).filter((label) => label.startsWith(`activate ${card}`));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
/** Passes until the turn `by` turns later begins (1: the opponent's next turn, 2: your next one). */
const nextTurn = (duel: Duel, by = 2): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};

describe("Mausoleum of White, written as effect records", () => {
	it(`${cites("ash-blossom-joyous-spring", "text")} answers the send-and-gain effect, which includes sending from the Deck even with only a Normal Monster in hand (YGOProJudge lead for the hand-only case)`, () => {
		const start = board({ hand: ["blue-eyes-white-dragon"], monsters: ["effect-veiler"], faceupSpells: [card] }, { hand: ["ash-blossom-joyous-spring"] }, { everyWindow: true });
		const chained = play(start, `activate ${card} > effect-veiler`);
		expect(offered(chained)).toContain("activate ash-blossom-joyous-spring");
		const stopped = play(chained, "activate ash-blossom-joyous-spring", "pass", "pass");
		expect(codes(stopped, "you", "hand")).toEqual(["blue-eyes-white-dragon"]);
		expect(atk(stopped, stopped.piles.you.monster[0]!)).toBe(0);
	});
	it(`${cites("mausoleum-of-white", "extra-summon")} lets its controller Normal Summon 1 Level 1 LIGHT Tuner in addition to the Normal Summon/Set: that kind of monster only, as a Normal Summon and never a Set`, () => {
		const start = board({ hand: ["effect-veiler", "fixture-light-1", "fixture-dark-tuner", "fixture-normal-4"], faceupSpells: [card] });
		expect(summons(start)).toEqual([
			"set effect-veiler", "set fixture-dark-tuner", "set fixture-light-1", "set fixture-normal-4",
			"summon effect-veiler", "summon effect-veiler additional", "summon fixture-dark-tuner", "summon fixture-light-1", "summon fixture-normal-4",
		]);
		// Used after the turn's Normal Summon: still there; the additional Summon is not a Set.
		const after = play(start, "summon fixture-normal-4");
		expect(summons(after)).toEqual(["summon effect-veiler additional"]);
		// Activated from the hand, the Field Spell gives it at once.
		const fromHand = board({ hand: [card, "effect-veiler"] });
		expect(summons(fromHand)).not.toContain("summon effect-veiler additional");
		expect(summons(play(fromHand, `activate ${card}`))).toContain("summon effect-veiler additional");
		// The Level is the printed Level: a Level 2 Tuner is not one.
		expect(summons(board({ hand: ["fixture-normal-4"], faceupSpells: [card] }))).not.toContain("summon fixture-normal-4 additional");
	});
	it(`${cites("mausoleum-of-white", "gain-once")} gives only one additional Normal Summon in all each turn: another such effect gives no second one (a made-up Field Spell stands for it)`, () => {
		const start = board({ hand: ["effect-veiler", "effect-veiler", "lv3", "lv4"], faceupSpells: [card, "fixture-second-summon-field"] });
		const first = play(start, "summon effect-veiler additional");
		expect(summons(first)).toEqual(["set lv3", "set lv4", "set effect-veiler", "summon lv3", "summon lv4", "summon effect-veiler"].sort());
		expect(first.extraNormalSummoned).toBe(true);
		// A new turn gives it again.
		expect(summons(nextTurn(first))).toContain("summon effect-veiler additional");
	});
	it(`${cites("mausoleum-of-white", "notes-extra-controller-only")} gives nothing to the opponent of the card's controller`, () => {
		const start = board({ hand: ["effect-veiler"] }, { faceupSpells: [card] });
		expect(summons(start)).not.toContain("summon effect-veiler additional");
		// And the controller gets it only in their own Main Phase (the opponent's turn offers no Summon at all).
		expect(summons(board({}, { hand: ["effect-veiler"] }, {}, "rival"))).toEqual(["summon effect-veiler", "set effect-veiler"].sort());
		expect(summons(board({ faceupSpells: [card] }, { hand: ["effect-veiler"] }, {}, "rival"))).toEqual(["summon effect-veiler", "set effect-veiler"].sort());
	});
	it(`${cites("mausoleum-of-white", "notes-extra-order")} ${cites("mausoleum-of-white", "notes-extra-no-chain")} lets the Normal Summon and the additional Summon come in either order, and the additional one starts no chain`, () => {
		const start = board({ hand: ["effect-veiler", "lv4"], faceupSpells: [card] });
		const additionalFirst = play(start, "summon effect-veiler additional");
		expect(additionalFirst.chain).toEqual([]);
		expect(summons(additionalFirst)).toEqual(["set lv4", "summon lv4"]);
		const both = play(additionalFirst, "summon lv4");
		expect(codes(both, "you", "monster")).toEqual(["effect-veiler", "lv4"]);
		// The other way round.
		const normalFirst = play(board({ hand: ["effect-veiler", "effect-veiler", "lv4"], faceupSpells: [card] }), "summon lv4", "summon effect-veiler additional");
		expect(normalFirst.chain).toEqual([]);
		expect(codes(normalFirst, "you", "monster")).toEqual(["lv4", "effect-veiler"]);
	});
	it(`${cites("mausoleum-of-white", "send-gain")} ${cites("mausoleum-of-white", "notes-send-gain")} targets 1 face-up monster you control, sends 1 Normal Monster from the hand or Deck to the GY (your choice), and the target gains ATK and DEF equal to that monster's Level x 100 until the end of the turn`, () => {
		const start = board({ hand: ["fixture-normal-6", "fixture-effect-4"], deck: ["fixture-normal-4", "fixture-effect-4"], monsters: ["fixture-effect-4", "fixture-light-1"], faceupSpells: [card] }, { monsters: ["fixture-other-dragon"] });
		// Only your own face-up monsters can be targeted.
		expect(activations(start)).toEqual([`activate ${card} > fixture-effect-4`, `activate ${card} > fixture-light-1`]);
		const asked = play(start, `activate ${card} > fixture-effect-4`);
		// The Normal Monsters of the hand and the Deck are the choices: not an Effect Monster.
		expect(offered(asked)).toEqual(["choose fixture-normal-4", "choose fixture-normal-6"]);
		const done = play(asked, "choose fixture-normal-6");
		const target = done.piles.you.monster[0]!;
		expect([atk(done, target), def(done, target)]).toEqual([1600, 1600]);
		expect(codes(done, "you", "graveyard")).toEqual(["fixture-normal-6"]);
		// The other monsters are not changed; the gain ends with the turn.
		expect(atk(done, done.piles.you.monster[1]!)).toBe(0);
		const later = nextTurn(done, 1);
		expect([atk(later, target), def(later, target)]).toEqual([1000, 1000]);
		// The Level counted is the Level of the monster sent: the Deck's Level 4 gives 400.
		const small = play(asked, "choose fixture-normal-4");
		expect([atk(small, target), def(small, target)]).toEqual([1400, 1400]);
	});
	it(`${cites("mausoleum-of-white", "notes-send-gain-activation")} can be activated only with a Normal Monster in the hand or Deck and a face-up monster you control, in your own Main Phase`, () => {
		const monsters = ["fixture-effect-4"];
		expect(activations(board({ hand: ["fixture-effect-4"], deck: ["fixture-effect-4"], monsters, faceupSpells: [card] }))).toEqual([]);
		expect(activations(board({ deck: ["fixture-normal-4"], monsters, faceupSpells: [card] }))).toEqual([`activate ${card} > fixture-effect-4`]);
		expect(activations(board({ hand: ["fixture-normal-4"], faceupSpells: [card] }))).toEqual([]);
		expect(activations(board({ hand: ["fixture-normal-4"], facedown: ["fixture-effect-4"], faceupSpells: [card] }))).toEqual([]);
		const rivalTurn = board({ hand: ["fixture-normal-4"], monsters, faceupSpells: [card] }, {}, {}, "rival");
		expect(activations(rivalTurn)).toEqual([]);
		// The other player cannot use it either: their own Field Spell is theirs.
		expect(activations(board({}, { hand: ["fixture-normal-4"], monsters, faceupSpells: [card] }))).toEqual([]);
	});
	it(`${cites("mausoleum-of-white", "once")} can be used once per turn per copy`, () => {
		const start = board({ hand: ["fixture-normal-4", "fixture-normal-6"], monsters: ["fixture-effect-4"], faceupSpells: [card] });
		const used = play(start, `activate ${card} > fixture-effect-4`, "choose fixture-normal-4");
		expect(activations(used)).toEqual([]);
		expect(activations(nextTurn(used))).toEqual([`activate ${card} > fixture-effect-4`]);
	});
	it(`${cites("mausoleum-of-white", "notes-send-even-if-target-gone")} still sends the Normal Monster when the target is no longer face-up on the field when it resolves, and nothing is gained`, () => {
		const start = board({ hand: ["fixture-normal-6"], monsters: ["fixture-effect-4"], faceupSpells: [card] }, { set: ["fixture-banisher"] }, { everyWindow: true });
		// The opponent has priority after the activation (every window is offered).
		const chained = play(start, `activate ${card} > fixture-effect-4`);
		const answered = play(chained, "activate fixture-banisher > fixture-effect-4", "pass", "pass");
		// The only Normal Monster is sent without asking, though its target was banished in response.
		expect(answered.asking).toBeNull();
		expect(codes(answered, "you", "banished")).toEqual(["fixture-effect-4"]);
		expect(codes(answered, "you", "graveyard")).toEqual(["fixture-normal-6"]);
		expect(codes(answered, "you", "monster")).toEqual([]);
	});
	it(`${cites("mausoleum-of-white", "notes-nothing-if-card-gone")} does nothing at all when this card is no longer face-up in the Field Zone when it resolves: the Normal Monster stays where it was`, () => {
		const start = board({ hand: ["fixture-normal-6"], monsters: ["fixture-effect-4"], faceupSpells: [card] }, { set: ["fixture-field-breaker"] }, { everyWindow: true });
		const chained = play(start, `activate ${card} > fixture-effect-4`);
		const done = play(chained, "activate fixture-field-breaker", "pass", "pass");
		expect(done.asking).toBeNull();
		expect(codes(done, "you", "hand")).toEqual(["fixture-normal-6"]);
		expect(atk(done, done.piles.you.monster[0]!)).toBe(1000);
	});
	it(`${cites("mausoleum-of-white", "notes-stats-stay")} keeps the gain when this card leaves the field afterwards, in the same turn`, () => {
		const start = board({ hand: ["fixture-normal-6"], monsters: ["fixture-effect-4"], faceupSpells: [card] }, { set: ["fixture-field-breaker"] }, { everyWindow: true });
		// The only Normal Monster is taken without asking.
		const resolved = play(start, `activate ${card} > fixture-effect-4`, "pass", "pass");
		expect(atk(resolved, resolved.piles.you.monster[0]!)).toBe(1600);
		const broken = play(resolved, "pass", "activate fixture-field-breaker", "pass", "pass");
		expect(codes(broken, "you", "field")).toEqual([]);
		expect(atk(broken, broken.piles.you.monster[0]!)).toBe(1600);
	});
	it(`${cites("mausoleum-of-white", "qa-normal-monster-leaves-gy")} keeps the gain when the Normal Monster that was sent no longer is in the Graveyard (Konami's Japanese Q&A, OCG only)`, () => {
		const start = board({ hand: ["fixture-normal-6"], monsters: ["fixture-effect-4"], faceupSpells: [card] });
		const done = play(start, `activate ${card} > fixture-effect-4`);
		const target = done.piles.you.monster[0]!;
		const gone = moveCard(done, find(done, "fixture-normal-6").id, { zone: "monster", face: "up" });
		expect(codes(gone, "you", "graveyard")).toEqual([]);
		expect(atk(gone, target)).toBe(1600);
	});
	it(`${cites("mausoleum-of-white", "gy-search")} ${cites("mausoleum-of-white", "notes-gy")} banishes itself from the GY as its cost, then adds 1 "Burst Stream of Destruction" from the Deck to the hand: an effect that starts a Chain Link in the Graveyard, in your own Main Phase`, () => {
		const start = board({ graveyard: [card], deck: ["fixture-burst-stream", "fixture-roar", "fixture-burst-stream"] }, {}, { everyWindow: true });
		expect(activations(start)).toEqual([`activate ${card}`]);
		const chained = play(start, `activate ${card}`);
		expect(chained.chain.map((link) => [link.card.code, link.card.zone])).toEqual([[card, "graveyard"]]);
		expect(codes(chained, "you", "banished")).toEqual([card]);
		const done = play(chained, "pass", "pass", "choose fixture-burst-stream");
		expect(codes(done, "you", "hand")).toEqual(["fixture-burst-stream"]);
		expect(codes(done, "you", "deck").sort()).toEqual(["fixture-burst-stream", "fixture-roar"]);
		// Not without one in the Deck, not in the opponent's turn (in the hand it is the Field Spell's own activation, not this effect).
		expect(activations(board({ graveyard: [card], deck: ["fixture-roar"] }))).toEqual([]);
		expect(activations(board({ graveyard: [card], deck: ["fixture-burst-stream"] }, {}, {}, "rival"))).toEqual([]);
	});
	it("its owner banishes it as the cost, which \"your opponent cannot banish cards from your GY\" does not stop", () => {
		const start = board({ graveyard: [card], monsters: ["fixture-warden"], deck: ["fixture-burst-stream"] });
		expect(activations(start)).toEqual([`activate ${card}`]);
		expect(codes(play(start, `activate ${card}`), "you", "banished")).toEqual([card]);
	});
});
