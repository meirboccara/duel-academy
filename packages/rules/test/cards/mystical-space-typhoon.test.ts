import { describe, expect, it } from "vitest";
import { cardsIn, cites } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play, position, REAL_CARDS as defs, recordCards } from "../rules/fixtures";
import { activations, board } from "./sky-striker-fixtures";

const options = { everyWindow: true };
const card = "mystical-space-typhoon";

describe("Mystical Space Typhoon, written as an effect record", () => {
	it(`${cites("mystical-space-typhoon", "facts")} is a Quick-Play Spell`, () => {
		expect(defs[card]!.kind).toBe("quick-play");
	});
	it(`${cites("mystical-space-typhoon", "text")} targets 1 Spell/Trap on the field, of either player`, () => {
		const start = position({ defs, options, you: { hand: [card], set: ["terraforming"] }, rival: { set: ["umi", "needlebug-nest"] } });
		expect(offered(start)).toEqual([`activate ${card} > needlebug-nest`, `activate ${card} > terraforming`, `activate ${card} > umi`, "pass", `set ${card}`]);
		expect(offered(position({ defs, options, you: { hand: [card] } }))).toEqual(["pass", `set ${card}`]);
	});
	it(`${cites("mystical-space-typhoon", "notes-targets")} can target a face-down card as well as a face-up one, and the Field Spell`, () => {
		const start = position({ defs, options, you: { hand: [card], set: ["terraforming"], faceupSpells: ["mulcharmy-purulia"] }, rival: { set: ["umi"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual([`activate ${card} > mulcharmy-purulia`, `activate ${card} > terraforming`, `activate ${card} > umi`]);
	});
	it(`${cites("mystical-space-typhoon", "notes-not-itself")} ${cites("mystical-space-typhoon", "qa-not-itself")} cannot target itself, from the hand or Set on the field`, () => {
		const fromHand = position({ defs, options, you: { hand: [card], set: ["terraforming"] } });
		expect(offered(fromHand)).toEqual([`activate ${card} > terraforming`, "pass", `set ${card}`]);
		// Set on an earlier turn and activated from the field: its own card is still not a candidate, the other Set card is.
		const fromField = position({ defs, options, you: { set: [card, "terraforming"] } });
		expect(offered(fromField).filter((label) => label.startsWith("activate"))).toEqual([`activate ${card} > terraforming`]);
	});
	it(`${cites("mystical-space-typhoon", "notes-needs-another-card")} cannot be activated when it is the only card in the Spell & Trap Zones`, () => {
		expect(offered(position({ defs, options, you: { set: [card] } }))).toEqual(["pass"]);
		expect(offered(position({ defs, options, you: { hand: [card] } }))).toEqual(["pass", `set ${card}`]);
	});
	it(`${cites("mystical-space-typhoon", "notes-no-damage-step")} is not activated in the Damage Step, but is in the Battle Step before it`, () => {
		const rival = board({ set: [card, "fixture-trap"] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle");
		const declared = play(rival, "attack fixture-filler directly");
		expect(activations(play(declared, "pass"), card)).toEqual([`activate ${card} > fixture-trap`]);
		const damage = toStep(declared, "start");
		const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
		expect(mine.battle?.step).toBe("start");
		expect(activations(mine, card)).toEqual([]);
	});
	it(`${cites("mystical-space-typhoon", "text")} destroys the target when it resolves`, () => {
		const start = position({ defs, options, you: { hand: [card] }, rival: { set: ["umi"] } });
		const targeted = play(start, `activate ${card} > umi`);
		expect(targeted.chain[0]!.targets).toEqual([cardsIn(start, "rival", "field")[0]!.id]);
		const done = play(targeted, "pass", "pass");
		expect(codes(done, "rival", "graveyard")).toEqual(["umi"]);
		expect(codes(done, "you", "graveyard")).toEqual([card]);
	});
	it(`${cites("mystical-space-typhoon", "text")} does nothing when its target is no longer on the field`, () => {
		// The rival's own Mystical Space Typhoon, answering, destroys the Set card that yours was aimed at.
		const start = position({ defs, options, you: { hand: [card] }, rival: { set: [card, "umi"] } });
		const mine = play(start, `activate ${card} > umi`, `activate ${card} > umi`, "pass", "pass");
		expect(codes(mine, "rival", "graveyard")).toEqual(["umi", card]);
		expect(codes(mine, "you", "graveyard")).toEqual([card]);
	});
	// The core reads "that target" as the card chosen: one that left and came back is a new card (step 1's `moves`). No Konami page
	// found speaks of this case.
	it("leaves alone a target that left the field and came back as a new card (a core reading of that target, no Konami record)", () => {
		const start = position({ defs: { ...defs, ...recordCards() }, options, you: { hand: [card] }, rival: { set: ["reset-backrow", "umi"] } });
		const done = play(start, `activate ${card} > umi`, "activate reset-backrow", "pass", "pass");
		expect(codes(done, "rival", "field")).toEqual(["umi"]);
		expect(codes(done, "rival", "graveyard")).toEqual(["reset-backrow"]);
	});
});
