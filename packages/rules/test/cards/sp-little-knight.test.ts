import { describe, expect, it } from "vitest";
import { attackLocked, cites, type Duel, moveCard, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { nextTurn, toPhase as toPhaseOf } from "../rules/continuous-fixtures";
import { codes, lastingLines, offered, play } from "../rules/fixtures";
import { board8 } from "./sky-striker-batch8-fixtures";
import { effectsOffered, playEffect } from "./sky-striker-batch6-fixtures";
import { find, resolve } from "./sky-striker-fixtures";

const card = "sp-little-knight";
const BANISH = 0;
const BLINK = 1;
const summon = `special-summon ${card}`;
const idOf = (duel: Duel, code: string): number => find(duel, code).id;

/**
 * S:P Little Knight Link Summoned from the Extra Deck with a Synchro Monster as material, the Summon's window passed: its first effect is on offer. `chosen`:
 * the materials the player names when more than 2 monsters can be used; `slot`: the Extra Monster Zone.
 */
const linked = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = {}, log: string[] = [], chosen: string[] = [], slot = 5) =>
	play(board8(log, { monsters: ["fixture-mat-synchro", "fixture-filler"], extra: [card], ...you }, rival), summon, ...chosen.map((code) => `choose ${code}`), `place ${slot}`, "pass", "pass");
/** Answers every question that is open with its first zone (or its first card), until none is. */
function settle(duel: Duel): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && next.asking; guard++) next = play(next, offered(next).find((label) => label.startsWith("place")) ?? offered(next)[0]!);
	return next;
}
/** The rival's turn: it activates its Spell, and S:P Little Knight (an Extra Monster Zone) may answer. */
const answering = (you: Record<string, string[]> = {}, rival: Record<string, string[]> = {}, log: string[] = []) =>
	play(board8(log, { extraZone: [card], monsters: ["fixture-filler"], ...you }, { hand: ["fixture-activator"], monsters: ["fixture-big"], ...rival }, {}, "rival"), "activate fixture-activator");
/** Activates the second effect on the two cards, whatever the order the targets are listed in. */
const blink = (duel: Duel, first: string, second: string): Duel => {
	try {
		return playEffect(duel, card, BLINK, first, second);
	} catch {
		return playEffect(duel, card, BLINK, second, first);
	}
};
/** The pairs the second effect offers, each as its two codes in alphabetical order. */
const pairs = (duel: Duel): string[] =>
	offered(duel)
		.filter((label) => label.startsWith(`activate ${card} > `))
		.map((label) => label.slice(`activate ${card} > `.length).split(" > ").sort().join(" + "))
		.sort();

/** Passes until the turn player holds priority in an open game state of `phase` in turn `turn`. */
function toPhase(duel: Duel, phase: Duel["turn"]["phase"], turn = duel.turn.number): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.number === turn && next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}
/** The Battle Phase's Battle Step of this turn, where the attacks are on offer. */
const battleStep = (duel: Duel): Duel => play(toPhaseOf(duel, "battle"), "pass", "pass");
const attacks = (duel: Duel): string[] => offered(battleStep(duel)).filter((label) => label.startsWith("attack"));
/** Passes until `label` is on offer. */
function untilOffered(duel: Duel, label: string): Duel {
	let next = duel;
	for (let guard = 0; guard < 10 && !offered(next).includes(label); guard++) next = play(next, "pass");
	return next;
}

describe("S:P Little Knight, written as effect records", () => {
	it(`${cites("sp-little-knight", "facts")} is a DARK Warrior Link 2 Effect Monster with 1600 ATK and its arrows at the left and the right, with no archetype and a card that mentions itself`, () => {
		const duel = board8([], { extra: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, idOf(duel, card))).toEqual({ name: "S:P Little Knight", attribute: "DARK", monsterType: "Warrior", frame: "link", link: 2, arrows: ["left", "right"], atk: 1600, mentions: ["S:P Little Knight"] });
	});
	it(`${cites("sp-little-knight", "procedure")} is Link Summoned using 2 Effect Monsters, which go to the Graveyard: not a Normal Monster, not a single monster`, () => {
		expect(offered(board8([], { monsters: ["fixture-filler", "fixture-filler"], extra: [card] }))).toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-filler", "fixture-link"], extra: [card] }))).toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-filler", "fixture-normal"], extra: [card] }))).not.toContain(summon);
		expect(offered(board8([], { monsters: ["fixture-filler"], extra: [card] }))).not.toContain(summon);
		const done = linked();
		expect(codes(done, "you", "graveyard").sort()).toEqual(["fixture-filler", "fixture-mat-synchro"]);
		expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", slot: 5, summonedBy: "link", proper: true });
	});

	describe("the first effect: banish a card, then no direct attacks", () => {
		it(`${cites("sp-little-knight", "banish")} ${cites("sp-little-knight", "notes-banish-trigger")} when Link Summoned using a Fusion, Synchro, Xyz or Link Monster as material it can be activated; with 2 plain Effect Monsters it cannot`, () => {
			for (const other of ["fixture-mat-fusion", "fixture-mat-synchro", "fixture-mat-xyz", "fixture-link"]) expect(effectsOffered(linked({ monsters: [other, "fixture-filler"] }), card)).toEqual([BANISH]);
			expect(effectsOffered(linked({ monsters: ["fixture-filler", "fixture-filler"] }), card)).toEqual([]);
		});
		it(`${cites("sp-little-knight", "banish")} ${cites("sp-little-knight", "notes-banish-face-down")} ${cites("sp-little-knight", "notes-banish-then-lock")} it may target 1 card on the field or in either Graveyard, a face-down card too, and banishes it face-up`, () => {
			const duel = linked({ graveyard: ["fixture-ss-spell"] }, { monsters: ["fixture-big"], set: ["fixture-trap"], graveyard: ["fixture-other-spell"], hand: ["fixture-normal"] });
			const targets = offered(duel)
				.filter((label) => label.startsWith(`activate ${card} > `))
				.map((label) => label.slice(`activate ${card} > `.length))
				.sort();
			// The field of both players and both Graveyards (the 2 materials are in the player's): not a hand.
			expect(targets).toEqual([card, "fixture-big", "fixture-filler", "fixture-mat-synchro", "fixture-other-spell", "fixture-ss-spell", "fixture-trap"].sort());
			const done = play(playEffect(duel, card, BANISH, "fixture-trap"), "pass", "pass");
			expect(find(done, "fixture-trap")).toMatchObject({ zone: "banished", face: "up" });
			// The restriction follows the banishment at once.
			expect(attackLocked(done, find(done, card), true)).toBe(true);
		});
		it(`${cites("sp-little-knight", "notes-lock-without-banish")} the monsters still cannot attack directly when the banishment did not take (the card cannot be banished from the Graveyard), and are free again next turn`, () => {
			const you = { monsters: ["fixture-mat-synchro", "fixture-filler", "fixture-normal"], faceupSpells: ["fixture-iron-wall"] };
			const duel = linked(you, { graveyard: ["fixture-other-spell"] });
			// Without the effect the player's monsters can attack directly (the opponent controls no monster).
			expect(attacks(duel)).toEqual(["attack fixture-normal directly", `attack ${card} directly`].sort());
			const done = play(playEffect(duel, card, BANISH, "fixture-other-spell"), "pass", "pass");
			expect(find(done, "fixture-other-spell").zone).toBe("graveyard");
			expect(attackLocked(done, find(done, "fixture-normal"), true)).toBe(true);
			expect(attacks(done)).toEqual([]);
			const later = nextTurn(done, done.turn.number + 2);
			expect(attackLocked(later, find(later, "fixture-normal"), true)).toBe(false);
		});
		it(`${cites("sp-little-knight", "notes-lock-without-banish")} the only target gone before resolution: nothing is banished, but the effect was not negated, so direct attacks are still prevented`, () => {
			const duel = linked({}, { monsters: ["fixture-big"], set: ["fixture-trap-destroy"] });
			const done = resolve(play(playEffect(duel, card, BANISH, "fixture-big"), "activate fixture-trap-destroy > fixture-big"));
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(attackLocked(done, find(done, card), true)).toBe(true);
		});
		it(`${cites("sp-little-knight", "notes-lock-continuous")} no monster of the player can attack directly until the end of the turn, one that comes to the Monster Zone later included, but a monster that is unaffected by this card's effects can`, () => {
			const you = { monsters: ["fixture-mat-synchro", "fixture-filler", "fixture-unaffected-monsters"], hand: ["fixture-ss-monster"], extra: [card] };
			const chosen = ["fixture-mat-synchro", "fixture-filler"];
			expect(attacks(linked(you, {}, [], chosen, 6))).toContain("attack fixture-unaffected-monsters directly");
			expect(attacks(linked(you, {}, [], chosen, 6))).toContain(`attack ${card} directly`);
			const locked = linked(you, { graveyard: ["fixture-other-spell"] }, [], chosen, 6);
			const done = play(playEffect(locked, card, BANISH, "fixture-other-spell"), "pass", "pass");
			// A monster that comes to the Monster Zone afterwards: the player Normal Summons one.
			const summoned = resolve(play(untilOffered(done, "summon fixture-ss-monster"), "summon fixture-ss-monster"));
			expect(find(summoned, "fixture-ss-monster").zone).toBe("monster");
			expect(attacks(summoned)).toEqual(["attack fixture-unaffected-monsters directly"]);
			expect(lastingLines(summoned).join("\n")).toContain("you cannot attack directly with your monsters");
		});
		it(`${cites("sp-little-knight", "notes-banish-after-attack")} can be activated in a turn when a monster of the player already attacked directly`, () => {
			const start = board8([], { monsters: ["fixture-mat-synchro", "fixture-filler", "fixture-normal"], extra: [card] }, {}, {}, "you", "battle");
			const attacked = toPhase(play(start, "attack fixture-normal directly"), "main2");
			const done = play(attacked, summon, "place 5", "pass", "pass");
			expect(effectsOffered(done, card)).toEqual([BANISH]);
		});
		it(`${cites("sp-little-knight", "qa-controller-after-chain-24016")} Link Summoned in a Chain and then taken by a lower Chain Link, it is the player who controls the card after the Chain who activates the effect`, () => {
			const start = board8([], { hand: ["fixture-tactics"] }, { monsters: ["fixture-linker-sp-little-knight", "fixture-link"], extra: [card] });
			const summoned = play(start, "activate fixture-tactics", "activate fixture-linker-sp-little-knight", "pass", "pass", "place 6");
			const knight = idOf(summoned, card);
			// Chain Link 1 takes the only monster the rival controls: this card, which was Link Summoned in the Chain.
			const taken = summoned.asking ? play(summoned, "place 0") : summoned;
			expect(taken.cards[knight]).toMatchObject({ zone: "monster", controller: "you", owner: "rival" });
			expect(effectsOffered(untilOffered(taken, `activate ${card} > ${card}`), card)).toEqual([BANISH]);
			expect(untilOffered(taken, `activate ${card} > ${card}`).priority.holder).toBe("you");
		});
	});

	describe("the second effect: banish 2 monsters until the End Phase", () => {
		it(`${cites("sp-little-knight", "blink")} ${cites("sp-little-knight", "notes-blink-quick")} when the opponent activates a card it may target 2 face-up monsters on the field, including a monster the player controls: each pair once, and none with only the opponent's monsters`, () => {
			const duel = answering({}, { monsters: ["fixture-big", "fixture-mat-synchro"], facedown: ["fixture-normal"] });
			expect(effectsOffered(duel, card)).toEqual([BLINK]);
			const asPair = (...codes: string[]) => codes.sort().join(" + ");
			expect(pairs(duel)).toEqual([asPair(card, "fixture-big"), asPair(card, "fixture-filler"), asPair(card, "fixture-mat-synchro"), asPair("fixture-big", "fixture-filler"), asPair("fixture-filler", "fixture-mat-synchro")].sort());
		});
		it(`${cites("sp-little-knight", "notes-blink-chain-directly")} it is chained directly to the opponent's activation: not when the Chain Link on top is the player's own`, () => {
			const start = answering({ set: ["fixture-flipper"] });
			expect(effectsOffered(start, card)).toEqual([BLINK]);
			const mine = play(start, "activate fixture-flipper > fixture-big", "pass");
			expect([mine.priority.holder, mine.chain.map((link) => link.player)]).toEqual(["you", ["rival", "you"]]);
			expect(effectsOffered(mine, card)).toEqual([]);
		});
		it(`${cites("sp-little-knight", "notes-blink-no-damage-step")} it cannot be activated in the Damage Step`, () => {
			const rival = { monsters: ["fixture-quick-3000"] };
			const open = play(board8([], { extraZone: [card], monsters: ["fixture-filler"] }, rival, {}, "rival"), "activate fixture-quick-3000");
			expect(effectsOffered(open, card)).toEqual([BLINK]);
			const battle = board8([], { extraZone: [card], monsters: ["fixture-filler"] }, rival, {}, "rival", "battle");
			const damage = toStep(play(battle, "attack fixture-quick-3000 > fixture-filler"), "start");
			const rivalHolds = damage.priority.holder === "rival" ? damage : play(damage, "pass");
			const answered = play(rivalHolds, "activate fixture-quick-3000");
			expect(answered.battle?.step).toBe("start");
			expect([answered.priority.holder, effectsOffered(answered, card)]).toEqual(["you", []]);
		});
		it(`${cites("sp-little-knight", "blink")} ${cites("sp-little-knight", "notes-blink-return")} ${cites("sp-little-knight", "qa-zone-8571")} both are banished face-up and come back in the End Phase, each in the position it was banished in, to a Main Monster Zone of its controller, who chooses it; not a Special Summon`, () => {
			const start = answering({}, { monsters: [], defense: ["fixture-big"] });
			const [knight, big] = [idOf(start, card), idOf(start, "fixture-big")];
			const gone = resolve(blink(start, card, "fixture-big"));
			expect([gone.cards[knight]!.zone, gone.cards[big]!.zone]).toEqual(["banished", "banished"]);
			expect(gone.delayed).toMatchObject([{ player: "you", mandatory: true, due: { phase: "end", turn: 3 } }]);
			const yours = play(toPhase(gone, "end"), "pass");
			expect([yours.priority.holder, offered(yours)]).toEqual(["you", [`apply ${card}`]]);
			// The turn player's monsters are placed first: the rival chooses the zone of its monster, then the player the zone of this card.
			const first = play(yours, `apply ${card}`);
			expect(first.asking).toMatchObject({ player: "rival" });
			const second = play(first, "place 2");
			expect(second.asking).toMatchObject({ player: "you" });
			const back = play(second, "place 1");
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "rival", slot: 2, face: "up", position: "defense" });
			expect(back.cards[knight]).toMatchObject({ zone: "monster", controller: "you", slot: 1, face: "up", position: "attack" });
			expect(back.summons.filter((summoned) => summoned.code === "fixture-big" || summoned.code === card)).toEqual([]);
			expect(back.chain).toEqual([]);
		});
		it(`${cites("sp-little-knight", "notes-blink-both-or-nothing")} when one of the targets is no longer on the field at resolution, nothing is banished`, () => {
			const start = answering({}, { set: ["fixture-trap-destroy"] });
			const chained = blink(start, card, "fixture-big");
			const done = resolve(play(chained, "activate fixture-trap-destroy > fixture-big"));
			expect(find(done, "fixture-big").zone).toBe("graveyard");
			expect(find(done, card).zone).toBe("monster");
			expect(done.delayed).toEqual([]);
		});
		it(`${cites("sp-little-knight", "notes-blink-face-down")} a target that was turned face-down meanwhile is banished face-down, and comes back face-down in Defense Position`, () => {
			const start = answering({}, { hand: ["fixture-activator", "fixture-flip-all"] });
			const big = idOf(start, "fixture-big");
			const chained = blink(start, card, "fixture-big");
			const flipped = play(chained, "activate fixture-flip-all");
			const done = resolve(flipped);
			expect(done.cards[big]).toMatchObject({ zone: "banished", face: "down" });
			expect(find(done, card).zone).toBe("banished");
			const asked = play(toPhase(done, "end"), "pass", `apply ${card}`, "place 3");
			const back = settle(asked);
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "rival", face: "down", position: "defense", slot: 3 });
		});
		it(`${cites("sp-little-knight", "notes-blink-unaffected")} a target that is unaffected by the effect stays, and the other one is still banished`, () => {
			const start = answering({}, { monsters: ["fixture-unaffected"] });
			const done = resolve(blink(start, card, "fixture-unaffected"));
			expect(find(done, "fixture-unaffected").zone).toBe("monster");
			expect(find(done, card).zone).toBe("banished");
		});
		it(`${cites("sp-little-knight", "qa-return-together-24001")} ${cites("sp-little-knight", "qa-placed-not-sent-24001")} the monsters that can come back do so at the same time, the others are placed in the Graveyard, not sent there: the card returns and the opponent's monster, with no free Main Monster Zone, is placed`, () => {
			const log: string[] = [];
			const start = answering({}, { monsters: ["fixture-sent-watch", "fixture-filler", "fixture-filler", "fixture-filler", "fixture-filler"], hand: ["fixture-activator", "fixture-fill", "fixture-big"] }, log);
			const watch = idOf(start, "fixture-sent-watch");
			const gone = resolve(blink(start, card, "fixture-sent-watch"));
			expect([gone.cards[watch]!.zone, find(gone, card).zone]).toEqual(["banished", "banished"]);
			// The rival fills the Main Monster Zone that was freed.
			const filled = resolve(play(untilOffered(gone, "activate fixture-fill"), "activate fixture-fill"));
			expect(codes(filled, "rival", "monster").length).toBe(5);
			const back = settle(play(toPhase(filled, "end"), "pass", `apply ${card}`));
			expect(back.cards[watch]!.zone).toBe("graveyard");
			expect(find(back, card)).toMatchObject({ zone: "monster", controller: "you" });
			expect(log).not.toContain("sent-watch");
			expect(back.waiting.filter((waiting) => waiting.card.id === watch)).toEqual([]);
		});
		it(`${cites("sp-little-knight", "qa-one-zone-24029")} with one free Main Monster Zone for two monsters of the same player, the player picks the one that comes back and the other is placed in the Graveyard`, () => {
			const start = board8(
				[],
				{ extraZone: [card], monsters: ["fixture-nontuner-4", "fixture-filler", "fixture-filler", "fixture-filler"], hand: ["fixture-activator", "fixture-fill", "fixture-big"] },
				{ set: ["fixture-activator-trap"] },
			);
			// The player's Spell, the opponent's Trap in answer, and this card in answer to it.
			const chained = blink(play(start, "activate fixture-activator", "activate fixture-activator-trap"), card, "fixture-nontuner-4");
			const gone = resolve(chained);
			expect([find(gone, card).zone, find(gone, "fixture-nontuner-4").zone]).toEqual(["banished", "banished"]);
			// The player fills one of the two Main Monster Zones that were freed: one is left.
			const filled = resolve(play(untilOffered(gone, "activate fixture-fill"), "activate fixture-fill"));
			const asked = play(toPhase(filled, "end"), `apply ${card}`);
			expect(asked.asking).toMatchObject({ player: "you" });
			expect(offered(asked).sort()).toEqual([`choose ${card}`, "choose fixture-nontuner-4"].sort());
			const picked = play(asked, `choose ${card}`);
			const back = picked.asking ? play(picked, offered(picked)[0]!) : picked;
			expect(find(back, card)).toMatchObject({ zone: "monster", controller: "you" });
			expect(find(back, "fixture-nontuner-4").zone).toBe("graveyard");
		});
		it(`${cites("sp-little-knight", "qa-not-properly-summoned-11586")} a monster that was not properly Summoned also comes back in the End Phase, and it is not a Summon`, () => {
			const start = answering({}, { monsters: ["fixture-extra-plain"] });
			const plain = idOf(start, "fixture-extra-plain");
			expect(start.cards[plain]!.proper).toBe(false);
			const gone = resolve(blink(start, card, "fixture-extra-plain"));
			expect(gone.cards[plain]!.zone).toBe("banished");
			const back = settle(play(toPhase(gone, "end"), "pass", `apply ${card}`));
			expect(back.cards[plain]).toMatchObject({ zone: "monster", controller: "rival", face: "up" });
			expect(back.summons.filter((summoned) => summoned.code === "fixture-extra-plain")).toEqual([]);
		});
		it(`${cites("sp-little-knight", "qa-graveyard-summon-kept-23467")} a monster Special Summoned from the Graveyard is still one after this effect banishes it and it returns`, () => {
			const base = board8([], { extraZone: [card], monsters: ["fixture-filler"] }, { hand: ["fixture-activator"], graveyard: ["fixture-big"] }, {}, "rival");
			const big = idOf(base, "fixture-big");
			const revived = { ...specialSummon(base, "rival", big), live: [], waiting: [] };
			expect(revived.cards[big]).toMatchObject({ zone: "monster", specialSummoned: true, summonedFrom: "graveyard" });
			const gone = resolve(blink(play(revived, "activate fixture-activator"), card, "fixture-big"));
			expect(gone.cards[big]!.zone).toBe("banished");
			const back = settle(play(toPhase(gone, "end"), "pass", `apply ${card}`));
			expect(back.cards[big]).toMatchObject({ zone: "monster", specialSummoned: true, summonedFrom: "graveyard" });
		});
		it(`${cites("sp-little-knight", "qa-extra-deck-kept-16743")} a monster Special Summoned from the Extra Deck that was banished and came back is still a monster Special Summoned from the Extra Deck`, () => {
			const base = board8([], { extraZone: [card], monsters: ["fixture-filler"] }, { hand: ["fixture-activator"], extra: ["fixture-extra-plain"] }, {}, "rival");
			const summoned = { ...specialSummon(base, "rival", idOf(base, "fixture-extra-plain")), live: [], waiting: [] };
			const plain = idOf(summoned, "fixture-extra-plain");
			expect(summoned.cards[plain]).toMatchObject({ zone: "monster", specialSummoned: true, summonedFrom: "extra" });
			const gone = resolve(blink(play(summoned, "activate fixture-activator"), card, "fixture-extra-plain"));
			const back = settle(play(toPhase(gone, "end"), "pass", `apply ${card}`));
			expect(back.cards[plain]).toMatchObject({ zone: "monster", specialSummoned: true, summonedFrom: "extra" });
		});
		it(`${cites("sp-little-knight", "qa-control-no-duration-17476")} a monster whose control was taken with no limit of time that is banished comes back to the player who controlled it, who keeps it`, () => {
			const start = board8([], { extraZone: [card], monsters: ["fixture-filler"], hand: ["fixture-take-for-good", "fixture-activator"] }, { monsters: ["fixture-big"], set: ["fixture-activator-trap"] });
			const taken = resolve(play(start, "activate fixture-take-for-good > fixture-big", "pass", "pass"));
			const big = idOf(taken, "fixture-big");
			expect(taken.cards[big]).toMatchObject({ controller: "you", owner: "rival" });
			const chained = blink(play(untilOffered(taken, "activate fixture-activator"), "activate fixture-activator", "activate fixture-activator-trap"), card, "fixture-big");
			const gone = resolve(chained);
			expect(gone.cards[big]!.zone).toBe("banished");
			const back = settle(play(toPhase(gone, "end"), `apply ${card}`));
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "you", owner: "rival" });
		});
		it(`${cites("sp-little-knight", "qa-control-duration-17476")} a monster whose control was taken until the End Phase that is banished: that control ends at once, and it goes back to its previous controller as soon as it comes back`, () => {
			const start = board8([], { extraZone: [card], monsters: ["fixture-filler"], hand: ["fixture-mind", "fixture-activator"] }, { monsters: ["fixture-big"], set: ["fixture-activator-trap"] });
			const taken = resolve(play(start, "activate fixture-mind > fixture-big", "pass", "pass", "place 1"));
			const big = idOf(taken, "fixture-big");
			expect(taken.cards[big]).toMatchObject({ controller: "you", owner: "rival" });
			const chained = blink(play(untilOffered(taken, "activate fixture-activator"), "activate fixture-activator", "activate fixture-activator-trap"), card, "fixture-big");
			const gone = resolve(chained);
			expect(gone.cards[big]!.zone).toBe("banished");
			const asked = play(toPhase(gone, "end"), `apply ${card}`);
			// It comes back to the player who controlled it when it was banished, who chooses the zone, then is given back at once.
			expect(asked.asking).toMatchObject({ player: "you" });
			const back = settle(asked);
			expect(back.cards[big]).toMatchObject({ zone: "monster", controller: "rival", owner: "rival" });
		});
		it(`${cites("sp-little-knight", "qa-new-card-24032")} a monster Special Summoned this turn that is banished and comes back is a new card: it does not "stay face-up" until the End Phase, so its End Phase effect cannot be used`, () => {
			const you = { monsters: [card, "fixture-ace-dark"], extra: ["sky-striker-ace-shizuku"], hand: ["fixture-activator"], deck: ["fixture-ss-spell"] };
			const rival = { set: ["fixture-activator-trap"] };
			const summoned = untilOffered(play(board8([], you, rival), "special-summon sky-striker-ace-shizuku", "place 5", "pass", "pass"), "activate fixture-activator");
			expect(find(summoned, "sky-striker-ace-shizuku")).toMatchObject({ zone: "monster", specialSummoned: true });
			// Control: nothing banished, the End Phase effect is on offer.
			expect(offered(toPhase(summoned, "end"))).toContain("activate sky-striker-ace-shizuku");
			const chained = blink(play(summoned, "activate fixture-activator", "activate fixture-activator-trap"), card, "sky-striker-ace-shizuku");
			const gone = resolve(chained);
			expect(find(gone, "sky-striker-ace-shizuku").zone).toBe("banished");
			const end = toPhase(gone, "end");
			const back = settle(play(end, `apply ${card}`));
			expect(find(back, "sky-striker-ace-shizuku")).toMatchObject({ zone: "monster", summonedTurn: 0 });
			expect(offered(back)).not.toContain("activate sky-striker-ace-shizuku");
		});
		it(`${cites("sp-little-knight", "qa-end-phase-owed-11533")} the process that gives the monsters back is owed by the controller of this card in the End Phase, after the other player has passed: it must be done`, () => {
			const gone = resolve(blink(answering(), card, "fixture-big"));
			const end = toPhase(gone, "end");
			expect([end.turn.player, offered(end)]).toEqual(["rival", ["pass"]]);
			const yours = play(end, "pass");
			expect([yours.priority.holder, offered(yours)]).toEqual(["you", [`apply ${card}`]]);
		});
	});

	describe("each effect once per turn", () => {
		it(`${cites("sp-little-knight", "once")} the second effect cannot be used again by another copy in the same turn`, () => {
			const start = board8([], { extraZone: [card], monsters: [card, "fixture-filler"] }, { hand: ["fixture-activator", "fixture-activator"], monsters: ["fixture-big"] }, {}, "rival");
			const first = resolve(blink(play(start, "activate fixture-activator"), card, "fixture-big"));
			expect(effectsOffered(first, card)).toEqual([]);
			const second = untilOffered(first, "pass");
			const again = play(second, "activate fixture-activator");
			expect(effectsOffered(again, card)).toEqual([]);
		});
		it(`${cites("sp-little-knight", "once")} the first effect cannot be used again by another copy Link Summoned in the same turn`, () => {
			const you = { monsters: ["fixture-mat-synchro", "fixture-filler", "fixture-mat-fusion", "fixture-filler"], extra: [card, card] };
			const first = linked(you, { graveyard: ["fixture-other-spell"] }, [], ["fixture-mat-synchro", "fixture-filler"]);
			expect(effectsOffered(first, card)).toEqual([BANISH]);
			const used = play(playEffect(first, card, BANISH, "fixture-other-spell"), "pass", "pass");
			// The first copy leaves the field (a Link Summon from the Extra Deck needs the Extra Monster Zone), and the second one is Link Summoned.
			const gone = moveCard(used, Object.values(used.cards).find((entry) => entry.code === card && entry.zone === "monster")!.id, { zone: "graveyard" });
			const second = play(untilOffered(gone, summon), summon, "place 5", "pass", "pass");
			expect(Object.values(second.cards).filter((entry) => entry.code === card && entry.zone === "monster")).toHaveLength(1);
			expect(effectsOffered(second, card)).toEqual([]);
		});
	});
});
