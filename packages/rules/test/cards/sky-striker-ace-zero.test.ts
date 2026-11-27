import { describe, expect, it } from "vitest";
import { addModifier, canSpecialSummon, cites, FOREVER, negateCardEffects, printedFacts, specialSummon, type Duel } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board } from "./sky-striker-ace-fixtures";
import { activations, find, resolve } from "./sky-striker-fixtures";

const card = "sky-striker-ace-zero";
const raye = "sky-striker-ace-raye";
const roze = "sky-striker-ace-roze";
const summon = `special-summon ${card}`;
const search = `activate ${card}`;
const pair = `activate ${card}`;

/** Link Summons "Sky Striker Ace = Zero" with its 2 materials: the Special Summon trigger is then on offer. */
const linked = (you: Record<string, string[]> = {}) => resolve(play(board({ monsters: ["fixture-ace-dark", "fixture-ace-light"], extra: [card], ...you }), summon, "place 5"));

describe("Sky Striker Ace = Zero, written as effect records", () => {
	it(`${cites("sky-striker-ace-zero", "facts")} is a LIGHT Machine Link 2 Effect Monster with 2000 ATK and its arrows at the bottom left and bottom right, a "Sky Striker Ace" and a "Sky Striker" card that mentions itself, "Sky Striker Ace - Raye" and "Sky Striker Ace - Roze"`, () => {
		const duel = board({ extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Ace = Zero", attribute: "LIGHT", monsterType: "Machine", frame: "link", link: 2, arrows: ["bottom-left", "bottom-right"], atk: 2000, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace = Zero", "Sky Striker Ace - Raye", "Sky Striker Ace - Roze"] });
	});

	describe("its Link Summon and its restrictions", () => {
		it(`${cites("sky-striker-ace-zero", "procedure")} needs exactly 2 "Sky Striker Ace" monsters as the Link Materials, and sends them to the Graveyard`, () => {
			expect(offered(board({ monsters: ["fixture-ace-dark", "fixture-ace-light"], extra: [card] }))).toContain(summon);
			expect(offered(board({ monsters: ["fixture-ace-dark"], extra: [card] }))).not.toContain(summon);
			expect(offered(board({ monsters: ["fixture-ace-dark", "fixture-filler"], extra: [card] }))).not.toContain(summon);
			const done = linked();
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-ace-dark", "fixture-ace-light"]);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", slot: 5, summonedBy: "link" });
		});
		it(`${cites("sky-striker-ace-zero", "once-summon")} ${cites("sky-striker-ace-zero", "notes-not-effect")} only 1 "Sky Striker Ace = Zero" can be Special Summoned each turn, and negating the monster does not lift it`, () => {
			const start = board({ extra: [card, card] });
			const [first, second] = start.piles.you.extra;
			const done = specialSummon(start, "you", first!, { slot: 5 });
			expect(canSpecialSummon(done, "you", second!)).toBe(false);
			expect(canSpecialSummon(negateCardEffects(done, first!, done.turn.number), "you", second!)).toBe(false);
		});
		it(`${cites("sky-striker-ace-zero", "cannot-be-material")} ${cites("sky-striker-ace-zero", "notes-link-material")} cannot be used as Link Material, and the effect is not applied through negation`, () => {
			const start = board({ extraZone: [card], extra: ["fixture-link"] });
			expect(offered(start)).not.toContain("special-summon fixture-link");
			expect(offered(negateCardEffects(start, find(start, card).id, start.turn.number))).not.toContain("special-summon fixture-link");
			// A monster beside it is a material, and Zero stays on the field.
			const beside = board({ extraZone: [card], monsters: ["fixture-ace-dark"], extra: ["fixture-link"] });
			const done = resolve(play(beside, "special-summon fixture-link", "place 0"));
			expect(find(done, "fixture-ace-dark").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("monster");
		});
	});

	describe("its Trigger Effect", () => {
		it(`${cites("sky-striker-ace-zero", "search")} ${cites("sky-striker-ace-zero", "notes-trigger")} when it is Special Summoned, adds 1 "Sky Striker" Spell from the Deck or the Graveyard to the hand: not a monster, not a Spell of another name`, () => {
			const summoned = linked({ deck: ["fixture-ss-spell", "fixture-ss-monster", "fixture-other-spell"], graveyard: ["fixture-ss-spell-b", "fixture-trap"] });
			expect(activations(summoned, card)).toEqual([search]);
			const asked = resolve(play(summoned, search));
			expect(offered(asked).sort()).toEqual(["choose fixture-ss-spell", "choose fixture-ss-spell-b"]);
			const fromGraveyard = play(asked, "choose fixture-ss-spell-b");
			expect(codes(fromGraveyard, "you", "hand")).toEqual(["fixture-ss-spell-b"]);
			const fromDeck = play(asked, "choose fixture-ss-spell");
			expect(codes(fromDeck, "you", "hand")).toEqual(["fixture-ss-spell"]);
			expect(find(fromDeck, "fixture-ss-spell").zone).toBe("hand");
		});
		it(`${cites("sky-striker-ace-zero", "search")} is not offered with no "Sky Striker" Spell to add, and it is a search for what answers searches`, () => {
			expect(activations(linked({ deck: ["fixture-ss-monster", "fixture-other-spell"] }), card)).toEqual([]);
			const summoned = linked({ deck: ["fixture-ss-spell"] });
			expect(play(summoned, search).chain[0]!.categories).toEqual(["search"]);
		});
		it(`${cites("sky-striker-ace-zero", "search")} while cards cannot be added from the Deck to the hand only the Graveyard is a source: with no Spell there it is not offered`, () => {
			const lock = (duel: Duel) => addModifier(duel, { affects: () => true, until: FOREVER, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			// The only source left is the Graveyard: its Spell is the one added, and the one in the Deck stays there.
			const added = resolve(play(lock(linked({ deck: ["fixture-ss-spell"], graveyard: ["fixture-ss-spell-b"] })), search));
			expect([codes(added, "you", "hand"), codes(added, "you", "deck")]).toEqual([["fixture-ss-spell-b"], ["fixture-ss-spell"]]);
			expect(activations(lock(linked({ deck: ["fixture-ss-spell"] })), card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-zero", "notes-trigger-damage-step")} can also be activated in the Damage Step`, () => {
			const start = board({ set: ["fixture-summon-counter"], extra: [card], deck: ["fixture-ss-spell"] }, { monsters: ["fixture-big"] }, {}, "rival", "battle");
			const damage = toStep(play(start, "attack fixture-big directly"), "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			let summoned = play(mine, "activate fixture-summon-counter");
			while (summoned.chain.length > 0) summoned = play(summoned, "pass");
			expect(find(summoned, card)).toMatchObject({ zone: "monster", face: "up" });
			expect(summoned.battle?.step).toBe("start");
			expect(activations(summoned, card)).toEqual([search]);
		});
	});

	describe("its Quick Effect", () => {
		/** Zero in an Extra Monster Zone; "Sky Striker Ace - Raye" in the Deck and "Sky Striker Ace - Roze" in the Graveyard; a Set Trap of the rival to destroy. */
		const ready = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = { set: ["fixture-trap"] }) => board({ extraZone: [card], deck: [raye], graveyard: [roze], ...you }, rival);
		it(`${cites("sky-striker-ace-zero", "summon")} ${cites("sky-striker-ace-zero", "notes-quick")} Tributes itself and Special Summons "Sky Striker Ace - Raye" and "Sky Striker Ace - Roze" from the Deck and/or the Graveyard at the same time`, () => {
			const start = ready();
			expect(activations(start, card)).toEqual([pair]);
			let asked = resolve(play(start, pair));
			// The cost is paid: Zero is in the Graveyard.
			expect(find(asked, card).zone).toBe("graveyard");
			expect(asked.asking).toBeTruthy();
			while (asked.asking && offered(asked).every((label) => label.startsWith("place"))) asked = play(asked, offered(asked)[0]!);
			expect(find(asked, raye)).toMatchObject({ zone: "monster", face: "up", controller: "you", specialSummoned: true });
			expect(find(asked, roze)).toMatchObject({ zone: "monster", face: "up", controller: "you", specialSummoned: true });
		});
		it(`${cites("sky-striker-ace-zero", "notes-needs-both")} cannot be activated unless both can be Special Summoned (one only in the Deck and/or the Graveyard is not enough; the hand is not a source)`, () => {
			expect(activations(board({ extraZone: [card], deck: [raye] }), card)).toEqual([]);
			expect(activations(board({ extraZone: [card], graveyard: [roze] }), card)).toEqual([]);
			expect(activations(board({ extraZone: [card], hand: [raye], graveyard: [roze] }), card)).toEqual([]);
			expect(activations(board({ extraZone: [card], deck: [raye, roze] }), card)).toEqual([pair]);
			expect(activations(board({ extraZone: [card], graveyard: [raye, roze] }), card)).toEqual([pair]);
		});
		it(`${cites("sky-striker-ace-zero", "notes-needs-both")} needs a free Monster Zone for each: the zone it leaves counts`, () => {
			const crowded = (zero: "extraZone" | "monsters") => board({ [zero]: [card], monsters: zero === "monsters" ? [card, "fixture-filler", "fixture-filler", "fixture-filler"] : ["fixture-filler", "fixture-filler", "fixture-filler", "fixture-filler"], deck: [raye], graveyard: [roze] });
			// Zero in an Extra Monster Zone: a single Main Monster Zone is free.
			expect(activations(crowded("extraZone"), card)).toEqual([]);
			// Zero in a Main Monster Zone: the one it leaves is the second.
			expect(activations(crowded("monsters"), card)).toEqual([pair]);
		});
		it(`${cites("sky-striker-ace-zero", "notes-no-damage-step")} cannot be activated in the Damage Step`, () => {
			const start = board({ extraZone: [card], deck: [raye], graveyard: [roze] }, { monsters: ["fixture-big"] }, {}, "rival", "battle");
			const declared = play(start, `attack fixture-big > ${card}`);
			expect(activations(play(declared, "pass"), card)).toEqual([pair]);
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			expect(activations(mine, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-zero", "notes-all-or-nothing")} if one of the two cannot be Special Summoned when it resolves, nothing is done (the Tribute is paid)`, () => {
			const start = ready({}, { set: ["fixture-gy-banisher"] });
			const chained = play(start, pair);
			// The rival answers by banishing the monsters of the player's Graveyard.
			const answered = play(chained, "activate fixture-gy-banisher");
			const done = resolve(answered);
			expect(find(done, roze).zone).toBe("banished");
			expect(find(done, raye).zone).toBe("deck");
			expect(find(done, card).zone).not.toBe("monster");
			expect(done.asking).toBeFalsy();
		});
		it(`${cites("sky-striker-ace-zero", "destroy")} ${cites("sky-striker-ace-zero", "notes-sequential")} afterwards the player may destroy 1 card on the field, chosen when the effect resolves, after both are on the field; declining destroys nothing`, () => {
			const start = ready();
			let asked = resolve(play(start, pair));
			while (asked.asking && offered(asked).every((label) => label.startsWith("place"))) asked = play(asked, offered(asked)[0]!);
			// The two are on the field before the choice (the two parts are not simultaneous).
			expect(find(asked, raye).zone).toBe("monster");
			expect(offered(asked)).toContain(`choose ${card}`);
			const picking = play(asked, `choose ${card}`);
			// Any card on the field of either player: the Set Trap, the two monsters Special Summoned.
			expect(offered(picking).sort()).toEqual([`choose ${raye}`, `choose ${roze}`, "choose fixture-trap"].sort());
			const done = play(picking, "choose fixture-trap");
			expect(find(done, "fixture-trap").zone).toBe("graveyard");
			expect(find(play(asked, "pass"), "fixture-trap").zone).toBe("spell");
		});
		it(`${cites("sky-striker-ace-zero", "qa-optional-destroy-23195")} the optional destruction does not make it an effect that destroys: it is declared as a Special Summon from the Deck or Graveyard only`, () => {
			const categories = play(ready(), pair).chain[0]!.categories;
			expect(categories).toContain("special-summon");
			expect(categories).not.toContain("destroy");
		});
		it(`${cites("sky-striker-ace-zero", "qa-from-graveyard-23215")} it includes a Special Summon from the Graveyard even when no monster is there (the Deck is the source): declared from both, which is what answers "Ash Blossom" and "Ghost Belle"`, () => {
			expect(play(board({ extraZone: [card], deck: [raye, roze] }), pair).chain[0]!.categories).toEqual(["special-summon", "summon-from-deck", "summon-from-graveyard"]);
		});
	});

	describe("its use limit", () => {
		it(`${cites("sky-striker-ace-zero", "once")} only 1 "Sky Striker Ace = Zero" effect each turn, and only once that turn: after the first effect, the other cannot be activated`, () => {
			// The Special Summon trigger, then the Quick Effect.
			const summoned = linked({ deck: ["fixture-ss-spell", raye], graveyard: [roze] });
			expect(activations(summoned, card)).toEqual([search]);
			const used = resolve(play(summoned, search));
			expect(codes(used, "you", "hand")).toEqual(["fixture-ss-spell"]);
			expect(find(used, card).zone).toBe("monster");
			expect(activations(used, card)).toEqual([]);
			// Two copies on the field: the Quick Effect of one is used, then the other cannot use its own.
			const both = board({ monsters: [card, card], deck: [raye, raye], graveyard: [roze, roze] });
			const first = play(both, pair);
			let next = resolve(first);
			while (next.asking && offered(next).every((label) => label.startsWith("place"))) next = play(next, offered(next)[0]!);
			expect(activations(next, card)).toEqual([]);
		});
	});
});
