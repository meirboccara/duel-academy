import { describe, expect, it } from "vitest";
import { cites, type Duel, isNegated, printedFacts } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board } from "./sky-striker-ace-fixtures";
import { activations, find, resolve } from "./sky-striker-fixtures";

const card = "sky-striker-ace-roze";
const use = `activate ${card}`;
const kagari = "sky-striker-ace-kagari";
const linkKagari = `special-summon ${kagari}`;

/** You Link Summon "Sky Striker Ace - Kagari" (its trigger has nothing to add), with Roze in hand. */
const summonedAce = (you: { hand?: string[]; monsters?: string[]; extra?: string[] } = {}) => resolve(play(board({ hand: [card], monsters: ["fixture-ace-dark"], extra: [kagari], ...you }), linkKagari, "place 5"));

describe("Sky Striker Ace - Roze, written as effect records", () => {
	it(`${cites("sky-striker-ace-roze", "facts")} is a LIGHT Warrior Level 4 Effect Monster with 1500 ATK and 1500 DEF, a "Sky Striker Ace" and a "Sky Striker" card that mentions itself`, () => {
		const duel = board({ hand: [card] });
		expect(duel.defs[card]!.kind).toBe("monster");
		expect(printedFacts(duel, find(duel, card).id)).toEqual({ name: "Sky Striker Ace - Roze", attribute: "LIGHT", monsterType: "Warrior", level: 4, atk: 1500, def: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: ["Sky Striker Ace - Roze"] });
	});

	describe("its effect in the hand", () => {
		it(`${cites("sky-striker-ace-roze", "hand-summon")} ${cites("sky-striker-ace-roze", "notes-hand")} when a "Sky Striker Ace" monster is Special Summoned, it Special Summons itself from the hand`, () => {
			const summoned = summonedAce();
			expect(activations(summoned, card)).toEqual([use]);
			const done = play(resolve(play(summoned, use)), "place 0");
			expect(find(done, card)).toMatchObject({ zone: "monster", face: "up", controller: "you", specialSummoned: true });
		});
		it(`${cites("sky-striker-ace-roze", "hand-summon")} also when a "Sky Striker Ace" monster is Normal Summoned, but not when it is only Flip Summoned or when it is not an Ace`, () => {
			const normal = resolve(play(board({ hand: [card, "fixture-ace-warrior"] }), "summon fixture-ace-warrior"));
			expect(activations(normal, card)).toEqual([use]);
			const flipped = resolve(play(board({ hand: [card], facedown: ["fixture-ace-warrior"] }), "flip-summon fixture-ace-warrior"));
			expect(activations(flipped, card)).toEqual([]);
			const filler = resolve(play(board({ hand: [card, "fixture-filler"] }), "summon fixture-filler"));
			expect(activations(filler, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-roze", "hand-summon")} ${cites("sky-striker-ace-roze", "notes-hand")} "except Sky Striker Ace - Roze": the Summon of a "Sky Striker Ace - Roze" does not trigger it`, () => {
			const summoned = resolve(play(board({ hand: [card, card] }), `summon ${card}`));
			expect(find(summoned, card).zone).toBeDefined();
			expect(activations(summoned, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-roze", "hand-summon")} the text says nothing about who Summons: an "Sky Striker Ace" monster of the opponent triggers it too`, () => {
			const rival = board({ hand: [card] }, { monsters: ["fixture-ace-dark"], extra: [kagari] }, {}, "rival");
			const summoned = resolve(play(rival, linkKagari, "place 5"));
			expect(find(summoned, kagari).controller).toBe("rival");
			expect(offered(summoned)).toContain(use);
		});
		it(`${cites("sky-striker-ace-roze", "hand-summon")} ${cites("sky-striker-ace-roze", "notes-no-damage-step")} not when the Summon is made during the Damage Step`, () => {
			const start = board({ hand: [card], set: ["fixture-summon-counter"], extra: [kagari] }, { monsters: ["fixture-big"] }, {}, "rival", "battle");
			const damage = toStep(play(start, "attack fixture-big directly"), "start");
			const mine = damage.priority.holder === "you" ? damage : play(damage, "pass");
			expect(mine.battle?.step).toBe("start");
			let summoned = play(mine, "activate fixture-summon-counter");
			while (summoned.chain.length > 0) summoned = play(summoned, "pass");
			expect(find(summoned, kagari)).toMatchObject({ zone: "monster", face: "up" });
			expect(summoned.battle?.step).toBe("start");
			expect(activations(summoned, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-roze", "once")} used once per turn: a second copy cannot be Special Summoned the same turn, not even by a later Summon of a "Sky Striker Ace" monster`, () => {
			const first = play(resolve(play(resolve(play(board({ hand: [card, card, "fixture-ace-warrior"], monsters: ["fixture-ace-dark"], extra: [kagari] }), "summon fixture-ace-warrior")), use)), "place 2");
			expect(codes(first, "you", "monster").filter((code) => code === card)).toHaveLength(1);
			expect(activations(first, card)).toEqual([]);
			// A new Summon of an Ace after the first use: the other copy in the hand would trigger on it if the limit did not hold.
			const later = resolve(play(resolve(first), linkKagari, "choose fixture-ace-dark", "place 5"));
			expect(find(later, kagari).zone).toBe("monster");
			expect(activations(later, card)).toEqual([]);
		});
		it(`${cites("sky-striker-ace-roze", "hand-summon")} cannot be activated when there is no free Monster Zone`, () => {
			const full = board({ hand: [card, "fixture-ace-warrior"], monsters: ["fixture-filler", "fixture-filler", "fixture-filler", "fixture-filler"] });
			const summoned = resolve(play(full, "summon fixture-ace-warrior"));
			expect(activations(summoned, card)).toEqual([]);
		});
	});

	describe("its effect in the Graveyard", () => {
		it(`${cites("sky-striker-ace-roze", "grave-summon")} ${cites("sky-striker-ace-roze", "hand-summon")} declares a Special Summon, and from the Graveyard one that comes from there; the one from the hand does not`, () => {
			const hand = play(summonedAce(), use);
			expect(hand.chain[0]!.categories).toEqual(["special-summon"]);
			const grave = play(resolve(play(board({ graveyard: [card], hand: ["fixture-destroy"] }, { extraZone: ["fixture-link"] }), "activate fixture-destroy > fixture-link")), use);
			expect(grave.chain[0]!.categories).toEqual(["special-summon", "summon-from-graveyard"]);
		});
		/** Your turn: the rival's monster in an Extra Monster Zone (and another in a Main Monster Zone) goes; Roze waits in your Graveyard. */
		const destroyedIn = (remover: string, rival: { extraZone?: string[]; monsters?: string[] } = { extraZone: ["fixture-link"], monsters: ["fixture-big"] }, target = "fixture-link", you: { monsters?: string[]; extraZone?: string[] } = {}) =>
			resolve(play(board({ graveyard: [card], hand: [remover], ...you }, rival), `activate ${remover} > ${target}`));
		it(`${cites("sky-striker-ace-roze", "grave-summon")} ${cites("sky-striker-ace-roze", "notes-grave")} when an opponent's monster in an Extra Monster Zone leaves the field by the player's card effect, it can Special Summon itself`, () => {
			for (const remover of ["fixture-destroy", "fixture-banish", "fixture-bounce", "fixture-tribute"]) expect(offered(destroyedIn(remover)), remover).toContain(use);
		});
		it(`${cites("sky-striker-ace-roze", "grave-summon")} not for a monster of the opponent in a Main Monster Zone, nor for the player's own monster, nor by the opponent's effect, nor when it was only used as material or moved to a Spell & Trap Zone`, () => {
			expect(offered(destroyedIn("fixture-destroy", { monsters: ["fixture-link"] })), "main zone").not.toContain(use);
			expect(offered(destroyedIn("fixture-destroy", {}, "fixture-link", { extraZone: ["fixture-link"] })), "own monster").not.toContain(use);
			expect(offered(destroyedIn("fixture-absorb")), "material").not.toContain(use);
			expect(offered(destroyedIn("fixture-to-spell-zone")), "spell zone").not.toContain(use);
			const theirs = resolve(play(board({ graveyard: [card] }, { hand: ["fixture-destroy"], extraZone: ["fixture-link"] }, {}, "rival"), "activate fixture-destroy > fixture-link"));
			expect(offered(theirs), "opponent's effect").not.toContain(use);
		});
		it(`${cites("sky-striker-ace-roze", "grave-summon")} ${cites("sky-striker-ace-roze", "notes-damage-step")} when it is destroyed by battle, it is activated at the end of the Damage Step; a monster of a Main Monster Zone does not count`, () => {
			const fight = (rival: { extraZone?: string[]; monsters?: string[] }) => {
				const start = board({ graveyard: [card], monsters: ["fixture-ace-strong"] }, rival, {}, "you", "battle");
				const declared = play(start, "attack fixture-ace-strong > fixture-link");
				return [toStep(declared, "after"), toStep(declared, "end")] as const;
			};
			const [after, end] = fight({ extraZone: ["fixture-link"] });
			expect(find(after, "fixture-link").zone).toBe("monster");
			expect(offered(after)).not.toContain(use);
			expect(end.battle?.step).toBe("end");
			expect(find(end, "fixture-link").zone).toBe("graveyard");
			expect(offered(end)).toContain(use);
			const [, main] = fight({ monsters: ["fixture-link"] });
			expect(find(main, "fixture-link").zone).toBe("graveyard");
			expect(offered(main)).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-roze", "notes-already-in-grave")} must already be in the Graveyard: destroyed at the same time as the monster, it cannot be activated`, () => {
			const start = board({ monsters: [card], hand: ["fixture-sweep"] }, { extraZone: ["fixture-link"] });
			const done = resolve(play(start, "activate fixture-sweep"));
			expect(codes(done, "you", "graveyard")).toContain(card);
			expect(offered(done)).not.toContain(use);
		});
		it(`${cites("sky-striker-ace-roze", "grave-summon")} cannot be activated when there is no free Monster Zone`, () => {
			const full = destroyedIn("fixture-destroy", { extraZone: ["fixture-link"] }, "fixture-link", { monsters: ["fixture-filler", "fixture-filler", "fixture-filler", "fixture-filler", "fixture-filler"] });
			expect(find(full, "fixture-link").zone).toBe("graveyard");
			expect(offered(full)).not.toContain(use);
		});
		describe("what it does", () => {
			const summoned = (rival: { extraZone?: string[]; monsters?: string[]; facedown?: string[] }) => resolve(play(resolve(play(board({ graveyard: [card], hand: ["fixture-destroy"] }, rival), "activate fixture-destroy > fixture-link")), use));
			it(`${cites("sky-striker-ace-roze", "negate")} ${cites("sky-striker-ace-roze", "notes-sequential")} Special Summons itself first, then the player may negate the effects of 1 face-up monster the opponent controls until the end of this turn, chosen then (not a target)`, () => {
				const asked = summoned({ extraZone: ["fixture-link"], monsters: ["fixture-big", "fixture-filler"] });
				expect(asked.asking).toBeTruthy();
				const placed = play(asked, offered(asked).find((label) => label.startsWith("place"))!);
				// Roze is on the field before the player decides whether to negate.
				expect(find(placed, card)).toMatchObject({ zone: "monster", face: "up" });
				expect(offered(placed)).toContain(`choose ${card}`);
				const picking = play(placed, `choose ${card}`);
				expect(offered(picking).sort()).toEqual(["choose fixture-big", "choose fixture-filler"]);
				const done = play(picking, "choose fixture-big");
				expect(isNegated(done, find(done, "fixture-big").id)).toBe(true);
				expect(isNegated(done, find(done, "fixture-filler").id)).toBe(false);
			});
			it(`${cites("sky-striker-ace-roze", "negate")} the negation is optional, and only a face-up monster of the opponent can be chosen`, () => {
				const asked = summoned({ extraZone: ["fixture-link"], monsters: ["fixture-big"], facedown: ["fixture-filler"] });
				const placed = play(asked, offered(asked).find((label) => label.startsWith("place"))!);
				const declined = play(placed, "pass");
				expect(find(declined, card).zone).toBe("monster");
				expect(isNegated(declined, find(declined, "fixture-big").id)).toBe(false);
				// With one face-up monster to choose, it is the one negated.
				const accepted = play(placed, `choose ${card}`);
				expect(isNegated(accepted, find(accepted, "fixture-big").id)).toBe(true);
				expect(isNegated(accepted, find(accepted, "fixture-filler").id)).toBe(false);
			});
			it(`${cites("sky-striker-ace-roze", "negate")} the negation lasts until the end of the turn, the End Phase included, and no longer`, () => {
				const asked = summoned({ extraZone: ["fixture-link"], monsters: ["fixture-big"] });
				const placed = play(asked, offered(asked).find((label) => label.startsWith("place"))!);
				const done = play(placed, `choose ${card}`);
				const big = find(done, "fixture-big").id;
				expect(isNegated(done, big)).toBe(true);
				let next: Duel = done;
				for (let guard = 0; guard < 80 && !(next.turn.phase === "end" && next.turn.number === done.turn.number); guard++) next = play(next, "pass");
				expect([next.turn.phase, isNegated(next, big)]).toEqual(["end", true]);
				for (let guard = 0; guard < 80 && next.turn.number === done.turn.number; guard++) next = play(next, "pass");
				expect(next.turn.number).toBe(done.turn.number + 1);
				expect(isNegated(next, big)).toBe(false);
			});
			it(`${cites("sky-striker-ace-roze", "negate")} nothing is asked when the opponent controls no face-up monster`, () => {
				const asked = summoned({ extraZone: ["fixture-link"] });
				const done = play(asked, offered(asked).find((label) => label.startsWith("place"))!);
				expect(find(done, card).zone).toBe("monster");
				expect(done.asking).toBeFalsy();
			});
		});
		it(`${cites("sky-striker-ace-roze", "once")} each effect is used once per turn: two copies in the Graveyard, once one is used the other cannot be activated`, () => {
			const start = board({ graveyard: [card, card], hand: ["fixture-destroy"] }, { extraZone: ["fixture-link"] });
			const done = resolve(play(start, "activate fixture-destroy > fixture-link"));
			expect(offered(done)).toContain(use);
			// The other copy triggered by the same event is not offered once this one is activated, nor after it resolved.
			const used = play(done, use);
			expect(offered(used)).not.toContain(use);
			const asked = resolve(used);
			const back = play(asked, offered(asked).find((label) => label.startsWith("place"))!);
			expect(codes(back, "you", "monster")).toEqual([card]);
			expect(offered(back)).not.toContain(use);
		});
	});
});
