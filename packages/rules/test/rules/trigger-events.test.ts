import { describe, expect, it } from "vitest";
import { type CardDef, cites, HIDDEN, moveCards, targetsOf, viewFor } from "../../src";
import { codes, offered, play, position } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

/**
 * A Trigger Effect knows what triggered it: `EffectContext.triggered` (for its cost and targets) and `Link.triggered` (for its
 * operation) hold the events that met its condition. Deep-Eyes White Dragon, the Blue Abyss: "If ... is sent to your GY: You can
 * target 1 of them in the GY". Made-up cards with the same wording.
 */
describe("a Trigger Effect reads the events that triggered it", () => {
	it(`${cites("rules", "trigger-targets-one-of-them")} "target 1 of them": only the monster whose sending triggered the effect can be targeted, not another one already in the GY`, () => {
		const log: string[] = [];
		const duel = position({ defs: gapCards(log), you: { hand: ["fixture-abyss", "fixture-bury"], monsters: ["fixture-white"], graveyard: ["fixture-white-b"] } });
		const sent = play(duel, "activate fixture-bury > fixture-white");
		expect(offered(sent)).toEqual(["activate fixture-abyss > fixture-white", "pass"]);
		const done = play(sent, "activate fixture-abyss > fixture-white");
		expect(log).toEqual(["fixture-abyss after fixture-white > fixture-white"]);
		expect(codes(done, "you", "monster")).toEqual(["fixture-abyss"]);
	});
	it(`${cites("rules", "trigger-targets-one-of-them")} monsters sent at the same time are all "them": each can be targeted, and the link keeps both events`, () => {
		const log: string[] = [];
		const duel = position({ defs: gapCards(log), you: { hand: ["fixture-abyss", "fixture-bury-all"], monsters: ["fixture-white", "fixture-white-b", "fixture-plain"], graveyard: ["fixture-white-c"] } });
		const sent = play(duel, "activate fixture-bury-all");
		expect(offered(sent)).toEqual(["activate fixture-abyss > fixture-white", "activate fixture-abyss > fixture-white-b", "pass"]);
		play(sent, "activate fixture-abyss > fixture-white-b");
		expect(log).toEqual(["fixture-abyss after fixture-white+fixture-white-b > fixture-white-b"]);
	});
	it(`${cites("rules", "trigger-from-gy-needs-card-there-first")} from the GY the card must already be there when the monster is sent: sent at the same time, it does not trigger`, () => {
		const first = position({ defs: gapCards(), you: { hand: ["fixture-bury"], monsters: ["fixture-white"], graveyard: ["fixture-abyss"] } });
		expect(offered(play(first, "activate fixture-bury > fixture-white"))).toEqual(["activate fixture-abyss > fixture-white", "pass"]);
		const together = position({ defs: gapCards(), you: { hand: ["fixture-bury-all"], monsters: ["fixture-abyss", "fixture-white"] } });
		const sent = play(together, "activate fixture-bury-all");
		expect(sent.building).toBeNull();
		expect(offered(sent).filter((name) => name.includes("fixture-abyss"))).toEqual([]);
	});
	it("the bot's view masks a hidden card inside the events a trigger on the chain carries", () => {
		// The opponent's card added from their Deck to their hand is hidden from you, also inside the events kept for your trigger.
		const duel = position({ defs: gapCards(), turn: "rival", options: { everyWindow: true }, you: { monsters: ["fixture-watcher"] }, rival: { hand: ["fixture-fetch"], deck: ["fixture-plain"] } });
		const chained = play(duel, "activate fixture-fetch", "pass", "pass", "activate fixture-watcher");
		const codeIn = (board: typeof chained) => board.chain[board.chain.length - 1]!.triggered!.map((event) => (event.type === "added-to-hand" ? event.card.code : "?"));
		expect(codeIn(chained)).toEqual(["fixture-plain"]);
		expect(codeIn(viewFor(chained, "you").duel)).toEqual([HIDDEN]);
		expect(codeIn(viewFor(chained, "rival").duel)).toEqual(["fixture-plain"]);
	});
});

/** Review: an "each time" effect waiting once per occurrence is activated for the occurrence the player chose. */
describe("an \"each time\" Trigger Effect waiting for two occurrences", () => {
	const WHITE = "Fixture White Dragon";
	const cards = (log: string[]): Record<string, CardDef> => ({
		...gapCards(log),
		// 'Each time a "Fixture White Dragon" is sent to your GY: You can target 1 of them; [log].' (on the field)
		"fixture-counter": {
			code: "fixture-counter",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{
					type: "trigger",
					timing: "if",
					each: true,
					event: (duel, event, { player }) => event.type === "moved" && event.after.zone === "graveyard" && event.before.zone !== "graveyard" && event.after.owner === player && duel.defs[event.after.code]?.facts?.name === WHITE,
					target: (duel, ctx) => (ctx.triggered ?? []).flatMap((event) => (event.type === "moved" && duel.cards[event.after.id]!.zone === "graveyard" ? [event.after.id] : [])),
					operation: (duel, link) => (log.push(`fixture-counter after ${(link.triggered ?? []).map((event) => (event.type === "moved" ? event.after.code : "?")).join("+")} > ${targetsOf(duel, link).map((card) => card.code).join("+")}`), duel),
				},
			],
		},
		// A Quick-Play Spell: "Send 1 monster you control to the GY, then send 1 monster you control to the GY" (two occurrences).
		"fixture-bury-twice": { code: "fixture-bury-twice", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => [0, 1].reduce((next) => moveCards(next, next.piles[link.player].monster.slice(0, 1), { zone: "graveyard" }), duel) }] },
	});
	it(`${cites("rules", "each-time-counts-events")} each activation carries the events and the targets of its own occurrence, whichever is chosen first`, () => {
		for (const [first, second] of [["fixture-white", "fixture-white-b"], ["fixture-white-b", "fixture-white"]] as const) {
			const log: string[] = [];
			const duel = position({ defs: cards(log), you: { hand: ["fixture-bury-twice"], monsters: ["fixture-white", "fixture-white-b"], faceupSpells: ["fixture-counter"] } });
			const sent = play(duel, "activate fixture-bury-twice");
			expect(offered(sent)).toEqual(["activate fixture-counter > fixture-white", "activate fixture-counter > fixture-white-b", "pass"]);
			const one = play(sent, `activate fixture-counter > ${first}`);
			expect(offered(one)).toEqual([`activate fixture-counter > ${second}`, "pass"]);
			play(one, `activate fixture-counter > ${second}`);
			// The chain resolves backwards: the second activation first.
			expect(log).toEqual([`fixture-counter after ${second} > ${second}`, `fixture-counter after ${first} > ${first}`]);
		}
	});
});
