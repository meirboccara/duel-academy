import { activateAction, activateEffect, activationWays, operationOf } from "./activation";
import { type Action, PASS, type Placing, sameAction, takes } from "./action";
import { type CardInstance, closedPriority, destroyCard, type Destruction, type Duel, freeSlots, type Link, moveCard, other, PHASES, type Side } from "./duel";
import { PENDULUM_SLOTS } from "./zones";

/** The Field Zone: one zone, always open to a Field Spell (the one there is sent to the Graveyard). */
const FIELD_ZONE: readonly number[] = Object.freeze([0]);
import { breakEffect, type GameEvent, raiseEvent } from "./events";
import { type CardDef, type EffectRecord, effectOf, inFieldRange, type Operation, rangeOf, sameDeclaration, speedOf } from "./effects";
import { type EffectSource, extraNormalSummon, returnControl, summonLocked, unaffectedBy, withoutEnded } from "./modifiers";
import { cardNegated, immune } from "./negation";
import { endChain, newTurn, refund } from "./once";
import { beginSummon, finishSummon, openPendingSummon } from "./summon";
import { beginFlipSummon, canBeNormalSummoned, canChangePosition, canFlipSummon, canPendulumSummon, canStartProcedure, canTribute, changePositionByHand, procedureWays, setMonster, startPendulumSummon, startProcedure, startTribute, summonPositions, tributesNeeded } from "./procedures";
import { advanceBattle, attackActions, damageStepAllows, declareAttack } from "./battle";
import { chooseTrigger, declineTriggers, triggerActions, triggerPoint } from "./triggers";
import { applyDelayed, delayedActions, expireDelayed, mustApply } from "./delayed";

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
 * - Summon procedures (step 8, src/procedures.ts): Tribute Summons and Sets, the Normal Set of a monster, Flip Summons, changes of
 *   battle position, Synchro / Xyz / Link Summons, contact Fusions and Pendulum Summons are actions listed here. One that needs
 *   Tributes or materials is listed once; the cards are then asked one at a time (`Duel.asking`: `choose`, and `pass` when the
 *   cards chosen are enough), then the zone (`place`). An effect that performs a Summon as Chain Link 1 opens the Summon's window
 *   once the chain has resolved.
 *
 * - Delayed effects (src/delayed.ts): in their phase, with the game state open, the holder of priority may apply theirs (`apply`, an
 *   action that starts no chain); while a mandatory one of theirs is due, `pass` is not offered to them.
 *
 * Not here yet: the normal draw. Known limit: a Spell or Trap whose control changed while on the chain is not swept
 * to the Graveyard (the sweep matches the card as activated, move count included).
 */
/**
 * Every action open to the player who holds priority, "pass" first. A player who does not hold priority has none.
 * The teaching chain limit only shortens this list: once the chain has that many links, only "pass" is offered.
 */
export function legalActions(duel: Duel): Action[] {
	// The Duel is over: nothing more is offered.
	if (duel.winner) return [];
	if (duel.asking) {
		const { from, zones, positions, done, declarations } = duel.asking;
		if (declarations) return from.map((index): Action => ({ type: "declare", declaration: declarations[index]! }));
		if (zones) return from.map((zone): Action => (positions && positions.length > 0 ? { type: "place", zone, positions } : { type: "place", zone }));
		const picks = from.map((card): Action => ({ type: "choose", card }));
		// Step 8: the cards chosen so far are enough: the player may stop there.
		return done ? [PASS, ...picks] : picks;
	}
	if (duel.building) return triggerActions(duel);
	// A mandatory delayed effect that is due must be applied before its player passes (src/delayed.ts).
	const actions: Action[] = mustApply(duel) ? [] : [PASS];
	collect(duel, actions);
	return actions;
}

const awayCodes = new WeakMap<object, ReadonlySet<string>>();

/** The codes of the cards with an Ignition or Quick Effect activated in the Graveyard or while banished, per `defs` (shared by every duel, never changed). */
function activatedAway(defs: Duel["defs"]): ReadonlySet<string> {
	let found = awayCodes.get(defs);
	if (!found) {
		const away = (effect: EffectRecord) => (effect.type === "ignition" || effect.type === "quick") && (effect.range === "graveyard" || effect.range === "banished");
		found = new Set(Object.values(defs).filter((def: CardDef) => def.effects?.some(away)).map((def) => def.code));
		awayCodes.set(defs, found);
	}
	return found;
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
	let found = false;
	// Step 7: the player's free zones, read once per listing and only when a card from the hand needs them.
	let spellSlots: readonly number[] | null = null;
	let mainSlots: readonly number[] | null = null;
	/** Where a card from the hand may be placed as a Spell or Trap Card (as `placingZones`). */
	const placing = (def: CardDef): readonly number[] => {
		if (def.facts?.icon === "field") return FIELD_ZONE;
		spellSlots ??= freeSlots(duel, player, "spell");
		return def.kind === "monster" ? spellSlots.filter((slot) => PENDULUM_SLOTS.includes(slot)) : spellSlots;
	};

	const offer = (card: CardInstance, def: CardDef, index: number, effect: EffectRecord): boolean => {
		// In the window of a Summon (nothing on the chain), only effects that answer the Summon can be activated.
		if (duel.summoning && chain.length === 0 && !effect.answersSummon) return false;
		const speed = speedOf(def, effect);
		if (speed === 1 ? !slow : speed < topSpeed) return false;
		// In the Damage Step, only Counter Traps and effects that directly change ATK/DEF, up to damage calculation (step 6b).
		if (duel.battle && !damageStepAllows(duel, def, effect)) return false;
		const ctx = { player, card };
		// An effect that answers an event needs that event to be the last thing that happened.
		if (effect.event && !duel.live.some((event) => effect.event!(duel, event, ctx)) && !(effect.lingers && duel.lingering.some((event) => effect.event!(duel, event, ctx)))) return false;
		const ways = activationWays(duel, ctx, index, effect, out === null);
		// Step 7: a card activated from the hand is placed in a zone of the player's choice.
		const zones = out && effect.type === "activation" && card.zone === "hand" ? placing(def) : null;
		if (out) for (const way of ways) out.push(zones && zones.length > 0 ? { ...activateAction(card.id, index, way), zones } : activateAction(card.id, index, way));
		return ways.length > 0;
	};

	/** Is the effect one this card can be activated with from its zone? `ready`: a Spell or Trap Card could be activated from here now. */
	const listedHere = (effect: EffectRecord, card: CardInstance, zone: "hand" | "field" | "graveyard" | "banished", ready: boolean): boolean =>
		effect.type === "activation" ? ready : effect.type !== "trigger" && effect.type !== "continuous" && (zone === "field" ? inFieldRange(defs[card.code], card, rangeOf(effect)) : rangeOf(effect) === zone);

	for (const id of piles.hand) {
		if (only !== undefined && id !== only) continue;
		const card = duel.cards[id]!;
		const def = defs[card.code];
		if (!def) continue;
		const isSpellOrTrap = def.kind !== "monster";
		// Step 7: where it may be placed as a Spell or Trap Card (a Field Spell always: it replaces the one there; a Pendulum Monster only in a Pendulum Zone).
		const room = (isSpellOrTrap || def.facts?.pendulum !== undefined) && placing(def).length > 0;
		// A Spell goes from the hand to a free zone, in its controller's turn; a Trap must be Set first; a Pendulum Monster is activated as a Spell in the Main Phase.
		const fromHand = room && (def.kind === "spell" || (def.kind === "quick-play" && ownTurn) || (def.kind === "monster" && slow));
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
		// The turn's Normal Summon or Set (RB10), in an open game state: a Level 4 or lower monster into a free Main Monster Zone of the
		// player's choice; a Level 5 or higher monster by Tributing 1 or 2 monsters (step 8), listed once: the Tributes and the zone are
		// asked afterwards. A Set (face-down Defense Position) is not a Summon, so a lock on Summons does not stop it.
		const level = isSpellOrTrap ? undefined : def.facts?.level;
		// A Normal Summon "in addition to your Normal Summon/Set" (an effect's permission, src/modifiers.ts): one per turn, for the
		// monsters the effect names; never a Set. It is listed beside the turn's own Normal Summon: the player says which they use.
		const extra = level !== undefined && slow && !duel.extraNormalSummoned && canBeNormalSummoned(def) && extraNormalSummon(duel, player, card);
		if (level !== undefined && slow && (!duel.normalSummoned || extra) && canBeNormalSummoned(def)) {
			const count = tributesNeeded(level);
			const zones = count === 0 ? (mainSlots ??= freeSlots(duel, player, "monster")) : null;
			if (zones ? zones.length > 0 : canTribute(duel, player, card, count)) {
				const unlocked = !summonLocked(duel, player, card, "normal");
				if (!duel.normalSummoned) {
					if (!out) return true;
					if (unlocked) out.push(zones ? { type: "summon", card: id, how: "normal", zones } : { type: "summon", card: id, how: "normal" });
					out.push(zones ? { type: "set", card: id, zones } : { type: "set", card: id });
					found = true;
				}
				if (extra && unlocked) {
					if (!out) return true;
					out.push(zones ? { type: "summon", card: id, how: "normal", extra: true, zones } : { type: "summon", card: id, how: "normal", extra: true });
					found = true;
				}
			}
		}
		// A built-in Special Summon from the hand, into a free Main Monster Zone, in face-up Attack or Defense Position (RB10).
		if (!isSpellOrTrap && slow && def.builtInSummon && (def.builtInSummon.condition?.(duel, { player, card }) ?? true) && !summonLocked(duel, player, card, "special")) {
			const zones = (mainSlots ??= freeSlots(duel, player, "monster"));
			if (zones.length > 0) {
				if (!out) return true;
				out.push({ type: "summon", card: id, how: "special", zones, positions: summonPositions(duel, id) });
				found = true;
			}
		}
		if (isSpellOrTrap && slow && room) {
			if (!out) return true;
			out.push({ type: "set", card: id, zones: placing(def) });
			found = true;
		}
	}
	for (const zone of ["spell", "field", "monster"] as const) {
		for (const id of piles[zone]) {
			if (only !== undefined && id !== only) continue;
			const card = duel.cards[id]!;
			// Step 8: a face-down monster may be Flip Summoned, a face-up one have its battle position changed, in the Main Phase with the game state open.
			if (zone === "monster" && slow && (card.face === "down" ? canFlipSummon(duel, card) : canChangePosition(duel, card))) {
				if (!out) return true;
				out.push({ type: card.face === "down" ? "flip-summon" : "change-position", card: id });
				found = true;
			}
			const effects = defs[card.code]?.effects;
			if (!effects) continue;
			const def = defs[card.code]!;
			// A Set Spell can be activated at once; a Set Trap or Quick-Play Spell, not in the turn it was Set.
			const setReady = zone !== "monster" && card.face === "down" && def.kind !== "monster" && (def.kind === "spell" || !duel.setThisTurn.includes(id));
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
	// The Ignition and Quick Effects of the player's cards in the Graveyard and face-up among the banished cards (`range`), read only
	// when some card of the Duel has one.
	const away = activatedAway(defs);
	if (away.size > 0) {
		for (const zone of ["graveyard", "banished"] as const) {
			for (const id of piles[zone]) {
				if (only !== undefined && id !== only) continue;
				const card = duel.cards[id]!;
				if (!away.has(card.code) || card.face !== "up") continue;
				const def = defs[card.code]!;
				const effects = def.effects!;
				for (let index = 0; index < effects.length; index++) {
					const effect = effects[index]!;
					if (!listedHere(effect, card, zone, false)) continue;
					if (offer(card, def, index, effect)) {
						if (!out) return true;
						found = true;
					}
				}
			}
		}
	}
	// Step 8: the Summons of the Extra Deck's monsters by their own procedure (Synchro, Xyz, Link, contact Fusion), each listed once
	// when one legal set of materials exists, and the Pendulum Summon.
	if (slow) {
		for (const id of piles.extra) {
			if (only !== undefined && id !== only) continue;
			const card = duel.cards[id]!;
			if (!defs[card.code]?.procedure || !canStartProcedure(duel, player, card)) continue;
			if (!out) return true;
			const positions = summonPositions(duel, id);
			const summon: Extract<Action, { type: "summon" }> = positions.length > 1 ? { type: "summon", card: id, how: "special", positions } : { type: "summon", card: id, how: "special" };
			// Step 11: a Fusion Monster with two ways open is listed once per way (the player says which they perform).
			const ways = procedureWays(duel, player, card);
			if (ways.length > 1) for (const way of ways) out.push({ ...summon, way });
			else out.push(summon);
			found = true;
		}
		if (only === undefined && piles.spell.length >= 2 && canPendulumSummon(duel, player)) {
			if (!out) return true;
			out.push({ type: "pendulum-summon" });
			found = true;
		}
	}
	// Step 6b: the attacks the turn player can declare in the Battle Phase.
	if (only === undefined && attackActions(duel, out)) {
		if (!out) return true;
		found = true;
	}
	// The delayed effects of the player that are due in this phase.
	if (duel.delayed.length > 0 && delayedActions(duel, out, only)) {
		if (!out) return true;
		found = true;
	}
	return found;
}

/**
 * Does one action for the player who holds priority and returns the duel that follows; the duel given is not changed.
 * Throws when the action is not among `legalActions(duel)`. Unless the `everyWindow` teaching option is on, a player
 * who can only pass does so at once, so the duel returned always waits on a real decision.
 */
export function act(duel: Duel, action: Action): Duel {
	const listed = legalMatch(duel, action);
	if (!listed) throw new Error(`not a legal action for ${duel.asking ? duel.asking.player : duel.priority.holder}: ${JSON.stringify(action)}`);
	let next = apply(duel, withZone(action, listed));
	while (!next.winner && !next.building && !next.asking && !next.options.everyWindow && !decides(next) && !collect(next, null)) next = pass(next);
	return next;
}

/**
 * The action of `legalActions(duel)` that `action` is (with the zone it names among those listed), or `null`. An ordinary action is
 * checked by listing only what its own card could do.
 */
function legalMatch(duel: Duel, action: Action): Action | null {
	// The Duel is over: nothing, not even a pass.
	if (duel.winner) return null;
	if (duel.asking) return legalActions(duel).find((legal) => takes(legal, action)) ?? null;
	if (duel.building) return legalActions(duel).find((legal) => sameAction(legal, action)) ?? null;
	// Passing is open to the player who holds priority, unless a mandatory delayed effect of theirs is due.
	if (action.type === "pass") return mustApply(duel) ? null : PASS;
	if (action.type === "attack") {
		const attacks: Action[] = [];
		attackActions(duel, attacks);
		return attacks.find((legal) => sameAction(legal, action)) ?? null;
	}
	// A zone is placed, or something declared, only when a choice asks for it.
	if (action.type === "place" || action.type === "declare") return null;
	if (action.type === "pendulum-summon") return legalActions(duel).some((legal) => legal.type === "pendulum-summon") ? action : null;
	const listed: Action[] = [];
	collect(duel, listed, action.card);
	return listed.find((legal) => takes(legal, action)) ?? null;
}

/** A placing action as it will be done: with the zone and the battle position it names, or else the first the listing gave (steps 7 and 8). */
function withZone(action: Action, listed: Action): Action {
	if (action.type !== "summon" && action.type !== "set" && action.type !== "activate") return action;
	const zone = action.zone ?? (listed as Placing).zones?.[0];
	const position = action.position ?? (listed as Placing).positions?.[0];
	return { ...action, ...(zone === undefined ? {} : { zone }), ...(position === undefined ? {} : { position }) };
}

function apply(duel: Duel, action: Action): Duel {
	if (duel.asking) return answer(duel, action);
	if (duel.building) return action.type === "pass" ? declineTriggers(duel) : chooseTrigger(duel, action as Extract<Action, { type: "activate" }>);
	const player = duel.priority.holder;
	switch (action.type) {
		case "pass":
			return pass(duel);
		case "summon": {
			// Step 8: an Extra Deck monster's own procedure: the materials, then the zone, are asked before the Summon is attempted.
			if (duel.cards[action.card]!.zone === "extra") return resumeAfter(startProcedure(duel, player, action.card, action.position ?? "attack", action.way), unchanged);
			const tributes = action.how === "normal" ? tributesNeeded(levelOf(duel, action.card)) : 0;
			if (tributes > 0) return resumeAfter(startTribute(duel, player, action.card, tributes, false, action.extra === true), unchanged);
			return beginSummon(duel, player, action.card, action.how, action.zone, action.how === "special" && action.position ? { position: action.position } : action.extra ? { extra: true } : {});
		}
		case "set": {
			if (duel.defs[duel.cards[action.card]!.code]?.kind !== "monster") return set(duel, action.card, action.zone);
			const tributes = tributesNeeded(levelOf(duel, action.card));
			return tributes > 0 ? resumeAfter(startTribute(duel, player, action.card, tributes, true), unchanged) : setMonster(duel, action.card, action.zone);
		}
		case "flip-summon":
			return beginFlipSummon(duel, action.card);
		case "change-position":
			return changePositionByHand(duel, action.card);
		case "pendulum-summon":
			return resumeAfter(startPendulumSummon(duel, player), unchanged);
		case "attack":
			return declareAttack(duel, action.card, action.target);
		case "activate":
			return activate(duel, action);
		case "apply":
			// Not an activation: something happens (what came before is no longer the last thing), then the triggers, then the turn player first.
			return resumeAfter(applyDelayed(breakEffect(duel), action.delayed), (applied) => triggerPoint(applied, closedPriority(applied.turn.player)));
		default:
			throw new Error(`nothing asks for ${JSON.stringify(action)}`);
	}
}

const unchanged = (duel: Duel): Duel => duel;
const levelOf = (duel: Duel, id: number): number => duel.defs[duel.cards[id]!.code]?.facts?.level ?? 0;


/** In an open game state the turn player always decides for themselves, even when all they can do is end the phase. */
const decides = (duel: Duel) => duel.chain.length === 0 && duel.priority.open && duel.priority.passed.length === 0 && duel.priority.holder === duel.turn.player;

function set(duel: Duel, id: number, slot: number | undefined): Duel {
	// A Field Spell is Set in the Field Zone (step 7), any other Spell or Trap in the Spell & Trap Zone chosen.
	const field = duel.defs[duel.cards[id]!.code]?.facts?.icon === "field";
	const next = moveCard(breakEffect(duel), id, field ? { zone: "field", face: "down" } : { zone: "spell", face: "down", slot });
	// An action that starts no chain: trigger effects go first; then the turn player may use a fast effect, then the opponent (boxes B and C).
	return triggerPoint({ ...next, setThisTurn: [...next.setThisTurn, id] }, closedPriority(duel.turn.player));
}

function activate(duel: Duel, action: Extract<Action, { type: "activate" }>): Duel {
	const player = duel.priority.holder;
	const next = activateEffect(duel, player, duel.cards[action.card]!, action.effect, { paid: action.paid ?? [], targets: action.targets, zone: action.zone, ...(action.mode === undefined ? {} : { mode: action.mode }), ...(action.declared === undefined ? {} : { declared: action.declared }), ...(action.groups === undefined ? {} : { groups: action.groups }) });
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
	// An attack moves to its next timing (step 6b).
	if (duel.battle) return advanceBattle(duel);
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
 * A link that decides the Duel (`Duel.winner`) ends the resolution at once: see `ended`.
 */
function resolveChain(duel: Duel, activated: readonly Link[], pending: Duel | null, before: readonly GameEvent[] = []): Duel {
	// The links as they stand once each has come up for resolution: a lower link carries the negation a higher one gave it.
	const all = [...activated];
	/** Events raised by the links resolved so far, which a `lingers` effect may answer after the whole chain. */
	const carried: GameEvent[] = [...before];
	let next = duel;
	let result = pending;
	for (;;) {
		if (result === null) {
			if (next.chain.length === 0) break;
			next = breakEffect(next);
			const index = next.chain.length - 1;
			const link = next.chain[index]!;
			all[index] = link;
			// A link whose effect was replaced ("that effect becomes ...") does that instead of what its card says; negated, it does neither.
			result = link.activationNegated || link.effectNegated || cardNegated(next, link) ? next : (link.replaced?.operation ?? operationOf(effectOf(next, link), link))(next, link, index);
		}
		// The Duel was decided while this link resolved (a draw from an empty Deck): it ends here. Nothing more is asked, the links
		// below are not resolved and no card is swept: the Duel stays as it stood when it was lost.
		if (result.winner) return ended(result);
		const asking = result.asking;
		if (asking) {
			const settled = settle(result);
			if (settled === null) return { ...result, asking: { ...asking, links: all, carried } };
			result = settled;
			continue;
		}
		// The cards this link added to a hand stop being the last thing that happened when the next one resolves; a `lingers` effect may still answer it after the chain.
		for (const event of result.live) if (event.type === "added-to-hand" && !carried.includes(event)) carried.push(event);
		next = { ...result, chain: result.chain.slice(0, -1) };
		result = null;
	}
	for (const link of all) {
		const activated = effectOf(next, link);
		// A Continuous Spell or Trap Card stays on the field (`stays`), as does a Pendulum Monster in its Pendulum Zone (step 7), unless its activation was negated.
		if (activated.type !== "activation" || ((activated.stays || next.defs[link.card.code]?.kind === "monster") && !link.activationNegated)) continue;
		const now = next.cards[link.card.id]!;
		// An Equip Card that equipped a monster stays with it (step 7).
		if (now.equippedTo !== null && !link.activationNegated) continue;
		// A Field Spell stays in the Field Zone, unless its activation was negated (step 7).
		const sweepable = now.zone === "spell" || (now.zone === "field" && link.activationNegated);
		if (sweepable && now.face === "up" && now.moves === link.card.moves) next = moveCard(next, now.id, link.activationNegated ? { zone: "graveyard", negated: true } : { zone: "graveyard" });
	}
	next = endChain(carried.length > 0 ? { ...next, lingering: carried } : next);
	// Step 8: Chain Link 1 performed a Summon ("Synchro Summon using..."): it is attempted now that the chain has resolved, and can be answered.
	if (next.summoning?.pending) return openPendingSummon(next);
	// The window of a Summon ends with the first chain started in it (lead from YGOProJudge, no Konami page found): the Summon succeeds,
	// unless it was negated, in which case the monster was destroyed by the negator and nothing was Summoned.
	if (next.summoning && !next.summoning.negated) return finishSummon(next);
	if (next.summoning) next = { ...next, summoning: null };
	return triggerPoint(next, closedPriority(next.turn.player));
}

/**
 * The player answered the effect that was asking (a card, a zone with its battle position, or "these are all"): it goes on, and the
 * rest of the chain resolves.
 */
function answer(duel: Duel, action: Action): Duel {
	const { links, then, done, carried, resume, positions } = duel.asking!;
	const board = { ...duel, asking: null };
	const { declarations } = duel.asking!;
	const result =
		action.type === "pass"
			? done!(board)
			: action.type === "place"
				? then(board, action.zone, action.position ?? positions?.[0])
				: action.type === "declare"
					? then(board, declarations!.findIndex((declaration) => sameDeclaration(declaration, action.declaration)))
					: then(board, (action as Extract<Action, { type: "choose" }>).card);
	// What the answer set off decided the Duel: nothing goes on, in a chain or outside one.
	if (result.winner) return ended(result);
	return resume ? resumeAfter(result, resume) : resolveChain(board, links, result, carried);
}

/** The Duel is over (`winner` is set): it stays as it stands, with no question left open. `legalActions` then lists nothing and `act` refuses everything. */
const ended = (duel: Duel): Duel => (duel.asking ? { ...duel, asking: null } : duel);

/**
 * A question nobody has to be asked: with nothing to choose from, the effect does nothing more (or, when the player may stop, it
 * goes on with what was chosen); the only candidate is taken at once. `null`: the player must be asked.
 */
function settle(duel: Duel): Duel | null {
	const asking = duel.asking!;
	const board = { ...duel, asking: null };
	if (asking.done) return asking.from.length === 0 ? asking.done(board) : null;
	if (asking.from.length === 0) return board;
	if (asking.from.length === 1 && !(asking.positions && asking.positions.length > 1)) return asking.then(board, asking.from[0]!, asking.positions?.[0]);
	return null;
}

/**
 * A choice asked outside a chain has been answered: once nothing more is asked (one candidate is taken at once, none skips the
 * question), the duel goes on with `resume`.
 */
export function resumeAfter(duel: Duel, resume: (duel: Duel) => Duel): Duel {
	let next = duel;
	while (next.asking) {
		const settled = settle(next);
		if (settled === null) break;
		next = settled;
	}
	return next.asking ? { ...next, asking: { ...next.asking, resume: next.asking.resume ?? resume } } : resume(next);
}

/** The next phase, or the other player's next turn after the End Phase. The game state is open, the turn player first. */
function nextPhase(duel: Duel): Duel {
	const at = PHASES.indexOf(duel.turn.phase);
	// A new phase is something that happens: nothing before it is the last thing any more, and its triggers are chained first.
	const moved = breakEffect(duel);
	if (at < PHASES.length - 1) {
		const phase = PHASES[at + 1]!;
		const turn = { ...moved.turn, phase };
		// Control taken "until the End Phase" goes back as it begins (its owner choosing the zone), before its triggers are put on a chain.
		const begin = (entered: Duel) => triggerPoint(raiseEvent(entered, { type: "phase", phase, player: turn.player }), { holder: turn.player, passed: [], open: true });
		// The delayed effects of the phase that is over are gone (an optional one that was not applied).
		const entering = expireDelayed({ ...moved, turn });
		return phase === "end" ? resumeAfter(returnControl(entering, turn.number), begin) : begin(entering);
	}
	const player: Side = other(duel.turn.player);
	const turn = { player, number: duel.turn.number + 1, phase: PHASES[0]! };
	const fresh = expireDelayed({ ...moved, turn, setThisTurn: [], normalSummoned: false, attacked: moved.attacked.length === 0 ? moved.attacked : [], replay: null, again: null, extraNormalSummoned: false, repositioned: [], pendulumSummoned: false, spared: moved.spared.length === 0 ? moved.spared : [], activations: moved.activations.length === 0 ? moved.activations : [] });
	return triggerPoint(raiseEvent(newTurn(withoutEnded(fresh, duel.turn.number)), { type: "phase", phase: turn.phase, player }), { holder: player, passed: [], open: true });
}

const flag = (duel: Duel, index: number, change: Partial<Link>): Duel => (duel.chain[index] ? { ...duel, chain: duel.chain.map((link, i) => (i === index ? { ...link, ...change } : link)) } : duel);

/**
 * Is the link out of reach of the effect that would negate it (the link resolving now, on top of the chain)? Its card is still on the
 * field, face-up, as it was when it activated, and is unaffected by the negating effect: the negation is not applied. A card that left
 * the field (as its own cost) is no longer protected. Konami's Japanese Q&A fid 12428 (OCG only, record
 * `unaffected-activation-not-negated-on-field`); YGOProJudge answered the opposite for the activation (negated, the monster not
 * destroyed; asked 2026-11-24, no source cited): Konami's page wins.
 */
function shielded(duel: Duel, link: Link): boolean {
	const by = duel.chain[duel.chain.length - 1];
	if (!by || by === link) return false;
	const now = duel.cards[link.card.id]!;
	return isOnFieldFaceUp(now) && now.moves === link.card.moves && unaffectedBy(duel, now.id, by);
}

const isOnFieldFaceUp = (card: CardInstance): boolean => card.face === "up" && (card.zone === "monster" || card.zone === "spell" || card.zone === "field");

/** Negates the activation of the link at `index`: it will apply nothing, and its card was never activated. */
export function negateActivation(duel: Duel, index: number): Duel {
	const link = duel.chain[index];
	// "Cannot be negated" is read now, when the negating effect resolves (record `cannot-be-negated-checked-at-resolution`).
	if (link && (immune(duel, link, "activation") || shielded(duel, link))) return duel;
	const flagged = flag(duel, index, { activationNegated: true });
	return link ? refund(flagged, link, effectOf(duel, link)) : flagged;
}

/** Negates the effect of the link at `index`: the activation stands, the effect is not applied. */
export const negateEffect = (duel: Duel, index: number): Duel => {
	const link = duel.chain[index];
	return link && (immune(duel, link, "effect") || shielded(duel, link)) ? duel : flag(duel, index, { effectNegated: true });
};

/**
 * "That effect becomes '...'": replaces what the link at `index` does when it resolves with `operation`, run then as any operation is,
 * with that link: it is still the effect of the card that was activated and of the player who activated it (who makes its choices,
 * and whose "opponent" the new text means), its cost stays paid, and its once-per-turn use and its place in `Duel.activations` stand.
 * Only the link changes: the card's definition, shared by every Duel, is never touched. `by`: the effect that replaces (the resolving
 * link).
 *
 * It is not an effect applied to the card that activated: the effect of a monster that is unaffected by `by` is replaced too. A link
 * whose activation or effect is negated does neither the new effect nor its own (it is still that card's effect: YGOProJudge only,
 * asked 2026-11-24, no source cited); replacing a link again keeps the last replacement (the core's reading, no page read).
 * Konami's Japanese notes and Q&A on Prototype Sky Striker Ace - Amatsu (OCG only; records `replace-effect-not-applied-to-monster`,
 * `replace-effect-opponent-chooses`, `replace-effect-still-opponents-effect`).
 */
export function replaceEffect(duel: Duel, index: number, operation: Operation, by: EffectSource): Duel {
	return flag(duel, index, { replaced: { operation, by: { card: by.card, player: by.player, ...(by.effect === undefined ? {} : { effect: by.effect }) } } });
}

/** Did the activation of the link at `index` get negated? An operation that says "and if you do" reads this after negating. */
export const activationNegated = (duel: Duel, index: number): boolean => duel.chain[index]?.activationNegated ?? false;

/**
 * "Negate the activation, and if you do, destroy that card." Nothing more happens when the negation did not take (an
 * activation that cannot be negated). It destroys the card where it is, on the field or in the hand: a monster whose effect was
 * activated from the hand is normally already in the Graveyard as the cost, and then there is nothing to destroy (Konami's Q&A,
 * record `hand-effect-negated-card-already-in-graveyard`); one that stayed in the hand is destroyed there (YGOProJudge, asked
 * 2026-11-23, no source cited; no Konami page found). A Spell or Trap Card whose activation was negated goes to the Graveyard without
 * being sent from the field (`moved.negated`: record `negated-card-not-from-field`); a monster whose effect was negated is
 * destroyed where it is, if it is still there.
 */
export function negateActivationAndDestroy(duel: Duel, index: number, destruction: Destruction): Duel {
	const link = duel.chain[index];
	const negated = negateActivation(duel, index);
	if (!link || link.activationNegated || !activationNegated(negated, index)) return negated;
	const now = negated.cards[link.card.id]!;
	const stillThere = (now.zone === "monster" || now.zone === "spell" || now.zone === "field" || now.zone === "hand") && now.moves === link.card.moves;
	if (!stillThere) return negated;
	return destroyCard(negated, now.id, { destruction, ...(effectOf(duel, link).type === "activation" ? { negated: true as const } : {}) });
}
