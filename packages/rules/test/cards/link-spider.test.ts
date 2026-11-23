import { describe, expect, it } from "vitest";
import { cardsIn, cites, moveCard } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "link-spider";

describe("Link Spider, written as an effect record", () => {
	it(`${cites("link-spider", "text")} ${cites("rules", "choice-at-resolution")} Special Summons a Level 4 or lower Normal Monster from the hand, the player choosing it when the effect resolves`, () => {
		const start = position({ defs, options, you: { extraZone: [card], hand: ["normal-4", "normal-4-b", "normal-6", "effect-4"] } });
		// The Level 4 or lower monsters of the hand can also be Normal Summoned (step 5).
		expect(offered(start)).toEqual([`activate ${card}`, "pass", "summon effect-4", "summon normal-4", "summon normal-4-b"]);
		const activated = play(start, `activate ${card}`);
		expect(activated.chain[0]!.targets).toEqual([]);
		const asked = play(activated, "pass", "pass");
		// A Level 6 Normal Monster and a Level 4 Effect Monster are not candidates.
		expect(offered(asked)).toEqual(["choose normal-4", "choose normal-4-b"]);
		const done = play(asked, "choose normal-4-b");
		expect(codes(done, "you", "monster").sort()).toEqual([card, "normal-4-b"]);
		expect(codes(done, "you", "hand").sort()).toEqual(["effect-4", "normal-4", "normal-6"]);
	});
	it(`${cites("link-spider", "text")} ${cites("link-spider", "arrow")} ${cites("rules", "link-arrows-co-linked")} Special Summons the monster to the zone its bottom arrow points to, and cannot be activated when that zone is taken or points nowhere`, () => {
		const start = position({ defs, options, you: { extraZone: [card], hand: ["normal-4"] } });
		const done = play(start, `activate ${card}`, "pass", "pass");
		const summoned = cardsIn(done, "you", "monster").find((c) => c.code === "normal-4")!;
		expect(summoned).toMatchObject({ slot: 1, face: "up" });
		const taken = position({ defs, options, you: { extraZone: [card], monsters: ["effect-4", "effect-4"], hand: ["normal-4"] } });
		expect(offered(taken)).not.toContain(`activate ${card}`);
		// In a Main Monster Zone, its bottom arrow points at a Spell & Trap Zone: no zone to Summon to.
		expect(offered(position({ defs, options, you: { monsters: [card], hand: ["normal-4"] } }))).not.toContain(`activate ${card}`);
	});
	// Analogy with search-needs-a-card; no Konami page read for an empty hand.
	it("takes the only candidate and cannot be activated with none", () => {
		const one = position({ defs, options, you: { extraZone: [card], hand: ["normal-4", "normal-6"] } });
		expect(codes(play(one, `activate ${card}`, "pass", "pass"), "you", "monster").sort()).toEqual([card, "normal-4"]);
		expect(offered(position({ defs, options, you: { extraZone: [card], hand: ["normal-6", "effect-4"] } }))).toEqual(["pass", "summon effect-4"]);
	});
	it(`${cites("link-spider", "text")} ${cites("rules", "open-state-only")} is an Ignition Effect: only in its controller's Main Phase, nothing else going on`, () => {
		expect(offered(position({ defs, options, turn: "rival", you: { extraZone: [card], hand: ["normal-4"] } }))).toEqual(["pass"]);
		expect(offered(position({ defs, options, phase: "battle", you: { extraZone: [card], hand: ["normal-4"] } }))).toEqual(["attack link-spider directly", "pass"]);
	});
	it(`${cites("link-spider", "text")} ${cites("rules", "once-instance-wording")} can be used once per turn by each copy`, () => {
		const set = position({ defs, options, you: { extraZone: [card], monsters: [card], hand: ["normal-4", "normal-4-b", "celtic-guardian", "effect-4"] } });
		// The second copy in the other Extra Monster Zone (a board an Extra Link allows), pointing down to your Main Monster Zone 3.
		const start = moveCard(set, set.piles.you.monster.find((id) => set.cards[id]!.slot === 0)!, { zone: "monster", slot: 6 });
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
		const start = position({ defs, options, you: { extraZone: [card], hand: ["normal-4", "normal-4-b"] } });
		const used = play(start, `activate ${card}`, "pass", "pass", "choose normal-4", "pass", "pass");
		const spiders = (duel: typeof start) => offered(duel).filter((label) => label === `activate ${card}`).length;
		expect(spiders(used)).toBe(0);
		const spider = cardsIn(used, "you", "monster").find((c) => c.code === card)!;
		const back = moveCard(moveCard(used, spider.id, { zone: "hand" }), spider.id, { zone: "monster", face: "up", slot: 5 });
		// The zone it points to must be free again: the first Normal Monster moves to another of your zones.
		const freed = moveCard(back, cardsIn(back, "you", "monster").find((c) => c.code === "normal-4")!.id, { zone: "monster", slot: 4 });
		expect(spiders(freed)).toBe(1);
	});
});
