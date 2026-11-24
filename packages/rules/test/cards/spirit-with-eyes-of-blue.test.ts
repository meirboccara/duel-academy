import { describe, expect, it } from "vitest";
import { addModifier, CARD_DEFS, type CardDef, cites, type Duel, flipFaceDown, flipFaceUp, FOREVER, isNegated, moveCard, printedFacts } from "../../src";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { extraDeckFixtures } from "./extra-deck-fixtures";

const card = "spirit-with-eyes-of-blue";
const fixtures: Record<string, CardDef> = { ...blueEyesFixtures, ...extraDeckFixtures };
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, phase: Duel["turn"]["phase"] = "main1") => position({ defs, options, you, rival, phase });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 12; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};
const effect = `activate ${card}`;
/** The card Link Summoned with a Level 4 Dragon, the Summon having succeeded; it is in the Extra Monster Zone, as the Summon puts it. */
const summoned = (you: SideSpec = {}, rival: SideSpec = {}, options = { everyWindow: true }): Duel => play(board({ monsters: ["fixture-dragon-4"], extra: [card], ...you }, rival, options), `special-summon ${card}`, "place 5", "pass", "pass");
/** The card on the field already (a Link Summon in an earlier turn), in a Main Monster Zone of the player. */
const onField = (you: SideSpec = {}, rival: SideSpec = {}, options = { everyWindow: true }): Duel => board({ monsters: [card], ...you }, rival, options);
const attacks = (duel: Duel) => offered(duel).filter((label) => label.startsWith("attack"));

describe("Spirit with Eyes of Blue, written as effect records", () => {
	it(`${cites("spirit-with-eyes-of-blue", "facts")} is a LIGHT Dragon Link Effect Monster, Link 1 with its arrow at the bottom left, 300 ATK and no DEF, that mentions "Mausoleum of White" and itself`, () => {
		const duel = board({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({
			name: "Spirit with Eyes of Blue",
			attribute: "LIGHT",
			monsterType: "Dragon",
			frame: "link",
			link: 1,
			arrows: ["bottom-left"],
			atk: 300,
			archetypes: ["Eyes of Blue"],
			mentions: ["Mausoleum of White", "Spirit with Eyes of Blue"],
		});
	});

	describe("its Link Summon", () => {
		const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
		it(`${cites("spirit-with-eyes-of-blue", "procedure")} needs 1 Level 4 or lower Dragon or Spellcaster monster, sent to the Graveyard, and is Link Summoned face-up`, () => {
			expect(summons(board({ monsters: ["fixture-dragon-4"], extra: [card] }))).toEqual([`special-summon ${card}`]);
			expect(summons(board({ monsters: ["fixture-spellcaster-4"], extra: [card] }))).toEqual([`special-summon ${card}`]);
			const done = play(board({ monsters: ["fixture-dragon-4"], extra: [card] }), `special-summon ${card}`, "place 5");
			expect(codes(done, "you", "graveyard")).toEqual(["fixture-dragon-4"]);
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", proper: true, summonedBy: "link" });
		});
		it(`${cites("spirit-with-eyes-of-blue", "procedure")} is not offered with a Level 5 Dragon, or a Level 4 monster that is neither a Dragon nor a Spellcaster`, () => {
			expect(summons(board({ monsters: ["fixture-dragon-5"], extra: [card] }))).toEqual([]);
			expect(summons(board({ monsters: ["fixture-warrior-4"], extra: [card] }))).toEqual([]);
		});
	});

	describe("its Continuous Effect", () => {
		it(`${cites("spirit-with-eyes-of-blue", "lock")} ${cites("spirit-with-eyes-of-blue", "notes-lock-field")} stops its controller from Special Summoning any monster but Dragon monsters while it is face-up on the field`, () => {
			const specials = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));
			// A Level 8 Dragon Synchro Monster is a Dragon; a Warrior Synchro Monster is not.
			const materials = ["fixture-tuner-3", "fixture-plain-5"];
			expect(specials(board({ monsters: materials, extra: ["fixture-synchro-dragon-8", "fixture-synchro-warrior-8"] }))).toEqual(["special-summon fixture-synchro-dragon-8", "special-summon fixture-synchro-warrior-8"]);
			expect(specials(onField({ monsters: [card, ...materials], extra: ["fixture-synchro-dragon-8", "fixture-synchro-warrior-8"] }))).toEqual(["special-summon fixture-synchro-dragon-8"]);
			// Not the opponent: the restriction is "You cannot".
			const theirs = position({ defs, turn: "rival", you: { monsters: [card] }, rival: { monsters: materials, extra: ["fixture-synchro-warrior-8"] } });
			expect(specials(theirs)).toEqual(["special-summon fixture-synchro-warrior-8"]);
		});
		it(`${cites("spirit-with-eyes-of-blue", "lock")} stops when the card leaves the field or its effects are negated, and does not stop Normal Summons`, () => {
			const duel = onField({ hand: ["fixture-warrior-4"], monsters: [card, "fixture-tuner-3", "fixture-plain-5"], extra: ["fixture-synchro-warrior-8"] });
			expect(offered(duel)).toContain("summon fixture-warrior-4");
			expect(offered(duel).filter((label) => label.startsWith("special-summon"))).toEqual([]);
			const negated = addModifier(duel, { affects: { card: find(duel, card).id, moves: find(duel, card).moves }, until: FOREVER, layer: { kind: "negate" } });
			expect(offered(negated).filter((label) => label.startsWith("special-summon"))).toEqual(["special-summon fixture-synchro-warrior-8"]);
			const gone = moveCard(duel, find(duel, card).id, { zone: "graveyard" });
			expect(offered(gone).filter((label) => label.startsWith("special-summon"))).toEqual(["special-summon fixture-synchro-warrior-8"]);
		});
	});

	describe("its Link Summon effect", () => {
		const deck = ["mausoleum-of-white", "fixture-plain-1"];
		it(`${cites("spirit-with-eyes-of-blue", "search")} ${cites("spirit-with-eyes-of-blue", "notes-trigger")} takes 1 "Mausoleum of White" from the Deck and adds it to the hand, an optional Trigger Effect when it is Link Summoned`, () => {
			const duel = summoned({ deck });
			expect(own(duel, effect)).toEqual([effect]);
			const asked = play(duel, effect, "pass", "pass");
			// Only 1 "Mausoleum of White": nothing to choose but where it goes. Choosing the card adds it to the hand, passing sends it to the GY.
			expect(offered(asked)).toEqual([`choose mausoleum-of-white`, "pass"].sort());
			const done = play(asked, "choose mausoleum-of-white");
			expect(codes(done, "you", "hand")).toEqual(["mausoleum-of-white"]);
		});
		it(`${cites("spirit-with-eyes-of-blue", "search")} or sends it to the GY instead`, () => {
			const asked = play(summoned({ deck }), effect, "pass", "pass");
			const done = play(asked, "pass");
			expect(codes(done, "you", "graveyard")).toContain("mausoleum-of-white");
			expect(codes(done, "you", "hand")).toEqual([]);
		});
		it(`${cites("spirit-with-eyes-of-blue", "search")} only sends it to the GY while cards cannot be added from the Deck to the hand`, () => {
			const locked = addModifier(summoned({ deck }), { affects: () => true, until: FOREVER, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
			const done = settle(play(locked, effect));
			expect(codes(done, "you", "graveyard")).toContain("mausoleum-of-white");
			expect(codes(done, "you", "hand")).toEqual([]);
		});
		it(`${cites("spirit-with-eyes-of-blue", "search")} is only offered for a Link Summon of the card, and not with no "Mausoleum of White" in the Deck`, () => {
			expect(own(summoned({ deck: ["fixture-plain-1", "fixture-crimson-name"] }), effect)).toEqual([]);
			// Not when it is Special Summoned by an effect without being Link Summoned (here put on the field from the Extra Deck by an effect).
			const placed = moveCard(board({ extra: [card], deck }, {}, { everyWindow: true }), find(board({ extra: [card] }), card).id, { zone: "monster", face: "up", slot: 5 });
			expect(own(placed, effect)).not.toContain(effect);
		});
		it(`${cites("spirit-with-eyes-of-blue", "once")} can be used once per turn, apart from the other effect`, () => {
			const used = settle(play(summoned({ deck: ["mausoleum-of-white", "mausoleum-of-white"], graveyard: ["fixture-blue-eyes-normal"] }), effect));
			// The state opens again once both players have passed; the first effect is spent, the second is not.
			let duel = used;
			for (let guard = 0; guard < 4 && !duel.priority.open; guard++) duel = play(duel, "pass");
			expect(own(duel, effect)).toEqual([effect]);
		});
	});

	describe("its Special Summon effect", () => {
		const mainFull = ["fixture-plain-1", "fixture-plain-2", "fixture-plain-3", "fixture-plain-4"];
		it(`${cites("spirit-with-eyes-of-blue", "summon")} ${cites("spirit-with-eyes-of-blue", "notes-summon-ignition")} Tributes itself to Special Summon 1 "Blue-Eyes" monster from the hand or the GY, chosen when it resolves, an Ignition Effect`, () => {
			const start = onField({ hand: ["fixture-blue-eyes-normal", "fixture-other-dragon"], graveyard: ["fixture-blue-eyes-small", "fixture-other-dragon"], deck: ["fixture-blue-eyes-effect"] });
			expect(own(start, effect)).toEqual([effect]);
			const chained = play(start, effect);
			expect(find(chained, card).zone).toBe("graveyard");
			expect(chained.chain[0]!.targets).toEqual([]);
			const asked = play(chained, "pass", "pass");
			// The "Blue-Eyes" monsters of the hand and the GY, not another Dragon, not the Deck.
			expect(offered(asked)).toEqual(["choose fixture-blue-eyes-normal", "choose fixture-blue-eyes-small"]);
			const done = settle(play(asked, "choose fixture-blue-eyes-small"));
			expect(find(done, "fixture-blue-eyes-small")).toMatchObject({ zone: "monster", face: "up" });
		});
		it(`${cites("spirit-with-eyes-of-blue", "summon")} needs the zone the card leaves, and a "Blue-Eyes" monster to Summon`, () => {
			expect(own(onField({ monsters: [card, ...mainFull], hand: ["fixture-blue-eyes-normal"] }), effect)).toEqual([effect]);
			expect(own(onField({ hand: ["fixture-other-dragon", "fixture-warrior-4"] }), effect)).toEqual([]);
			// An Ignition Effect: only in the player's Main Phase, with nothing else going on.
			expect(own(board({ monsters: [card], hand: ["fixture-blue-eyes-normal"] }, {}, { everyWindow: true }, "battle"), effect)).toEqual([]);
		});
		it(`${cites("spirit-with-eyes-of-blue", "negate")} ${cites("spirit-with-eyes-of-blue", "notes-negate-ends")} negates the effects of an Effect Monster Special Summoned from the GY by this effect and stops it from attacking, until it leaves the field or is turned face-down`, () => {
			const start = onField({ graveyard: ["fixture-blue-eyes-effect", "fixture-blue-eyes-normal"], monsters: [card] }, { monsters: ["fixture-plain-1"] });
			const asked = play(start, effect, "pass", "pass");
			const done = settle(play(asked, "choose fixture-blue-eyes-effect"));
			const summoned = find(done, "fixture-blue-eyes-effect");
			expect(summoned.zone).toBe("monster");
			expect(isNegated(done, summoned.id)).toBe(true);
			const battle = { ...done, turn: { ...done.turn, phase: "battle" as const }, priority: { holder: "you" as const, passed: [], open: true } };
			expect(attacks(battle)).toEqual([]);
			// Turned face-down, then face-up again: the restriction is over.
			const again = flipFaceUp(flipFaceDown(done, summoned.id), summoned.id, "attack");
			expect(isNegated(again, summoned.id)).toBe(false);
			// The Summoned monster is the only one restricted: a Normal Monster Summoned from the GY, and a monster from the hand, are not.
			for (const [hand, graveyard, summonedCode] of [[[], ["fixture-blue-eyes-normal"], "fixture-blue-eyes-normal"], [["fixture-blue-eyes-effect"], [], "fixture-blue-eyes-effect"]] as const) {
				const free = settle(play(onField({ hand: [...hand], graveyard: [...graveyard], monsters: [card] }, { monsters: ["fixture-plain-1"] }), effect, "pass", "pass"));
				const monster = find(free, summonedCode);
				expect(monster.zone).toBe("monster");
				expect(isNegated(free, monster.id)).toBe(false);
				expect(attacks({ ...free, turn: { ...free.turn, phase: "battle" as const }, priority: { holder: "you" as const, passed: [], open: true } }).length).toBeGreaterThan(0);
			}
		});
		it(`activates only while a Dragon "Blue-Eyes" monster can be Summoned with its restriction in place, and then can Summon a monster that is not a Dragon once it has been Tributed (YGOProJudge's answer only, asked 2026-11-24, no source cited)`, () => {
			// Only a non-Dragon "Blue-Eyes" monster: the restriction applies at the activation.
			expect(own(onField({ hand: ["fixture-blue-eyes-non-dragon"] }), effect)).toEqual([]);
			// A Dragon too: activated; the Tribute ends the restriction, so the non-Dragon can be chosen.
			const start = onField({ hand: ["fixture-blue-eyes-non-dragon", "fixture-blue-eyes-normal"] });
			expect(own(start, effect)).toEqual([effect]);
			const asked = play(start, effect, "pass", "pass");
			expect(offered(asked)).toEqual(["choose fixture-blue-eyes-non-dragon", "choose fixture-blue-eyes-normal"]);
		});
		it(`${cites("spirit-with-eyes-of-blue", "once")} can be used once per turn, apart from the first effect: a second copy cannot use it the same turn`, () => {
			const start = onField({ monsters: [card, card], hand: ["fixture-blue-eyes-normal", "fixture-blue-eyes-small"] });
			const done = settle(play(start, effect, "pass", "pass"));
			expect(codes(done, "you", "monster")).toHaveLength(2);
			expect(own(done, effect)).toEqual([]);
		});
	});
});
