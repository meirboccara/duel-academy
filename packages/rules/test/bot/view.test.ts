import { describe, expect, it } from "vitest";
import { act, ask, cardsIn, type Duel, HIDDEN, legalActions, moveCard, redeal, revealCards, type Side, viewFor, type Zone } from "../../src";
import { codes, position, REAL_CARDS } from "../rules/fixtures";

const seen = (duel: Duel, side: Side, zone: Zone) => cardsIn(duel, side, zone).map((card) => card.code);

const midgame = (): Duel =>
	position({
		defs: REAL_CARDS,
		you: { hand: ["terraforming", "normal-4"], monsters: ["normal-6"], set: ["solemn-strike"], facedown: ["effect-4"], graveyard: ["normal-4-b"], deck: ["umi", "pot-of-greed", "normal-4"] },
		rival: { hand: ["ash-blossom-joyous-spring", "normal-4"], monsters: ["normal-4-b"], set: ["mystical-space-typhoon"], facedown: ["normal-6"], graveyard: ["umi"], deck: ["other-field", "effect-4", "normal-4"] },
	});

describe("viewFor: what one player can see", () => {
	it("choice candidates are not blanket reveals, for either seat; own Deck candidates and explicit reveals are visible only as entitled", () => {
		for (const viewer of ["you", "rival"] as const) {
			const other = viewer === "you" ? "rival" : "you";
			const base = midgame();
			const banished = moveCard(base, base.piles[other].deck[0]!, { zone: "banished", face: "down" });
			const ownDeck = banished.piles[viewer].deck[0]!;
			const hidden = [...banished.piles[other].hand, ...banished.piles[other].deck, ...banished.piles[other].spell, ...banished.piles[other].monster.filter((id) => banished.cards[id]!.face === "down"), ...banished.piles[other].banished];
			const asked = ask(banished, viewer, [ownDeck, ...hidden], (duel) => duel);
			const view = viewFor(asked, viewer).duel;
			expect(view.cards[ownDeck]!.code).toBe(asked.cards[ownDeck]!.code);
			for (const id of hidden) expect(view.cards[id]!.code).toBe(HIDDEN);
			expect(viewFor(asked, other).duel.cards[ownDeck]!.code).toBe(HIDDEN);
			const revealed = revealCards(asked, other, [hidden[0]!]);
			for (const side of [viewer, other] as const) expect(viewFor(revealed, side).duel.cards[hidden[0]!]!.code).toBe(asked.cards[hidden[0]!]!.code);
		}
	});
	it("hides the opponent's hand and the order and contents of both Decks; keeps its own hand and every public card", () => {
		const duel = midgame();
		const view = viewFor(duel, "you");
		expect(view.side).toBe("you");
		expect(seen(view.duel, "you", "hand")).toEqual(["terraforming", "normal-4"]);
		expect(seen(view.duel, "rival", "hand")).toEqual([HIDDEN, HIDDEN]);
		expect(seen(view.duel, "you", "deck")).toEqual([HIDDEN, HIDDEN, HIDDEN]);
		expect(seen(view.duel, "rival", "deck")).toEqual([HIDDEN, HIDDEN, HIDDEN]);
		expect(seen(view.duel, "you", "graveyard")).toEqual(["normal-4-b"]);
		expect(seen(view.duel, "rival", "graveyard")).toEqual(["umi"]);
		expect(seen(view.duel, "rival", "monster")).toEqual(["normal-4-b", HIDDEN]);
		// Its own Set cards: it Set them.
		expect(seen(view.duel, "you", "spell")).toEqual(["solemn-strike"]);
		expect(seen(view.duel, "you", "monster")).toEqual(["normal-6", "effect-4"]);
		expect(seen(view.duel, "rival", "spell")).toEqual([HIDDEN]);
		// The pools it may deal from: sorted multisets, no order.
		expect(view.unknown.you.main).toEqual(["normal-4", "pot-of-greed", "umi"]);
		expect(view.unknown.rival.main).toEqual(["ash-blossom-joyous-spring", "effect-4", "mystical-space-typhoon", "normal-4", "normal-4", "normal-6", "other-field"]);
		// The real duel is not changed.
		expect(codes(duel, "rival", "hand")).toEqual(["ash-blossom-joyous-spring", "normal-4"]);
	});

	it("hides the opponent's face-down Extra Deck but not its face-up Pendulum Monsters; keeps its own Extra Deck", () => {
		const defs = { ...REAL_CARDS, pendulum: { code: "pendulum", kind: "monster" as const, facts: { level: 4, pendulum: { scale: 1 } } }, link: { code: "link", kind: "monster" as const, facts: { link: 1, frame: "link" as const } } };
		const duel = position({ defs, you: { extra: ["link"] }, rival: { extra: ["link", "link"], extraFaceUp: ["pendulum"] } });
		const view = viewFor(duel, "you");
		expect(seen(view.duel, "you", "extra")).toEqual(["link"]);
		expect(seen(view.duel, "rival", "extra")).toEqual([HIDDEN, HIDDEN, "pendulum"]);
		expect(view.unknown.rival.extra).toEqual(["link", "link"]);
		expect(view.unknown.you.extra).toEqual([]);
	});

	it("gives the same view of two duels that differ only in what the viewer cannot see, events included", () => {
		const a = midgame();
		// The rival's hand card and a Deck card swapped: the same multiset, another place.
		const ash = a.piles.rival.hand[0]!;
		const top = a.piles.rival.deck[0]!;
		const swapped: Duel = { ...a, cards: { ...a.cards, [ash]: { ...a.cards[ash]!, code: a.cards[top]!.code }, [top]: { ...a.cards[top]!, code: a.cards[ash]!.code } } };
		expect(codes(swapped, "rival", "hand")).not.toEqual(codes(a, "rival", "hand"));
		const shape = (duel: Duel) => JSON.stringify(viewFor(duel, "you"), (key, value) => (key === "defs" ? undefined : value));
		expect(shape(swapped)).toBe(shape(a));
		// A draw raises a `moved` event with the card in it: the opponent's view of it is masked.
		const drawn = moveCard({ ...a, defs: { ...a.defs, watcher: { code: "watcher", kind: "monster", effects: [{ type: "quick", range: "hand", event: () => true, operation: (duel) => duel }] } } }, a.piles.rival.deck[0]!, { zone: "hand" });
		const masked = viewFor(drawn, "you").duel.live.flatMap((event) => (event.type === "moved" ? [event.after.code, event.before.code] : event.type === "added-to-hand" ? [event.card.code] : []));
		expect(masked.length).toBeGreaterThan(0);
		expect(new Set(masked)).toEqual(new Set([HIDDEN]));
	});
});

describe("redeal: a full legal duel consistent with the view", () => {
	it("keeps every card the viewer sees and every count, and deals the hidden codes from their pools", () => {
		const duel = midgame();
		const view = viewFor(duel, "you");
		const world = redeal(view, 1);
		for (const side of ["you", "rival"] as const) {
			for (const zone of ["hand", "deck", "monster", "spell", "graveyard", "extra"] as const) expect(world.piles[side][zone]).toEqual(duel.piles[side][zone]);
		}
		expect(seen(world, "you", "hand")).toEqual(["terraforming", "normal-4"]);
		expect(seen(world, "you", "spell")).toEqual(["solemn-strike"]);
		expect(seen(world, "rival", "monster")[0]).toBe("normal-4-b");
		const hiddenRival = [...world.piles.rival.hand, ...world.piles.rival.deck, ...world.piles.rival.spell, world.piles.rival.monster[1]!].map((id) => world.cards[id]!.code).sort();
		expect(hiddenRival).toEqual(view.unknown.rival.main);
		expect(seen(world, "you", "deck").sort()).toEqual(view.unknown.you.main);
		expect(Object.values(world.cards).some((card) => card.code === HIDDEN)).toBe(false);
	});

	it("deals a face-down card a code that fits its zone: a Set card a Spell or Trap, a face-down monster a monster", () => {
		const view = viewFor(midgame(), "you");
		for (let seed = 0; seed < 30; seed++) {
			const world = redeal(view, seed);
			expect(world.defs[world.cards[world.piles.rival.spell[0]!]!.code]!.kind).not.toBe("monster");
			expect(world.defs[world.cards[world.piles.rival.monster[1]!]!.code]!.kind).toBe("monster");
		}
	});

	it("is the same world for the same seed, and other worlds for other seeds", () => {
		const view = viewFor(midgame(), "you");
		const hand = (seed: number) => seen(redeal(view, seed), "rival", "hand").join(",") + "|" + seen(redeal(view, seed), "you", "deck").join(",");
		expect(hand(3)).toBe(hand(3));
		expect(new Set(Array.from({ length: 12 }, (_, seed) => hand(seed))).size).toBeGreaterThan(3);
	});

	it("gives a duel the core plays: the same actions are listed for the viewer, and they can be done", () => {
		const duel = midgame();
		const world = redeal(viewFor(duel, "you"), 5);
		expect(legalActions(world)).toEqual(legalActions(duel));
		for (const action of legalActions(world)) expect(() => act(world, action)).not.toThrow();
	});
});

describe("review fixes (step 9)", () => {
	it("masks the cards a paused chain carries: a draw by a lower link is not revealed while a choice waits", () => {
		const duel = midgame();
		const drawn = moveCard({ ...duel, defs: { ...duel.defs, watcher: { code: "watcher", kind: "monster", effects: [{ type: "quick", range: "hand", event: () => true, operation: (d) => d }] } } }, duel.piles.rival.deck[0]!, { zone: "hand" });
		const carried = drawn.live;
		const paused: Duel = { ...drawn, live: [], asking: { links: [], player: "you", from: [], then: (d) => d, carried } };
		const view = viewFor(paused, "you");
		const codesCarried = view.duel.asking!.carried!.flatMap((event) => (event.type === "moved" ? [event.after.code] : event.type === "added-to-hand" ? [event.card.code] : []));
		expect(codesCarried.length).toBeGreaterThan(0);
		expect(new Set(codesCarried)).toEqual(new Set([HIDDEN]));
		// A world deals them the same code as the card.
		const world = redeal(view, 2);
		for (const event of world.asking!.carried!) if (event.type === "added-to-hand") expect(event.card.code).toBe(world.cards[event.card.id]!.code);
	});

	it("does not reveal a card of the opponent's hand because its optional trigger waits", () => {
		const defs = { ...REAL_CARDS, lurker: { code: "lurker", kind: "monster" as const, effects: [{ type: "trigger" as const, range: "hand" as const, event: () => true, operation: (d: Duel) => d }] } };
		const duel = position({ defs, rival: { hand: ["lurker"], deck: ["normal-4", "normal-4"] } });
		const lurker = duel.piles.rival.hand[0]!;
		const waiting: Duel = { ...duel, waiting: [{ card: duel.cards[lurker]!, effect: 0, event: { type: "phase", phase: "main1", player: "you" } }] };
		const view = viewFor(waiting, "you");
		expect(view.duel.cards[lurker]!.code).toBe(HIDDEN);
		expect(view.duel.waiting[0]!.card.code).toBe(HIDDEN);
		// A world never keeps a waiting trigger on a card dealt a code that has no such trigger.
		for (let seed = 0; seed < 10; seed++) {
			const world = redeal(view, seed);
			for (const entry of world.waiting) expect(world.defs[world.cards[entry.card.id]!.code]!.effects?.[entry.effect]?.type).toBe("trigger");
		}
	});

	it("never deals a Field Spell into a Spell & Trap Zone", () => {
		const duel = position({ defs: REAL_CARDS, rival: { set: ["mystical-space-typhoon"], deck: ["umi", "umi", "umi", "solemn-strike"] } });
		const view = viewFor(duel, "you");
		for (let seed = 0; seed < 30; seed++) expect(redeal(view, seed).cards[duel.piles.rival.spell[0]!]!.code).not.toBe("umi");
	});
});
