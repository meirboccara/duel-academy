import { describe, expect, it } from "vitest";
import { canSpecialSummon, cites, legalActions, moveCard, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board } from "./sky-striker-ace-fixtures";
import { activations, find, resolve, threeSpells } from "./sky-striker-fixtures";

const card = "sky-striker-ace-raye";
const use = `activate ${card}`;
const ace = "fixture-ace-dark";

/** The rival's turn: you control the Ace and have Raye in the Graveyard; the rival holds the removal card in hand. */
const removed = (remover: string, you: { monsters?: string[]; facedown?: string[] } = { monsters: [ace] }, target = ace) =>
	resolve(play(board({ graveyard: [card], ...you }, { hand: [remover] }, {}, "rival"), `activate ${remover} > ${target}`));

describe("Sky Striker Ace - Raye, written as effect records", () => {
	it(`${cites("sky-striker-ace-raye", "facts")} is a DARK Warrior Level 4 Effect Monster with 1500 ATK and 1500 DEF, a "Sky Striker Ace" and a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Ace - Raye", attribute: "DARK", monsterType: "Warrior", level: 4, atk: 1500, def: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace - Raye"] });
	});

	describe("its Quick Effect", () => {
		it(`${cites("sky-striker-ace-raye", "summon")} ${cites("sky-striker-ace-raye", "notes-quick")} ${cites("sky-striker-ace-raye", "notes-not-link-summon")} Tributes itself and Special Summons a "Sky Striker Ace" monster of the Extra Deck to an Extra Monster Zone, which is not a Link Summon`, () => {
			const start = board({ monsters: [card], extra: [ace, "fixture-link-other"] });
			expect(activations(start, card)).toEqual([use]);
			const asked = resolve(play(start, use));
			// The cost is paid: Raye was Tributed. The monster goes to an Extra Monster Zone, which the player chooses; "fixture-link-other" is no Ace.
			expect(codes(asked, "you", "graveyard")).toEqual([card]);
			expect(offered(asked)).toEqual(["place 5", "place 6"]);
			const done = play(asked, "place 6");
			expect(find(done, ace)).toMatchObject({ zone: "monster", face: "up", slot: 6, controller: "you", summonedBy: null, specialSummoned: true });
			expect(find(done, "fixture-link-other").zone).toBe("extra");
		});
		it(`${cites("sky-striker-ace-raye", "summon")} the Ace is chosen among those of the Extra Deck`, () => {
			const asked = resolve(play(board({ monsters: [card], extra: [ace, "fixture-ace-light"] }), use));
			expect(offered(asked).sort()).toEqual(["choose fixture-ace-dark", "choose fixture-ace-light"]);
		});
		it(`${cites("sky-striker-ace-raye", "notes-quick")} can be activated in the opponent's turn`, () => {
			const start = board({ monsters: [card], extra: [ace] }, {}, {}, "rival");
			expect(activations(play(start, "pass"), card)).toEqual([use]);
		});
		it(`${cites("sky-striker-ace-raye", "notes-needs-emz")} cannot be activated when no Extra Monster Zone can take the monster (a player with a monster in one cannot use the other)`, () => {
			expect(activations(board({ monsters: [card], extra: [ace], extraZone: ["fixture-link"] }), card)).toEqual([]);
			expect(activations(board({ monsters: [card], extra: [ace] }, { extraZone: ["fixture-link"] }), card)).toEqual([use]);
			expect(activations(board({ monsters: [card], extra: [] }), card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-raye", "notes-not-link-summon")} a monster that must be Link Summoned is no candidate, nor a monster that cannot be Special Summoned again this turn`, () => {
			expect(activations(board({ monsters: [card], extra: ["fixture-ace-own"] }), card)).toEqual([]);
			const start = board({ monsters: [card], extra: ["sky-striker-ace-kagari", "sky-striker-ace-kagari"] });
			const [first] = start.piles.you.extra;
			// One "Sky Striker Ace - Kagari" was Special Summoned this turn and has left the field: the other cannot be Special Summoned.
			const once = moveCard(specialSummon(start, "you", first!, { slot: 5 }), first!, { zone: "graveyard" });
			expect(canSpecialSummon(once, "you", once.piles.you.extra[0]!)).toBe(false);
			expect(activations(once, card)).toEqual([]);
			expect(activations(start, card)).toEqual([use]);
		});
		it(`${cites("sky-striker-ace-raye", "summon")} only an Extra Monster Zone is used: not a Main Monster Zone that an arrow of the opponent's Link Monster points at`, () => {
			const start = board({ monsters: [card], extra: [ace] }, { extraZone: ["fixture-link-top"] });
			// The opponent's Link Monster has the other Extra Monster Zone (slot 6) and an arrow at the player's side: Raye's Summon still has the one zone (slot 5), so nothing is asked.
			const done = resolve(play(start, use));
			expect(done.asking).toBeFalsy();
			expect(find(done, ace)).toMatchObject({ zone: "monster", slot: 5, controller: "you" });
		});
		it(`${cites("sky-striker-ace-raye", "qa-gozen-10427")} with "Gozen Match" (one Attribute per field) the Tribute that pays for it can lift the lock: it needs an Ace that fits before the Tribute, and any Ace may be chosen once it is paid`, () => {
			const lock = { faceupSpells: ["fixture-one-attribute"] };
			// Raye is DARK and the only monster: a FIRE Ace alone cannot be Special Summoned yet, so the effect is not activated.
			expect(activations(board({ monsters: [card], extra: ["fixture-ace-fire"], ...lock }), card)).toEqual([]);
			const start = board({ monsters: [card], extra: ["fixture-ace-fire", ace], ...lock });
			expect(activations(start, card)).toEqual([use]);
			// With a DARK Ace in the Extra Deck it is (Konami's Q&A: "Prototype Sky Striker Ace - Amatsu"); once Raye is Tributed, a FIRE Ace may be chosen.
			const asked = resolve(play(start, use));
			expect(offered(asked).sort()).toEqual(["choose fixture-ace-dark", "choose fixture-ace-fire"]);
			expect(find(play(asked, "choose fixture-ace-fire", "place 5"), "fixture-ace-fire")).toMatchObject({ zone: "monster", slot: 5 });
		});
		it(`${cites("sky-striker-ace-raye", "once")} the Quick Effect is used once per turn by name: with the Extra Monster Zone free again, another copy cannot use it`, () => {
			const start = board({ monsters: [card, card], extra: [ace, "fixture-ace-light"] }, { set: ["fixture-to-spell-zone"] });
			const placed = play(resolve(play(start, use)), "choose fixture-ace-dark", "place 5");
			// The Ace is moved to a Spell & Trap Zone by the opponent (not "leaves the field"): the Extra Monster Zone is free, Raye is not in the Graveyard to trigger.
			const freed = resolve(play(placed, "pass", `activate fixture-to-spell-zone > ${ace}`));
			expect(find(freed, ace).zone).toBe("spell");
			expect(activations(freed, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-raye", "summon")} ${cites("sky-striker-ace-raye", "notes-no-damage-step")} cannot be activated in the Damage Step, but can in the Battle Step before it`, () => {
			const rival = board({ monsters: [card], extra: [ace] }, { monsters: ["fixture-big"] }, {}, "rival", "battle");
			const declared = play(rival, `attack fixture-big > ${card}`);
			expect(activations(play(declared, "pass"), card)).toEqual([use]);
			const damage = toStep(declared, "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			expect(activations(mine, card)).toEqual([]);
		});
	});

	describe("its Graveyard effect", () => {
		it(`${cites("sky-striker-ace-raye", "revive")} ${cites("sky-striker-ace-raye", "notes-grave-trigger")} when a face-up "Sky Striker Ace" Link Monster the player controls leaves the field by an opponent's card effect, it can Special Summon itself`, () => {
			for (const remover of ["fixture-destroy", "fixture-banish", "fixture-bounce", "fixture-tribute"]) {
				const done = removed(remover);
				expect(offered(done), remover).toContain(use);
				const back = play(resolve(play(done, use)), "place 0");
				expect(find(back, card)).toMatchObject({ zone: "monster", face: "up", controller: "you" });
			}
		});
		it(`${cites("sky-striker-ace-raye", "qa-link-material-23445")} ${cites("sky-striker-ace-raye", "qa-leave-23614")} a monster used as the material of an effect's Link Summon, moved to a Spell & Trap Zone or attached as an Xyz Material did not leave "by an opponent's effect"`, () => {
			for (const remover of ["fixture-absorb", "fixture-to-spell-zone"]) expect(offered(removed(remover)), remover).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "revive")} not when the player's own card effect removes the monster`, () => {
			const start = board({ graveyard: [card], monsters: [ace], hand: ["fixture-destroy"] });
			expect(offered(resolve(play(start, `activate fixture-destroy > ${ace}`)))).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "revive")} only a "Sky Striker Ace" Link Monster counts: not another Link Monster, not an Ace that is no Link Monster`, () => {
			for (const other of ["fixture-link-other", "fixture-ace-warrior"]) expect(offered(removed("fixture-destroy", { monsters: [other] }, other)), other).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "revive")} only a monster the player controls: the opponent's Ace leaving does not count`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-destroy"] }, { monsters: [ace] });
			expect(offered(resolve(play(start, `activate fixture-destroy > ${ace}`)))).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "revive")} ${cites("sky-striker-ace-raye", "notes-damage-step")} when such a monster is destroyed by battle, it is activated at the end of the Damage Step, which is part of the Damage Step`, () => {
			const start = board({ graveyard: [card], monsters: [ace] }, { monsters: ["fixture-big"] }, {}, "rival", "battle");
			const declared = play(start, `attack fixture-big > ${ace}`);
			const after = toStep(declared, "after");
			expect(find(after, ace).zone).toBe("monster");
			expect(offered(after)).not.toContain(use);
			const end = toStep(declared, "end");
			expect(end.battle?.step).toBe("end");
			expect(find(end, ace).zone).toBe("graveyard");
			expect(offered(end)).toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "notes-already-in-grave")} must already be in the Graveyard: destroyed with the monster, it cannot be activated`, () => {
			const start = board({ monsters: [card, ace] }, { hand: ["fixture-sweep"] }, {}, "rival");
			const done = resolve(play(start, "activate fixture-sweep"));
			expect(codes(done, "you", "graveyard").sort()).toEqual([ace, card]);
			expect(offered(done)).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "qa-hayate-13241")} sent to the Graveyard by "Sky Striker Ace - Hayate" after damage calculation, it can be activated when Hayate is destroyed by that battle, at the end of the Damage Step`, () => {
			const start = board({ extraZone: ["sky-striker-ace-hayate"], deck: [card] }, { monsters: ["fixture-big"] }, {}, "you", "battle");
			const after = toStep(play(start, "attack sky-striker-ace-hayate > fixture-big"), "after");
			let sent = play(after, "activate sky-striker-ace-hayate");
			while (sent.chain.length > 0) sent = play(sent, "pass");
			expect(sent.battle?.step).toBe("after");
			expect(find(sent, card).zone).toBe("graveyard");
			expect(find(sent, "sky-striker-ace-hayate").zone).toBe("monster");
			const end = toStep(sent, "end");
			expect(find(end, "sky-striker-ace-hayate").zone).toBe("graveyard");
			expect(offered(end)).toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "qa-controller-8161")} when the monster was taken by "Sky Striker Mecha - Widow Anchor" and destroyed by battle, the player who controlled it (not its owner) may use their own Raye`, () => {
			const start = board({ hand: ["sky-striker-mecha-widow-anchor"], graveyard: [card, ...threeSpells] }, { extraZone: ["sky-striker-ace-kagari"], monsters: ["fixture-big"], graveyard: [card] }, {}, "you", "battle");
			const asked = resolve(play(start, "activate sky-striker-mecha-widow-anchor > sky-striker-ace-kagari"));
			const taken = resolve(play(asked, "choose sky-striker-mecha-widow-anchor", "place 0"));
			expect(find(taken, "sky-striker-ace-kagari")).toMatchObject({ controller: "you", zone: "monster" });
			const end = toStep(play(taken, "attack sky-striker-ace-kagari > fixture-big"), "end");
			// Destroyed in the monster zone of the player who took it, and sent to its owner's Graveyard.
			expect(find(end, "sky-striker-ace-kagari")).toMatchObject({ zone: "graveyard", owner: "rival" });
			// Only that player is offered their Raye: the Raye of the owner stays where it is.
			expect(legalActions(end).filter((action) => action.type === "activate").map((action) => end.cards[action.card]!.owner)).toEqual(["you"]);
			expect(offered(end)).toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "qa-amatsu-24166")} the player's Link Monster destroyed by an effect of the opponent that the player's own card made it ("that effect becomes ..."): it still left the field by the opponent's effect, and Raye can be activated`, () => {
			const start = board({ graveyard: [card], monsters: [ace, "fixture-redirect"] }, { hand: ["fixture-poke"] }, {}, "rival");
			const answered = play(play(start, "activate fixture-poke"), "activate fixture-redirect");
			// The effect now says "destroy 1 monster your opponent controls": the opponent, who activated it, chooses.
			const choosing = resolve(answered);
			expect(offered(choosing).sort()).toEqual([`choose ${ace}`, "choose fixture-redirect"]);
			const done = resolve(play(choosing, `choose ${ace}`));
			expect(find(done, ace).zone).toBe("graveyard");
			expect(offered(done)).toContain(use);
		});
		it(`${cites("sky-striker-ace-raye", "revive")} ${cites("sky-striker-ace-raye", "summon")} the Special Summons are declared on the chain link: the first from the Extra Deck, the second from the Graveyard`, () => {
			expect(play(board({ monsters: [card], extra: [ace] }), use).chain[0]!.categories).toEqual(["special-summon"]);
			expect(play(removed("fixture-destroy"), use).chain[0]!.categories).toEqual(["special-summon", "summon-from-graveyard"]);
		});
		it(`${cites("sky-striker-ace-raye", "once")} each effect is used once per turn, the two separately: after the Quick Effect, the Graveyard effect is still available, and then neither again`, () => {
			const start = board({ monsters: [card, card], extra: [ace, "fixture-ace-light"] }, { set: ["fixture-destroy"] });
			const first = resolve(play(start, use));
			const placed = play(first, "choose fixture-ace-dark", "place 5");
			// Only the other copy's Quick Effect is left, and it has been used (by name): not offered.
			expect(activations(placed, card)).toEqual([]);
			const answered = resolve(play(placed, "pass", `activate fixture-destroy > ${ace}`));
			expect(codes(answered, "you", "graveyard")).toContain(ace);
			// The Raye Tributed earlier is in the Graveyard: its Graveyard effect is a different effect, so it can still be used.
			expect(offered(answered)).toContain(use);
			const back = play(resolve(play(answered, use)), "place 2");
			expect(find(back, card)).toMatchObject({ zone: "monster", slot: 2 });
			expect(codes(back, "you", "graveyard")).toEqual([ace]);
		});
		it(`${cites("sky-striker-ace-raye", "once")} two copies in the Graveyard: once one has been used, the other cannot be activated this turn`, () => {
			const start = board({ graveyard: [card, card], monsters: [ace] }, { hand: ["fixture-destroy"] }, {}, "rival");
			const done = resolve(play(start, `activate fixture-destroy > ${ace}`));
			expect(offered(done)).toContain(use);
			const used = play(done, use);
			// The other copy triggered by the same event is not offered once this one is activated, nor after it resolved.
			expect(offered(used)).not.toContain(use);
			const back = play(resolve(used), "place 0");
			expect(find(back, card)).toMatchObject({ zone: "monster", controller: "you" });
			expect(offered(back)).not.toContain(use);
		});
	});
});
