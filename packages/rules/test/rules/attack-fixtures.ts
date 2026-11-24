import { addModifier, attackAgain, type AttackAllowance, type CardDef, type Duel, moveCard, negateCardEffects, specialSummon, targetsOf } from "../../src";
import { battleCards } from "./battle-fixtures";

/**
 * Made-up cards for the attack permissions (extra attacks, direct attacks while the opponent controls monsters, attacks in Defense
 * Position). None is a real card: every code starts with `fixture-`, and none is registered in CARD_SOURCES. With them come the
 * battle fixtures (`big` 2000/1000, `small` 600/300, `huge` 3000/2500, `even` 1000/1000, `blank` 0/0, the Traps `vanish` and
 * `reinforce`).
 */
export function attackCards(log: string[] = []): Record<string, CardDef> {
	/** A monster whose Continuous Effect gives itself an attack permission. */
	const permitted = (code: string, atk: number, def: number, ...allows: AttackAllowance[]): CardDef => ({
		code,
		kind: "monster",
		facts: { name: code, level: 4, atk, def },
		effects: [{ type: "continuous", modifies: () => allows.map((allowance) => ({ kind: "attack" as const, allows: allowance })) }],
	});
	const allMonsters = (duel: Duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster];
	const cards: CardDef[] = [
		// "This card can make a second attack during each Battle Phase."
		permitted("fixture-twin", 2800, 2100, { what: "times", count: 2 }),
		// "This card can make up to 2 attacks on monsters during each Battle Phase."
		permitted("fixture-monster-twin", 3000, 2500, { what: "times", count: 2, monstersOnly: true }),
		// "This card can attack all monsters your opponent controls, once each."
		permitted("fixture-sweeper", 3400, 2900, { what: "all-monsters" }),
		// "This card can attack directly."
		permitted("fixture-direct", 1500, 1500, { what: "directly" }),
		// "This card can attack directly." and "can attack all monsters your opponent controls, once each" (Konami's Q&A fid 16016, case D).
		permitted("fixture-direct-sweeper", 2000, 0, { what: "directly" }, { what: "all-monsters" }),
		// "This card can attack while in face-up Defense Position. If it does, apply its DEF for damage calculation."
		permitted("fixture-wall", 0, 3300, { what: "in-defense" }),
		// A Continuous Spell: "Your monsters can attack while in face-up Defense Position (apply their DEF for damage calculation)."
		{
			code: "fixture-wall-field",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller, modifies: () => [{ kind: "attack", allows: { what: "in-defense" } }] },
			],
		},
		// "At the end of the Damage Step, if this card attacked: You can activate this effect; this card can attack again in a row. You
		// can use this effect of "fixture-again" twice per turn."
		{
			code: "fixture-again",
			kind: "monster",
			facts: { name: "fixture-again", level: 8, atk: 2500, def: 2000 },
			effects: [
				{
					type: "trigger",
					timing: "if",
					once: { scope: "name", times: 2 },
					event: (duel, event, { card }) => event.type === "damage-step" && event.step === "end" && duel.battle?.attacker.id === card.id,
					operation: (duel, link) => (log.push("fixture-again"), attackAgain(duel, link.card.id)),
				},
			],
		},
		// A Quick-Play Spell: "Target 1 monster you control; it can attack again in a row."
		{ code: "fixture-encore", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => attackAgain(board, card.id), duel) }] },
		// A Continuous Trap: "Monsters cannot attack directly." (the made-up `categories` lets a test activate it in the Damage Step)
		{
			code: "fixture-no-direct-trap",
			kind: "trap",
			effects: [
				{ type: "activation", stays: true, categories: ["change-atk"], operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: () => [{ kind: "lock", what: "attack-directly", who: "both" }] },
			],
		},
		// A Quick-Play Spell: "Target 1 face-up monster; negate its effects until the end of this turn." (it changes no ATK or DEF, so
		// the made-up `categories` lets a test activate it in the Damage Step, as Forbidden Droplet's ATK change does for the real card)
		{
			code: "fixture-silence",
			kind: "quick-play",
			effects: [{ type: "activation", categories: ["change-atk"], target: (duel) => allMonsters(duel).filter((id) => duel.cards[id]!.face === "up"), operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => negateCardEffects(board, card.id, board.turn.number, link), duel) }],
		},
		// A Quick-Play Spell: "Special Summon 1 monster from your hand." (a new monster on a side during the Battle Step)
		{
			code: "fixture-call",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => { const id = duel.piles[link.player].hand.find((held) => duel.defs[duel.cards[held]!.code]?.kind === "monster"); return id === undefined ? duel : specialSummon(duel, link.player, id); } }],
		},
		// A Quick-Play Spell: "Target 1 monster; it can attack directly this turn."
		{
			code: "fixture-open-path",
			kind: "quick-play",
			effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player].monster, operation: (duel, link) => targetsOf(duel, link).reduce((board, card) => addModifier(board, { affects: { card: card.id, moves: card.moves }, until: board.turn.number, by: link, layer: { kind: "attack", allows: { what: "directly" } } }), duel) }],
		},
		// Continuous Spells: "Your monsters can attack directly." / "Monsters cannot attack directly."
		{
			code: "fixture-path-field",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: (_duel, target, source) => target.zone === "monster" && target.controller === source.controller, modifies: () => [{ kind: "attack", allows: { what: "directly" } }] },
			],
		},
		{
			code: "fixture-no-direct-field",
			kind: "spell",
			effects: [
				{ type: "activation", stays: true, operation: (duel) => duel },
				{ type: "continuous", affects: () => false, modifies: () => [{ kind: "lock", what: "attack-directly", who: "both" }] },
			],
		},
		// Plain monsters with the values of Konami's Q&A fid 24407.
		{ code: "fixture-3500", kind: "monster", facts: { level: 8, atk: 3500, def: 0 } },
		{ code: "fixture-3300", kind: "monster", facts: { level: 8, atk: 3300, def: 0 } },
		// A Quick-Play Spell: "Send all monsters your opponent controls to the GY."
		{ code: "fixture-clear", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => duel.piles[link.player === "you" ? "rival" : "you"].monster.reduce((board, id) => moveCard(board, id, { zone: "graveyard" }), duel) }] },
	];
	return { ...battleCards(log), ...Object.fromEntries(cards.map((card) => [card.code, card])) };
}
