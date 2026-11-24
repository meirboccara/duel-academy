import { describe, expect, it } from "vitest";
import { act, type Action, atk, beginSummon, changeControl, destroyCard, finishSummon, equip, equipsOf, freeSlots, takeControl, targetsOf, legalActions, pendulumZones, type Arrow, type CardDef, cardsIn, createDuel, type Duel, summonZones, cardsInColumn, cites, coLinked, columnOf, isLinked, linkedZones, moveCard, pointedZones, pointsTo, sameColumn } from "../../src";
const MECHANIC = { destruction: { cause: "game-mechanic" as const } };
import { codes, offered, plainCards, play, position } from "./fixtures";

describe("exact board slots", () => {
	it(`${cites("rules", "zone-five-slots")} preserves holes and refuses an occupied or out-of-range slot without changing the input`, () => {
		const start = position({ defs: plainCards(), you: { monsters: ["monster", "monster"], hand: ["monster"] } });
		const [a, b] = cardsIn(start, "you", "monster");
		const hand = cardsIn(start, "you", "hand")[0]!;
		expect(a!.slot).toBe(0);
		expect(b!.slot).toBe(1);
		const moved = moveCard(start, a!.id, { zone: "monster", slot: 4 });
		expect(moved.cards[b!.id]!.slot).toBe(1);
		expect(moved.cards[a!.id]!.moves).toBe(a!.moves);
		expect(() => moveCard(moved, hand.id, { zone: "monster", slot: 4 })).toThrow(/occupied/);
		expect(() => moveCard(moved, hand.id, { zone: "spell", slot: 5 })).toThrow(/slot/);
		expect(moveCard(moved, hand.id, { zone: "monster" }).cards[hand.id]!.slot).toBe(0);
		expect(start.cards[a!.id]!.slot).toBe(0);
		expect(moveCard(moved, a!.id, { zone: "graveyard" }).cards[a!.id]!.slot).toBeNull();
	});
});

describe("columns", () => {
	const defs = { ...plainCards(), field: { code: "field", kind: "spell" as const, facts: { icon: "field" as const } } };
	it(`${cites("rules", "spell-trap-five-slots")} ${cites("rules", "extra-zone-one")} reads a column from either player's side, mirrored across the field, with the shared Extra Monster Zones in the second and fourth columns and the Field Zone in none`, () => {
		let duel = position({ defs, you: { hand: ["monster", "spell", "field"] }, rival: { hand: ["monster", "spell", "monster"] } });
		const [yourMonster, yourSpell, yourField] = duel.piles.you.hand;
		const [rivalMonster, rivalSpell, rivalExtra] = duel.piles.rival.hand;
		duel = moveCard(duel, yourMonster!, { zone: "monster", slot: 0 });
		duel = moveCard(duel, yourSpell!, { zone: "spell", slot: 3 });
		duel = moveCard(duel, yourField!, { zone: "field" });
		duel = moveCard(duel, rivalMonster!, { zone: "monster", slot: 4 });
		duel = moveCard(duel, rivalSpell!, { zone: "spell", slot: 1 });
		duel = moveCard(duel, rivalExtra!, { zone: "monster", slot: 6 });
		expect(columnOf(duel, yourMonster!)).toBe(0);
		expect(columnOf(duel, yourMonster!, "rival")).toBe(4);
		expect(columnOf(duel, rivalMonster!)).toBe(0);
		expect(columnOf(duel, rivalMonster!, "rival")).toBe(4);
		expect(columnOf(duel, rivalSpell!)).toBe(3);
		expect(columnOf(duel, rivalExtra!)).toBe(3);
		expect(columnOf(duel, rivalExtra!, "rival")).toBe(1);
		expect(columnOf(duel, yourField!)).toBeNull();
		expect(columnOf(duel, duel.piles.you.deck[0] ?? yourField!)).toBeNull();
		expect(cardsInColumn(duel, 3).sort()).toEqual([yourSpell!, rivalSpell!, rivalExtra!].sort());
		expect(cardsInColumn(duel, 1, "rival").sort()).toEqual([yourSpell!, rivalSpell!, rivalExtra!].sort());
		expect(sameColumn(duel, yourMonster!, rivalMonster!)).toBe(true);
		expect(sameColumn(duel, yourMonster!, yourSpell!)).toBe(false);
		expect(sameColumn(duel, yourField!, yourField!)).toBe(false);
	});
});

describe("Link Arrows", () => {
	const link = (code: string, arrows: Arrow[]): CardDef => ({ code, kind: "monster", facts: { frame: "link", arrows } });
	const defs: Record<string, CardDef> = { ...plainCards(), "link-up": link("link-up", ["top", "bottom"]), "link-rival": link("link-rival", ["top", "top-left", "right"]), "link-corners": link("link-corners", ["top-left", "top-right", "bottom-left", "bottom-right", "left"]) };
	it(`${cites("rules", "link-arrows-co-linked")} point to the zones next to the card on either side of the field, turned round for the other player, and two cards that point to each other are co-linked`, () => {
		let duel = position({ defs, you: { hand: ["link-up", "link-corners", "monster"] }, rival: { hand: ["link-rival", "monster", "link-corners"] } });
		const [up, yourCorners, yourMonster] = duel.piles.you.hand;
		const [down, rivalMonster, rivalCorners] = duel.piles.rival.hand;
		duel = moveCard(duel, up!, { zone: "monster", slot: 5 });
		duel = moveCard(duel, yourMonster!, { zone: "monster", slot: 1 });
		duel = moveCard(duel, yourCorners!, { zone: "monster", slot: 2 });
		duel = moveCard(duel, down!, { zone: "monster", slot: 3 });
		duel = moveCard(duel, rivalMonster!, { zone: "monster", slot: 2 });
		// Your Extra Monster Zone 5 is above your second Main Monster Zone and below the rival's fourth one (their slot 3).
		expect(pointedZones(duel, up!)).toEqual([{ side: "you", slot: 1 }, { side: "rival", slot: 3 }]);
		expect(pointsTo(duel, up!, yourMonster!)).toBe(true);
		expect(pointsTo(duel, up!, down!)).toBe(true);
		// The rival's top arrow points up from their side into the Extra Monster Zone 5; their top-left reaches the middle, where there is no zone; their right is their slot 4.
		expect(pointedZones(duel, down!)).toEqual([{ side: "shared", slot: 5 }, { side: "rival", slot: 4 }]);
		expect(coLinked(duel, up!, down!)).toBe(true);
		// Your Main Monster Zone 2: its upper corners are the two Extra Monster Zones; its lower corners are Spell & Trap Zones, not Monster Zones; left is slot 1.
		expect(pointedZones(duel, yourCorners!)).toEqual([{ side: "you", slot: 1 }, { side: "shared", slot: 5 }, { side: "shared", slot: 6 }]);
		expect(coLinked(duel, yourCorners!, up!)).toBe(false);
		expect(pointsTo(duel, up!, rivalMonster!)).toBe(false);
		expect(linkedZones(duel, "you")).toEqual([1]);
		expect(linkedZones(duel, "rival")).toEqual([3, 4]);
		expect(isLinked(duel, yourMonster!)).toBe(true);
		expect(isLinked(duel, rivalMonster!)).toBe(false);
		expect(isLinked(duel, up!)).toBe(true);
		// An Extra Monster Zone's left and right arrows point at no zone (the middle column has none between them).
		duel = moveCard(duel, rivalCorners!, { zone: "monster", slot: 6 });
		expect(pointedZones(duel, rivalCorners!)).toEqual([{ side: "you", slot: 2 }, { side: "you", slot: 4 }, { side: "rival", slot: 0 }, { side: "rival", slot: 2 }]);
	});
});

describe("where a monster can be Summoned", () => {
	const link = (code: string, arrows: Arrow[]): CardDef => ({ code, kind: "monster", facts: { frame: "link", arrows } });
	const defs: Record<string, CardDef> = {
		...plainCards(),
		fusion: { code: "fusion", kind: "monster", facts: { frame: "fusion", level: 6 } },
		"link-top": link("link-top", ["top", "bottom"]),
		"link-bottom-right": link("link-bottom-right", ["bottom-right"]),
		"link-left": link("link-left", ["left", "bottom-right"]),
		"link-right": link("link-right", ["right", "bottom-left"]),
		pendulum: { code: "pendulum", kind: "monster", facts: { level: 4, pendulum: { scale: 1 } } },
	};
	const extra = (duel: Duel, side: "you" | "rival", code: string) => cardsIn(duel, side, "extra").find((card) => card.code === code)!.id;
	const start = (more: { you?: string[]; rival?: string[] } = {}): Duel => {
		const duel = createDuel({ seed: 1, you: { deck: ["monster", "monster"], extra: ["fusion", "link-top", "link-bottom-right", "link-left", "link-right", ...(more.you ?? [])] }, rival: { deck: [], extra: ["link-top", ...(more.rival ?? [])] }, defs });
		return { ...duel, turn: { player: "you" as const, number: 3, phase: "main1" as const } };
	};
	it(`${cites("rules", "fusion-synchro-xyz-main")} ${cites("rules", "extra-zone-one")} lets a Fusion, Synchro or Xyz Monster go from the Extra Deck to any free Main Monster Zone or a free Extra Monster Zone (the 2021 update over RB10)`, () => {
		let duel = start();
		expect(summonZones(duel, "you", extra(duel, "you", "fusion"))).toEqual([0, 1, 2, 3, 4, 5, 6]);
		duel = moveCard(duel, duel.piles.you.deck[0]!, { zone: "monster", slot: 2 });
		expect(summonZones(duel, "you", extra(duel, "you", "fusion"))).toEqual([0, 1, 3, 4, 5, 6]);
	});
	it(`${cites("rules", "link-pendulum-still-restricted")} ${cites("rules", "linked-zones-extra-deck")} puts a Link Monster from the Extra Deck only in a free Extra Monster Zone or a Main Monster Zone a Link Monster points to, the opponent's arrows included`, () => {
		let duel = start();
		expect(summonZones(duel, "you", extra(duel, "you", "link-bottom-right"))).toEqual([5, 6]);
		// The rival's Link Monster in the Extra Monster Zone 6 points down (from their side) into your Main Monster Zone 3.
		duel = moveCard(duel, extra(duel, "rival", "link-top"), { zone: "monster", controller: "rival", slot: 6 });
		expect(pointedZones(duel, duel.piles.rival.monster[0]!)).toEqual([{ side: "you", slot: 3 }, { side: "rival", slot: 1 }]);
		// That shared zone is taken, and you control no monster in the other one.
		expect(summonZones(duel, "you", extra(duel, "you", "link-bottom-right"))).toEqual([3, 5]);
	});
	it(`${cites("rules", "revived-extra-to-main")} sends an Extra Deck monster coming back from the Graveyard to a Main Monster Zone, with no arrow needed`, () => {
		let duel = start();
		const linkId = extra(duel, "you", "link-bottom-right");
		duel = moveCard(duel, linkId, { zone: "graveyard" });
		expect(summonZones(duel, "you", linkId)).toEqual([0, 1, 2, 3, 4]);
	});
	it(`${cites("rules", "extra-zone-one")} gives a player who already has a monster in an Extra Monster Zone no use of the other one`, () => {
		let duel = start();
		duel = moveCard(duel, extra(duel, "you", "fusion"), { zone: "monster", slot: 5 });
		expect(summonZones(duel, "you", extra(duel, "you", "link-bottom-right"))).toEqual([]);
		expect(summonZones(duel, "you", extra(duel, "you", "link-top"))).toEqual([]);
	});
	// YGOProJudge (2026-11-23, no source cited): the second Extra Monster Zone only for a Link Monster that completes a path of co-linked monsters.
	it("lets a Link Monster take the other Extra Monster Zone only when it completes a co-linked path to the first (Extra Link, YGOProJudge lead, no Konami record)", () => {
		let duel = start();
		// Your Link in Extra Monster Zone 5 points down-right to your Main Monster Zone 2; the Link there points up-left back to it and right to slot 3.
		duel = moveCard(duel, extra(duel, "you", "link-bottom-right"), { zone: "monster", slot: 5 });
		const middle: CardDef = link("middle", ["top-left", "top-right"]);
		duel = { ...duel, defs: { ...duel.defs, middle } };
		duel = { ...duel, cards: { ...duel.cards, [duel.piles.you.deck[0]!]: { ...duel.cards[duel.piles.you.deck[0]!]!, code: "middle" } } };
		duel = moveCard(duel, duel.piles.you.deck[0]!, { zone: "monster", slot: 2 });
		// "link-left" in zone 6 would point left (nothing) and down-right (your slot 4): no co-link with the middle; "link-right" points down-left into slot 2.
		expect(summonZones(duel, "you", extra(duel, "you", "link-left"))).toEqual([]);
		expect(summonZones(duel, "you", extra(duel, "you", "link-right"))).toEqual([6]);
		// A Fusion Monster has no arrows: it can never complete one.
		expect(summonZones(duel, "you", extra(duel, "you", "fusion"))).toEqual([0, 1, 3, 4]);
	});
	it(`${cites("rules", "link-pendulum-still-restricted")} treats a face-up Pendulum Monster in the Extra Deck like a Link Monster, and one in the hand like any monster`, () => {
		let duel = start({ you: [] });
		duel = createDuel({ seed: 1, you: { deck: ["pendulum", "pendulum"] }, rival: { deck: [] }, defs });
		const [inHand, inExtra] = duel.piles.you.deck;
		duel = moveCard(duel, inHand!, { zone: "hand" });
		duel = moveCard(duel, inExtra!, { zone: "extra", face: "up" });
		expect(summonZones(duel, "you", inHand!)).toEqual([0, 1, 2, 3, 4]);
		expect(summonZones(duel, "you", inExtra!)).toEqual([5, 6]);
	});
});

describe("choosing the zone a card is placed in", () => {
	const defs = { ...plainCards(), "normal-4": { code: "normal-4", kind: "monster" as const, facts: { level: 4, normal: true as const } } };
	it(`${cites("rules", "zone-five-slots")} ${cites("rules", "spell-trap-five-slots")} offers each Summon, Set and activation from the hand with the free zones it may go to, and places the card in the one chosen`, () => {
		const start = position({ defs, you: { hand: ["normal-4", "trap", "spell"], monsters: ["monster"], set: ["other-trap"] } });
		const actions = legalActions(start);
		const summon = actions.find((action) => action.type === "summon")!;
		const set = actions.find((action) => action.type === "set" && start.cards[action.card]!.code === "trap")!;
		const spell = actions.find((action) => action.type === "activate" && start.cards[action.card]!.code === "spell")!;
		expect(summon).toMatchObject({ zones: [1, 2, 3, 4] });
		expect(set).toMatchObject({ zones: [1, 2, 3, 4] });
		expect(spell).toMatchObject({ zones: [1, 2, 3, 4] });
		const summoned = act(start, { ...summon, zone: 3 } as Action);
		expect(summoned.cards[summon.type === "summon" ? summon.card : 0]!.slot).toBe(3);
		const setDown = act(start, { ...set, zone: 4 } as Action);
		expect(setDown.cards[(set as { card: number }).card]!).toMatchObject({ zone: "spell", face: "down", slot: 4 });
		const activated = act(start, { ...spell, zone: 2 } as Action);
		expect(activated.cards[(spell as { card: number }).card]!).toMatchObject({ zone: "spell", slot: 2 });
		expect(activated.chain[0]!.card.slot).toBe(2);
		expect(() => act(start, { ...summon, zone: 0 } as Action)).toThrow(/not a legal action/);
		expect(() => act(start, { ...set, zone: 7 } as Action)).toThrow(/not a legal action/);
		// With no zone named, the first free one.
		expect(act(start, summon).cards[(summon as { card: number }).card]!.slot).toBe(1);
	});
	it(`${cites("rules", "zone-five-slots")} offers no Normal Summon when every Main Monster Zone is taken, though the Extra Monster Zones are free`, () => {
		const full = position({ defs, you: { hand: ["normal-4"], monsters: ["monster", "monster", "monster", "monster", "monster"] } });
		expect(legalActions(full).some((action) => action.type === "summon")).toBe(false);
	});
});

describe("the Field Zone", () => {
	const log: string[] = [];
	const defs: Record<string, CardDef> = {
		...plainCards(log),
		umi: { code: "umi", kind: "spell", facts: { icon: "field" }, effects: [{ type: "activation", operation: (duel) => (log.push("umi"), duel) }] },
		sogen: { code: "sogen", kind: "spell", facts: { icon: "field" }, effects: [{ type: "activation", operation: (duel) => (log.push("sogen"), duel) }] },
		// A card that answers events, so that the core keeps them (it records none when no card could answer one).
		listener: { code: "listener", kind: "monster", effects: [{ type: "quick", range: "hand", event: () => false, operation: (duel) => duel }] },
	};
	it(`${cites("rules", "field-zone-stays")} ${cites("rules", "spell-trap-five-slots")} activates a Field Spell into the Field Zone, outside the five Spell & Trap Zones, and leaves it there after the chain`, () => {
		const start = position({ defs, you: { hand: ["umi"], set: ["trap", "trap", "trap", "trap", "other-trap"] } });
		// Your Set Traps could answer it: pass to let it resolve.
		const done = play(start, "activate umi", "pass");
		expect(codes(done, "you", "field")).toEqual(["umi"]);
		expect(cardsIn(done, "you", "field")[0]).toMatchObject({ face: "up", slot: 0 });
		expect(log).toContain("umi");
	});
	it(`${cites("rules", "field-zone-replace")} sends the Field Spell already there to the Graveyard, not destroyed, when another is activated or Set`, () => {
		const start = position({ defs, you: { hand: ["umi", "sogen"] } });
		const first = play(start, "activate umi");
		const second = play(first, "activate sogen");
		expect(codes(second, "you", "field")).toEqual(["sogen"]);
		expect(codes(second, "you", "graveyard")).toEqual(["umi"]);
		// While Sogen's activation is on the chain, Umi has already gone: sent, not destroyed.
		const activated = play({ ...first, options: { ...first.options, everyWindow: true } }, "activate sogen");
		expect(activated.chain).toHaveLength(1);
		const sent = activated.live.find((event) => event.type === "moved" && event.after.code === "umi");
		expect(sent).toBeDefined();
		expect(sent).not.toHaveProperty("reason");
		const set = play(first, "set sogen");
		expect(cardsIn(set, "you", "field")[0]).toMatchObject({ code: "sogen", face: "down", slot: 0 });
		expect(codes(set, "you", "graveyard")).toEqual(["umi"]);
	});
	it(`${cites("rules", "field-set-inactive")} activates a Set Field Spell where it is, in the Field Zone`, () => {
		const start = position({ defs, you: { hand: ["umi"] } });
		const set = play(start, "set umi");
		expect(cardsIn(set, "you", "field")[0]).toMatchObject({ face: "down" });
		const done = play(set, "activate umi");
		expect(cardsIn(done, "you", "field")[0]).toMatchObject({ code: "umi", face: "up", slot: 0 });
		expect(codes(done, "you", "spell")).toEqual([]);
	});
});

describe("Pendulum Zones", () => {
	const log: string[] = [];
	const defs: Record<string, CardDef> = {
		...plainCards(log),
		// A made-up Pendulum Monster: its Pendulum Effect works in a Pendulum Zone, its monster effect in the Monster Zone.
		scale: {
			code: "scale",
			kind: "monster",
			facts: { level: 4, pendulum: { scale: 1 } },
			effects: [
				{ type: "activation", operation: (duel) => (log.push("scale placed"), duel) },
				{ type: "ignition", range: "pendulum", once: { scope: "instance" }, operation: (duel) => (log.push("pendulum effect"), duel) },
				{ type: "ignition", range: "field", once: { scope: "instance" }, operation: (duel) => (log.push("monster effect"), duel) },
			],
		},
		// Its monster effect is continuous: "this card gains 500 ATK" (in the Monster Zone only); its Pendulum Effect gives your monsters 100.
		"scale-continuous": {
			code: "scale-continuous",
			kind: "monster",
			facts: { level: 4, atk: 1000, pendulum: { scale: 8 } },
			effects: [
				{ type: "continuous", range: "field", modifies: () => [{ kind: "add", stat: "atk", by: 500 }], operation: (duel) => duel },
				{ type: "continuous", range: "pendulum", modifies: () => [{ kind: "add", stat: "atk", by: 100 }], affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller, operation: (duel) => duel },
			],
		},
	};
	it(`${cites("rules", "pendulum-zones")} activates a Pendulum Monster as a Spell, in the Main Phase, only in a free leftmost or rightmost Spell & Trap Zone, and it stays there`, () => {
		const start = position({ defs, you: { hand: ["scale", "spell"] } });
		const placing = legalActions(start).find((action) => action.type === "activate" && start.cards[action.card]!.code === "scale")!;
		expect(placing).toMatchObject({ zones: [0, 4] });
		const spellFirst = act(start, { ...legalActions(start).find((action) => action.type === "set" && start.cards[action.card]!.code === "spell")!, zone: 0 } as Action);
		const left = legalActions(spellFirst).find((action) => action.type === "activate" && spellFirst.cards[action.card]!.code === "scale")!;
		expect(left).toMatchObject({ zones: [4] });
		const done = act(start, { ...placing, zone: 4 } as Action);
		const card = done.cards[(placing as { card: number }).card]!;
		expect(card).toMatchObject({ zone: "spell", slot: 4, face: "up" });
		expect(log).toContain("scale placed");
		expect(pendulumZones(done, "you")).toEqual([card.id]);
		// Not offered outside the Main Phase, nor as a response.
		expect(offered(position({ defs, phase: "battle", you: { hand: ["scale"] } }))).toEqual(["pass"]);
		const rivalTurn = position({ defs, options: { everyWindow: true }, turn: "rival", rival: { hand: ["quick-play"] }, you: { hand: ["scale"] } });
		expect(offered(play(rivalTurn, "activate quick-play"))).toEqual(["pass"]);
	});
	it(`${cites("rules", "pendulum-zones")} uses the Pendulum Effect only in a Pendulum Zone and the monster effect only in the Monster Zone`, () => {
		log.length = 0;
		const inZone = play(position({ defs, you: { hand: ["scale"] } }), "activate scale");
		expect(offered(inZone)).toEqual(["activate scale", "pass"]);
		play(inZone, "activate scale");
		expect(log).toEqual(["scale placed", "pendulum effect"]);
		log.length = 0;
		play(position({ defs, you: { monsters: ["scale"] } }), "activate scale");
		expect(log).toEqual(["monster effect"]);
	});
	it(`${cites("rules", "pendulum-zones")} applies a continuous effect of a Pendulum Monster only from the zone its range names`, () => {
		const duel = position({ defs, you: { monsters: ["scale-continuous"], faceupSpells: ["scale-continuous"] } });
		const [monster] = duel.piles.you.monster;
		// 1000 printed, +500 from its own monster effect, +100 from the copy in the Pendulum Zone; the copy there gains nothing.
		expect(atk(duel, monster!)).toBe(1600);
	});
	it(`${cites("rules", "pendulum-to-extra")} ${cites("rules", "negated-card-not-from-field")} sends a Pendulum Monster that would go from the field to the Graveyard face-up to its owner's Extra Deck instead, from either zone; banished, it is banished`, () => {
		const start = position({ defs, you: { monsters: ["scale"], faceupSpells: ["scale"] }, rival: { hand: ["monster"] } });
		const [inMonsterZone] = start.piles.you.monster;
		const [inPendulumZone] = start.piles.you.spell;
		const destroyed = destroyCard(destroyCard(start, inMonsterZone!, MECHANIC), inPendulumZone!, MECHANIC);
		expect(destroyed.cards[inMonsterZone!]).toMatchObject({ zone: "extra", face: "up", controller: "you" });
		expect(destroyed.cards[inPendulumZone!]).toMatchObject({ zone: "extra", face: "up" });
		expect(destroyed.piles.you.extra).toEqual([inMonsterZone!, inPendulumZone!]);
		expect(moveCard(start, inMonsterZone!, { zone: "banished" }).cards[inMonsterZone!]!.zone).toBe("banished");
		// A Pendulum activation that was negated never reached the field: to the Graveyard (record `negated-card-not-from-field`; YGOProJudge agrees, no source cited).
		const negated = play(position({ defs, you: { hand: ["scale"] }, rival: { set: ["counter"] } }), "activate scale", "activate counter");
		expect(codes(negated, "you", "graveyard")).toEqual(["scale"]);
		// From the hand it goes to the Graveyard: the rule is only for the field.
		const fromHand = position({ defs, you: { hand: ["scale"] } });
		expect(moveCard(fromHand, fromHand.piles.you.hand[0]!, { zone: "graveyard" }).cards[fromHand.piles.you.hand[0]!]!.zone).toBe("graveyard");
	});
});

describe("Equip Cards", () => {
	const defs: Record<string, CardDef> = {
		...plainCards(),
		"atk-4": { code: "atk-4", kind: "monster", facts: { level: 4, atk: 1500 } },
		// A made-up Equip Spell: "Equip only to a face-up monster. It gains 1000 ATK."
		axe: {
			code: "axe",
			kind: "spell",
			facts: { icon: "equip" },
			effects: [
				{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up"), operation: (duel, link) => equip(duel, link.card.id, targetsOf(duel, link)[0]?.id ?? null) },
				{ type: "continuous", modifies: () => [{ kind: "add", stat: "atk", by: 1000 }], affects: (_duel, target, source) => source.equippedTo === target.id, operation: (duel) => duel },
			],
		},
		// "Return 1 monster on the field to the hand."
		bounce: { code: "bounce", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => moveCard(duel, link.targets[0]!, { zone: "hand" }) }] },
		// Takes control of a monster until the End Phase.
		grab: { code: "grab", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player === "you" ? "rival" : "you"].monster, operation: (duel, link) => takeControl(duel, link.targets[0]!, link.player, duel.turn.number) }] },
	};
	it(`${cites("rules", "spell-trap-five-slots")} equips a face-up monster of either player from a Spell & Trap Zone, stays there, and applies to that monster only`, () => {
		const start = position({ defs, you: { hand: ["axe"], monsters: ["atk-4"] }, rival: { monsters: ["atk-4"] } });
		expect(offered(start).filter((line) => line.startsWith("activate"))).toEqual(["activate axe > atk-4", "activate axe > atk-4"]);
		const target = start.piles.rival.monster[0]!;
		const action = legalActions(start).find((candidate) => candidate.type === "activate" && candidate.targets[0] === target)!;
		const done = act(start, { ...action, zone: 3 } as Action);
		const axe = cardsIn(done, "you", "spell")[0]!;
		expect(axe).toMatchObject({ code: "axe", slot: 3, face: "up", equippedTo: target });
		expect(equipsOf(done, target)).toEqual([axe.id]);
		expect(atk(done, target)).toBe(2500);
		expect(atk(done, done.piles.you.monster[0]!)).toBe(1500);
	});
	it(`${cites("rules", "equip-destroyed-with-monster")} destroys the Equip Card when its monster is destroyed, removed from the field or flipped face-down, and drops the link when the Equip Card itself leaves`, () => {
		const start = position({ defs, you: { hand: ["axe", "axe", "axe"], monsters: ["atk-4", "atk-4", "atk-4"] } });
		let duel = start;
		const monsters = [...start.piles.you.monster];
		for (const monster of monsters) {
			const axe = duel.piles.you.hand[0]!;
			duel = equip(moveCard(duel, axe, { zone: "spell", face: "up" }), axe, monster);
		}
		const equips = monsters.map((monster) => equipsOf(duel, monster)[0]!);
		expect(equips.every((id) => id !== undefined)).toBe(true);
		const destroyed = destroyCard(duel, monsters[0]!, MECHANIC);
		expect(destroyed.cards[equips[0]!]).toMatchObject({ zone: "graveyard", equippedTo: null });
		const banished = moveCard(duel, monsters[1]!, { zone: "banished" });
		expect(banished.cards[equips[1]!]!.zone).toBe("graveyard");
		const flipped = moveCard(duel, monsters[2]!, { zone: "monster", face: "down" });
		expect(flipped.cards[equips[2]!]!.zone).toBe("graveyard");
		// The monster moving to another of its zones keeps its Equip Card.
		const free = freeSlots(duel, "you", "monster")[0]!;
		expect(moveCard(duel, monsters[0]!, { zone: "monster", slot: free }).cards[equips[0]!]!.equippedTo).toBe(monsters[0]);
		// The Equip Card returned to the hand: the monster has none any more.
		const back = moveCard(duel, equips[0]!, { zone: "hand" });
		expect(equipsOf(back, monsters[0]!)).toEqual([]);
		expect(back.cards[monsters[0]!]!.zone).toBe("monster");
	});
	// YGOProJudge (2026-11-23, no source cited): an Equip Spell whose monster has gone equips nothing and is sent to the Graveyard after the chain, not destroyed.
	it("sends an Equip Spell that could not equip to the Graveyard after the chain like any Spell (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs, you: { hand: ["axe"], monsters: ["atk-4"] }, rival: { set: ["bounce"] } });
		const done = play(start, "activate axe > atk-4", "activate bounce > atk-4");
		expect(codes(done, "you", "graveyard")).toEqual(["axe"]);
		expect(codes(done, "you", "hand")).toEqual(["atk-4"]);
	});
	// YGOProJudge (2026-11-23, no source cited): a control change leaves the Equip Card where it is, still equipped.
	it("keeps an Equip Card equipped, in its own Spell & Trap Zone, when the monster changes control (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs, you: { hand: ["grab"] }, rival: { monsters: ["atk-4"], faceupSpells: ["axe"] } });
		const axe = start.piles.rival.spell[0]!;
		const monster = start.piles.rival.monster[0]!;
		const equipped = { ...start, cards: { ...start.cards, [axe]: { ...start.cards[axe]!, equippedTo: monster } } };
		const taken = play(equipped, "activate grab > atk-4", "place 0");
		expect(taken.cards[monster]!.controller).toBe("you");
		expect(taken.cards[axe]).toMatchObject({ zone: "spell", controller: "rival", equippedTo: monster });
		expect(atk(taken, monster)).toBe(2500);
	});
});

describe("zones chosen while an effect resolves or as the End Phase begins", () => {
	const defs: Record<string, CardDef> = {
		...plainCards(),
		"atk-4": { code: "atk-4", kind: "monster", facts: { level: 4, atk: 1500 } },
		"link-top": { code: "link-top", kind: "monster", facts: { frame: "link", arrows: ["top"] } },
		grab: { code: "grab", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player === "you" ? "rival" : "you"].monster, operation: (duel, link) => takeControl(duel, link.targets[0]!, link.player, duel.turn.number) }] },
	};
	const toEnd = (duel: Duel) => {
		for (let guard = 0; guard < 20 && duel.turn.phase !== "end" && !duel.asking; guard++) duel = play(duel, "pass");
		return duel;
	};
	it(`${cites("rules", "control-extra-zone-to-main")} ${cites("rules", "control-until-end-phase")} the player taking a monster picks a free Main Monster Zone for it, even from an Extra Monster Zone; its owner picks one when it goes back`, () => {
		let start = position({ defs, you: { hand: ["grab"], monsters: ["atk-4"] }, rival: { hand: ["link-top"], monsters: ["atk-4"] } });
		start = moveCard(start, start.piles.rival.hand[0]!, { zone: "monster", slot: 5 });
		const link = start.piles.rival.monster.find((id) => start.cards[id]!.code === "link-top")!;
		const asked = play(start, "activate grab > link-top");
		expect(asked.asking).toMatchObject({ player: "you" });
		expect(offered(asked)).toEqual(["place 1", "place 2", "place 3", "place 4"]);
		const taken = play(asked, "place 3");
		expect(taken.cards[link]).toMatchObject({ controller: "you", zone: "monster", slot: 3 });
		const returning = toEnd(taken);
		expect(returning.asking).toMatchObject({ player: "rival" });
		// Not the Extra Monster Zone: a Main Monster Zone of the rival (the one in slot 0 is taken).
		expect(offered(returning)).toEqual(["place 1", "place 2", "place 3", "place 4"]);
		const back = play(returning, "place 2");
		expect(back.cards[link]).toMatchObject({ controller: "rival", slot: 2 });
		expect(back.turn.phase).toBe("end");
	});
	it("gives back a monster taken during the End Phase as the turn ends, to its owner's first free zone, asking nobody between turns (the core's reading)", () => {
		const start = position({ defs, phase: "end", you: { hand: ["grab"] }, rival: { monsters: ["monster", "atk-4"] } });
		const taken = play(start, "activate grab > atk-4", "place 2");
		const id = taken.piles.you.monster[0]!;
		const next = play(taken, "pass");
		expect(next.turn.player).toBe("rival");
		expect(next.asking).toBeNull();
		expect(next.cards[id]).toMatchObject({ controller: "rival", slot: 1 });
	});
	it("takes the only free zone without asking", () => {
		const start = position({ defs, you: { hand: ["grab"], monsters: ["monster", "monster", "monster", "monster"] }, rival: { monsters: ["atk-4"] } });
		const taken = play(start, "activate grab > atk-4");
		expect(taken.asking).toBeNull();
		expect(taken.cards[taken.piles.you.monster.at(-1)!]!.slot).toBe(4);
	});
	// YGOProJudge (2026-11-23, no source cited): with no free Main Monster Zone, a returning monster is destroyed by the game's rules.
	it("destroys a monster that cannot go back because its owner has no free Main Monster Zone (YGOProJudge lead, no Konami record)", () => {
		const start = position({ defs, you: { hand: ["grab"] }, rival: { hand: ["monster", "monster", "monster", "monster", "monster"], monsters: ["atk-4"] } });
		const taken = play(start, "activate grab > atk-4", "place 0");
		let full = taken;
		for (const id of full.piles.rival.hand) full = moveCard(full, id, { zone: "monster" });
		const ended = toEnd(full);
		expect(ended.asking).toBeNull();
		expect(codes(ended, "rival", "graveyard")).toEqual(["atk-4"]);
	});
});

describe("review fixes (step 7)", () => {
	const defs: Record<string, CardDef> = {
		...plainCards(),
		umi: { code: "umi", kind: "spell", facts: { icon: "field" }, effects: [{ type: "activation", operation: (duel) => duel }] },
		sogen: { code: "sogen", kind: "spell", facts: { icon: "field" } },
		"atk-4": { code: "atk-4", kind: "monster", facts: { level: 4, atk: 1500 } },
		axe: { code: "axe", kind: "spell", facts: { icon: "equip" } },
	};
	it(`${cites("rules", "field-zone-stays")} sends a Field Spell whose activation was negated to the Graveyard`, () => {
		const done = play(position({ defs, you: { hand: ["umi"] }, rival: { set: ["counter"] } }), "activate umi", "activate counter");
		expect(codes(done, "you", "field")).toEqual([]);
		expect(codes(done, "you", "graveyard")).toEqual(["umi"]);
	});
	it(`${cites("rules", "field-zone-replace")} sends the receiver's Field Spell to the Graveyard when a Field Spell changes control to them`, () => {
		const start = position({ defs, you: { faceupSpells: ["sogen"] }, rival: { faceupSpells: ["umi"] } });
		expect(codes(start, "you", "field")).toEqual(["sogen"]);
		const given = changeControl(start, start.piles.rival.field[0]!, "you");
		expect(codes(given, "you", "field")).toEqual(["umi"]);
		expect(codes(given, "you", "graveyard")).toEqual(["sogen"]);
	});
	it("Summons to another free Main Monster Zone when the one chosen was taken during the Summon's window (the core's reading)", () => {
		const start = position({ defs, you: { hand: ["atk-4", "monster"] } });
		const [summoned, other] = start.piles.you.hand;
		const attempted = beginSummon(start, "you", summoned!, "normal", 2);
		const taken = moveCard(attempted, other!, { zone: "monster", slot: 2 });
		const done = finishSummon(taken);
		expect(done.cards[summoned!]).toMatchObject({ zone: "monster", slot: 0 });
	});
	it(`${cites("rules", "equip-destroyed-with-monster")} keeps an Equip Card's link when only its controller changes`, () => {
		let duel = position({ defs, you: { monsters: ["atk-4"], faceupSpells: ["axe"] } });
		const [monster] = duel.piles.you.monster;
		const [axe] = duel.piles.you.spell;
		duel = equip(duel, axe!, monster!);
		duel = moveCard(duel, axe!, { zone: "spell", controller: "rival" });
		expect(duel.cards[axe!]!.equippedTo).toBe(monster);
		expect(destroyCard(duel, monster!, MECHANIC).cards[axe!]!.zone).toBe("graveyard");
	});
});
