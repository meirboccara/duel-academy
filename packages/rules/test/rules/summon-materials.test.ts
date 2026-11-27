import { describe, expect, it } from "vitest";
import { ask, canSummonByEffect, type CardDef, cites, type Duel, negateCardEffects, other, summonByEffect, takeControl } from "../../src";
import { codes, offered, play, position } from "./fixtures";

/**
 * S3 and S4 of docs/rules-core/sky-striker-gaps.md.
 * - S3: "this card cannot be used as Link Material" (`CardDef.cannotBeMaterial`): not an effect, so it holds while the card's effects
 *   are negated (Konami's Japanese notes on Sky Striker Ace = Zero, OCG only).
 * - S4: the materials of a Summon, as they were on the field (`summoned.materials`, `CardInstance.summonMaterials`), for "If this card
 *   is Link Summoned using a Fusion, Synchro, Xyz, or Link Monster as material" (S:P Little Knight); and who activates that effect
 *   when the monster changes control in the chain it was Summoned in (Konami's Japanese Q&A fid 24016, OCG only).
 * Made-up cards with the same wording.
 */
const EXTRA_FRAMES = ["fusion", "synchro", "xyz", "link"];

function cards(log: string[]): Record<string, CardDef> {
	const knight = (duel: Duel, player: "you" | "rival") => duel.piles[player].extra.find((id) => duel.cards[id]!.code === "fixture-knight");
	return {
		"fixture-plain": { code: "fixture-plain", kind: "monster", facts: { level: 4, atk: 1000, def: 1000, effect: true } },
		// "... this card cannot be used as Link Material."
		"fixture-zero": { code: "fixture-zero", kind: "monster", facts: { frame: "link", link: 2, arrows: ["bottom-left", "bottom-right"], atk: 2000 }, cannotBeMaterial: ["link"] },
		// Link 1: "1 monster".
		"fixture-link1": { code: "fixture-link1", kind: "monster", facts: { frame: "link", link: 1, arrows: ["bottom"], atk: 1000 }, procedure: { kind: "link", materials: { min: 1 } } },
		// Link 2: "2 monsters". "If this card is Link Summoned using a Fusion, Synchro, Xyz, or Link Monster as material: You can ...".
		"fixture-knight": {
			code: "fixture-knight",
			kind: "monster",
			facts: { frame: "link", link: 2, arrows: ["left", "right"], atk: 1600 },
			procedure: { kind: "link", materials: { min: 2 } },
			effects: [
				{
					type: "trigger",
					timing: "if",
					event: (duel, event, { card }) => event.type === "summoned" && event.card.id === card.id && event.kind === "link" && (event.materials ?? []).some((material) => EXTRA_FRAMES.includes(duel.defs[material.code]?.facts?.frame ?? "")),
					operation: (duel, link) => (log.push(`knight of ${link.player}`), duel),
				},
			],
		},
		// "(Quick Effect): Link Summon 1 "fixture-knight" using monsters you control, including this card, as material."
		"fixture-masquerena": {
			code: "fixture-masquerena",
			kind: "monster",
			facts: { level: 2, atk: 800, def: 800 },
			effects: [
				{
					type: "quick",
					once: { scope: "name" },
					condition: (duel, { player, card }) => { const id = knight(duel, player); return id !== undefined && canSummonByEffect(duel, player, id, [card.id]); },
					operation: (duel, link, index) => { const id = knight(duel, link.player); return id === undefined ? duel : summonByEffect(duel, index, link.player, id, [link.card.id]); },
				},
			],
		},
		// "Choose 1 monster your opponent controls, and take control of it until the End Phase." (chosen when it resolves)
		"fixture-tactics": { code: "fixture-tactics", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[other(link.player)].monster, (board, picked) => takeControl(board, picked, link.player, board.turn.number, link)) }] },
	};
}

const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;
const summons = (duel: Duel) => offered(duel).filter((label) => label.startsWith("special-summon"));

describe("\"cannot be used as Link Material\" (S3)", () => {
	it(`${cites("rules", "cannot-be-link-material-not-an-effect")} the monster is never among the Link Materials, for the procedure or for an effect that Link Summons`, () => {
		const defs = cards([]);
		// A Link 1 that takes "1 monster": another monster can be used, this one cannot.
		expect(summons(position({ defs, you: { monsters: ["fixture-plain"], extra: ["fixture-link1"] } }))).toEqual(["special-summon fixture-link1"]);
		const alone = position({ defs, you: { monsters: ["fixture-zero"], extra: ["fixture-link1"] } });
		expect(summons(alone)).toEqual([]);
		expect(canSummonByEffect(alone, "you", idOf(alone, "fixture-link1"), [idOf(alone, "fixture-zero")])).toBe(false);
		// A Link 2 that takes "2 monsters": with it and one other monster there are not two materials; with two others, they are used.
		expect(summons(position({ defs, you: { monsters: ["fixture-zero", "fixture-plain"], extra: ["fixture-knight"] } }))).toEqual([]);
		const three = position({ defs, you: { monsters: ["fixture-zero", "fixture-plain", "fixture-plain"], extra: ["fixture-knight"] } });
		const done = play(three, "special-summon fixture-knight", "place 5");
		expect(codes(done, "you", "monster").sort()).toEqual(["fixture-knight", "fixture-zero"]);
	});
	it(`${cites("rules", "cannot-be-link-material-while-negated")} it still cannot be used while its effects are negated`, () => {
		const start = position({ defs: cards([]), you: { monsters: ["fixture-zero"], extra: ["fixture-link1"] } });
		const negated = negateCardEffects(start, idOf(start, "fixture-zero"), start.turn.number);
		expect(negated.modifiers).toHaveLength(1);
		expect(summons(negated)).toEqual([]);
	});
});

describe("the materials of a Summon (S4)", () => {
	it(`${cites("rules", "link-summoned-using-text")} the Summon says which monsters were used, as they were on the field: "Link Summoned using a ... Link Monster as material" is met`, () => {
		const log: string[] = [];
		const start = position({ defs: cards(log), you: { monsters: ["fixture-link1", "fixture-plain"], extra: ["fixture-knight"] } });
		const done = play(start, "special-summon fixture-knight", "place 5");
		const knight = done.cards[idOf(done, "fixture-knight")]!;
		expect(knight).toMatchObject({ zone: "monster", summonedBy: "link" });
		expect(knight.summonMaterials.map((material) => [material.code, material.zone, material.face])).toEqual([
			["fixture-link1", "monster", "up"],
			["fixture-plain", "monster", "up"],
		]);
		expect(offered(done)).toEqual(["activate fixture-knight", "pass"]);
		play(done, "activate fixture-knight");
		expect(log).toEqual(["knight of you"]);
	});
	it(`${cites("rules", "link-summoned-using-text")} Link Summoned using no Fusion, Synchro, Xyz or Link Monster, the condition is not met`, () => {
		const log: string[] = [];
		const start = position({ defs: cards(log), you: { monsters: ["fixture-plain", "fixture-plain"], extra: ["fixture-knight"] } });
		const done = play(start, "special-summon fixture-knight", "place 5");
		expect(done.cards[idOf(done, "fixture-knight")]!.summonMaterials.map((material) => material.code)).toEqual(["fixture-plain", "fixture-plain"]);
		expect(offered(done)).not.toContain("activate fixture-knight");
	});
	it(`${cites("rules", "summon-trigger-controller-after-chain")} Link Summoned by an effect in a chain, then taken by a lower link: the player who controls it after the chain activates its "if Link Summoned" effect`, () => {
		const log: string[] = [];
		const start = position({ defs: cards(log), you: { hand: ["fixture-tactics"] }, rival: { monsters: ["fixture-masquerena", "fixture-link1"], extra: ["fixture-knight"] } });
		// Chain Link 1: your Spell; Chain Link 2: the rival's Quick Effect, which Link Summons at once.
		const summoned = play(start, "activate fixture-tactics", "activate fixture-masquerena", "place 6");
		const knight = idOf(summoned, "fixture-knight");
		// Your Spell then takes the only monster the rival controls: you choose its Main Monster Zone.
		expect(summoned.asking).toMatchObject({ player: "you" });
		const taken = play(summoned, "place 0");
		expect(taken.cards[knight]).toMatchObject({ zone: "monster", controller: "you", owner: "rival" });
		expect(taken.cards[knight]!.summonMaterials.map((material) => material.code).sort()).toEqual(["fixture-link1", "fixture-masquerena"]);
		expect([taken.priority.holder, offered(taken)]).toEqual(["you", ["activate fixture-knight", "pass"]]);
		play(taken, "activate fixture-knight");
		expect(log).toEqual(["knight of you"]);
	});
});
