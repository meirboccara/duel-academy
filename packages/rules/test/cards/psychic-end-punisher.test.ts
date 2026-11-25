import { describe, expect, it } from "vitest";
import { atk, CARD_DEFS, type CardDef, cites, type Duel, flipFaceDown, loseLp, moveCard, moveCards, printedFacts, specialSummon } from "../../src";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesExtraFixtures, settle } from "./blue-eyes-extra-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "psychic-end-punisher";
const gaps = gapCards();
const defs: Record<string, CardDef> = {
	...CARD_DEFS,
	...blueEyesFixtures,
	...extraDeckFixtures,
	...blueEyesExtraFixtures,
	...Object.fromEntries(["fixture-smite", "fixture-curse"].map((code) => [code, gaps[code]!])),
};
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const duelAtk = (duel: Duel) => atk(duel, find(duel, card).id);
/** The card Synchro Summoned (the Summon is not the point: `specialSummon` with kind "synchro" marks it as the procedure does), then the Life Points set. */
const synchroed = (spec: { you?: SideSpec; rival?: SideSpec; lp?: { you?: number; rival?: number }; turn?: "you" | "rival" } = {}): Duel => {
	const start = board({ extra: [card], ...spec.you }, spec.rival, { everyWindow: true }, spec.turn);
	const summoned = specialSummon(start, "you", find(start, card).id, { kind: "synchro", slot: 5 });
	return loseLp(loseLp(summoned, "you", spec.lp?.you ?? 0), "rival", spec.lp?.rival ?? 0);
};
/** The rival's Quick-Play Spell "fixture-smite" targeting the card, in the rival's turn; then both pass, so that the effect is applied or not. */
const smitten = (duel: Duel): Duel => play(play(duel, `activate fixture-smite > ${card}`), "pass", "pass");
const onTheirTurn = (spec: { you?: SideSpec; rival?: SideSpec; lp?: { you?: number; rival?: number } } = {}) => synchroed({ ...spec, rival: { set: ["fixture-smite"], ...spec.rival }, turn: "rival" });
const effect = `activate ${card}`;

describe("Psychic End Punisher, written as effect records", () => {
	it(`${cites("psychic-end-punisher", "facts")} is a LIGHT Psychic Synchro Effect Monster of Level 11 with 3500 ATK and 3500 DEF`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Psychic End Punisher", attribute: "LIGHT", monsterType: "Psychic", frame: "synchro", level: 11, atk: 3500, def: 3500 });
	});

	it(`${cites("psychic-end-punisher", "procedure")} is Synchro Summoned with 1 Tuner and 1 or more non-Tuner monsters whose Levels add up to 11, sent to the Graveyard`, () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-plain-7"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		expect(summons(board({ monsters: ["fixture-tuner-1", "fixture-plain-4", "fixture-plain-6"], extra: [card] }))).toEqual([`special-summon ${card}`]);
		// A second Tuner cannot stand in for a non-Tuner.
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-tuner-1", "fixture-plain-6"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-plain-4", "fixture-plain-7"], extra: [card] }))).toEqual([]);
		expect(summons(board({ monsters: ["fixture-tuner-4", "fixture-plain-6"], extra: [card] }))).toEqual([]);
		const done = play(board({ monsters: ["fixture-tuner-4", "fixture-plain-7"], extra: [card] }), `special-summon ${card}`, "place 5");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-plain-7", "fixture-tuner-4"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "synchro" });
	});

	describe("its Continuous Effect", () => {
		it(`${cites("psychic-end-punisher", "unaffected")} ${cites("psychic-end-punisher", "notes-unaffected-field")} while its controller's LP are less than or equal to the opponent's, this Synchro Summoned card is unaffected by the opponent's activated effects`, () => {
			const lower = smitten(onTheirTurn({ lp: { you: 1000 } }));
			expect(find(lower, card).zone).toBe("monster");
			// Equal Life Points: still.
			const equal = smitten(onTheirTurn());
			expect(find(equal, card).zone).toBe("monster");
			// More Life Points than the opponent: the Spell applies.
			const higher = smitten(onTheirTurn({ lp: { rival: 1000 } }));
			expect(find(higher, card).zone).toBe("graveyard");
		});
		it(`${cites("psychic-end-punisher", "unaffected")} is unaffected only by the opponent's effects that are activated: its controller's own effects apply, and so does a Continuous Effect of the opponent's card`, () => {
			// The controller's own Quick-Play Spell.
			const mine = synchroed({ you: { set: ["fixture-smite"] } });
			const destroyed = play(play(mine, `activate fixture-smite > ${card}`), "pass", "pass");
			expect(find(destroyed, card).zone).toBe("graveyard");
			// The opponent's Continuous Spell is not an activated effect: it applies.
			const cursed = synchroed({ rival: { faceupSpells: ["fixture-curse"] } });
			expect(duelAtk(cursed)).toBe(3000);
		});
		it(`${cites("psychic-end-punisher", "unaffected")} applies to a card that was Synchro Summoned only: put on the field otherwise, it is affected`, () => {
			const start = board({ monsters: [card] }, { set: ["fixture-smite"] }, { everyWindow: true }, "rival");
			expect(find(smitten(start), card).zone).toBe("graveyard");
		});
		it(`${cites("psychic-end-punisher", "qa-synchro-flipped")} is still "Synchro Summoned" after being turned face-down and face-up again, or banished temporarily and returned (Konami's Q&A fid 14641)`, () => {
			const base = onTheirTurn({ lp: { you: 1000 } });
			const id = find(base, card).id;
			const flipped = moveCard(flipFaceDown(base, id), id, { zone: "monster", face: "up" });
			expect(find(flipped, card)).toMatchObject({ face: "up", summonedBy: "synchro" });
			expect(find(smitten(flipped), card).zone).toBe("monster");
			const returned = moveCard(moveCards(base, [id], { zone: "banished" }), id, { zone: "monster", face: "up" });
			expect(find(smitten(returned), card).zone).toBe("monster");
		});
		it(`${cites("psychic-end-punisher", "qa-targeted-not-applied")} an effect of the opponent that targets it can be activated but is not applied when it resolves (Konami's Q&A fid 23617)`, () => {
			const targeted = play(onTheirTurn({ lp: { you: 1000 }, rival: { set: ["fixture-smite", "fixture-droplet"] } }), `activate fixture-droplet > ${card}`);
			expect(targeted.chain[0]!.targets).toEqual([find(targeted, card).id]);
			const resolved = settle(targeted);
			expect(find(resolved, card).zone).toBe("monster");
			expect(duelAtk(resolved)).toBe(3500);
			expect(resolved.modifiers.some((modifier) => modifier.layer.kind === "negate")).toBe(false);
		});
	});

	describe("its banishment", () => {
		const mine = { monsters: ["fixture-plain-4"] };
		const theirs = { monsters: ["fixture-plain-5"], set: ["fixture-trap-smite"] };
		it(`${cites("psychic-end-punisher", "banish")} ${cites("psychic-end-punisher", "notes-banish-field")} pays 1000 LP, targets 1 monster its controller controls and 1 card the opponent controls, and banishes them`, () => {
			const duel = synchroed({ you: mine, rival: theirs });
			expect(own(duel, effect)).toEqual([
				`${effect} > fixture-plain-4 > fixture-plain-5 {1,1}`,
				`${effect} > fixture-plain-4 > fixture-trap-smite {1,1}`,
				`${effect} > ${card} > fixture-plain-5 {1,1}`,
				`${effect} > ${card} > fixture-trap-smite {1,1}`,
			]);
			const done = settle(play(duel, `${effect} > fixture-plain-4 > fixture-trap-smite {1,1}`));
			expect(done.lp.you).toBe(7000);
			expect(codes(done, "you", "banished")).toEqual(["fixture-plain-4"]);
			expect(codes(done, "rival", "banished")).toEqual(["fixture-trap-smite"]);
			expect(find(done, "fixture-plain-4")).toMatchObject({ zone: "banished", face: "up" });
			// It can target itself, a face-down card of the opponent included.
			const itself = settle(play(duel, `${effect} > ${card} > fixture-plain-5 {1,1}`));
			expect(codes(itself, "you", "banished")).toEqual([card]);
		});
		it(`${cites("psychic-end-punisher", "banish")} needs a card the opponent controls, and 1000 LP to pay`, () => {
			expect(own(synchroed({ you: mine }), effect)).toEqual([]);
			expect(own(synchroed({ you: mine, rival: theirs, lp: { you: 7001 } }), effect)).toEqual([]);
			expect(own(synchroed({ you: mine, rival: theirs, lp: { you: 7000 } }), effect)).toHaveLength(4);
		});
		it(`${cites("psychic-end-punisher", "banish")} is an Ignition Effect: only in its controller's Main Phase`, () => {
			const theirTurn = synchroed({ you: mine, rival: theirs, turn: "rival" });
			expect(own(theirTurn.priority.holder === "you" ? theirTurn : play(theirTurn, "pass"), effect)).toEqual([]);
		});
		it(`${cites("psychic-end-punisher", "banish")} can be used once per turn`, () => {
			const duel = synchroed({ you: mine, rival: { monsters: ["fixture-plain-5", "fixture-plain-6"] } });
			const done = settle(play(duel, `${effect} > fixture-plain-4 > fixture-plain-5 {1,1}`));
			expect(own(done, effect)).toEqual([]);
			expect(codes(done, "rival", "monster")).toEqual(["fixture-plain-6"]);
		});
		it(`${cites("psychic-end-punisher", "notes-banish-partial")} when one of the targets is no longer a target when it resolves, the other is still banished`, () => {
			const duel = synchroed({ you: { ...mine, hand: [] }, rival: { monsters: ["fixture-plain-5"], set: ["fixture-smite"] }, lp: {} });
			const activated = play(duel, `${effect} > fixture-plain-4 > fixture-plain-5 {1,1}`);
			// The opponent's monster leaves before the effect resolves: only the other target is banished.
			const gone = moveCard(activated, find(activated, "fixture-plain-5").id, { zone: "graveyard" });
			const done = settle(gone);
			expect(codes(done, "you", "banished")).toEqual(["fixture-plain-4"]);
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-plain-5"]);
		});
	});

	describe("its Battle Phase effect", () => {
		/** Passes until the Battle Phase begins and the effect is offered (or the phase is over). */
		const atBattleStart = (duel: Duel): Duel => {
			let next = duel;
			for (let guard = 0; guard < 20 && !(next.turn.phase === "battle" && own(next, effect).length > 0) && next.turn.phase !== "main2"; guard++) next = play(next, "pass");
			return next;
		};
		it(`${cites("psychic-end-punisher", "gain")} ${cites("psychic-end-punisher", "notes-gain-trigger")} at the start of the Battle Phase, gains ATK equal to the difference between its controller's LP and the opponent's`, () => {
			const behind = atBattleStart(synchroed({ lp: { you: 2000 } }));
			expect(behind.turn.phase).toBe("battle");
			expect(own(behind, effect)).toEqual([effect]);
			const gained = settle(play(behind, effect));
			expect(duelAtk(gained)).toBe(5500);
			// With the lead, the same: the difference.
			const ahead = settle(play(atBattleStart(synchroed({ lp: { rival: 1500 } })), effect));
			expect(duelAtk(ahead)).toBe(5000);
		});
		it(`${cites("psychic-end-punisher", "notes-gain-once")} can be activated once for each Start Step of the Battle Phase: not again in the same Start Step`, () => {
			const behind = atBattleStart(synchroed({ lp: { you: 2000 } }));
			const used = settle(play(behind, effect));
			expect(own(used, effect)).toEqual([]);
			expect(duelAtk(used)).toBe(5500);
		});
		it(`${cites("psychic-end-punisher", "gain")} is not offered in another phase, nor when the card is not on the field`, () => {
			const main = synchroed({ lp: { you: 2000 } });
			expect(own(main, effect)).toEqual([]);
			const away = atBattleStart(moveCard(synchroed({ lp: { you: 2000 } }), find(synchroed(), card).id, { zone: "graveyard" }));
			expect(own(away, effect)).toEqual([]);
		});
	});
});
