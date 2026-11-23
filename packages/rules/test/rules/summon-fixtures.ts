import {
	ask,
	askSpecialSummon,
	canFusionSummon,
	canRitualSummon,
	canSpecialSummon,
	canSummonByEffect,
	type CardDef,
	changePosition,
	detach,
	type Duel,
	type EffectRecord,
	flipFaceDown,
	flipFaceUp,
	type FusionOptions,
	fusionSummon,
	type GameEvent,
	materialsOf,
	negateSummonAndDestroy,
	type RitualOptions,
	ritualSummon,
	type Side,
	summonByEffect,
	summonNegatable,
	targetsOf,
} from "../../src";

/**
 * Made-up cards for the step 8 tests (Summon procedures), shaped like the blockers of the coverage notes: a generic Synchro and one
 * that asks for a kind of non-Tuner, Xyz Monsters with a detach cost and an alternative Summon, Link Monsters, Fusion Monsters with
 * the Spells that Fusion Summon them from the hand, the field, the Deck, the Graveyard or the opponent's field, a Ritual Monster with
 * an "equal" and an "equal or exceed" Ritual Spell. None of them is a card of the core.
 */

/** One line for an event, as the spy card writes it in the log. */
export function describe(event: GameEvent): string | null {
	switch (event.type) {
		case "moved":
			return `moved ${event.before.code} ${event.before.zone}>${event.after.zone}${event.reason ? ` ${event.reason}` : ""}${event.usedFor ? ` for ${event.usedFor}` : ""}${event.negated ? " negated" : ""}`;
		case "summoned":
			return `summoned ${event.card.code} ${event.how}${event.kind ? ` ${event.kind}` : ""}${event.by ? " by effect" : ""}`;
		case "flipped":
			return `flipped ${event.card.code}`;
		case "position-changed":
			return `position ${event.card.code} ${event.from}>${event.card.position}`;
		default:
			return null;
	}
}

const monsters = (duel: Duel, side: Side) => duel.piles[side].monster;
const isMonster = (duel: Duel, id: number) => duel.defs[duel.cards[id]!.code]?.kind === "monster";
const codeIs =
	(...codes: string[]) =>
	(_duel: Duel, card: { code: string }) =>
		codes.includes(card.code);

const FROM_HAND_OR_FIELD: FusionOptions = { pool: (duel, player) => [...duel.piles[player].hand, ...monsters(duel, player)] };
const FROM_DECK: FusionOptions = { pool: (duel, player) => [...duel.piles[player].hand, ...monsters(duel, player), ...duel.piles[player].deck] };
const FROM_GRAVEYARD: FusionOptions = { pool: (duel, player) => duel.piles[player].graveyard, to: "banished" };
const FROM_EITHER_FIELD: FusionOptions = { pool: (duel) => [...monsters(duel, "you"), ...monsters(duel, "rival")].filter((id) => duel.cards[id]!.face === "up") };

const ritualFrom = (mode: RitualOptions["mode"], graveyard: boolean): RitualOptions => ({
	monsters: (duel, player) => duel.piles[player].hand.filter((id) => duel.defs[duel.cards[id]!.code]?.facts?.frame === "ritual"),
	pool: (duel, player) => [...duel.piles[player].hand, ...monsters(duel, player), ...(graveyard ? duel.piles[player].graveyard : [])],
	mode,
	whole: (_duel, card) => card.code === "whole-tribute",
});

export function summonCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => {
		log.push(code);
		return duel;
	};
	const plain = (code: string, level: number, more: CardDef["facts"] = {}): CardDef => ({ code, kind: "monster", facts: { level, atk: level * 300, def: level * 200, ...more } });
	const fusionSpell = (code: string, options: FusionOptions, kind: CardDef["kind"] = "spell"): CardDef => ({
		code,
		kind,
		effects: [{ type: "activation", categories: ["summon"], condition: (duel, { player }) => canFusionSummon(duel, player, options), operation: (duel, link) => fusionSummon(duel, link.player, options) }],
	});
	const ritualSpell = (code: string, options: RitualOptions): CardDef => ({
		code,
		kind: "spell",
		effects: [{ type: "activation", categories: ["summon"], condition: (duel, { player }) => canRitualSummon(duel, player, options), operation: (duel, link) => ritualSummon(duel, link.player, options) }],
	});
	const cards: CardDef[] = [
		plain("lv1", 1),
		plain("lv2", 2),
		plain("lv3", 3),
		plain("lv4", 4),
		plain("lv4-b", 4),
		plain("lv5", 5),
		plain("lv6", 6),
		plain("lv7", 7),
		plain("lv8", 8),
		plain("dragon-3", 3),
		plain("tuner-1", 1, { tuner: true }),
		plain("tuner-2", 2, { tuner: true }),
		plain("tuner-3", 3, { tuner: true }),
		plain("whole-tribute", 1),
		// "Cannot be Normal Summoned/Set." (a monster of the Main Deck with that restriction)
		{ code: "no-normal", kind: "monster", facts: { level: 4, atk: 1900 }, summon: { cannotBeNormalSummoned: true } },
		// "Special Summon 1 monster from your hand." (a Spell)
		{
			code: "hand-summon",
			kind: "spell",
			effects: [
				{
					type: "activation",
					categories: ["summon"],
					condition: (duel, { player }) => duel.piles[player].hand.some((id) => canSpecialSummon(duel, player, id)),
					operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].hand.filter((id) => canSpecialSummon(duel, link.player, id)), (board, picked) => askSpecialSummon(board, link.player, picked)),
				},
			],
		},
		// "You can Special Summon this card (from your hand)": a built-in Special Summon.
		{ code: "cyber", kind: "monster", facts: { level: 5, atk: 2100, def: 1600 }, builtInSummon: { how: "special" } },
		// A card that writes every event it sees in the log (its "trigger" never activates).
		{ code: "spy", kind: "spell", effects: [{ type: "trigger", range: "field", event: (_duel, event) => (describe(event) && log.push(describe(event)!), false), operation: (duel) => duel }] },
		// "FLIP: ..." (mandatory, so it goes on a chain by itself).
		{ code: "flipper", kind: "monster", facts: { level: 2, atk: 300 }, effects: [{ type: "trigger", mandatory: true, event: (_duel, event, { card }) => event.type === "flipped" && event.card.id === card.id, operation: logs("flipper") }] },
		// "When a monster is Summoned" (mandatory).
		{ code: "summon-watcher", kind: "monster", facts: { level: 4 }, effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "summoned", operation: logs("summon-watcher") }] },
		// "When a monster(s) would be Summoned: negate the Summon, and if you do, destroy it." (a Counter Trap)
		{ code: "warning", kind: "counter-trap", effects: [{ type: "activation", answersSummon: true, condition: (duel) => duel.chain.length === 0 && summonNegatable(duel), operation: (duel) => (log.push("warning"), negateSummonAndDestroy(duel)) }] },
		// A Quick-Play Spell with nothing to do with Summons, to make a chain with.
		{ code: "filler", kind: "quick-play", effects: [{ type: "activation", operation: logs("filler") }] },
		// "Target 1 face-up monster: change it to face-down Defense Position." / "Flip all your face-down monsters face-up." / "Change its battle position."
		{ code: "book", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...monsters(duel, "you"), ...monsters(duel, "rival")].filter((id) => duel.cards[id]!.face === "up"), operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => flipFaceDown(next, card.id), duel) }] },
		{ code: "light", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => monsters(duel, link.player).reduce((next, id) => flipFaceUp(next, id), duel) }] },
		{ code: "switch", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...monsters(duel, "you"), ...monsters(duel, "rival")].filter((id) => duel.cards[id]!.face === "up"), operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => changePosition(next, card.id), duel) }] },
		// "Target 1 monster in either GY; Special Summon it." (Monster Reborn's shape)
		{
			code: "reborn",
			kind: "spell",
			effects: [
				{
					type: "activation",
					categories: ["summon"],
					target: (duel, { player }) => [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard].filter((id) => isMonster(duel, id) && canSpecialSummon(duel, player, id)),
					operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => askSpecialSummon(next, link.player, card.id), duel),
				},
			],
		},
		// Synchro Monsters: a generic one per Level, and one that asks for Dragon non-Tuners.
		{ code: "synchro-5", kind: "monster", facts: { frame: "synchro", level: 5, atk: 2200, def: 1500 }, procedure: { kind: "synchro" } },
		{ code: "synchro-6", kind: "monster", facts: { frame: "synchro", level: 6, atk: 2400, def: 1800 }, procedure: { kind: "synchro" } },
		{ code: "synchro-7", kind: "monster", facts: { frame: "synchro", level: 7, atk: 2600, def: 2000 }, procedure: { kind: "synchro" } },
		{ code: "synchro-dragon-5", kind: "monster", facts: { frame: "synchro", level: 5, atk: 2300 }, procedure: { kind: "synchro", nonTuner: codeIs("dragon-3") } },
		// "(Quick Effect): You can Synchro Summon using this card you control as material." (Formula Synchron's shape)
		{
			code: "quick-tuner",
			kind: "monster",
			facts: { level: 2, tuner: true, atk: 200 },
			effects: [
				{
					type: "quick",
					range: "field",
					once: { scope: "instance" },
					condition: (duel, { player, card }) => duel.piles[player].extra.some((id) => canSummonByEffect(duel, player, id, [card.id])),
					operation: (duel, link, index) =>
						ask(duel, link.player, duel.piles[link.player].extra.filter((id) => canSummonByEffect(duel, link.player, id, [link.card.id])), (board, picked) => summonByEffect(board, index, link.player, picked, [link.card.id])),
				},
			],
		},
		// "Immediately after this effect resolves, Normal Summon 1 monster." (a Quick-Play Spell, so it works in either turn)
		{
			code: "extra-summon",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					condition: (duel, { player }) => duel.piles[player].hand.some((id) => canSummonByEffect(duel, player, id)),
					operation: (duel, link, index) => ask(duel, link.player, duel.piles[link.player].hand.filter((id) => canSummonByEffect(duel, link.player, id)), (board, picked) => summonByEffect(board, index, link.player, picked)),
				},
			],
		},
		// Xyz Monsters: "2 Level 4 monsters", with "Once per turn: You can detach 1 material from this card" (an Ignition Effect).
		{
			code: "xyz-4",
			kind: "monster",
			facts: { frame: "xyz", rank: 4, atk: 2500, def: 2000 },
			procedure: { kind: "xyz" },
			effects: [{ type: "ignition", once: { scope: "instance" }, cost: (duel, { card }) => detach(duel, card.id), operation: logs("xyz-4") }],
		},
		// "3 Level 4 monsters. You can also Xyz Summon this card by using a Rank 4 Xyz Monster you control as material. (Transfer its materials to this card.)"
		{
			code: "xyz-4-up",
			kind: "monster",
			facts: { frame: "xyz", rank: 4, atk: 2800, def: 2500 },
			procedure: { kind: "xyz", materials: { min: 3 }, alternatives: [{ materials: { min: 1, filter: (duel, card) => duel.defs[card.code]?.facts?.rank === 4 }, transfer: true }] },
		},
		// The same without the transfer, and only while it has a material (a condition on the alternative way).
		{
			code: "xyz-4-plain-up",
			kind: "monster",
			facts: { frame: "xyz", rank: 4, atk: 2700 },
			procedure: { kind: "xyz", materials: { min: 3 }, alternatives: [{ materials: { min: 1, filter: (duel, card) => duel.defs[card.code]?.facts?.rank === 4 && materialsOf(duel, card.id).length > 0 } }] },
		},
		// Link Monsters.
		{ code: "link-2", kind: "monster", facts: { frame: "link", link: 2, arrows: ["bottom-left", "bottom-right"], atk: 1800 }, procedure: { kind: "link", materials: { min: 2 } } },
		{ code: "link-3", kind: "monster", facts: { frame: "link", link: 3, arrows: ["left", "bottom", "right"], atk: 2300 }, procedure: { kind: "link", materials: { min: 2 } } },
		// "2 Level 4 or lower monsters" (a filter on the Link Materials).
		{ code: "link-2-low", kind: "monster", facts: { frame: "link", link: 2, arrows: ["left", "right"], atk: 1500 }, procedure: { kind: "link", materials: { min: 2, filter: (duel, card) => (duel.defs[card.code]?.facts?.level ?? 99) <= 4 } } },
		// Fusion Monsters: "lv4 + lv3", "2+ monsters with different names", and a contact Fusion ("banish the above cards you control").
		{ code: "fusion-43", kind: "monster", facts: { frame: "fusion", level: 7, atk: 2600, def: 2000 }, procedure: { kind: "fusion", materials: [{ min: 1, max: 1, filter: codeIs("lv4") }, { min: 1, max: 1, filter: codeIs("lv3") }] } },
		{
			code: "fusion-many",
			kind: "monster",
			facts: { frame: "fusion", level: 8, atk: 3000 },
			procedure: { kind: "fusion", materials: [{ min: 2, max: 3 }], check: (_duel, cards) => new Set(cards.map((card) => card.code)).size === cards.length },
		},
		{ code: "contact", kind: "monster", facts: { frame: "fusion", level: 6, atk: 2400 }, procedure: { kind: "fusion", materials: [{ min: 1, max: 1, filter: codeIs("lv4") }, { min: 1, max: 1, filter: codeIs("lv2") }], contact: { to: "banished" } } },
		fusionSpell("poly", FROM_HAND_OR_FIELD),
		fusionSpell("deck-fusion", FROM_DECK),
		fusionSpell("grave-fusion", FROM_GRAVEYARD),
		fusionSpell("super-poly", FROM_EITHER_FIELD, "quick-play"),
		// Ritual: a Level 8 Ritual Monster, and Ritual Spells worded "equal", "equal or exceed", and "equal or exceed" that may also banish from the GY.
		{ code: "ritual-8", kind: "monster", facts: { frame: "ritual", level: 8, atk: 2800, def: 2400 }, procedure: { kind: "ritual" } },
		ritualSpell("rite-equal", ritualFrom("equal", false)),
		ritualSpell("rite-exceed", ritualFrom("at-least", false)),
		ritualSpell("rite-grave", ritualFrom("at-least", true)),
		// Pendulum Monsters: Scales 1 and 8, and a Level 4 one to Summon.
		...(["scale-1", "scale-8", "scale-9", "pend-4"] as const).map(
			(code): CardDef => ({ code, kind: "monster", facts: { level: code === "pend-4" ? 4 : 7, atk: 1000, pendulum: { scale: code === "scale-1" ? 1 : code === "scale-8" ? 8 : code === "scale-9" ? 9 : 4 } }, effects: [{ type: "activation", operation: (duel) => duel }] }),
		),
		// "Neither player can Special Summon monsters." / "You cannot Summon lv4." (Continuous Spells)
		{ code: "no-special", kind: "spell", effects: [{ type: "activation", stays: true, operation: (duel) => duel }, { type: "continuous", modifies: () => [{ kind: "lock", what: "summon", who: "both", ways: ["special"] }], operation: (duel) => duel }] },
		{
			code: "no-lv4",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", modifies: (_duel, source) => [{ kind: "lock", what: "summon", who: source.controller, only: (_board, card) => card.code === "lv4" }], operation: (duel) => duel },
			],
		},
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}
