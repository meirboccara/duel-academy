import { describe, expect, it } from "vitest";
import { addModifier, canSpecialSummon, cites, type Duel, moveCard, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { find } from "./sky-striker-fixtures";
import { board6, effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";

const card = "sky-striker-ace-azalea";
const DESTROY = 0;
const BATTLE = 1;
const summon = `special-summon ${card}`;
const materials = (...monsters: string[]) => board6({ monsters, extra: [card] });
/** Azalea Link Summoned from the Extra Deck by its own procedure (zone 5), the Summon's window passed: its first effect is then on offer. */
const linkSummoned = (duel: Duel): Duel => play(duel, summon, "place 5", "pass", "pass");
/** Three Spells (of the kinds the Graveyard counts), which is what Azalea's cost and its "3 or less" read. */
const withSpells = ["fixture-other-spell", "fixture-quick-spell", "fixture-ss-spell"];

describe("Sky Striker Ace - Azalea, written as effect records", () => {
	it(`${cites("sky-striker-ace-azalea", "facts")} is a DARK Machine Link 2, 1500 ATK, arrows top-left and bottom-right, belonging to both archetypes`, () => {
		const duel = board6({ extra: [card] });
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Ace - Azalea", attribute: "DARK", monsterType: "Machine", frame: "link", link: 2, arrows: ["top-left", "bottom-right"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace - Azalea"] });
	});

	describe("the Summon", () => {
		it(`${cites("sky-striker-ace-azalea", "procedure")} ${cites("sky-striker-ace-azalea", "notes-materials")} is Link Summoned using 2 LIGHT and/or DARK monsters: a LIGHT and a DARK one, 2 LIGHT or 2 DARK, and no other Attribute`, () => {
			for (const pair of [["fixture-light", "fixture-dark"], ["fixture-light", "fixture-light"], ["fixture-dark", "fixture-dark"]]) expect(offered(materials(...pair))).toContain(summon);
			for (const pair of [["fixture-light", "fixture-water"], ["fixture-water", "fixture-water"], ["fixture-dark"], ["fixture-light"]]) expect(offered(materials(...pair))).not.toContain(summon);
		});
		it(`${cites("sky-striker-ace-azalea", "procedure")} takes exactly 2 materials: once 2 are chosen out of 3, the Summon goes on to its zone`, () => {
			const asked = play(materials("fixture-light", "fixture-dark", "fixture-light"), summon);
			const first = play(asked, "choose fixture-dark");
			const second = play(first, offered(first).find((label) => label.startsWith("choose"))!);
			expect(offered(second).every((label) => label.startsWith("place"))).toBe(true);
		});
		it(`${cites("sky-striker-ace-azalea", "procedure")} the 2 materials go to the Graveyard and Azalea is on the field, face-up and properly Summoned`, () => {
			const done = linkSummoned(materials("fixture-light", "fixture-dark"));
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", controller: "you", proper: true });
			expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-dark", "fixture-light"]);
		});
		it(`${cites("sky-striker-ace-azalea", "link-only")} ${cites("sky-striker-ace-azalea", "notes-not-effect")} must be Link Summoned: no effect Special Summons it, from the Extra Deck or the Graveyard, whatever happens to its effects`, () => {
			const duel = board6({ extra: [card, "fixture-ace-light"], graveyard: [card] });
			const inExtra = duel.piles.you.extra.map((id) => duel.cards[id]!).find((entry) => entry.code === card)!;
			const inGraveyard = duel.piles.you.graveyard.map((id) => duel.cards[id]!)[0]!;
			expect(canSpecialSummon(duel, "you", inExtra.id)).toBe(false);
			expect(canSpecialSummon(duel, "you", inGraveyard.id)).toBe(false);
			expect(canSpecialSummon(duel, "you", find(duel, "fixture-ace-light").id)).toBe(true);
		});
		it(`${cites("sky-striker-ace-azalea", "once-summon")} ${cites("sky-striker-ace-azalea", "notes-not-effect")} only one Special Summon of the name per turn, by any way, even when its effects are negated`, () => {
			const start = board6({ extra: [card, card] });
			const [a, b] = start.piles.you.extra;
			// The first copy is put on the field by the core's own Summon (the procedure is not what this test is about).
			const done = specialSummon(start, "you", a!, { slot: 5, kind: "link" });
			expect(done.cards[a!]!.zone).toBe("monster");
			// A Summon by its own procedure (the Link kind) is allowed to Special Summon it: only the limit of one per turn stops the second copy.
			expect(canSpecialSummon(board6({ extra: [card, card] }), "you", b!, "link")).toBe(true);
			expect(canSpecialSummon(done, "you", b!, "link")).toBe(false);
			expect(canSpecialSummon(negateCardEffects(done, a!, 3), "you", b!, "link")).toBe(false);
		});
	});

	describe("the first effect: destroy, then send itself", () => {
		const start = (graveyard: string[] = [], rival: object = { monsters: ["fixture-big"], set: ["fixture-trap"] }, mine: object = {}) => linkSummoned(board6({ monsters: ["fixture-light", "fixture-dark"], extra: [card], graveyard, ...mine }, rival));
		it(`${cites("sky-striker-ace-azalea", "destroy")} ${cites("sky-striker-ace-azalea", "notes-destroy-trigger")} when Special Summoned it may target 1 card on the field, of either player, face-down ones and itself included, and destroys it`, () => {
			const duel = start();
			expect(effectsOffered(duel, card)).toEqual([DESTROY]);
			expect(offered(duel).filter((label) => label.startsWith(`activate ${card}`)).sort()).toEqual([`activate ${card} > ${card}`, `activate ${card} > fixture-big`, `activate ${card} > fixture-trap`].sort());
			const done = play(playEffect(duel, card, DESTROY, "fixture-trap"), "pass", "pass");
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-trap"]);
			expect(codes(done, "rival", "monster")).toEqual(["fixture-big"]);
		});
		it(`${cites("sky-striker-ace-azalea", "destroy")} ${cites("sky-striker-ace-azalea", "notes-not-simultaneous")} then sends itself to the Graveyard when the player has 3 or fewer Spells in the Graveyard, counted after the destruction`, () => {
			// 3 Spells in the Graveyard and a monster destroyed: 3, so Azalea is sent.
			const sent = play(playEffect(start(withSpells), card, DESTROY, "fixture-big"), "pass", "pass");
			expect(find(sent, card).zone).toBe("graveyard");
			expect(find(sent, "fixture-big").zone).toBe("graveyard");
			// The player's own Spell destroyed is in their Graveyard when the cards are counted (that is 4): Azalea stays. The opponent's Spell goes to the opponent's.
			const kept = play(playEffect(start(withSpells, { monsters: ["fixture-big"] }, { faceupSpells: ["fixture-ss-spell-b"] }), card, DESTROY, "fixture-ss-spell-b"), "pass", "pass");
			expect(find(kept, "fixture-ss-spell-b").zone).toBe("graveyard");
			expect(find(kept, card).zone).toBe("monster");
			const theirs = play(playEffect(start(withSpells, { monsters: ["fixture-big"], faceupSpells: ["fixture-ss-spell-b"] }), card, DESTROY, "fixture-ss-spell-b"), "pass", "pass");
			expect(find(theirs, card).zone).toBe("graveyard");
			// 4 Spells already there: it stays whatever is destroyed.
			const four = play(playEffect(start([...withSpells, "fixture-ss-spell-b"]), card, DESTROY, "fixture-big"), "pass", "pass");
			expect(find(four, card).zone).toBe("monster");
		});
		it(`${cites("sky-striker-ace-azalea", "notes-not-simultaneous")} is not sent when the destruction did not take (the target cannot be destroyed by card effects)`, () => {
			const protectedTarget = play(playEffect(start(withSpells, { monsters: ["fixture-destruction-proof"] }), card, DESTROY, "fixture-destruction-proof"), "pass", "pass");
			expect(find(protectedTarget, "fixture-destruction-proof").zone).toBe("monster");
			expect(find(protectedTarget, card).zone).toBe("monster");
		});
		it(`${cites("sky-striker-ace-azalea", "destroy")} declares that it destroys and sends a card to the Graveyard`, () => {
			const chained = playEffect(start(), card, DESTROY, "fixture-big");
			expect(chained.chain[0]!).toMatchObject({ effect: DESTROY, categories: ["destroy", "send-to-graveyard"] });
		});
		it(`${cites("sky-striker-ace-azalea", "notes-not-simultaneous")} the destruction and the send are two steps: an optional "when" effect of the destroyed card misses the timing when Azalea is sent after it, and is on time when Azalea stays (4 or more Spells)`, () => {
			const rival = { monsters: ["fixture-when-sent"] };
			const sent = play(playEffect(start(withSpells, rival), card, DESTROY, "fixture-when-sent"), "pass", "pass");
			expect(find(sent, card).zone).toBe("graveyard");
			expect(find(sent, "fixture-when-sent").zone).toBe("graveyard");
			expect(offered(sent).some((label) => label.startsWith("activate") && label.includes("fixture-when-sent"))).toBe(false);
			const kept = play(playEffect(start([...withSpells, "fixture-ss-spell-b"], rival), card, DESTROY, "fixture-when-sent"), "pass", "pass");
			expect(find(kept, card).zone).toBe("monster");
			expect(offered(kept).some((label) => label.startsWith("activate") && label.includes("fixture-when-sent"))).toBe(true);
		});
		it(`${cites("sky-striker-ace-azalea", "destroy")} still destroys its target but sends nothing when it left the field before the effect resolves`, () => {
			const chained = playEffect(start(withSpells), card, DESTROY, "fixture-big");
			const gone = moveCard(chained, find(chained, card).id, { zone: "extra" });
			const done = play(gone, "pass", "pass");
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("extra");
		});
		it(`${cites("sky-striker-ace-azalea", "destroy")} destroys itself when it targets itself, and is then not sent`, () => {
			const itself = play(playEffect(start(), card, DESTROY, card), "pass", "pass");
			expect(find(itself, card).zone).toBe("graveyard");
			expect(codes(itself, "rival", "monster")).toEqual(["fixture-big"]);
		});
		it(`${cites("sky-striker-ace-azalea", "notes-damage-step")} can also be activated in the Damage Step, when it is Link Summoned there by an effect`, () => {
			const duel = board6({ monsters: ["fixture-light", "fixture-dark", "fixture-filler"], extra: [card], set: ["fixture-azalea-counter"] }, { monsters: ["fixture-big"] }, {}, "you", "battle");
			const damage = toStep(play(duel, "attack fixture-filler > fixture-big"), "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			// The Counter Trap Link Summons Azalea; once the Summon's window has passed its trigger is offered, still in the Damage Step.
			const summoned = play(mine, "activate fixture-azalea-counter", "pass", "pass", "place 5", "pass", "pass");
			expect(summoned.battle?.step).toBe("start");
			expect(find(summoned, card)).toMatchObject({ zone: "monster", proper: true });
			expect(effectsOffered(summoned, card)).toEqual([DESTROY]);
			const done = play(playEffect(summoned, card, DESTROY, "fixture-big"), "pass", "pass");
			expect(find(done, "fixture-big").zone).toBe("graveyard");
		});
	});

	describe("the second effect: destroy the monster it battles", () => {
		/** Azalea in an Extra Monster Zone with 3 Spells in the Graveyard to pay with; the rival has two monsters of 1000 ATK. */
		const battle = (mine: object = {}, turn: "you" | "rival" = "you") => board6({ extraZone: [card], graveyard: withSpells, ...mine }, { monsters: ["fixture-filler", "fixture-filler"] }, {}, turn, "battle");
		const atDamageStep = (duel: Duel, attack: string) => {
			const damage = toStep(play(duel, attack), "start");
			return damage.priority.holder === "you" ? damage : play(damage, "pass");
		};
		it(`${cites("sky-striker-ace-azalea", "battle")} ${cites("sky-striker-ace-azalea", "notes-battle-trigger")} at the start of the Damage Step, when it attacks an opponent's monster, it banishes 1 Spell from the Graveyard and destroys that monster`, () => {
			const mine = atDamageStep(battle(), `attack ${card} > fixture-filler`);
			expect(mine.battle?.step).toBe("start");
			expect(effectsOffered(mine, card)).toEqual([BATTLE]);
			// The Spell is banished at once, as the cost.
			const chained = playEffect(mine, card, BATTLE);
			expect(codes(chained, "you", "graveyard").length).toBe(2);
			expect(codes(chained, "you", "banished").length).toBe(1);
			const done = play(chained, "pass", "pass");
			expect(codes(done, "rival", "graveyard")).toEqual(["fixture-filler"]);
			expect(find(done, card).zone).toBe("monster");
		});
		it(`${cites("sky-striker-ace-azalea", "battle")} also when it is attacked by an opponent's monster, but not for a direct attack or with no Spell to banish`, () => {
			const attacked = atDamageStep(battle({}, "rival"), `attack fixture-filler > ${card}`);
			expect(effectsOffered(attacked, card)).toEqual([BATTLE]);
			// Not a battle with a monster: a direct attack by Azalea.
			const direct = play(board6({ extraZone: [card], graveyard: withSpells }, {}, {}, "you", "battle"), `attack ${card} directly`);
			expect(direct.battle?.target).toBeNull();
			expect(effectsOffered(toStep(direct, "start"), card)).toEqual([]);
			// No Spell in the Graveyard: no cost.
			expect(effectsOffered(atDamageStep(battle({ graveyard: ["fixture-trap", "fixture-filler"] }), `attack ${card} > fixture-filler`), card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-azalea", "battle")} the use is per copy ("Once per turn", not "of this name"): a second Azalea attacking the same turn can still use it`, () => {
			const start = board6({ extraZone: [card], monsters: [card], graveyard: withSpells }, { monsters: ["fixture-filler", "fixture-filler", "fixture-filler"] }, {}, "you", "battle");
			const first = atDamageStep(start, `attack ${card} > fixture-filler`);
			const used = play(playEffect(first, card, BATTLE), "pass", "pass");
			expect(codes(used, "rival", "monster").length).toBe(2);
			const second = atDamageStep(toStep(used, null), `attack ${card} > fixture-filler`);
			expect(second.battle?.step).toBe("start");
			expect(effectsOffered(second, card)).toEqual([BATTLE]);
		});
		it(`${cites("sky-striker-ace-azalea", "battle")} is once per turn for each copy: a second attack of the same turn does not offer it again`, () => {
			const start = battle();
			const twice = addModifier(start, { affects: { card: find(start, card).id, moves: find(start, card).moves }, until: 3, layer: { kind: "attack", allows: { what: "times", count: 2 } } });
			const first = atDamageStep(twice, `attack ${card} > fixture-filler`);
			expect(effectsOffered(first, card)).toEqual([BATTLE]);
			const done = play(playEffect(first, card, BATTLE), "pass", "pass");
			expect(codes(done, "rival", "monster")).toEqual(["fixture-filler"]);
			const second = atDamageStep(toStep(done, null), `attack ${card} > fixture-filler`);
			expect(second.battle?.step).toBe("start");
			expect(effectsOffered(second, card)).toEqual([]);
		});
	});
});
