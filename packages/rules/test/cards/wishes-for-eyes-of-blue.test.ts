import { describe, expect, it } from "vitest";
import { addModifier, atk, CARD_DEFS, type CardDef, cardTypeOf, cites, type Duel, effectDestruction, fromSpells, moveCard, negateActivationAndDestroy, negateEffect, targetsOf } from "../../src";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";

const card = "wishes-for-eyes-of-blue";
const BEWD = "Blue-Eyes White Dragon";

/**
 * Made-up cards around it (none registered; "Blue-Eyes White Dragon" and the cards that go with it are not written yet): monsters
 * with that printed name, "Blue-Eyes" Extra Deck monsters, Spells and Traps that mention it or not. The Level 1 LIGHT Tuner is the
 * real Effect Veiler.
 */
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts, ...more });
const inert = (duel: Duel) => duel;
const all: CardDef[] = [
	CARD_DEFS[card]!,
	CARD_DEFS["effect-veiler"]!,
	CARD_DEFS["ghost-ogre-snow-rabbit"]!,
	CARD_DEFS["solemn-judgment"]!,
	CARD_DEFS["dd-crow"]!,
	monster("test-bewd", { name: BEWD, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, normal: true }),
	// The same monster, "unaffected by Spell effects".
	monster("test-bewd-spell-proof", { name: BEWD, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500 }, { effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromSpells }] }] }),
	monster("test-other-dragon", { name: "Test Other Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, normal: true }),
	monster("test-blue-eyes-fusion", { name: "Test Blue-Eyes Fusion", attribute: "LIGHT", monsterType: "Dragon", archetypes: ["Blue-Eyes"], frame: "fusion", level: 10, atk: 3000, def: 2500 }),
	monster("test-blue-eyes-synchro", { name: "Test Blue-Eyes Synchro", attribute: "LIGHT", monsterType: "Dragon", archetypes: ["Blue-Eyes"], frame: "synchro", level: 9, atk: 2500, def: 3000 }),
	monster("test-other-fusion", { name: "Test Other Fusion", attribute: "DARK", monsterType: "Fiend", frame: "fusion", level: 6, atk: 2000, def: 2000 }),
	// A Level 1 LIGHT monster that is not a Tuner, a Level 1 DARK Tuner, and a monster whose text mentions the name.
	monster("test-light-1", { name: "Test Light 1", attribute: "LIGHT", monsterType: "Fairy", level: 1, atk: 0, def: 0, normal: true }),
	monster("test-dark-tuner-1", { name: "Test Dark Tuner 1", attribute: "DARK", monsterType: "Fiend", level: 1, tuner: true, atk: 0, def: 0, normal: true }),
	monster("test-mentioning-monster", { name: "Test Mentioning Monster", attribute: "LIGHT", monsterType: "Spellcaster", level: 4, atk: 0, def: 0, mentions: [BEWD] }),
	{ code: "test-roar", kind: "spell", facts: { name: "Test Roar", mentions: [BEWD] }, effects: [{ type: "activation", condition: () => false, operation: inert }] },
	{ code: "test-trap", kind: "trap", facts: { name: "Test Trap", mentions: [BEWD, "Test Other Dragon"] }, effects: [{ type: "activation", condition: () => false, operation: inert }] },
	// A Spell that names the archetype only, not the card.
	// Made-up answers to an effect on the chain: a Counter Trap ("negate the activation, and if you do, destroy that card"), a Trap that
	// negates the effect, and a Quick-Play Spell ("target 1 monster on the field; banish it").
	{ code: "test-counter", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, link, index) => negateActivationAndDestroy(duel, index - 1, effectDestruction(link)) }] },
	{ code: "test-effect-negator", kind: "trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
	{ code: "test-banisher", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => targetsOf(duel, link).reduce((board, target) => moveCard(board, target.id, { zone: "banished", effect: link }), duel) }] },
	// "Your opponent cannot banish cards from your GY."
	{ code: "test-warden", kind: "monster", facts: { name: "Test Warden", level: 4, atk: 0, def: 0 }, effects: [{ type: "continuous", modifies: (_duel, source) => [{ kind: "lock", what: "banish-from-graveyard", who: source.controller, banisher: "opponent" }] }] },
	{ code: "test-archetype-spell", kind: "spell", facts: { name: "Test Archetype Spell", archetypes: ["Blue-Eyes"] }, effects: [{ type: "activation", condition: () => false, operation: inert }] },
];
const defs: Record<string, CardDef> = Object.fromEntries(all.map((def) => [def.code, def]));
const board = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs, options, you, rival });
/** The activations of this card on offer: `~` marks the card discarded (the first effect), `>` the target (the second). */
const activations = (duel: Duel) => offered(duel).filter((label) => label.startsWith(`activate ${card}`));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;

describe("Wishes for Eyes of Blue, written as effect records", () => {
	it(`${cites("wishes-for-eyes-of-blue", "qa-discard-while-banished-instead")} can be activated while cards sent to the GY are banished instead: the discard is banished and the effect still resolves`, () => {
		const start = board({ hand: [card, "test-bewd"], deck: ["effect-veiler", "test-roar"] });
		const replaced = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
		expect(activations(replaced)).toEqual([`activate ${card} ~ test-bewd`]);
		const done = play(replaced, `activate ${card} ~ test-bewd`);
		// The discarded card and the resolved Spell itself (also "sent to the GY") are banished.
		expect(codes(done, "you", "banished").sort()).toEqual(["test-bewd", card].sort());
		expect(codes(done, "you", "hand").sort()).toEqual(["effect-veiler", "test-roar"]);
	});
	it(`${cites("wishes-for-eyes-of-blue", "search")} discards 1 card as its cost, then adds 1 Level 1 LIGHT Tuner and 1 Spell/Trap that mentions "Blue-Eyes White Dragon" from the Deck to the hand, never another copy of itself`, () => {
		const start = board({ hand: [card, "test-bewd", "test-other-dragon"], deck: ["effect-veiler", "test-roar", "test-trap", card, "test-light-1"] });
		// One activation per card that can be discarded: the card itself is on the field by then.
		expect(activations(start)).toEqual([`activate ${card} ~ test-bewd`, `activate ${card} ~ test-other-dragon`]);
		const asked = play(start, `activate ${card} ~ test-other-dragon`);
		expect(codes(asked, "you", "graveyard")).toEqual(["test-other-dragon"]);
		// One Tuner only: it is taken; the Spell/Trap is chosen, and the other copy of this card is not offered.
		expect(offered(asked)).toEqual(["choose test-roar", "choose test-trap"]);
		const done = play(asked, "choose test-trap");
		expect(codes(done, "you", "hand").sort()).toEqual(["effect-veiler", "test-bewd", "test-trap"]);
		expect(codes(done, "you", "deck").sort()).toEqual(["test-light-1", "test-roar", card].sort());
		expect(codes(done, "you", "graveyard").sort()).toEqual(["test-other-dragon", card].sort());
		// The Deck was shuffled after the search (with the seeded RNG of the Duel).
		expect(done.rng.state).not.toBe(start.rng.state);
	});
	it(`${cites("wishes-for-eyes-of-blue", "notes-activation")} ${cites("wishes-for-eyes-of-blue", "notes-needs-both")} is the effect of the activation of the card itself, and can be activated only with both kinds of card in the Deck and a card to discard`, () => {
		const hand = [card, "test-bewd"];
		expect(activations(board({ hand, deck: ["effect-veiler", "test-roar"] }))).toEqual([`activate ${card} ~ test-bewd`]);
		expect(activations(board({ hand, deck: ["effect-veiler"] }))).toEqual([]);
		expect(activations(board({ hand, deck: ["test-roar"] }))).toEqual([]);
		// Not a Tuner, not LIGHT: neither is "1 Level 1 LIGHT Tuner".
		expect(activations(board({ hand, deck: ["test-light-1", "test-dark-tuner-1", "test-roar"] }))).toEqual([]);
		expect(activations(board({ hand: [card], deck: ["effect-veiler", "test-roar"] }))).toEqual([]);
		// The activation of a Spell Card: Solemn Judgment negates it, and nothing is added; the discard was a cost.
		const negated = play(board({ hand, deck: ["effect-veiler", "test-roar"] }, { set: ["solemn-judgment"] }), `activate ${card} ~ test-bewd`, "activate solemn-judgment");
		expect(codes(negated, "you", "hand")).toEqual([]);
		expect(codes(negated, "you", "graveyard").sort()).toEqual(["test-bewd", card].sort());
	});
	it(`${cites("wishes-for-eyes-of-blue", "notes-mentions")} counts only a Spell/Trap whose text names "Blue-Eyes White Dragon" as a card: not one that names the archetype, and not a monster`, () => {
		const hand = [card, "test-bewd"];
		expect(activations(board({ hand, deck: ["effect-veiler", "test-archetype-spell", "test-mentioning-monster"] }))).toEqual([]);
		const done = play(board({ hand, deck: ["effect-veiler", "test-archetype-spell", "test-mentioning-monster", "test-roar"] }), `activate ${card} ~ test-bewd`);
		// One of each: nothing to choose.
		expect(codes(done, "you", "hand").sort()).toEqual(["effect-veiler", "test-roar"]);
	});
	// YGOProJudge (asked 2026-11-24): "add 1 ..., and 1 ..." is all or nothing; if one kind is missing when it resolves, nothing is added.
	it(`${cites("wishes-for-eyes-of-blue", "search")} adds nothing when one of the two kinds has left the Deck by the time it resolves (YGOProJudge lead, no Konami record)`, () => {
		const start = board({ hand: [card, "test-bewd"], deck: ["effect-veiler", "effect-veiler", "test-roar"] }, {}, { everyWindow: true });
		const activated = play(start, `activate ${card} ~ test-bewd`, "pass");
		// In response, the only Spell/Trap that mentions the name leaves the Deck: no Tuner is asked for, and none is added.
		const without = moveCard(activated, find(activated, "test-roar").id, { zone: "banished" });
		const done = play(without, "pass");
		expect(done.asking).toBeNull();
		expect(codes(done, "you", "hand")).toEqual([]);
		expect(codes(done, "you", "deck")).toEqual(["effect-veiler", "effect-veiler"]);
	});
	it(`${cites("wishes-for-eyes-of-blue", "equip")} banishes itself from the GY as its cost, targets 1 "Blue-Eyes White Dragon" you control, and equips 1 "Blue-Eyes" monster from the Extra Deck to it as an Equip Spell that gives it 400 ATK`, () => {
		const start = board({ graveyard: [card], monsters: ["test-bewd", "test-other-dragon"], extra: ["test-blue-eyes-fusion", "test-blue-eyes-synchro", "test-other-fusion"] }, { monsters: ["test-bewd"] });
		// Only your own "Blue-Eyes White Dragon" is a target.
		expect(activations(start)).toEqual([`activate ${card} > test-bewd`]);
		const asked = play(start, `activate ${card} > test-bewd`);
		expect(codes(asked, "you", "banished")).toEqual([card]);
		// The monster is chosen when the effect resolves, among the "Blue-Eyes" monsters of the Extra Deck; then its zone.
		expect(offered(asked)).toEqual(["choose test-blue-eyes-fusion", "choose test-blue-eyes-synchro"]);
		const done = play(asked, "choose test-blue-eyes-fusion", "place 2");
		const dragon = done.piles.you.monster[0]!;
		const equip = find(done, "test-blue-eyes-fusion");
		expect(equip).toMatchObject({ zone: "spell", slot: 2, face: "up", controller: "you", equippedTo: dragon });
		expect(cardTypeOf(done, equip)).toBe("spell");
		expect([atk(done, dragon), atk(done, done.piles.you.monster[1]!), atk(done, done.piles.rival.monster[0]!)]).toEqual([3400, 3000, 3000]);
		// It lasts while the card stays equipped, not "until the end of this turn".
		expect(atk({ ...done, turn: { ...done.turn, number: done.turn.number + 2 } }, dragon)).toBe(3400);
		// No target, no "Blue-Eyes" monster in the Extra Deck, or no free Spell & Trap Zone (the last: YGOProJudge lead): it cannot be activated.
		// Its owner banishes it as the cost, which "your opponent cannot banish cards from your GY" does not stop.
		const warded = board({ graveyard: [card], monsters: ["test-bewd", "test-warden"], extra: ["test-blue-eyes-fusion"] });
		expect(activations(warded)).toEqual([`activate ${card} > test-bewd`]);
		expect(codes(play(warded, `activate ${card} > test-bewd`), "you", "banished")).toEqual([card]);
		expect(activations(board({ graveyard: [card], monsters: ["test-other-dragon"], extra: ["test-blue-eyes-fusion"] }))).toEqual([]);
		expect(activations(board({ graveyard: [card], monsters: ["test-bewd"], extra: ["test-other-fusion"] }))).toEqual([]);
		expect(activations(board({ graveyard: [card], monsters: ["test-bewd"], set: ["test-roar", "test-roar", "test-roar", "test-roar", "test-roar"], extra: ["test-blue-eyes-fusion"] }))).toEqual([]);
		// In the hand it has no such effect.
		expect(activations(board({ hand: [card], monsters: ["test-bewd"], extra: ["test-blue-eyes-fusion"] }))).toEqual([]);
	});
	it(`${cites("wishes-for-eyes-of-blue", "notes-graveyard")} activates in the Graveyard and starts a Chain Link there: the opponent can respond, but not with what answers a card on the field`, () => {
		const start = board({ graveyard: [card], monsters: ["test-bewd"], extra: ["test-blue-eyes-fusion"] }, { hand: ["ghost-ogre-snow-rabbit"] }, { everyWindow: true });
		const activated = play(start, `activate ${card} > test-bewd`, "pass");
		expect(activated.chain.map((link) => [link.card.code, link.card.zone, link.speed])).toEqual([[card, "graveyard", 1]]);
		expect(offered(activated)).toEqual(["pass"]);
		// In the turn of the opponent it cannot be activated: Spell Speed 1.
		expect(activations(position({ defs, turn: "rival", you: { graveyard: [card], monsters: ["test-bewd"], extra: ["test-blue-eyes-fusion"] } }))).toEqual([]);
	});
	it(`${cites("wishes-for-eyes-of-blue", "notes-not-applied")} equips a "Blue-Eyes White Dragon" that is unaffected by Spell effects: the effect is not applied to the target (it then gains nothing from the Equip Card: YGOProJudge lead)`, () => {
		const start = board({ graveyard: [card], monsters: ["test-bewd-spell-proof"], extra: ["test-blue-eyes-fusion"] });
		const done = play(start, `activate ${card} > test-bewd-spell-proof`, "place 0");
		const dragon = done.piles.you.monster[0]!;
		expect(find(done, "test-blue-eyes-fusion")).toMatchObject({ zone: "spell", equippedTo: dragon });
		expect(atk(done, dragon)).toBe(3000);
	});
	it(`${cites("wishes-for-eyes-of-blue", "once")} lets each of its two effects be used once per turn, whichever copy is used, and both in the same turn`, () => {
		const start = board({ hand: [card, card, "test-bewd", "test-other-dragon"], graveyard: [card, card], monsters: ["test-bewd"], extra: ["test-blue-eyes-fusion", "test-blue-eyes-synchro"], deck: ["effect-veiler", "test-roar", "effect-veiler", "test-roar"] });
		const searched = play(start, `activate ${card} ~ test-other-dragon`, "choose effect-veiler", "choose test-roar");
		// The second copy in the hand cannot be activated; the effect in the Graveyard still can, with any of the copies there.
		expect(activations(searched).filter((label) => label.includes("~"))).toEqual([]);
		expect(activations(searched).filter((label) => label.includes(">"))).toHaveLength(3);
		const equipped = play(searched, `activate ${card} > test-bewd`, "choose test-blue-eyes-fusion", "place 0");
		expect(activations(equipped)).toEqual([]);
		// Two turns later, both are available again.
		const next = { ...equipped, turn: { ...equipped.turn, number: equipped.turn.number + 2 }, used: { ...equipped.used, turn: [] } };
		expect(activations(next).length).toBeGreaterThan(0);
	});
	describe("its effect in the Graveyard, on a chain", () => {
		const you: SideSpec = { graveyard: [card, "test-roar"], monsters: ["test-bewd"], extra: ["test-blue-eyes-fusion"] };
		const banishedCopy = (duel: Duel) => Object.values(duel.cards).filter((entry) => entry.code === card && entry.zone === "banished");
		it(`${cites("wishes-for-eyes-of-blue", "notes-graveyard")} when its activation is negated, stays banished (the cost was paid, there is nothing to destroy), equips nothing, and is used for the turn`, () => {
			const start = board({ ...you, graveyard: [card, card] }, { set: ["test-counter"] });
			const chained = play(start, `activate ${card} > test-bewd`);
			expect(chained.chain.map((link) => [link.card.code, link.card.zone])).toEqual([[card, "graveyard"]]);
			expect(offered(chained)).toEqual(["activate test-counter", "pass"]);
			const done = play(chained, "activate test-counter");
			expect(done.chain).toEqual([]);
			expect(done.asking).toBeNull();
			expect(banishedCopy(done)).toHaveLength(1);
			expect(codes(done, "you", "graveyard")).toEqual([card]);
			expect(find(done, "test-blue-eyes-fusion")).toMatchObject({ zone: "extra", equippedTo: null });
			expect(atk(done, done.piles.you.monster[0]!)).toBe(3000);
			// "You can only use each effect ... once per turn": the other copy in the Graveyard cannot be activated this turn.
			expect(activations(done)).toEqual([]);
		});
		it(`${cites("wishes-for-eyes-of-blue", "notes-graveyard")} when its effect is negated, stays banished and equips nothing`, () => {
			const done = play(board(you, { set: ["test-effect-negator"] }), `activate ${card} > test-bewd`, "activate test-effect-negator", "pass");
			expect(done.asking).toBeNull();
			expect(banishedCopy(done)).toHaveLength(1);
			expect(find(done, "test-blue-eyes-fusion").zone).toBe("extra");
		});
		it(`${cites("dd-crow", "text")} is no longer in the Graveyard once activated: D.D. Crow chained to it cannot target it, and it still resolves`, () => {
			const start = board(you, { hand: ["dd-crow"] });
			const chained = play(start, `activate ${card} > test-bewd`);
			// Only the other card of the Graveyard can be targeted.
			expect(offered(chained)).toEqual(["activate dd-crow > test-roar", "pass"]);
			const done = play(chained, "activate dd-crow > test-roar", "place 0");
			expect(codes(done, "you", "banished").sort()).toEqual(["test-roar", card].sort());
			expect(find(done, "test-blue-eyes-fusion")).toMatchObject({ zone: "spell", equippedTo: done.piles.you.monster[0]! });
			expect(atk(done, done.piles.you.monster[0]!)).toBe(3400);
		});
		it(`${cites("wishes-for-eyes-of-blue", "equip")} equips nothing when its target has left the field by the time it resolves, and is not answered as a Spell Card activation`, () => {
			const start = board(you, { set: ["test-banisher", "solemn-judgment"] });
			const chained = play(start, `activate ${card} > test-bewd`);
			// Solemn Judgment answers the activation of a Spell Card, not an effect activated in the Graveyard.
			expect(offered(chained)).toEqual(["activate test-banisher > test-bewd", "pass"]);
			const done = play(chained, "activate test-banisher > test-bewd", "pass", "pass");
			expect(done.asking).toBeNull();
			expect(codes(done, "you", "monster")).toEqual([]);
			expect(find(done, "test-blue-eyes-fusion").zone).toBe("extra");
			expect(banishedCopy(done)).toHaveLength(1);
		});
	});
});
