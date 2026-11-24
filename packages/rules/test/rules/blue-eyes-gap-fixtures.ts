import { addModifier, ask, askSetByEffect, atk, summonedCount, attackedNow, banishWhenItLeaves, battledNow, destroyedByBattleNow, canFusionSummon, canSetByEffect, type CardDef, type FusionOptions, fusionSummon, type CardInstance, destroyCard, drawCards, drewByEffect, type Duel, effectDestruction, negateActivation, negateEffect, type EffectRecord, flipFaceDown, FOREVER, fromActivated, fromOpponent, fromOtherCards, type GameEvent, canBeBanished, loseLp, negateCardEffects, other, type Link, moveCard, moveCards, specialSummon, targetsOf } from "../../src";

/**
 * Made-up cards for the mechanic gaps of the exact Blue-Eyes list (docs/rules-core/blue-eyes-gaps.md). None is a real card: every
 * code starts with `fixture-`, and none is registered in CARD_SOURCES. Each is shaped like the printed clause it stands for.
 */

const WHITE = "Fixture White Dragon";
const isWhite = (duel: Duel, card: CardInstance): boolean => duel.defs[card.code]?.facts?.name === WHITE;
/** 'A "Fixture White Dragon" is sent to your GY.' */
const whiteSentToMyGraveyard: NonNullable<EffectRecord["event"]> = (duel, event, { player }) => event.type === "moved" && event.after.zone === "graveyard" && event.before.zone !== "graveyard" && event.after.owner === player && isWhite(duel, event.after);
const sentCards = (events: readonly GameEvent[] | undefined): number[] => (events ?? []).flatMap((event) => (event.type === "moved" ? [event.after.id] : []));

/** "Using monsters from your hand or field, including a 'Fixture White Dragon'." */
const WITH_A_WHITE: FusionOptions = { pool: (duel, player) => [...duel.piles[player].hand, ...duel.piles[player].monster], check: (duel, cards) => cards.some((card) => isWhite(duel, card)) };

/** A Quick-Play Spell: "Target 1 monster on the field; [do something to it]." */
const aimed = (code: string, apply: (duel: Duel, link: Link, id: number) => Duel): CardDef => ({
	code,
	kind: "quick-play",
	effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => apply(next, link, card.id), duel) }],
});

export function gapCards(log: string[] = []): Record<string, CardDef> {
	/**
	 * 'If a "Fixture White Dragon" is sent to your GY: You can target 1 of them in the GY; Special Summon this card from your GY (if it
	 * was there when the monster was sent) or hand (even if not).' One record per place; "them" are the monsters of the trigger's events.
	 */
	const abyss = (range: "hand" | "graveyard"): EffectRecord => ({
		type: "trigger",
		range,
		timing: "if",
		once: { scope: "name", key: "fixture-abyss" },
		event: whiteSentToMyGraveyard,
		target: (duel, ctx) => sentCards(ctx.triggered).filter((id) => duel.cards[id]!.zone === "graveyard"),
		operation: (duel, link) => {
			log.push(`fixture-abyss after ${sentCards(link.triggered).map((id) => duel.cards[id]!.code).join("+")} > ${targetsOf(duel, link).map((card) => card.code).join("+")}`);
			return specialSummon(duel, link.player, link.card.id);
		},
	});
	const banner = (code: string, more: readonly EffectRecord[] = []): CardDef => ({
		code,
		kind: "spell",
		effects: [
			{ type: "activation", stays: true, operation: (duel) => duel },
			{ type: "continuous", affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller, modifies: () => [{ kind: "add", stat: "atk", by: 500 }] },
			{ type: "ignition", once: { scope: "instance" }, operation: (duel) => (log.push(code), duel) },
			...more,
		],
	});
	const white = (code: string): CardDef => ({ code, kind: "monster", facts: { name: WHITE, level: 8, atk: 3000, def: 2500, normal: true } });
	const cards: CardDef[] = [
		white("fixture-white"),
		white("fixture-white-b"),
		white("fixture-white-c"),
		{ code: "fixture-plain", kind: "monster", facts: { name: "Fixture Plain", level: 4, atk: 1000, def: 1000, normal: true } },
		{ code: "fixture-abyss", kind: "monster", facts: { name: "Fixture Abyss", level: 10, atk: 0, def: 0 }, effects: [abyss("hand"), abyss("graveyard")] },
		// A Quick-Play Spell: "Target 1 monster you control; send it to the GY."
		{ code: "fixture-bury", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player].monster, operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => moveCard(next, card.id, { zone: "graveyard" }), duel) }] },
		// A Quick-Play Spell: "Send all monsters you control to the GY" (at the same time).
		{ code: "fixture-bury-all", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, duel.piles[link.player].monster, { zone: "graveyard" }) }] },
		// A Normal Spell: "Add the top card of your Deck to your hand."
		{ code: "fixture-fetch", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, duel.piles[link.player].deck.slice(0, 1), { zone: "hand" }) }] },
		// "You can Special Summon this card from your hand, and if you do, its ATK becomes 3000, also banish it when it leaves the field."
		{
			code: "fixture-leaver",
			kind: "monster",
			facts: { name: "Fixture Leaver", level: 4, atk: 0, def: 0 },
			effects: [
				{
					type: "ignition",
					range: "hand",
					operation: (duel, link) => {
						const summoned = specialSummon(duel, link.player, link.card.id);
						const now = summoned.cards[link.card.id]!;
						if (now.zone !== "monster") return summoned;
						// Its own effect on itself: the ATK stops while its effects are negated (`own`); the banishment does not.
						return banishWhenItLeaves(addModifier(summoned, { affects: { card: now.id, moves: now.moves }, until: FOREVER, layer: { kind: "set", stat: "atk", to: 3000 }, by: link, own: true }), now.id, link);
					},
				},
			],
		},
		// Quick-Play Spells that each target 1 monster on the field: destroy it / return it to the hand / shuffle it into the Deck /
		// change it to face-down Defense Position.
		aimed("fixture-smite", (duel, link, id) => destroyCard(duel, id, { destruction: effectDestruction(link) })),
		aimed("fixture-bounce", (duel, link, id) => moveCard(duel, id, { zone: "hand", effect: link })),
		aimed("fixture-spin", (duel, link, id) => moveCard(duel, id, { zone: "deck", effect: link })),
		aimed("fixture-book", (duel, _link, id) => flipFaceDown(duel, id)),
		// An Xyz Monster: "2 Level 4 monsters".
		{ code: "fixture-xyz-4", kind: "monster", facts: { name: "Fixture Xyz", frame: "xyz", rank: 4, atk: 2000, def: 2000 }, procedure: { kind: "xyz" } },
		// A Normal Spell: "[Log.] You cannot draw cards by card effects the turn you activate this card."
		{
			code: "fixture-prosper",
			kind: "spell",
			effects: [
				{
					type: "activation",
					// Not an effect: a condition of the activation (it cannot be activated in a turn its player already drew by a card effect) ...
					condition: (duel, { player }) => !drewByEffect(duel, player),
					// ... and a restriction from the moment it is activated.
					oath: (_duel, { player }) => [{ kind: "lock", what: "draw", who: player }],
					operation: (duel) => (log.push("fixture-prosper"), duel),
				},
			],
		},
		// A Quick-Play Spell: "Draw 1 card."
		{ code: "fixture-draw-quick", kind: "quick-play", effects: [{ type: "activation", requiresDraw: true, categories: ["draw"], operation: (duel, link) => drawCards(duel, link.player, 1) }] },
		// A Counter Trap: "When a Spell Card is activated: Negate the activation." / A Trap: "When a Spell Card is activated: Negate that effect."
		{ code: "fixture-negate-activation", kind: "counter-trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, link) => (link.answers === null ? duel : negateActivation(duel, link.answers)) }] },
		{ code: "fixture-negate-the-effect", kind: "trap", effects: [{ type: "activation", condition: (duel) => duel.chain.length > 0, operation: (duel, link) => (link.answers === null ? duel : negateEffect(duel, link.answers)) }] },
		// "If this card is Normal Summoned: You can Set 1 Spell/Trap from your Deck."
		{
			code: "fixture-setter",
			kind: "monster",
			facts: { name: "Fixture Setter", level: 4, atk: 1600, def: 0 },
			effects: [
				{
					type: "trigger",
					timing: "if",
					event: (_duel, event, { card }) => event.type === "summoned" && event.how === "normal" && event.card.id === card.id,
					condition: (duel, { player }) => duel.piles[player].deck.some((id) => canSetByEffect(duel, player, id)),
					operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].deck.filter((id) => canSetByEffect(duel, link.player, id)), (board, picked) => askSetByEffect(board, link.player, picked, { effect: link })),
				},
			],
		},
		// A Quick-Play Spell: "[Log.]" and "During your Main Phase: You can Set this card from your GY."
		{
			code: "fixture-reset-quick",
			kind: "quick-play",
			effects: [
				{ type: "activation", operation: (duel) => (log.push("fixture-reset-quick"), duel) },
				{ type: "ignition", range: "graveyard", once: { scope: "name" }, condition: (duel, { player, card }) => canSetByEffect(duel, player, card.id), operation: (duel, link) => askSetByEffect(duel, link.player, link.card.id, { effect: link }) },
			],
		},
		// A Normal Trap, a Normal Spell and a Field Spell that only log.
		{ code: "fixture-trap", kind: "trap", effects: [{ type: "activation", operation: (duel) => (log.push("fixture-trap"), duel) }] },
		{ code: "fixture-spell", kind: "spell", effects: [{ type: "activation", operation: (duel) => (log.push("fixture-spell"), duel) }] },
		{ code: "fixture-field", kind: "spell", facts: { name: "Fixture Field", icon: "field" }, effects: [{ type: "activation", operation: (duel) => duel }] },
		{ code: "fixture-field-b", kind: "spell", facts: { name: "Fixture Field B", icon: "field" }, effects: [{ type: "activation", operation: (duel) => duel }] },
		// A Fusion Monster: "2 monsters".
		{ code: "fixture-twin", kind: "monster", facts: { name: "Fixture Twin", frame: "fusion", level: 8, atk: 2800, def: 2000 }, procedure: { kind: "fusion", materials: [{ min: 2, max: 2 }] } },
		// A Normal Spell, in the GY: "You can banish this card from your GY; Fusion Summon 1 Fusion Monster from your Extra Deck, using
		// monsters from your hand or field, including a "Fixture White Dragon"."
		{
			code: "fixture-roar",
			kind: "spell",
			effects: [
				{
					type: "ignition",
					range: "graveyard",
					condition: (duel, { player }) => canFusionSummon(duel, player, WITH_A_WHITE),
					cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }),
					operation: (duel, link) => fusionSummon(duel, link.player, WITH_A_WHITE),
				},
			],
		},
		// A Quick-Play Spell: "Target 1 face-up card on the field; negate its effects, and if you do, banish it."
		{
			code: "fixture-drill",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					target: (duel, { card }) => (["monster", "spell", "field"] as const).flatMap((zone) => [...duel.piles.you[zone], ...duel.piles.rival[zone]]).filter((id) => id !== card.id && duel.cards[id]!.face === "up"),
					operation: (duel, link) => {
						const [target] = targetsOf(duel, link);
						if (!target) return duel;
						const negated = negateCardEffects(duel, target.id, duel.turn.number, link);
						// "And if you do": only a card whose effects were negated is banished.
						return negated === duel ? duel : moveCard(negated, target.id, { zone: "banished", effect: link });
					},
				},
			],
		},
		// A Continuous Spell: "Monsters you control gain 500 ATK." and "Once per turn: [log]."
		banner("fixture-banner"),
		// The same, "unaffected by other cards' effects".
		banner("fixture-banner-immune", [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromOtherCards }] }]),
		// A Normal Spell: "For the rest of this turn after this card resolves, any damage your opponent takes is halved."
		{ code: "fixture-halver", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => addModifier(duel, { affects: () => false, until: duel.turn.number, layer: { kind: "damage", who: other(link.player), halved: true }, by: link }) }] },
		// Quick-Play Spells: "Inflict 1000 (or 1025) damage to your opponent." / "Take 1000 damage."
		{ code: "fixture-burn", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => loseLp(duel, other(link.player), 1000) }] },
		{ code: "fixture-burn-odd", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => loseLp(duel, other(link.player), 1025) }] },
		{ code: "fixture-self-burn", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => loseLp(duel, link.player, 1000) }] },
		// A Normal Spell: "Banish 3 or 6 cards of your choice from your Extra Deck, face-down; [log how many]."
		{
			code: "fixture-pot",
			kind: "spell",
			effects: [
				{
					type: "activation",
					cost: { choose: { from: (duel, { player }) => duel.piles[player].extra, counts: [3, 6] }, pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "banished", face: "down" }) },
					operation: (duel, link) => (log.push(`fixture-pot ${duel.piles[link.player].banished.length}`), duel),
				},
			],
		},
		// A Quick-Play Spell with the same cost and a target chosen once it is paid: "Banish 1 card of your choice from your hand; target 1 monster in your GY ...".
		{
			code: "fixture-pot-aimed",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					cost: { choose: { from: (duel, { player, card }) => duel.piles[player].hand.filter((id) => id !== card.id), counts: [1] }, pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "banished" }) },
					target: (duel, { player }) => duel.piles[player].graveyard,
					operation: (duel, link) => (log.push(`fixture-pot-aimed > ${targetsOf(duel, link).map((card) => card.code).join("+")}`), duel),
				},
			],
		},
		// Extra Deck monsters that only fill the Extra Deck.
		...["a", "b", "c", "d", "e", "f", "g"].map((letter): CardDef => ({ code: `fixture-extra-${letter}`, kind: "monster", facts: { name: `Fixture Extra ${letter}`, frame: "fusion", level: 8, atk: 2000, def: 2000 } })),
		// "At the end of the Damage Step, if this card battled: You can [log]." In the Monster Zone if it was not destroyed by that
		// battle, in the GY or while banished if it was (one record per place).
		{
			code: "fixture-battler",
			kind: "monster",
			facts: { name: "Fixture Battler", level: 8, atk: 3400, def: 2900 },
			effects: (["field", "graveyard", "banished"] as const).map((range): EffectRecord => ({
				type: "trigger",
				range,
				timing: "if",
				event: (duel, event, { card }) => event.type === "damage-step" && event.step === "end" && battledNow(duel, card.id) && (range === "field") !== destroyedByBattleNow(duel, card.id),
				operation: (duel) => (log.push(`fixture-battler in ${range}`), duel),
			})),
		},
		// "At the end of the Damage Step, if this card attacked: You can [log]."
		{
			code: "fixture-attacker",
			kind: "monster",
			facts: { name: "Fixture Attacker", level: 8, atk: 2000, def: 2000 },
			effects: [{ type: "trigger", timing: "if", event: (duel, event, { card }) => event.type === "damage-step" && event.step === "end" && attackedNow(duel, card.id), operation: (duel) => (log.push("fixture-attacker"), duel) }],
		},
		// A 4000 ATK monster with no effect.
		{ code: "fixture-giant", kind: "monster", facts: { name: "Fixture Giant", level: 10, atk: 4000, def: 4000, normal: true } },
		// A Quick-Play Spell: "Target Spells/Traps on the field up to the number of Normal Monsters in your GY +1; destroy them."
		{
			code: "fixture-storm",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					target: (duel, { card }) => [...duel.piles.you.spell, ...duel.piles.rival.spell].filter((id) => id !== card.id),
					targetCount: (duel, { player }) => ({ min: 1, max: duel.piles[player].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.facts?.normal).length + 1 }),
					operation: (duel, link) => moveCards(duel, targetsOf(duel, link).map((card) => card.id), { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) }),
				},
			],
		},
		// "Unaffected by your opponent's activated effects."
		{
			code: "fixture-punisher",
			kind: "monster",
			facts: { name: "Fixture Punisher", level: 11, atk: 3500, def: 3500 },
			effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: (duel, by, target) => fromOpponent(duel, by, target) && fromActivated(duel, by) }] }],
		},
		// A Continuous Spell: "Monsters your opponent controls lose 500 ATK."
		{
			code: "fixture-curse",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: (_duel, target, source) => target.zone === "monster" && target.controller !== source.controller, modifies: () => [{ kind: "add", stat: "atk", by: -500 }] },
			],
		},
		// A Quick-Play Spell: "Target 1 monster on the field; it loses 1000 ATK until the end of this turn."
		aimed("fixture-weaken", (duel, link, id) => addModifier(duel, { affects: { card: id, moves: duel.cards[id]!.moves }, until: duel.turn.number, layer: { kind: "add", stat: "atk", by: -1000 }, by: link })),
		// "Your opponent cannot banish cards from your GY."
		{
			code: "fixture-guardian",
			kind: "monster",
			facts: { name: "Fixture Guardian", level: 12, atk: 3500, def: 4000 },
			effects: [{ type: "continuous", modifies: (_duel, source) => [{ kind: "lock", what: "banish-from-graveyard", who: source.controller, banisher: "opponent" }] }],
		},
		// A Quick-Play Spell: "Target 1 card in either GY; banish it."
		{
			code: "fixture-crow",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					target: (duel, { player }) => [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard].filter((id) => canBeBanished(duel, id, player)),
					operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => moveCard(next, card.id, { zone: "banished", effect: link }), duel),
				},
			],
		},
		// Synchro Monsters: "1 Tuner + 1+ non-Tuner monsters", the second one "Must be Synchro Summoned."
		{ code: "fixture-synchro", kind: "monster", facts: { name: "Fixture Synchro", frame: "synchro", level: 8, atk: 2500, def: 2000 }, procedure: { kind: "synchro" } },
		{ code: "fixture-must-synchro", kind: "monster", facts: { name: "Fixture Must Synchro", frame: "synchro", level: 8, atk: 4000, def: 4000 }, procedure: { kind: "synchro" }, summon: { onlyByOwnProcedure: true } },
		// An Xyz Monster: "2 Level 12 monsters. During the turn, or turn after, your opponent Special Summoned 2 or more monsters from the
		// Extra Deck, you can also Xyz Summon this card by using 1 monster you control with the highest ATK (your choice, if tied).
		// (Transfer its materials.) If you do, you cannot Normal or Special Summon for the rest of this turn."
		{
			code: "fixture-typhon",
			kind: "monster",
			facts: { name: "Fixture Typhon", frame: "xyz", rank: 12, atk: 2900, def: 2900 },
			procedure: {
				kind: "xyz",
				alternatives: [
					{
						condition: (duel, { player }) => [duel.turn.number, duel.turn.number - 1].some((turn) => summonedCount(duel, { player: other(player), turn, from: "extra", how: "special" }) >= 2),
						materials: { min: 1, filter: (duel, card, { player }) => card.face === "up" && duel.piles[player].monster.every((id) => duel.cards[id]!.face !== "up" || atk(duel, id) <= atk(duel, card.id)) },
						transfer: true,
						ifYouDo: (duel, { player }) => addModifier(duel, { affects: () => false, until: duel.turn.number, layer: { kind: "lock", what: "summon", who: player, ways: ["normal", "special"] } }),
					},
				],
			},
		},
		// "If your opponent adds a card(s) from their Deck to their hand: You can ..." (on the field).
		{
			code: "fixture-watcher",
			kind: "monster",
			facts: { name: "Fixture Watcher", level: 4, atk: 1000, def: 1000 },
			effects: [{ type: "trigger", timing: "if", event: (_duel, event, { player }) => event.type === "added-to-hand" && event.from === "deck" && event.card.owner !== player, operation: (duel) => (log.push("fixture-watcher"), duel) }],
		},
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}
