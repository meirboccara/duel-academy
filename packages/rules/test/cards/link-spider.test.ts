import { describe, expect, it } from "vitest";
import { act, type CardDef, cardsIn, cites, legalActions, moveCard } from "../../src";
import { codes, offered, play, position, REAL_CARDS as defs } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "link-spider";

describe("Link Spider, written as an effect record", () => {
	it(`${cites("link-spider", "text")} ${cites("rules", "choice-at-resolution")} Special Summons a Level 4 or lower Normal Monster from the hand, the player choosing it when the effect resolves`, () => {
		const start = position({ defs, options, you: { extraZone: [card], hand: ["normal-4", "normal-4-b", "normal-6", "effect-4"] } });
		// The Level 4 or lower monsters of the hand can also be Normal Summoned (step 5) or Set, the Level 6 one by Tributing Link Spider (step 8).
		expect(offered(start)).toEqual([`activate ${card}`, "pass", "set effect-4", "set normal-4", "set normal-4-b", "set normal-6", "summon effect-4", "summon normal-4", "summon normal-4-b", "summon normal-6"]);
		const activated = play(start, `activate ${card}`);
		expect(activated.chain[0]!.targets).toEqual([]);
		const asked = play(activated, "pass", "pass");
		// A Level 6 Normal Monster and a Level 4 Effect Monster are not candidates.
		expect(offered(asked)).toEqual(["choose normal-4", "choose normal-4-b"]);
		// Then the zone it points to, in face-up Attack or Defense Position (step 8).
		const placing = play(asked, "choose normal-4-b");
		expect(legalActions(placing)).toEqual([{ type: "place", zone: 1, positions: ["attack", "defense"] }]);
		const done = play(placing, "place 1");
		expect(codes(done, "you", "monster").sort()).toEqual([card, "normal-4-b"]);
		expect(codes(done, "you", "hand").sort()).toEqual(["effect-4", "normal-4", "normal-6"]);
	});
	it(`${cites("link-spider", "text")} ${cites("link-spider", "arrow")} ${cites("rules", "link-arrows-co-linked")} Special Summons the monster to the zone its bottom arrow points to, and cannot be activated when that zone is taken or points nowhere`, () => {
		const start = position({ defs, options, you: { extraZone: [card], hand: ["normal-4"] } });
		const done = act(play(start, `activate ${card}`, "pass", "pass"), { type: "place", zone: 1, position: "defense" });
		const summoned = cardsIn(done, "you", "monster").find((c) => c.code === "normal-4")!;
		expect(summoned).toMatchObject({ slot: 1, face: "up", position: "defense" });
		const taken = position({ defs, options, you: { extraZone: [card], monsters: ["effect-4", "effect-4"], hand: ["normal-4"] } });
		expect(offered(taken)).not.toContain(`activate ${card}`);
		// In a Main Monster Zone, its bottom arrow points at a Spell & Trap Zone: no zone to Summon to.
		expect(offered(position({ defs, options, you: { monsters: [card], hand: ["normal-4"] } }))).not.toContain(`activate ${card}`);
	});
	// Analogy with search-needs-a-card; no Konami page read for an empty hand.
	it("takes the only candidate and cannot be activated with none", () => {
		const one = position({ defs, options, you: { extraZone: [card], hand: ["normal-4", "normal-6"] } });
		expect(codes(play(one, `activate ${card}`, "pass", "pass", "place 1"), "you", "monster").sort()).toEqual([card, "normal-4"]);
		expect(offered(position({ defs, options, you: { extraZone: [card], hand: ["normal-6", "effect-4"] } }))).not.toContain(`activate ${card}`);
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
		const placed = (duel: typeof start) => play(duel, `place ${legalActions(duel)[0]!.type === "place" ? (legalActions(duel)[0] as { zone: number }).zone : -1}`, "pass", "pass");
		const once = placed(play(start, `activate ${card}`, "pass", "pass", "choose normal-4"));
		expect(spiders(once)).toBe(1);
		const twice = placed(play(once, `activate ${card}`, "pass", "pass", "choose normal-4-b"));
		expect(spiders(twice)).toBe(0);
		expect(codes(twice, "you", "monster").sort()).toEqual([card, card, "normal-4", "normal-4-b"]);
	});
	it(`${cites("link-spider", "materials")} ${cites("rules", "link-procedure")} is Link Summoned with 1 Normal Monster you control, to an Extra Monster Zone`, () => {
		const start = position({ defs, options, you: { monsters: ["effect-4", "normal-4"], extra: [card] } });
		expect(offered(start)).toContain(`special-summon ${card}`);
		// The Effect Monster is not a material: the Normal Monster is the only one, so only the zone is asked.
		const placing = play(start, `special-summon ${card}`);
		expect(offered(placing)).toEqual(["place 5", "place 6"]);
		const done = play(placing, "place 5", "pass", "pass");
		expect(codes(done, "you", "monster")).toEqual(["effect-4", card]);
		expect(codes(done, "you", "graveyard")).toEqual(["normal-4"]);
		expect(cardsIn(done, "you", "monster").find((c) => c.code === card)).toMatchObject({ slot: 5, position: "attack", proper: true, summonedBy: "link" });
		// With no Normal Monster on your field it is not offered.
		expect(offered(position({ defs, options, you: { monsters: ["effect-4"], extra: [card] } }))).not.toContain(`special-summon ${card}`);
	});
	it(`${cites("link-spider", "text")} ${cites("rules", "negate-summon-built-in-only")} the monster is Summoned by the effect: "when Summoned" cards can answer it, and Solemn Judgment has no Summon to negate`, () => {
		// A made-up Trap worded like Torrential Tribute: "When a monster(s) is Summoned: ...".
		const tribute: CardDef = { code: "tribute", kind: "trap", effects: [{ type: "activation", event: (_duel, event) => event.type === "summoned", operation: (duel) => duel }] };
		const start = position({ defs: { ...defs, tribute }, options, you: { extraZone: [card], hand: ["normal-4"] }, rival: { set: ["solemn-judgment", "tribute"] } });
		const done = play(start, `activate ${card}`, "pass", "pass", "place 1");
		// Torrential Tribute's shape ("when a monster is Summoned") is offered once the rival has priority; Solemn Judgment is not.
		expect(offered(play(done, "pass"))).toEqual(["activate tribute", "pass"]);
	});
	// A Link Spider that left the field and came back is a new card: YGOProJudge (no source cited) says it may use it again.
	it("lets a copy that has become a new card use it again (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs, options, you: { extraZone: [card], hand: ["normal-4", "normal-4-b"] } });
		const used = play(start, `activate ${card}`, "pass", "pass", "choose normal-4", "place 1", "pass", "pass");
		const spiders = (duel: typeof start) => offered(duel).filter((label) => label === `activate ${card}`).length;
		expect(spiders(used)).toBe(0);
		const spider = cardsIn(used, "you", "monster").find((c) => c.code === card)!;
		const back = moveCard(moveCard(used, spider.id, { zone: "hand" }), spider.id, { zone: "monster", face: "up", slot: 5 });
		// The zone it points to must be free again: the first Normal Monster moves to another of your zones.
		const freed = moveCard(back, cardsIn(back, "you", "monster").find((c) => c.code === "normal-4")!.id, { zone: "monster", slot: 4 });
		expect(spiders(freed)).toBe(1);
	});
});
