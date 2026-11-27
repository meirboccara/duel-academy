import { describe, expect, it } from "vitest";
import {
	act,
	BLUE_EYES_746021_OPENERS,
	BLUE_EYES_746021_PLAN,
	decide,
	decider,
	type DeckPlan,
	type Duel,
	type Level,
	type OpenerPlan,
	type Progress,
	SKY_STRIKER_745443_OPENERS,
	SKY_STRIKER_745443_PLAN,
} from "../../src";
import { codes, play, position, REAL_CARDS } from "../rules/fixtures";

const still = () => 0;
const ASH = "ash-blossom-joyous-spring";

/** A rival's move made right after the bot's decision number `after` (0-based), then every player passes until the bot acts again. */
interface Interruption {
	readonly after: number;
	readonly move: string;
}

/** Passes for whoever must answer until the bot ("you") has a decision: the rival never answers, and "you" lets a chain resolve. */
function settleForYou(duel: Duel): Duel {
	for (let guard = 0; guard < 20; guard++) {
		const who = decider(duel);
		if (who === null || duel.asking) return duel;
		if (who === "you" && duel.chain.length === 0) return duel;
		duel = act(duel, { type: "pass" });
	}
	return duel;
}

/** The bot's next `count` decisions on a positioned real-card duel, as the app would ask them: plan and progress handed back each time. */
function follow(duel: Duel, plan: DeckPlan, level: Level, count: number, interruption?: Interruption): { names: string[]; vias: string[]; duel: Duel; progress: Progress | null } {
	const names: string[] = [];
	const vias: string[] = [];
	let progress: Progress | null = null;
	for (let i = 0; i < count; i++) {
		while (decider(duel) === "rival") duel = act(duel, { type: "pass" });
		const decision = decide(duel, "you", { level, plan, progress, seed: 1, now: still });
		names.push(decision.name);
		vias.push(decision.via);
		progress = decision.progress;
		duel = act(duel, decision.action);
		if (interruption?.after === i) duel = settleForYou(play(duel, interruption.move));
	}
	return { names, vias, duel, progress };
}

const opener = (openers: readonly OpenerPlan[], name: string): OpenerPlan => {
	const found = openers.find((entry) => entry.name === name);
	if (!found) throw new Error(`no opener ${name}`);
	return found;
};
const line = (entry: OpenerPlan, name: string): readonly string[] => {
	const found = entry.plan.lines.find((candidate) => candidate.name === name);
	if (!found) throw new Error(`no line ${name} in ${entry.name}`);
	return found.steps;
};

/** Follows `steps` decisions and checks the bot played exactly those names, each as a step of a line (or as the only move). */
function expectLine(duel: Duel, entry: OpenerPlan, level: Level, steps: readonly string[], interruption?: Interruption): Duel {
	const done = follow(duel, entry.plan, level, steps.length, interruption);
	expect(done.names).toEqual(steps);
	expect(done.vias.every((via) => via === "line" || via === "quick")).toBe(true);
	return done.duel;
}

const sorted = (duel: Duel, zone: "monster" | "spell" | "hand" | "graveyard" | "banished") => [...codes(duel, "you", zone)].sort();

describe("combo data for the exact lists, followed through decide and act on real cards", () => {
	describe("the data", () => {
		const all = [...BLUE_EYES_746021_OPENERS, ...SKY_STRIKER_745443_OPENERS];
		it("keeps the two first openers' plans as the decks' plans", () => {
			expect(BLUE_EYES_746021_PLAN).toBe(BLUE_EYES_746021_OPENERS[0]!.plan);
			expect(SKY_STRIKER_745443_PLAN).toBe(SKY_STRIKER_745443_OPENERS[0]!.plan);
		});
		it("starts every alternative with its opener's main step, so strong can switch to it from the main line", () => {
			for (const entry of all) for (const alternative of entry.plan.lines.slice(1)) expect(alternative.steps[0], `${entry.name} / ${alternative.name}`).toBe(entry.plan.lines[0]!.steps[0]);
		});
		it("gives unique opener and line names", () => {
			expect(new Set(all.map((entry) => entry.name)).size).toBe(all.length);
			for (const entry of all) expect(new Set(entry.plan.lines.map((candidate) => candidate.name)).size).toBe(entry.plan.lines.length);
		});
	});

	describe("Blue-Eyes 746021", () => {
		describe("Primite Lordly Lode + Maiden of White", () => {
			const entry = opener(BLUE_EYES_746021_OPENERS, "lode-maiden");
			const start = (rival: string[] = []) =>
				position({
					defs: REAL_CARDS,
					you: { hand: [...entry.hand], deck: ["primite-dragon-ether-beryl", "primite-drillbeam", "true-light", "blue-eyes-white-dragon", "blue-eyes-white-dragon"], extra: ["blue-eyes-spirit-dragon"] },
					rival: { hand: rival, deck: ["normal-4"] },
				});

			it("medium follows the main line to its end: Blue-Eyes Spirit Dragon, a Blue-Eyes White Dragon back by True Light, Beryl and a Set Drillbeam", () => {
				const duel = expectLine(start(), entry, "medium", entry.plan.lines[0]!.steps);
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-spirit-dragon", "blue-eyes-white-dragon", "primite-dragon-ether-beryl"]);
				expect(sorted(duel, "spell")).toEqual(["primite-drillbeam", "primite-lordly-lode", "true-light"]);
			});

			it("strong goes on with Maiden and the Lode's Summon when Ash Blossom negates the Lode's search", () => {
				const duel = expectLine(start([ASH]), entry, "strong", line(entry, "maiden after a negated lode"), { after: 0, move: `activate ${ASH}` });
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-spirit-dragon", "blue-eyes-white-dragon"]);
				expect(sorted(duel, "hand")).toEqual([]);
			});

			it("strong sends the dragon with Beryl and revives it with True Light when Ash Blossom negates the Lode's Summon", () => {
				const duel = expectLine(start([ASH]), entry, "strong", line(entry, "beryl after a negated lode summon"), { after: 4, move: `activate ${ASH}` });
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-spirit-dragon"]);
				expect(sorted(duel, "spell")).toEqual(["primite-drillbeam", "primite-lordly-lode", "true-light"]);
			});

			it("medium has no alternative: the main line is dropped and play goes on greedily", () => {
				const { vias } = follow(start([ASH]), entry.plan, "medium", 2, { after: 0, move: `activate ${ASH}` });
				expect(vias[1]).toBe("greedy");
			});
		});

		describe("Wishes for Eyes of Blue + Blue-Eyes White Dragon + Sage with Eyes of Blue", () => {
			const entry = opener(BLUE_EYES_746021_OPENERS, "wishes-dragon-sage");
			const start = (rival: string[] = []) =>
				position({
					defs: REAL_CARDS,
					you: {
						hand: [...entry.hand],
						deck: ["maiden-of-white", "sage-with-eyes-of-blue", "true-light", "roar-of-the-blue-eyed-dragons", "blue-eyes-white-dragon", "mausoleum-of-white"],
						extra: ["blue-eyes-tyrant-dragon", "neo-blue-eyes-ultimate-dragon", "blue-eyes-spirit-dragon", "spirit-with-eyes-of-blue"],
					},
					rival: { hand: rival, deck: ["normal-4"] },
				});

			it("medium follows the main line to its end: Tyrant by its own procedure, then Spirit with Eyes of Blue adds Mausoleum and brings the dragon back", () => {
				const duel = expectLine(start(), entry, "medium", entry.plan.lines[0]!.steps);
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-tyrant-dragon", "blue-eyes-white-dragon"]);
				expect(sorted(duel, "hand")).toEqual(["mausoleum-of-white", "sage-with-eyes-of-blue"]);
				expect(sorted(duel, "banished")).toEqual(["wishes-for-eyes-of-blue"]);
			});

			it("strong lets Spirit with Eyes of Blue send Mausoleum when Droll & Lock Bird stops the adds from the Deck", () => {
				const duel = expectLine(start(["droll-lock-bird"]), entry, "strong", line(entry, "spirit sends mausoleum under droll"), { after: 2, move: "activate droll-lock-bird" });
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-tyrant-dragon", "blue-eyes-white-dragon"]);
				expect(codes(duel, "you", "graveyard")).toContain("mausoleum-of-white");
			});

			it("strong Normal Summons Sage for Maiden when Ash Blossom negates Wishes, and still makes Tyrant", () => {
				const duel = expectLine(start([ASH]), entry, "strong", line(entry, "sage after a negated wishes"), { after: 0, move: `activate ${ASH}` });
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-tyrant-dragon", "maiden-of-white", "sage-with-eyes-of-blue"]);
			});
		});

		describe("Sage with Eyes of Blue x2", () => {
			const entry = opener(BLUE_EYES_746021_OPENERS, "sage-sage");
			const start = (rival: string[] = []) =>
				position({
					defs: REAL_CARDS,
					you: { hand: [...entry.hand], deck: ["maiden-of-white", "sage-with-eyes-of-blue", "true-light", "blue-eyes-white-dragon", "blue-eyes-white-dragon"], extra: ["blue-eyes-spirit-dragon"] },
					rival: { hand: rival, deck: ["normal-4"] },
				});

			it("medium follows the main line to its end: Blue-Eyes Spirit Dragon and a Blue-Eyes White Dragon under True Light", () => {
				const duel = expectLine(start(), entry, "medium", entry.plan.lines[0]!.steps);
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-spirit-dragon", "blue-eyes-white-dragon"]);
				expect(sorted(duel, "spell")).toEqual(["true-light"]);
			});

			it("strong discards the second Sage for a Blue-Eyes White Dragon when Ash Blossom negates the search", () => {
				const duel = expectLine(start([ASH]), entry, "strong", line(entry, "second sage after a negated search"), { after: 1, move: `activate ${ASH}` });
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-white-dragon"]);
			});

			it("strong takes the same alternative when Infinite Impermanence negates the Normal Summoned Sage", () => {
				const duel = expectLine(start(["infinite-impermanence"]), entry, "strong", line(entry, "second sage after a negated search"), { after: 1, move: "activate infinite-impermanence > sage-with-eyes-of-blue" });
				expect(sorted(duel, "monster")).toEqual(["blue-eyes-white-dragon"]);
			});
		});
	});

	describe("Sky Striker 745443", () => {
		const extra = ["sky-striker-ace-zero", "sky-striker-ace-kagari", "sky-striker-ace-hayate", "sky-striker-ace-shizuku"];
		const deck = ["sky-striker-ace-raye", "sky-striker-ace-roze", "sky-striker-mecha-widow-anchor"];

		describe("Sky Striker Mobilize - Engage! + Sky Striker Ace - Raye", () => {
			const entry = opener(SKY_STRIKER_745443_OPENERS, "engage-raye");
			const start = (rival: string[] = []) => position({ defs: REAL_CARDS, you: { hand: [...entry.hand], deck, extra }, rival: { hand: rival, deck: ["normal-4"] } });

			it("medium follows the main line to its end: Roze joins Raye, Zero takes Engage back from the GY, and Engage adds Raye again", () => {
				const duel = expectLine(start(), entry, "medium", entry.plan.lines[0]!.steps);
				expect(codes(duel, "you", "monster")).toEqual(["sky-striker-ace-zero"]);
				expect(sorted(duel, "hand")).toEqual(["sky-striker-ace-raye"]);
			});

			it("strong goes through Raye, Kagari, Shizuku, Roze and Zero when Ash Blossom negates Engage", () => {
				const duel = expectLine(start([ASH]), entry, "strong", line(entry, "kagari after a negated engage"), { after: 0, move: `activate ${ASH}` });
				expect(codes(duel, "you", "monster")).toEqual(["sky-striker-ace-zero"]);
				expect(sorted(duel, "hand")).toEqual(["sky-striker-ace-raye"]);
			});
		});

		describe("Sky Striker Mobilize - Engage! alone", () => {
			const entry = opener(SKY_STRIKER_745443_OPENERS, "engage");
			const start = (rival: string[] = []) => position({ defs: REAL_CARDS, you: { hand: [...entry.hand], deck, extra }, rival: { hand: rival, deck: ["normal-4"] } });

			it("medium follows the main line to its end: Raye, Kagari takes Engage back, Shizuku, Roze, Zero, and a last Engage", () => {
				const duel = expectLine(start(), entry, "medium", entry.plan.lines[0]!.steps);
				expect(codes(duel, "you", "monster")).toEqual(["sky-striker-ace-zero"]);
				expect(sorted(duel, "hand")).toEqual(["sky-striker-mecha-widow-anchor"]);
			});

			it("strong Link Summons Hayate from Kagari when Droll & Lock Bird stops Engage", () => {
				const duel = expectLine(start(["droll-lock-bird"]), entry, "strong", line(entry, "hayate when engage cannot go on"), { after: 1, move: "activate droll-lock-bird" });
				expect(codes(duel, "you", "monster")).toEqual(["sky-striker-ace-hayate"]);
				expect(sorted(duel, "hand")).toEqual(["sky-striker-mobilize-engage"]);
			});

			it("strong takes the same alternative when Effect Veiler negates Kagari's effect", () => {
				const duel = expectLine(start(["effect-veiler"]), entry, "strong", line(entry, "hayate when engage cannot go on"), { after: 6, move: "activate effect-veiler > sky-striker-ace-kagari" });
				expect(codes(duel, "you", "monster")).toEqual(["sky-striker-ace-hayate"]);
				expect(sorted(duel, "hand")).toEqual([]);
			});
		});
	});
});
