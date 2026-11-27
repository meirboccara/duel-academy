import { ask, type CardDef, type Duel, destroyCard, effectDestruction, moveCard, moveCards, other, replaceEffect, takeControl, targetsOf, banishTemporarily, tribute } from "../../src";
import { position, type SideSpec } from "../rules/fixtures";
import { skyStrikerDefs } from "./sky-striker-fixtures";

/**
 * Made-up cards around the batch 7 cards of docs/rules-core/sky-striker-gaps.md (Sky Striker Ace - Raye, Roze, Shizuku, = Zero). None is
 * registered in CARD_SOURCES. The removal cards are Quick-Play Spells that target a monster of either field and do one thing to it, so a
 * test can say which way a "Sky Striker Ace" monster leaves the field (the way Konami's Q&A fids 23445 and 23614 name).
 */
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, ...facts }, ...more });
const ACE = ["Sky Striker Ace", "Sky Striker"];

/** A Quick-Play Spell: "Target 1 monster on the field; <remove it>". */
const removal = (code: string, remove: (duel: Duel, id: number, link: Parameters<NonNullable<NonNullable<CardDef["effects"]>[number]["operation"]>>[1]) => Duel): CardDef => ({
	code,
	kind: "quick-play",
	effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => remove(board, card.id, link), duel) }],
});

export const aceFixtures: Record<string, CardDef> = {
	// A "Sky Striker Ace" monster that is not a Link Monster (Raye's second effect asks for a Link Monster).
	"fixture-ace-warrior": monster("fixture-ace-warrior", { level: 4, attribute: "DARK", monsterType: "Warrior", atk: 1500, def: 1500, effect: true, archetypes: ACE }),
	// A "Sky Striker Ace" Link Monster "Must be Link Summoned" (Azalea's and Zeke's line): never put there by an effect.
	"fixture-ace-own": monster("fixture-ace-own", { attribute: "DARK", monsterType: "Machine", frame: "link", link: 2, arrows: ["top-left", "bottom-right"], atk: 1500, effect: true, archetypes: ACE }, { summon: { onlyByOwnProcedure: true }, procedure: { kind: "link", materials: { min: 2 } } }),
	// A "Sky Striker Ace" Link Monster that is not an Ace of Link 1: a second one of another Attribute and a stronger one for battles.
	"fixture-ace-strong": monster("fixture-ace-strong", { attribute: "EARTH", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 3500, effect: true, archetypes: ACE }, { procedure: { kind: "link", materials: { min: 1 } } }),
	// A WATER "Sky Striker Ace" Link Monster (Shizuku's material must not be WATER), and a Quick-Play Spell that is a "Sky Striker" card.
	"fixture-ace-water": monster("fixture-ace-water", { attribute: "WATER", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1500, effect: true, archetypes: ACE }, { procedure: { kind: "link", materials: { min: 1 } } }),
	"fixture-ss-quick": { code: "fixture-ss-quick", kind: "quick-play", facts: { name: "Fixture Sky Striker Quick-Play Spell", archetypes: ["Sky Striker"] } },
	// A Link Monster that is not a "Sky Striker Ace" card.
	"fixture-link-other": monster("fixture-link-other", { attribute: "LIGHT", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1000, effect: true }, { procedure: { kind: "link", materials: { min: 1 } } }),
	// One way each to remove a monster from the field with a card effect.
	"fixture-destroy": removal("fixture-destroy", (duel, id, link) => destroyCard(duel, id, { destruction: effectDestruction(link) })),
	"fixture-banish": removal("fixture-banish", (duel, id, link) => moveCard(duel, id, { zone: "banished", effect: link })),
	"fixture-bounce": removal("fixture-bounce", (duel, id, link) => moveCard(duel, id, { zone: "hand", effect: link })),
	"fixture-tribute": removal("fixture-tribute", (duel, id, link) => tribute(duel, [id], undefined, link)),
	// What an effect that performs a Link Summon does with the monster it uses as material (Konami's Q&A fid 23445).
	"fixture-absorb": removal("fixture-absorb", (duel, id, link) => moveCard(duel, id, { zone: "graveyard", reason: "material", usedFor: "link", effect: link })),
	// A Link Monster of the rival in an Extra Monster Zone whose arrow points at the player's side: a zone Raye's Special Summon must not use.
	"fixture-link-top": monster("fixture-link-top", { attribute: "LIGHT", monsterType: "Machine", frame: "link", link: 1, arrows: ["top"], atk: 1000, effect: true }, { procedure: { kind: "link", materials: { min: 1 } } }),
	// "Each player can only have monsters of 1 Attribute face-up on their field" (Gozen Match's shape, Konami's Q&A fid 10427): no monster of another Attribute than the one a player has face-up can be Special Summoned.
	"fixture-one-attribute": {
		code: "fixture-one-attribute",
		kind: "trap",
		effects: [
			{ type: "activation", stays: true, operation: (duel) => duel },
			{
				type: "continuous",
				affects: () => false,
				modifies: () => [
					{
						kind: "lock",
						what: "summon",
						who: "both",
						ways: ["special"],
						only: (board, card) => board.piles[card.owner].monster.some((id) => board.cards[id]!.face === "up" && board.defs[board.cards[id]!.code]?.facts?.attribute !== board.defs[card.code]?.facts?.attribute),
					},
				],
			},
		],
	},
	// "When your opponent activates a card or effect: make that effect become "Destroy 1 monster your opponent controls"" (Prototype Sky Striker Ace - Amatsu's shape, Konami's Q&A fid 24166): the replaced effect is the opponent's, who chooses.
	"fixture-redirect": monster("fixture-redirect", { level: 4, atk: 1000, def: 1000, effect: true }, {
		effects: [
			{
				type: "quick",
				condition: (duel, { player }) => duel.chain.length > 0 && duel.chain[duel.chain.length - 1]!.player !== player,
				operation: (duel, link) =>
					link.answers === null
						? duel
						: replaceEffect(duel, link.answers, (board, replaced) => ask(board, replaced.player, board.piles[other(replaced.player)].monster, (next, picked) => destroyCard(next, picked, { destruction: effectDestruction(replaced) })), link),
			},
		],
	}),
	// An effect that does nothing, for the other player to answer.
	"fixture-poke": { code: "fixture-poke", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => duel }] },
	// A monster moved to a Spell & Trap Zone has not left the field (Konami's Q&A fid 23614).
	"fixture-to-spell-zone": removal("fixture-to-spell-zone", (duel, id, link) => moveCard(duel, id, { zone: "spell", face: "up", effect: link })),
	// "Destroy all monsters on the field": every monster leaves at the same time.
	"fixture-sweep": {
		code: "fixture-sweep",
		kind: "quick-play",
		effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, [...duel.piles.you.monster, ...duel.piles.rival.monster], { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) }) }],
	},
	// "Banish all monsters from your opponent's Graveyard."
	"fixture-gy-banisher": {
		code: "fixture-gy-banisher",
		kind: "quick-play",
		effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, duel.piles[other(link.player)].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster"), { zone: "banished", effect: link }) }],
	},
	// "Target 1 monster your opponent controls; take control of it until the End Phase" (Mind Control, as Konami's Q&A fid 11555 names it).
	"fixture-mind": {
		code: "fixture-mind",
		kind: "quick-play",
		effects: [{ type: "activation", target: (duel, { player }) => duel.piles[other(player)].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => takeControl(board, card.id, link.player, board.turn.number, link), duel) }],
	},
	// "Target 1 monster on the field; banish it until the End Phase."
	"fixture-blink": {
		code: "fixture-blink",
		kind: "quick-play",
		effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => banishTemporarily(duel, targetsOf(duel, link).map((card) => card.id), link, { phase: "end", turn: duel.turn.number }) }],
	},
};

export const aceDefs: Record<string, CardDef> = { ...skyStrikerDefs, ...aceFixtures };

export const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you", phase?: "main1" | "battle" | "main2" | "end"): Duel =>
	position({ defs: aceDefs, options: { everyWindow: true, ...options }, you, rival, turn, ...(phase ? { phase } : {}) });
