import { act, type CardDef, type Duel, type EffectRecord, destroyCard, effectDestruction, flipFaceDown, legalActions, negateEffect, specialSummon, summonByEffect, targetsOf } from "../../src";
import { position, type SideSpec } from "../rules/fixtures";
import { skyStrikerDefs } from "./sky-striker-fixtures";

/**
 * Made-up cards around batch 6 of docs/rules-core/sky-striker-gaps.md (Radiant Typhoon Vision, The Fallen & The Virtuous, Lemnisgate!, Azalea).
 * None is registered in CARD_SOURCES. The real cards of the batch are in CARD_DEFS.
 */
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, ...facts }, ...more });
const attributed = (code: string, attribute: "LIGHT" | "DARK" | "WATER") => monster(code, { attribute, monsterType: "Machine", level: 4, atk: 1000, def: 1000, effect: true });
/** A monster of the Extra Deck whose text names "Fallen of Albaz", as "The Dragon that Devours the Dogma" and "Ecclesia and the Dark Dragon" do. */
/** A monster with an optional "when" Trigger Effect: it is offered after the chain only if the event it answers was the last thing that happened (a "then" after it makes it miss the timing). */
const watcher = (code: string, range: "field" | "graveyard", event: EffectRecord["event"]): CardDef => ({ code, kind: "monster", facts: { name: code, level: 4, atk: 1000, def: 1000, effect: true }, effects: [{ type: "trigger", range, timing: "when", event, operation: (duel) => duel }] });
const albazMentioner = (code: string) => monster(code, { attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 8, atk: 3000, def: 2500, effect: true, mentions: ["Fallen of Albaz"] });

export const batch6Fixtures: Record<string, CardDef> = {
	// A "Sky Striker Ace" Link 2 monster: it needs 2 materials.
	"fixture-ace-two": monster("fixture-ace-two", { attribute: "DARK", monsterType: "Machine", frame: "link", link: 2, arrows: ["bottom"], atk: 1500, effect: true, archetypes: ["Sky Striker Ace", "Sky Striker"] }, { procedure: { kind: "link", materials: { min: 2, max: 2 } } }),
	// A face-up monster that cannot be destroyed by card effects.
	"fixture-destruction-proof": monster("fixture-destruction-proof", { level: 4, atk: 1000, def: 1000, effect: true }, { effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effect-destruction" }] }] }),
	// A third "Sky Striker" Spell, beside the two of the batch 5 fixtures.
	"fixture-ss-spell-c": { code: "fixture-ss-spell-c", kind: "spell", facts: { name: "Fixture Sky Striker Spell C", archetypes: ["Sky Striker"] } },
	// A card of the "Radiant Typhoon" archetype that is not a Spell (a monster), and one more of another kind.
	"fixture-radiant": monster("fixture-radiant", { level: 4, atk: 1000, def: 1000, effect: true, archetypes: ["Radiant Typhoon"] }),
	"fixture-radiant-spell": { code: "fixture-radiant-spell", kind: "spell", facts: { name: "Fixture Radiant Typhoon Spell", archetypes: ["Radiant Typhoon"] } },
	// A Normal Spell that destroys 1 Spell/Trap on the field, which is not "Mystical Space Typhoon".
	"fixture-destroyer": {
		code: "fixture-destroyer",
		kind: "spell",
		facts: { name: "Fixture Destroyer" },
		effects: [
			{
				type: "activation",
				categories: ["destroy"],
				target: (duel) => [...duel.piles.you.spell, ...duel.piles.rival.spell, ...duel.piles.you.field, ...duel.piles.rival.field],
				operation: (duel, link) => {
					const target = targetsOf(duel, link)[0];
					return target && (target.zone === "spell" || target.zone === "field") ? destroyCard(duel, target.id, { destruction: effectDestruction(link) }) : duel;
				},
			},
		],
	},
	// A Counter Trap that negates the effect (not the activation) of the Chain Link below it.
	"fixture-effect-negator": { code: "fixture-effect-negator", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
	// A Quick-Play Spell that turns 1 face-up monster to face-down Defense Position (it becomes a new card in the core).
	"fixture-flipper": {
		code: "fixture-flipper",
		kind: "quick-play",
		facts: { name: "Fixture Flipper" },
		effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up"), operation: (duel, link) => { const target = targetsOf(duel, link)[0]; return target ? flipFaceDown(duel, target.id) : duel; } }],
	},
	// A Quick-Play Spell that Special Summons "fixture-ace-dark" (else any "Sky Striker Ace") from the player's Extra Deck to Extra Monster Zone 5 (no procedure).
	"fixture-ace-summoner": {
		code: "fixture-ace-summoner",
		kind: "quick-play",
		facts: { name: "Fixture Ace Summoner" },
		effects: [{ type: "activation", categories: ["special-summon"], operation: (duel, link) => { const aces = duel.piles[link.player].extra.filter((candidate) => duel.defs[duel.cards[candidate]!.code]?.facts?.archetypes?.includes("Sky Striker Ace")); const id = aces.find((candidate) => duel.cards[candidate]!.code === "fixture-ace-dark") ?? aces[0]; return id === undefined ? duel : specialSummon(duel, link.player, id, { slot: 5 }); } }],
	},
	// A Counter Trap (it can be activated in the Damage Step) that Link Summons "Sky Striker Ace - Azalea" from the Extra Deck by an effect.
	"fixture-azalea-counter": {
		code: "fixture-azalea-counter",
		kind: "counter-trap",
		effects: [{ type: "activation", categories: ["special-summon"], operation: (duel, link, index) => { const id = duel.piles[link.player].extra.find((candidate) => duel.cards[candidate]!.code === "sky-striker-ace-azalea"); return id === undefined ? duel : summonByEffect(duel, index, link.player, id); } }],
	},
	// A Quick-Play Spell that Special Summons "fixture-extra-plain" (a monster that is not a "Sky Striker" card) from the Extra Deck to Extra Monster Zone 5 (no procedure).
	"fixture-plain-summoner": {
		code: "fixture-plain-summoner",
		kind: "quick-play",
		facts: { name: "Fixture Plain Summoner" },
		effects: [{ type: "activation", categories: ["special-summon"], operation: (duel, link) => { const id = duel.piles[link.player].extra.find((candidate) => duel.cards[candidate]!.code === "fixture-extra-plain"); return id === undefined ? duel : specialSummon(duel, link.player, id, { slot: 5 }); } }],
	},
	// A "Sky Striker Ace" that is a Fusion Monster, not a Link Monster (no such card exists: it checks that the Link Summon of Lemnisgate! reads the frame).
	"fixture-ace-fusion": monster("fixture-ace-fusion", { attribute: "DARK", monsterType: "Machine", frame: "fusion", level: 6, atk: 2000, def: 2000, effect: true, archetypes: ["Sky Striker Ace", "Sky Striker"] }),
	// Optional "when" Trigger Effects: when this card is sent from the field to the Graveyard (Graveyard), when a card of its controller goes from the Graveyard back to a Deck (field), when a card is added from the Deck to the hand (field).
	"fixture-when-sent": watcher("fixture-when-sent", "graveyard", (_duel, event, { card }) => event.type === "moved" && event.before.id === card.id && (event.before.zone === "monster" || event.before.zone === "spell") && event.after.zone === "graveyard"),
	"fixture-deck-watcher": watcher("fixture-deck-watcher", "field", (_duel, event, { player }) => event.type === "moved" && event.before.zone === "graveyard" && (event.after.zone === "deck" || event.after.zone === "extra") && event.before.owner === player),
	"fixture-draw-watcher": watcher("fixture-draw-watcher", "field", (_duel, event, { player }) => event.type === "added-to-hand" && event.from === "deck" && event.card.owner === player),
	// Monsters of the three Attributes Azalea cares about, and monsters that mention or are "Ecclesia" cards.
	"fixture-light": attributed("fixture-light", "LIGHT"),
	"fixture-dark": attributed("fixture-dark", "DARK"),
	"fixture-water": attributed("fixture-water", "WATER"),
	"fixture-ecclesia": monster("fixture-ecclesia", { level: 4, atk: 1000, def: 1000, effect: true, archetypes: ["Ecclesia"] }),
	"fixture-albaz-a": albazMentioner("fixture-albaz-a"),
	"fixture-albaz-b": albazMentioner("fixture-albaz-b"),
	"fixture-extra-plain": monster("fixture-extra-plain", { attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 8, atk: 2500, def: 2000, effect: true }),
};

export const batch6Defs: Record<string, CardDef> = { ...skyStrikerDefs, ...batch6Fixtures };

/** As the Sky Striker `board`, with the made-up cards of batch 6 as well. */
export const board6 = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you", phase?: "main1" | "battle" | "main2"): Duel =>
	position({ defs: batch6Defs, options: { everyWindow: true, ...options }, you, rival, turn, ...(phase ? { phase } : {}) });

/**
 * Does the activation of the card `code`, by the effect record at index `effect` (the label of an activation does not tell two records apart
 * when neither has a target or a mode), choosing exactly the cards `targets` (printed codes, in order) when it has any. Throws when it is not offered.
 */
export function playEffect(duel: Duel, code: string, effect: number, ...targets: string[]): Duel {
	const action = legalActions(duel).find((candidate) => candidate.type === "activate" && duel.cards[candidate.card]!.code === code && candidate.effect === effect && (targets.length === 0 ? candidate.targets.length === 0 : candidate.targets.map((id) => duel.cards[id]!.code).join("|") === targets.join("|")));
	if (!action) throw new Error(`activation of ${code} effect ${effect}${targets.length > 0 ? ` > ${targets.join(", ")}` : ""} is not offered`);
	return act(duel, action);
}

/** The records of `code` that can be activated now, as their `effect` indexes (a card activation, a trigger or an effect). */
export const effectsOffered = (duel: Duel, code: string): number[] => [...new Set(legalActions(duel).filter((action) => action.type === "activate" && duel.cards[action.card]!.code === code).map((action) => (action as { effect: number }).effect))].sort();
