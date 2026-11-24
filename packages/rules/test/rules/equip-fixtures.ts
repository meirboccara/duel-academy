import {
	ask,
	askEquipMonster,
	type CardDef,
	type CardInstance,
	canEquipMonster,
	cardTypeOf,
	type Duel,
	type EffectRecord,
	equipsOf,
	fromOtherCards,
	type FusionOptions,
	fusionSummon,
	canFusionSummon,
	fromSpells,
	moveCard,
	type Side,
	targetsOf,
} from "../../src";

/**
 * Made-up cards for step 11's monsters treated as Equip Cards (test/rules/monster-equips.test.ts). None is a real card: every code
 * starts with `fixture-`, and none is registered in CARD_SOURCES. Their wording follows the two cards of the exact Blue-Eyes list that
 * use the mechanic (Wishes for Eyes of Blue, Blue-Eyes Tyrant Dragon), with made-up names.
 */
export const WHITE_DRAGON = "Fixture White Dragon";

export function equipCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => (log.push(code), duel);
	const named = (duel: Duel, card: CardInstance, name: string) => duel.defs[card.code]?.facts?.name === name;
	const faceUpMonsters = (duel: Duel, side: Side) => duel.piles[side].monster.filter((id) => duel.cards[id]!.face === "up");
	const whiteDragons = (duel: Duel, side: Side) => faceUpMonsters(duel, side).filter((id) => named(duel, duel.cards[id]!, WHITE_DRAGON));
	/** The "Fixture Eyes" monsters of the player's Extra Deck that could be equipped to `monster` now. */
	const eyesInExtra = (duel: Duel, side: Side, monster: number) => duel.piles[side].extra.filter((id) => duel.defs[duel.cards[id]!.code]?.facts?.archetypes?.includes("Fixture Eyes") && canEquipMonster(duel, side, id, monster));
	const HAND_OR_FIELD: FusionOptions = { pool: (duel, player) => [...duel.piles[player].hand, ...duel.piles[player].monster] };
	const isFusion = (duel: Duel, id: number) => duel.defs[duel.cards[id]!.code]?.facts?.frame === "fusion";
	const cards: CardDef[] = [
		{ code: "fixture-white-dragon", kind: "monster", facts: { name: WHITE_DRAGON, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, normal: true } },
		{ code: "fixture-vanilla", kind: "monster", facts: { name: "Fixture Vanilla", attribute: "EARTH", monsterType: "Warrior", level: 4, atk: 1500, def: 1000, normal: true } },
		{ code: "fixture-little-dragon", kind: "monster", facts: { name: "Fixture Little Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1200, def: 1000, normal: true } },
		// An Effect Monster with nothing to it but being one (a target for Effect Veiler).
		{ code: "fixture-effect-dragon", kind: "monster", facts: { name: WHITE_DRAGON, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, effect: true } },
		// A "Fixture Eyes" Fusion Monster: "All monsters you control gain 500 ATK."
		{
			code: "fixture-eyes-fusion",
			kind: "monster",
			facts: { name: "Fixture Eyes Twin Dragon", attribute: "LIGHT", monsterType: "Dragon", archetypes: ["Fixture Eyes"], frame: "fusion", level: 10, atk: 3000, def: 2500 },
			procedure: { kind: "fusion", materials: [{ min: 2, max: 2, filter: (duel, card) => named(duel, card, WHITE_DRAGON) }] },
			effects: [{ type: "continuous", modifies: () => [{ kind: "add", stat: "atk", by: 500 }], affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller }],
		},
		// A "Fixture Eyes" Synchro Monster with no effect.
		{ code: "fixture-eyes-synchro", kind: "monster", facts: { name: "Fixture Eyes Spirit", attribute: "LIGHT", monsterType: "Dragon", archetypes: ["Fixture Eyes"], frame: "synchro", level: 9, atk: 2500, def: 3000 }, procedure: { kind: "synchro" } },
		// "Target 1 "Fixture White Dragon" you control; equip 1 "Fixture Eyes" monster from your Extra Deck to it as an Equip Spell that
		// gives it 400 ATK." (Wishes for Eyes of Blue's second effect, as a Normal Spell.)
		{
			code: "fixture-prayer",
			kind: "spell",
			facts: { name: "Fixture Prayer" },
			effects: [
				{
					type: "activation",
					target: (duel, { player }) => whiteDragons(duel, player).filter((id) => eyesInExtra(duel, player, id).length > 0),
					operation: (duel, link) => {
						const target = targetsOf(duel, link)[0];
						if (!target || target.zone !== "monster" || target.face !== "up") return duel;
						return ask(duel, link.player, eyesInExtra(duel, link.player, target.id), (board, picked) =>
							askEquipMonster(board, link.player, picked, target.id, { by: link, gives: [{ kind: "add", stat: "atk", by: 400 }] }),
						);
					},
				},
			],
		},
		// "Target 1 face-up monster your opponent controls; equip it to this card." (a monster of the field becomes an Equip Card, with no effect given.)
		{
			code: "fixture-absorber",
			kind: "monster",
			facts: { name: "Fixture Absorber", attribute: "DARK", monsterType: "Spellcaster", level: 4, atk: 1000, def: 1000 },
			effects: [
				{
					type: "ignition",
					target: (duel, { player, card }) => faceUpMonsters(duel, player === "you" ? "rival" : "you").filter((id) => canEquipMonster(duel, player, id, card.id)),
					operation: (duel, link) => {
						const target = targetsOf(duel, link)[0];
						return target ? askEquipMonster(duel, link.player, target.id, link.card.id, { by: link }) : duel;
					},
				},
			],
		},
		// A monster with an effect it can use while it is an Equip Card (a Union monster's kind of effect): "While this card is equipped to a monster: you can ...".
		{
			code: "fixture-union",
			kind: "monster",
			facts: { name: "Fixture Union", attribute: "LIGHT", monsterType: "Machine", archetypes: ["Fixture Eyes"], frame: "fusion", level: 5, atk: 1800, def: 1500 },
			procedure: { kind: "fusion", materials: [{ min: 2, max: 2 }] },
			effects: [{ type: "ignition", range: "equipped", operation: logs("fixture-union") }],
		},
		// "Unaffected by Spell effects."
		{
			code: "fixture-spell-proof",
			kind: "monster",
			facts: { name: WHITE_DRAGON, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500 },
			effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromSpells }] }],
		},
		// "Unaffected by other cards' effects."
		{
			code: "fixture-untouchable",
			kind: "monster",
			facts: { name: "Fixture Untouchable", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 1000, def: 1000 },
			effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromOtherCards }] }],
		},
		// A Continuous Spell already on the field: "Negate the effects of all other face-up Spells on the field."
		{
			code: "fixture-spell-negator",
			kind: "spell",
			facts: { name: "Fixture Spell Negator" },
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", modifies: () => [{ kind: "negate" }], affects: (duel, target, source) => target.id !== source.id && target.face === "up" && (target.zone === "spell" || target.zone === "field") && cardTypeOf(duel, target) === "spell" },
			],
		},
		// ""Fixture White Dragon" + 1 Dragon monster. Must first be either Fusion Summoned, or Special Summoned from your Extra Deck by
		// Tributing 1 "Fixture White Dragon" equipped with a Fusion Monster." (Blue-Eyes Tyrant Dragon's Summoning condition.)
		{
			code: "fixture-tyrant",
			kind: "monster",
			facts: { name: "Fixture Tyrant", attribute: "LIGHT", monsterType: "Dragon", frame: "fusion", level: 8, atk: 3400, def: 2900 },
			summon: { mustFirstBeProper: true },
			procedure: {
				kind: "fusion",
				materials: [
					{ min: 1, max: 1, filter: (duel, card) => named(duel, card, WHITE_DRAGON) },
					{ min: 1, max: 1, filter: (duel, card) => duel.defs[card.code]?.facts?.monsterType === "Dragon" },
				],
				alternatives: [{ how: "tribute", materials: [{ min: 1, max: 1, filter: (duel, card) => card.face === "up" && named(duel, card, WHITE_DRAGON) && equipsOf(duel, card.id).some((id) => isFusion(duel, id)) }] }],
			},
		},
		// A made-up Fusion Monster whose two ways accept the same card: "1 "Fixture White Dragon". Must first be Special Summoned (from your
		// Extra Deck) by banishing the above card you control, or by Tributing 1 "Fixture White Dragon" equipped with a Fusion Monster."
		{
			code: "fixture-two-ways",
			kind: "monster",
			facts: { name: "Fixture Two Ways", attribute: "LIGHT", monsterType: "Dragon", frame: "fusion", level: 8, atk: 3000, def: 2500 },
			procedure: {
				kind: "fusion",
				materials: [{ min: 1, max: 1, filter: (duel, card) => named(duel, card, WHITE_DRAGON) }],
				contact: { to: "banished" },
				alternatives: [{ how: "tribute", materials: [{ min: 1, max: 1, filter: (duel, card) => card.face === "up" && named(duel, card, WHITE_DRAGON) && equipsOf(duel, card.id).some((id) => isFusion(duel, id)) }] }],
			},
		},
		// An Xyz Pendulum Monster (an Extra Deck monster that can be placed in a Pendulum Zone).
		{ code: "fixture-pendulum-xyz", kind: "monster", facts: { name: "Fixture Pendulum Xyz", attribute: "LIGHT", monsterType: "Dragon", frame: "xyz", rank: 4, atk: 2000, def: 2000, pendulum: { scale: 3 } }, procedure: { kind: "xyz" }, effects: [{ type: "activation", operation: (duel) => duel }] },
		// A Level 10 Ritual Monster with no effect.
		{ code: "fixture-ritual", kind: "monster", facts: { name: "Fixture Ritual", attribute: "LIGHT", monsterType: "Dragon", frame: "ritual", level: 10, atk: 3000, def: 2500 } },
		// "Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field as material."
		{
			code: "fixture-polymerization",
			kind: "spell",
			facts: { name: "Fixture Polymerization" },
			effects: [{ type: "activation", condition: (duel, { player }) => canFusionSummon(duel, player, HAND_OR_FIELD), operation: (duel, link) => fusionSummon(duel, link.player, HAND_OR_FIELD) }],
		},
		// A card that writes in `log` each move that has a reason ("tributed", "destroyed", "material"), and for which Summon.
		{
			code: "fixture-spy",
			kind: "spell",
			facts: { name: "Fixture Spy" },
			effects: [
				{
					type: "trigger",
					event: (_duel, event) => {
						if (event.type === "moved" && event.reason) log.push(`${event.before.code} ${event.reason}${event.usedFor ? ` for ${event.usedFor}` : ""}`);
						return false;
					},
					operation: (duel) => duel,
				},
			],
		},
		// "You can send 1 Equip Card equipped to this card to the GY; (the effect is logged)." A cost that uses an equipped card.
		{
			code: "fixture-equip-eater",
			kind: "monster",
			facts: { name: WHITE_DRAGON, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500 },
			effects: [
				{
					type: "ignition",
					cost: { pick: (duel, { card }) => equipsOf(duel, card.id).map((id) => [id]), pay: (duel, _ctx, picked) => (picked.length === 1 ? moveCard(duel, picked[0]!, { zone: "graveyard" }) : null) },
					operation: logs("fixture-equip-eater"),
				},
			],
		},
		// Pendulum Monsters (Scales 1 and 8) with a Pendulum Effect that is logged, and "Fixture Eyes" so that the fixture Spell can equip one.
		...(["fixture-scale-1", "fixture-scale-8"] as const).map(
			(code): CardDef => ({
				code,
				kind: "monster",
				facts: { name: code, attribute: "LIGHT", monsterType: "Dragon", archetypes: ["Fixture Eyes"], level: 4, atk: 1000, def: 1000, pendulum: { scale: code === "fixture-scale-1" ? 1 : 8 } },
				effects: [
					{ type: "activation", operation: (duel) => duel },
					{ type: "ignition", range: "pendulum", operation: logs(code) },
				],
			}),
		),
	];
	return Object.fromEntries(cards.map((card) => [card.code, card]));
}
