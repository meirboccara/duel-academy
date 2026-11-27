import { expect, it } from "vitest";
import { act, cites, type CardDef, type Duel, type GameEvent, legalActions, type Phase, startDuel } from "../../src";

/** A card that, in hand, answers the start of a Battle Phase or the start of its End Step (an optional Trigger Effect). */
const watcher: CardDef = {
	code: "watcher",
	kind: "monster",
	effects: [{ type: "trigger", range: "hand", event: (_duel: Duel, event: GameEvent) => (event.type === "phase" && event.phase === "battle") || event.type === "battle-step", operation: (duel: Duel) => duel }],
};
const setup = { seed: 17, defs: { watcher }, you: { deck: Array(8).fill("watcher") }, rival: { deck: Array(8).fill("watcher") }, options: { everyWindow: true } };

/** Every state on the way, passing each time (declining optional triggers), until `done`. */
function walk(duel: Duel, done: (duel: Duel) => boolean): Duel[] {
	const seen = [duel];
	for (let steps = 0; steps < 200 && !done(duel); steps++) {
		const pass = legalActions(duel).find((action) => action.type === "pass");
		if (!pass) throw new Error("No legal pass before destination");
		duel = act(duel, pass);
		seen.push(duel);
	}
	expect(done(duel)).toBe(true);
	return seen;
}

/** The phases in the order they were entered, once each. */
const phases = (states: readonly Duel[]): Phase[] => states.map((duel) => duel.turn.phase).filter((phase, i, all) => i === 0 || all[i - 1] !== phase);
const offersTrigger = (duel: Duel) => legalActions(duel).some((action) => action.type === "activate");

it(`${cites("rules", "no-battle-first-turn")} ${cites("rules", "no-battles-main1-to-end")} the player who goes first moves from Main Phase 1 straight to the End Phase on the Duel's first turn: no Battle Phase, no Main Phase 2`, () => {
	const turnOne = walk(startDuel(setup), (duel) => duel.turn.number === 2).filter((duel) => duel.turn.number === 1);
	expect(phases(turnOne)).toEqual(["draw", "standby", "main1", "end"]);
	expect(turnOne.every((duel) => duel.battleStep === null)).toBe(true);
});

it(`${cites("rules", "main2-after-battle")} the player who goes second has their Battle Phase on turn 2, then Main Phase 2`, () => {
	const turnOne = walk(startDuel(setup), (duel) => duel.turn.number === 2);
	const turnTwo = walk(turnOne[turnOne.length - 1]!, (duel) => duel.turn.number === 3).filter((duel) => duel.turn.number === 2);
	expect(turnTwo[0]!.turn.player).toBe("rival");
	expect(phases(turnTwo)).toEqual(["draw", "standby", "main1", "battle", "main2", "end"]);
	expect(turnTwo.find((duel) => duel.turn.phase === "battle")!.battleStep).toBe("start");
});

it(`${cites("rules", "no-battle-first-turn")} on the first turn no Battle Phase window opens and no Battle Phase trigger is offered; on turn 2 they are`, () => {
	const states = walk(startDuel(setup), (duel) => duel.turn.number === 3);
	const turnOne = states.filter((duel) => duel.turn.number === 1);
	expect(turnOne.some(offersTrigger)).toBe(false);
	expect(turnOne.some((duel) => duel.live.some((event) => event.type === "battle-step" || (event.type === "phase" && event.phase === "battle")))).toBe(false);
	const turnTwo = states.filter((duel) => duel.turn.number === 2);
	// Each player's watchers in hand are offered (the turn player's, then the opponent's), at the Start Step and at the End Step.
	expect(turnTwo.filter(offersTrigger).map((duel) => duel.battleStep)).toEqual(["start", "start", "end", "end"]);
});
