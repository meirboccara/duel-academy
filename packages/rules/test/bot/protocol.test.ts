import { describe, expect, it } from "vitest";
import { act, answerRequest, type BotAnswer, type BotRequest, createDuel, type DuelSetup, legalActions, rebuildDuel, serveBot } from "../../src";
import { REAL_CARDS } from "../rules/fixtures";

/** A Duel the app would keep as its setup (plain data) and the actions played since. */
const setup: Omit<DuelSetup, "defs"> = { seed: 11, you: { deck: ["normal-4", "terraforming", "umi"] }, rival: { deck: ["normal-4", "ash-blossom-joyous-spring"] } };

describe("the bot's worker protocol: a request in, an answer out, both plain data", () => {
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
