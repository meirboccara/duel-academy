import { describe, expect, it } from "vitest";
import { addModifier, type Attribute, CARD_DEFS, type CardDef, cites, destroyCard, type Duel, effectDestruction, type EffectRecord, moveCards, moveCard, other, printedFacts } from "../../src";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { codes, lastingLines, offered, play, position, type SideSpec } from "../rules/fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { primiteFixtures } from "./primite-fixtures";

const card = "dominus-purge";
const gaps = gapCards();
/** "Add the top card of your Deck to your hand; destroy 1 monster your opponent controls": two parts, the first a search. */
const searchAndSmite: EffectRecord["operation"] = (duel, link) => {
	const added = moveCards(duel, duel.piles[link.player].deck.slice(0, 1), { zone: "hand" });
	const victim = added.piles[other(link.player)].monster[0];
	return victim === undefined ? added : destroyCard(added, victim, { destruction: effectDestruction(link) });
};
const discardItself: EffectRecord["cost"] = (duel, { card: self }) => moveCard(duel, self.id, { zone: "graveyard" });
const attributeMonster = (code: string, attribute: Attribute, effect: Partial<EffectRecord> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, attribute, monsterType: "Warrior", level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "ignition", operation: (duel) => duel, ...effect }] });
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	...primiteFixtures,
	// A Normal Spell: "Add the top card of your Deck to your hand; destroy 1 monster your opponent controls" (a search and something else).
	"fixture-searcher": { code: "fixture-searcher", kind: "spell", effects: [{ type: "activation", categories: ["search"], operation: searchAndSmite }] },
	// A monster with a Quick Effect on the field, and one in the hand (discarded as its cost), that do the same.
	"fixture-search-monster": { code: "fixture-search-monster", kind: "monster", facts: { name: "Fixture Search Monster", level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "quick", range: "field", categories: ["search"], operation: searchAndSmite }] },
	// A monster with a Quick Effect in the hand that costs nothing (it stays in the hand), and a Spell that adds a card whatever the lock.
	"fixture-hand-keeper": { code: "fixture-hand-keeper", kind: "monster", facts: { name: "Fixture Hand Keeper", level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "quick", range: "hand", categories: ["search"], operation: searchAndSmite }] },
	"fixture-hand-search": { code: "fixture-hand-search", kind: "monster", facts: { name: "Fixture Hand Search", level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "quick", range: "hand", categories: ["search"], cost: discardItself, operation: searchAndSmite }] },
	// A Normal Spell that adds nothing: "Destroy 1 monster your opponent controls."
	"fixture-bounce": gaps["fixture-bounce"]!,
	"fixture-smite-spell": { code: "fixture-smite-spell", kind: "spell", effects: [{ type: "activation", categories: ["destroy"], operation: (duel, link) => { const victim = duel.piles[other(link.player)].monster[0]; return victim === undefined ? duel : destroyCard(duel, victim, { destruction: effectDestruction(link) }); } }] },
	// Monsters of each Attribute with an Ignition Effect, and a DARK one with a Quick Effect.
	"fixture-dark-effect": attributeMonster("fixture-dark-effect", "DARK"),
	"fixture-water-effect": attributeMonster("fixture-water-effect", "WATER"),
	"fixture-fire-effect": attributeMonster("fixture-fire-effect", "FIRE"),
	"fixture-light-effect": attributeMonster("fixture-light-effect", "LIGHT"),
	"fixture-dark-quick": attributeMonster("fixture-dark-quick", "DARK", { type: "quick" }),
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const toMain = (duel: Duel, by: number): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};
/** Passes until the game state is open again (the chain is over; a quick effect that is still offered does not keep it closed). */
const reopen = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 4 && !next.priority.open; guard++) next = play(next, "pass");
	return next;
};
/** Passes until the chain is resolved, as the player who holds priority. */
const resolve = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 20 && (next.asking || next.chain.length > 0); guard++) next = play(next, offered(next).find((entry) => entry.startsWith("choose") || entry.startsWith("place")) ?? "pass");
	return next;
};
const TRAP = "fixture-primite-trap";
const THEIR_TURN = { everyWindow: true };
/** The rival plays `code` from the hand; the player to answer it holds priority. */
const answering = (duel: Duel, label: string): Duel => {
	const chained = play(duel, label);
	return chained.priority.holder === "you" ? chained : play(chained, "pass");
};

describe("Dominus Purge, written as effect records", () => {
	it(`${cites("dominus-purge", "facts")} is a Normal Trap`, () => {
		const duel = board({ hand: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Dominus Purge", mentions: ["Dominus Purge"] });
		expect(duel.defs[card]!.kind).toBe("trap");
	});

	describe("its activation from the hand", () => {
		it(`${cites("dominus-purge", "hand")} ${cites("dominus-purge", "notes-hand-not-effect")} can be activated from the hand while the opponent controls a card, and not while they control none (the Set card has no such condition)`, () => {
			// The rival discards a monster for a Quick Effect: it is then in the GY and the rival controls no card.
			const none = board({ hand: [card], deck: ["fixture-normal-4"] }, { hand: ["fixture-hand-search"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			expect(own(answering(none, "activate fixture-hand-search"), `activate ${card}`)).toEqual([]);
			// A Set copy answers all the same.
			const set = board({ set: [card], deck: ["fixture-normal-4"] }, { hand: ["fixture-hand-search"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			expect(own(answering(set, "activate fixture-hand-search"), `activate ${card}`)).toEqual([`activate ${card}`]);
			// With a card of the opponent on the field, from the hand too.
			const some = board({ hand: [card], deck: ["fixture-normal-4"] }, { hand: ["fixture-hand-search"], monsters: ["fixture-effect-4"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			expect(own(answering(some, "activate fixture-hand-search"), `activate ${card}`)).toEqual([`activate ${card}`]);
			const spell = board({ hand: [card], deck: ["fixture-normal-4"] }, { hand: ["fixture-hand-search"], faceupSpells: ["fixture-primite-spell"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			expect(own(answering(spell, "activate fixture-hand-search"), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("dominus-purge", "notes-hand-either-turn")} can be activated from the hand in the player's own turn too`, () => {
			const start = board({ hand: [card, "fixture-searcher"], deck: ["fixture-normal-4"] }, { monsters: ["fixture-effect-4"] });
			const chained = play(start, "activate fixture-searcher");
			expect(own(chained, `activate ${card}`)).toEqual([`activate ${card}`]);
		});
	});

	describe("its effect", () => {
		it(`${cites("dominus-purge", "negate")} ${cites("dominus-purge", "notes-chain-direct")} is chained to the link on top that includes an effect that adds a card from the Deck to the hand (a search or a draw), and to no other`, () => {
			const attempt = (code: string, you: SideSpec = {}) => board({ set: [card], ...you, deck: ["fixture-normal-4", "fixture-normal-6", "fixture-other-dragon"] }, { hand: [code], monsters: ["fixture-effect-4"], deck: ["fixture-normal-6", "fixture-normal-4", "fixture-light-1"] }, THEIR_TURN, "rival");
			expect(own(answering(attempt("fixture-searcher"), "activate fixture-searcher"), `activate ${card}`)).toEqual([`activate ${card}`]);
			expect(own(answering(attempt("pot-of-greed"), "activate pot-of-greed"), `activate ${card}`)).toEqual([`activate ${card}`]);
			expect(own(answering(attempt("fixture-smite-spell"), "activate fixture-smite-spell"), `activate ${card}`)).toEqual([]);
			// A search from the field, by a monster's Quick Effect, is answered as well.
			const monster = board({ set: [card], deck: ["fixture-normal-4"] }, { monsters: ["fixture-search-monster"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			expect(own(answering(monster, "activate fixture-search-monster"), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("dominus-purge", "negate")} ${cites("dominus-purge", "notes-whole-link")} negates the effect of that Chain Link whole (the search and what else the link does), and destroys the card if the player has a Trap in the GY`, () => {
			const start = (you: SideSpec) => board({ set: [card], ...you, deck: ["fixture-normal-4"] }, { monsters: ["fixture-search-monster"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			// Without a Trap in the GY: the search and the destruction of the player's monster are not applied; the monster stays.
			const without = start({ monsters: ["fixture-effect-4"] });
			const answered = resolve(play(answering(without, "activate fixture-search-monster"), `activate ${card}`));
			expect(codes(answered, "rival", "hand")).toEqual([]);
			expect(codes(answered, "you", "monster")).toEqual(["fixture-effect-4"]);
			expect(find(answered, "fixture-search-monster").zone).toBe("monster");
			// With a Trap in the GY (the Purge itself is not in it yet when it resolves): the card whose effect was negated is destroyed.
			const withTrap = start({ monsters: ["fixture-effect-4"], graveyard: [TRAP] });
			const destroyed = resolve(play(answering(withTrap, "activate fixture-search-monster"), `activate ${card}`));
			expect(codes(destroyed, "rival", "hand")).toEqual([]);
			expect(codes(destroyed, "you", "monster")).toEqual(["fixture-effect-4"]);
			expect(find(destroyed, "fixture-search-monster").zone).toBe("graveyard");
			// A Spell Card whose effect is negated: it is destroyed (it goes to the GY either way once resolved).
			const spell = board({ set: [card], graveyard: [TRAP], deck: ["fixture-normal-4"] }, { hand: ["fixture-searcher"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			expect(codes(resolve(play(answering(spell, "activate fixture-searcher"), `activate ${card}`)), "rival", "hand")).toEqual([]);
		});
	});

	describe("what it destroys", () => {
		it(`${cites("dominus-purge", "qa-destroy-where")} destroys the card whose effect it negated only where that card activated it: a monster still in the hand is destroyed there, one that has left the Monster Zone is not`, () => {
			// Activated from the hand and still there (it costs nothing): destroyed in the hand.
			const inHand = board({ set: [card], graveyard: [TRAP], deck: ["fixture-normal-4"] }, { hand: ["fixture-hand-keeper"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			const destroyedInHand = resolve(play(answering(inHand, "activate fixture-hand-keeper"), `activate ${card}`));
			expect(find(destroyedInHand, "fixture-hand-keeper").zone).toBe("graveyard");
			// Activated on the field, and returned to the hand in answer: negated, but it is not where it activated, so it is not destroyed.
			const onField = board({ set: [card], graveyard: [TRAP], deck: ["fixture-normal-4"] }, { monsters: ["fixture-search-monster"], hand: ["fixture-bounce"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			const answeredOnField = play(answering(onField, "activate fixture-search-monster"), `activate ${card}`);
			const bounced = play(answeredOnField.priority.holder === "rival" ? answeredOnField : play(answeredOnField, "pass"), "activate fixture-bounce > fixture-search-monster");
			const done = resolve(bounced);
			expect(find(done, "fixture-search-monster").zone).toBe("hand");
			expect(codes(done, "rival", "hand")).toContain("fixture-search-monster");
		});
		it(`${cites("dominus-purge", "qa-lock-still-includes")} can be chained to an effect that includes an addition from the Deck even while cards cannot be added from the Deck to the hand`, () => {
			const start = board({ set: [card] }, { hand: ["fixture-searcher"], monsters: ["fixture-effect-4"], deck: ["fixture-normal-6"] }, THEIR_TURN, "rival");
			const locked = addModifier(start, { affects: () => true, until: start.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			expect(own(answering(locked, "activate fixture-searcher"), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
	});

	describe("its lock", () => {
		const effects = ["fixture-dark-effect", "fixture-water-effect", "fixture-fire-effect", "fixture-light-effect"];
		const monsterEffects = (duel: Duel) => offered(duel).filter((entry) => entry.startsWith("activate fixture-") && entry.endsWith("-effect")).sort();
		/** The player answers their own search with the Purge (from the hand or the Set card) and the chain is resolved. */
		const purged = (you: SideSpec): { mid: Duel; done: Duel } => {
			const start = board({ monsters: [...effects, "fixture-dark-quick"], ...you, deck: ["fixture-normal-4"] }, { monsters: ["fixture-effect-4", "fixture-dark-effect"] });
			const mid = play(play(start, "activate fixture-searcher"), `activate ${card}`);
			return { mid, done: reopen(resolve(mid)) };
		};
		it(`${cites("dominus-purge", "lock")} ${cites("dominus-purge", "notes-lock-at-resolution")} stops the player from activating the effects of DARK, WATER and FIRE monsters for the rest of the Duel when it was activated from the hand, from the moment it resolves and not before`, () => {
			const { mid, done } = purged({ hand: [card, "fixture-searcher"] });
			// The Purge has been activated and has not resolved: the Quick Effect of a DARK monster is still open.
			expect(mid.chain).toHaveLength(2);
			expect(own(mid, "activate fixture-dark-quick")).toEqual(["activate fixture-dark-quick"]);
			// Once resolved, only the other Attributes are left, this turn and the turns after.
			expect(monsterEffects(done)).toEqual(["activate fixture-light-effect"]);
			expect(own(done, "activate fixture-dark-quick")).toEqual([]);
			expect(monsterEffects(toMain(done, 2))).toEqual(["activate fixture-light-effect"]);
			expect(own(toMain(done, 2), "activate fixture-dark-quick")).toEqual([]);
			expect(lastingLines(done).join("\n")).toContain("you cannot activate the effects of DARK, WATER, and FIRE monsters");
		});
		it(`${cites("dominus-purge", "lock")} leaves the opponent's DARK, WATER and FIRE monsters free`, () => {
			const { done } = purged({ hand: [card, "fixture-searcher"] });
			const theirs = toMain(done, 1);
			expect(theirs.turn.player).toBe("rival");
			expect(own(theirs, "activate fixture-dark-effect")).toEqual(["activate fixture-dark-effect"]);
		});
		it(`${cites("dominus-purge", "lock")} is not applied when the card was activated Set`, () => {
			const { done } = purged({ set: [card], hand: ["fixture-searcher"] });
			expect(monsterEffects(done)).toEqual(["activate fixture-dark-effect", "activate fixture-fire-effect", "activate fixture-light-effect", "activate fixture-water-effect"]);
			expect(own(done, "activate fixture-dark-quick")).toEqual(["activate fixture-dark-quick"]);
		});
		it(`${cites("dominus-purge", "notes-lock-already")} can be activated from the hand in a Duel where the player has already activated the effect of a DARK, WATER or FIRE monster`, () => {
			const start = board({ hand: [card, "fixture-searcher"], monsters: ["fixture-dark-quick"], deck: ["fixture-normal-4"] }, { monsters: ["fixture-effect-4"] });
			const used = reopen(resolve(play(start, "activate fixture-dark-quick")));
			expect(own(used, "activate fixture-searcher")).toEqual(["activate fixture-searcher"]);
			expect(own(play(used, "activate fixture-searcher"), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
	});

	describe("once per turn", () => {
		it(`${cites("dominus-purge", "once")} can be activated once per turn, whichever copy`, () => {
			const start = board({ hand: [card, card, "fixture-searcher"], deck: ["fixture-normal-4"] }, { monsters: ["fixture-effect-4"] });
			const chained = play(play(start, "activate fixture-searcher"), `activate ${card}`);
			// The other copy cannot be chained in the same turn.
			expect(own(chained, `activate ${card}`)).toEqual([]);
			expect(own(reopen(resolve(chained)), `activate ${card}`)).toEqual([]);
		});
	});
});
