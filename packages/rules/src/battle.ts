import type { Action } from "./action";
import { type AttackMade, type Battle, type CardInstance, type CardRef, closedPriority, type DamageStep, type Duel, isStill, moveCard, moveCards, other, refOf, type Side } from "./duel";
import { type CardDef, type EffectRecord } from "./effects";
import { breakEffect, raiseEvent } from "./events";
import { loseLp } from "./life";
import { atk, type AttackAllowance, attackAllowances, attackLocked, def, spareDestruction } from "./modifiers";
import { triggerPoint } from "./triggers";

/**
 * Step 6b of docs/rules-core-spec.md: battle. Records in src/battle-sources.ts (RB10, Konami's Damage Step Rules and Fast Effect
 * Timing pages; two Japanese notes, OCG only) and src/attack-sources.ts (attack permissions: Konami's Japanese Q&A, OCG only).
 *
 * - In the Battle Phase, with the game state open, the turn player may declare an attack (`attack` action): an action that starts no
 *   chain (FET), after which the turn player, then the opponent, may respond. Each face-up Attack Position monster may declare one
 *   attack per turn (a card that moved is a new card). The first player cannot attack on the Duel's first turn. A direct attack
 *   only when the opponent has no monster.
 * - Attack permissions (`AttackAllowance`, a layer of src/modifiers.ts) widen this: more attacks ("a second attack", "up to 2 attacks
 *   on monsters", "all monsters your opponent controls, once each", "attack again in a row"), a direct attack while the opponent
 *   controls monsters, an attack in face-up Defense Position using DEF. Each is read when the attack is declared and again before the
 *   Damage Step; `Duel.attacked` keeps every attack of the turn.
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

/** What a monster may attack now: which of the opponent's monsters, and whether directly. */
interface AttackOptions {
	readonly monsters: readonly number[];
	readonly direct: boolean;
}

const NO_MONSTERS: readonly number[] = Object.freeze([]);
const sameCard = (ref: CardRef | null, card: CardInstance): boolean => ref !== null && ref.id === card.id && ref.moves === card.moves;
const allows = (allowances: readonly AttackAllowance[], what: AttackAllowance["what"]): boolean => allowances.some((allowance) => allowance.what === what);

/** May a monster in this position declare an attack: face-up in Attack Position, or in face-up Defense Position with the permission to? */
const inAttackingPosition = (card: CardInstance, allowances: readonly AttackAllowance[]): boolean => card.face === "up" && (card.position === "attack" || allows(allowances, "in-defense"));

/**
 * The attacks open to a monster after the attacks `prior` it has already made this turn (the one being replayed or checked left
 * out), or `null` when it has none. `current`: the attack being replayed or checked, when there is one. `again`: the attack is made
 * with an "attack again in a row" permission.
 *
 * - Its first attack, or one "again in a row": any of the opponent's monsters; directly when the opponent controls none, or with
 *   "can attack directly".
 * - Any other further attack needs a permission (`AttackAllowance`, src/modifiers.ts), read now: a number of attacks, or "all
 *   monsters, once each". Several `times` permissions do not add up: the widest applies (two "a second attack" still give two
 *   attacks). A `times` and an "all monsters" permission each open their own attacks, and the monster may make any of them.
 *
 * Konami's Japanese Q&A (OCG only; records `attack-all-once-each`, `attack-all-direct-or-monsters`): a monster that attacks all
 * monsters never attacks the same one twice, has no further attack once it declared a direct attack (even one replayed onto a
 * monster), and does not attack directly after it battled a monster. The same is applied to "up to 2 attacks on monsters"
 * (YGOProJudge only, asked 2026-11-24, no source cited).
 */
function attackOptions(duel: Duel, card: CardInstance, allowances: readonly AttackAllowance[], prior: readonly AttackMade[], current: AttackMade | null, again: boolean): AttackOptions | null {
	const defenders = duel.piles[other(card.controller)].monster;
	// "Cannot attack directly" (a lock) closes the direct attack only.
	const directOpen = (defenders.length === 0 || allows(allowances, "directly")) && !attackLocked(duel, card, true);
	if (prior.length === 0 || again) return defenders.length > 0 || directOpen ? { monsters: defenders, direct: directOpen } : null;
	const wentDirect = prior.some((made) => made.direct) || current?.direct === true;
	let monsters: readonly number[] = NO_MONSTERS;
	let direct = false;
	for (const allowance of allowances) {
		if (allowance.what === "times" && prior.length < allowance.count && !(allowance.monstersOnly && wentDirect)) {
			monsters = defenders;
			if (!allowance.monstersOnly) direct ||= directOpen;
		} else if (allowance.what === "all-monsters" && !wentDirect && monsters !== defenders) {
			const fresh = defenders.filter((id) => !prior.some((made) => sameCard(made.target, duel.cards[id]!)));
			monsters = monsters.length === 0 ? fresh : [...new Set([...monsters, ...fresh])];
		}
	}
	return monsters.length > 0 || direct ? { monsters, direct } : null;
}

/** The attacks this monster has declared this turn, as the card it is now. */
const attacksOf = (duel: Duel, card: CardInstance): AttackMade[] => duel.attacked.filter((made) => sameCard(made, card));

/**
 * What the monster can attack if it declares an attack now, or `null`: it must be face-up in a position it may attack in, not
 * locked ("cannot attack"), and have an attack left. A monster a replay lets attack again makes the same attack anew.
 */
function declarable(duel: Duel, card: CardInstance): AttackOptions | null {
	// "Cannot attack" (a lock, src/modifiers.ts): no attack is offered.
	if (card.face !== "up" || attackLocked(duel, card)) return null;
	const allowances = attackAllowances(duel, card.id);
	if (!inAttackingPosition(card, allowances)) return null;
	const mine = duel.attacked.length === 0 ? duel.attacked : attacksOf(duel, card);
	if (mine.length === 0) return attackOptions(duel, card, allowances, mine, null, false);
	// A replay: the attack is the same one, declared again (RB10, record `replay`).
	if (sameCard(duel.replay, card)) {
		const current = mine[mine.length - 1]!;
		return attackOptions(duel, card, allowances, mine.slice(0, -1), current, current.again === true);
	}
	return attackOptions(duel, card, allowances, mine, null, sameCard(duel.again, card));
}

/**
 * The attacks the turn player can declare, in the Battle Phase with the game state open and nothing going on. `out`: where to list
 * them; returns whether there is one.
 */
export function attackActions(duel: Duel, out: Action[] | null): boolean {
	const { turn, priority } = duel;
	if (turn.phase !== "battle" || duel.battle || duel.chain.length > 0 || !priority.open || priority.holder !== turn.player || duel.summoning) return false;
	// RB10: the player who goes first cannot conduct their Battle Phase on their first turn (record `no-battle-first-turn`).
	if (turn.number === 1) return false;
	let found = false;
	for (const id of duel.piles[turn.player].monster) {
		const options = declarable(duel, duel.cards[id]!);
		if (!options) continue;
		if (!out) return true;
		found = true;
		for (const target of options.monsters) out.push({ type: "attack", card: id, target });
		if (options.direct) out.push({ type: "attack", card: id, target: null });
	}
	return found;
}

/**
 * The turn player declares an attack: no chain starts; the turn player, then the opponent, may respond. The attack is noted in
 * `Duel.attacked`: a new one, or, for the monster a replay lets attack again, the same one with its new target. An "attack again in
 * a row" permission is used up by the monster that has it, and lost when another monster attacks ("in a row": YGOProJudge only,
 * asked 2026-11-24, no source cited). One granted during an attack that is then replayed is kept when the same monster makes that
 * attack again (the core's reading: a replayed attack is the same attack, record `replay`).
 */
export function declareAttack(duel: Duel, id: number, target: number | null): Duel {
	const next = breakEffect(duel);
	const attacker = next.cards[id]!;
	const defenders = next.piles[other(attacker.controller)].monster.map((defender) => refOf(next.cards[defender]!));
	const battle: Battle = { attacker: refOf(attacker), target: target === null ? null : refOf(next.cards[target]!), defenders, step: "declared", destroyed: [], flipped: null };
	let replayed = -1;
	if (sameCard(next.replay, attacker)) for (let i = next.attacked.length - 1; i >= 0 && replayed < 0; i--) if (sameCard(next.attacked[i]!, attacker)) replayed = i;
	const before = replayed < 0 ? null : next.attacked[replayed]!;
	const again = before ? before.again === true : sameCard(next.again, attacker);
	const made: AttackMade = { ...refOf(attacker), target: battle.target, direct: target === null || before?.direct === true, ...(again ? { again: true as const } : {}) };
	const attacked = before ? next.attacked.map((entry, index) => (index === replayed ? made : entry)) : [...next.attacked, made];
	// A replayed attack made again is the same attack: a permission granted during it is kept (it is used by the next attack).
	const declared = { ...next, battle, attacked, replay: null, again: before ? next.again : null };
	const raised = raiseEvent(declared, { type: "attack-declared", attacker, target: target === null ? null : next.cards[target]! });
	return triggerPoint(raised, closedPriority(duel.turn.player));
}

/**
 * "This card can attack again in a row": the monster may declare one more attack, as the next attack of this turn. Nothing happens
 * unless it is face-up in the Monster Zone; the permission ends when it is no longer that card (Konami's notes on Neo Blue-Eyes
 * Ultimate Dragon, OCG only: record `attack-again-while-face-up`). Nothing happens either unless it has declared an attack this turn,
 * as the card it is now: "again" follows an attack (the cards read "if this card attacked: ... it can attack again in a row"), so
 * the permission is never used up by the monster's first attack (the core's reading of the wording, no page read). For a card's
 * operation.
 */
export function attackAgain(duel: Duel, id: number): Duel {
	const card = duel.cards[id]!;
	return card.zone === "monster" && card.face === "up" && attacksOf(duel, card).length > 0 ? { ...duel, again: refOf(card) } : duel;
}

/** Is the monster still on the field as the card it was, in the Monster Zone of `side`? */
const standing = (duel: Duel, ref: CardRef, side: Side): boolean => isStill(duel, ref) && duel.cards[ref.id]!.zone === "monster" && duel.cards[ref.id]!.controller === side;

/** Both players passed with no chain during an attack: it moves to its next timing. */
export function advanceBattle(duel: Duel): Duel {
	const battle = duel.battle!;
	const attackerSide = duel.turn.player;
	switch (battle.step) {
		case "declared": {
			// An attacker that has left the field, or is no longer in a position it may attack in, attacks no more: the attack is over,
			// with no Damage Step (Konami's Japanese Q&A fid 23968, OCG only: record `defense-attack-negated-before-damage-step`).
			if (!standing(duel, battle.attacker, attackerSide)) return backToBattleStep(duel, null);
			const attacker = duel.cards[battle.attacker.id]!;
			const allowances = attackAllowances(duel, attacker.id);
			if (!inAttackingPosition(attacker, allowances)) return backToBattleStep(duel, null);
			// A second or later attack whose permission is gone (negated in the Battle Step) can no longer be made (fid 11046, record
			// `multi-attack-negated`).
			const mine = attacksOf(duel, attacker);
			const current = mine[mine.length - 1] ?? null;
			if (mine.length > 1 && attackOptions(duel, attacker, allowances, mine.slice(0, -1), current, current?.again === true) === null) return backToBattleStep(duel, null);
			const defenders = duel.piles[other(attackerSide)].monster;
			const targetGone = battle.target !== null && !standing(duel, battle.target, other(attackerSide));
			const newcomer = defenders.some((id) => !battle.defenders.some((ref) => ref.id === id && ref.moves === duel.cards[id]!.moves));
			// A direct attack on a player who controls monsters, by a monster that may no longer attack directly: a replay (fid 16016,
			// case D, record `direct-attack-lost-replay`). The same for a direct attack by a monster that "cannot attack directly" since
			// it was declared (a lock), whatever the opponent controls: a replay, with no direct attack left to choose (YGOProJudge only,
			// asked 2026-11-24, no source cited).
			const pathClosed = battle.target === null && ((defenders.length > 0 && !allows(allowances, "directly")) || attackLocked(duel, attacker, true));
			// RB10 (records `replay-causes`, `replay`): the target removed, or a new monster on the opponent's side, before the Damage
			// Step. The turn player may attack with the same monster again, with another, or not at all.
			if (targetGone || newcomer || pathClosed) return backToBattleStep(duel, battle.attacker);
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
 *
 * A monster attacking in face-up Defense Position uses its DEF as its ATK, and everything else is as for an Attack Position
 * attacker: the lower value's controller takes the difference and that monster is destroyed, a tie against an Attack Position
 * monster destroys both (Konami's Japanese Q&A fid 24407, OCG only: record `defense-attack-damage`).
 */
function damageCalculation(duel: Duel): Duel {
	const battle = duel.battle!;
	const attackerSide = duel.turn.player;
	const defenderSide = other(attackerSide);
	// A monster that left during the Damage Step does not battle: the attack ends with no damage calculation (the core's reading:
	// "battled" needs damage calculation, record `battled-needs-calc`). A target flipped face-up still has its flip raised.
	// An attacker no longer in a position it may attack in (changed to Defense Position, turned face-down, or in Defense Position
	// with its permission to attack there negated) can no longer attack: no damage calculation, the Damage Step ends (Konami's
	// Japanese Q&A fid 23968, record `defense-attacker-stops`, OCG only; by analogy for an attacker changed to Defense Position).
	// A direct attack on a player who controls monsters, whose permission was lost in the Damage Step: there is no replay any more,
	// and the attack ends the same way (YGOProJudge only, asked 2026-11-24, no source cited; no Konami page read).
	const attackerCard = duel.cards[battle.attacker.id]!;
	const allowances = attackAllowances(duel, attackerCard.id);
	// (Only an attack that needed the permission when it was declared: a monster that comes to the opponent's side during the Damage
	// Step causes no replay and does not stop a direct attack, RB10.)
	// A "cannot attack directly" lock that began to apply in the Damage Step ends a direct attack the same way, whatever the opponent
	// controls (YGOProJudge only, asked 2026-11-24, no source cited).
	const lostPermission = battle.defenders.length > 0 && duel.piles[defenderSide].monster.length > 0 && !allows(allowances, "directly");
	const pathClosed = battle.target === null && (lostPermission || attackLocked(duel, attackerCard, true));
	const canStillAttack = inAttackingPosition(attackerCard, allowances) && !pathClosed;
	if (!standing(duel, battle.attacker, attackerSide) || !canStillAttack || (battle.target && !standing(duel, battle.target, defenderSide))) return enter(duel, "end", raiseFlip);
	const attacker = duel.cards[battle.attacker.id]!;
	const target = battle.target ? duel.cards[battle.target.id]! : null;
	const power = attacker.position === "defense" ? def(duel, attacker.id) : atk(duel, attacker.id);
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
