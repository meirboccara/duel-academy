import { describe, expect, it } from "vitest";
import { act, actionName, askDeclare, askMay, askUpTo, ATTRIBUTES, cardNames, type CardDef, type Duel, findNamed, legalActions, moveCards, revealCards, targetGroupsOf, viewFor } from "../../src";
import { codes, offered, play, position } from "./fixtures";

/**
 * Choices at activation and at resolution (real-deck readiness, step 4 work): modes, declarations, optional and "up to N" picks,
 * coupled targets. Every card here is made up and named for what it shows.
 */

const logged = (log: string[], text: string) => (duel: Duel) => (log.push(text), duel);

/** "Activate 1 of these effects; ● log 'first' ● log 'second' (only while the rival controls a monster)." */
function modeCards(log: string[]): Record<string, CardDef> {
	const cards: CardDef[] = [
		{
			code: "two-ways",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					modes: [
						{ categories: ["first"], operation: logged(log, "first") },
						{ categories: ["second"], condition: (duel, { player }) => duel.piles[player === "you" ? "rival" : "you"].monster.length > 0, operation: logged(log, "second") },
					],
				},
			],
		},
		{ code: "monster", kind: "monster" },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

describe("modes chosen at activation", () => {
	it("lists one activation per mode whose own condition holds", () => {
		const defs = modeCards([]);
		expect(offered(position({ defs, you: { hand: ["two-ways"] } })).filter((label) => label.startsWith("activate"))).toEqual(["activate two-ways :0"]);
		expect(offered(position({ defs, you: { hand: ["two-ways"] }, rival: { monsters: ["monster"] } })).filter((label) => label.startsWith("activate"))).toEqual(["activate two-ways :0", "activate two-ways :1"]);
	});
	it("freezes the mode and its categories on the link, and resolves that mode even once its condition no longer holds", () => {
		const log: string[] = [];
		const defs = { ...modeCards(log), "clear-rival": { code: "clear-rival", kind: "quick-play", effects: [{ type: "activation", operation: (duel: Duel) => moveCards(duel, duel.piles.rival.monster, { zone: "graveyard" }) }] } satisfies CardDef };
		const start = position({ defs, options: { everyWindow: true }, you: { hand: ["two-ways"] }, rival: { monsters: ["monster"], set: ["clear-rival"] } });
		const activated = play(start, "activate two-ways :1");
		expect(activated.chain[0]).toMatchObject({ mode: 1, categories: ["second"] });
		const done = play(activated, "activate clear-rival", "pass", "pass");
		expect(done.chain).toEqual([]);
		expect(log).toEqual(["second"]);
	});
	it("refuses an activation that names no mode, an unknown mode, or a mode whose condition does not hold", () => {
		const defs = modeCards([]);
		const start = position({ defs, you: { hand: ["two-ways"] } });
		const card = start.piles.you.hand[0]!;
		for (const mode of [undefined, 1, 2]) expect(() => act(start, { type: "activate", card, effect: 0, targets: [], ...(mode === undefined ? {} : { mode }) })).toThrow();
		expect(legalActions(start).some((action) => action.type === "activate" && action.mode === 0)).toBe(true);
	});
	it("names a mode in the bot's move names (\"activate two-ways :2\" for the second, 1-based)", () => {
		const defs = modeCards([]);
		const start = position({ defs, you: { hand: ["two-ways"] }, rival: { monsters: ["monster"] } });
		expect(legalActions(start).map((action) => actionName(start, action)).filter((name) => name.startsWith("activate")).sort()).toEqual(["activate two-ways :1", "activate two-ways :2"]);
		expect(findNamed(start, "activate two-ways :2")).toMatchObject({ mode: 1 });
	});
});

/** "Declare 1 Attribute; log it" (at activation), and "declare 1 Level from 1 to 3; log it" (when it resolves). */
function declarationCards(log: string[]): Record<string, CardDef> {
	const cards: CardDef[] = [
		{
			code: "name-an-attribute",
			kind: "quick-play",
			effects: [{ type: "activation", declare: () => ATTRIBUTES.map((value) => ({ kind: "attribute", value })), operation: (duel, link) => (log.push(`declared ${link.declared?.value}`), duel) }],
		},
		{
			code: "name-a-level-later",
			kind: "spell",
			effects: [{ type: "activation", operation: (duel, link) => askDeclare(duel, link.player, [1, 2, 3].map((value) => ({ kind: "level", value })), (board, declared) => (log.push(`level ${declared.value}`), board)) }],
		},
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

describe("declarations", () => {
	it("at activation: one action per value that may be declared, the value frozen on the link and read when it resolves", () => {
		const log: string[] = [];
		const start = position({ defs: declarationCards(log), options: { everyWindow: true }, you: { hand: ["name-an-attribute"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["DARK", "DIVINE", "EARTH", "FIRE", "LIGHT", "WATER", "WIND"].map((value) => `activate name-an-attribute =${value}`));
		const activated = play(start, "activate name-an-attribute =FIRE");
		expect(activated.chain[0]!.declared).toEqual({ kind: "attribute", value: "FIRE" });
		play(activated, "pass", "pass");
		expect(log).toEqual(["declared FIRE"]);
		// The bot's move names say what is declared.
		expect(findNamed(start, "activate name-an-attribute =WIND")).toMatchObject({ declared: { kind: "attribute", value: "WIND" } });
	});
	it("when it resolves: the player declares through a `declare` action, and the effect goes on with it", () => {
		const log: string[] = [];
		const start = position({ defs: declarationCards(log), you: { hand: ["name-a-level-later"] } });
		const asked = play(start, "activate name-a-level-later");
		expect(legalActions(asked)).toEqual([1, 2, 3].map((value) => ({ type: "declare", declaration: { kind: "level", value } })));
		const done = act(asked, { type: "declare", declaration: { kind: "level", value: 2 } });
		expect(log).toEqual(["level 2"]);
		expect(done.asking).toBeNull();
		expect(() => act(asked, { type: "declare", declaration: { kind: "level", value: 4 } })).toThrow();
	});
	it("reveals a card as a cost: listing the activation reveals nothing, activating it reveals the card to both players", () => {
		const defs: Record<string, CardDef> = {
			"show-a-monster": {
				code: "show-a-monster",
				kind: "spell",
				effects: [{ type: "activation", cost: { pick: (duel, { player }) => duel.piles[player].hand.filter((id) => duel.cards[id]!.code === "monster").map((id) => [id]), pay: (duel, { player }, picked) => revealCards(duel, player, picked) }, operation: (duel) => duel }],
			},
			monster: { code: "monster", kind: "monster" },
		};
		const start = position({ defs, options: { everyWindow: true }, you: { hand: ["show-a-monster", "monster"] } });
		const shown = start.piles.you.hand[1]!;
		expect(offered(start)).toContain("activate show-a-monster ~ monster");
		expect(viewFor(start, "rival").duel.cards[shown]!.code).toBe("?");
		const activated = play(start, "activate show-a-monster ~ monster");
		expect(viewFor(activated, "rival").duel.cards[shown]!.code).toBe("monster");
	});
	it("lists the printed card names of the cards in the duel's definitions, for \"declare 1 card name\"", () => {
		const defs: Record<string, CardDef> = { a: { code: "a", kind: "monster", facts: { name: "Zeta" } }, b: { code: "b", kind: "spell", facts: { name: "Alpha" } }, c: { code: "c", kind: "monster" } };
		expect(cardNames(position({ defs }))).toEqual(["Alpha", "Zeta"]);
	});
});

/**
 * "Send up to 2 monsters from your Deck to the GY" (sends nothing, 1 or 2: one at a time, `pass` to stop), "send 1 or 2" (at least 1),
 * and "draw 1 card, then you can send 1 card from your hand to the GY" (yes: choose the card itself; no: pass).
 */
function resolutionCards(log: string[]): Record<string, CardDef> {
	const monstersInDeck = (duel: Duel, side: "you" | "rival") => duel.piles[side].deck.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster");
	const send = (code: string, count: { min: number; max: number }): CardDef => ({
		code,
		kind: "spell",
		effects: [{ type: "activation", operation: (duel, link) => askUpTo(duel, link.player, monstersInDeck(duel, link.player), count, (board, picked) => (log.push(`${code} sends ${picked.map((id) => board.cards[id]!.code).join(",") || "nothing"}`), moveCards(board, picked, { zone: "graveyard" }))) }],
	});
	const cards: CardDef[] = [
		send("send-up-to-two", { min: 0, max: 2 }),
		send("send-one-or-two", { min: 1, max: 2 }),
		{
			code: "draw-then-may-discard",
			kind: "spell",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
						const drawn = moveCards(duel, duel.piles[link.player].deck.slice(0, 1), { zone: "hand" });
						return askMay(drawn, link.player, link.card.id, (board) => (log.push("discards"), moveCards(board, board.piles[link.player].hand.slice(0, 1), { zone: "graveyard" })));
					},
				},
			],
		},
		{ code: "monster-a", kind: "monster" },
		{ code: "monster-b", kind: "monster" },
		{ code: "monster-c", kind: "monster" },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

describe("optional and \"up to N\" choices at resolution", () => {
	const deck = ["monster-a", "monster-b", "monster-c"];
	it("\"up to 2\": the cards are picked one after another, the player may stop after any of them, and may decline from the start", () => {
		const log: string[] = [];
		const defs = resolutionCards(log);
		const asked = play(position({ defs, you: { hand: ["send-up-to-two"], deck } }), "activate send-up-to-two");
		expect(offered(asked)).toEqual(["choose monster-a", "choose monster-b", "choose monster-c", "pass"]);
		const one = play(asked, "choose monster-b");
		// The card picked is not offered again; the player may stop now.
		expect(offered(one)).toEqual(["choose monster-a", "choose monster-c", "pass"]);
		play(one, "choose monster-c");
		play(one, "pass");
		play(asked, "pass");
		expect(log).toEqual(["send-up-to-two sends monster-b,monster-c", "send-up-to-two sends monster-b", "send-up-to-two sends nothing"]);
	});
	it("\"1 or 2\": the player cannot stop before the first card", () => {
		const log: string[] = [];
		const asked = play(position({ defs: resolutionCards(log), you: { hand: ["send-one-or-two"], deck } }), "activate send-one-or-two");
		expect(offered(asked)).toEqual(["choose monster-a", "choose monster-b", "choose monster-c"]);
		const done = play(asked, "choose monster-a", "pass");
		expect(codes(done, "you", "graveyard")).toContain("monster-a");
		expect(log).toEqual(["send-one-or-two sends monster-a"]);
	});
	it("with fewer candidates than the minimum, takes them all without asking; with none, goes on with nothing", () => {
		const log: string[] = [];
		const defs = resolutionCards(log);
		play(position({ defs, you: { hand: ["send-one-or-two"], deck: ["monster-a"] } }), "activate send-one-or-two");
		const done = play(position({ defs, you: { hand: ["send-one-or-two"] } }), "activate send-one-or-two");
		expect(done.asking).toBeNull();
		expect(log).toEqual(["send-one-or-two sends monster-a", "send-one-or-two sends nothing"]);
	});
	it("\"you can\": the player accepts by choosing the card whose effect it is, or declines with pass", () => {
		const log: string[] = [];
		const asked = play(position({ defs: resolutionCards(log), you: { hand: ["draw-then-may-discard"], deck: ["monster-a"] } }), "activate draw-then-may-discard");
		expect(offered(asked)).toEqual(["choose draw-then-may-discard", "pass"]);
		const declined = play(asked, "pass");
		expect(codes(declined, "you", "hand")).toEqual(["monster-a"]);
		const accepted = play(asked, "choose draw-then-may-discard");
		expect(codes(accepted, "you", "hand")).toEqual([]);
		expect(log).toEqual(["discards"]);
	});
});

/** "Target 1 monster you control and 1 monster your opponent controls", and "target up to 2 monsters and the same number of Spells/Traps your opponent controls". */
function coupledCards(log: string[]): Record<string, CardDef> {
	const named = (duel: Duel, groups: readonly (readonly { code: string }[])[]) => groups.map((group) => group.map((card) => card.code).join("+")).join(" | ");
	const cards: CardDef[] = [
		{
			code: "one-each-side",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					targetGroups: (duel, { player }) => [{ from: duel.piles[player].monster, min: 1, max: 1 }, { from: duel.piles[player === "you" ? "rival" : "you"].monster, min: 1, max: 1 }],
					operation: (duel, link) => (log.push(named(duel, targetGroupsOf(duel, link))), duel),
				},
			],
		},
		{
			code: "same-number",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					targetGroups: (duel) => [{ from: duel.piles.rival.monster, min: 1, max: 2 }, { from: duel.piles.rival.spell, min: 1, max: 2 }],
					sameCount: true,
					operation: (duel, link) => (log.push(named(duel, targetGroupsOf(duel, link))), duel),
				},
			],
		},
		// Two groups over the same candidates: "target up to 2 monsters for the first part, and up to 2 for the second".
		{
			code: "overlap",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					targetGroups: (duel) => [{ from: duel.piles.rival.monster, min: 0, max: 2 }, { from: duel.piles.rival.monster, min: 0, max: 2 }],
					operation: (duel, link) => (log.push(named(duel, targetGroupsOf(duel, link))), duel),
				},
			],
		},
		// "Target cards equal to the number of ..." with groups built from the board: none on an empty board.
		{ code: "from-board", kind: "quick-play", effects: [{ type: "activation", targetGroups: () => [], sameCount: true, operation: (duel) => duel }] },
		{ code: "mine", kind: "monster" },
		{ code: "theirs-a", kind: "monster" },
		{ code: "theirs-b", kind: "monster" },
		{ code: "set-a", kind: "trap", effects: [{ type: "activation", operation: (duel) => duel }] },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

describe("coupled targets", () => {
	it("\"1 on each side\": one target from each group, no combination that takes two from one side", () => {
		const log: string[] = [];
		const start = position({ defs: coupledCards(log), you: { hand: ["one-each-side"], monsters: ["mine"] }, rival: { monsters: ["theirs-a", "theirs-b"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["activate one-each-side > mine > theirs-a {1,1}", "activate one-each-side > mine > theirs-b {1,1}"]);
		play(start, "activate one-each-side > mine > theirs-b {1,1}");
		expect(log).toEqual(["mine | theirs-b"]);
		// Not offered with no monster of your own.
		expect(offered(position({ defs: coupledCards([]), you: { hand: ["one-each-side"] }, rival: { monsters: ["theirs-a"] } })).filter((label) => label.startsWith("activate"))).toEqual([]);
	});
	it("\"the same number\": as many from one group as from the other, never unequal", () => {
		const log: string[] = [];
		const start = position({ defs: coupledCards(log), you: { hand: ["same-number"] }, rival: { monsters: ["theirs-a", "theirs-b"], set: ["set-a"] } });
		expect(offered(start).filter((label) => label.startsWith("activate"))).toEqual(["activate same-number > theirs-a > set-a {1,1}", "activate same-number > theirs-b > set-a {1,1}"]);
		const card = start.piles.you.hand[0]!;
		const [a, b] = start.piles.rival.monster;
		const set = start.piles.rival.spell[0]!;
		expect(() => act(start, { type: "activate", card, effect: 0, targets: [a!, b!, set] })).toThrow();
		play(start, "activate same-number > theirs-b > set-a {1,1}", "pass");
		expect(log).toEqual(["theirs-b | set-a"]);
	});
	it("drops a target that moved from its group, keeping the others where they were", () => {
		const log: string[] = [];
		const start = position({ defs: coupledCards(log), options: { everyWindow: true }, you: { hand: ["one-each-side"], monsters: ["mine"] }, rival: { monsters: ["theirs-a"] } });
		const activated = play(start, "activate one-each-side > mine > theirs-a {1,1}");
		expect(activated.chain[0]!.targetGroups).toEqual([1, 1]);
		// Your monster goes back to the hand while the link waits: it is a new card, no longer a target.
		const moved = moveCards(activated, activated.piles.you.monster, { zone: "hand" });
		expect(targetGroupsOf(moved, moved.chain[0]!).map((group) => group.map((card) => card.code))).toEqual([[], ["theirs-a"]]);
	});
	// Review: two splits of the same cards between groups are two different choices; each action says its split.
	it("tells apart two splits of the same targets between groups, and resolves the split chosen", () => {
		const log: string[] = [];
		const start = position({ defs: coupledCards(log), you: { hand: ["overlap"] }, rival: { monsters: ["theirs-a", "theirs-b"] } });
		const labels = offered(start).filter((label) => label.startsWith("activate overlap > theirs-a > theirs-b"));
		expect(labels).toEqual(["activate overlap > theirs-a > theirs-b {0,2}", "activate overlap > theirs-a > theirs-b {1,1}", "activate overlap > theirs-a > theirs-b {2,0}"]);
		expect(new Set(offered(start)).size).toBe(offered(start).length);
		play(start, "activate overlap > theirs-a > theirs-b {1,1}", "pass");
		expect(log).toEqual(["theirs-a | theirs-b"]);
	});
	it("lists nothing, and does not crash, when the groups built from the board are none", () => {
		const start = position({ defs: coupledCards([]), you: { hand: ["from-board"] } });
		expect(() => legalActions(start)).not.toThrow();
	});
});

describe("record-level fields an effect with modes would ignore (review)", () => {
	it("refuses categories, targetGroups or sameCount on the record of an effect with modes", () => {
		const bad: CardDef = { code: "bad-modes", kind: "spell", effects: [{ type: "activation", categories: ["destroy"], modes: [{ operation: (duel) => duel }] }] };
		const start = position({ defs: { "bad-modes": bad }, you: { hand: ["bad-modes"] } });
		expect(() => legalActions(start)).toThrow(/modes/);
	});
});

describe("declarations and the bot view (review)", () => {
	it("does not reveal cards whose ids happen to equal the option numbers while a player declares", () => {
		const defs: Record<string, CardDef> = { secret: { code: "secret", kind: "monster" } };
		const start = position({ defs, rival: { hand: ["secret", "secret", "secret"] } });
		const asked = askDeclare(start, "you", ATTRIBUTES.map((value) => ({ kind: "attribute" as const, value })), (duel) => duel);
		const view = viewFor(asked, "you");
		for (const id of start.piles.rival.hand) expect(view.duel.cards[id]!.code).toBe("?");
	});
});
