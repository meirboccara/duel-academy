import type { Action } from "./action";
import { type Battle, type CardInstance, type CardRef, closedPriority, type DamageStep, type Duel, isStill, moveCard, moveCards, other, refOf, type Side } from "./duel";
import { type CardDef, type EffectRecord } from "./effects";
import { breakEffect, raiseEvent } from "./events";
import { loseLp } from "./life";
import { atk, attackLocked, def, spareDestruction } from "./modifiers";
import { triggerPoint } from "./triggers";

/**
 * Step 6b of docs/rules-core-spec.md: battle. Records in src/battle-sources.ts (RB10, Konami's Damage Step Rules and Fast Effect
 * Timing pages; two Japanese notes, OCG only).
 *
 * - In the Battle Phase, with the game state open, the turn player may declare an attack (`attack` action): an action that starts no
 *   chain (FET), after which the turn player, then the opponent, may respond. Each face-up Attack Position monster may declare one
 *   attack per turn (a card that moved is a new card). The first player cannot attack on the Duel's first turn. A direct attack
 *   only when the opponent has no monster.
 * - When both pass with no chain, the attack moves on: from the Battle Step to the Damage Step's start, before damage calculation
 *   (a face-down target is flipped face-up), after damage calculation (damage dealt, destruction decided, "battled", the target's
 *   flip raised now), end (the destroyed monsters go to the Graveyard), then back to the Battle Step. Each timing raises a
 *   `damage-step` event and is a trigger point, with the turn player first.
 * - Replay: if, before the Damage Step, the target has left or a new monster has come to the opponent's side, the attack stops and
 *   the turn player may attack again, with the same monster too (`Duel.replay`), or with another, or stop.
 * - ATK and DEF are read through step 6's queries at damage calculation (never a value frozen at declaration).
 * - In the Damage Step only Counter Trap Cards and effects that directly change ATK or DEF (`categories` "change-atk" /
 *   "change-def") can be activated, and only up to damage calculation (`damageStepAllows`).
 */

/** Effects that "directly change a monster's ATK or DEF" say so in their categories. */
export const CHANGES_ATK_DEF: readonly string[] = ["change-atk", "change-def"];

/**
 * May this effect be activated now, as far as the Damage Step goes? Outside the Damage Step, always. At its start and before damage
 * calculation: a Counter Trap Card, or an effect that directly changes ATK or DEF. After damage calculation and at its end: nothing
 * (RB10, record `damage-step-activation-limit`); trigger effects are put on a chain at the trigger point and are not listed here.
 */
export function damageStepAllows(duel: Duel, def: CardDef, effect: EffectRecord): boolean {
	const step = duel.battle?.step;
	if (step === undefined || step === "declared") return true;
	if (step === "after" || step === "end") return false;
	if (def.kind === "counter-trap" && effect.type === "activation") return true;
	return Array.isArray(effect.categories) && effect.categories.some((category) => CHANGES_ATK_DEF.includes(category));
}

/** Can the monster declare an attack now: face-up in Attack Position, its controller's, and not having attacked this turn (unless it is the one a replay lets attack again)? */
const mayAttack = (duel: Duel, card: CardInstance): boolean =>
	card.face === "up" && card.position === "attack" && (!duel.attacked.some((ref) => ref.id === card.id && ref.moves === card.moves) || (duel.replay?.id === card.id && duel.replay.moves === card.moves));

/**
 * The attacks the turn player can declare, in the Battle Phase with the game state open and nothing going on. `out`: where to list
 * them; returns whether there is one.
 */
export function attackActions(duel: Duel, out: Action[] | null): boolean {
	const { turn, priority } = duel;
	if (turn.phase !== "battle" || duel.battle || duel.chain.length > 0 || !priority.open || priority.holder !== turn.player || duel.summoning) return false;
	// RB10: the player who goes first cannot conduct their Battle Phase on their first turn (record `no-battle-first-turn`).
	if (turn.number === 1) return false;
	const defenders = duel.piles[other(turn.player)].monster;
	let found = false;
	for (const id of duel.piles[turn.player].monster) {
		if (!mayAttack(duel, duel.cards[id]!)) continue;
		// "Cannot attack" / "cannot attack directly" (a lock, src/modifiers.ts): the attack is not offered.
		if (attackLocked(duel, duel.cards[id]!, defenders.length === 0)) continue;
		if (!out) return true;
		found = true;
		if (defenders.length === 0) out.push({ type: "attack", card: id, target: null });
		else for (const target of defenders) out.push({ type: "attack", card: id, target });
	}
	return found;
}

/** The turn player declares an attack: no chain starts; the turn player, then the opponent, may respond. */
export function declareAttack(duel: Duel, id: number, target: number | null): Duel {
	const next = breakEffect(duel);
	const attacker = next.cards[id]!;
	const defenders = next.piles[other(attacker.controller)].monster.map((defender) => refOf(next.cards[defender]!));
	const battle: Battle = { attacker: refOf(attacker), target: target === null ? null : refOf(next.cards[target]!), defenders, step: "declared", destroyed: [], flipped: null };
	const declared = { ...next, battle, attacked: [...next.attacked.filter((ref) => ref.id !== id), refOf(attacker)], replay: null };
	const raised = raiseEvent(declared, { type: "attack-declared", attacker, target: target === null ? null : next.cards[target]! });
	return triggerPoint(raised, closedPriority(duel.turn.player));
}

/** Is the monster still on the field as the card it was, in the Monster Zone of `side`? */
const standing = (duel: Duel, ref: CardRef, side: Side): boolean => isStill(duel, ref) && duel.cards[ref.id]!.zone === "monster" && duel.cards[ref.id]!.controller === side;

/** Both players passed with no chain during an attack: it moves to its next timing. */
export function advanceBattle(duel: Duel): Duel {
	const battle = duel.battle!;
	const attackerSide = duel.turn.player;
	switch (battle.step) {
		case "declared": {
			// An attacker that has left the field, or is no longer in Attack Position, attacks no more.
			if (!standing(duel, battle.attacker, attackerSide) || duel.cards[battle.attacker.id]!.position !== "attack") return backToBattleStep(duel, null);
			const defenders = duel.piles[other(attackerSide)].monster;
			const targetGone = battle.target !== null && !standing(duel, battle.target, other(attackerSide));
			const newcomer = defenders.some((id) => !battle.defenders.some((ref) => ref.id === id && ref.moves === duel.cards[id]!.moves));
			// RB10 (records `replay-causes`, `replay`): the target removed, or a new monster on the opponent's side, before the Damage
			// Step. The turn player may attack with the same monster again, with another, or not at all.
			if (targetGone || newcomer) return backToBattleStep(duel, battle.attacker);
			return enter(duel, "start");
		}
		case "start":
			return enter(duel, "before", flipTarget);
		case "before":
			return damageCalculation(breakEffect(duel));
		case "after":
			return enter(duel, "end", sendDestroyed);
		case "end":
			return backToBattleStep(duel, null);
	}
}

/**
 * A timing of the Damage Step begins: what came before is no longer the last thing that happened; then what the timing does (`act`:
 * the flip, the destroyed monsters sent to the Graveyard) happens, so the triggers it causes, optional "when" ones too, go on a
 * chain at its trigger point, the turn player first.
 */
function enter(duel: Duel, step: DamageStep, act: (duel: Duel) => Duel = (same) => same): Duel {
	const next = act(breakEffect({ ...duel, battle: { ...duel.battle!, step } }));
	return triggerPoint(raiseEvent(next, { type: "damage-step", step }), closedPriority(duel.turn.player));
}

/** Raises the flip of the attack target flipped before damage calculation (its "when flipped" effects), once, if it is still that card. */
function raiseFlip(duel: Duel): Duel {
	const flipped = duel.battle?.flipped;
	if (!flipped || !isStill(duel, flipped)) return duel;
	return raiseEvent({ ...duel, battle: { ...duel.battle!, flipped: null } }, { type: "flipped", card: duel.cards[flipped.id]! });
}

/** Before damage calculation, a face-down attack target is flipped face-up in Defense Position; its flip is raised after damage calculation. */
function flipTarget(duel: Duel): Duel {
	const target = duel.battle!.target;
	if (!target || !isStill(duel, target) || duel.cards[target.id]!.face === "up") return duel;
	const flipped = moveCard(duel, target.id, { zone: "monster", face: "up", position: "defense" });
	return { ...flipped, battle: { ...flipped.battle!, flipped: refOf(flipped.cards[target.id]!) } };
}

/**
 * Damage calculation (RB10 tables): ATK against ATK, or against DEF, read now through step 6's queries. Damage is dealt and the
 * destruction decided, not done. A monster with 0 ATK destroys nothing (RB10). The monsters "battled". Then the timing after damage
 * calculation begins, and the flip of the target is raised.
 */
function damageCalculation(duel: Duel): Duel {
	const battle = duel.battle!;
	const attackerSide = duel.turn.player;
	const defenderSide = other(attackerSide);
	// A monster that left during the Damage Step does not battle: the attack ends with no damage calculation (the core's reading:
	// "battled" needs damage calculation, record `battled-needs-calc`). A target flipped face-up still has its flip raised.
	// An attacker no longer face-up in Attack Position can no longer attack: no damage calculation, the Damage Step ends (Konami's
	// Japanese Q&A on a Defense Position attacker whose permission is negated, record `defense-attacker-stops`, OCG only, applied by
	// analogy; no card of ours lets a monster attack in Defense Position yet).
	const attackerCard = duel.cards[battle.attacker.id]!;
	const canStillAttack = attackerCard.face === "up" && attackerCard.position === "attack";
	if (!standing(duel, battle.attacker, attackerSide) || !canStillAttack || (battle.target && !standing(duel, battle.target, defenderSide))) return enter(duel, "end", raiseFlip);
	const attacker = duel.cards[battle.attacker.id]!;
	const target = battle.target ? duel.cards[battle.target.id]! : null;
	const power = atk(duel, attacker.id);
	const destroyed: CardRef[] = [];
	let damage: { player: Side; amount: number } | null = null;
	if (!target) {
		damage = { player: defenderSide, amount: power };
	} else if (target.position === "attack") {
		const other = atk(duel, target.id);
		if (power > other) {
			destroyed.push(refOf(target));
			damage = { player: defenderSide, amount: power - other };
		} else if (power < other) {
			destroyed.push(refOf(attacker));
			damage = { player: attackerSide, amount: other - power };
		} else if (power > 0) {
			destroyed.push(refOf(attacker), refOf(target));
		}
	} else {
		const guard = def(duel, target.id);
		if (power > guard) destroyed.push(refOf(target));
		else if (power < guard) damage = { player: attackerSide, amount: guard - power };
	}
	// "Cannot be destroyed by battle" and "the first time it would be destroyed each turn": the monster is not destroyed; the damage stands.
	let protectedDuel = duel;
	const doomed = destroyed.filter((ref) => {
		const spared = spareDestruction(protectedDuel, ref.id, "battle", null);
		if (spared) protectedDuel = spared;
		return spared === null;
	});
	let next = raiseEvent({ ...protectedDuel, battle: { ...battle, destroyed: doomed } }, { type: "battled", attacker, target });
	if (damage && damage.amount > 0) next = raiseEvent(loseLp(next, damage.player, damage.amount), { type: "battle-damage", ...damage });
	if (next.winner) return { ...next, battle: null, priority: { holder: next.turn.player, passed: [], open: false } };
	const after = raiseEvent({ ...next, battle: { ...next.battle!, step: "after" as const } }, { type: "damage-step", step: "after" });
	return triggerPoint(raiseFlip(after), closedPriority(duel.turn.player));
}

/** At the end of the Damage Step, the monsters destroyed by battle go to the Graveyard, at the same time, if they are still there. */
function sendDestroyed(duel: Duel): Duel {
	const ids = duel.battle!.destroyed.filter((ref) => isStill(duel, ref) && duel.cards[ref.id]!.zone === "monster").map((ref) => ref.id);
	return moveCards(duel, ids, { zone: "graveyard", reason: "destroyed", by: "battle", destruction: { cause: "battle" } });
}

/** The attack is over (or replayed): back to the Battle Step, the game state open for the turn player. */
function backToBattleStep(duel: Duel, replay: CardRef | null): Duel {
	const next = breakEffect({ ...duel, battle: null, replay });
	return triggerPoint(next, { holder: duel.turn.player, passed: [], open: true });
}
