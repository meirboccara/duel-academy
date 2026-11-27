import { describe, expect, it } from "vitest";
import { act, answerRequest, type BotAnswer, type BotRequest, createDuel, type DuelSetup, legalActions, rebuildDuel, serveBot } from "../../src";
import { REAL_CARDS } from "../rules/fixtures";

/** A Duel the app would keep as its setup (plain data) and the actions played since. */
const setup: Omit<DuelSetup, "defs"> = { seed: 11, you: { deck: ["normal-4", "terraforming", "umi"] }, rival: { deck: ["normal-4", "ash-blossom-joyous-spring"] } };

const playSetup: Omit<DuelSetup, "defs"> = { seed: 11, you: { deck: Array<string>(10).fill("normal-4") }, rival: { deck: Array<string>(10).fill("normal-4") } };

describe("the bot's worker protocol: a request in, an answer out, both plain data", () => {
	it("explicit play lifecycle prepares five-card hands while omitted lifecycle keeps fixtures unchanged", () => {
		const playable = rebuildDuel(playSetup, [], REAL_CARDS, "play");
		expect(playable.piles.you.hand).toHaveLength(5);
		expect(playable.piles.rival.hand).toHaveLength(5);
		expect(playable.piles.you.deck).toHaveLength(5);
		expect(rebuildDuel(playSetup, [], REAL_CARDS).piles.you.hand).toEqual([]);
	});

	it("play requests flow through answerRequest and serveBot, including the turn-two draw, and stay cloneable", () => {
		let duel = rebuildDuel(playSetup, [], REAL_CARDS, "play");
		const actions: BotRequest["actions"][number][] = [];
		for (let guard = 0; guard < 20 && duel.turn.number < 2; guard++) {
			const action = legalActions(duel).find((candidate) => candidate.type === "pass") ?? legalActions(duel)[0]!;
			actions.push(action);
			duel = act(duel, action);
		}
		expect(duel.turn.number).toBe(2);
		expect(duel.piles.rival.hand).toHaveLength(6);
		expect(duel.piles.rival.deck).toHaveLength(4);
		for (let guard = 0; guard < 10 && duel.turn.phase !== "main1"; guard++) {
			const action = legalActions(duel).find((candidate) => candidate.type === "pass")!;
			actions.push(action);
			duel = act(duel, action);
		}
		// This action cannot be replayed from a fixture: only the play lifecycle dealt a hand.
		const summon = legalActions(duel).find((candidate) => candidate.type === "summon")!;
		expect(summon).toBeDefined();
		actions.push(summon);
		duel = act(duel, summon);
		const side = duel.priority.holder;
		expect(rebuildDuel(playSetup, actions, REAL_CARDS, "play")).toEqual(duel);
		const request: BotRequest = { id: 9, lifecycle: "play", setup: playSetup, actions, side, level: "basic", seed: 1 };
		const answer = answerRequest(request, REAL_CARDS);
		expect(answer).toMatchObject({ id: 9, action: expect.any(Object), name: expect.any(String) });
		if ("action" in answer) expect(legalActions(duel)).toContainEqual(answer.action);
		expect(structuredClone(answer)).toEqual(answer);
		expect(structuredClone(request)).toEqual(request);
		expect(answerRequest({ ...request, id: 12, setup, actions: [] }, REAL_CARDS)).toMatchObject({ id: 12, error: expect.stringMatching(/at least five/) });
		const posted: BotAnswer[] = [];
		const scope: Parameters<typeof serveBot>[0] = { onmessage: null, postMessage: (reply) => posted.push(reply) };
		serveBot(scope, REAL_CARDS);
		scope.onmessage!({ data: request });
		expect(posted).toEqual([answer]);
		expect(answerRequest({ ...request, id: 10, side: side === "you" ? "rival" : "you" }, REAL_CARDS)).toMatchObject({ id: 10, error: expect.stringMatching(/does not hold/) });
		expect(answerRequest({ ...request, id: 11, actions: [{ type: "attack", card: 1, target: null }] }, REAL_CARDS)).toMatchObject({ id: 11, error: expect.stringMatching(/not a legal action/) });
	});

	it("rebuilds the Duel from its setup and the actions played, with the card records the worker holds", () => {
		const start = createDuel({ ...setup, defs: REAL_CARDS });
		const first = legalActions(start)[0]!;
		const rebuilt = rebuildDuel(setup, [first], REAL_CARDS);
		expect(rebuilt.turn).toEqual(act(start, first).turn);
	});

	it("answers with a legal action, its name and the progress, for the side that decides", () => {
		const request: BotRequest = { id: 7, setup, actions: [], side: "you", level: "medium", seed: 2, plan: { lines: [{ name: "pass", steps: ["pass"] }] } };
		const answer = answerRequest(request, REAL_CARDS);
		expect(answer).toMatchObject({ id: 7, action: { type: "pass" }, name: "pass" });
		// Plain data: it survives a structured clone (postMessage) unchanged.
		expect(structuredClone(answer)).toEqual(answer);
	});

	it("answers an error, never throws: an action that is not legal, a side that does not decide", () => {
		const bad = answerRequest({ id: 1, setup, actions: [{ type: "attack", card: 1, target: null }], side: "you", level: "basic", seed: 0 }, REAL_CARDS);
		expect(bad).toMatchObject({ id: 1, error: expect.stringMatching(/not a legal action/) });
		const notYours = answerRequest({ id: 2, setup, actions: [], side: "rival", level: "basic", seed: 0 }, REAL_CARDS);
		expect(notYours).toMatchObject({ id: 2, error: expect.stringMatching(/does not hold/) });
	});

	it("serves requests on a worker scope: each message gets its answer posted back", () => {
		const posted: BotAnswer[] = [];
		const scope: Parameters<typeof serveBot>[0] = { onmessage: null, postMessage: (answer) => posted.push(answer) };
		serveBot(scope, REAL_CARDS);
		scope.onmessage!({ data: { id: 3, setup, actions: [], side: "you", level: "basic", seed: 0 } });
		expect(posted).toHaveLength(1);
		expect(posted[0]).toMatchObject({ id: 3, action: expect.any(Object) });
	});
});
