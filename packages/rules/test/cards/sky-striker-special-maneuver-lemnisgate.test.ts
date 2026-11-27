import { describe, expect, it } from "vitest";
import { cites, type Duel, moveCard, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { all, find, resolve } from "./sky-striker-fixtures";
import { board6, effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";

const card = "sky-striker-special-maneuver-lemnisgate";
const SHUFFLE = 0;
const LINK_SUMMON = 1;
const activate = `activate ${card}`;
const ACES = ["fixture-ace-light", "fixture-ace-dark", "fixture-ace-fire", "fixture-ace-wind"];

/** Sends these Extra Deck monsters of `you` (given in `extra`) to the Graveyard, as a Link Monster that was on the field would be. */
const sentToGraveyard = (duel: Duel, ...ids: string[]): Duel => ids.reduce((board, code) => moveCard(board, all(board, code).find((entry) => entry.zone === "extra")!.id, { zone: "graveyard" }), duel);
const labels = (duel: Duel) => offered(duel).filter((label) => label.startsWith(activate));
/** Activates the first effect with these targets, the Aces first then the Spells. */
const shuffle = (duel: Duel, ...targets: string[]) => playEffect(duel, card, SHUFFLE, ...targets);

describe("Sky Striker Special Maneuver - Lemnisgate!, written as effect records", () => {
	it(`${cites("sky-striker-special-maneuver-lemnisgate", "facts")} is a Quick-Play Spell, a "Sky Striker" card that mentions itself`, () => {
		const duel = board6({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("quick-play");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Special Maneuver - Lemnisgate!", archetypes: ["Sky Striker"], mentions: ["Sky Striker Special Maneuver - Lemnisgate!"] });
	});

	describe("the first effect: shuffle, then return cards to the hand", () => {
		const start = (aces: string[], spells: string[], more: object = {}, rival: object = {}) => sentToGraveyard(board6({ hand: [card], extra: aces, graveyard: spells, ...more }, rival), ...aces);
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "shuffle")} ${cites("sky-striker-special-maneuver-lemnisgate", "notes-chain-block")} targets an equal number of "Sky Striker Ace" monsters and "Sky Striker" Spells in the Graveyard, at least one of each, and every such combination is offered`, () => {
			const duel = start(["fixture-ace-light", "fixture-ace-dark"], ["fixture-ss-spell", "fixture-ss-spell-b", "fixture-other-spell", "fixture-ss-monster"]);
			expect(labels(duel)).toEqual([
				`${activate} > fixture-ace-light > fixture-ace-dark > fixture-ss-spell > fixture-ss-spell-b {2,2}`,
				`${activate} > fixture-ace-light > fixture-ss-spell {1,1}`,
				`${activate} > fixture-ace-light > fixture-ss-spell-b {1,1}`,
				`${activate} > fixture-ace-dark > fixture-ss-spell {1,1}`,
				`${activate} > fixture-ace-dark > fixture-ss-spell-b {1,1}`,
			].sort());
			// Neither a lone group, nor a Spell that is not a "Sky Striker" card, nor a "Sky Striker" monster that is not an Ace.
			expect(labels(start(["fixture-ace-light"], ["fixture-other-spell", "fixture-ss-monster"]))).toEqual([]);
			expect(labels(start([], ["fixture-ss-spell"]))).toEqual([]);
			expect(labels(start(["fixture-ace-light"], []))).toEqual([]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "shuffle")} shuffles the targets into the Deck, the Extra Deck monster back to the Extra Deck, and goes to the Graveyard like any Quick-Play Spell`, () => {
			const duel = start(["fixture-ace-light"], ["fixture-ss-spell"], { deck: ["fixture-filler", "fixture-filler"] });
			const chained = shuffle(duel, "fixture-ace-light", "fixture-ss-spell");
			expect(chained.chain[0]!).toMatchObject({ effect: SHUFFLE, categories: ["return-to-deck", "return-to-hand"] });
			const done = resolve(chained);
			expect(done.asking).toBeFalsy();
			expect(find(done, "fixture-ace-light")).toMatchObject({ zone: "extra", face: "down" });
			expect(find(done, "fixture-ss-spell").zone).toBe("deck");
			expect(codes(done, "you", "deck").sort()).toEqual(["fixture-filler", "fixture-filler", "fixture-ss-spell"]);
			expect(find(done, card).zone).toBe("graveyard");
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "return")} ${cites("sky-striker-special-maneuver-lemnisgate", "notes-shuffle-then-return")} ${cites("sky-striker-special-maneuver-lemnisgate", "notes-not-simultaneous")} with 3 cards shuffled or more it returns up to 1 card on the field to the hand for every 3, after the shuffle is done, and the player may choose none`, () => {
			const duel = start(["fixture-ace-light", "fixture-ace-dark"], ["fixture-ss-spell", "fixture-ss-spell-b"], { monsters: ["fixture-filler"], set: ["fixture-trap"] }, { monsters: ["fixture-big"], faceupSpells: ["fixture-other-spell"] });
			const two = resolve(shuffle(duel, "fixture-ace-light", "fixture-ace-dark", "fixture-ss-spell", "fixture-ss-spell-b"));
			// 4 cards shuffled: 1 card may be returned; the shuffle is done when the question is asked.
			expect(two.asking).toBeTruthy();
			expect(find(two, "fixture-ss-spell").zone).toBe("deck");
			expect(find(two, "fixture-ace-dark").zone).toBe("extra");
			// Either field, face-up or face-down; the Spell Card being activated is not among them.
			expect(offered(two).filter((label) => label.startsWith("choose")).sort()).toEqual(["choose fixture-big", "choose fixture-filler", "choose fixture-other-spell", "choose fixture-trap"]);
			const chosen = play(two, "choose fixture-big");
			expect(find(chosen, "fixture-big")).toMatchObject({ zone: "hand", controller: "rival" });
			// Only 1 for 4 cards: nothing more is asked.
			expect(chosen.asking).toBeFalsy();
			const declined = play(two, "pass");
			expect(codes(declined, "rival", "monster")).toEqual(["fixture-big"]);
			expect(find(declined, card).zone).toBe("graveyard");
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "return")} returns up to 2 cards for 6 shuffled, and none for fewer than 3`, () => {
			const aces = ["fixture-ace-light", "fixture-ace-dark", "fixture-ace-fire"];
			const spells = ["fixture-ss-spell", "fixture-ss-spell-b", "fixture-ss-spell-c"];
			const duel = sentToGraveyard(board6({ hand: [card], extra: aces, graveyard: spells, monsters: ["fixture-filler"] }, { monsters: ["fixture-big"], set: ["fixture-trap"] }), ...aces);
			const six = resolve(shuffle(duel, "fixture-ace-light", "fixture-ace-dark", "fixture-ace-fire", "fixture-ss-spell", "fixture-ss-spell-b", "fixture-ss-spell-c"));
			const first = play(six, "choose fixture-big");
			expect(first.asking).toBeTruthy();
			const second = play(first, "choose fixture-filler");
			expect(second.asking).toBeFalsy();
			expect(codes(second, "you", "hand").concat(codes(second, "rival", "hand")).sort()).toEqual(["fixture-big", "fixture-filler"]);
			// 2 and 2 targets are 4 cards, 1 and 1 are 2: nothing to return.
			const small = resolve(shuffle(start(["fixture-ace-light"], ["fixture-ss-spell"], { monsters: ["fixture-filler"] }), "fixture-ace-light", "fixture-ss-spell"));
			expect(small.asking).toBeFalsy();
			expect(codes(small, "you", "monster")).toEqual(["fixture-filler"]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "notes-partial-targets")} processes the targets that are left when some are no longer there, and counts only the cards that really went back`, () => {
			const duel = start(["fixture-ace-light", "fixture-ace-dark"], ["fixture-ss-spell", "fixture-ss-spell-b"], { monsters: ["fixture-filler"] });
			const chained = shuffle(duel, "fixture-ace-light", "fixture-ace-dark", "fixture-ss-spell", "fixture-ss-spell-b");
			// One Spell is banished from the Graveyard before it resolves (as an answer of the opponent would): 3 of the 4 are still there.
			const answered = moveCard(chained, find(chained, "fixture-ss-spell-b").id, { zone: "banished" });
			const done = resolve(answered);
			expect(find(done, "fixture-ss-spell-b").zone).toBe("banished");
			expect(find(done, "fixture-ss-spell").zone).toBe("deck");
			expect(find(done, "fixture-ace-light").zone).toBe("extra");
			// 3 cards went back: 1 card may be returned.
			expect(done.asking).toBeTruthy();
			// With 2 of the 4 gone only 2 went back: nothing to return.
			const twoGone = moveCard(answered, find(answered, "fixture-ace-dark").id, { zone: "banished" });
			const fewer = resolve(twoGone);
			expect(fewer.asking).toBeFalsy();
			expect(codes(fewer, "you", "monster")).toEqual(["fixture-filler"]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "notes-not-simultaneous")} the return to the hand comes after the shuffle, so an optional "when" effect that answered the shuffle misses the timing when a card may be returned, and does not when nothing may (fewer than 3 shuffled)`, () => {
			const field = { monsters: ["fixture-filler", "fixture-deck-watcher"] };
			const four = resolve(shuffle(start(["fixture-ace-light", "fixture-ace-dark"], ["fixture-ss-spell", "fixture-ss-spell-b"], field), "fixture-ace-light", "fixture-ace-dark", "fixture-ss-spell", "fixture-ss-spell-b"));
			expect(four.asking).toBeTruthy();
			const declined = play(four, "pass");
			expect(offered(declined).some((label) => label.startsWith("activate") && label.includes("fixture-deck-watcher"))).toBe(false);
			// Two shuffled cards: nothing follows the shuffle, the watcher is on time.
			const two = resolve(shuffle(start(["fixture-ace-light"], ["fixture-ss-spell"], field), "fixture-ace-light", "fixture-ss-spell"));
			expect(two.asking).toBeFalsy();
			expect(offered(two).some((label) => label.startsWith("activate") && label.includes("fixture-deck-watcher"))).toBe(true);
		});
		it(`${cites("rules", "chained-card-after-chain")} the Quick-Play Spell itself is not among the cards that may be returned (it is sent to the Graveyard after the chain), though it is on the field while this resolves`, () => {
			const duel = start(["fixture-ace-light", "fixture-ace-dark"], ["fixture-ss-spell", "fixture-ss-spell-b"]);
			const asked = resolve(shuffle(duel, "fixture-ace-light", "fixture-ace-dark", "fixture-ss-spell", "fixture-ss-spell-b"));
			// The field holds only this card: nothing can be returned, so nothing is asked.
			expect(asked.asking).toBeFalsy();
			expect(find(asked, card).zone).toBe("graveyard");
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "notes-no-damage-step")} is not activated in the Damage Step, but is in the Battle Step before it`, () => {
			const rival = board6({ set: [card], extra: ["fixture-ace-light"], graveyard: ["fixture-ss-spell"] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle");
			const duel = sentToGraveyard(rival, "fixture-ace-light");
			const declared = play(duel, "attack fixture-filler directly");
			expect(effectsOffered(play(declared, "pass"), card)).toEqual([SHUFFLE]);
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			expect(effectsOffered(mine, card)).toEqual([]);
		});
	});

	describe("the second effect: Link Summon", () => {
		/** In the Graveyard, with an Ace to Link Summon in the Extra Deck, material on the field, and a Spell that Summons an Ace (the first of the Extra Deck). */
		const ready = (more: object = {}) => board6({ graveyard: [card], extra: ["fixture-ace-dark", "fixture-ace-light"], set: ["fixture-ace-summoner"], monsters: ["fixture-filler"], ...more });
		const summoned = (duel: Duel) => resolve(playEffect(duel, "fixture-ace-summoner", 0));
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "link-summon")} ${cites("sky-striker-special-maneuver-lemnisgate", "notes-gy-chain-block")} ${cites("sky-striker-special-maneuver-lemnisgate", "qa-link-summon-is-special-summon")} when a "Sky Striker" monster is Special Summoned to the player's field it banishes itself, then Link Summons an Ace of the Extra Deck, its effect being one that Special Summons`, () => {
			const done = summoned(ready());
			expect(effectsOffered(done, card)).toEqual([LINK_SUMMON]);
			const chained = playEffect(done, card, LINK_SUMMON);
			expect(chained.chain[0]!).toMatchObject({ effect: LINK_SUMMON, categories: ["special-summon"] });
			// The cost is paid at once.
			expect(find(chained, card).zone).toBe("banished");
			// The only Ace left in the Extra Deck is taken at once; the materials are asked: the monsters of the field.
			const asked = resolve(chained);
			expect(offered(asked).filter((label) => label.startsWith("choose")).sort()).toEqual(["choose fixture-ace-dark", "choose fixture-filler"]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "notes-immediately-after")} the Link Summon is performed right after the effect resolves, by the player choosing the Ace, the materials and the zone`, () => {
			const linkReady = ready({ extra: ["fixture-ace-dark", "fixture-ace-light"] });
			const done = summoned(linkReady);
			const asked = resolve(playEffect(done, card, LINK_SUMMON));
			// The materials: any monster of the field (Link 1, 1 material), then the zone.
			const next = play(asked, "choose fixture-filler");
			const placed = next.asking ? play(next, offered(next).find((label) => label.startsWith("place"))!) : next;
			const finished = resolve(placed);
			expect(find(finished, "fixture-ace-light")).toMatchObject({ zone: "monster", face: "up", proper: true });
			expect(find(finished, "fixture-ace-light").summonedBy).toBe("link");
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "link-summon")} "Sky Striker Ace - Azalea", which must be Link Summoned, is a candidate: this is a Link Summon, with its own materials (2 LIGHT and/or DARK monsters)`, () => {
			const duel = board6({ graveyard: [card], extra: ["fixture-ace-dark", "sky-striker-ace-azalea"], set: ["fixture-ace-summoner"], monsters: ["fixture-light"] });
			const summoned = resolve(playEffect(duel, "fixture-ace-summoner", 0));
			expect(effectsOffered(summoned, card)).toEqual([LINK_SUMMON]);
			let next = resolve(playEffect(summoned, card, LINK_SUMMON));
			for (let guard = 0; guard < 6 && next.asking; guard++) next = resolve(play(next, offered(next).find((label) => label.startsWith("choose") || label.startsWith("place"))!));
			expect(find(next, "sky-striker-ace-azalea")).toMatchObject({ zone: "monster", face: "up", proper: true });
			expect(codes(next, "you", "graveyard").sort()).toEqual(["fixture-ace-dark", "fixture-ace-summoner", "fixture-light"]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "link-summon")} is not activated when no "Sky Striker Ace" Link Monster can be Link Summoned, or when the Summoned monster is on the opponent's field`, () => {
			// No Ace left in the Extra Deck after the Summon.
			expect(effectsOffered(summoned(ready({ extra: ["fixture-ace-dark"] })), card)).toEqual([]);
			// An Ace is left in the Extra Deck but it cannot be Link Summoned: it needs 2 materials and the field holds only the monster just Summoned.
			expect(effectsOffered(summoned(ready({ extra: ["fixture-ace-dark", "fixture-ace-two"], monsters: [] })), card)).toEqual([]);
			expect(effectsOffered(summoned(ready({ extra: ["fixture-ace-dark", "fixture-ace-two"], monsters: ["fixture-filler"] })), card)).toEqual([LINK_SUMMON]);
			// A Link Monster that is not an Ace is no candidate.
			expect(effectsOffered(summoned(ready({ extra: ["fixture-ace-dark", "fixture-link"] })), card)).toEqual([]);
			// The monster Summoned is a "Sky Striker" monster of the player's field: not a monster that is not a "Sky Striker" card, not one on the opponent's field.
			const other = board6({ graveyard: [card], extra: ["fixture-ace-light"], monsters: ["fixture-filler"] }, { set: ["fixture-ace-summoner"], extra: ["fixture-ace-dark"] }, {}, "rival");
			expect(effectsOffered(resolve(playEffect(other, "fixture-ace-summoner", 0)), card)).toEqual([]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "link-summon")} is not activated when the monster Special Summoned is not a "Sky Striker" card, or when the only Ace left is not a Link Monster`, () => {
			const plain = board6({ graveyard: [card], extra: ["fixture-extra-plain", "fixture-ace-light"], set: ["fixture-plain-summoner"], monsters: ["fixture-filler"] });
			const done = resolve(playEffect(plain, "fixture-plain-summoner", 0));
			expect(find(done, "fixture-extra-plain").zone).toBe("monster");
			expect(effectsOffered(done, card)).toEqual([]);
			expect(effectsOffered(summoned(ready({ extra: ["fixture-ace-dark", "fixture-ace-fusion"] })), card)).toEqual([]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "notes-gy-no-damage-step")} is not activated in the Damage Step, but is in the Battle Step before it`, () => {
			const make = () => board6({ graveyard: [card], extra: ["fixture-ace-dark", "fixture-ace-light"], set: ["fixture-summon-counter"], monsters: ["fixture-filler"] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle");
			const declared = play(make(), "attack fixture-filler > fixture-filler");
			// In the Battle Step: the Counter Trap Summons an Ace and the Graveyard effect answers it afterwards.
			const early = play(play(declared, "pass"), "activate fixture-summon-counter", "pass", "pass");
			expect(early.battle?.step).toBe("declared");
			expect(effectsOffered(early, card)).toEqual([LINK_SUMMON]);
			// In the Damage Step (at its start, where a Counter Trap may still be activated) it is not.
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			const late = play(mine, "activate fixture-summon-counter", "pass", "pass");
			expect(late.battle?.step).toBe("start");
			expect(codes(late, "you", "monster").length).toBe(2);
			expect(effectsOffered(late, card)).toEqual([]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "qa-summoned-before-in-graveyard")} is not activated for a Summon made by an effect of the chain that sent this card to the Graveyard`, () => {
			const duel = sentToGraveyard(board6({ hand: [card], set: ["fixture-ace-summoner"], extra: ["fixture-ace-dark", "fixture-ace-light"], graveyard: ["fixture-ss-spell"], monsters: ["fixture-filler"] }), "fixture-ace-dark");
			// Chain Link 1 Summons an Ace; Chain Link 2 is this card's first effect. This card is sent to the GY after the chain, the Summon having been done before.
			const first = playEffect(duel, "fixture-ace-summoner", 0);
			const chained = playEffect(play(first, "pass"), card, SHUFFLE, "fixture-ace-dark", "fixture-ss-spell");
			expect(chained.chain).toHaveLength(2);
			const done = resolve(chained);
			expect(find(done, card).zone).toBe("graveyard");
			// The Summon came after this card's first effect: the Ace sent back to the Extra Deck was the one the Spell then Summoned.
			expect(codes(done, "you", "monster").sort()).toContain("fixture-ace-dark");
			expect(effectsOffered(done, card)).toEqual([]);
		});
		it(`${cites("sky-striker-special-maneuver-lemnisgate", "once")} each effect once per turn, apart: using the first leaves the second to another copy, and the second is used once`, () => {
			const duel = sentToGraveyard(board6({ hand: [card], graveyard: [card, "fixture-ss-spell", "fixture-ss-spell-b"], extra: ["fixture-ace-dark", "fixture-ace-light"], set: ["fixture-ace-summoner"], monsters: ["fixture-filler"] }), "fixture-ace-dark");
			const first = resolve(playEffect(duel, card, SHUFFLE, "fixture-ace-dark", "fixture-ss-spell"));
			// The copy in the Graveyard still has its second effect, and the copy in the hand no longer has its first.
			expect(first.asking).toBeFalsy();
			expect(effectsOffered(first, card)).toEqual([]);
			const summoned2 = resolve(playEffect(first, "fixture-ace-summoner", 0));
			expect(effectsOffered(summoned2, card)).toEqual([LINK_SUMMON]);
		});
	});
});
