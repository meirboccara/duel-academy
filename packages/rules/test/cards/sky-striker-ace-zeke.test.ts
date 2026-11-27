import { describe, expect, it } from "vitest";
import { atk, canSpecialSummon, cites, type Duel, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { nextTurn } from "../rules/continuous-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board8 } from "./sky-striker-batch8-fixtures";
import { effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";
import { find } from "./sky-striker-fixtures";

const card = "sky-striker-ace-zeke";
const BANISH = 0;
const GAIN = 1;
const summon = `special-summon ${card}`;
const idOf = (duel: Duel, code: string): number => find(duel, code).id;

/** Zeke Link Summoned from the Extra Deck with its 2 materials, a "Sky Striker Ace" monster and another monster, the Summon's window passed: its first effect is on offer. */
const linked = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = { monsters: ["fixture-big"] }, log: string[] = []) =>
	play(board8(log, { monsters: ["fixture-ace-dark", "fixture-filler"], extra: [card], ...you }, rival), summon, "place 5", "pass", "pass");
/** Zeke on the field already (an Extra Monster Zone), for its second effect. */
const onField = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = {}, log: string[] = []) => board8(log, { extraZone: [card], monsters: ["fixture-filler"], ...you }, rival);

/** Passes until `label` is on offer (a chain resolved, the game state open again). */
function untilOffered(duel: Duel, label: string): Duel {
	let next = duel;
	for (let guard = 0; guard < 8 && !offered(next).includes(label); guard++) next = play(next, "pass");
	return next;
}

/** Passes until the turn player holds priority in an open game state of `phase` in turn `turn`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"], turn = duel.turn.number): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.number === turn && next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

describe("Sky Striker Ace - Zeke, written as effect records", () => {
	it(`${cites("sky-striker-ace-zeke", "facts")} is a DARK Machine Link 2 Effect Monster with 1500 ATK and its arrows at the top and the bottom, a "Sky Striker Ace" and a "Sky Striker" card that mentions itself`, () => {
		const duel = board8([], { extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, idOf(duel, card))).toEqual({ name: "Sky Striker Ace - Zeke", attribute: "DARK", monsterType: "Machine", frame: "link", link: 2, arrows: ["top", "bottom"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace - Zeke"] });
	});

	describe("the Summon", () => {
		it(`${cites("sky-striker-ace-zeke", "procedure")} needs 2 monsters, including a "Sky Striker Ace" monster, and sends them to the Graveyard`, () => {
			expect(offered(board8([], { monsters: ["fixture-ace-dark", "fixture-filler"], extra: [card] }))).toContain(summon);
			expect(offered(board8([], { monsters: ["fixture-ace-dark", "fixture-ace-light"], extra: [card] }))).toContain(summon);
			expect(offered(board8([], { monsters: ["fixture-filler", "fixture-big"], extra: [card] }))).not.toContain(summon);
			expect(offered(board8([], { monsters: ["fixture-ace-dark"], extra: [card] }))).not.toContain(summon);
			const done = linked();
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-ace-dark", "fixture-filler"]);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", slot: 5, summonedBy: "link", proper: true });
		});
		it(`${cites("sky-striker-ace-zeke", "link-only")} ${cites("sky-striker-ace-zeke", "notes-not-effect")} must be Link Summoned: no effect Special Summons it, whatever happens to its effects`, () => {
			const duel = board8([], { extra: [card], graveyard: [card] });
			const inExtra = duel.piles.you.extra.map((id) => duel.cards[id]!).find((entry) => entry.code === card)!;
			const inGraveyard = duel.piles.you.graveyard.map((id) => duel.cards[id]!)[0]!;
			expect(canSpecialSummon(duel, "you", inExtra.id)).toBe(false);
			expect(canSpecialSummon(duel, "you", inGraveyard.id)).toBe(false);
			expect(canSpecialSummon(duel, "you", inExtra.id, "link")).toBe(true);
		});
		it(`${cites("sky-striker-ace-zeke", "once-summon")} ${cites("sky-striker-ace-zeke", "notes-not-effect")} only one Special Summon of the name per turn, by any way, even when its effects are negated`, () => {
			const start = board8([], { extra: [card, card] });
			const [first, second] = start.piles.you.extra;
			const done = specialSummon(start, "you", first!, { slot: 5, kind: "link" });
			expect(done.cards[first!]!.zone).toBe("monster");
			expect(canSpecialSummon(start, "you", second!, "link")).toBe(true);
			expect(canSpecialSummon(done, "you", second!, "link")).toBe(false);
			expect(canSpecialSummon(negateCardEffects(done, first!, done.turn.number), "you", second!, "link")).toBe(false);
		});
	});

	describe("the first effect: banish until the opponent's next End Phase", () => {
		it(`${cites("sky-striker-ace-zeke", "banish")} ${cites("sky-striker-ace-zeke", "notes-banish-trigger")} ${cites("sky-striker-ace-zeke", "notes-banish-target")} when Link Summoned it may target 1 face-up monster on the field, of either player, itself included: not a face-down monster, not a Spell or Trap Card`, () => {
			const duel = linked({ faceupSpells: ["fixture-ss-spell"] }, { monsters: ["fixture-big"], facedown: ["fixture-normal"], set: ["fixture-trap"] });
			expect(effectsOffered(duel, card)).toEqual([BANISH]);
			expect(offered(duel).filter((label) => label.startsWith(`activate ${card}`)).sort()).toEqual([`activate ${card} > ${card}`, `activate ${card} > fixture-big`].sort());
		});
		it(`${cites("sky-striker-ace-zeke", "banish")} ${cites("sky-striker-ace-zeke", "notes-banish-return")} ${cites("sky-striker-ace-zeke", "qa-zone-8571")} the monster is banished face-up and comes back in the opponent's next End Phase, in the position it was banished in, to the Main Monster Zone of the player who controlled it, who chooses the zone; not a Special Summon, no Chain Link`, () => {
			const start = linked({}, { defense: ["fixture-big"] });
			const big = idOf(start, "fixture-big");
			const gone = play(playEffect(start, card, BANISH, "fixture-big"), "pass", "pass");
			expect(gone.cards[big]).toMatchObject({ zone: "banished", face: "up" });
			expect(gone.delayed).toMatchObject([{ player: "you", mandatory: true, due: { phase: "end", turn: 4 } }]);
			// Not in this turn's End Phase.
			expect(offered(toPhase(gone, "end"))).toEqual(["pass"]);
			// The opponent's End Phase (turn 4): the opponent first, then the player who banished it, who must do it.
			const theirEnd = toPhase(gone, "end", 4);
			expect([theirEnd.turn.player, offered(theirEnd)]).toEqual(["rival", ["pass"]]);
			const yours = play(theirEnd, "pass");
			expect([yours.priority.holder, offered(yours)]).toEqual(["you", [`apply ${card}`]]);
			const asked = play(yours, `apply ${card}`);
			expect(asked.chain).toEqual([]);
			expect(asked.asking).toMatchObject({ player: "rival" });
			expect(offered(asked)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
			const back = play(asked, "place 3");
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "rival", slot: 3, face: "up", position: "defense" });
			expect(back.summons.filter((summoned) => summoned.code === "fixture-big")).toEqual([]);
			expect(back.cards[big]!.specialSummoned).toBe(false);
		});
		it(`${cites("sky-striker-ace-zeke", "banish")} Link Summoned in the opponent's turn, "your opponent's next End Phase" is the End Phase of that very turn`, () => {
			const log: string[] = [];
			const start = board8(log, { monsters: ["fixture-ace-dark", "fixture-linker-sky-striker-ace-zeke"], extra: [card] }, { monsters: ["fixture-big"] }, {}, "rival");
			const big = idOf(start, "fixture-big");
			const summoned = play(start, "pass", "activate fixture-linker-sky-striker-ace-zeke", "pass", "pass", "place 5", "pass", "pass");
			expect(find(summoned, card)).toMatchObject({ zone: "monster", summonedBy: "link", controller: "you" });
			const gone = play(playEffect(summoned, card, BANISH, "fixture-big"), "pass", "pass");
			expect(gone.cards[big]!.zone).toBe("banished");
			expect(gone.delayed).toMatchObject([{ due: { phase: "end", turn: gone.turn.number } }]);
			const back = play(toPhase(gone, "end"), "pass", `apply ${card}`, "place 0");
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "rival" });
		});
		it(`${cites("sky-striker-ace-zeke", "qa-control-no-duration-17476")} a monster whose control was taken with no limit of time that is banished comes back to the player who controlled it, who keeps it`, () => {
			const start = board8([], { monsters: ["fixture-ace-dark", "fixture-filler"], extra: [card], hand: ["fixture-take-for-good"] }, { monsters: ["fixture-big"] });
			const taken = play(start, "activate fixture-take-for-good > fixture-big", "pass", "pass");
			const big = idOf(taken, "fixture-big");
			expect(taken.cards[big]).toMatchObject({ controller: "you", owner: "rival" });
			const summoned = play(untilOffered(taken, summon), summon, "choose fixture-filler", "place 5", "pass", "pass");
			const gone = play(playEffect(summoned, card, BANISH, "fixture-big"), "pass", "pass");
			expect(gone.cards[big]!.zone).toBe("banished");
			const back = play(toPhase(gone, "end", 4), "pass", `apply ${card}`, "place 1");
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "you", owner: "rival" });
		});
		it(`${cites("sky-striker-ace-zeke", "qa-control-duration-17476")} a monster whose control was taken until the End Phase and is banished: that control ends at once, and it goes back to its previous controller as soon as it comes back`, () => {
			const start = board8([], { monsters: ["fixture-ace-dark", "fixture-filler"], extra: [card], hand: ["fixture-mind"] }, { monsters: ["fixture-big"] });
			const taken = play(start, "activate fixture-mind > fixture-big", "pass", "pass", "place 2");
			const big = idOf(taken, "fixture-big");
			expect(taken.cards[big]).toMatchObject({ controller: "you", owner: "rival" });
			const summoned = play(untilOffered(taken, summon), summon, "choose fixture-filler", "place 5", "pass", "pass");
			const gone = play(playEffect(summoned, card, BANISH, "fixture-big"), "pass", "pass");
			expect(gone.cards[big]!.zone).toBe("banished");
			// This turn's End Phase gives nothing back (the monster is banished); in the opponent's End Phase it returns to the player who banished it, then to its owner.
			const theirEnd = toPhase(gone, "end", 4);
			const asked = play(theirEnd, "pass", `apply ${card}`, "place 1");
			expect(asked.asking).toMatchObject({ player: "rival" });
			const back = play(asked, "place 2");
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "rival", slot: 2 });
		});
	});

	describe("the second effect: gain 1000 ATK, then send a card", () => {
		it(`${cites("sky-striker-ace-zeke", "gain")} ${cites("sky-striker-ace-zeke", "notes-gain-ignition")} once per turn it targets 1 other card the player controls (a monster, a Spell or Trap Card, face-up or face-down, not itself and not the opponent's), gains 1000 ATK, then sends it to the Graveyard`, () => {
			const duel = onField({ facedown: ["fixture-normal"], set: ["fixture-trap"], faceupSpells: ["fixture-ss-spell"] }, { monsters: ["fixture-big"] });
			expect(effectsOffered(duel, card)).toEqual([GAIN]);
			expect(offered(duel).filter((label) => label.startsWith(`activate ${card}`)).sort()).toEqual([`activate ${card} > fixture-filler`, `activate ${card} > fixture-normal`, `activate ${card} > fixture-ss-spell`, `activate ${card} > fixture-trap`]);
			const zeke = idOf(duel, card);
			expect(atk(duel, zeke)).toBe(1500);
			const done = play(playEffect(duel, card, GAIN, "fixture-filler"), "pass", "pass");
			expect(atk(done, zeke)).toBe(2500);
			expect(find(done, "fixture-filler").zone).toBe("graveyard");
			// Once per turn.
			expect(effectsOffered(done, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-zeke", "notes-gain-resolution")} when this card is no longer in the Monster Zone at resolution the ATK is not gained and the card is not sent`, () => {
			const duel = onField({}, { set: ["fixture-trap-destroy"] });
			const chained = playEffect(duel, card, GAIN, "fixture-filler");
			const done = play(chained, "activate fixture-trap-destroy > sky-striker-ace-zeke", "pass", "pass");
			expect(find(done, card).zone).toBe("graveyard");
			expect(find(done, "fixture-filler").zone).toBe("monster");
		});
		it(`${cites("sky-striker-ace-zeke", "notes-gain-resolution")} a target that is no longer there stops the whole effect: no ATK is gained`, () => {
			const duel = onField({}, { set: ["fixture-trap-destroy"] });
			const chained = playEffect(duel, card, GAIN, "fixture-filler");
			const done = play(chained, "activate fixture-trap-destroy > fixture-filler", "pass", "pass");
			expect(atk(done, idOf(done, card))).toBe(1500);
		});
		it(`${cites("sky-striker-ace-zeke", "notes-gain-not-simultaneous")} the ATK is gained first and stays when the card cannot be sent (it is unaffected by the effect)`, () => {
			const duel = onField({ monsters: ["fixture-unaffected"] });
			const done = play(playEffect(duel, card, GAIN, "fixture-unaffected"), "pass", "pass");
			expect(atk(done, idOf(done, card))).toBe(2500);
			expect(find(done, "fixture-unaffected").zone).toBe("monster");
		});
		it(`${cites("sky-striker-ace-zeke", "gain")} the lasting own gain stops under negation (core analogy, not a Zeke-specific ruling) and resumes afterwards`, () => {
			const duel = onField({ monsters: ["fixture-filler", "fixture-normal"] });
			const done = play(playEffect(duel, card, GAIN, "fixture-normal"), "pass", "pass");
			const zeke = idOf(done, card);
			expect(atk(done, zeke)).toBe(2500);
			const negated = negateCardEffects(done, zeke, done.turn.number);
			expect(atk(negated, zeke)).toBe(1500);
			expect(atk(nextTurn(negated, negated.turn.number + 2), zeke)).toBe(2500);
		});
		it(`${cites("sky-striker-ace-zeke", "gain")} the 1000 ATK stays: it is not a gain until the end of the turn`, () => {
			const duel = onField({ monsters: ["fixture-filler", "fixture-normal"] });
			const done = play(playEffect(duel, card, GAIN, "fixture-normal"), "pass", "pass");
			const later = nextTurn(done, done.turn.number + 2);
			expect(atk(later, idOf(later, card))).toBe(2500);
		});
	});
});
