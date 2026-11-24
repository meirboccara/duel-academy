import { describe, expect, it } from "vitest";
import { type CardDef, cites, type Duel, moveCard, negateActivation } from "../../src";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";

const card = "lightning-storm";
/** The two modes, as the test fixtures name them (`:0` destroys Attack Position monsters, `:1` Spells and Traps). */
const monsters = `activate ${card} :0`;
const backrow = `activate ${card} :1`;
const activations = (duel: Duel) => [...new Set(offered(duel).filter((label) => label.startsWith(`activate ${card}`)))];

/**
 * Made-up cards around it: a Trap the rival can Set and chain ("trap-a"), a Quick-Play Spell the rival chains that Special Summons a
 * face-up monster to your field ("gift"), a Pendulum Monster ("scale-4"), a Field Spell ("umi"), and a Counter Trap that negates the
 * activation it is chained to ("negate-it").
 */
const defs: Record<string, CardDef> = {
	...REAL_CARDS,
	"trap-a": { code: "trap-a", kind: "trap", effects: [{ type: "activation", operation: (duel) => duel }] },
	gift: { code: "gift", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => (duel.piles.rival.hand[0] === undefined ? duel : moveCard(duel, duel.piles.rival.hand[0], { zone: "monster", face: "up", controller: "you" })) }] },
	"scale-4": { code: "scale-4", kind: "monster", facts: { level: 4, pendulum: { scale: 4 } }, effects: [{ type: "activation", operation: (duel) => duel }] },
	"negate-it": { code: "negate-it", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateActivation(duel, index - 1) }] },
};

describe("Lightning Storm, written as an effect record", () => {
	it(`${cites("lightning-storm", "text")} can be activated only while its controller controls no face-up card (face-down cards do not count)`, () => {
		const rival = { monsters: ["normal-4"], set: ["trap-a"] };
		expect(activations(position({ defs, you: { hand: [card], facedown: ["normal-4-b"], set: ["trap-a"] }, rival }))).toEqual([monsters, backrow]);
		expect(activations(position({ defs, you: { hand: [card], monsters: ["normal-4-b"] }, rival }))).toEqual([]);
		expect(activations(position({ defs, you: { hand: [card], faceupSpells: ["trap-a"] }, rival }))).toEqual([]);
		// Set, it is face-down too: it can be activated from there.
		expect(activations(position({ defs, you: { set: [card] }, rival }))).toEqual([monsters, backrow]);
	});
	it(`${cites("lightning-storm", "text")} first effect: destroys all Attack Position monsters the opponent controls, and no Defense Position or face-down one`, () => {
		const start = position({ defs, you: { hand: [card] }, rival: { monsters: ["normal-4", "effect-4"], defense: ["normal-4-b"], facedown: ["normal-6"] } });
		const done = play(start, monsters);
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["effect-4", "normal-4"]);
		expect(codes(done, "rival", "monster").sort()).toEqual(["normal-4-b", "normal-6"]);
		expect(codes(done, "you", "graveyard")).toEqual([card]);
	});
	it(`${cites("lightning-storm", "text")} second effect: destroys all Spells and Traps the opponent controls, face-down ones and the Field Spell included; a Pendulum Monster in a Pendulum Zone too (YGOProJudge's answer only, asked 2026-11-24, no source cited)`, () => {
		const start = position({ defs, you: { hand: [card] }, rival: { monsters: ["normal-4"], set: ["trap-a", "umi"], faceupSpells: ["scale-4"] } });
		// The rival may answer with their Set Trap; they pass.
		const done = play(start, backrow, "pass");
		expect(codes(done, "rival", "spell")).toEqual([]);
		expect(codes(done, "rival", "field")).toEqual([]);
		expect(codes(done, "rival", "monster")).toEqual(["normal-4"]);
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["trap-a", "umi"]);
		// A Pendulum Monster leaving the field goes face-up to the Extra Deck.
		expect(codes(done, "rival", "extra")).toEqual(["scale-4"]);
	});
	it(`${cites("lightning-storm", "text")} only 1 Lightning Storm can be activated per turn; one whose activation was negated gives the use back`, () => {
		const rival = { monsters: ["normal-4", "normal-4-b"] };
		const once = play(position({ defs, you: { hand: [card, card] }, rival }), monsters);
		expect(codes(once, "rival", "monster")).toEqual([]);
		expect(activations(position({ defs, you: { hand: [card, card] }, rival: { ...rival, set: [] } }))).toEqual([monsters]);
		// The second copy is not offered once the first was activated this turn (the rival's monsters put back so that it would have a target).
		const refilled = play(position({ defs, you: { hand: [card, card] }, rival: { monsters: ["normal-4", "normal-4-b", "effect-4"] } }), monsters);
		expect(activations(refilled)).toEqual([]);
		const negated = play(position({ defs, options: { everyWindow: true }, you: { hand: [card, card] }, rival: { ...rival, set: ["negate-it"] } }), monsters, "activate negate-it", "pass", "pass");
		expect(negated.chain).toEqual([]);
		expect(codes(negated, "rival", "monster").sort()).toEqual(["normal-4", "normal-4-b"]);
		expect(activations({ ...negated, priority: { holder: "you", passed: [], open: true } })).toEqual([monsters]);
	});
	it(`${cites("lightning-storm", "notes-mode")} one effect is chosen when it is activated and it resolves as that effect; an effect with nothing to destroy cannot be chosen (YGOProJudge's answer only, asked 2026-11-24, no source cited)`, () => {
		const both = position({ defs, options: { everyWindow: true }, you: { hand: [card] }, rival: { monsters: ["normal-4"], set: ["trap-a"] } });
		const activated = play(both, backrow);
		expect(activated.chain[0]).toMatchObject({ mode: 1, categories: ["destroy"] });
		const done = play(activated, "pass", "pass");
		expect(codes(done, "rival", "monster")).toEqual(["normal-4"]);
		expect(codes(done, "rival", "graveyard")).toEqual(["trap-a"]);
		expect(activations(position({ defs, you: { hand: [card] }, rival: { defense: ["normal-4"], set: ["trap-a"] } }))).toEqual([backrow]);
		expect(activations(position({ defs, you: { hand: [card] }, rival: { monsters: ["normal-4"] } }))).toEqual([monsters]);
		expect(activations(position({ defs, you: { hand: [card] }, rival: { defense: ["normal-4"] } }))).toEqual([]);
	});
	it("is not checked again when it resolves: a face-up card you gain in response does not stop it (YGOProJudge's answer only, asked 2026-11-24, no source cited)", () => {
		const start = position({ defs, options: { everyWindow: true }, you: { hand: [card] }, rival: { monsters: ["normal-4"], set: ["gift"], hand: ["normal-6"] } });
		const done = play(start, monsters, "activate gift", "pass", "pass");
		expect(codes(done, "you", "monster")).toEqual(["normal-6"]);
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["gift", "normal-4"]);
	});
});
