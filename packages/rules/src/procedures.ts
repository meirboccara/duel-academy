import { type CardInstance, closedPriority, type Duel, freeSlots, isOnField, materialsOf, moveCard, moveCards, type Position, type Side, type Summoning, type SummonKind } from "./duel";
import { ask, askPlace, askZone, type CardDef, type MaterialCheck, type MaterialContext, type MaterialCount, type MaterialSlot, type Procedure } from "./effects";
import { breakEffect, raiseEvent } from "./events";
import { level, summonLocked } from "./modifiers";
import { beginSummon, landSummon } from "./summon";
import { triggerPoint } from "./triggers";
import { pendulumZones, summonZones } from "./zones";

/**
 * Step 8 of docs/rules-core-spec.md: Summon procedures as data (design in docs/rules-core/step8/design.md, records in
 * src/summon-sources.ts).
 *
 * A procedure is a recipe of material slots (`CardDef.procedure`) plus the rule of its kind (Levels that add up, a Link Rating to
 * reach). One search serves every kind, Tributes and Ritual Tributes included: `existsSet` tells whether a legal set exists (the
 * listing asks nothing more, so it never builds every set), and `askMaterials` lets the player choose the cards one at a time,
 * offering only cards that can still be part of a legal set, and taking by itself a card every legal set needs. A set is legal only
 * if it leaves the monster a zone to go to.
 *
 * - Actions (chain.ts lists them): Tribute Summon and Set, Normal Set, Flip Summon, change of battle position, Synchro / Xyz / Link
 *   Summon and contact Fusion, Pendulum Summon. Each starts here and ends in `beginSummon` (the Summon's window, src/summon.ts).
 * - Operations for card effects: `specialSummon` (an effect puts a monster on the field: no window, `summoned` is raised),
 *   `fusionSummon`, `ritualSummon`, `summonByEffect` (an effect performs a Summon), `flipFaceUp`, `flipFaceDown`, `changePosition`,
 *   `attach`, `detach`.
 */

const NO_IDS: readonly number[] = Object.freeze([]);
const ATTACK_ONLY: readonly Position[] = Object.freeze(["attack"] as const);
const EITHER_POSITION: readonly Position[] = Object.freeze(["attack", "defense"] as const);

/** One way to fill a procedure: its slots, the rule over the whole set, and what the card adds for this way. */
export interface Recipe {
	readonly slots: readonly MaterialSlot[];
	readonly check?: MaterialCheck;
	readonly condition?: (duel: Duel, ctx: MaterialContext) => boolean;
	readonly transfer?: true;
}

/** A set of materials to find: the cards to choose among, the recipes (any one of them), and the rule of the kind. */
export interface MaterialSpec {
	readonly ctx: MaterialContext;
	readonly pool: readonly number[];
	readonly recipes: readonly Recipe[];
	/** The kind's rule over the whole set: the Levels add up, the Link Rating is reached, a zone is left for the monster. */
	readonly valid?: (duel: Duel, ids: readonly number[]) => boolean;
	/** No set holding these cards can be legal (their Levels already exceed the Level): the search stops there. */
	readonly over?: (duel: Duel, ids: readonly number[]) => boolean;
}

const factsOf = (duel: Duel, card: CardInstance) => duel.defs[card.code]?.facts;
/** A monster with a printed Level: an Xyz or Link Monster has none, and cannot be used where a Level is asked for. */
const hasLevel = (duel: Duel, card: CardInstance): boolean => factsOf(duel, card)?.level !== undefined;
const isMonster = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.kind === "monster";
const isLink = (duel: Duel, card: CardInstance): boolean => factsOf(duel, card)?.frame === "link";
/** RB10: a Special Summoned monster is in face-up Attack or Defense Position, the player's choice; a Link Monster is never in Defense Position. */
export const summonPositions = (duel: Duel, id: number): readonly Position[] => (isLink(duel, duel.cards[id]!) ? ATTACK_ONLY : EITHER_POSITION);

const totalLevel = (duel: Duel, ids: readonly number[]): number => ids.reduce((sum, id) => sum + level(duel, id), 0);

const counted = ({ min, max, filter }: MaterialCount, most: number): MaterialSlot => ({ min, max: max ?? most, ...(filter ? { filter } : {}) });

const recipes = new WeakMap<CardDef, readonly Recipe[]>();

/** The recipes of a card's procedure, built once per card definition (the definitions are shared by every duel and never changed). */
function recipesOf(def: CardDef): readonly Recipe[] {
	let found = recipes.get(def);
	if (!found) {
		found = build(def, def.procedure!);
		recipes.set(def, found);
	}
	return found;
}

function build(def: CardDef, procedure: Procedure): readonly Recipe[] {
	switch (procedure.kind) {
		case "synchro": {
			const { tuner, nonTuner, nonTuners, check } = procedure;
			return [
				{
					slots: [
						{ min: 1, max: 1, filter: (duel, card, ctx) => factsOf(duel, card)?.tuner === true && (!tuner || tuner(duel, card, ctx)) },
						{ min: nonTuners?.min ?? 1, max: nonTuners?.max ?? Infinity, filter: (duel, card, ctx) => factsOf(duel, card)?.tuner !== true && (!nonTuner || nonTuner(duel, card, ctx)) },
					],
					check,
				},
			];
		}
		case "xyz": {
			const rank = def.facts?.rank ?? 0;
			const { min, max, filter } = procedure.materials ?? { min: 2 };
			const main: Recipe = { slots: [{ min, max: max ?? min, filter: (duel, card, ctx) => hasLevel(duel, card) && level(duel, card.id) === rank && (!filter || filter(duel, card, ctx)) }], check: procedure.check };
			return [main, ...(procedure.alternatives ?? []).map((way): Recipe => ({ slots: [counted(way.materials, way.materials.min)], condition: way.condition, transfer: way.transfer }))];
		}
		case "link":
			return [{ slots: [counted(procedure.materials, def.facts?.link ?? procedure.materials.min)], check: procedure.check }];
		case "fusion":
			return [{ slots: procedure.materials, check: procedure.check }];
		case "ritual":
			return [];
	}
}

/**
 * Is there a legal set of materials that holds every card of `required`? With `exact`, `required` itself must be one. It returns the
 * recipe the set fills, or `null`. A depth-first search over the pool that stops at the first set found: each card is given to a
 * slot that accepts it and has room, or left out.
 */
function existsSet(duel: Duel, spec: MaterialSpec, required: readonly number[], exact: boolean): Recipe | null {
	if (!required.every((id) => spec.pool.includes(id))) return null;
	const order = exact ? required : [...required, ...spec.pool.filter((id) => !required.includes(id))];
	for (const recipe of spec.recipes) {
		const slots = recipe.slots;
		// Which cards each slot accepts, read once; a slot that too few cards can fill ends the search at once (no Tuner, one Level 4 monster).
		const accepts = slots.map((slot) => order.map((id) => !slot.filter || slot.filter(duel, duel.cards[id]!, spec.ctx)));
		if (slots.some((slot, i) => slot.min > 0 && accepts[i]!.reduce((count, accepted) => count + (accepted ? 1 : 0), 0) < slot.min)) continue;
		const counts = slots.map(() => 0);
		const chosen: number[] = [];
		const complete = (): boolean =>
			slots.every((slot, i) => counts[i]! >= slot.min) &&
			(!recipe.check ||
				recipe.check(
					duel,
					chosen.map((id) => duel.cards[id]!),
					spec.ctx,
				)) &&
			(!spec.valid || spec.valid(duel, chosen));
		/** `fresh`: the set has changed since it was last looked at. */
		const visit = (at: number, fresh: boolean): boolean => {
			if (fresh && at >= required.length && complete()) return true;
			if (at === order.length) return false;
			if (fresh && chosen.length > 0 && spec.over?.(duel, chosen)) return false;
			const id = order[at]!;
			for (let i = 0; i < slots.length; i++) {
				if (counts[i]! >= slots[i]!.max || !accepts[i]![at]) continue;
				counts[i]!++;
				chosen.push(id);
				const found = visit(at + 1, true);
				counts[i]!--;
				chosen.pop();
				if (found) return true;
			}
			return at >= required.length && visit(at + 1, false);
		};
		if (visit(0, true)) return recipe;
	}
	return null;
}

/**
 * The player chooses materials one at a time (`choose`): only cards that can still be part of a legal set are offered, and `pass`
 * ("these are all") as soon as the cards chosen are a legal set themselves. A card that every legal set needs is taken without
 * asking. `then` gets the set; with no legal set at all, nothing happens. Usable by a card's operation, as `ask`.
 */
export function askMaterials(duel: Duel, player: Side, spec: MaterialSpec, then: (duel: Duel, ids: readonly number[]) => Duel, chosen: readonly number[] = NO_IDS): Duel {
	const candidates = spec.pool.filter((id) => !chosen.includes(id) && existsSet(duel, spec, [...chosen, id], false) !== null);
	const complete = existsSet(duel, spec, chosen, true) !== null;
	if (candidates.length === 0) return complete ? then(duel, chosen) : duel;
	// A card that every legal set holds is no choice: it is taken at once ("2 Level 4 monsters" with only two of them).
	const forced = complete ? undefined : candidates.find((id) => existsSet(duel, { ...spec, pool: spec.pool.filter((other) => other !== id) }, chosen, false) === null);
	if (forced !== undefined) return askMaterials(duel, player, spec, then, [...chosen, forced]);
	return {
		...duel,
		asking: { links: [], player, from: candidates, then: (board, picked) => askMaterials(board, player, spec, then, [...chosen, picked]), ...(complete ? { done: (board: Duel) => then(board, chosen) } : {}) },
	};
}

/** The duel as it would be with these monsters gone from the field, for the zone queries only (nothing is moved, no event is raised). */
function without(duel: Duel, ids: readonly number[]): Duel {
	if (!ids.some((id) => duel.cards[id]!.zone === "monster")) return duel;
	const gone = new Set(ids);
	const strip = (side: Side) => ({ ...duel.piles[side], monster: duel.piles[side].monster.filter((id) => !gone.has(id)) });
	return { ...duel, piles: { you: strip("you"), rival: strip("rival") } };
}

/** The zones the monster may be Summoned to once these cards have left the field: materials free their zones, and a Link Monster that leaves takes its arrows with it. */
const zonesAfter = (duel: Duel, player: Side, id: number, leaving: readonly number[]): number[] => summonZones(without(duel, leaving), player, id);

/** Do the materials count for the Link Rating: 1 each, a Link Monster for 1 or for its own Rating (RB10)? */
function countsFor(duel: Duel, ids: readonly number[], rating: number): boolean {
	let sums = new Set([0]);
	for (const id of ids) {
		const own = factsOf(duel, duel.cards[id]!)?.link;
		const next = new Set<number>();
		for (const sum of sums) {
			next.add(sum + 1);
			if (own !== undefined && own > 1) next.add(sum + own);
		}
		sums = next;
	}
	return sums.has(rating);
}

/** The material spec of a procedure the player performs as an action: Synchro, Xyz, Link, contact Fusion. `null` for a card with none. */
function procedureSpec(duel: Duel, player: Side, card: CardInstance): MaterialSpec | null {
	const def = duel.defs[card.code];
	const procedure = def?.procedure;
	if (!def || !procedure || procedure.kind === "ritual" || (procedure.kind === "fusion" && !procedure.contact)) return null;
	const ctx = { player, summoned: card };
	const mine = duel.piles[player].monster;
	const faceUp = mine.filter((id) => duel.cards[id]!.face === "up");
	// A Fusion, Synchro or Xyz Monster goes to any free Main Monster Zone (2021 update): with one free now, no set of materials can leave it without a zone.
	// (Not a Link Monster, nor a Pendulum Monster face-up on the Extra Deck: those need an Extra Monster Zone or a linked zone.)
	const roomy = procedure.kind !== "link" && card.face !== "up" && freeSlots(duel, player, "monster").length > 0;
	const zone = (board: Duel, ids: readonly number[]) => roomy || zonesAfter(board, player, card.id, ids).length > 0;
	const all = recipesOf(def);
	const open = all.some((recipe) => recipe.condition) ? all.filter((recipe) => !recipe.condition || recipe.condition(duel, ctx)) : all;
	switch (procedure.kind) {
		case "synchro": {
			const target = def.facts?.level ?? 0;
			return { ctx, pool: faceUp.filter((id) => hasLevel(duel, duel.cards[id]!)), recipes: open, valid: (board, ids) => totalLevel(board, ids) === target && zone(board, ids), over: (board, ids) => totalLevel(board, ids) > target };
		}
		case "xyz":
			return { ctx, pool: faceUp, recipes: open, valid: zone };
		case "link": {
			const rating = def.facts?.link ?? 0;
			return { ctx, pool: faceUp, recipes: open, valid: (board, ids) => countsFor(board, ids, rating) && zone(board, ids), over: (_board, ids) => ids.length > rating };
		}
		case "fusion":
			return { ctx, pool: mine, recipes: open, valid: zone };
	}
}

/** Can the player start this monster's own procedure now: is it not locked, and is there one legal set of materials that leaves it a zone? */
export function canStartProcedure(duel: Duel, player: Side, card: CardInstance): boolean {
	const spec = procedureSpec(duel, player, card);
	return spec !== null && !summonLocked(duel, player, card, "special") && existsSet(duel, spec, NO_IDS, false) !== null;
}

/** The procedure's name for the Summon it makes; a contact Fusion is a Special Summon that is not a Fusion Summon. */
const kindOf = (procedure: Procedure): SummonKind | undefined => (procedure.kind === "fusion" || procedure.kind === "ritual" ? undefined : procedure.kind);

/**
 * The materials leave for the Summon: Synchro and Link Materials are sent to the Graveyard (RB10), Xyz Materials are stacked under
 * the Xyz Monster (with the materials of a monster used "transferring its materials"; otherwise those go to the Graveyard, as that
 * monster leaves the field), contact Fusion Materials go where the card says.
 */
function useMaterials(duel: Duel, id: number, procedure: Procedure, ids: readonly number[], transfer: boolean): Duel {
	if (procedure.kind === "xyz") {
		return ids.reduce((next, material) => {
			const carried = transfer ? materialsOf(next, material).reduce((board, under) => moveCard(board, under, { zone: "material", attachedTo: id }), next) : next;
			return moveCard(carried, material, { zone: "material", attachedTo: id });
		}, duel);
	}
	if (procedure.kind === "fusion") return moveCards(duel, ids, procedure.contact!.to === "graveyard" ? { zone: "graveyard", reason: "material" } : { zone: procedure.contact!.to });
	return moveCards(duel, ids, { zone: "graveyard", reason: "material", usedFor: procedure.kind === "ritual" ? undefined : procedure.kind });
}

/**
 * The player performs the monster's procedure (the `summon` action of an Extra Deck monster): the materials are asked for, then the
 * zone; the materials leave, and the Summon is attempted (`beginSummon`: the window in which it can be negated). The materials are
 * not given back when the Summon is negated.
 */
export function startProcedure(duel: Duel, player: Side, id: number, position: Position): Duel {
	const card = duel.cards[id]!;
	const procedure = duel.defs[card.code]!.procedure!;
	const spec = procedureSpec(duel, player, card)!;
	return askMaterials(duel, player, spec, (board, ids) => {
		const transfer = existsSet(board, spec, ids, true)?.transfer === true;
		return askZone(board, player, zonesAfter(board, player, id, ids), (placed, zone) => beginSummon(useMaterials(placed, id, procedure, ids, transfer), player, id, "special", zone, { position, kind: kindOf(procedure), proper: true }));
	});
}

/** RB10: a Level 5 or 6 monster needs 1 Tribute, a Level 7 or higher monster 2. */
export const tributesNeeded = (monsterLevel: number): number => (monsterLevel <= 4 ? 0 : monsterLevel <= 6 ? 1 : 2);

const TRIBUTES: readonly (readonly Recipe[])[] = [[], [{ slots: [{ min: 1, max: 1 }] }], [{ slots: [{ min: 2, max: 2 }] }]];

/** The Tributes of a Tribute Summon or Set: monsters the player controls, face-up or face-down (RB10), that leave a Main Monster Zone free. */
function tributeSpec(duel: Duel, player: Side, card: CardInstance, count: number): MaterialSpec {
	return { ctx: { player, summoned: card }, pool: duel.piles[player].monster, recipes: TRIBUTES[count]!, valid: (board, ids) => freeSlots(without(board, ids), player, "monster").length > 0 };
}

/** Can the player Tribute for this monster of their hand: do they control enough monsters, leaving it a zone? */
export function canTribute(duel: Duel, player: Side, card: CardInstance, count: number): boolean {
	return duel.piles[player].monster.length >= count && existsSet(duel, tributeSpec(duel, player, card, count), NO_IDS, false) !== null;
}

/** Tributing: the monsters are sent to the Graveyard, and are not "destroyed" (RB10). */
export const tribute = (duel: Duel, ids: readonly number[]): Duel => moveCards(duel, ids, { zone: "graveyard", reason: "tributed" });

/**
 * A Tribute Summon, or a Tribute Set (`set`): the Tributes are chosen, then the zone (a Tribute frees its own); the Tributes are
 * paid as a cost, then the monster is Summoned (its window opens) or Set.
 */
export function startTribute(duel: Duel, player: Side, id: number, count: number, set: boolean): Duel {
	const spec = tributeSpec(duel, player, duel.cards[id]!, count);
	return askMaterials(duel, player, spec, (board, ids) =>
		askZone(board, player, freeSlots(without(board, ids), player, "monster"), (placed, zone) => {
			const paid = tribute(placed, ids);
			return set ? setMonster(paid, id, zone) : beginSummon(paid, player, id, "normal", zone, { kind: "tribute" });
		}),
	);
}

/**
 * A Normal Set: the monster goes from the hand to a Main Monster Zone in face-down Defense Position. It is not a Summon (RB10): no
 * window, no `summoned`; it uses the turn's Normal Summon/Set. An action that starts no chain.
 */
export function setMonster(duel: Duel, id: number, slot: number | undefined): Duel {
	const next = moveCard(breakEffect(duel), id, { zone: "monster", face: "down", position: "defense", slot });
	return triggerPoint({ ...next, normalSummoned: true }, closedPriority(duel.turn.player));
}

/**
 * Can the monster be Flip Summoned: face-down in the Monster Zone, not put on the field this turn (RB10), its position not yet
 * changed by hand this turn, and no lock on Flip Summons?
 */
export function canFlipSummon(duel: Duel, card: CardInstance): boolean {
	return card.zone === "monster" && card.face === "down" && card.arrived < duel.turn.number && !duel.repositioned.includes(card.id) && !summonLocked(duel, card.controller, card, "flip");
}

/** The Flip Summon is attempted: the monster stays face-down on the field during its window; it is its change of position of the turn. */
export function beginFlipSummon(duel: Duel, id: number): Duel {
	const begun = beginSummon(duel, duel.cards[id]!.controller, id, "flip");
	return { ...begun, repositioned: [...begun.repositioned, id] };
}

/**
 * Can the player change this monster's battle position by hand (RB10): a face-up monster, never a Link Monster, not played onto the
 * field this turn, that has not attacked this turn, and whose position was not already changed by hand this turn?
 */
export function canChangePosition(duel: Duel, card: CardInstance): boolean {
	return card.zone === "monster" && card.face === "up" && !isLink(duel, card) && card.arrived < duel.turn.number && !duel.repositioned.includes(card.id) && !duel.attacked.some((ref) => ref.id === card.id);
}

/** The player changes the monster's battle position: an action that starts no chain (FET, RB10). */
export function changePositionByHand(duel: Duel, id: number): Duel {
	const next = changePosition(breakEffect(duel), id);
	return triggerPoint({ ...next, repositioned: [...next.repositioned, id] }, closedPriority(duel.turn.player));
}

/**
 * Changes a face-up monster's battle position (to `to`, or to the other one), as an effect does; it does not use the monster's
 * change of the turn. Nothing happens to a face-down monster, to a Link Monster (never in Defense Position, RB10) or when the
 * monster is already in that position.
 */
export function changePosition(duel: Duel, id: number, to?: Position): Duel {
	const card = duel.cards[id]!;
	const position = to ?? (card.position === "attack" ? "defense" : "attack");
	if (card.zone !== "monster" || card.face !== "up" || card.position === position || (position === "defense" && isLink(duel, card))) return duel;
	const moved = moveCard(duel, id, { zone: "monster", face: "up", position });
	return raiseEvent(moved, { type: "position-changed", card: moved.cards[id]!, from: card.position });
}

/** An effect flips a face-down monster face-up (in Defense Position unless `position` says otherwise): `flipped` is raised, so its FLIP effect triggers. It is not a Summon. */
export function flipFaceUp(duel: Duel, id: number, position: Position = "defense"): Duel {
	const card = duel.cards[id]!;
	if (card.zone !== "monster" || card.face !== "down") return duel;
	const moved = moveCard(duel, id, { zone: "monster", face: "up", position });
	return raiseEvent(moved, { type: "flipped", card: moved.cards[id]! });
}

/** An effect turns a face-up monster to face-down Defense Position: it becomes a new card. A Link Monster cannot be (RB10). */
export function flipFaceDown(duel: Duel, id: number): Duel {
	const card = duel.cards[id]!;
	if (card.zone !== "monster" || card.face !== "up" || isLink(duel, card)) return duel;
	return moveCard(duel, id, { zone: "monster", face: "down", position: "defense" });
}

/** Attaches a card to an Xyz Monster as an Xyz Material: it is no longer a card on the field (RB10). */
export const attach = (duel: Duel, xyz: number, id: number): Duel => (duel.cards[xyz]!.zone === "monster" ? moveCard(duel, id, { zone: "material", attachedTo: xyz }) : duel);

/** "Detach 1 material from this card": that Xyz Material (the first, with none named) goes to the Graveyard (RB10). `null` when there is none: a cost that cannot be paid. */
export function detach(duel: Duel, xyz: number, material?: number): Duel | null {
	const attached = materialsOf(duel, xyz);
	const chosen = material ?? attached[0];
	return chosen === undefined || !attached.includes(chosen) ? null : moveCard(duel, chosen, { zone: "graveyard" });
}

/** A monster with a Summon procedure of its own: a Fusion, Synchro, Xyz, Link or Ritual Monster. */
const hasOwnProcedure = (def: CardDef | undefined): boolean => def?.procedure !== undefined || def?.facts?.frame !== undefined;

/**
 * RB10: all Normal Monsters and most Effect Monsters can be Normal Summoned or Set, "unless they have a specific restriction"; a
 * Ritual Monster or an Extra Deck monster never can be.
 */
export const canBeNormalSummoned = (def: CardDef | undefined): boolean => def !== undefined && !hasOwnProcedure(def) && def.summon?.cannotBeNormalSummoned !== true;

/**
 * Can this monster be Special Summoned from where it is by something other than its own procedure, as far as "properly Summoned
 * first" goes? A Fusion, Synchro, Xyz, Link or Ritual Monster in the hand, the Deck, the Graveyard, banished or face-up on the Extra
 * Deck needs one successful Summon by its own procedure (RB10, records `special-summon-monsters-need-proper`,
 * `properly-summoned-first`; Konami's Japanese Q&A 21297, record `revive-needs-successful-proper-summon`). In the hand and the Deck
 * it never has one: only its own procedure Summons it from there. Face-down in the Extra Deck nothing is asked.
 */
export function canBeRevived(duel: Duel, id: number): boolean {
	const card = duel.cards[id]!;
	if (isOnField(card.zone) || (card.zone === "extra" && card.face === "down")) return true;
	return !hasOwnProcedure(duel.defs[card.code]) || card.proper;
}

/**
 * Can an effect of `player` Special Summon this monster to their field now: no lock on it, a zone it may go to, and properly
 * Summoned first if it has to be? `kind`: the effect performs that Summon ("Ritual Summon", "Fusion Summon"), which is the
 * monster's own procedure when it is of that kind.
 */
export function canSpecialSummon(duel: Duel, player: Side, id: number, kind?: SummonKind): boolean {
	return summonable(duel, player, id, kind) && summonZones(duel, player, id).length > 0;
}

/** Is `kind` the monster's own procedure: the one its `procedure` names, or its frame (a Ritual Monster written with its frame alone)? */
const isOwnKind = (def: CardDef | undefined, kind: SummonKind | undefined): boolean => kind !== undefined && (def?.procedure?.kind === kind || def?.facts?.frame === kind);

/**
 * `canSpecialSummon` but for the zone: what an effect that pays something first (Tributes, materials) asks before paying, the zone
 * being read once they have left. A monster already in a Monster Zone is not Summoned; one on the field as a Spell (a Pendulum
 * Monster in its Pendulum Zone) can be.
 */
function summonable(duel: Duel, player: Side, id: number, kind?: SummonKind): boolean {
	const card = duel.cards[id]!;
	return isMonster(duel, id) && card.zone !== "monster" && (isOwnKind(duel.defs[card.code], kind) || canBeRevived(duel, id)) && !summonLocked(duel, player, card, "special");
}

/**
 * An effect Special Summons the monster to `player`'s field ("Special Summon it"): face-up in the zone `slot` (default: the first it
 * may go to) and the position given (default Attack Position). `summoned` is raised (`by: "effect"`), so "when Summoned" effects
 * trigger; there is no window: a card that negates a Summon cannot answer it (PSCT part 5, record `negate-summon-built-in-only`).
 * `kind`: the effect performs that Summon ("Fusion Summon", "Ritual Summon"): the monster is then properly Summoned. Nothing happens
 * when the monster cannot be Summoned (`canSpecialSummon`) or the zone is not one it may go to.
 */
export function specialSummon(duel: Duel, player: Side, id: number, options: { slot?: number; position?: Position; kind?: SummonKind } = {}): Duel {
	if (!canSpecialSummon(duel, player, id, options.kind)) return duel;
	const zones = summonZones(duel, player, id);
	const slot = options.slot ?? zones[0]!;
	if (!zones.includes(slot)) return duel;
	const summoning: Summoning = { player, cards: [id], how: "special", negated: false, slots: [slot], positions: [isLink(duel, duel.cards[id]!) ? "attack" : (options.position ?? "attack")], ...(options.kind ? { kind: options.kind, proper: isOwnKind(duel.defs[duel.cards[id]!.code], options.kind) } : {}) };
	return landSummon(duel, summoning, "effect");
}

/**
 * As `specialSummon`, the player choosing the zone (among `zones`, or every zone the monster may go to) and the battle position
 * (RB10). `then` continues once the monster is on the field; it is not run when the monster could not be Summoned.
 */
export function askSpecialSummon(duel: Duel, player: Side, id: number, options: { zones?: readonly number[]; kind?: SummonKind; then?: (duel: Duel) => Duel } = {}): Duel {
	if (!canSpecialSummon(duel, player, id, options.kind)) return duel;
	const legal = summonZones(duel, player, id);
	const zones = options.zones ? options.zones.filter((zone) => legal.includes(zone)) : legal;
	return askPlace(duel, player, zones, summonPositions(duel, id), (board, zone, position) => {
		const done = specialSummon(board, player, id, { slot: zone, position, kind: options.kind });
		return options.then && done !== board ? options.then(done) : done;
	});
}

/** What a Fusion Summoning effect says: where the materials may come from, which Fusion Monsters, and where the materials go. */
export interface FusionOptions {
	/** The cards that may be used as material: "from your hand or field", "from your Deck", "from either field"... */
	readonly pool: (duel: Duel, player: Side) => readonly number[];
	/** Which Fusion Monsters of the Extra Deck (default: any). */
	readonly monsters?: (duel: Duel, card: CardInstance) => boolean;
	/** Where the materials go: the Graveyard (default), banished, or shuffled into the Deck (they are placed on it; the core does not shuffle here). */
	readonly to?: "graveyard" | "banished" | "deck";
}

function fusionSpec(duel: Duel, player: Side, card: CardInstance, options: FusionOptions): MaterialSpec {
	const pool = options.pool(duel, player).filter((id) => id !== card.id && isMonster(duel, id));
	return { ctx: { player, summoned: card }, pool, recipes: recipesOf(duel.defs[card.code]!), valid: (board, ids) => zonesAfter(board, player, card.id, ids).length > 0 };
}

/** The Fusion Monsters of the player's Extra Deck that the effect could Fusion Summon now. */
function fusable(duel: Duel, player: Side, options: FusionOptions): number[] {
	return duel.piles[player].extra.filter((id) => {
		const card = duel.cards[id]!;
		if (duel.defs[card.code]?.procedure?.kind !== "fusion" || (options.monsters && !options.monsters(duel, card)) || !summonable(duel, player, id, "fusion")) return false;
		return existsSet(duel, fusionSpec(duel, player, card, options), NO_IDS, false) !== null;
	});
}

/** Could the effect Fusion Summon anything now? The activation condition of a card that Fusion Summons. */
export const canFusionSummon = (duel: Duel, player: Side, options: FusionOptions): boolean => fusable(duel, player, options).length > 0;

/**
 * "Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from ... as material": the player chooses the Fusion
 * Monster, then its materials among the effect's pool (the Fusion Monster's own recipe says which), the materials go where the
 * effect says, and the monster is Special Summoned (zone and position chosen) as a Fusion Summon. For a card's operation.
 */
export function fusionSummon(duel: Duel, player: Side, options: FusionOptions): Duel {
	return ask(duel, player, fusable(duel, player, options), (board, picked) =>
		askMaterials(board, player, fusionSpec(board, player, board.cards[picked]!, options), (chosen, ids) => {
			const to = options.to ?? "graveyard";
			const sent = moveCards(chosen, ids, to === "deck" ? { zone: "deck" } : { zone: to, reason: "material", usedFor: "fusion" });
			return askSpecialSummon(sent, player, picked, { kind: "fusion" });
		}),
	);
}

/** What a Ritual Spell says. */
export interface RitualOptions {
	/** The Ritual Monsters it can Summon, and from where ("from your hand"). */
	readonly monsters: (duel: Duel, player: Side) => readonly number[];
	/** What may be Tributed for `monster`: "from your hand or field" (and, for some, monsters of the Graveyard, which are banished instead). */
	readonly pool: (duel: Duel, player: Side, monster: CardInstance) => readonly number[];
	/** "whose total Levels equal its Level" or "equal or exceed". */
	readonly mode: "equal" | "at-least";
	/** A card that can be used as the entire Tribute. */
	readonly whole?: (duel: Duel, card: CardInstance, monster: CardInstance) => boolean;
}

const RITUAL: readonly Recipe[] = [{ slots: [{ min: 1, max: Infinity }] }];

/**
 * The Tributes of a Ritual Summon: their Levels add up to the Ritual Monster's Level (`equal`), or to at least that with no Tribute
 * that is not needed (`at-least`: YGOProJudge only, no Konami page read), or one card that is the entire Tribute.
 */
function ritualSpec(duel: Duel, player: Side, monster: CardInstance, options: RitualOptions): MaterialSpec {
	const target = level(duel, monster.id);
	const pool = options.pool(duel, player, monster).filter((id) => id !== monster.id && isMonster(duel, id));
	const whole = (board: Duel, id: number) => options.whole?.(board, board.cards[id]!, monster) === true;
	const spare = (board: Duel, ids: readonly number[], sum: number) => ids.some((id) => sum - level(board, id) >= target);
	const enough = (board: Duel, ids: readonly number[]): boolean => {
		if (ids.length === 1 && whole(board, ids[0]!)) return true;
		if (!ids.every((id) => hasLevel(board, board.cards[id]!))) return false;
		const sum = totalLevel(board, ids);
		return options.mode === "equal" ? sum === target : sum >= target && !spare(board, ids, sum);
	};
	return {
		ctx: { player, summoned: monster },
		pool,
		recipes: RITUAL,
		valid: (board, ids) => enough(board, ids) && zonesAfter(board, player, monster.id, ids).length > 0,
		over: (board, ids) => {
			const sum = totalLevel(board, ids);
			return ids.length > 1 && (options.mode === "equal" ? sum > target : spare(board, ids, sum));
		},
	};
}

const ritualCandidates = (duel: Duel, player: Side, options: RitualOptions): number[] =>
	options.monsters(duel, player).filter((id) => summonable(duel, player, id, "ritual") && existsSet(duel, ritualSpec(duel, player, duel.cards[id]!, options), NO_IDS, false) !== null);

/** Could the Ritual Spell Ritual Summon anything now? Its activation condition. */
export const canRitualSummon = (duel: Duel, player: Side, options: RitualOptions): boolean => ritualCandidates(duel, player, options).length > 0;

/**
 * "Ritual Summon 1 Ritual Monster from your hand, by Tributing monsters from your hand or field whose total Levels ...": the player
 * chooses the Ritual Monster, then the Tributes; those of the hand and field are Tributed (sent to the Graveyard), those of the
 * Graveyard banished; the monster is Special Summoned (zone and position chosen) as a Ritual Summon. For a card's operation.
 */
export function ritualSummon(duel: Duel, player: Side, options: RitualOptions): Duel {
	return ask(duel, player, ritualCandidates(duel, player, options), (board, picked) =>
		askMaterials(board, player, ritualSpec(board, player, board.cards[picked]!, options), (chosen, ids) => {
			const buried = ids.filter((id) => chosen.cards[id]!.zone === "graveyard");
			const tributed = tribute(chosen, ids.filter((id) => !buried.includes(id)));
			return askSpecialSummon(moveCards(tributed, buried, { zone: "banished" }), player, picked, { kind: "ritual" });
		}),
	);
}

/** Could an effect of `player` perform this monster's Summon now (`summonByEffect`), with `using` among the materials? */
export function canSummonByEffect(duel: Duel, player: Side, id: number, using: readonly number[] = NO_IDS): boolean {
	const card = duel.cards[id]!;
	if (card.zone === "extra") {
		const spec = procedureSpec(duel, player, card);
		return spec !== null && !summonLocked(duel, player, card, "special") && existsSet(duel, spec, using, false) !== null;
	}
	const facts = factsOf(duel, card);
	if (card.zone !== "hand" || facts?.level === undefined || !canBeNormalSummoned(duel.defs[card.code]) || summonLocked(duel, player, card, "normal")) return false;
	const count = tributesNeeded(facts.level);
	return count === 0 ? freeSlots(duel, player, "monster").length > 0 : canTribute(duel, player, card, count);
}

/**
 * An effect performs a Summon when it resolves, at `index` of the chain: a monster's own procedure from the Extra Deck ("Synchro
 * Summon using this card you control as material": `using`), or a Normal or Tribute Summon of a monster of the hand ("immediately
 * after this effect resolves, Normal Summon 1 monster"; it does not use the turn's Normal Summon). The materials or Tributes, the
 * zone and the position are chosen as for the action. If the effect was Chain Link 1, the Summon's window opens once the chain has
 * resolved, and a card that negates a Summon can answer it; from Chain Link 2 the Summon is made at once, with no window (Konami's
 * Japanese Q&A 24054 and 16986, OCG only: records `summon-by-effect-chain-link-1`, `summon-by-effect-chain-link-2`,
 * `tribute-summon-by-effect`). Works in either player's turn.
 */
export function summonByEffect(duel: Duel, index: number, player: Side, id: number, using: readonly number[] = NO_IDS): Duel {
	if (!canSummonByEffect(duel, player, id, using)) return duel;
	const card = duel.cards[id]!;
	const attempt = (board: Duel, summoning: Summoning): Duel => (index === 0 ? { ...board, summoning: { ...summoning, pending: true } } : landSummon(board, summoning));
	if (card.zone === "extra") {
		const procedure = duel.defs[card.code]!.procedure!;
		const spec = procedureSpec(duel, player, card)!;
		return askMaterials(
			duel,
			player,
			spec,
			(board, ids) => {
				const transfer = existsSet(board, spec, ids, true)?.transfer === true;
				return askPlace(board, player, zonesAfter(board, player, id, ids), summonPositions(board, id), (placed, zone, position) =>
					attempt(useMaterials(placed, id, procedure, ids, transfer), { player, cards: [id], how: "special", negated: false, slots: [zone], positions: [position], kind: kindOf(procedure), proper: true }),
				);
			},
			using,
		);
	}
	const count = tributesNeeded(factsOf(duel, card)!.level!);
	const normal = (board: Duel, zone: number): Summoning => ({ player, cards: [id], how: "normal", negated: false, slots: [zone], ...(count > 0 ? { kind: "tribute" as const } : {}) });
	if (count === 0) return askZone(duel, player, freeSlots(duel, player, "monster"), (placed, zone) => attempt(placed, normal(placed, zone)));
	return askMaterials(duel, player, tributeSpec(duel, player, card, count), (board, ids) => askZone(board, player, freeSlots(without(board, ids), player, "monster"), (placed, zone) => attempt(tribute(placed, ids), normal(placed, zone))));
}

/** The Pendulum Scales of the player's two Pendulum Zones, low then high; `null` unless both zones hold a Pendulum Monster. */
function scales(duel: Duel, player: Side): readonly [number, number] | null {
	const [left, right] = pendulumZones(duel, player);
	if (left === undefined || right === undefined) return null;
	const a = factsOf(duel, duel.cards[left]!)!.pendulum!.scale;
	const b = factsOf(duel, duel.cards[right]!)!.pendulum!.scale;
	return [Math.min(a, b), Math.max(a, b)];
}

/** One monster of a Pendulum Summon being put together: the zone and position chosen for it. */
interface Pick {
	readonly id: number;
	readonly zone: number;
	readonly position: Position;
}

/** The zones a monster may still take in the Pendulum Summon being put together: not one already given, and one Extra Monster Zone at most. */
function pendulumRoom(duel: Duel, player: Side, id: number, picks: readonly Pick[]): number[] {
	const usesExtraZone = picks.some((pick) => pick.zone >= 5);
	return summonZones(duel, player, id).filter((zone) => !picks.some((pick) => pick.zone === zone) && !(zone >= 5 && usesExtraZone));
}

/**
 * The monsters the player may still add to the Pendulum Summon (RB10): monsters of the hand and face-up Pendulum Monsters of the
 * Extra Deck whose Level is strictly between the two Scales, each with a zone left for it and no lock on it.
 */
function pendulumCandidates(duel: Duel, player: Side, picks: readonly Pick[]): number[] {
	const between = scales(duel, player);
	if (!between) return [];
	const fits = (id: number): boolean => {
		const card = duel.cards[id]!;
		const facts = factsOf(duel, card);
		if (!isMonster(duel, id) || facts?.level === undefined || !canBeRevived(duel, id) || picks.some((pick) => pick.id === id)) return false;
		const own = level(duel, id);
		return own > between[0] && own < between[1] && !summonLocked(duel, player, card, "special") && pendulumRoom(duel, player, id, picks).length > 0;
	};
	const fromExtra = duel.piles[player].extra.filter((id) => duel.cards[id]!.face === "up" && factsOf(duel, duel.cards[id]!)?.pendulum !== undefined);
	return [...duel.piles[player].hand, ...fromExtra].filter(fits);
}

/** Can the player Pendulum Summon now: not yet this turn, a Pendulum Monster in each Pendulum Zone, and at least one monster to Summon? */
export const canPendulumSummon = (duel: Duel, player: Side): boolean => !duel.pendulumSummoned && pendulumCandidates(duel, player, []).length > 0;

/**
 * The player Pendulum Summons (once per turn): the monsters are chosen one at a time, each with its zone and position, `pass`
 * ending the choice once one is chosen; then all are Summoned at the same time, in one window.
 */
export function startPendulumSummon(duel: Duel, player: Side, picks: readonly Pick[] = []): Duel {
	const begin = (board: Duel): Duel => {
		const begun = beginSummon(board, player, picks[0]!.id, "special", undefined, { kind: "pendulum" });
		return { ...begun, pendulumSummoned: true, summoning: { ...begun.summoning!, cards: picks.map((pick) => pick.id), slots: picks.map((pick) => pick.zone), positions: picks.map((pick) => pick.position) } };
	};
	const candidates = pendulumCandidates(duel, player, picks);
	if (candidates.length === 0) return picks.length > 0 ? begin(duel) : duel;
	const then = (board: Duel, picked: number): Duel => askPlace(board, player, pendulumRoom(board, player, picked, picks), summonPositions(board, picked), (placed, zone, position) => startPendulumSummon(placed, player, [...picks, { id: picked, zone, position }]));
	return { ...duel, asking: { links: [], player, from: candidates, then, ...(picks.length > 0 ? { done: begin } : {}) } };
}
