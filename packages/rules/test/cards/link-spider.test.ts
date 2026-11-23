import { describe, expect, it } from "vitest";
import { cardsIn, cites, moveCard } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "link-spider";

describe("Link Spider, written as an effect record", () => {
	it(`${cites("link-spider", "text")} ${cites("rules", "choice-at-resolution")} Special Summons a Level 4 or lower Normal Monster from the hand, the player choosing it when the effect resolves`, () => {
		const start = position({ defs, options, you: { monsters: [card], hand: ["normal-4", "normal-4-b", "normal-6", "effect-4"] } });
		expect(offered(start)).toEqual([`activate ${card}`, "pass"]);
		const activated = play(start, `activate ${card}`);
		expect(activated.chain[0]!.targets).toEqual([]);
		const asked = play(activated, "pass", "pass");
		// A Level 6 Normal Monster and a Level 4 Effect Monster are not candidates.
		expect(offered(asked)).toEqual(["choose normal-4", "choose normal-4-b"]);
		const done = play(asked, "choose normal-4-b");
		expect(codes(done, "you", "monster").sort()).toEqual([card, "normal-4-b"]);
		expect(codes(done, "you", "hand").sort()).toEqual(["effect-4", "normal-4", "normal-6"]);
	});
	// Analogy with search-needs-a-card; no Konami page read for an empty hand.
	it("takes the only candidate and cannot be activated with none", () => {
		const one = position({ defs, options, you: { monsters: [card], hand: ["normal-4", "normal-6"] } });
		expect(codes(play(one, `activate ${card}`, "pass", "pass"), "you", "monster").sort()).toEqual([card, "normal-4"]);
		expect(offered(position({ defs, options, you: { monsters: [card], hand: ["normal-6", "effect-4"] } }))).toEqual(["pass"]);
	});
	it(`${cites("link-spider", "text")} ${cites("rules", "open-state-only")} is an Ignition Effect: only in its controller's Main Phase, nothing else going on`, () => {
		expect(offered(position({ defs, options, turn: "rival", you: { monsters: [card], hand: ["normal-4"] } }))).toEqual(["pass"]);
		expect(offered(position({ defs, options, phase: "battle", you: { monsters: [card], hand: ["normal-4"] } }))).toEqual(["pass"]);
	});
	it(`${cites("link-spider", "text")} ${cites("rules", "once-instance-wording")} can be used once per turn by each copy`, () => {
		const start = position({ defs, options, you: { monsters: [card, card], hand: ["normal-4", "normal-4-b", "celtic-guardian", "effect-4"] } });
		const spiders = (duel: typeof start) => offered(duel).filter((label) => label === `activate ${card}`).length;
		// Each copy has its own use; the chain resolves, then both players pass to open the game state again.
		const once = play(start, `activate ${card}`, "pass", "pass", "choose normal-4", "pass", "pass");
		expect(spiders(once)).toBe(1);
		const twice = play(once, `activate ${card}`, "pass", "pass", "choose normal-4-b", "pass", "pass");
		expect(spiders(twice)).toBe(0);
		expect(codes(twice, "you", "monster").sort()).toEqual([card, card, "normal-4", "normal-4-b"]);
	});
	// A Link Spider that left the field and came back is a new card: YGOProJudge (no source cited) says it may use it again.
	it("lets a copy that has become a new card use it again (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs, options, you: { monsters: [card], hand: ["normal-4", "normal-4-b"] } });
		const used = play(start, `activate ${card}`, "pass", "pass", "choose normal-4", "pass", "pass");
		const spiders = (duel: typeof start) => offered(duel).filter((label) => label === `activate ${card}`).length;
		expect(spiders(used)).toBe(0);
		const spider = cardsIn(used, "you", "monster").find((c) => c.code === card)!;
		const back = moveCard(moveCard(used, spider.id, { zone: "hand" }), spider.id, { zone: "monster", face: "up" });
		expect(spiders(back)).toBe(1);
	});
});
