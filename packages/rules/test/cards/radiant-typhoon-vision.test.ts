import { describe, expect, it } from "vitest";
import { addModifier, cites, type Duel, moveCard, printedFacts } from "../../src";
import { codes, offered, play } from "../rules/fixtures";
import { all, find, resolve } from "./sky-striker-fixtures";
import { board6, effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";

const card = "radiant-typhoon-vision";
const MST = "mystical-space-typhoon";
const DRAW = 0;
const SEARCH = 1;
const SET_FROM_GY = 2;
const SET_FROM_BANISHMENT = 3;
/** Two identical cards: the Deck of a player who draws exactly these (a Deck is shuffled, so the order is not chosen). */
const two = ["fixture-quick-spell", "fixture-quick-spell"];
/** The rival destroys the player's Set card with "Mystical Space Typhoon", and the chain resolves: the player may then use the effect that Sets it. */
const destroyedByTyphoon = (start: Duel): Duel => resolve(play(start, `activate ${MST} > ${card}`));
const rivalTurn = (you: Parameters<typeof board6>[0]) => board6(you, { hand: [MST] }, {}, "rival");

describe("Radiant Typhoon Vision, written as effect records", () => {
	it(`${cites("radiant-typhoon-vision", "facts")} is a Quick-Play Spell, a "Radiant Typhoon" card that mentions "Mystical Space Typhoon" and itself`, () => {
		const duel = board6({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Radiant Typhoon Vision", archetypes: ["Radiant Typhoon"], mentions: ["Mystical Space Typhoon", "Radiant Typhoon Vision"] });
	});

	describe("the choice of an effect", () => {
		it(`${cites("radiant-typhoon-vision", "notes-chain-block")} ${cites("radiant-typhoon-vision", "notes-mode")} ${cites("radiant-typhoon-vision", "choose")} is activated as the card itself, with one of its two effects chosen, each a Chain Link of its own kind`, () => {
			const start = board6({ hand: [card], deck: [...two, MST] , graveyard: [MST] });
			expect(effectsOffered(start, card)).toEqual([DRAW, SEARCH]);
			const drawing = playEffect(start, card, DRAW);
			expect(drawing.chain).toHaveLength(1);
			expect(drawing.chain[0]!).toMatchObject({ player: "you", effect: DRAW, categories: ["draw"] });
			expect(drawing.cards[drawing.chain[0]!.card.id]!.zone).toBe("spell");
			const searching = playEffect(start, card, SEARCH);
			expect(searching.chain[0]!).toMatchObject({ effect: SEARCH, categories: ["search"] });
			// Resolved, the Spell Card goes to the Graveyard like any other.
			expect(find(play(resolve(searching), `choose ${MST}`), card).zone).toBe("graveyard");
		});
	});

	describe("the first effect: draw", () => {
		it(`${cites("radiant-typhoon-vision", "draw")} ${cites("radiant-typhoon-vision", "notes-draw-then")} draws 2 cards, then discards the entire hand when it holds no "Radiant Typhoon" card and no Quick-Play Spell`, () => {
			const start = board6({ hand: [card, "fixture-filler", "fixture-trap"], deck: ["fixture-filler", "fixture-other-spell"] });
			const done = resolve(playEffect(start, card, DRAW));
			expect(codes(done, "you", "hand")).toEqual([]);
			expect(codes(done, "you", "graveyard").sort()).toEqual([card, "fixture-filler", "fixture-filler", "fixture-other-spell", "fixture-trap"].sort());
			expect(codes(done, "you", "deck")).toEqual([]);
		});
		it(`${cites("radiant-typhoon-vision", "draw")} ${cites("radiant-typhoon-vision", "notes-draw-then")} discards 1 card of the hand that is a "Radiant Typhoon" card or a Quick-Play Spell, of the player's choice, and keeps the rest`, () => {
			const start = board6({ hand: [card, "fixture-radiant", "fixture-quick-spell", "fixture-filler", "fixture-radiant-spell", "fixture-other-spell"], deck: ["fixture-filler", "fixture-trap"] });
			const asked = resolve(playEffect(start, card, DRAW));
			expect(offered(asked).filter((label) => label.startsWith("choose")).sort()).toEqual(["choose fixture-quick-spell", "choose fixture-radiant", "choose fixture-radiant-spell"]);
			const done = play(asked, "choose fixture-radiant");
			expect(codes(done, "you", "graveyard").sort()).toEqual([card, "fixture-radiant"].sort());
			expect(codes(done, "you", "hand").sort()).toEqual(["fixture-filler", "fixture-filler", "fixture-other-spell", "fixture-quick-spell", "fixture-radiant-spell", "fixture-trap"].sort());
		});
		it(`${cites("radiant-typhoon-vision", "notes-not-simultaneous")} the cards drawn count for the discard: a Quick-Play Spell drawn spares the hand, and may itself be the one discarded`, () => {
			const start = board6({ hand: [card, "fixture-filler"], deck: two });
			const asked = resolve(playEffect(start, card, DRAW));
			// The hand held no such card before the draw: with both drawn it is only the drawn ones that are offered, and the other card stays.
			expect(offered(asked).filter((label) => label.startsWith("choose"))).toEqual(["choose fixture-quick-spell", "choose fixture-quick-spell"]);
			const done = play(asked, "choose fixture-quick-spell");
			expect(codes(done, "you", "hand").sort()).toEqual(["fixture-filler", "fixture-quick-spell"]);
			expect(codes(done, "you", "graveyard").sort()).toEqual([card, "fixture-quick-spell"].sort());
		});
		it(`${cites("radiant-typhoon-vision", "notes-draw-then")} this card is not in the hand when the discard is read (it is on the field), so a copy in the hand counts and the activated one does not`, () => {
			const start = board6({ hand: [card, card], deck: ["fixture-filler", "fixture-trap"] });
			const asked = resolve(playEffect(start, card, DRAW));
			// The second copy is a Quick-Play Spell and a "Radiant Typhoon" card: the only card that may be discarded, so it is taken without a question.
			expect(asked.asking).toBeFalsy();
			// Both copies are in the Graveyard: the one discarded, and the one activated (sent there after the chain).
			expect(codes(asked, "you", "graveyard")).toEqual([card, card]);
			expect(codes(asked, "you", "hand").sort()).toEqual(["fixture-filler", "fixture-trap"]);
			expect(all(asked, card).map((entry) => entry.zone)).toEqual(["graveyard", "graveyard"]);
		});
		it(`${cites("radiant-typhoon-vision", "draw")} discards nothing when the draw did not succeed (a lock on drawing set in the chain)`, () => {
			const start = board6({ hand: [card, "fixture-filler"], deck: two });
			const chained = playEffect(start, card, DRAW);
			const locked = addModifier(chained, { affects: () => false, until: chained.turn.number, layer: { kind: "lock", what: "draw", who: "you" } });
			const done = resolve(locked);
			expect(codes(done, "you", "hand")).toEqual(["fixture-filler"]);
			expect(codes(done, "you", "deck")).toEqual(two);
		});
		it(`${cites("radiant-typhoon-vision", "draw")} cannot be activated with fewer than 2 cards in the Deck or while the player cannot draw by card effects (YGOProJudge only for Pot of Greed, asked 2026-11-23 and 2026-11-24, no source cited)`, () => {
			expect(effectsOffered(board6({ hand: [card], deck: ["fixture-filler"] }), card)).toEqual([]);
			expect(effectsOffered(board6({ hand: [card], deck: two }), card)).toEqual([DRAW]);
			const locked = addModifier(board6({ hand: [card], deck: two }), { affects: () => false, until: 3, layer: { kind: "lock", what: "draw", who: "you" } });
			expect(effectsOffered(locked, card)).toEqual([]);
		});
	});

	describe("the second effect: add Mystical Space Typhoon", () => {
		it(`${cites("radiant-typhoon-vision", "search")} adds 1 "Mystical Space Typhoon" from the Deck or the GY to the hand, the player choosing among both (no target)`, () => {
			const start = board6({ hand: [card], deck: [MST, "fixture-filler"], graveyard: [MST] });
			const chained = playEffect(start, card, SEARCH);
			expect(chained.chain[0]!.targets).toEqual([]);
			const asked = resolve(chained);
			expect(offered(asked).filter((label) => label.startsWith("choose"))).toEqual([`choose ${MST}`, `choose ${MST}`]);
			const fromGraveyard = play(asked, `choose ${MST}`);
			expect(codes(fromGraveyard, "you", "hand")).toEqual([MST]);
			// One copy came from one place and one from the other: after two choices of the same label both places have been used.
			const second = play(resolve(playEffect(board6({ hand: [card, card], deck: [MST], graveyard: [MST] }), card, SEARCH)), `choose ${MST}`);
			expect(codes(second, "you", "hand")).toEqual([card, MST]);
			expect(second.piles.you.deck.length + second.piles.you.graveyard.length).toBe(2);
		});
		it(`${cites("radiant-typhoon-vision", "search")} cannot be activated with no "Mystical Space Typhoon" in the Deck or the GY`, () => {
			expect(effectsOffered(board6({ hand: [card], deck: ["fixture-filler"], graveyard: ["fixture-quick-spell"] }), card)).toEqual([]);
			expect(effectsOffered(board6({ hand: [card], graveyard: [MST] }), card)).toEqual([SEARCH]);
		});
	});

	describe("the sequence of the first effect, and the locks", () => {
		const watching = (duel: Duel, label: string) => offered(duel).some((entry) => entry.startsWith("activate") && entry.includes(label));
		it(`${cites("radiant-typhoon-vision", "notes-not-simultaneous")} ${cites("radiant-typhoon-vision", "notes-draw-then")} the discard comes after the draw as a separate step, so an optional "when" effect that answered the draw misses the timing, as one that answered the add of the second effect does not`, () => {
			const start = board6({ hand: [card], monsters: ["fixture-draw-watcher"], deck: [...two, MST] });
			const drawn = play(resolve(playEffect(start, card, DRAW)), "choose fixture-quick-spell");
			expect(codes(drawn, "you", "hand")).toEqual(["fixture-quick-spell"]);
			expect(watching(drawn, "fixture-draw-watcher")).toBe(false);
			// The same watcher answers a card added from the Deck to the hand by the second effect, which has nothing after it.
			const answering = resolve(playEffect(start, card, SEARCH));
			const searched = answering.asking ? play(answering, `choose ${MST}`) : answering;
			expect(codes(searched, "you", "hand")).toEqual([MST]);
			expect(watching(searched, "fixture-draw-watcher")).toBe(true);
		});
		it(`${cites("radiant-typhoon-vision", "search")} cannot be activated while the player cannot add cards from the Deck to the hand, which a lock on drawing does not stop`, () => {
			const start = board6({ hand: [card], deck: [MST, "fixture-filler", "fixture-filler"], graveyard: [MST] });
			const noAdd = addModifier(start, { affects: () => true, until: start.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			expect(effectsOffered(noAdd, card)).not.toContain(SEARCH);
			const noDraw = addModifier(start, { affects: () => false, until: start.turn.number, layer: { kind: "lock", what: "draw", who: "you" } });
			expect(effectsOffered(noDraw, card)).toEqual([SEARCH]);
		});
	});

	describe("each of the two effects once per turn", () => {
		const start = () => board6({ hand: [card, card, card], deck: [...two, MST, MST] });
		it(`${cites("radiant-typhoon-vision", "choose")} ${cites("radiant-typhoon-vision", "draw")} a copy that used the first effect leaves the second to every copy, and no copy can use the first again`, () => {
			const used = resolve(playEffect(start(), card, DRAW));
			// The draw put 2 Quick-Play Spells in the hand: the discard is of one of them.
			const done = play(used, "choose fixture-quick-spell");
			expect(effectsOffered(done, card)).toEqual([SEARCH]);
		});
		it(`${cites("radiant-typhoon-vision", "search")} ${cites("radiant-typhoon-vision", "choose")} a copy that used the second effect leaves the first to every copy, and no copy can use the second again`, () => {
			const used = play(resolve(playEffect(start(), card, SEARCH)), `choose ${MST}`);
			expect(effectsOffered(used, card)).toEqual([DRAW]);
		});
		it(`${cites("radiant-typhoon-vision", "qa-mode-counts-when-negated")} an effect whose activation was negated is still used up, and the other one stays available`, () => {
			const begin = board6({ hand: [card, card], deck: [...two, MST] }, { set: ["counter"] });
			const chained = playEffect(begin, card, DRAW);
			const negated = resolve(play(chained, "activate counter"));
			expect(find(negated, "counter").zone).toBe("graveyard");
			expect(codes(negated, "you", "hand")).toEqual([card]);
			expect(effectsOffered(negated, card)).toEqual([SEARCH]);
		});
		it(`${cites("radiant-typhoon-vision", "qa-mode-counts-when-negated")} an effect that was negated while it was on the chain is still used up too, and nothing is drawn`, () => {
			const begin = board6({ hand: [card, card], deck: [...two, MST] }, { set: ["fixture-effect-negator"] });
			const negated = resolve(play(playEffect(begin, card, DRAW), "activate fixture-effect-negator"));
			expect(codes(negated, "you", "hand")).toEqual([card]);
			expect(codes(negated, "you", "deck").length).toBe(3);
			expect(effectsOffered(negated, card)).toEqual([SEARCH]);
		});
	});

	describe("the Set effect", () => {
		it(`${cites("radiant-typhoon-vision", "set")} ${cites("radiant-typhoon-vision", "notes-set-chain-block")} is offered when "Mystical Space Typhoon" destroyed this card Set on the field, and it makes a Chain Link whose resolution Sets the card`, () => {
			const done = destroyedByTyphoon(rivalTurn({ set: [card] }));
			expect(find(done, card).zone).toBe("graveyard");
			expect(effectsOffered(done, card)).toEqual([SET_FROM_GY]);
			const chained = playEffect(done, card, SET_FROM_GY);
			expect(chained.chain).toHaveLength(1);
			expect(chained.chain[0]!).toMatchObject({ effect: SET_FROM_GY, categories: ["set-from-graveyard"] });
			const set = play(resolve(chained), "place 0");
			expect(find(set, card)).toMatchObject({ zone: "spell", face: "down", controller: "you" });
			// It was Set this turn: a Quick-Play Spell that was just Set cannot be activated until the next turn.
			expect(set.setThisTurn).toContain(find(set, card).id);
		});
		it(`${cites("radiant-typhoon-vision", "set")} is also offered when the face-up card was destroyed by the player's own "Mystical Space Typhoon"`, () => {
			const start = board6({ hand: [MST], faceupSpells: [card] });
			const done = destroyedByTyphoon(start);
			expect(effectsOffered(done, card)).toEqual([SET_FROM_GY]);
		});
		it(`${cites("radiant-typhoon-vision", "set")} is optional: it can be declined, and the card then stays in the Graveyard`, () => {
			const done = destroyedByTyphoon(rivalTurn({ set: [card] }));
			const declined = play(done, "pass");
			expect(find(declined, card).zone).toBe("graveyard");
		});
		it(`${cites("radiant-typhoon-vision", "set")} is not offered when another card destroyed it (not "Mystical Space Typhoon"), nor when it was only sent to the Graveyard`, () => {
			const byOther = resolve(play(board6({ set: [card] }, { hand: ["fixture-destroyer"] }, {}, "rival"), `activate fixture-destroyer > ${card}`));
			expect(find(byOther, card).zone).toBe("graveyard");
			expect(effectsOffered(byOther, card)).toEqual([]);
			expect(effectsOffered(resolve(play(byOther, "pass")), card)).toEqual([]);
		});
		it(`${cites("radiant-typhoon-vision", "set")} needs a free Spell & Trap Zone: with all five full the destroyed card's own zone is the one, and it is the only one offered`, () => {
			const full = rivalTurn({ set: [card, "fixture-trap", "fixture-trap", "fixture-trap", "fixture-trap"] });
			const done = destroyedByTyphoon(full);
			expect(effectsOffered(done, card)).toEqual([SET_FROM_GY]);
			// One free zone only: nothing is asked and the card is Set in it.
			const set = resolve(playEffect(done, card, SET_FROM_GY));
			expect(set.asking).toBeFalsy();
			expect(find(set, card)).toMatchObject({ zone: "spell", face: "down" });
		});
		it(`${cites("radiant-typhoon-vision", "notes-set-where")} is activated from the Graveyard when the card went there, and from banishment (face-up) when it was banished instead, never from both`, () => {
			const start = rivalTurn({ set: [card] });
			const banishing = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
			const done = destroyedByTyphoon(banishing);
			expect(find(done, card)).toMatchObject({ zone: "banished", face: "up" });
			expect(effectsOffered(done, card)).toEqual([SET_FROM_BANISHMENT]);
			const set = play(resolve(playEffect(done, card, SET_FROM_BANISHMENT)), "place 0");
			expect(find(set, card)).toMatchObject({ zone: "spell", face: "down" });
		});
		it(`${cites("radiant-typhoon-vision", "notes-set-where")} is not offered when the card was banished face-down instead of face-up (the notes name a card banished face-up)`, () => {
			const start = rivalTurn({ set: [card] });
			const banishing = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished", face: "down" } });
			const done = destroyedByTyphoon(banishing);
			expect(find(done, card)).toMatchObject({ zone: "banished", face: "down" });
			expect(effectsOffered(done, card)).toEqual([]);
		});
		it(`${cites("radiant-typhoon-vision", "set")} Sets nothing when the card left the Graveyard before the effect resolves, or left and came back (another card)`, () => {
			const done = destroyedByTyphoon(rivalTurn({ set: [card] }));
			const chained = playEffect(done, card, SET_FROM_GY);
			const id = find(chained, card).id;
			const banished = resolve(moveCard(chained, id, { zone: "banished" }));
			expect(banished.asking).toBeFalsy();
			expect(find(banished, card).zone).toBe("banished");
			const back = resolve(moveCard(moveCard(chained, id, { zone: "hand" }), id, { zone: "graveyard" }));
			expect(back.asking).toBeFalsy();
			expect(find(back, card).zone).toBe("graveyard");
		});
		it(`${cites("radiant-typhoon-vision", "set")} still triggers when this card was destroyed in a chain it was activated in, and its own effect has resolved anyway (the core's reading: no Konami page found for it)`, () => {
			const start = board6({ hand: [card], deck: two }, { set: [MST] }, {}, "you");
			const chained = playEffect(start, card, DRAW);
			// The rival answers with their own Set "Mystical Space Typhoon" aimed at the card on the chain.
			const answered = play(chained, `activate ${MST} > ${card}`);
			expect(answered.chain).toHaveLength(2);
			const done = resolve(play(resolve(answered), "choose fixture-quick-spell"));
			expect(codes(done, "you", "hand")).toEqual(["fixture-quick-spell"]);
			expect(find(done, card).zone).toBe("graveyard");
			expect(effectsOffered(done, card)).toContain(SET_FROM_GY);
		});
	});
});
