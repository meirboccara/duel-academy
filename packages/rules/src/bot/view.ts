import type { CardDef } from "../effects";
import type { GameEvent, Waiting } from "../events";
import type { CardInstance, Duel, Side } from "../duel";
import { createRng } from "../rng";
import { hiddenFrom } from "./hidden";

/**
 * Step 9 of docs/rules-core-spec.md (design: docs/rules-core/step9/design.md): the board seen from one player's side, and the
 * re-dealing of what that player cannot see into a full legal Duel (determinization, for the bot's sampling).
 */

/** The code a card has in a view when the viewer cannot see it. No card definition has it. */
export const HIDDEN = "?";

/** The hidden codes one owner's cards may be dealt from: the Main Deck cards (hand, Deck, face-down field, face-down banished) and the face-down Extra Deck. Sorted: a pool carries no order. */
export interface Pools {
	readonly main: readonly string[];
	readonly extra: readonly string[];
}

/** What `side` can see: the Duel with every card it cannot see coded `HIDDEN`, and the pools those cards come from. */
export interface View {
	readonly side: Side;
	readonly duel: Duel;
	readonly unknown: Readonly<Record<Side, Pools>>;
}

/** Cards the viewer knows whatever their place: the cards of the chain (activated, so revealed) and the cards it is being asked to choose from. */
function knownAnyway(duel: Duel, viewer: Side): Set<number> {
	const known = new Set<number>();
	for (const link of duel.chain) known.add(link.card.id);
	if (duel.asking) {
		for (const link of duel.asking.links) known.add(link.card.id);
		if (duel.asking.player === viewer && !duel.asking.zones) for (const id of duel.asking.from) known.add(id);
	}
	return known;
}

const NO_RNG = Object.freeze({ seed: 0, state: 0 });

/** What `side` can see of the Duel. The Duel given is not changed. */
export function viewFor(duel: Duel, side: Side): View {
	const known = knownAnyway(duel, side);
	const cards: Record<number, CardInstance> = {};
	const pools: Record<Side, { main: string[]; extra: string[] }> = { you: { main: [], extra: [] }, rival: { main: [], extra: [] } };
	for (const card of Object.values(duel.cards)) {
		if (known.has(card.id) || !hiddenFrom(card, side)) {
			cards[card.id] = card;
			continue;
		}
		pools[card.owner][card.extraDeck ? "extra" : "main"].push(card.code);
		cards[card.id] = { ...card, code: HIDDEN };
	}
	for (const pool of Object.values(pools)) {
		pool.main.sort();
		pool.extra.sort();
	}
	const masked: Duel = { ...duel, cards, rng: NO_RNG };
	return { side, duel: withSnapshots(masked, (snapshot) => (cards[snapshot.id]!.code === HIDDEN ? { ...snapshot, code: HIDDEN } : snapshot)), unknown: pools };
}

/** Rewrites the card snapshots that events carry (`live`, `lingering`, `waiting`, the triggers being chained, the events a paused chain carries) with `fix`. */
function withSnapshots(duel: Duel, fix: (snapshot: CardInstance) => CardInstance): Duel {
	const event = (raised: GameEvent): GameEvent => {
		switch (raised.type) {
			case "moved":
				// The source of an effect's or a cost's destruction was activated, so shown to both players: it is kept as it was.
				return { ...raised, before: fix(raised.before), after: fix(raised.after) };
			case "added-to-hand":
			case "summoned":
			case "position-changed":
			case "flipped":
				return { ...raised, card: fix(raised.card) };
			case "attack-declared":
			case "battled":
				return { ...raised, attacker: fix(raised.attacker), target: raised.target && fix(raised.target) };
			default:
				return raised;
		}
	};
	const waiting = (entry: Waiting): Waiting => ({ ...entry, card: fix(entry.card), event: event(entry.event) });
	return {
		...duel,
		live: duel.live.map(event),
		lingering: duel.lingering.map(event),
		waiting: duel.waiting.map(waiting),
		building: duel.building && { ...duel.building, remaining: duel.building.remaining.map(waiting) },
		asking: duel.asking?.carried ? { ...duel.asking, carried: duel.asking.carried.map(event) } : duel.asking,
	};
}

type Fits = (def: CardDef | undefined) => boolean;
const ANY: Fits = () => true;
/** What a hidden card must be, from where it is: the most restrictive places are dealt first. */
function fitsOf(card: CardInstance): { fits: Fits; rank: number } {
	if (card.zone === "field") return { fits: (def) => def?.facts?.icon === "field", rank: 0 };
	// A Field Spell is Set in the Field Zone only.
	if (card.zone === "spell") return { fits: (def) => def !== undefined && def.kind !== "monster" && def.facts?.icon !== "field", rank: 1 };
	if (card.zone === "monster") return { fits: (def) => def?.kind === "monster", rank: 2 };
	return { fits: ANY, rank: 3 };
}

/**
 * A full legal Duel consistent with the view: each hidden card keeps its id, place and history, and is given a code dealt from its
 * owner's pool (seeded, so the same view and seed give the same world). A face-down card is dealt a code that fits where it is. The
 * world's RNG is seeded from `seed` too: the viewer cannot predict the real one.
 */
export function redeal(view: View, seed: number): Duel {
	const rng = createRng(seed);
	const { duel } = view;
	const hidden = Object.values(duel.cards).filter((card) => card.code === HIDDEN);
	const left: Record<Side, Record<"main" | "extra", string[]>> = {
		you: { main: [...view.unknown.you.main], extra: [...view.unknown.you.extra] },
		rival: { main: [...view.unknown.rival.main], extra: [...view.unknown.rival.extra] },
	};
	const ordered = hidden.map((card) => ({ card, ...fitsOf(card) })).sort((a, b) => a.rank - b.rank || a.card.id - b.card.id);
	const cards: Record<number, CardInstance> = { ...duel.cards };
	for (const { card, fits } of ordered) {
		const pool = left[card.owner][card.extraDeck ? "extra" : "main"];
		if (pool.length === 0) throw new Error(`no hidden code left for card ${card.id}: the view's pools do not match its cards`);
		const fitting: number[] = [];
		for (let i = 0; i < pool.length; i++) if (fits(duel.defs[pool[i]!])) fitting.push(i);
		// A greedy deal that cornered itself takes what is left (a world only an inconsistent pool can lead to).
		const at = fitting.length > 0 ? fitting[rng.int(fitting.length)]! : rng.int(pool.length);
		cards[card.id] = { ...card, code: pool[at]! };
		pool.splice(at, 1);
	}
	const dealt = withSnapshots({ ...duel, cards, rng: { seed, state: rng.state } }, (snapshot) => (snapshot.code === HIDDEN ? { ...snapshot, code: cards[snapshot.id]!.code } : snapshot));
	// A hidden card's waiting trigger stays only if the code dealt to it has that trigger: in this world, it is that card's.
	const triggers = (entry: Waiting) => dealt.defs[entry.card.code]?.effects?.[entry.effect]?.type === "trigger";
	return dealt.waiting.every(triggers) && (dealt.building?.remaining.every(triggers) ?? true)
		? dealt
		: { ...dealt, waiting: dealt.waiting.filter(triggers), building: dealt.building && { ...dealt.building, remaining: dealt.building.remaining.filter(triggers) } };
}
