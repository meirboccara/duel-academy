import { describe, expect, it } from "vitest";
import { type CardDef, changeControl, cites, destroyCard, type Duel, effectDestruction, leftFieldBy, type Link, moveCard, targetsOf, tribute } from "../../src";
import { offered, play, position, type SideSpec } from "./fixtures";

/**
 * S1 of docs/rules-core/sky-striker-gaps.md: "leaves the field by an opponent's card effect". Every `moved` event done by an effect's
 * processing carries that effect (`moved.effect`); `leftFieldBy` reads it for a card that left the field. Made-up cards: a monster
 * with Sky Striker Ace - Raye's Graveyard condition, Quick-Play Spells that each remove a monster in one way, and a recorder that
 * notes what every such event says. Konami's Japanese Q&A fids 23614, 23445 and 8161 (OCG only).
 */
function cards(log: string[]): Record<string, CardDef> {
	const aces = (duel: Duel, link: Link) => targetsOf(duel, link);
	const removal = (code: string, remove: (duel: Duel, id: number, link: Link) => Duel): CardDef => ({
		code,
		kind: "quick-play",
		effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.code === "fixture-ace"), operation: (duel, link) => aces(duel, link).reduce((board, card) => remove(board, card.id, link), duel) }],
	});
	return {
		"fixture-ace": { code: "fixture-ace", kind: "monster", facts: { level: 4, atk: 1500, def: 1500 } },
		"fixture-xyz": { code: "fixture-xyz", kind: "monster", facts: { frame: "xyz", rank: 4, atk: 2000, def: 2000 } },
		// "While this card is in your GY, if a face-up "fixture-ace" you control leaves the field by an opponent's card effect: You can ...".
		"fixture-raye": {
			code: "fixture-raye",
			kind: "monster",
			facts: { level: 4, atk: 1500, def: 1500 },
			effects: [
				{
					type: "trigger",
					range: "graveyard",
					timing: "if",
					event: (_duel, event, { player }) => {
						const by = leftFieldBy(event);
						return by !== null && event.type === "moved" && event.before.code === "fixture-ace" && event.before.controller === player && by.player !== player;
					},
					operation: (duel) => (log.push("raye"), duel),
				},
			],
		},
		// Notes what each event of a card that left the field by an effect says. Its condition is never met: it only reads.
		"fixture-recorder": {
			code: "fixture-recorder",
			kind: "monster",
			facts: { level: 1, atk: 0, def: 0 },
			effects: [
				{
					type: "trigger",
					event: (_duel, event) => {
						const by = leftFieldBy(event);
						if (by && event.type === "moved") log.push(`${event.before.code} of ${event.before.controller} left by ${by.card.code} of ${by.player}`);
						return false;
					},
					operation: (duel) => duel,
				},
			],
		},
		"fixture-destroy": removal("fixture-destroy", (duel, id, link) => destroyCard(duel, id, { destruction: effectDestruction(link) })),
		"fixture-banish": removal("fixture-banish", (duel, id, link) => moveCard(duel, id, { zone: "banished", effect: link })),
		"fixture-bounce": removal("fixture-bounce", (duel, id, link) => moveCard(duel, id, { zone: "hand", effect: link })),
		"fixture-spin": removal("fixture-spin", (duel, id, link) => moveCard(duel, id, { zone: "deck", effect: link })),
		"fixture-send": removal("fixture-send", (duel, id, link) => moveCard(duel, id, { zone: "graveyard", effect: link })),
		"fixture-tribute": removal("fixture-tribute", (duel, id, link) => tribute(duel, [id], undefined, link)),
		// What an effect that performs a Link Summon does with the monster it uses as material (fid 23445).
		"fixture-absorb": removal("fixture-absorb", (duel, id, link) => moveCard(duel, id, { zone: "graveyard", reason: "material", usedFor: "link", effect: link })),
		// The monster is moved to a Spell & Trap Zone, or attached to an Xyz Monster as material: it has not left the field (fid 23614).
		"fixture-to-spell-zone": removal("fixture-to-spell-zone", (duel, id, link) => moveCard(duel, id, { zone: "spell", face: "up", effect: link })),
		"fixture-attach": removal("fixture-attach", (duel, id, link) => moveCard(duel, id, { zone: "material", attachedTo: duel.piles[link.player].monster[0]!, effect: link })),
		// "Send 1 "fixture-ace" your opponent controls to the GY; ...": the monster leaves as a cost.
		"fixture-cost": {
			code: "fixture-cost",
			kind: "quick-play",
			effects: [{ type: "activation", cost: (duel, { player }) => { const id = duel.piles[player === "you" ? "rival" : "you"].monster.find((card) => duel.cards[card]!.code === "fixture-ace"); return id === undefined ? null : moveCard(duel, id, { zone: "graveyard", player }); }, operation: (duel) => duel }],
		},
	};
}

/** The rival's turn: you control a "fixture-ace" and a recorder, with "fixture-raye" in your GY; the rival holds the removal cards. */
function board(rivalHand: string[], log: string[] = [], rival: SideSpec = {}): Duel {
	return position({ defs: cards(log), turn: "rival", you: { monsters: ["fixture-ace", "fixture-recorder"], graveyard: ["fixture-raye"] }, rival: { hand: rivalHand, ...rival } });
}

describe("a monster that leaves the field by a card effect (S1)", () => {
	const kinds: [string, string][] = [
		["fixture-destroy", "destroyed"],
		["fixture-banish", "banished"],
		["fixture-bounce", "returned to the hand"],
		["fixture-spin", "returned to the Deck"],
		["fixture-send", "sent to the GY"],
		["fixture-tribute", "Tributed by an effect"],
	];
	it(`${cites("rules", "left-field-by-effect-processing")} ${cites("rules", "left-field-by-effect-kinds")} the move an effect's processing does says which effect did it, whatever the way: destroyed, banished, returned to the hand or the Deck (sent or Tributed by an effect: the core's reading of the general sentence)`, () => {
		for (const [code, how] of kinds) {
			const log: string[] = [];
			const done = play(board([code], log), `activate ${code} > fixture-ace`);
			expect(log, how).toEqual([`fixture-ace of you left by ${code} of rival`]);
			// "by an opponent's card effect": the condition of your Graveyard effect is met.
			expect(offered(done), how).toContain("activate fixture-raye");
		}
	});
	it(`${cites("rules", "left-field-by-effect-processing")} a monster that leaves as a cost did not leave by an effect`, () => {
		const log: string[] = [];
		const done = play(board(["fixture-cost"], log), "activate fixture-cost");
		expect(done.cards[1]!.zone).toBe("graveyard");
		expect(log).toEqual([]);
		expect(offered(done)).not.toContain("activate fixture-raye");
	});
	it(`${cites("rules", "left-field-as-material-not-by-effect")} a monster an effect uses as the material of a Summon did not leave "by the opponent's effect"`, () => {
		const log: string[] = [];
		const done = play(board(["fixture-absorb"], log), "activate fixture-absorb > fixture-ace");
		expect(done.cards[1]!.zone).toBe("graveyard");
		expect(log).toEqual([]);
		expect(offered(done)).not.toContain("activate fixture-raye");
	});
	it(`${cites("rules", "left-field-not-spell-zone-or-material")} a monster moved to a Spell & Trap Zone, or attached as Xyz Material, has not left the field`, () => {
		for (const code of ["fixture-to-spell-zone", "fixture-attach"]) {
			const log: string[] = [];
			const done = play(board([code], log, { monsters: ["fixture-xyz"] }), `activate ${code} > fixture-ace`);
			expect(done.cards[1]!.zone, code).toBe(code === "fixture-attach" ? "material" : "spell");
			expect(log, code).toEqual([]);
			expect(offered(done), code).not.toContain("activate fixture-raye");
		}
	});
	it(`${cites("rules", "left-field-controller-then")} whose monster it was is the player who controlled it when it left, not its owner`, () => {
		const log: string[] = [];
		// The rival owns the "fixture-ace"; you took control of it. Your own effect then removes it: it is the rival's opponent's effect
		// for nobody's Graveyard effect, and the event says you controlled it.
		const start = position({ defs: cards(log), you: { hand: ["fixture-banish"], monsters: ["fixture-recorder"], graveyard: ["fixture-raye"] }, rival: { monsters: ["fixture-ace"], graveyard: ["fixture-raye"] } });
		const ace = start.piles.rival.monster[0]!;
		const taken = { ...changeControl(start, ace, "you"), live: [], waiting: [] };
		const done = play(taken, "activate fixture-banish > fixture-ace");
		expect(done.cards[ace]).toMatchObject({ zone: "banished", owner: "rival" });
		expect(log).toEqual(["fixture-ace of you left by fixture-banish of you"]);
		// Not the rival's monster when it left (the rival's "fixture-raye"), and not removed by your opponent (yours).
		expect(offered(done).filter((label) => label.includes("fixture-raye"))).toEqual([]);
	});
});
