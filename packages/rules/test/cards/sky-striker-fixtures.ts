import { CARD_DEFS, type CardDef, type Duel, destroyCard, drawCards, effectDestruction, moveCard, negateActivationAndDestroy, specialSummon } from "../../src";
import { offered, plainCards, play, position, type SideSpec } from "../rules/fixtures";

/**
 * Made-up cards around the Sky Striker cards (batch 5 of docs/rules-core/sky-striker-gaps.md). None is registered in CARD_SOURCES. A
 * "Sky Striker Ace" card is also a "Sky Striker" card (the name's own archetype, which no Konami page lists).
 */
const ACE = ["Sky Striker Ace", "Sky Striker"];
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, ...facts }, ...more });
const ace = (code: string, attribute: "LIGHT" | "DARK" | "FIRE" | "WIND", more: Partial<CardDef> = {}): CardDef =>
	monster(code, { attribute, monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1500, effect: true, archetypes: ACE }, { procedure: { kind: "link", materials: { min: 1 } }, ...more });

export const skyStrikerFixtures: Record<string, CardDef> = {
	...plainCards(),
	"fixture-filler": monster("fixture-filler", { level: 4, atk: 1000, def: 1000, effect: true }),
	"fixture-normal": monster("fixture-normal", { level: 4, atk: 1000, def: 1000, normal: true }),
	"fixture-big": monster("fixture-big", { level: 8, atk: 3000, def: 2500, effect: true }),
	// "Sky Striker" cards of every kind.
	"fixture-ss-spell": { code: "fixture-ss-spell", kind: "spell", facts: { name: "Fixture Sky Striker Spell", archetypes: ["Sky Striker"] } },
	"fixture-ss-spell-b": { code: "fixture-ss-spell-b", kind: "spell", facts: { name: "Fixture Sky Striker Spell B", archetypes: ["Sky Striker"] } },
	"fixture-ss-monster": monster("fixture-ss-monster", { level: 4, atk: 1500, def: 1500, effect: true, archetypes: ["Sky Striker"] }),
	"fixture-other-spell": { code: "fixture-other-spell", kind: "spell", facts: { name: "Fixture Other Spell" } },
	"fixture-quick-spell": { code: "fixture-quick-spell", kind: "quick-play", facts: { name: "Fixture Quick Spell" } },
	"fixture-trap": { code: "fixture-trap", kind: "trap", facts: { name: "Fixture Trap" } },
	// "Sky Striker Ace" Link monsters of each Attribute (Link 1, arrow at the bottom).
	"fixture-ace-light": ace("fixture-ace-light", "LIGHT"),
	"fixture-ace-dark": ace("fixture-ace-dark", "DARK"),
	"fixture-ace-fire": ace("fixture-ace-fire", "FIRE"),
	"fixture-ace-wind": ace("fixture-ace-wind", "WIND"),
	// A Counter Trap (it can be activated in the Damage Step) that Special Summons a Link monster named in its target from the player's Extra Deck.
	"fixture-summon-counter": {
		code: "fixture-summon-counter",
		kind: "counter-trap",
		effects: [{ type: "activation", categories: ["special-summon"], operation: (duel, link) => { const id = duel.piles[link.player].extra.find((candidate) => duel.defs[duel.cards[candidate]!.code]?.facts?.link !== undefined); return id === undefined ? duel : specialSummon(duel, link.player, id, { slot: 5 }); } }],
	},
	// An Effect Monster with a Quick Effect that Tributes itself as its cost: "Tribute this card; draw 1 card".
	"fixture-drawer": monster("fixture-drawer", { level: 4, atk: 1000, def: 1000, effect: true }, { effects: [{ type: "quick", categories: ["draw"], cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard", reason: "tributed" }), operation: (duel, link) => drawCards(duel, link.player, 1) }] }),
	// A Link monster that is not an Ace, and an Effect Monster with a Quick Effect that Tributes itself as its cost.
	"fixture-link": monster("fixture-link", { attribute: "LIGHT", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1000, effect: true }, { procedure: { kind: "link", materials: { min: 1 } } }),
	// A Continuous Trap that stops banishing from the Graveyard (Imperial Iron Wall's shape), for Shark Cannon's Q&A fid 8227.
	"fixture-iron-wall": { code: "fixture-iron-wall", kind: "trap", effects: [{ type: "continuous", modifies: () => [{ kind: "lock", what: "banish-from-graveyard", who: "both" }] }] },
	// An Effect Monster with a Quick Effect usable in the Damage Step at every timing: "destroy 1 other monster you control" (a response to a battle trigger), for Hayate's Q&A fid 23937 (Konami's card there is a Counter Trap; the core follows the TCG rule that Counter Traps wait until the start of damage calculation, so a flagged Quick Effect stands in).
	"fixture-smasher": monster("fixture-smasher", { level: 4, atk: 500, def: 500, effect: true }, { effects: [{ type: "quick", damageStep: true, operation: (duel, link) => { const victim = duel.piles[link.player].monster.find((id) => id !== link.card.id); return victim === undefined ? duel : destroyCard(duel, victim, { destruction: effectDestruction(link) }); } }] }),
	// A Counter Trap that answers a Chain Link whose categories include "special-summon" (Solemn Warning's first bullet), for Shark Cannon's Q&A fid 21761.
	"fixture-ss-warning": {
		code: "fixture-ss-warning",
		kind: "counter-trap",
		effects: [{ type: "activation", condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.includes("special-summon") ?? false, operation: (duel, link) => negateActivationAndDestroy(duel, link.answers!, effectDestruction(link)) }],
	},
};

export const skyStrikerDefs: Record<string, CardDef> = { ...CARD_DEFS, ...skyStrikerFixtures };

export const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you", phase?: "main1" | "battle" | "main2"): Duel =>
	position({ defs: skyStrikerDefs, options: { everyWindow: true, ...options }, you, rival, turn, ...(phase ? { phase } : {}) });

export const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
export const all = (duel: Duel, code: string) => Object.values(duel.cards).filter((entry) => entry.code === code);

/** Passes until the chain is resolved or a question is open, then until the game state is open again (the opponent passes first after a chain). */
export const resolve = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 8 && !next.asking && (next.chain.length > 0 || (offered(next).length === 1 && offered(next)[0] === "pass")); guard++) next = play(next, "pass");
	return next;
};

/** The activations of one card on offer (one label per way, duplicates of the same card collapsed). */
export const activations = (duel: Duel, code: string): string[] => [...new Set(offered(duel).filter((label) => label.startsWith(`activate ${code}`)))];

/** Three Spells in the Graveyard, which is what each Spell here counts. */
export const threeSpells = ["fixture-other-spell", "fixture-quick-spell", "fixture-ss-spell-b"];
