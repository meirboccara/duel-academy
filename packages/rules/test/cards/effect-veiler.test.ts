import { describe, expect, it } from "vitest";
import { type CardDef, CARD_DEFS, type Duel, cites, moveCard, takeControl } from "../../src";
import { negationCards } from "../rules/negation-fixtures";
import { codes, offered, plainCards, play, position } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "effect-veiler";
const against = (target: string) => `activate ${card} > ${target}`;
/** After a chain has resolved, the rival (the turn player) passes once to reopen the game state. */
const reopened = (duel: Duel) => (duel.chain.length === 0 && !duel.priority.open ? play(duel, "pass") : duel);
const defsWith = (log: string[] = []) => ({ ...CARD_DEFS, ...plainCards(log), ...negationCards(log) });

describe("Effect Veiler, written as an effect record", () => {
	it(`${cites("effect-veiler", "text")} ${cites("effect-veiler", "notes-hand")} is a Quick Effect from the hand that can only be used during the opponent's Main Phase`, () => {
		const defs = defsWith();
		// The rival's turn: their effect (a Quick Effect works in any phase) gives you the window.
		const rivalTurn = (phase: "main1" | "battle" | "main2", mine: { hand?: string[]; monsters?: string[] } = { hand: [card] }) =>
			offered(play(position({ defs, options, turn: "rival", phase, you: mine, rival: { monsters: ["field-quick", "effect-b"] } }), "activate field-quick"));
		expect(rivalTurn("main1")).toContain(against("effect-b"));
		expect(rivalTurn("main2")).toContain(against("effect-b"));
		expect(rivalTurn("battle")).not.toContain(against("effect-b"));
		// Not on the field, and not in your own Main Phase.
		expect(rivalTurn("main1", { monsters: [card] })).not.toContain(against("effect-b"));
		const own = position({ defs, options, you: { hand: [card, "plain-spell"] }, rival: { monsters: ["field-quick", "effect-b"] } });
		expect(offered(play(own, "activate plain-spell", "activate field-quick")).filter((label) => label.startsWith(`activate ${card}`))).toEqual([]);
	});
	it(`${cites("effect-veiler", "text")} sends itself to the GY as the cost, then targets one Effect Monster the opponent controls: not one of yours, not a Normal Monster`, () => {
		const defs = defsWith();
		const start = position({ defs, options, turn: "rival", you: { hand: [card], monsters: ["ignition"] }, rival: { monsters: ["field-quick", "effect-b", "normal-4"] } });
		const asked = play(start, "activate field-quick");
		expect([...new Set(offered(asked))]).toEqual([against("effect-b"), against("field-quick"), "pass"]);
		const aimed = play(asked, against("effect-b"));
		expect(codes(aimed, "you", "graveyard")).toEqual([card]);
		expect(aimed.chain[aimed.chain.length - 1]!.targets).toHaveLength(1);
	});
	it(`${cites("effect-veiler", "text")} negates the effects of the target until the end of this turn: its ignition effect is activated and does nothing; the turn after, it applies again`, () => {
		const log: string[] = [];
		const defs = defsWith(log);
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { monsters: ["field-quick", "ignition"] } });
		let duel = play(start, "activate field-quick", against("ignition"), "pass");
		// Resolved: "ignition" is negated for the rest of the rival's turn (the log holds the Quick Effect that was answered).
		expect(duel.chain).toEqual([]);
		log.length = 0;
		duel = play(duel, "pass");
		expect(duel.priority.open).toBe(true);
		duel = play(duel, "activate ignition");
		expect(log).toEqual([]);
		for (let guard = 0; guard < 60 && !(duel.turn.number === 5 && duel.turn.phase === "main1"); guard++) duel = play(duel, "pass");
		expect(duel.turn).toMatchObject({ player: "rival", number: 5, phase: "main1" });
		duel = play(duel, "activate ignition");
		duel = play(duel, "pass");
		expect(log).toEqual(["ignition"]);
	});
	it(`${cites("effect-veiler", "dual-as-normal")} cannot target a monster that is treated as a Normal Monster on the field (the core has no Dual Monster state: its Normal Monster flag stands for it)`, () => {
		const defs = { ...defsWith(), dual: { code: "dual", kind: "monster", facts: { level: 4, normal: true } } satisfies CardDef };
		const start = position({ defs, options, turn: "rival", you: { hand: [card] }, rival: { monsters: ["field-quick", "dual"] } });
		expect([...new Set(offered(play(start, "activate field-quick")))]).toEqual([against("field-quick"), "pass"]);
	});
	it("cannot target a face-down monster or one whose effects are already negated (YGOProJudge's answers only, asked 2026-11-24, no Konami page found)", () => {
		const defs = defsWith();
		const start = position({ defs, turn: "rival", you: { hand: [card, card] }, rival: { monsters: ["field-quick", "effect-b"], facedown: ["monster"] } });
		const asked = play(start, "activate field-quick");
		expect([...new Set(offered(asked))]).toEqual([against("effect-b"), against("field-quick"), "pass"]);
		// "effect-b" is negated once that has resolved; the rival's Quick Effect gives the second copy another window.
		const negated = play(asked, against("effect-b"), "pass", "pass");
		expect(negated.chain).toEqual([]);
		expect([...new Set(offered(play(negated, "activate field-quick")))]).toEqual([against("field-quick"), "pass"]);
	});
});

describe("Effect Veiler's resolution and its limits", () => {
	// Quick-Play Spells for these tests: the rival turns their own monster face-down and face-up again, which makes it a new card.
	const withReset = (log: string[]): Record<string, CardDef> => ({
		...defsWith(log),
		"quick-moon": { code: "quick-moon", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => moveCard(duel, duel.piles.rival.monster[0]!, { zone: "monster", face: "down", position: "defense" }) }] },
	});
	it(`${cites("effect-veiler", "notes-resolution")} negates nothing if the target is no longer a face-up monster in the opponent's Monster Zone when it resolves`, () => {
		const log: string[] = [];
		const defs = withReset(log);
		const start = position({ defs, options, turn: "rival", you: { hand: [card] }, rival: { monsters: ["ignition"], hand: ["quick-moon"] } });
		// The rival turns the target face-down in response: Effect Veiler does nothing.
		const done = play(start, "activate ignition", against("ignition"), "activate quick-moon", "pass", "pass", "pass");
		expect(done.chain).toEqual([]);
		expect(codes(done, "rival", "monster")).toEqual(["ignition"]);
		expect(done.modifiers).toEqual([]);
	});
	it(`${cites("effect-veiler", "notes-resolution")} negates nothing if the target is no longer controlled by the opponent when it resolves`, () => {
		const log: string[] = [];
		const defs = { ...withReset(log), "quick-steal": { code: "quick-steal", kind: "quick-play", effects: [{ type: "activation", operation: (duel: Duel) => takeControl(duel, duel.piles.rival.monster[0]!, "you", duel.turn.number) }] } satisfies CardDef };
		const start = position({ defs, options, turn: "rival", you: { hand: [card] }, rival: { monsters: ["ignition"], hand: ["quick-steal"] } });
		const done = play(start, "activate ignition", against("ignition"), "activate quick-steal", "pass", "pass", "place 0", "pass");
		expect(done.chain).toEqual([]);
		expect(codes(done, "you", "monster")).toEqual(["ignition"]);
		expect(done.modifiers.filter((modifier) => modifier.layer.kind === "negate")).toEqual([]);
	});
	it(`${cites("effect-veiler", "notes-face-down")} the negation ends when the monster is turned face-down: face-up again, it is a new card whose effect applies`, () => {
		const log: string[] = [];
		const defs = withReset(log);
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { monsters: ["field-quick", "ignition"], hand: ["reset"] } });
		const veiled = reopened(play(start, "activate field-quick", against("ignition"), "pass"));
		log.length = 0;
		const done = reopened(play(veiled, "activate reset", "pass"));
		expect(offered(done)).toContain("activate ignition");
		play(done, "activate ignition", "pass");
		expect(log).toEqual(["ignition"]);
	});
	it(`${cites("effect-veiler", "notes-cost-leaving")} a negated monster that leaves the Monster Zone as the cost of its own effect still activates it, and the effect is not applied`, () => {
		const log: string[] = [];
		const defs = withReset(log);
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { monsters: ["field-quick", "blazer"] } });
		const veiled = reopened(play(start, "activate field-quick", against("blazer"), "pass"));
		log.length = 0;
		const done = play(veiled, "activate blazer", "pass");
		expect(codes(done, "rival", "banished")).toEqual(["blazer"]);
		expect(log).toEqual([]);
	});
	it(`${cites("rules", "negated-effect-on-chain-not-applied")} chained to the monster's own effect, it stops every part of that effect`, () => {
		const log: string[] = [];
		const defs = withReset(log);
		const start = position({ defs, turn: "rival", you: { hand: [card] }, rival: { monsters: ["bell"] } });
		const done = play(start, "activate bell", against("bell"), "pass");
		expect(log).toEqual([]);
		expect(done.chain).toEqual([]);
	});
	// Review: "Effect Monster" means a monster with effects; an effectless monster that is not flagged Normal (a non-effect Fusion,
	// Synchro or Ritual Monster) is not one.
	it(`${cites("effect-veiler", "text")} does not target a monster with no effects, even one not flagged as a Normal Monster`, () => {
		const plain: CardDef = { code: "plain-fusion", kind: "monster", facts: { level: 6, atk: 2000, def: 2000 } };
		const defs = { ...CARD_DEFS, "plain-fusion": plain };
		const start = position({ defs, turn: "rival", you: { hand: ["effect-veiler"] }, rival: { monsters: ["plain-fusion"] } });
		expect(offered({ ...start, priority: { holder: "you", passed: ["rival"], open: false } }).filter((label) => label.startsWith("activate effect-veiler"))).toEqual([]);
	});
});
