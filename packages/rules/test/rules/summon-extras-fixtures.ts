import {
	addModifier,
	askSpecialSummonTogether,
	askUpTo,
	breakEffect,
	canSpecialSummonTogether,
	type CardDef,
	type CardInstance,
	destroyCard,
	type Duel,
	effectDestruction,
	type EffectRecord,
	moveCard,
	type Side,
	specialSummonTogether,
	watch,
} from "../../src";
import { summonCards } from "./summon-fixtures";

/**
 * Made-up cards for the Summons of the second readiness slice: Synchro Monsters with a Tuner count other than one, an extra Normal
 * Summon given by an effect, and monsters Special Summoned at the same time. None is a real card: every new code starts with
 * `fixture-`, and none is registered in CARD_SOURCES. With them come the step 8 fixtures (`lv1` to `lv8`, `tuner-1` to `tuner-3`,
 * `dragon-3`, the `spy` that logs events, `summon-watcher`, `warning`, ...).
 */
export function summonExtrasCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => (log.push(code), duel);
	const codeIs = (...codes: string[]) => (_duel: Duel, card: { code: string }) => codes.includes(card.code);
	const isLightTuner1 = (duel: Duel, card: CardInstance) => { const facts = duel.defs[card.code]?.facts; return facts?.level === 1 && facts.tuner === true && facts.attribute === "LIGHT"; };
	/** The first card with this code in these piles of `side`. */
	const find = (duel: Duel, side: Side, code: string, zones: readonly ("deck" | "graveyard" | "hand")[]) => zones.flatMap((zone) => duel.piles[side][zone]).find((id) => duel.cards[id]!.code === code);
	const pair = (duel: Duel, side: Side): number[] => [find(duel, side, "fixture-ace-a", ["deck", "graveyard"]), find(duel, side, "fixture-ace-b", ["deck", "graveyard"])].filter((id): id is number => id !== undefined);
	const cards: CardDef[] = [
		// --- Synchro Monsters with a Tuner count other than one ---
		// "2+ Tuners + 1 non-Tuner "dragon-3"" (Level 6 and Level 9), and "2 Tuners + 1+ non-Tuner monsters" (Level 7).
		{ code: "fixture-synchro-two-tuners-6", kind: "monster", facts: { frame: "synchro", level: 6, atk: 2500 }, procedure: { kind: "synchro", tuners: { min: 2 }, nonTuners: { min: 1, max: 1 }, nonTuner: codeIs("dragon-3") } },
		{ code: "fixture-synchro-two-tuners-9", kind: "monster", facts: { frame: "synchro", level: 9, atk: 3500 }, procedure: { kind: "synchro", tuners: { min: 2 }, nonTuners: { min: 1, max: 1 }, nonTuner: codeIs("dragon-3") } },
		{ code: "fixture-synchro-double-tuning-7", kind: "monster", facts: { frame: "synchro", level: 7, atk: 2800 }, procedure: { kind: "synchro", tuners: { min: 2, max: 2 } } },

		// --- An extra Normal Summon ---
		{ code: "fixture-light-tuner", kind: "monster", facts: { name: "Fixture Light Tuner", attribute: "LIGHT", level: 1, tuner: true, atk: 0, def: 0 } },
		{ code: "fixture-dark-tuner", kind: "monster", facts: { name: "Fixture Dark Tuner", attribute: "DARK", level: 1, tuner: true, atk: 0, def: 0 } },
		// A Field Spell: "During your Main Phase, you can Normal Summon 1 Level 1 LIGHT Tuner in addition to your Normal Summon/Set. (You
		// can only gain this effect once per turn.)"
		{
			code: "fixture-mausoleum",
			kind: "spell",
			facts: { icon: "field" },
			effects: [
				{ type: "activation", operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: (_duel, source) => [{ kind: "permit", what: "normal-summon", who: source.controller, only: isLightTuner1 }] },
			],
		},
		// A second, differently named Field Spell with the same sentence, for any Level 4 or lower monster.
		{
			code: "fixture-second-summon-field",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: (_duel, source) => [{ kind: "permit", what: "normal-summon", who: source.controller }] },
			],
		},
		// A Normal Spell: "This turn, you can Normal Summon 1 Level 5 or higher monster in addition to your Normal Summon/Set."
		{
			code: "fixture-extra-tribute-summon",
			kind: "spell",
			effects: [{ type: "activation", condition: (duel) => !duel.extraNormalSummoned, operation: (duel, link) => addModifier(duel, { affects: () => false, until: duel.turn.number, by: link, layer: { kind: "permit", what: "normal-summon", who: link.player, only: (board, card) => (board.defs[card.code]?.facts?.level ?? 0) >= 5 } }) }],
		},
		// A Quick-Play Spell: "Destroy 1 Field Spell on the field." (the first one found)
		{
			code: "fixture-field-breaker",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => { const id = [...duel.piles.you.field, ...duel.piles.rival.field][0]; return id === undefined ? duel : destroyCard(duel, id, { destruction: effectDestruction(link) }); } }],
		},

		// --- Monsters Special Summoned at the same time ---
		{ code: "fixture-ace-a", kind: "monster", facts: { name: "Fixture Ace A", level: 4, atk: 1500, def: 1500 }, effects: [{ type: "trigger", timing: "if", mandatory: true, event: (_duel, event, { card }) => event.type === "summoned" && event.card.id === card.id, operation: (duel) => (log.push(`fixture-ace-a sees ${duel.piles.you.monster.length} monsters`), duel) }] },
		{ code: "fixture-ace-b", kind: "monster", facts: { name: "Fixture Ace B", level: 4, atk: 1500, def: 1500 }, effects: [{ type: "trigger", timing: "if", mandatory: true, event: (_duel, event, { card }) => event.type === "summoned" && event.card.id === card.id, operation: logs("fixture-ace-b") }] },
		// A Quick Effect: "You can Tribute this card; Special Summon 1 "Fixture Ace A" and 1 "Fixture Ace B" from your Deck and/or GY,
		// then you can destroy 1 card on the field." (activated only when both can be Special Summoned)
		{
			code: "fixture-zero",
			kind: "monster",
			facts: { name: "Fixture Zero", level: 4, atk: 2000, def: 2000 },
			effects: [
				{
					type: "quick",
					once: { scope: "name" },
					condition: (duel, { player, card }) => { const ids = pair(duel, player); return ids.length === 2 && canSpecialSummonTogether(duel, player, ids, { leaving: [card.id] }); },
					cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard", reason: "tributed" }),
					operation: (duel, link) => {
						const ids = pair(duel, link.player);
						if (ids.length < 2) return duel;
						return askSpecialSummonTogether(duel, link.player, ids, {
							// "then": the destruction is not at the same time as the Summon (Konami's notes on Sky Striker Ace = Zero).
							then: (summoned) => askUpTo(breakEffect(summoned), link.player, [...summoned.piles.you.monster, ...summoned.piles.rival.monster, ...summoned.piles.you.spell, ...summoned.piles.rival.spell], { min: 0, max: 1 }, (next, picked) => picked.reduce((after, id) => destroyCard(after, id, { destruction: effectDestruction(link) }), next)),
						});
					},
				},
			],
		},
		// A Quick-Play Spell: "Special Summon 1 "Fixture Ace A" and 1 "Fixture Ace B" from your hand." (the first zones, Attack Position)
		{
			code: "fixture-twin-call",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					condition: (duel, { player }) => { const ids = [find(duel, player, "fixture-ace-a", ["hand"]), find(duel, player, "fixture-ace-b", ["hand"])]; return ids.every((id) => id !== undefined) && canSpecialSummonTogether(duel, player, ids as number[]); },
					operation: (duel, link) => {
						const ids = [find(duel, link.player, "fixture-ace-a", ["hand"]), find(duel, link.player, "fixture-ace-b", ["hand"])];
						return ids.every((id) => id !== undefined) ? specialSummonTogether(duel, link.player, (ids as number[]).map((id) => ({ id }))) : duel;
					},
				},
			],
		},
		// A monster: "Neither player can Special Summon 2 or more monsters at the same time."
		{ code: "fixture-one-at-a-time", kind: "monster", facts: { name: "Fixture One At A Time", level: 4, atk: 1000, def: 1000 }, effects: [{ type: "continuous", affects: () => false, modifies: () => [{ kind: "lock", what: "summon-together", who: "both" }] }] },
		// A Quick-Play Spell: "Special Summon 1 monster from your hand." (it brings the lock above in a chain)
		{ code: "fixture-bring-lock", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => { const id = find(duel, link.player, "fixture-one-at-a-time", ["hand"]); return id === undefined ? duel : specialSummonTogether(duel, link.player, [{ id }]); } }] },
		// A Quick-Play Spell: "For the rest of this turn, each time a monster(s) is Special Summoned, write how many monsters its player controls."
		{
			code: "fixture-count-watch",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => watch(duel, link, { until: duel.turn.number, event: (_board, event) => event.type === "summoned" && event.how === "special", apply: (board, _self, event) => (event.type === "summoned" && log.push(`summoned with ${board.piles[event.player ?? "you"].monster.length} on the field`), board) }) }],
		},
		// A Continuous Trap: "Your opponent cannot Special Summon "Fixture Ace B"."
		{ code: "fixture-no-ace-b", kind: "trap", effects: [{ type: "activation", stays: true, operation: (duel) => duel }, { type: "continuous", affects: () => false, modifies: (_duel, source) => [{ kind: "lock", what: "summon", who: source.controller === "you" ? "rival" : "you", ways: ["special"], only: (_board, card) => card.code === "fixture-ace-b" }] }] },
	];
	return { ...summonCards(log), ...Object.fromEntries(cards.map((def) => [def.code, def])) };
}
