import { describe, expect, it } from "vitest";
import { askBottomOrder, type CardDef, cardsIn, createDuel, type Duel, excavate, gainLp, loseLp, moveCard, pickRandom, redeal, revealCards, shuffleDeck, viewFor } from "../../src";
import { codes, offered, play, position } from "./fixtures";

/** Deck operations, reveals and Life Points (real-deck readiness). The cards are made up and named for what they show. */

const deckOf = (duel: Duel, side: "you" | "rival") => cardsIn(duel, side, "deck").map((card) => card.id);
/** A card that listens to events, so the duel records them (the core keeps no events when no card could answer one). */
const listening: Record<string, CardDef> = { watcher: { code: "watcher", kind: "monster", effects: [{ type: "trigger", event: () => false, operation: (duel) => duel }] } };
const ten = Array.from({ length: 10 }, (_, i) => `card-${i}`);

describe("shuffling a Deck", () => {
	it("draws the order from the Duel's seeded RNG: the same Duel shuffles the same way, and the RNG moves on", () => {
		const start = createDuel({ seed: 11, you: { deck: ten }, rival: { deck: [] } });
		const once = shuffleDeck(start, "you");
		expect(deckOf(once, "you")).toEqual(deckOf(shuffleDeck(start, "you"), "you"));
		expect([...deckOf(once, "you")].sort((a, b) => a - b)).toEqual([...deckOf(start, "you")].sort((a, b) => a - b));
		expect(once.rng.state).not.toBe(start.rng.state);
		expect(deckOf(shuffleDeck(once, "you"), "you")).not.toEqual(deckOf(once, "you"));
		// The Duel given is not changed, and the cards are still the same cards (a shuffle is not a move).
		expect(deckOf(start, "you")).not.toEqual(deckOf(once, "you"));
		expect(Object.values(once.cards).map((card) => card.moves)).toEqual(Object.values(start.cards).map((card) => card.moves));
	});
});

describe("placing cards on the bottom of the Deck in the order the player chooses", () => {
	it("asks for the cards one at a time; each goes under the ones before it, the last one asked for is taken without asking", () => {
		const defs: Record<string, CardDef> = {
			"bottom-two": { code: "bottom-two", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => askBottomOrder(duel, link.player, duel.piles[link.player].hand.filter((id) => id !== link.card.id)) }] },
		};
		const start = position({ defs, you: { hand: ["bottom-two", "card-a", "card-b"], deck: ["card-top"] } });
		const asked = play(start, "activate bottom-two");
		expect(offered(asked)).toEqual(["choose card-a", "choose card-b"]);
		const done = play(asked, "choose card-b");
		expect(codes(done, "you", "deck")).toEqual(["card-top", "card-b", "card-a"]);
	});
});

describe("excavating and random picks", () => {
	it("excavates the top N cards: they stay on top of the Deck, revealed to both players while they stay there", () => {
		const start = createDuel({ seed: 3, you: { deck: ten }, rival: { deck: [] }, defs: listening });
		const top = deckOf(start, "you").slice(0, 3);
		const { duel, cards } = excavate(start, "you", 3);
		expect(cards).toEqual(top);
		expect(deckOf(duel, "you")).toEqual(deckOf(start, "you"));
		expect(duel.live.at(-1)).toMatchObject({ type: "revealed", player: "you" });
		const seen = viewFor(duel, "rival").duel;
		expect(top.map((id) => seen.cards[id]!.code)).toEqual(top.map((id) => start.cards[id]!.code));
		expect(seen.cards[deckOf(start, "you")[3]!]!.code).toBe("?");
		// Shuffled back, they are hidden again.
		const shuffled = viewFor(shuffleDeck(duel, "you"), "rival").duel;
		expect(top.map((id) => shuffled.cards[id]!.code)).toEqual(["?", "?", "?"]);
	});
	it("picks at random through the Duel's RNG (\"discard 1 random card\"): the same Duel picks the same card", () => {
		const start = createDuel({ seed: 5, you: { deck: ten }, rival: { deck: [] } });
		const from = deckOf(start, "you");
		const first = pickRandom(start, from, 2);
		expect(first.picked).toHaveLength(2);
		expect(new Set(first.picked).size).toBe(2);
		expect(first.picked.every((id) => from.includes(id))).toBe(true);
		expect(pickRandom(start, from, 2).picked).toEqual(first.picked);
		expect(first.duel.rng.state).not.toBe(start.rng.state);
		expect(pickRandom(start, [], 1).picked).toEqual([]);
	});
});

describe("revealing a card", () => {
	it("is a public event; the bot's view knows the card while it stays where it was revealed, and forgets it once it moves", () => {
		const start = position({ defs: listening, you: { hand: ["secret", "other"] } });
		const [secret, other] = start.piles.you.hand;
		const revealed = revealCards(start, "you", [secret!]);
		expect(revealed.live.at(-1)).toMatchObject({ type: "revealed", player: "you", cards: [{ id: secret }] });
		const seen = viewFor(revealed, "rival");
		expect(seen.duel.cards[secret!]!.code).toBe("secret");
		expect(seen.duel.cards[other!]!.code).toBe("?");
		// A re-dealt world keeps it: it is not in the pool of hidden cards.
		expect(seen.unknown.you.main).not.toContain("secret");
		expect(redeal(seen, 9).cards[secret!]!.code).toBe("secret");
		// Sent to the Deck and drawn again, it is a new card: hidden again.
		const back = moveCard(moveCard(revealed, secret!, { zone: "deck" }), secret!, { zone: "hand" });
		expect(viewFor(back, "rival").duel.cards[secret!]!.code).toBe("?");
	});
});

describe("Life Points", () => {
	it("gainLp adds Life Points and raises a public event; damage by an effect is loseLp, which never goes below 0 and decides the Duel", () => {
		const start = position({ defs: listening });
		const gained = gainLp(start, "rival", 1000);
		expect(gained.lp).toEqual({ you: 8000, rival: 9000 });
		expect(gained.live.at(-1)).toEqual({ type: "lp-gained", player: "rival", amount: 1000 });
		expect(gainLp(start, "rival", 0)).toBe(start);
		const hit = loseLp({ ...start, lp: { you: 500, rival: 8000 } }, "you", 800);
		expect(hit.lp.you).toBe(0);
		expect(hit.winner).toBe("rival");
	});
});

describe("materials shuffled into the Deck (step 8's limit, fixed)", () => {
	it("a contact Fusion whose materials are shuffled into the Deck shuffles it with the Duel's RNG, not placing them on top", () => {
		const isCode = (code: string) => (duel: Duel, card: { code: string }) => card.code === code;
		const defs: Record<string, CardDef> = {
			"mat-a": { code: "mat-a", kind: "monster", facts: { level: 4 } },
			"mat-b": { code: "mat-b", kind: "monster", facts: { level: 4 } },
			"shuffle-contact": { code: "shuffle-contact", kind: "monster", facts: { frame: "fusion", level: 8, atk: 3000 }, procedure: { kind: "fusion", materials: [{ min: 1, max: 1, filter: isCode("mat-a") }, { min: 1, max: 1, filter: isCode("mat-b") }], contact: { to: "deck" } } },
		};
		const start = position({ defs, you: { monsters: ["mat-a", "mat-b"], deck: ten, extra: ["shuffle-contact"] } });
		let duel = play(start, "special-summon shuffle-contact");
		while (duel.asking) duel = play(duel, offered(duel)[0]!);
		const deck = codes(duel, "you", "deck");
		expect(deck).toHaveLength(12);
		expect(deck.slice(0, 2).sort()).not.toEqual(["mat-a", "mat-b"]);
		expect(duel.rng.state).not.toBe(start.rng.state);
	});
});
