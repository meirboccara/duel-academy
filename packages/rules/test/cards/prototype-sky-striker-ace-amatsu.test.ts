import { describe, expect, it } from "vitest";
import { addModifier, canSpecialSummon, cites, type Duel, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board8 } from "./sky-striker-batch8-fixtures";
import { effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";
import { find, resolve } from "./sky-striker-fixtures";

const card = "prototype-sky-striker-ace-amatsu";
const REPLACE = 0;
const DESTROY = 1;
const summon = `special-summon ${card}`;
const idOf = (duel: Duel, code: string): number => find(duel, code).id;

/**
 * The opponent's turn: its monster of 2500 ATK may activate its effect; Amatsu is in an Extra Monster Zone and the player has a "Sky Striker Ace" Link Monster.
 * `activating`: the code of the opponent's effect monster that activates (an ignition effect).
 */
const rivalTurn = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = {}, log: string[] = []) => board8(log, { extraZone: [card], monsters: ["fixture-ace-dark"], ...you }, { monsters: ["fixture-effect-2500"], ...rival }, {}, "rival");
const activated = (duel: Duel, effect = "fixture-effect-2500") => play(duel, `activate ${effect}`);
/** Passes until `label` is on offer. */
function untilOffered(duel: Duel, label: string): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && !offered(next).includes(label); guard++) next = play(next, "pass");
	return next;
}

describe("Prototype Sky Striker Ace - Amatsu, written as effect records", () => {
	it(`${cites("prototype-sky-striker-ace-amatsu", "facts")} is a DARK Machine Link 1 Effect Monster with 1500 ATK and its arrow at the bottom, a "Sky Striker Ace" and a "Sky Striker" card that mentions itself`, () => {
		const duel = board8([], { extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, idOf(duel, card))).toEqual({ name: "Prototype Sky Striker Ace - Amatsu", attribute: "DARK", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Prototype Sky Striker Ace - Amatsu"] });
	});
	it(`${cites("prototype-sky-striker-ace-amatsu", "procedure")} is Link Summoned using 1 "Sky Striker Ace" monster, which goes to the Graveyard`, () => {
		expect(offered(board8([], { monsters: ["fixture-ace-dark"], extra: [card] }))).toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-ace-warrior"], extra: [card] }))).toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-filler"], extra: [card] }))).not.toContain(summon);
		const done = play(board8([], { monsters: ["fixture-ace-dark"], extra: [card] }), summon, "place 5", "pass", "pass");
		expect(codes(done, "you", "graveyard")).toEqual(["fixture-ace-dark"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", slot: 5, summonedBy: "link", proper: true });
	});
	it(`${cites("prototype-sky-striker-ace-amatsu", "once-summon")} ${cites("prototype-sky-striker-ace-amatsu", "notes-not-effect")} ${cites("prototype-sky-striker-ace-amatsu", "notes-any-summon")} only one Special Summon of the name per turn, whether or not it is a Link Summon, even when its effects are negated`, () => {
		const start = board8([], { extra: [card, card] });
		const [first, second] = start.piles.you.extra;
		const done = specialSummon(start, "you", first!, { slot: 5, kind: "link" });
		expect(done.cards[first!]!.zone).toBe("monster");
		expect(canSpecialSummon(start, "you", second!, "link")).toBe(true);
		expect(canSpecialSummon(done, "you", second!, "link")).toBe(false);
		expect(canSpecialSummon(negateCardEffects(done, first!, done.turn.number), "you", second!, "link")).toBe(false);
	});

	it(`${cites("prototype-sky-striker-ace-amatsu", "qa-gozen-10427")} under a one-Attribute lock, real Amatsu permits Raye's activation before its Tribute frees the field for real Kagari`, () => {
		const raye = "sky-striker-ace-raye";
		const kagari = "sky-striker-ace-kagari";
		const lock = { monsters: [raye], faceupSpells: ["fixture-one-attribute"] };
		const onlyFire = board8([], { ...lock, extra: [kagari] });
		expect(offered(onlyFire)).not.toContain(`activate ${raye}`);
		expect(offered(onlyFire)).not.toContain(`special-summon ${kagari}`);
		const ready = board8([], { ...lock, extra: [kagari, card] });
		expect(offered(ready)).toContain(`activate ${raye}`);
		const asked = resolve(play(ready, `activate ${raye}`));
		expect(offered(asked).sort()).toEqual([`choose ${card}`, `choose ${kagari}`].sort());
		expect(find(play(asked, `choose ${kagari}`, "place 5"), kagari)).toMatchObject({ zone: "monster", slot: 5 });
	});

	describe("the first effect: the activated effect becomes a destruction", () => {
		it(`${cites("prototype-sky-striker-ace-amatsu", "replace")} ${cites("prototype-sky-striker-ace-amatsu", "notes-replace-quick")} ${cites("prototype-sky-striker-ace-amatsu", "notes-replace-chain-directly")} ${cites("prototype-sky-striker-ace-amatsu", "notes-replace-opponent-chooses")} when a monster the opponent controls with 2000 or more ATK activates its effect, it makes it "destroy 1 "Sky Striker Ace" Link Monster your opponent controls": its player chooses among the Link Monsters of the player, and the effect is not what the card says`, () => {
			const log: string[] = [];
			const duel = activated(rivalTurn({}, {}, log));
			expect(effectsOffered(duel, card)).toEqual([REPLACE]);
			const asked = resolve(playEffect(duel, card, REPLACE));
			// The player who activated the effect (the opponent) chooses, among the "Sky Striker Ace" Link Monsters of the other player: this card too.
			expect(asked.asking).toMatchObject({ player: "rival" });
			expect(offered(asked)).toEqual(["choose fixture-ace-dark", `choose ${card}`]);
			const done = play(asked, "choose fixture-ace-dark");
			expect(find(done, "fixture-ace-dark").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("monster");
			expect(log).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "notes-replace-opponent-chooses")} a non-Link "Sky Striker Ace" cannot be chosen for the replaced effect`, () => {
			const start = rivalTurn({ monsters: ["fixture-ace-dark", "fixture-ace-warrior"] });
			const asked = resolve(playEffect(activated(start), card, REPLACE));
			expect(offered(asked)).toEqual(["choose fixture-ace-dark", `choose ${card}`]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "replace")} the effect must be that of a monster with 2000 or more ATK: 2000 is enough, 1900 is not; an effect of a Spell Card, of a monster in the hand, or of the player's own monster is not one`, () => {
			expect(effectsOffered(activated(rivalTurn({}, { monsters: ["fixture-effect-2000"] }), "fixture-effect-2000"), card)).toEqual([REPLACE]);
			expect(effectsOffered(activated(rivalTurn({}, { monsters: ["fixture-effect-1900"] }), "fixture-effect-1900"), card)).toEqual([]);
			expect(effectsOffered(play(rivalTurn({}, { monsters: [], hand: ["fixture-activator"] }), "activate fixture-activator"), card)).toEqual([]);
			expect(effectsOffered(play(rivalTurn({}, { monsters: [], hand: ["fixture-hand-effect"] }), "activate fixture-hand-effect"), card)).toEqual([]);
			// The effect of the player's own monster is not "a monster your opponent controls": the player's turn, the opponent passes.
			const own = board8([], { extraZone: [card], monsters: ["fixture-effect-2500"] }, {});
			const ownEffect = play(own, "activate fixture-effect-2500", "pass");
			expect([ownEffect.priority.holder, ownEffect.chain.map((link) => link.player)]).toEqual(["you", ["you"]]);
			expect(effectsOffered(ownEffect, card)).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "qa-atk-before-cost-24164")} a monster that Tributes itself as the cost is judged by the ATK it had before it left, one that another effect raised to 2000 or more included`, () => {
			const start = rivalTurn({}, { monsters: ["fixture-tributer"] });
			const tributer = idOf(start, "fixture-tributer");
			expect(effectsOffered(activated(start, "fixture-tributer"), card)).toEqual([]);
			const raised = addModifier(start, { affects: { card: tributer, moves: start.cards[tributer]!.moves }, until: start.turn.number, layer: { kind: "add", stat: "atk", by: 600 } });
			const chained = activated(raised, "fixture-tributer");
			expect(chained.cards[tributer]!.zone).toBe("graveyard");
			expect(chained.chain[0]!.stats).toEqual({ atk: 2100, def: 600 });
			expect(effectsOffered(chained, card)).toEqual([REPLACE]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "notes-replace-no-damage-step")} it cannot be activated in the Damage Step, where a monster of 3000 ATK activates a Quick Effect`, () => {
			const rival = { monsters: ["fixture-quick-3000"] };
			const open = play(board8([], { extraZone: [card], monsters: ["fixture-filler"] }, rival, {}, "rival"), "activate fixture-quick-3000");
			expect(effectsOffered(open, card)).toEqual([REPLACE]);
			const battle = board8([], { extraZone: [card], monsters: ["fixture-filler"] }, rival, {}, "rival", "battle");
			const damage = toStep(play(battle, "attack fixture-quick-3000 > fixture-filler"), "start");
			const rivalHolds = damage.priority.holder === "rival" ? damage : play(damage, "pass");
			const answered = play(rivalHolds, "activate fixture-quick-3000");
			expect(answered.battle?.step).toBe("start");
			expect([answered.priority.holder, effectsOffered(answered, card)]).toEqual(["you", []]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "notes-replace-not-applied-to-monster")} the effect of a monster that is unaffected by other cards' effects is replaced too`, () => {
			const log: string[] = [];
			const start = rivalTurn({}, { monsters: ["fixture-effect-2500-unaffected"] }, log);
			const done = play(resolve(playEffect(activated(start, "fixture-effect-2500-unaffected"), card, REPLACE)), "choose fixture-ace-dark");
			expect(find(done, "fixture-ace-dark").zone).toBe("graveyard");
			expect(log).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "notes-replace-applies-with-no-ace")} ${cites("prototype-sky-striker-ace-amatsu", "notes-replace-nothing-done")} when the player has no "Sky Striker Ace" Link Monster by the time the effect resolves, the effect is still replaced, and neither the new effect nor the original one is done`, () => {
			const log: string[] = [];
			const start = rivalTurn({ monsters: [] }, { set: ["fixture-trap-destroy"] }, log);
			const chained = playEffect(activated(start), card, REPLACE);
			// Amatsu itself is destroyed in answer (Chain Link 3): no "Sky Striker Ace" Link Monster is left at resolution.
			const done = resolve(play(chained, `activate fixture-trap-destroy > ${card}`));
			expect(find(done, card).zone).toBe("graveyard");
			expect(done.asking).toBeNull();
			expect(log).toEqual([]);
			expect(done.chain).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "qa-protected-choice-24165")} a Link Monster that cannot be destroyed by card effects can be chosen: it stays, and the effect is over`, () => {
			const log: string[] = [];
			const start = rivalTurn({ monsters: ["fixture-ace-proof"] }, {}, log);
			const asked = resolve(playEffect(activated(start), card, REPLACE));
			expect(offered(asked)).toEqual(["choose fixture-ace-proof", `choose ${card}`]);
			const done = play(asked, "choose fixture-ace-proof");
			expect(find(done, "fixture-ace-proof").zone).toBe("monster");
			expect(done.chain).toEqual([]);
			expect(done.asking).toBeNull();
			expect(log).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "qa-opponents-effect-24166")} a "Sky Striker Ace" Link Monster it destroys was destroyed by the opponent's effect: "Sky Striker Ace - Raye" in the Graveyard can Special Summon itself`, () => {
			const start = rivalTurn({ graveyard: ["sky-striker-ace-raye"] });
			const done = play(resolve(playEffect(activated(start), card, REPLACE)), "choose fixture-ace-dark");
			expect(find(done, "fixture-ace-dark").zone).toBe("graveyard");
			expect(untilOffered(done, "activate sky-striker-ace-raye")).toBeDefined();
			expect(offered(untilOffered(done, "activate sky-striker-ace-raye"))).toContain("activate sky-striker-ace-raye");
			// Control: with nothing destroyed, Raye cannot be activated.
			expect(offered(start)).not.toContain("activate sky-striker-ace-raye");
		});
	});

	describe("the second effect: destroy a monster of the player and a card of the opponent", () => {
		/** Amatsu attacks the opponent's monster in the player's Battle Phase. */
		const attacking = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = {}, log: string[] = []) => {
			const duel = board8(log, { extraZone: [card], monsters: ["fixture-ace-dark"], ...you }, { monsters: ["fixture-filler"], ...rival }, {}, "you", "battle");
			return play(duel, `attack ${card} > fixture-filler`);
		};
		it(`${cites("prototype-sky-striker-ace-amatsu", "destroy")} ${cites("prototype-sky-striker-ace-amatsu", "notes-destroy-trigger")} ${cites("prototype-sky-striker-ace-amatsu", "notes-destroy-attack")} ${cites("prototype-sky-striker-ace-amatsu", "notes-destroy-targets")} when an attack involving this card and an opponent's monster is declared, it may target 1 face-up "Sky Striker Ace" monster the player controls and 1 card the opponent controls, a face-down card too, and destroys them`, () => {
			const duel = attacking({ monsters: ["fixture-ace-dark", "fixture-filler", "fixture-ace-warrior"], facedown: ["fixture-ace-warrior"] }, { set: ["fixture-trap"], facedown: ["fixture-normal"] });
			expect(effectsOffered(duel, card)).toEqual([DESTROY]);
			const labels = offered(duel).filter((label) => label.startsWith(`activate ${card}`));
			const clean = (label: string, at: number) => label.split(" > ")[at]!.replace(/ \{.*\}$/, "");
			// The player's side: the face-up "Sky Striker Ace" monsters of the Monster Zones, not the other monsters, not a face-down one; the opponent's side: every card.
			expect(new Set(labels.map((label) => clean(label, 1)))).toEqual(new Set(["fixture-ace-dark", "fixture-ace-warrior", card]));
			expect(new Set(labels.map((label) => clean(label, 2)))).toEqual(new Set(["fixture-filler", "fixture-trap", "fixture-normal"]));
			const done = resolve(playEffect(duel, card, DESTROY, "fixture-ace-dark", "fixture-trap"));
			expect([find(done, "fixture-ace-dark").zone, find(done, "fixture-trap").zone]).toEqual(["graveyard", "graveyard"]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "notes-destroy-attack")} it also triggers when an opponent's monster attacks this card, and not for a direct attack`, () => {
			const attacked = play(board8([], { extraZone: [card], monsters: ["fixture-ace-dark"] }, { monsters: ["fixture-filler"] }, {}, "rival", "battle"), `attack fixture-filler > ${card}`);
			expect(effectsOffered(attacked, card)).toEqual([DESTROY]);
			// An opponent's card remains a legal effect target, so the direct-attack condition is actually exercised.
			const direct = play(board8([], { monsters: ["fixture-ace-dark", card] }, { set: ["fixture-trap"] }, {}, "you", "battle"), `attack ${card} directly`);
			expect(direct.battle?.target).toBeNull();
			expect(effectsOffered(direct, card)).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "notes-destroy-partial")} when one target is no longer a target at resolution, the other card is still destroyed`, () => {
			const duel = attacking({}, { monsters: ["fixture-filler", "fixture-big"], set: ["fixture-trap-destroy"] });
			const chained = playEffect(duel, card, DESTROY, "fixture-ace-dark", "fixture-big");
			const done = resolve(play(chained, "activate fixture-trap-destroy > fixture-ace-dark"));
			expect([find(done, "fixture-ace-dark").zone, find(done, "fixture-big").zone]).toEqual(["graveyard", "graveyard"]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "once")} ${cites("prototype-sky-striker-ace-amatsu", "destroy")} each effect once per turn: the second effect is not offered again for a second attack of the turn`, () => {
			const start = board8([], { extraZone: [card], monsters: ["fixture-ace-dark"] }, { monsters: ["fixture-filler", "fixture-filler"] }, {}, "you", "battle");
			const twice = addModifier(start, { affects: { card: idOf(start, card), moves: find(start, card).moves }, until: 3, layer: { kind: "attack", allows: { what: "times", count: 2 } } });
			const first = play(twice, `attack ${card} > fixture-filler`);
			expect(effectsOffered(first, card)).toEqual([DESTROY]);
			const done = resolve(playEffect(first, card, DESTROY, "fixture-ace-dark", "fixture-filler"));
			const again = untilOffered(done, `attack ${card} > fixture-filler`);
			const second = play(again, `attack ${card} > fixture-filler`);
			expect(second.battle?.target).not.toBeNull();
			expect(effectsOffered(second, card)).toEqual([]);
		});
		it(`${cites("prototype-sky-striker-ace-amatsu", "once")} ${cites("prototype-sky-striker-ace-amatsu", "replace")} the first effect cannot be used again by another copy in the same turn`, () => {
			const start = rivalTurn({ monsters: [card, "fixture-ace-dark"] }, { monsters: ["fixture-effect-2500", "fixture-quick-3000"] });
			const chained = playEffect(activated(start), card, REPLACE);
			expect(chained.chain.map((link) => link.player)).toEqual(["rival", "you"]);
			// The opponent answers with a monster of 3000 ATK: the other copy cannot answer it, its effect having been used by name.
			const answered = play(chained, "activate fixture-quick-3000");
			expect([answered.priority.holder, effectsOffered(answered, card)]).toEqual(["you", []]);
			// Control: with no copy having used it, the same effect is answered.
			expect(effectsOffered(activated(rivalTurn({ monsters: [card, "fixture-ace-dark"] }, { monsters: ["fixture-effect-2500", "fixture-quick-3000"] })), card)).toEqual([REPLACE]);
		});
	});
});
