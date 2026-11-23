import { activateAction, activateEffect, activationWays } from "./activation";
import { type Action, PASS, sameAction } from "./action";
import { type CardInstance, closedPriority, destroyCard, type Duel, type Link, moveCard, other, PHASES, type Side } from "./duel";
import { breakEffect, raiseEvent } from "./events";
import { type CardDef, type EffectRecord, effectOf, rangeOf, speedOf } from "./effects";
import { cardNegated, immune, withoutEnded } from "./negation";
import { endChain, newTurn, refund } from "./once";
import { beginSummon, finishSummon } from "./summon";
import { chooseTrigger, declineTriggers, triggerActions, triggerPoint } from "./triggers";

/**
 * Step 2 of docs/rules-core-spec.md: one chain and the priority loop, after Konami's Fast Effect Timing chart.
 *
 * - The game state is open (box A): the turn player may do anything their phase allows. Any action closes it.
 * - After an activation, the other player may respond (box D); players alternate until both pass in a row, then the
 *   whole chain resolves from the last link to the first, with no activation in between.
 * - After a chain resolves or an action that starts no chain, the turn player may use a fast effect first (box B),
 *   then the opponent (box C); when both pass, the game state is open again.
 * - When both pass in an open game state, the turn moves to the next phase.
 *
 * - Triggers (step 3, src/triggers.ts): after a chain resolves or an action that starts no chain, the trigger effects
 *   waiting in `duel.waiting` go on a chain in Konami's order (turn player's mandatory, opponent's mandatory, turn
 *   player's optional, opponent's optional), each player choosing in turn; the player who did not activate the last
 *   one then has priority. Events (src/events.ts) are raised by every move and by effects.
 *
 * - Effect records (step 4, src/effects.ts and src/activation.ts): an effect is listed when its condition holds, its
 *   once-per-turn limit is not spent, its cost passes a dry run (run on the immutable duel, thrown away) and, if it
 *   targets, a target is legal on the board the cost leaves. Activating pays the cost for real and checks the target
 *   again on the paid board. The link freezes `categories`; the limit is spent at activation, and a negated activation
 *   gives back only a "You can only activate 1 ..." use (`negateActivation`). While a link resolves, its operation
 *   may ask its player for a card that is not a target: the chain then waits (`duel.asking`) and `legalActions` lists
 *   `choose`; with one candidate, nothing is asked.
 *
 * - Negation (step 5, src/negation.ts, src/summon.ts, src/life.ts): four different things. An activation negated and an effect
 *   negated are flags of the link (`negateActivation`, `negateEffect`; a link whose card has its effects negated until the end
 *   of the turn is skipped too, `Duel.negations`); "cannot be negated" is a condition read when the negation takes effect
 *   (`EffectRecord.activationCannotBeNegated`, `effectCannotBeNegated`). A Summon (`summon` action: a Normal Summon with no
 *   Tribute, or a built-in Special Summon from the hand) is not an activation and starts no chain: it is a moment of its own
 *   (`Duel.summoning`) that only effects worded "would be Summoned" (`answersSummon`) can answer; the Summon succeeds when both
 *   players pass, or once a chain started in the window has resolved, unless a negator took, in which case the monster is
 *   destroyed without ever reaching the field. A Spell or Trap Card whose activation was negated goes to the Graveyard without
 *   being sent from the field (`moved.negated`).
 *
 * Not here yet: the Damage Step's limits, Tributes, Flip Summons and Summons by effect (step 8), attacks, the normal draw, and
 * Continuous, Equip and Field cards that stay on the field (a Field Spell is placed and swept like any Spell; the
 * Field Zone comes with step 7). Known limit: a Spell or Trap whose control changed while on the chain is not swept
 * to the Graveyard (the sweep matches the card as activated, move count included).
 */
/** Step 7 gives the exact zones; until then a side holds at most five cards in its Spell & Trap Zones. */
const SPELL_ZONES = 5;
const MONSTER_ZONES = 5;

/**
 * Every action open to the player who holds priority, "pass" first. A player who does not hold priority has none.
 * The teaching chain limit only shortens this list: once the chain has that many links, only "pass" is offered.
 */
export function legalActions(duel: Duel): Action[] {
	if (duel.asking) return duel.asking.from.map((card): Action => ({ type: "choose", card }));
	if (duel.building) return triggerActions(duel);
	const actions: Action[] = [PASS];
	collect(duel, actions);
	return actions;
}

/** Lists what the holder of priority can do besides passing; with no list, only tells whether there is anything. */
function collect(duel: Duel, out: Action[] | null, only?: number): boolean {
	const { chain, priority, turn, options, defs } = duel;
	if (options.chainLimit !== null && chain.length >= options.chainLimit) return false;
	const player = priority.holder;
	const topSpeed = chain.length > 0 ? chain[chain.length - 1]!.speed : 0;
	const ownTurn = player === turn.player;
	/** Spell Speed 1 and Setting need an open game state, in the turn player's own Main Phase. */
	const slow = topSpeed === 0 && priority.open && ownTurn && (turn.phase === "main1" || turn.phase === "main2");
	const piles = duel.piles[player];
	const room = piles.spell.length < SPELL_ZONES;
	let found = false;

	const offer = (card: CardInstance, def: CardDef, index: number, effect: EffectRecord): boolean => {
		// In the window of a Summon (nothing on the chain), only effects that answer the Summon can be activated.
		if (duel.summoning && chain.length === 0 && !effect.answersSummon) return false;
		const speed = speedOf(def, effect);
		if (speed === 1 ? !slow : speed < topSpeed) return false;
		const ctx = { player, card };
		// An effect that answers an event needs that event to be the last thing that happened.
		if (effect.event && !duel.live.some((event) => effect.event!(duel, event, ctx))) return false;
		const ways = activationWays(duel, ctx, index, effect, out === null);
		if (out) for (const way of ways) out.push(activateAction(card.id, index, way));
		return ways.length > 0;
	};

	/** Is the effect one this card can be activated with from its zone? `ready`: a Spell or Trap Card could be activated from here now. */
	const listedHere = (effect: EffectRecord, card: CardInstance, zone: "hand" | "field", ready: boolean): boolean =>
		effect.type === "activation" ? ready : effect.type !== "trigger" && rangeOf(effect) === zone && (zone === "hand" || card.face === "up");

	for (const id of piles.hand) {
		if (only !== undefined && id !== only) continue;
		const card = duel.cards[id]!;
		const def = defs[card.code];
		if (!def) continue;
		const isSpellOrTrap = def.kind !== "monster";
		// A Spell goes from the hand to a free zone, in its controller's turn; a Trap must be Set first.
		const fromHand = room && (def.kind === "spell" || (def.kind === "quick-play" && ownTurn));
		const effects = def.effects;
		if (effects) {
			for (let index = 0; index < effects.length; index++) {
				const effect = effects[index]!;
				if (!listedHere(effect, card, "hand", fromHand || (room && effect.handIf?.(duel, { player, card }) === true))) continue;
				if (offer(card, def, index, effect)) {
					if (!out) return true;
					found = true;
				}
			}
		}
		// A Normal Summon with no Tribute: a Level 4 or lower monster, once a turn, in an open game state, into a free Monster Zone.
		if (!isSpellOrTrap && slow && !duel.normalSummoned && piles.monster.length < MONSTER_ZONES && (def.facts?.level ?? Infinity) <= 4) {
			if (!out) return true;
			out.push({ type: "summon", card: id, how: "normal" });
			found = true;
		}
		if (def.builtInSummon && slow && piles.monster.length < MONSTER_ZONES && (def.builtInSummon.condition?.(duel, { player, card }) ?? true)) {
			if (!out) return true;
			out.push({ type: "summon", card: id, how: "special" });
			found = true;
		}
		if (isSpellOrTrap && slow && room) {
			if (!out) return true;
			out.push({ type: "set", card: id });
			found = true;
		}
	}
	for (const zone of ["spell", "monster"] as const) {
		for (const id of piles[zone]) {
			if (only !== undefined && id !== only) continue;
			const card = duel.cards[id]!;
			const effects = defs[card.code]?.effects;
			if (!effects) continue;
			const def = defs[card.code]!;
			// A Set Spell can be activated at once; a Set Trap or Quick-Play Spell, not in the turn it was Set.
			const setReady = zone === "spell" && card.face === "down" && def.kind !== "monster" && (def.kind === "spell" || !duel.setThisTurn.includes(id));
			for (let index = 0; index < effects.length; index++) {
				const effect = effects[index]!;
				if (!listedHere(effect, card, "field", setReady)) continue;
				if (offer(card, def, index, effect)) {
					if (!out) return true;
					found = true;
				}
			}
		}
	}
	return found;
}

/**
 * Does one action for the player who holds priority and returns the duel that follows; the duel given is not changed.
 * Throws when the action is not among `legalActions(duel)`. Unless the `everyWindow` teaching option is on, a player
 * who can only pass does so at once, so the duel returned always waits on a real decision.
 */
export function act(duel: Duel, action: Action): Duel {
	if (!isLegal(duel, action)) throw new Error(`not a legal action for ${duel.asking ? duel.asking.player : duel.priority.holder}: ${JSON.stringify(action)}`);
	let next = apply(duel, action);
	while (!next.building && !next.asking && !next.options.everyWindow && !decides(next) && !collect(next, null)) next = pass(next);
	return next;
}

/** Is the action among `legalActions(duel)`? An ordinary action is checked by listing only what its own card could do. */
function isLegal(duel: Duel, action: Action): boolean {
	if (duel.asking || duel.building) return legalActions(duel).some((legal) => sameAction(legal, action));
	// Passing is always open to the player who holds priority.
	if (action.type === "pass") return true;
	const listed: Action[] = [];
	collect(duel, listed, action.card);
	return listed.some((legal) => sameAction(legal, action));
}

function apply(duel: Duel, action: Action): Duel {
	if (duel.asking) return answer(duel, (action as Extract<Action, { type: "choose" }>).card);
	if (duel.building) return action.type === "pass" ? declineTriggers(duel) : chooseTrigger(duel, action as Extract<Action, { type: "activate" }>);
	if (action.type === "pass") return pass(duel);
	if (action.type === "summon") return beginSummon(duel, duel.priority.holder, action.card, action.how);
	return action.type === "set" ? set(duel, action.card) : activate(duel, action as Extract<Action, { type: "activate" }>);
}

/** In an open game state the turn player always decides for themselves, even when all they can do is end the phase. */
const decides = (duel: Duel) => duel.chain.length === 0 && duel.priority.open && duel.priority.passed.length === 0 && duel.priority.holder === duel.turn.player;

function set(duel: Duel, id: number): Duel {
	const next = moveCard(breakEffect(duel), id, { zone: "spell", face: "down" });
	// An action that starts no chain: trigger effects go first; then the turn player may use a fast effect, then the opponent (boxes B and C).
	return triggerPoint({ ...next, setThisTurn: [...next.setThisTurn, id] }, closedPriority(duel.turn.player));
}

function activate(duel: Duel, action: Extract<Action, { type: "activate" }>): Duel {
	const player = duel.priority.holder;
	const next = activateEffect(duel, player, duel.cards[action.card]!, action.effect, { paid: action.paid ?? [], targets: action.targets });
	return { ...next, priority: closedPriority(other(player)) };
}

function pass(duel: Duel): Duel {
	const { holder, passed, open } = duel.priority;
	if (!passed.includes(other(holder))) return { ...duel, priority: { holder: other(holder), passed: [...passed, holder], open } };
	// Both players have passed in a row.
	const turnPlayer = duel.turn.player;
	if (duel.chain.length > 0) return resolveChain(duel, duel.chain, null);
	// A Summon that nobody answered (or whose answers have resolved) succeeds.
	if (duel.summoning) return finishSummon(duel);
	// Nothing happened and both passed: the game state is open again, and the events before are no longer the last thing.
	if (!open) return { ...breakEffect(duel), priority: { holder: turnPlayer, passed: [], open: true } };
	return nextPhase(duel);
}

/**
 * Resolves the chain, the last link first, from where it stands. A link whose activation or effect was negated applies
 * nothing. While a link resolves, `duel.chain` still holds it and the links below it. If the effect asks for a card
 * that is not a target, the chain waits in `duel.asking` (one candidate is taken at once, none ends the effect);
 * `answer` picks it up again. Afterwards, every Spell or Trap Card activated in the chain (`all`) that is still face-up
 * on the field goes to the Graveyard, negated or not, "once per Chain" limits are lifted, and the triggers go on a chain.
 * (When: after the whole chain, not after its own link. Konami's Japanese Q&A says so for Quick-Play Spells and Traps
 * chained to an effect: rule record `chained-card-after-chain`; the core applies it to every Spell and Trap Card.)
 */
function resolveChain(duel: Duel, activated: readonly Link[], pending: Duel | null): Duel {
	// The links as they stand once each has come up for resolution: a lower link carries the negation a higher one gave it.
	const all = [...activated];
	let next = duel;
	let result = pending;
	for (;;) {
		if (result === null) {
			if (next.chain.length === 0) break;
			next = breakEffect(next);
			const index = next.chain.length - 1;
			const link = next.chain[index]!;
			all[index] = link;
			result = link.activationNegated || link.effectNegated || cardNegated(next, link) ? next : effectOf(next, link).operation(next, link, index);
		}
		const asking = result.asking;
		if (asking) {
			if (asking.from.length > 1) return { ...result, asking: { ...asking, links: all } };
			const board = { ...result, asking: null };
			result = asking.from.length === 1 ? asking.then(board, asking.from[0]!) : board;
			continue;
		}
		next = { ...result, chain: result.chain.slice(0, -1) };
		result = null;
	}
	for (const link of all) {
		if (effectOf(next, link).type !== "activation") continue;
		const now = next.cards[link.card.id]!;
		if (now.zone === "spell" && now.face === "up" && now.moves === link.card.moves) next = moveCard(next, now.id, link.activationNegated ? { zone: "graveyard", negated: true } : { zone: "graveyard" });
	}
	next = endChain(next);
	// The window of a Summon ends with the first chain started in it (lead from YGOProJudge, no Konami page found): the Summon succeeds,
	// unless it was negated, in which case the monster was destroyed by the negator and nothing was Summoned.
	if (next.summoning && !next.summoning.negated) return finishSummon(next);
	if (next.summoning) next = { ...next, summoning: null };
	return triggerPoint(next, closedPriority(next.turn.player));
}

/** The player picked a card for the effect that was asking: it goes on, and the rest of the chain resolves. */
function answer(duel: Duel, picked: number): Duel {
	const { links, then } = duel.asking!;
	const board = { ...duel, asking: null };
	return resolveChain(board, links, then(board, picked));
}

/** The next phase, or the other player's next turn after the End Phase. The game state is open, the turn player first. */
function nextPhase(duel: Duel): Duel {
	const at = PHASES.indexOf(duel.turn.phase);
	// A new phase is something that happens: nothing before it is the last thing any more, and its triggers are chained first.
	const moved = breakEffect(duel);
	if (at < PHASES.length - 1) {
		const phase = PHASES[at + 1]!;
		const turn = { ...moved.turn, phase };
		return triggerPoint(raiseEvent({ ...moved, turn }, { type: "phase", phase, player: turn.player }), { holder: turn.player, passed: [], open: true });
	}
	const player: Side = other(duel.turn.player);
	const turn = { player, number: duel.turn.number + 1, phase: PHASES[0]! };
	return triggerPoint(raiseEvent(newTurn(withoutEnded({ ...moved, turn, setThisTurn: [], normalSummoned: false }, duel.turn.number)), { type: "phase", phase: turn.phase, player }), { holder: player, passed: [], open: true });
}

const flag = (duel: Duel, index: number, change: Partial<Link>): Duel => (duel.chain[index] ? { ...duel, chain: duel.chain.map((link, i) => (i === index ? { ...link, ...change } : link)) } : duel);

/** Negates the activation of the link at `index`: it will apply nothing, and its card was never activated. */
export function negateActivation(duel: Duel, index: number): Duel {
	const link = duel.chain[index];
	// "Cannot be negated" is read now, when the negating effect resolves (record `cannot-be-negated-checked-at-resolution`).
	if (link && immune(duel, link, "activation")) return duel;
	const flagged = flag(duel, index, { activationNegated: true });
	return link ? refund(flagged, link, effectOf(duel, link)) : flagged;
}

/** Negates the effect of the link at `index`: the activation stands, the effect is not applied. */
export const negateEffect = (duel: Duel, index: number): Duel => {
	const link = duel.chain[index];
	return link && immune(duel, link, "effect") ? duel : flag(duel, index, { effectNegated: true });
};

/** Did the activation of the link at `index` get negated? An operation that says "and if you do" reads this after negating. */
export const activationNegated = (duel: Duel, index: number): boolean => duel.chain[index]?.activationNegated ?? false;

/**
 * "Negate the activation, and if you do, destroy that card." Nothing more happens when the negation did not take (an
 * activation that cannot be negated). It destroys only what is on the field: a monster whose effect was activated from the
 * hand is normally already in the Graveyard as the cost (Konami's Q&A, record `hand-effect-negated-card-already-in-graveyard`);
 * a hand monster that stays in the hand is not destroyed, and no Konami page found says whether it should be (README limits). A Spell or Trap Card whose activation was negated goes to the Graveyard without
 * being sent from the field (`moved.negated`: record `negated-card-not-from-field`); a monster whose effect was negated is
 * destroyed where it is, if it is still there.
 */
export function negateActivationAndDestroy(duel: Duel, index: number): Duel {
	const link = duel.chain[index];
	const negated = negateActivation(duel, index);
	if (!link || link.activationNegated || !activationNegated(negated, index)) return negated;
	const now = negated.cards[link.card.id]!;
	const onField = (now.zone === "monster" || now.zone === "spell" || now.zone === "field") && now.moves === link.card.moves;
	if (!onField) return negated;
	return destroyCard(negated, now.id, effectOf(duel, link).type === "activation" ? { negated: true } : {});
}
