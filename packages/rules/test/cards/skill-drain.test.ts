import { describe, expect, it } from "vitest";
import { atk, cites, isNegated, moveCard } from "../../src";
import { continuousCards } from "../rules/continuous-fixtures";
import { codes, offered, play, position, REAL_CARDS } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "skill-drain";
const idOf = (duel: ReturnType<typeof position>, code: string) => Object.values(duel.cards).find((held) => held.code === code)!.id;

describe("Skill Drain, written as effect records (a Continuous Trap)", () => {
	const log: string[] = [];
	const defs = { ...REAL_CARDS, ...continuousCards(log) };
	it(`${cites("skill-drain", "text")} costs 1000 LP to activate, and stays on the field after it resolves`, () => {
		const start = position({ defs, options, you: { set: [card] } });
		const done = play(start, `activate ${card}`, "pass", "pass");
		expect(done.lp.you).toBe(7000);
		expect(codes(done, "you", "spell")).toEqual([card]);
		expect(done.cards[idOf(done, card)]!.face).toBe("up");
		expect(codes(done, "you", "graveyard")).toEqual([]);
		// With 999 LP it cannot be paid: the card is not offered.
		expect(offered({ ...start, lp: { you: 999, rival: 8000 } })).toEqual(["pass"]);
	});
	it(`${cites("skill-drain", "text")} negates the effects of all face-up monsters of both players, who can still activate them`, () => {
		log.length = 0;
		const start = position({ defs, you: { set: [card], monsters: ["muka-muka", "ping"], hand: ["small", "small"] }, rival: { monsters: ["muka-muka-rival"] } });
		expect([atk(start, idOf(start, "muka-muka")), atk(start, idOf(start, "muka-muka-rival"))]).toEqual([1200, 1100]);
		const on = play(start, `activate ${card}`);
		expect(isNegated(on, idOf(on, "muka-muka"))).toBe(true);
		expect(atk(on, idOf(on, "muka-muka"))).toBe(600);
		expect(atk(on, idOf(on, "muka-muka-rival"))).toBe(600);
		// "(but their effects can still be activated)": the ignition effect is offered, and does nothing when it resolves.
		expect(offered(on)).toContain("activate ping");
		const used = play(on, "activate ping");
		expect(used.chain).toEqual([]);
		expect(log).toEqual([]);
	});
	it(`${cites("skill-drain", "left-the-zone")} a monster that left the Monster Zone as its own cost is not negated when its effect resolves`, () => {
		log.length = 0;
		const start = position({ defs, you: { set: [card], monsters: ["cost-ping"] } });
		const on = play(start, `activate ${card}`);
		const done = play(on, "activate cost-ping");
		expect(log).toEqual(["cost-ping"]);
		expect(codes(done, "you", "graveyard")).toEqual(["cost-ping"]);
	});
	it(`${cites("skill-drain", "notes")} a face-down monster is not negated until it is face-up, and the negation ends with Skill Drain`, () => {
		const start = position({ defs, options, you: { set: [card], facedown: ["muka-muka"], hand: ["small"] } });
		const on = play(start, `activate ${card}`, "pass", "pass");
		const id = idOf(on, "muka-muka");
		expect(isNegated(on, id)).toBe(false);
		// Flipped face-up it is negated; with Skill Drain gone the effect of Muka Muka applies again.
		const up = moveCard(on, id, { zone: "monster", face: "up" });
		expect(isNegated(up, id)).toBe(true);
		const gone = moveCard(up, idOf(up, card), { zone: "graveyard" });
		expect(isNegated(gone, id)).toBe(false);
		expect(atk(gone, id)).toBe(900);
	});
});
