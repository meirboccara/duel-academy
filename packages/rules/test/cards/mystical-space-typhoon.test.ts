import { describe, expect, it } from "vitest";
import { cardsIn, cites } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs, recordCards } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "mystical-space-typhoon";

describe("Mystical Space Typhoon, written as an effect record", () => {
	it(`${cites("mystical-space-typhoon", "text")} targets 1 Spell/Trap on the field, of either player`, () => {
		const start = position({ defs, options, you: { hand: [card], set: ["terraforming"] }, rival: { set: ["umi", "needlebug-nest"] } });
		expect(offered(start)).toEqual([`activate ${card} > needlebug-nest`, `activate ${card} > terraforming`, `activate ${card} > umi`, "pass", `set ${card}`]);
		expect(offered(position({ defs, options, you: { hand: [card] } }))).toEqual(["pass", `set ${card}`]);
	});
	// The core's reading: the card being activated is not a candidate, and face-down cards are. No Konami page read says either.
	it("cannot target itself and can target a face-down card (no Konami record)", () => {
		const start = position({ defs, options, you: { hand: [card], set: ["terraforming"] } });
		expect(offered(start)).toEqual([`activate ${card} > terraforming`, "pass", `set ${card}`]);
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
