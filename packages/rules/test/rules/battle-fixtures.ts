import { addModifier, type CardDef, type DamageStep, type Duel, type EffectRecord, moveCard, moveCards } from "../../src";
import { continuousCards } from "./continuous-fixtures";
import { play, REAL_CARDS } from "./fixtures";

/** Passes until the attack in progress reaches the Damage Step timing `step` (or is over: `null`). */
export function toStep(duel: Duel, step: DamageStep | null): Duel {
	let next = duel;
	for (let guard = 0; guard < 30 && (next.battle?.step ?? null) !== step; guard++) next = play(next, "pass");
	return next;
}

/**
 * Made-up cards for the battle tests (step 6b), with the step 6 ones (`big` 2000/1000, `small` 600/300, `huge` 3000/2500, `blank`
 * 0/0) and the real cards. Not registered in CARD_SOURCES. Each logging card writes in `log` when its effect is applied.
 */
export function battleCards(log: string[] = []): Record<string, CardDef> {
	const logs = (text: string): EffectRecord["operation"] => (duel) => (log.push(text), duel);
	/** "At the <step> of the Damage Step": a mandatory trigger of a face-up monster. */
	const at = (step: DamageStep): CardDef => ({
		code: `at-${step}`,
		kind: "monster",
		facts: { level: 4, atk: 0, def: 3000 },
		effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "damage-step" && event.step === step, operation: logs(`at-${step}`) }],
	});
	const cards: CardDef[] = [
		{ code: "even", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
		// Normal Traps: one that does nothing, one that sends its controller's monsters to the Graveyard, one that Special Summons a monster from the hand.
		{ code: "plain-trap", kind: "trap", effects: [{ type: "activation", operation: logs("plain-trap") }] },
		{ code: "vanish", kind: "trap", effects: [{ type: "activation", operation: (duel, link) => moveCards(duel, duel.piles[link.player].monster, { zone: "graveyard" }) }] },
		{
			code: "reinforce",
			kind: "trap",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
						const id = duel.piles[link.player].hand.find((held) => duel.defs[duel.cards[held]!.code]?.kind === "monster");
						return id === undefined ? duel : moveCard(duel, id, { zone: "monster", face: "up" });
					},
				},
			],
		},
		// A hand monster with a Quick Effect that changes nothing on the field (discarded as its cost).
		{ code: "hand-quick", kind: "monster", effects: [{ type: "quick", range: "hand", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: logs("hand-quick") }] },
		// A monster with a Quick Effect on the field: "this card gains 1000 ATK until the end of this turn" (it directly changes ATK).
		{
			code: "pump",
			kind: "monster",
			facts: { level: 4, atk: 1500, def: 1000 },
			effects: [
				{
					type: "quick",
					categories: ["change-atk"],
					operation: (duel, link) => {
						const card = duel.cards[link.card.id]!;
						return card.moves === link.card.moves ? addModifier(duel, { affects: { card: card.id, moves: card.moves }, until: duel.turn.number, layer: { kind: "add", stat: "atk", by: 1000 } }) : duel;
					},
				},
			],
		},
		at("start"),
		at("before"),
		at("after"),
		at("end"),
		// "FLIP:"-like: a mandatory trigger when this card is flipped face-up.
		{ code: "flip-watcher", kind: "monster", facts: { level: 3, atk: 500, def: 1800 }, effects: [{ type: "trigger", mandatory: true, event: (_duel, event, { card }) => event.type === "flipped" && event.card.id === card.id, operation: logs("flip") }] },
		// "When this card battles": a mandatory trigger once it reached damage calculation.
		{
			code: "battle-watcher",
			kind: "monster",
			facts: { level: 4, atk: 2000, def: 0 },
			effects: [{ type: "trigger", mandatory: true, event: (_duel, event, { card }) => event.type === "battled" && (event.attacker.id === card.id || event.target?.id === card.id), operation: logs("battled") }],
		},
		// A Normal Trap: "Send the last monster you control to the GY" (one that is not the attack target, in the tests).
		{ code: "shed", kind: "trap", effects: [{ type: "activation", operation: (duel, link) => { const last = duel.piles[link.player].monster.at(-1); return last === undefined ? duel : moveCard(duel, last, { zone: "graveyard" }); } }] },
		// "When this card is destroyed by battle and sent to the GY: you can ...": an optional "when" trigger in the Graveyard.
		{
			code: "fallen-when",
			kind: "monster",
			facts: { level: 2, atk: 500, def: 500 },
			effects: [
				{
					type: "trigger",
					range: "graveyard",
					event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.reason === "destroyed" && event.by === "battle",
					operation: logs("fallen-when"),
				},
			],
		},
		// "If this card is destroyed by battle and sent to the GY": a mandatory trigger in the Graveyard.
		{
			code: "fallen",
			kind: "monster",
			facts: { level: 2, atk: 500, def: 500 },
			effects: [
				{
					type: "trigger",
					range: "graveyard",
					mandatory: true,
					timing: "if",
					event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.reason === "destroyed" && event.by === "battle",
					operation: logs("fallen"),
				},
			],
		},
	];
	return { ...REAL_CARDS, ...continuousCards(log), ...Object.fromEntries(cards.map((card) => [card.code, card])) };
}
