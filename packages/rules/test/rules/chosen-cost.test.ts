import { describe, expect, it } from "vitest";
import { act, actionName, type CardDef, chooseAction, cites, type Duel, findNamed, HIDDEN, legalActions, moveCards, targetsOf, viewFor } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const EXTRA = ["a", "b", "c", "d", "e", "f", "g"].map((letter) => `fixture-extra-${letter}`);
const board = (you: SideSpec, log: string[] = [], rival: SideSpec = {}): Duel => position({ defs: gapCards(log), you, rival });

/** Made-up cards for the review of the chosen cost: each is shaped like the printed clause it stands for. */
function reviewCards(log: string[]): Record<string, CardDef> {
	const cards: CardDef[] = [
		// A Normal Spell: "Banish 1 card from your hand; [log]." Its candidates are written without leaving the card itself out.
		{ code: "fixture-pot-hand", kind: "spell", effects: [{ type: "activation", cost: { choose: { from: (duel, { player }) => duel.piles[player].hand, counts: [1] }, pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "banished" }) }, operation: (duel) => (log.push("fixture-pot-hand"), duel) }] },
		// Normal Spells: "Send 1 (or 2) monster(s) you control to the GY; target 1 monster on the field; [log it]."
		...([1, 2] as const).map((count): CardDef => ({
			code: `fixture-offering-${count}`,
			kind: "spell",
			effects: [
				{
					type: "activation",
					cost: { choose: { from: (duel, { player }) => duel.piles[player].monster, counts: [count] }, pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }) },
					target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster],
					operation: (duel, link) => (log.push(`fixture-offering-${count} > ${targetsOf(duel, link).map((card) => card.code).join("+")}`), duel),
				},
			],
		})),
		// A Normal Spell: "Banish 1 card from your hand; [log]." Its cost refuses a Level 4 monster, though its candidates list every card.
		{ code: "fixture-picky", kind: "spell", effects: [{ type: "activation", cost: { choose: { from: (duel, { player, card }) => duel.piles[player].hand.filter((id) => id !== card.id), counts: [1] }, pay: (duel, _ctx, picked) => (picked.some((id) => duel.defs[duel.cards[id]!.code]?.facts?.level === 4) ? null : moveCards(duel, picked, { zone: "banished" })) }, operation: (duel) => (log.push("fixture-picky"), duel) }] },
	];
	return { ...gapCards(log), ...Object.fromEntries(cards.map((def) => [def.code, def])) };
}
const review = (you: SideSpec, log: string[] = [], rival: SideSpec = {}): Duel => position({ defs: reviewCards(log), you, rival });

/**
 * A cost over many cards of the player's choice ("Banish 3 or 6 cards of your choice from your Extra Deck, face-down; ..."):
 * `CostSpec.choose`. The activation is listed once per number of cards (`Action.pay`), not once per combination, and the cards are
 * then chosen one at a time before the card is activated. Pot of Prosperity (text, and Konami's Japanese notes, OCG only).
 */
describe("a cost of several cards chosen one at a time", () => {
	it(`${cites("rules", "chosen-cost-text")} the activation is listed once per number of cards the player can pay, not once per combination`, () => {
		expect(offered(board({ hand: ["fixture-pot"], extra: EXTRA }))).toEqual(["activate fixture-pot x3", "activate fixture-pot x6", "pass", "set fixture-pot"]);
		expect(offered(board({ hand: ["fixture-pot"], extra: EXTRA.slice(0, 5) }))).toEqual(["activate fixture-pot x3", "pass", "set fixture-pot"]);
		expect(offered(board({ hand: ["fixture-pot"], extra: EXTRA.slice(0, 2) }))).toEqual(["pass", "set fixture-pot"]);
	});
	it(`${cites("rules", "chosen-cost-text")} ${cites("rules", "chosen-cost-is-a-cost")} the player then chooses the cards one at a time; only then is the card activated, with exactly those cards paid`, () => {
		const log: string[] = [];
		const duel = board({ hand: ["fixture-pot"], extra: EXTRA }, log);
		const asked = play(duel, "activate fixture-pot x3");
		// Nothing is activated or paid yet: the card is still in the hand, and the player is asked for the first card.
		expect([asked.chain.length, codes(asked, "you", "hand"), asked.asking?.player]).toEqual([0, ["fixture-pot"], "you"]);
		expect(offered(asked)).toEqual(EXTRA.map((code) => `choose ${code}`));
		const second = play(asked, "choose fixture-extra-f");
		expect(offered(second)).toEqual(EXTRA.filter((code) => code !== "fixture-extra-f").map((code) => `choose ${code}`));
		const done = play(second, "choose fixture-extra-b", "choose fixture-extra-g");
		expect(log).toEqual(["fixture-pot 3"]);
		expect(codes(done, "you", "banished").sort()).toEqual(["fixture-extra-b", "fixture-extra-f", "fixture-extra-g"]);
		expect(codes(done, "you", "banished").length + codes(done, "you", "extra").length).toBe(7);
		expect(Object.values(done.cards).filter((card) => card.zone === "banished").every((card) => card.face === "down")).toBe(true);
		expect(done.activations.map((activation) => activation.card.code)).toEqual(["fixture-pot"]);
	});
	it(`${cites("rules", "chosen-cost-text")} with exactly as many cards as the number chosen, they are all taken without asking`, () => {
		const log: string[] = [];
		const done = play(board({ hand: ["fixture-pot"], extra: EXTRA.slice(0, 3) }, log), "activate fixture-pot x3");
		expect([log, done.asking, codes(done, "you", "extra")]).toEqual([["fixture-pot 3"], null, []]);
	});
	it(`${cites("rules", "chosen-cost-is-a-cost")} the opponent can answer only once the cost is paid, and sees face-down banished cards as hidden`, () => {
		const duel = board({ hand: ["fixture-pot"], extra: EXTRA.slice(0, 4) }, [], { set: ["fixture-negate-activation"] });
		const asked = play(duel, "activate fixture-pot x3");
		expect(asked.priority.holder).toBe("you");
		const paid = play(asked, "choose fixture-extra-a", "choose fixture-extra-b", "choose fixture-extra-c");
		expect([paid.chain.length, paid.priority.holder, offered(paid)]).toEqual([1, "rival", ["activate fixture-negate-activation", "pass"]]);
		const seen = viewFor(paid, "rival").duel;
		expect(seen.piles.you.banished.map((id) => seen.cards[id]!.code)).toEqual([HIDDEN, HIDDEN, HIDDEN]);
		// The cost stays paid when the activation is negated.
		const negated = play(paid, "activate fixture-negate-activation", "pass");
		expect(codes(negated, "you", "banished")).toHaveLength(3);
	});
	it(`${cites("rules", "chosen-cost-text")} targets are chosen with the activation and checked again once the cost is really paid; in a chain, the answer goes on the chain after the cost`, () => {
		const log: string[] = [];
		const duel = position({ defs: gapCards(log), turn: "rival", options: { everyWindow: true }, you: { hand: ["fixture-plain", "fixture-white"], set: ["fixture-pot-aimed"], graveyard: ["fixture-white-b"] }, rival: { hand: ["fixture-spell"] } });
		const chained = play(duel, "activate fixture-spell");
		expect(offered(chained)).toEqual(["activate fixture-pot-aimed x1 > fixture-white-b", "pass"]);
		const asked = play(chained, "activate fixture-pot-aimed x1 > fixture-white-b");
		expect(offered(asked)).toEqual(["choose fixture-plain", "choose fixture-white"]);
		const paid = play(asked, "choose fixture-white");
		expect([paid.chain.map((link) => link.card.code), codes(paid, "you", "banished"), paid.priority.holder]).toEqual([["fixture-spell", "fixture-pot-aimed"], ["fixture-white"], "rival"]);
		play(paid, "pass", "pass");
		expect(log).toEqual(["fixture-pot-aimed > fixture-white-b", "fixture-spell"]);
	});
	it("a card activated from the hand is not among the cards of its own cost: the candidates are read with the card placed, as the payment is", () => {
		const log: string[] = [];
		const asked = play(review({ hand: ["fixture-pot-hand", "fixture-plain", "fixture-white"] }, log), "activate fixture-pot-hand x1");
		expect(offered(asked)).toEqual(["choose fixture-plain", "choose fixture-white"]);
		// With one other card in the hand there is nothing to choose: it is paid at once.
		const done = play(review({ hand: ["fixture-pot-hand", "fixture-plain"] }, log), "activate fixture-pot-hand x1");
		expect([done.asking, codes(done, "you", "banished"), log]).toEqual([null, ["fixture-plain"], ["fixture-pot-hand"]]);
		// Alone in the hand it has nothing to pay with.
		expect(offered(review({ hand: ["fixture-pot-hand"] }))).toEqual(["pass", "set fixture-pot-hand"]);
	});
	it("a way is listed when some choice of cards pays, not only the first candidates: a target may be one of the candidates", () => {
		const duel = review({ hand: ["fixture-offering-1"], monsters: ["fixture-plain", "fixture-white"] }, [], { monsters: ["fixture-giant"] });
		expect(offered(duel).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-offering-1 x1 > fixture-giant", "activate fixture-offering-1 x1 > fixture-plain", "activate fixture-offering-1 x1 > fixture-white"]);
	});
	it("a count is listed when the first candidates cannot pay but others can, and only the cards that pay are offered", () => {
		const duel = review({ hand: ["fixture-picky", "fixture-plain", "fixture-white"] });
		expect(offered(duel)).toContain("activate fixture-picky x1");
		const done = play(duel, "activate fixture-picky x1");
		expect([done.asking, codes(done, "you", "banished"), codes(done, "you", "hand")]).toEqual([null, ["fixture-white"], ["fixture-plain"]]);
		// Nothing pays: the count is not listed.
		expect(offered(review({ hand: ["fixture-picky", "fixture-plain"] }))).not.toContain("activate fixture-picky x1");
	});
	it("a card that is a target of the activation is not offered as its cost: every card offered leaves the targets legal", () => {
		const log: string[] = [];
		const duel = review({ hand: ["fixture-offering-1"], monsters: ["fixture-plain", "fixture-white"] }, log, { monsters: ["fixture-giant"] });
		// The only card that can pay for a target on fixture-white is fixture-plain: it is taken without asking.
		const done = play(duel, "activate fixture-offering-1 x1 > fixture-white");
		expect([done.asking, codes(done, "you", "graveyard").sort(), codes(done, "you", "monster"), log]).toEqual([null, ["fixture-offering-1", "fixture-plain"], ["fixture-white"], ["fixture-offering-1 > fixture-white"]]);
		// A target that is not a candidate leaves both.
		expect(offered(play(duel, "activate fixture-offering-1 x1 > fixture-giant"))).toEqual(["choose fixture-plain", "choose fixture-white"]);
	});
	it("with several cards to pay, each pick is offered only while the rest can still be paid around the targets", () => {
		const log: string[] = [];
		const duel = review({ hand: ["fixture-offering-2"], monsters: ["fixture-plain", "fixture-white", "fixture-white-b", "fixture-white-c"] }, log);
		const asked = play(duel, "activate fixture-offering-2 x2 > fixture-white");
		expect(offered(asked)).toEqual(["choose fixture-plain", "choose fixture-white-b", "choose fixture-white-c"]);
		const second = play(asked, "choose fixture-white-c");
		expect(offered(second)).toEqual(["choose fixture-plain", "choose fixture-white-b"]);
		const done = play(second, "choose fixture-plain");
		expect([log, codes(done, "you", "graveyard").filter((code) => code !== "fixture-offering-2").sort()]).toEqual([["fixture-offering-2 > fixture-white"], ["fixture-plain", "fixture-white-c"]]);
		// Three monsters, one of them the target: the two others are the whole cost, taken without asking.
		const three = play(review({ hand: ["fixture-offering-2"], monsters: ["fixture-plain", "fixture-white", "fixture-white-b"] }), "activate fixture-offering-2 x2 > fixture-white");
		expect([three.asking, codes(three, "you", "graveyard").filter((code) => code !== "fixture-offering-2").sort()]).toEqual([null, ["fixture-plain", "fixture-white-b"]]);
	});
	it("the bot names the number of cards, and finds the action by that name", () => {
		const duel = board({ hand: ["fixture-pot"], extra: EXTRA });
		const names = legalActions(duel).map((action) => actionName(duel, action));
		expect(names).toContain("activate fixture-pot x3");
		expect(names).toContain("activate fixture-pot x6");
		expect(findNamed(duel, "activate fixture-pot x6")).toMatchObject({ type: "activate", pay: 6 });
	});
	it("the bot answers each question of the cost on its own (basic level), from its view of the Duel", () => {
		let duel = act(board({ hand: ["fixture-pot"], extra: EXTRA }), findNamed(board({ hand: ["fixture-pot"], extra: EXTRA }), "activate fixture-pot x3")!);
		for (let guard = 0; guard < 5 && duel.asking; guard++) duel = act(duel, chooseAction(duel, "you", { level: "basic", seed: 1 }));
		expect([duel.asking, codes(duel, "you", "banished").length]).toEqual([null, 3]);
	});
});
