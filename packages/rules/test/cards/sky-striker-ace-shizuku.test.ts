import { describe, expect, it } from "vitest";
import { addModifier, atk, canSpecialSummon, cites, def, type Duel, FOREVER, isNegated, moveCard, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { codes, offered, play } from "../rules/fixtures";
import { board } from "./sky-striker-ace-fixtures";
import { activations, find, resolve, threeSpells } from "./sky-striker-fixtures";

const card = "sky-striker-ace-shizuku";
const raye = "sky-striker-ace-raye";
const anchor = "sky-striker-mecha-widow-anchor";
const summon = `special-summon ${card}`;
const search = `activate ${card}`;

/** Passes until the turn player holds priority in the open game state of the End Phase. */
function toEnd(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === "end" && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 60; guard++) next = play(next, "pass");
	return next;
}

/** Your Link Summon of "Sky Striker Ace - Shizuku" with a non-WATER Ace, in your Main Phase. */
const linked = (you: Record<string, string[]> = {}) => resolve(play(board({ monsters: ["fixture-ace-dark"], extra: [card], ...you }), summon, "place 5"));

describe("Sky Striker Ace - Shizuku, written as effect records", () => {
	it(`${cites("sky-striker-ace-shizuku", "facts")} is a WATER Machine Link 1 Effect Monster with 1500 ATK and its arrow at the top right, a "Sky Striker Ace" and a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Ace - Shizuku", attribute: "WATER", monsterType: "Machine", frame: "link", link: 1, arrows: ["top-right"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace - Shizuku"] });
	});

	describe("its Link Summon and its limit", () => {
		it(`${cites("sky-striker-ace-shizuku", "procedure")} needs 1 "Sky Striker Ace" monster that is not WATER as the Link Material, and sends it to the Graveyard`, () => {
			expect(offered(board({ monsters: ["fixture-ace-dark"], extra: [card] }))).toContain(summon);
			expect(offered(board({ monsters: ["fixture-ace-wind"], extra: [card] }))).toContain(summon);
			expect(offered(board({ monsters: ["fixture-ace-water"], extra: [card] }))).not.toContain(summon);
			expect(offered(board({ monsters: ["fixture-filler"], extra: [card] }))).not.toContain(summon);
			const done = linked();
			expect(find(done, "fixture-ace-dark").zone).toBe("graveyard");
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", slot: 5, summonedBy: "link" });
		});
		it(`${cites("sky-striker-ace-shizuku", "once-summon")} ${cites("sky-striker-ace-shizuku", "notes-not-effect")} ${cites("sky-striker-ace-shizuku", "notes-any-summon")} only 1 "Sky Striker Ace - Shizuku" can be Special Summoned each turn, by its procedure or an effect, and negating the monster does not lift it`, () => {
			const start = board({ extra: [card, card] });
			const [first, second] = start.piles.you.extra;
			const done = specialSummon(start, "you", first!, { slot: 5 });
			expect(canSpecialSummon(done, "you", second!)).toBe(false);
			expect(canSpecialSummon(negateCardEffects(done, first!, done.turn.number), "you", second!)).toBe(false);
			// With the first one gone from the field (the Extra Monster Zone is free again) the limit alone stops the second, until the next turn.
			const gone = moveCard(done, first!, { zone: "graveyard" });
			expect(canSpecialSummon(gone, "you", second!)).toBe(false);
			expect(canSpecialSummon({ ...gone, turn: { ...gone.turn, number: gone.turn.number + 1 } }, "you", second!)).toBe(true);
		});
	});

	describe("its Continuous Effect", () => {
		it(`${cites("sky-striker-ace-shizuku", "loss")} ${cites("sky-striker-ace-shizuku", "notes-continuous")} the monsters its controller's opponent controls lose 100 ATK and DEF for each Spell in its controller's Graveyard: Spells of any kind, no Trap or monster, the opponent's Graveyard is not counted, its own controller's monsters are not reached`, () => {
			const start = board({ extraZone: [card], monsters: ["fixture-filler"], graveyard: [...threeSpells, "fixture-trap", "fixture-filler"] }, { monsters: ["fixture-big"], graveyard: threeSpells, extraZone: ["fixture-link"] });
			const [big, link, own] = [find(start, "fixture-big").id, find(start, "fixture-link").id, find(start, "fixture-filler").id];
			expect([atk(start, big), def(start, big)]).toEqual([2700, 2200]);
			// A Link Monster has no DEF; its ATK is reduced all the same.
			expect(atk(start, link)).toBe(700);
			expect([atk(start, own), def(start, own)]).toEqual([1000, 1000]);
			const none = board({ extraZone: [card] }, { monsters: ["fixture-big"], graveyard: threeSpells });
			expect([atk(none, find(none, "fixture-big").id), def(none, find(none, "fixture-big").id)]).toEqual([3000, 2500]);
		});
		it(`${cites("sky-striker-ace-shizuku", "loss")} stops while its effects are negated, and the Spells counted are those of the player who controls it`, () => {
			const start = board({ extraZone: [card], graveyard: threeSpells }, { monsters: ["fixture-big"] });
			const big = find(start, "fixture-big").id;
			expect(atk(start, big)).toBe(2700);
			expect(atk(negateCardEffects(start, find(start, card).id, start.turn.number), big)).toBe(3000);
		});
	});

	describe("its End Phase effect", () => {
		const gy = ["fixture-ss-spell"];
		const deck = ["fixture-ss-spell", "fixture-ss-spell-b", "fixture-ss-quick", "fixture-ss-monster", "fixture-other-spell"];
		it(`${cites("sky-striker-ace-shizuku", "search")} ${cites("sky-striker-ace-shizuku", "notes-trigger")} ${cites("sky-striker-ace-shizuku", "notes-end")} during the End Phase, when it was Special Summoned this turn, adds 1 "Sky Striker" Spell from the Deck whose name is not that of a card in the Graveyard; chosen when it resolves`, () => {
			const end = toEnd(linked({ deck, graveyard: gy }));
			expect(activations(end, card)).toEqual([search]);
			const asked = resolve(play(end, search));
			// Not the Spell whose name is in the Graveyard, not a monster, not a Spell of another name.
			expect(offered(asked).sort()).toEqual(["choose fixture-ss-quick", "choose fixture-ss-spell-b"]);
			const done = play(asked, "choose fixture-ss-quick");
			expect(codes(done, "you", "hand")).toEqual(["fixture-ss-quick"]);
			expect(play(end, search).chain[0]!.categories).toEqual(["search"]);
		});
		it(`${cites("sky-striker-ace-shizuku", "search")} cannot be activated while cards cannot be added from the Deck to the hand`, () => {
			const end = toEnd(linked({ deck, graveyard: gy }));
			expect(activations(end, card)).toEqual([search]);
			expect(activations(addModifier(end, { affects: () => true, until: FOREVER, layer: { kind: "lock", what: "add-to-hand", who: "both" } }), card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-shizuku", "search")} cannot be activated with no such Spell in the Deck`, () => {
			expect(activations(toEnd(linked({ deck: ["fixture-ss-spell"], graveyard: gy })), card)).toEqual([]);
			expect(activations(toEnd(linked({ deck: ["fixture-ss-monster"] })), card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-shizuku", "notes-end")} not offered for a Shizuku that was not Special Summoned this turn`, () => {
			expect(activations(toEnd(board({ extraZone: [card], deck })), card)).toEqual([]);
			// Special Summoned in an earlier turn and still on the field: not in the End Phase of the opponent's next turn either, when its controller gets priority.
			let next = toEnd(linked({ deck, graveyard: gy }));
			expect(activations(next, card)).toEqual([search]);
			for (let guard = 0; guard < 80 && next.turn.number === 3; guard++) next = play(next, "pass");
			expect(find(next, card)).toMatchObject({ zone: "monster", specialSummoned: true });
			const later = play(toEnd(next), "pass");
			expect([later.turn.number, later.turn.phase, later.priority.holder, activations(later, card)]).toEqual([4, "end", "you", []]);
		});
		it(`${cites("sky-striker-ace-shizuku", "once")} once per turn: it is not offered again once used`, () => {
			let used = play(toEnd(linked({ deck, graveyard: gy })), search);
			while (used.chain.length > 0 && !used.asking) used = play(used, "pass");
			used = play(used, "choose fixture-ss-quick");
			expect(used.turn.phase).toBe("end");
			expect(codes(used, "you", "hand")).toEqual(["fixture-ss-quick"]);
			expect(activations(used, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-shizuku", "search")} ${cites("sky-striker-ace-shizuku", "notes-end")} in the opponent's turn too (during "the End Phase", not "your End Phase"): Special Summoned there by "Sky Striker Ace - Raye", it is offered to its controller once the turn player has passed`, () => {
			const start = board({ monsters: [raye], extra: [card], deck }, {}, {}, "rival");
			const summoned = play(resolve(play(start, "pass", `activate ${raye}`)), "place 5");
			expect(find(summoned, card)).toMatchObject({ zone: "monster", controller: "you", specialSummoned: true });
			const end = toEnd(summoned);
			expect([end.turn.player, end.priority.holder, activations(end, card)]).toEqual(["rival", "rival", []]);
			const mine = play(end, "pass");
			expect([mine.priority.holder, activations(mine, card)]).toEqual(["you", [search]]);
			expect(codes(resolve(play(resolve(play(mine, search)), "choose fixture-ss-quick")), "you", "hand")).toEqual(["fixture-ss-quick"]);
		});
		it(`${cites("sky-striker-mecha-widow-anchor", "negate")} ${cites("sky-striker-mecha-widow-anchor", "qa-negated-cost")} negated by its controller's own "Sky Striker Mecha - Widow Anchor" ("until the end of this turn", the End Phase included), it can still be activated in that End Phase: the once per turn is used and nothing is added`, () => {
			const negated = resolve(play(linked({ deck, graveyard: gy, hand: [anchor] }), `activate ${anchor} > ${card}`));
			expect(find(negated, card)).toMatchObject({ zone: "monster", controller: "you" });
			expect(isNegated(negated, find(negated, card).id)).toBe(true);
			const end = toEnd(negated);
			expect(activations(end, card)).toEqual([search]);
			const activated = play(end, search);
			expect(activated.chain.map((link) => [link.card.code, link.effectNegated])).toEqual([[card, true]]);
			let done = activated;
			while (done.chain.length > 0 && !done.asking) done = play(done, "pass");
			expect([done.turn.phase, done.asking, codes(done, "you", "hand"), activations(done, card)]).toEqual(["end", null, [], []]);
		});
		it(`${cites("sky-striker-ace-shizuku", "qa-temporary-banish-24032")} must have stayed face-up on the field since it was Summoned: banished until the End Phase and back, it cannot use it`, () => {
			const start = board({ deck, hand: ["fixture-blink"], monsters: ["fixture-ace-dark"], extra: [card] });
			const summoned = resolve(play(start, summon, "place 5"));
			const blinked = resolve(play(summoned, `activate fixture-blink > ${card}`));
			expect(find(blinked, card).zone).toBe("banished");
			// The monster comes back in the End Phase as a mandatory process of the player who banished it, in a zone of its controller's choice.
			const end = play(toEnd(blinked), "apply fixture-blink", "place 0");
			// It is a new card, which was not Summoned this turn.
			expect(find(end, card)).toMatchObject({ zone: "monster", summonedTurn: 0 });
			expect(activations(end, card)).toEqual([]);
		});
	});

	describe("control taken in the turn it was Summoned (Konami's Q&A fid 11555)", () => {
		/**
		 * Your turn: the rival's "Sky Striker Ace - Raye" Special Summons their "Sky Striker Ace - Shizuku" (Konami's question), then `taker` takes control of it
		 * until the End Phase. The End Phase begins with you holding priority.
		 */
		const taken = (taker: string, extra: Record<string, string[]> = {}): Duel => {
			const start = board({ hand: [taker], deck: ["fixture-ss-spell", "fixture-ss-quick"], ...extra }, { monsters: [raye], extra: [card], deck: ["fixture-ss-spell", "fixture-ss-quick"] }, { everyWindow: false });
			const summoned = play(resolve(play(start, "pass", `activate ${raye}`)), "place 6");
			expect(find(summoned, card)).toMatchObject({ controller: "rival", summonedTurn: 3 });
			return summoned;
		};
		const mind = (extra: Record<string, string[]> = {}): Duel => {
			const summoned = taken("fixture-mind", extra);
			const stolen = play(resolve(play(summoned, `activate fixture-mind > ${card}`)), "place 0");
			expect(find(stolen, card)).toMatchObject({ controller: "you", zone: "monster", summonedTurn: 3 });
			return toEnd(resolve(stolen));
		};
		it(`${cites("sky-striker-ace-shizuku", "qa-control-order-11555")} the player who took control chooses what to do first: the control is given back, and then the monster's End Phase effect is its controller's to activate`, () => {
			const end = mind();
			expect(offered(end).sort()).toEqual([`activate ${card}`, `apply ${card}`]);
			const asked = play(end, `apply ${card}`);
			const back = play(asked, "place 3");
			expect(find(back, card)).toMatchObject({ controller: "rival", slot: 3 });
			// The turn player has priority again; once they pass, the rival, now its controller, can activate it.
			expect(offered(back)).toEqual(["pass"]);
			const theirs = play(back, "pass");
			expect([theirs.priority.holder, activations(theirs, card)]).toEqual(["rival", [search]]);
		});
		it(`${cites("sky-striker-ace-shizuku", "qa-control-activate-first-11555")} ${cites("sky-striker-ace-shizuku", "once")} activated first by the player who took control, the monster's controller cannot activate it once it is given back (a use is a use of the card, whoever controls it)`, () => {
			const end = mind();
			const used = resolve(play(resolve(play(end, search)), "choose fixture-ss-quick"));
			expect(codes(used, "you", "hand")).toEqual(["fixture-ss-quick"]);
			expect(offered(used)).toEqual([`apply ${card}`]);
			const back = play(used, `apply ${card}`, "place 0");
			expect(find(back, card)).toMatchObject({ controller: "rival" });
			// Nothing for the rival to activate: once the turn player passes, the turn ends.
			expect(activations(back, card)).toEqual([]);
			const next = play(back, "pass");
			expect(next.turn.number).toBe(4);
			expect(codes(next, "rival", "hand")).toEqual([]);
		});
		it(`${cites("sky-striker-ace-shizuku", "qa-control-order-11555")} ${cites("sky-striker-mecha-widow-anchor", "control")} with "Sky Striker Mecha - Widow Anchor" in place of Mind Control, the monster is negated until the end of the turn, the End Phase included, whoever controls it: its effect can be activated (a negated monster still activates) but nothing is added, before or after control is given back`, () => {
			const settle = (duel: Duel): Duel => {
				let next = duel;
				while (next.chain.length > 0 && !next.asking) next = play(next, "pass");
				return next;
			};
			const stolen = (): Duel => {
				const asked = resolve(play(taken(anchor, { graveyard: threeSpells }), `activate ${anchor} > ${card}`));
				expect(isNegated(asked, find(asked, card).id)).toBe(true);
				const done = resolve(play(play(asked, `choose ${anchor}`), "place 0"));
				expect(find(done, card)).toMatchObject({ controller: "you", summonedTurn: 3 });
				return toEnd(done);
			};
			// Activated by the player who took control: negated, nothing added; the control is still owed, and the rival cannot use it afterwards.
			const end = stolen();
			expect(offered(end).sort()).toEqual([`activate ${card}`, `apply ${card}`]);
			const used = settle(play(end, search));
			expect(codes(used, "you", "hand")).toEqual([]);
			const back = play(play(used, `apply ${card}`), "place 3");
			expect(find(back, card)).toMatchObject({ controller: "rival" });
			expect(isNegated(back, find(back, card).id)).toBe(true);
			expect(activations(play(back, "pass"), card)).toEqual([]);
			// Given back first: the rival activates it, and it is negated all the same.
			const returned = play(play(stolen(), `apply ${card}`), "place 3");
			const theirs = play(returned, "pass");
			expect(activations(theirs, card)).toEqual([search]);
			expect(codes(settle(play(theirs, search)), "rival", "hand")).toEqual([]);
		});
	});
});
