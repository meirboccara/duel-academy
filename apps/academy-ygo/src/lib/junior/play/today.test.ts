import { describe, expect, it } from "vitest";
import { islandTrainer } from "../world/trainers";
import { buildWorld } from "../world/world";
import type { Move } from "@duel-academy/engine";
import { levelById, levelsOf, WORLD_IDS } from "./levels";
import { play, next, start, type Session } from "./session";

/** The island of today's duels: each lesson is solved by its idea, and not without it. */
function run(session: Session, moves: readonly Move[]): Session {
	let current = session;
	const rival = () => {
		while (current.status === "rival") current = next(current);
	};
	rival();
	for (const move of moves) {
		current = play(current, move);
		rival();
	}
	return current;
}
const level = (id: string) => {
	const found = levelById(id);
	if (!found) throw new Error(id);
	return found;
};
const pass: Move = { type: "pass" };

describe("the island of today's duels", () => {
	it("comes right before the final duel, with ten lessons", () => {
		expect(WORLD_IDS.indexOf("today")).toBe(WORLD_IDS.indexOf("final") - 1);
		expect(levelsOf("today").map((item) => item.id)).toEqual(["td-sage", "td-stone", "td-ash", "td-ogre", "td-solemn", "td-jammer", "td-droll", "td-arrows", "td-spider", "td-pendulum"]);
	});
	it("has its place on the map, one stop per lesson, and Playmaker giving Ash Blossom", () => {
		const island = buildWorld().islands.find((item) => item.world === "today");
		expect(island?.stops.map((stop) => stop.levelId)).toEqual(levelsOf("today").map((item) => item.id));
		expect(islandTrainer("today", null)).toEqual({ trainers: ["playmaker"], cards: ["ash-blossom-joyous-spring"] });
	});
	it.each(["td-ash", "td-ogre", "td-droll", "td-jammer"])("%s fails when the hand trap or Counter Trap is kept", (id) => {
		/* Every moment to answer is let go: Nox may search twice, so Droll is offered twice. */
		let done = run(start(level(id)), []);
		for (let tries = 0; tries < 5 && done.status === "answer"; tries++) done = run(done, [pass]);
		expect(done.status).toBe("failed");
	});
	it("td-solemn: without the Counter Trap, Ash Blossom stops the search and the duel cannot be won", () => {
		const done = run(start(level("td-solemn")), [{ type: "place", card: "reinforcement-of-the-army", row: "backrow", zone: 1, pick: "elemental-hero-sparkman" }, pass]);
		expect(done.board.you.hand).not.toContain("elemental-hero-sparkman");
		expect(done.status).not.toBe("solved");
	});
	it("td-arrows: using Link Spider as a material leaves too little ATK to win", () => {
		const moves: Move[] = [{ type: "extra", card: "gaia-saber-the-lightning-shadow", materials: [0, 2, 5] }, { type: "phase", to: "battle" }, { type: "attack", attacker: 5, target: "direct" }, { type: "attack", attacker: 3, target: "direct" }];
		const done = run(start(level("td-arrows")), moves);
		expect(done.status).not.toBe("solved");
		expect(done.board.rival.lp).toBeGreaterThan(0);
	});
	it("td-pendulum: without the Pendulum Monster from the Extra Deck, the attack falls short", () => {
		const moves: Move[] = [
			{ type: "place", card: "mandragon", row: "backrow", zone: 0 },
			{ type: "place", card: "dragong", row: "backrow", zone: 4 },
			{ type: "pendulum", cards: ["storm-stag"] },
			{ type: "phase", to: "battle" },
			{ type: "attack", attacker: 0, target: "direct" },
		];
		const done = run(start(level("td-pendulum")), moves);
		expect(done.board.rival.lp).toBe(1800);
		expect(done.status).not.toBe("solved");
	});
	it("td-sage: without the search, there is nothing to send and no Blue-Eyes", () => {
		const moves: Move[] = [{ type: "place", card: "sage-with-eyes-of-blue", row: "monsters", zone: 0 }, { type: "phase", to: "battle" }, { type: "attack", attacker: 0, target: "direct" }];
		const done = run(start(level("td-sage")), moves);
		expect(done.status).not.toBe("solved");
		expect(done.board.rival.lp).toBe(3000);
	});
	it("td-stone: Ancient Rules finds no Blue-Eyes in the hand before The White Stone is sent", () => {
		const done = run(start(level("td-stone")), [{ type: "place", card: "ancient-rules", row: "backrow", zone: 1, pick: "blue-eyes-white-dragon" }]);
		expect(done.rejected).not.toBeNull();
	});
	it("td-arrows: attacking with everything, without the Link Summon, falls short", () => {
		const moves: Move[] = [{ type: "phase", to: "battle" }, ...[0, 2, 3, 5].map((attacker): Move => ({ type: "attack", attacker, target: "direct" }))];
		const done = run(start(level("td-arrows")), moves);
		expect(done.board.rival.lp).toBe(3600 - 2900);
		expect(done.status).not.toBe("solved");
	});
	it("td-spider: without Link Spider's effect, two attacks are not enough", () => {
		const moves: Move[] = [{ type: "place", card: "lantern-owl", row: "monsters", zone: 0 }, { type: "phase", to: "battle" }, { type: "attack", attacker: 0, target: "direct" }, { type: "attack", attacker: 5, target: "direct" }];
		const done = run(start(level("td-spider")), moves);
		expect(done.board.rival.lp).toBe(4500 - 2800);
		expect(done.status).not.toBe("solved");
	});
});
