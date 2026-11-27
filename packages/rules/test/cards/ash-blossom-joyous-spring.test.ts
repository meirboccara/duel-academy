import { describe, expect, it } from "vitest";
import { addModifier, type CardDef, cites, drawCards, type Duel, FOREVER, moveCard, printedFacts } from "../../src";
import { battleCards, toStep } from "../rules/battle-fixtures";
import { gapCards } from "../rules/blue-eyes-gap-fixtures";
import { codes, offered, plainCards, play, position, REAL_CARDS, recordCards } from "../rules/fixtures";

const options = { everyWindow: true };
const defs = { ...REAL_CARDS, ...recordCards() };
/** A Normal Spell that "adds a card from the Deck to the hand" (a search), with no condition of its own about the Deck. */
const searchSpell: CardDef = { code: "fixture-search-spell", kind: "spell", effects: [{ type: "activation", categories: ["search"], operation: (duel) => duel }] };
const replacementDefs = { ...defs, ...plainCards(), "fixture-search-spell": searchSpell };
const card = "ash-blossom-joyous-spring";

describe("Ash Blossom & Joyous Spring, written as an effect record", () => {
	it(`${cites("ash-blossom-joyous-spring", "qa-discard-while-banished-instead")} can discard itself under a GY-to-banish replacement, whereas sending to the GY remains an unpayable cost`, () => {
		const start = position({ defs: replacementDefs, options, turn: "rival", you: { hand: [card, "effect-veiler"] }, rival: { monsters: ["field-quick"], hand: ["terraforming"], deck: ["umi"] } });
		const replaced = addModifier(start, { affects: () => false, until: FOREVER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
		const chained = play(replaced, "activate terraforming");
		expect(offered(chained)).toContain(`activate ${card}`);
		expect(offered(chained).some((label) => label.startsWith("activate effect-veiler"))).toBe(false);
		const paid = play(chained, `activate ${card}`);
		expect(codes(paid, "you", "banished")).toEqual([card]);
		expect(paid.cards[paid.piles.you.banished[0]!]!.face).toBe("up");
		const done = play(paid, "pass", "pass");
		expect(codes(done, "rival", "hand")).toEqual([]);
		expect(codes(done, "rival", "deck")).toEqual(["umi"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "qa-lock-still-includes")} still answers a link that includes an add from the Deck when Droll's lock prevents the addition`, () => {
		const start = position({ defs: replacementDefs, options, turn: "rival", you: { hand: [card] }, rival: { hand: ["fixture-search-spell"], deck: ["umi"] } });
		const locked = addModifier(start, { affects: () => true, until: start.turn.number, layer: { kind: "lock", what: "add-to-hand", who: "both" } });
		expect(offered(play(locked, "activate fixture-search-spell"))).toContain(`activate ${card}`);
	});
	it(`${cites("ash-blossom-joyous-spring", "text")} is offered against an effect that includes a search, a Special Summon from the Deck or a send from the Deck, and costs a discard`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi", "other-field"] }, rival: { hand: [card] } });
		const searched = play(start, "activate terraforming");
		expect(offered(searched)).toEqual([`activate ${card}`, "pass"]);
		const negated = play(searched, `activate ${card}`);
		// The cost was paid at activation: Ash Blossom is in the Graveyard before anything resolves.
		expect(codes(negated, "rival", "graveyard")).toEqual([card]);
		expect(negated.chain.map((link) => [link.card.code, link.effectNegated, link.activationNegated])).toEqual([["terraforming", false, false], [card, false, false]]);
		const done = play(negated, "pass", "pass");
		// "negate that effect": nothing is added, and the Spell Card whose effect it was still goes to the Graveyard.
		expect(codes(done, "you", "hand")).toEqual([]);
		expect(codes(done, "you", "graveyard")).toEqual(["terraforming"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "text")} is not offered against an effect that includes none of the three: a destruction`, () => {
		const typhoon = position({ defs, options, you: { hand: ["mystical-space-typhoon"] }, rival: { hand: [card], set: ["umi"] } });
		expect(offered(play(typhoon, "activate mystical-space-typhoon > umi"))).toEqual(["pass"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "draw-is-add-to-hand")} answers an effect that draws: a draw is "add a card from the Deck to the hand" (Konami's Q&A, OCG only)`, () => {
		const drawn = position({ defs, options, you: { hand: ["pot-of-greed"], deck: ["umi", "other-field"] }, rival: { hand: [card] } });
		expect(offered(play(drawn, "activate pot-of-greed"))).toEqual([`activate ${card}`, "pass"]);
		const negated = play(drawn, "activate pot-of-greed", `activate ${card}`, "pass", "pass");
		expect(codes(negated, "you", "hand")).toEqual([]);
		expect(codes(negated, "you", "deck")).toEqual(["umi", "other-field"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "notes-whole-link")} negates the whole Chain Link: Upstart Goblin's opponent gains no LP either`, () => {
		const goblin = position({ defs, options, you: { hand: ["upstart-goblin"], deck: ["umi"] }, rival: { hand: [card] } });
		const stopped = play(goblin, "activate upstart-goblin", `activate ${card}`, "pass", "pass");
		expect(codes(stopped, "you", "hand")).toEqual([]);
		expect(stopped.lp.rival).toBe(8000);
	});
	it(`${cites("ash-blossom-joyous-spring", "text")} can be used once per turn: a second copy is not offered once the first has been used`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], set: ["needlebug-nest"], deck: ["umi", "other-field"] }, rival: { hand: [card, card] } });
		const first = play(start, "activate terraforming", `activate ${card}`);
		// Needlebug Nest (send from the Deck) is also an effect Ash Blossom answers, but this turn's limit is spent.
		const nest = play(first, "activate needlebug-nest");
		expect(nest.chain.map((link) => link.card.code)).toEqual(["terraforming", card, "needlebug-nest"]);
		expect(offered(nest)).toEqual(["pass"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "negated-effect-activation-stands")} negates the effect and not the activation: the card was activated, so what that took stays`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi"] }, rival: { hand: [card] } });
		const negated = play(start, "activate terraforming", `activate ${card}`, "pass", "pass");
		// Ice Bell's Q&A: the effect of the Ash Blossom target is not applied, but its activation was made.
		expect(codes(negated, "you", "deck")).toEqual(["umi"]);
		expect(codes(negated, "you", "graveyard")).toEqual(["terraforming"]);
		expect(negated.chain).toEqual([]);
	});
	// Structural, not a Konami ruling: chain links only ever go on top, so this passes with the old `index - 1` too. It
	// records that a link freezes which link it answered, which only matters once step 5 can change the chain below it.
	it("records on its link which link it answered, and negates that one whatever is chained on top of it", () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], set: ["log-quick"], deck: ["umi"] }, rival: { hand: [card] } });
		const answered = play(start, "activate terraforming", `activate ${card}`);
		expect(answered.chain.map((link) => link.answers)).toEqual([null, 0]);
		const topped = play(answered, "activate log-quick");
		expect(topped.chain.map((link) => link.answers)).toEqual([null, 0, 1]);
		const done = play(topped, "pass", "pass");
		expect(codes(done, "you", "hand")).toEqual([]);
		expect(codes(done, "you", "deck")).toEqual(["umi"]);
	});
});

describe("Ash Blossom & Joyous Spring: identity, scope and limits", () => {
	const answer = `activate ${card}`;
	const summoner: CardDef = { code: "fixture-summon-from-deck", kind: "spell", effects: [{ type: "activation", categories: ["summon-from-deck"], operation: (duel, link) => { const id = duel.piles[link.player].deck.find((held) => duel.defs[duel.cards[held]!.code]?.kind === "monster"); return id === undefined ? duel : moveCard(duel, id, { zone: "monster", face: "up" }); } }] };
	const fixtures: Record<string, CardDef> = {
		"fixture-summon-from-deck": summoner,
		// "Add 1 card from the Deck to the hand", at Spell Speed 2 in the Damage Step as Konami's notes of some cards allow (flagged), and not flagged.
		"fixture-ds-search": { code: "fixture-ds-search", kind: "monster", facts: { level: 4, atk: 0, def: 0 }, effects: [{ type: "quick", damageStep: true, categories: ["search"], operation: (duel) => duel }] },
		// Two bullets: "Draw 1 card" or "Gain 500 LP" (only the first includes adding a card from the Deck to the hand).
		"fixture-two-bullets": { code: "fixture-two-bullets", kind: "spell", effects: [{ type: "activation", modes: [{ categories: ["draw"], operation: (duel, link) => drawCards(duel, link.player, 1) }, { categories: ["gain-lp"], operation: (duel) => duel }] }] },
	};
	const own = (duel: Duel) => offered(duel).filter((label) => label.startsWith(answer));

	it(`${cites("ash-blossom-joyous-spring", "facts")} is a FIRE Zombie Tuner Effect Monster, Level 3, 0 ATK and 1800 DEF, named only by its printed name`, () => {
		const duel = position({ defs, rival: { hand: [card] } });
		const id = duel.piles.rival.hand[0]!;
		expect(printedFacts(duel, id)).toEqual({ name: "Ash Blossom & Joyous Spring", attribute: "FIRE", monsterType: "Zombie", level: 3, tuner: true, atk: 0, def: 1800, mentions: ["Ash Blossom & Joyous Spring"] });
		expect(duel.defs[card]!.kind).toBe("monster");
	});
	it(`${cites("ash-blossom-joyous-spring", "notes-hand")} ${cites("ash-blossom-joyous-spring", "text")} is a Quick Effect used from the hand only: face-up on the field, it is not offered`, () => {
		const field = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi"] }, rival: { monsters: [card] } });
		expect(own(play(field, "activate terraforming"))).toEqual([]);
		const held = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi"] }, rival: { hand: [card] } });
		expect(own(play(held, "activate terraforming"))).toEqual([answer]);
	});
	it(`${cites("ash-blossom-joyous-spring", "text")} answers each of the three effects: Special Summon from the Deck, and send from the Deck, not only a search`, () => {
		const summon = position({ defs: { ...defs, ...fixtures }, options, you: { hand: ["fixture-summon-from-deck"], deck: ["normal-4"] }, rival: { hand: [card] } });
		const summoned = play(summon, "activate fixture-summon-from-deck");
		expect(own(summoned)).toEqual([answer]);
		const stopped = play(summoned, answer, "pass", "pass");
		expect(codes(stopped, "you", "monster")).toEqual([]);
		expect(codes(stopped, "you", "deck")).toEqual(["normal-4"]);
		const send = position({ defs, options, you: { set: ["needlebug-nest"], deck: ["umi", "other-field"] }, rival: { hand: [card] } });
		const sent = play(send, "activate needlebug-nest");
		expect(own(sent)).toEqual([answer]);
		expect(codes(play(sent, answer, "pass", "pass"), "you", "graveyard")).toEqual(["needlebug-nest"]);
	});
	it(`${cites("ash-blossom-joyous-spring", "notes-direct")} is chained directly to the effect that includes one of the three: not to an earlier link once another link was put on top`, () => {
		const start = position({ defs, options, you: { hand: ["terraforming"], deck: ["umi"] }, rival: { hand: [card], set: ["log-quick"] } });
		const chained = play(start, "activate terraforming", "activate log-quick");
		expect(chained.chain.map((link) => link.card.code)).toEqual(["terraforming", "log-quick"]);
		// The top link, Log Quick, includes none of the three: Ash Blossom is not offered to anybody at any later priority.
		expect(own(chained)).toEqual([]);
		expect(own(play(chained, "pass"))).toEqual([]);
	});
	it(`${cites("ash-blossom-joyous-spring", "notes-damage-step")} is not offered in the Damage Step, even against an effect activated there; the same effect in the Main Phase is answered`, () => {
		const cards = { ...battleCards(), ...recordCards(), ...fixtures };
		const answerable = (phase: "main" | "damage") => {
			if (phase === "main") return own(play(position({ defs: cards, options, you: { monsters: ["fixture-ds-search"] }, rival: { hand: [card] } }), "activate fixture-ds-search"));
			const start = position({ defs: cards, options, phase: "battle", you: { monsters: ["huge", "fixture-ds-search"] }, rival: { hand: [card], monsters: ["big"] } });
			const declared = play(start, "attack huge > big");
			const damage = toStep(declared, "before");
			expect(damage.battle?.step).toBe("before");
			return own(play(damage, "activate fixture-ds-search"));
		};
		expect(answerable("main")).toEqual([answer]);
		expect(answerable("damage")).toEqual([]);
	});
	it(`${cites("ash-blossom-joyous-spring", "modes-chosen-bullet")} a card with bullets to choose from is answered only when the chosen bullet includes one of the three`, () => {
		const cards = { ...defs, ...fixtures };
		const start = position({ defs: cards, options, you: { hand: ["fixture-two-bullets"], deck: ["umi", "other-field"] }, rival: { hand: [card] } });
		expect(own(play(start, "activate fixture-two-bullets :0"))).toEqual([answer]);
		expect(own(play(start, "activate fixture-two-bullets :1"))).toEqual([]);
	});
	it(`${cites("ash-blossom-joyous-spring", "pot-of-prosperity")} answers Pot of Prosperity, and the oath of the Pot stands: no draw by card effect that turn though its effect was negated`, () => {
		const gaps = gapCards();
		const extra = ["a", "b", "c"].map((letter) => `fixture-extra-${letter}`);
		const cards = { ...defs, ...Object.fromEntries(extra.map((code) => [code, gaps[code]!])) };
		const start = position({ defs: cards, options, you: { hand: ["pot-of-prosperity"], extra, deck: ["umi", "other-field", "normal-4"] }, rival: { hand: [card] } });
		const activated = play(start, "activate pot-of-prosperity x3");
		expect(own(activated)).toEqual([answer]);
		const negated = play(activated, answer, "pass", "pass");
		// Nothing was excavated or added (the effect did not apply), but the oath stands: the player cannot draw by a card effect.
		expect(codes(negated, "you", "hand")).toEqual([]);
		expect(drawCards(negated, "you", 1)).toBe(negated);
	});
});
