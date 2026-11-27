import { describe, expect, it } from "vitest";
import { addModifier, ask, askSpecialSummon, CARD_DEFS, type CardDef, cites, type Duel, moveCards, printedFacts, targetsOf } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { nextTurn as passUntil, toPhase } from "../rules/continuous-fixtures";
import { codes, lastingLines, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "blue-eyes-white-dragon-the-white-phantom-beast";
const gaps = gapCards();
const inert = (duel: Duel) => duel;
const aimed = (code: string, categories: string[]): CardDef => ({ code, kind: "quick-play", effects: [{ type: "activation", categories, target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => (targetsOf(duel, link), duel) }] });
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...Object.fromEntries(["fixture-giant", "fixture-smite"].map((code) => [code, gaps[code]!])),
	// A Normal Spell and a Quick-Play Spell: "Add the top card of your Deck to your hand."
	"fixture-tutor": { code: "fixture-tutor", kind: "spell", effects: [{ type: "activation", categories: ["search"], operation: (duel, link) => moveCards(duel, duel.piles[link.player].deck.slice(0, 1), { zone: "hand" }) }] },
	"fixture-tutor-quick": { code: "fixture-tutor-quick", kind: "quick-play", effects: [{ type: "activation", categories: ["search"], operation: (duel, link) => moveCards(duel, duel.piles[link.player].deck.slice(0, 1), { zone: "hand" }) }] },
	// A Normal Spell that does nothing.
	"fixture-noop-spell": { code: "fixture-noop-spell", kind: "spell", effects: [{ type: "activation", operation: inert }] },
	// Normal Spells: "Special Summon 1 monster from your hand" / "from your GY".
	"fixture-revive-hand": { code: "fixture-revive-hand", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].hand.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster"), (board, picked) => askSpecialSummon(board, link.player, picked)) }] },
	"fixture-revive-gy": { code: "fixture-revive-gy", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster"), (board, picked) => askSpecialSummon(board, link.player, picked)) }] },
	// Quick-Play Spells that target 1 monster on the field: one that does nothing, one that changes ATK.
	"fixture-targeter": aimed("fixture-targeter", []),
	"fixture-weaken-quick": aimed("fixture-weaken-quick", ["change-atk"]),
	// A Quick-Play Spell: "Reveal 1 card in your hand" (a cost of its own, to show the same card again in the same Chain).
	"fixture-revealer": { code: "fixture-revealer", kind: "quick-play", effects: [{ type: "activation", cost: { pick: (duel, { player, card: self }) => duel.piles[player].hand.filter((id) => id !== self.id).map((id) => [id]), pay: (duel) => duel }, operation: inert }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const mine = (duel: Duel): Duel => (duel.priority.holder === "you" ? duel : play(duel, "pass"));
/** Resolves the chain and answers the questions of the effect with the first offer, stopping at anything else (a trigger offered, the open state). */
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
/** Passes until the opening of the trigger window offers `label`, at most a few times. */
const untilOffered = (duel: Duel, label: string): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12 && !offered(next).some((entry) => entry.startsWith(label)); guard++) next = play(next, "pass");
	return next;
};
/** Passes step by step (only when the player is the one to act, the other's windows too), and says whether `label` was offered to the player at any moment. */
const everOffered = (duel: Duel, label: string, passes = 16): boolean => {
	let next = duel;
	for (let guard = 0; guard < passes; guard++) {
		if (next.priority.holder === "you" && offered(next).some((entry) => entry.startsWith(label))) return true;
		next = play(next, "pass");
	}
	return false;
};
const PHANTOM = card;

describe("Blue-Eyes White Dragon, the White Phantom Beast, written as effect records", () => {
 it(`${cites("ash-blossom-joyous-spring", "qa-discard-while-banished-instead")} can pay its discard to negate a targeting effect under a GY-to-banish replacement`, () => {
  const start = board({ monsters: [card], hand: ["fixture-normal-4"] }, { hand: ["fixture-targeter"], monsters: ["fixture-effect-4"] }, { everyWindow: true }, "rival");
  const replaced = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
  const aimed = mine(play(replaced, `activate fixture-targeter > ${card}`));
  const paid = play(aimed, `activate ${card} ~ fixture-normal-4`);
  expect(codes(paid, "you", "banished")).toEqual(["fixture-normal-4"]);
  expect(paid.chain.map((link) => link.card.code)).toEqual(["fixture-targeter", card]);
 });
	it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "facts")} is a LIGHT Dragon Effect Monster of Level 8 with 3000 ATK and 2500 DEF`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Blue-Eyes White Dragon, the White Phantom Beast", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, archetypes: ["Blue-Eyes"], mentions: ["Blue-Eyes White Dragon, the White Phantom Beast"] });
	});

	describe("its Special Summon from the hand", () => {
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "summon")} ${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-summon-hand")} reveals itself when it is added from the Deck to the hand and Special Summons itself, as a Trigger Effect of the hand`, () => {
			const start = board({ hand: ["fixture-tutor"], deck: [PHANTOM] });
			const added = settle(play(start, "activate fixture-tutor"));
			expect(own(added, `activate ${card}`)).toEqual([`activate ${card}`]);
			const chained = play(added, `activate ${card}`);
			// Revealed as the cost, in the hand; the Special Summon is its effect.
			expect(chained.chain.map((link) => [link.card.code, link.card.zone])).toEqual([[card, "hand"]]);
			expect(chained.revealed.map((entry) => entry.id)).toContain(find(chained, card).id);
			const done = settle(chained);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", specialSummoned: true });
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "summon")} is offered for a card drawn, as a draw adds a card from the Deck`, () => {
			const start = board({ hand: ["pot-of-greed"], deck: [PHANTOM, "fixture-normal-4", "fixture-normal-6"] });
			const drawn = settle(play(start, "activate pot-of-greed"));
			expect(own(drawn, `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-added-immediately")} can be activated only right after it was added from the Deck: not when another Chain Link follows the one that added it`, () => {
			const start = board({ hand: ["fixture-noop-spell", "fixture-tutor-quick"], deck: [PHANTOM] });
			const link1 = play(start, "activate fixture-noop-spell");
			// The Quick-Play Spell is Chain Link 2: it adds the card, then Chain Link 1 resolves.
			const done = settle(play(link1, "activate fixture-tutor-quick"));
			expect(codes(done, "you", "hand")).toEqual([card]);
			expect(own(done, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "summon")} ${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-summon-damage-step")} is offered when a monster the player controls is destroyed by battle, in the Damage Step, and not for a monster destroyed by an effect, nor for the opponent's`, () => {
			const start = board({ hand: [card], monsters: ["fixture-normal-4"] }, { monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, "attack fixture-giant > fixture-normal-4");
			const trigger = untilOffered(toStep(declared, "end"), `activate ${card}`);
			expect(trigger.battle).not.toBeNull();
			expect(codes(trigger, "you", "graveyard")).toEqual(["fixture-normal-4"]);
			expect(own(mine(trigger), `activate ${card}`)).toEqual([`activate ${card}`]);
			// Destroyed by a card effect: no.
			const smitten = settle(play(board({ hand: [card, "fixture-smite"], monsters: ["fixture-normal-4"] }), "activate fixture-smite > fixture-normal-4"));
			expect(own(smitten, `activate ${card}`)).toEqual([]);
			// The opponent's monster destroyed by battle: no.
			const theirs = board({ hand: [card], monsters: ["fixture-giant"] }, { monsters: ["fixture-normal-4"] }, { everyWindow: true });
			const attacked = play({ ...theirs, turn: { ...theirs.turn, phase: "battle" } }, "attack fixture-giant > fixture-normal-4");
			expect(everOffered(attacked, `activate ${card}`)).toBe(false);
			let after = attacked;
			for (let guard = 0; guard < 12 && codes(after, "rival", "graveyard").length === 0; guard++) after = play(after, "pass");
			expect(codes(after, "rival", "graveyard")).toEqual(["fixture-normal-4"]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "qa-reveal-again")} lets the card it revealed be revealed again for another effect in the same Chain`, () => {
			const start = board({ hand: ["fixture-tutor", "fixture-revealer"], deck: [PHANTOM] });
			const chained = play(settle(play(start, "activate fixture-tutor")), `activate ${card}`);
			expect(own(chained, "activate fixture-revealer")).toEqual([`activate fixture-revealer ~ ${card}`]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "once")} lets each of the first two effects be used once per turn, by name: the Special Summon from the hand a second time in a turn is not offered`, () => {
			const start = board({ hand: ["fixture-tutor", "fixture-tutor"], deck: [PHANTOM, PHANTOM] });
			const summoned = settle(play(settle(play(start, "activate fixture-tutor")), `activate ${card}`));
			expect(find(summoned, card).zone).toBe("monster");
			// The destroying trigger is the second effect: it is not the one used.
			const second = settle(play(play(summoned, "pass"), "activate fixture-tutor"));
			expect(codes(second, "you", "hand")).toEqual([card]);
			expect(own(second, `activate ${card}`).filter((label) => !label.includes("pass"))).toEqual([]);
		});
	});

	describe("its destroying effect", () => {
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "destroy")} ${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-destroy-field")} destroys all monsters the opponent controls when it is Special Summoned from the hand or the Deck, and leaves the player's own`, () => {
			const start = board({ hand: ["fixture-revive-hand", card], monsters: ["fixture-normal-4"] }, { monsters: ["fixture-effect-4", "fixture-other-dragon"] });
			const summoned = settle(play(start, "activate fixture-revive-hand"));
			expect(own(summoned, `activate ${card}`)).toEqual([`activate ${card}`]);
			const done = settle(play(summoned, `activate ${card}`));
			expect(codes(done, "rival", "monster")).toEqual([]);
			expect(codes(done, "rival", "graveyard").sort()).toEqual(["fixture-effect-4", "fixture-other-dragon"]);
			expect(codes(done, "you", "monster").sort()).toEqual(["fixture-normal-4", card].sort());
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "destroy")} is not offered when it is Special Summoned from the Graveyard`, () => {
			const start = board({ hand: ["fixture-revive-gy"], graveyard: [card] }, { monsters: ["fixture-effect-4"] });
			const summoned = settle(play(start, "activate fixture-revive-gy"));
			expect(find(summoned, card).zone).toBe("monster");
			expect(own(summoned, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "lock")} ${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-lock-applied")} lets only "Blue-Eyes" monsters attack directly for the rest of the turn, even when nothing was destroyed`, () => {
			const start = board({ hand: ["fixture-revive-hand", card], monsters: ["fixture-normal-4", "fixture-blue-eyes-normal"] });
			const summoned = settle(play(start, "activate fixture-revive-hand"));
			const done = settle(play(summoned, `activate ${card}`));
			expect(lastingLines(done).join("\n")).toContain('you cannot attack directly except with "Blue-Eyes" monsters');
			const battle = toPhase(play(done, "pass"), "battle");
			const attacks = offered(battle).filter((label) => label.startsWith("attack"));
			// With no monster on the opponent's side every monster could attack directly: only the "Blue-Eyes" ones can.
			expect(attacks.sort()).toEqual([`attack ${card} directly`, "attack fixture-blue-eyes-normal directly"].sort());
			// Without the effect, the Normal Monster could too.
			const free = toPhase(board({ monsters: ["fixture-normal-4", "fixture-blue-eyes-normal"] }), "battle");
			expect(offered(free).filter((label) => label.startsWith("attack")).sort()).toEqual(["attack fixture-blue-eyes-normal directly", "attack fixture-normal-4 directly"]);
		});
	});

	describe("its negating effect", () => {
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "negate")} ${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-negate-chain")} discards 1 card to negate a card or effect that targets it on the field, chained directly to it, and not for one that targets another monster`, () => {
			const start = board({ monsters: [card], hand: ["fixture-normal-4", "fixture-normal-6"] }, { hand: ["fixture-targeter"], monsters: ["fixture-effect-4"] }, { everyWindow: true }, "rival");
			const aimedAtIt = mine(play(start, `activate fixture-targeter > ${card}`));
			expect(own(aimedAtIt, `activate ${card}`)).toEqual([`activate ${card} ~ fixture-normal-4`, `activate ${card} ~ fixture-normal-6`]);
			const negated = play(aimedAtIt, `activate ${card} ~ fixture-normal-4`);
			expect(codes(negated, "you", "graveyard")).toEqual(["fixture-normal-4"]);
			expect(negated.chain.map((link) => link.card.code)).toEqual(["fixture-targeter", card]);
			let done = negated;
			for (let guard = 0; guard < 6 && done.chain.length > 0; guard++) done = play(done, "pass");
			expect(done.chain).toEqual([]);
			// Aimed at another monster: nothing to negate for the Dragon.
			const elsewhere = mine(play(start, "activate fixture-targeter > fixture-effect-4"));
			expect(own(elsewhere, `activate ${card}`)).toEqual([]);
			// With no card in the hand to discard it cannot be activated.
			const empty = board({ monsters: [card] }, { hand: ["fixture-targeter"] }, { everyWindow: true }, "rival");
			expect(own(mine(play(empty, `activate fixture-targeter > ${card}`)), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-negate-repeat")} can be activated several times in the same Chain`, () => {
			const start = board({ monsters: [card], hand: ["fixture-normal-4", "fixture-normal-6"] }, { hand: ["fixture-targeter", "fixture-targeter"] }, { everyWindow: true }, "rival");
			const first = mine(play(start, `activate fixture-targeter > ${card}`));
			const negate1 = play(first, `activate ${card} ~ fixture-normal-4`);
			// The opponent aims a second card at it in answer: it can be negated again in that Chain.
			const second = mine(play(negate1.priority.holder === "rival" ? negate1 : play(negate1, "pass"), `activate fixture-targeter > ${card}`));
			expect(own(second, `activate ${card}`)).toEqual([`activate ${card} ~ fixture-normal-6`]);
		});
		it(`${cites("blue-eyes-white-dragon-the-white-phantom-beast", "notes-negate-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = board({ monsters: [card], hand: ["fixture-normal-4"] }, { hand: ["fixture-weaken-quick"], monsters: ["fixture-giant"] }, { everyWindow: true }, "rival");
			const declared = play({ ...start, turn: { ...start.turn, phase: "battle" } }, `attack fixture-giant > ${card}`);
			const inStep = toStep(declared, "start");
			const rivalActs = inStep.priority.holder === "rival" ? inStep : play(inStep, "pass");
			const aimedAtIt = mine(play(rivalActs, `activate fixture-weaken-quick > ${card}`));
			expect(own(aimedAtIt, `activate ${card}`)).toEqual([]);
			expect(offered(aimedAtIt)).toContain("pass");
		});
	});
});
