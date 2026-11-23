import { describe, expect, it } from "vitest";
import { cardsIn, changeControl, createDuel, moveCard, type Duel } from "../src";

const start = (seed = 1) =>
	createDuel({
		seed,
		you: { deck: ["celtic-guardian", "celtic-guardian", "dark-magician", "pot-of-greed"], extra: ["thousand-dragon"] },
		rival: { deck: ["summoned-skull", "kuriboh"] },
	});
const card = (duel: Duel, id: number) => duel.cards[id]!;
const codes = (duel: Duel, side: "you" | "rival", zone: Parameters<typeof cardsIn>[2]) => cardsIn(duel, side, zone).map((c) => c.code);

describe("createDuel: every physical card is its own instance", () => {
	it("gives two copies of the same card different ids, each owned and controlled by the player whose Deck it is in", () => {
		const duel = start();
		const guardians = Object.values(duel.cards).filter((c) => c.code === "celtic-guardian");
		expect(guardians.map((c) => c.id)).toEqual([1, 2]);
		expect(guardians.map(({ owner, controller, zone, face, moves }) => ({ owner, controller, zone, face, moves }))).toEqual([
			{ owner: "you", controller: "you", zone: "deck", face: "down", moves: 0 },
			{ owner: "you", controller: "you", zone: "deck", face: "down", moves: 0 },
		]);
		expect(card(duel, 5)).toEqual({ id: 5, code: "thousand-dragon", owner: "you", controller: "you", zone: "extra", face: "down", moves: 0, extraDeck: true, since: 0 });
		expect(card(duel, 6)).toMatchObject({ code: "summoned-skull", owner: "rival", zone: "deck" });
	});
	it("shuffles each Deck by the seed: the same seed gives the same order, and the Extra Deck is not shuffled", () => {
		expect(codes(start(1), "you", "deck")).toEqual(codes(start(1), "you", "deck"));
		const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => codes(start(seed), "you", "deck").join()));
		expect(orders.size).toBeGreaterThan(1);
		expect([...codes(start(3), "you", "deck")].sort()).toEqual(["celtic-guardian", "celtic-guardian", "dark-magician", "pot-of-greed"]);
		expect(codes(start(3), "you", "extra")).toEqual(["thousand-dragon"]);
	});
});

describe("moveCard: a card keeps its identity, and counts every move", () => {
	it("draws the top card of the Deck: same id, now in the hand, moved once", () => {
		const duel = start();
		const top = cardsIn(duel, "you", "deck")[0]!;
		const after = moveCard(duel, top.id, { zone: "hand" });
		expect(card(after, top.id)).toEqual({ ...top, zone: "hand", moves: 1 });
		expect(cardsIn(after, "you", "deck")).toHaveLength(3);
		expect(cardsIn(after, "you", "hand").map((c) => c.id)).toEqual([top.id]);
		expect(card(duel, top.id).zone).toBe("deck");
	});
	it("faces a card up in the Graveyard and on the field by default, and down when Set", () => {
		let duel = start();
		const [a, b] = cardsIn(duel, "you", "deck");
		duel = moveCard(duel, a!.id, { zone: "monster" });
		duel = moveCard(duel, b!.id, { zone: "spell", face: "down" });
		expect([card(duel, a!.id).face, card(duel, b!.id).face]).toEqual(["up", "down"]);
		duel = moveCard(duel, b!.id, { zone: "graveyard" });
		expect(card(duel, b!.id)).toMatchObject({ zone: "graveyard", face: "up", moves: 2 });
	});
	it("puts a card on top of the Deck, or at the bottom when asked", () => {
		let duel = start();
		const hand = cardsIn(duel, "you", "deck")[3]!;
		duel = moveCard(duel, hand.id, { zone: "hand" });
		const onTop = moveCard(duel, hand.id, { zone: "deck" });
		expect(cardsIn(onTop, "you", "deck")[0]!.id).toBe(hand.id);
		const atBottom = moveCard(duel, hand.id, { zone: "deck", at: "bottom" });
		expect(cardsIn(atBottom, "you", "deck").at(-1)!.id).toBe(hand.id);
	});
});

describe("moves: when a card becomes a new card", () => {
	it("counts a change of zone, a change of control and a flip face-down on the field, but not a move within the same zone", () => {
		let duel = start();
		const id = cardsIn(duel, "you", "deck")[0]!.id;
		duel = moveCard(duel, id, { zone: "monster" });
		expect(card(duel, id).moves).toBe(1);
		duel = moveCard(duel, id, { zone: "monster" });
		expect(card(duel, id).moves).toBe(1);
		duel = moveCard(duel, id, { zone: "monster", face: "up" });
		expect(card(duel, id).moves).toBe(1);
		duel = moveCard(duel, id, { zone: "monster", face: "down" });
		expect(card(duel, id).moves).toBe(2);
		duel = changeControl(duel, id, "rival");
		expect(card(duel, id).moves).toBe(3);
		duel = moveCard(duel, id, { zone: "spell" });
		expect(card(duel, id).moves).toBe(4);
	});
	it("leaves the duel unchanged when control goes to the player who already has it", () => {
		const duel = moveCard(start(), 1, { zone: "monster" });
		expect(changeControl(duel, 1, "you")).toBe(duel);
	});
});

describe("where a card goes", () => {
	it("sends an Extra Deck monster back to the Extra Deck when it would go to the Deck or the hand", () => {
		let duel = moveCard(start(), 5, { zone: "monster" });
		expect(card(moveCard(duel, 5, { zone: "deck" }), 5)).toMatchObject({ zone: "extra", face: "down" });
		duel = moveCard(duel, 5, { zone: "hand" });
		expect(card(duel, 5).zone).toBe("extra");
		expect(cardsIn(duel, "you", "extra").map((c) => c.id)).toEqual([5]);
		expect(cardsIn(duel, "you", "hand")).toEqual([]);
	});
	it("can put a card straight onto the opponent's field: they control it, its owner does not change", () => {
		const duel = moveCard(start(), 1, { zone: "monster", controller: "rival" });
		expect(card(duel, 1)).toMatchObject({ owner: "you", controller: "rival", zone: "monster", moves: 1 });
		expect(cardsIn(duel, "rival", "monster").map((c) => c.id)).toEqual([1]);
		expect(() => moveCard(start(), 1, { zone: "graveyard", controller: "rival" })).toThrow(/only on the field/);
	});
});

describe("changeControl: control is not ownership", () => {
	const onField = () => {
		const duel = start();
		const skull = cardsIn(duel, "rival", "deck").find((c) => c.code === "summoned-skull")!;
		return { duel: moveCard(duel, skull.id, { zone: "monster" }), id: skull.id };
	};
	it("hands a monster on the field to the other player, who now controls it; the owner stays the same", () => {
		const { duel, id } = onField();
		const taken = changeControl(duel, id, "you");
		expect(card(taken, id)).toMatchObject({ owner: "rival", controller: "you", zone: "monster", moves: 2 });
		expect(cardsIn(taken, "you", "monster").map((c) => c.id)).toEqual([id]);
		expect(cardsIn(taken, "rival", "monster")).toEqual([]);
	});
	it("sends a card that leaves the field to its owner's pile, and control returns to the owner", () => {
		const { duel, id } = onField();
		const gone = moveCard(changeControl(duel, id, "you"), id, { zone: "graveyard" });
		expect(card(gone, id)).toMatchObject({ owner: "rival", controller: "rival", zone: "graveyard", moves: 3 });
		expect(cardsIn(gone, "rival", "graveyard").map((c) => c.id)).toEqual([id]);
		expect(cardsIn(gone, "you", "graveyard")).toEqual([]);
	});
	it("keeps control when the card only moves on the field, and refuses control of a card that is not on the field", () => {
		const { duel, id } = onField();
		const set = moveCard(changeControl(duel, id, "you"), id, { zone: "monster", face: "down" });
		expect(card(set, id)).toMatchObject({ controller: "you", face: "down" });
		expect(() => changeControl(start(), 1, "rival")).toThrow(/not on the field/);
	});
});
