import { CARD_DEFS, type CardDef, canSummonByEffect, changeControl, destroyCard, type Duel, effectDestruction, flipFaceDown, freeSlots, moveCard, moveCards, other, specialSummon, summonByEffect, takeControl, targetsOf, tribute } from "../../src";
import { position, type SideSpec } from "../rules/fixtures";
import { aceFixtures } from "./sky-striker-ace-fixtures";
import { batch6Fixtures } from "./sky-striker-batch6-fixtures";
import { skyStrikerFixtures } from "./sky-striker-fixtures";

/**
 * Made-up cards around batch 8 of docs/rules-core/sky-striker-gaps.md (Sky Striker Ace - Zeke, S:P Little Knight, Ecclesia and the Dark Dragon,
 * Prototype Sky Striker Ace - Amatsu). None is registered in CARD_SOURCES. The real cards of the batch are in CARD_DEFS. `batch8Cards(log)` writes
 * what it does in `log`.
 */
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, ...facts }, ...more });
const field = (duel: Duel): number[] => [...duel.piles.you.monster, ...duel.piles.rival.monster];
const faceUp = (duel: Duel): number[] => field(duel).filter((id) => duel.cards[id]!.face === "up");
/** "Unaffected by monster effects" and "unaffected by other cards' effects". */
const unaffectedByMonsters = { kind: "protect", against: "effects", from: (duel: Duel, by: { readonly card: { readonly code: string } }) => duel.defs[by.card.code]?.kind === "monster" } as const;
const unaffectedByAll = { kind: "protect", against: "effects" } as const;

export function batch8Cards(log: string[] = []): Record<string, CardDef> {
	const cards: CardDef[] = [
		// Extra Deck monsters that are Effect Monsters of each frame (materials for S:P Little Knight), and a Normal Monster for contrast (`fixture-normal`).
		monster("fixture-mat-fusion", { attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 6, atk: 2000, def: 1500, effect: true }),
		monster("fixture-mat-synchro", { attribute: "LIGHT", monsterType: "Warrior", frame: "synchro", level: 6, atk: 2000, def: 1500, effect: true }),
		monster("fixture-mat-xyz", { attribute: "DARK", monsterType: "Machine", frame: "xyz", level: 4, atk: 2000, def: 1500, effect: true }),
		// A Tuner (Level 3) and a non-Tuner (Level 5) for a Synchro Summon of Level 8.
		monster("fixture-tuner-3", { attribute: "LIGHT", monsterType: "Spellcaster", level: 3, tuner: true, atk: 500, def: 500, effect: true }),
		monster("fixture-nontuner-5", { attribute: "LIGHT", monsterType: "Spellcaster", level: 5, atk: 1500, def: 1000, effect: true }),
		monster("fixture-nontuner-4", { attribute: "LIGHT", monsterType: "Spellcaster", level: 4, atk: 1500, def: 1000, effect: true }),
		// "Fallen of Albaz" (by printed name), a Level 4 monster that mentions it, a Level 7 monster that mentions it, and monsters that do not.
		monster("fixture-albaz", { attribute: "DARK", monsterType: "Dragon", level: 4, atk: 1800, def: 0, effect: true }, {}),
		monster("fixture-mentions-4", { attribute: "DARK", monsterType: "Dragon", level: 4, atk: 1500, def: 1000, effect: true, mentions: ["Fallen of Albaz"] }),
		monster("fixture-mentions-7", { attribute: "DARK", monsterType: "Dragon", level: 7, atk: 2500, def: 2000, effect: true, mentions: ["Fallen of Albaz"] }),
		monster("fixture-unrelated-4", { attribute: "DARK", monsterType: "Dragon", level: 4, atk: 1500, def: 1000, effect: true }),
		// Level 8 and Level 7 Fusion Monsters, and a Level 8 Synchro Monster, for Ecclesia's second effect.
		monster("fixture-fusion-8", { attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 8, atk: 3000, def: 2500, effect: true }),
		monster("fixture-fusion-7", { attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 7, atk: 2500, def: 2500, effect: true }),
		monster("fixture-synchro-8", { attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 8, atk: 2500, def: 2500, effect: true }),
		// A face-up monster unaffected by monster effects, one unaffected by other cards' effects.
		monster("fixture-unaffected-monsters", { level: 4, atk: 1000, def: 1000, effect: true }, { effects: [{ type: "continuous", modifies: () => [unaffectedByMonsters] }] }),
		monster("fixture-unaffected", { level: 4, atk: 1000, def: 1000, effect: true }, { effects: [{ type: "continuous", modifies: () => [unaffectedByAll] }] }),
		// A "Sky Striker Ace" Link Monster that cannot be destroyed by card effects, and one that is unaffected by other cards' effects (Amatsu's Q&A fid 24165).
		monster("fixture-ace-proof", { attribute: "DARK", monsterType: "Machine", frame: "link", link: 1, arrows: ["bottom"], atk: 1500, effect: true, archetypes: ["Sky Striker Ace", "Sky Striker"] }, { effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effect-destruction" }] }] }),
		// "Quick Effect: ..." monsters of the opponent with a log: 2500 ATK, 1900 ATK, 2000 ATK, each an ignition effect "log and nothing else".
		...([2500, 2000, 1900] as const).map((atk) =>
			monster(`fixture-effect-${atk}`, { level: 8, atk, def: 1000, effect: true }, { effects: [{ type: "ignition", operation: (duel) => (log.push(`effect-${atk}`), duel) }] }),
		),
		// The same, unaffected by other cards' effects, with an ignition effect.
		monster("fixture-effect-2500-unaffected", { level: 8, atk: 2500, def: 1000, effect: true }, { effects: [{ type: "continuous", modifies: () => [unaffectedByAll] }, { type: "ignition", operation: (duel) => (log.push("effect-2500-unaffected"), duel) }] }),
		// A 1500 ATK monster that Tributes itself as the cost of its effect: raised by another effect it has 2000 or more ATK before the cost.
		monster("fixture-tributer", { level: 4, atk: 1500, def: 600, effect: true }, { effects: [{ type: "ignition", cost: (duel, { card }) => tribute(duel, [card.id]), operation: (duel) => (log.push("tributer"), duel) }] }),
		// A monster whose effect is activated from the hand (discarding itself): it has no ATK on the field.
		monster("fixture-hand-effect", { level: 8, atk: 2500, def: 1000, effect: true }, { effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard", reason: "discarded" }), operation: (duel) => (log.push("hand-effect"), duel) }] }),
		// A monster with 3000 ATK and a Quick Effect usable in the Damage Step.
		monster("fixture-quick-3000", { level: 8, atk: 3000, def: 1000, effect: true }, { effects: [{ type: "quick", damageStep: true, operation: (duel) => (log.push("quick-3000"), duel) }] }),
		// A Normal Spell and a Normal Trap whose activation does nothing, the opponent's "activates a card or effect".
		{ code: "fixture-activator", kind: "spell", facts: { name: "Fixture Activator" }, effects: [{ type: "activation", operation: (duel) => (log.push("activator"), duel) }] },
		{ code: "fixture-activator-trap", kind: "trap", facts: { name: "Fixture Activator Trap" }, effects: [{ type: "activation", operation: (duel) => (log.push("activator-trap"), duel) }] },
		// A Normal Trap that destroys 1 monster on the field (it targets), and a Quick-Play Spell that Special Summons 1 monster from the hand.
		{ code: "fixture-trap-destroy", kind: "trap", facts: { name: "Fixture Trap Destroy" }, effects: [{ type: "activation", categories: ["destroy"], target: field, operation: (duel, link) => { const [target] = targetsOf(duel, link); return target ? destroyCard(duel, target.id, { destruction: effectDestruction(link) }) : duel; } }] },
		{ code: "fixture-fill", kind: "quick-play", facts: { name: "Fixture Fill" }, effects: [{ type: "activation", categories: ["special-summon"], operation: (duel, link) => { const id = duel.piles[link.player].hand.find((card) => duel.defs[duel.cards[card]!.code]?.kind === "monster"); return id === undefined ? duel : specialSummon(duel, link.player, id); } }] },
		// A monster that notes every time it is sent to the Graveyard (a card placed there raises no event).
		monster("fixture-sent-watch", { level: 4, atk: 1000, def: 1000, effect: true }, { effects: [{ type: "trigger", range: "graveyard", mandatory: true, event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.after.zone === "graveyard", operation: (duel) => (log.push("sent-watch"), duel) }] }),
		// "Target 1 monster your opponent controls; take control of it" with no limit of time (Number 11: Big Eye's kind of control): a plain change of control, with no duration to end.
		{ code: "fixture-take-for-good", kind: "quick-play", facts: { name: "Fixture Take For Good" }, effects: [{ type: "activation", target: (duel, { player }) => duel.piles[other(player)].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => { const slot = freeSlots(board, link.player, "monster")[0]; return slot === undefined ? board : changeControl(board, card.id, link.player, slot); }, duel) }] },
		// "Link Summon 1 card of the Extra Deck using this card and another monster you control" (Quick Effect, I:P Masquerena's shape): the Link Monster named by the code after "fixture-linker-".
		...(["sky-striker-ace-zeke", "sp-little-knight"] as const).map(
			(summoned): CardDef =>
				monster(`fixture-linker-${summoned}`, { level: 2, atk: 800, def: 800, effect: true }, {
					effects: [
						{
							type: "quick",
							once: { scope: "name" },
							condition: (duel, { player, card }) => { const id = duel.piles[player].extra.find((candidate) => duel.cards[candidate]!.code === summoned); return id !== undefined && canSummonByEffect(duel, player, id, [card.id]); },
							operation: (duel, link, index) => { const id = duel.piles[link.player].extra.find((candidate) => duel.cards[candidate]!.code === summoned); return id === undefined ? duel : summonByEffect(duel, index, link.player, id, [link.card.id]); },
						},
					],
				}),
		),
		// "Choose 1 monster your opponent controls and take control of it until the End Phase" (chosen as it resolves, so it is Mind Control's shape with no target).
		// (`fixture-mind` of the ace fixtures targets; the one here is only for the Link Summon in a chain.)
		{
			code: "fixture-tactics",
			kind: "spell",
			facts: { name: "Fixture Tactics" },
			effects: [{ type: "activation", operation: (duel, link) => ((ids) => (ids.length === 0 ? duel : takeControl(duel, ids[0]!, link.player, duel.turn.number, link)))(duel.piles[other(link.player)].monster) }],
		},
		// A Quick-Play Spell that sends 1 monster you control to the Graveyard (a way to make a Level 8 Fusion Monster available) is not needed; a Spell that banishes a card from either Graveyard is.
		{ code: "fixture-gy-banish-all", kind: "quick-play", facts: { name: "Fixture Graveyard Banisher" }, effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard], { zone: "banished", effect: link }) }] },
		// A Quick-Play Spell that turns each face-up monster on the field face-down, for the cases of a target turned face-down.
		{ code: "fixture-flip-all", kind: "quick-play", facts: { name: "Fixture Flip All" }, effects: [{ type: "activation", operation: (duel) => { const ids = faceUp(duel); log.push(`flipped ${ids.map((id) => duel.cards[id]!.code).join(",")}`); return ids.reduce((board, id) => flipFaceDown(board, id), duel); } }] },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

/** The defs of the batch: the real cards, the made-up cards of batches 5 to 7 and these. `fixture-albaz`'s printed name is "Fallen of Albaz". */
export function batch8Defs(log: string[] = []): Record<string, CardDef> {
	const made = { ...skyStrikerFixtures, ...aceFixtures, ...batch6Fixtures, ...batch8Cards(log) };
	const albaz = made["fixture-albaz"]!;
	return { ...CARD_DEFS, ...made, "fixture-albaz": { ...albaz, facts: { ...albaz.facts, name: "Fallen of Albaz" } } };
}

export function board8(log: string[], you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you", phase?: "main1" | "battle" | "main2" | "end"): Duel {
	return position({ defs: batch8Defs(log), options: { everyWindow: true, ...options }, you, rival, turn, ...(phase ? { phase } : {}) });
}
