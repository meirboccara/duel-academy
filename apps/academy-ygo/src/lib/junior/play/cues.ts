import { cardOf, inExtraDeck, monsterOf, type CardId, type Effect } from "@duel-academy/engine";
import { atkOf, defOf, other, type Board, type GameEvent, type Row, type Side, type SummonWay } from "@duel-academy/engine";

/**
 * What the board shows for a move, as pictures: each thing the rules did becomes a cue, a small animation that
 * shows it (a bolt on the destroyed monster, sparkles flying to the Life Points). A pure function of the board
 * before, the events and the board after, so it is tested like the rules and never decides anything itself.
 */
export type PileSpot = "graveyard" | "extra" | "banished" | "deck" | "hand";
/** A place on the board a cue happens at, or travels between. */
export type Spot = { at: "zone"; side: Side; row: Row; zone: number } | { at: "lantern"; side: Side } | { at: "pile"; side: Side; pile: PileSpot } | { at: "center" };

/** How a destroyed monster is hit: by lightning, by the ground opening, by an explosion, in battle, or by its own text. */
export type StrikeStyle = "bolt" | "quake" | "burst" | "clash" | "crack";
/** Why a card leaves where it was. */
export type LeaveHow = "destroyed" | "banished" | "returned" | "tribute" | "material" | "discard" | "draw" | "revive";
/** How a monster or a Scale arrives. */
export type ArriveWay = SummonWay | "normal" | "tribute" | "pendulum" | "scale";
/** The Summons that have a scene of their own: the way the materials are used is the rule they teach. */
export type SceneWay = "ritual" | "fusion" | "synchro" | "xyz" | "link" | "pendulum";
/** The legendary cards, each with its own scene. */
export type LegendStyle = "dark-magic" | "white-lightning" | "ultimate" | "forbidden";
export const LEGENDS: Partial<Record<CardId, LegendStyle>> = { "dark-magician": "dark-magic", "blue-eyes-white-dragon": "white-lightning", "blue-eyes-ultimate-dragon": "ultimate" };
/** A card used to Summon another, with the number a scene shows for it. */
export interface SceneMaterial {
	card: CardId;
	level: number;
	tuner: boolean;
}

export type Cue =
	/** A Spell, a Trap or an effect is used: its card is shown, so the child sees which card acts. */
	| { kind: "cast"; side: Side; card: CardId }
	/** The card or monster an effect targets. */
	| { kind: "aim"; spot: Spot }
	/** Something hits a spot. */
	| { kind: "strike"; style: StrikeStyle; spot: Spot }
	/** A card travels from one place to another and is gone from the first. `card` is null for a face-down card. */
	| { kind: "leave"; how: LeaveHow; card: CardId | null; from: Spot; to: Spot; order: number }
	| { kind: "arrive"; way: ArriveWay; spot: Spot }
	/**
	 * A Summon scene in the middle of the board, then each new monster flies to its zone. `value` is the new monster's
	 * Level, Rank or Link Rating; `numbers` are what the scene adds up (the materials' Levels, or the two Pendulum Scales).
	 */
	| { kind: "summon"; way: SceneWay; cards: CardId[]; spots: Spot[]; materials: SceneMaterial[]; numbers: number[]; value: number }
	/** A legendary card's own scene. `spot` is where it ends: its zone, or the middle of the board. */
	| { kind: "legend"; style: LegendStyle; card: CardId; side: Side; spot: Spot }
	/** ATK goes up or down by this much. */
	| { kind: "stat"; spot: Spot; amount: number }
	/** Life Points change. `source` is where a gain comes from. */
	| { kind: "lp"; side: Side; from: number; to: number; source: Spot }
	/** An attack is stopped at the attacker. */
	| { kind: "block"; spot: Spot; art: string }
	/** Something flies from one spot to another: an attack, a monster's effect. */
	| { kind: "beam"; from: Spot; to: Spot; art: string }
	/** A player is protected from damage. */
	| { kind: "shield"; side: Side }
	/** A Field Spell covers the whole field. */
	| { kind: "wave"; side: Side; art: string }
	/** Nothing happens: an effect that finds nothing, a chance that is missed. */
	| { kind: "fizzle"; spot: Spot; art: string }
	| { kind: "cheer"; side: Side };
/** Cues that play together. Beats play one after the other. */
export type Beat = Cue[];

const zoneSpot = (side: Side, zone: number, row: Row = "monsters"): Spot => ({ at: "zone", side, row, zone });
const pileSpot = (side: Side, pile: PileSpot): Spot => ({ at: "pile", side, pile });
const CENTER: Spot = { at: "center" };
/** A name for a spot, the same one the board puts on its zones, piles and lanterns. */
export function spotKey(spot: Spot): string {
	if (spot.at === "zone") return `${spot.side}-${spot.row}-${spot.zone}`;
	if (spot.at === "lantern") return `${spot.side}-lantern`;
	if (spot.at === "pile") return `${spot.side}-${spot.pile}`;
	return "center";
}

const STRIKE_BY_EFFECT: Partial<Record<Effect["type"], StrikeStyle>> = { destroy: "bolt", "destroy-all": "bolt", "destroy-lowest": "quake", "destroy-attacker": "burst" };

/** The cues for one move: `before` is the board the move was made on, `after` the board it gave. */
export function effectCues(before: Board, events: readonly GameEvent[], after: Board): Beat[] {
	const beats: Beat[] = [];
	const push = (...cues: Cue[]) => {
		if (cues.length > 0) beats.push(cues);
	};
	/** Adds to the beat being built, so the cues play together. */
	const join = (...cues: Cue[]) => {
		const last = beats[beats.length - 1];
		if (last) last.push(...cues);
		else push(...cues);
	};
	const lastKind = () => beats[beats.length - 1]?.[0]?.kind;

	/* Monster Zones already used for a card that left, so two copies of a card leave from two zones. */
	const claimed = new Set<string>();
	/** The zone a monster stood in before the move and is gone from after it. The event's side first, then the other. */
	const leftZone = (side: Side, card: CardId): Spot | null => {
		for (const who of [side, other(side)]) {
			const zone = before[who].monsters.findIndex((slot, at) => slot?.card === card && after[who].monsters[at]?.card !== card && !claimed.has(`${who}-${at}`));
			if (zone >= 0) {
				claimed.add(`${who}-${zone}`);
				return zoneSpot(who, zone);
			}
		}
		return null;
	};
	/** The zone a monster is in: where it stood before the move, or where it stands after it. */
	const standing = (side: Side, card: CardId): Spot | null => {
		for (const state of [before, after]) {
			for (const who of [side, other(side)]) {
				const zone = state[who].monsters.findIndex((slot) => slot?.card === card);
				if (zone >= 0) return zoneSpot(who, zone);
			}
		}
		return null;
	};
	/** Where a card that would go to the Graveyard really goes: a Pendulum Monster goes face-up on the Extra Deck. */
	const restOf = (side: Side, card: CardId): Spot => {
		const kept = events.find((event) => event.type === "to-extra" && event.card === card);
		return kept?.type === "to-extra" ? pileSpot(kept.side, "extra") : pileSpot(side, "graveyard");
	};
	let order = 0;
	const leave = (how: LeaveHow, card: CardId | null, from: Spot, to: Spot): Cue => ({ kind: "leave", how, card, from, to, order: order++ });
	/** The card whose effect is being applied: it decides what a destruction looks like. */
	let source: CardId | null = null;
	const sourceArt = () => (source ? cardOf(source).art : "✋");
	const strikeStyle = (): StrikeStyle => {
		const info = source ? cardOf(source) : null;
		return (info && info.kind !== "monster" ? STRIKE_BY_EFFECT[info.effect.type] : undefined) ?? "crack";
	};

	/** A legendary monster that just arrived gets its scene in the next beat. */
	const legend = (card: CardId, side: Side, spot: Spot) => {
		const style = LEGENDS[card];
		if (style) push({ kind: "legend", style, card, side, spot });
	};

	for (const event of events) {
		switch (event.type) {
			case "drew": {
				const cue = leave("draw", null, pileSpot(event.side, "deck"), pileSpot(event.side, "hand"));
				if (lastKind() === "leave" && beats[beats.length - 1]?.every((item) => item.kind === "leave" && item.how === "draw")) join(cue);
				else push(cue);
				break;
			}
			case "summoned": {
				const spot = zoneSpot(event.side, event.zone);
				const gone = event.tributes.flatMap((card) => {
					const from = leftZone(event.side, card) ?? (before[event.side].monsters[event.zone]?.card === card ? spot : null);
					return from ? [leave("tribute", card, from, restOf(event.side, card))] : [];
				});
				push(...gone);
				push({ kind: "arrive", way: gone.length > 0 ? "tribute" : "normal", spot });
				legend(event.card, event.side, spot);
				break;
			}
			case "special": {
				const spot = zoneSpot(event.side, event.zone);
				if (event.how === "revive" || event.how === "own") {
					if (event.how === "revive") push(leave("revive", event.card, pileSpot(event.from ?? event.side, "graveyard"), spot));
					push({ kind: "arrive", way: event.how, spot });
					legend(event.card, event.side, spot);
					break;
				}
				/* The materials come together in the middle of the board, where the Summon happens. */
				const used = event.materials.map((card) => {
					const from = leftZone(event.side, card) ?? (before[event.side].monsters[event.zone]?.card === card ? spot : pileSpot(event.side, "hand"));
					return leave("material", card, from, CENTER);
				});
				push(...used);
				const materials = event.materials.map((card): SceneMaterial => ({ card, level: monsterOf(card).level, tuner: !!monsterOf(card).tuner }));
				const info = monsterOf(event.card);
				push({ kind: "summon", way: event.how, cards: [event.card], spots: [spot], materials, numbers: event.how === "fusion" ? [] : materials.map((item) => item.level), value: info.link ?? info.rank ?? info.level });
				legend(event.card, event.side, spot);
				break;
			}
			case "activated": {
				source = event.card;
				push({ kind: "cast", side: event.side, card: event.card });
				if (event.target) {
					/* What a card targets is where it was when the card was activated: on the field, or in a Graveyard. */
					const onField = (["you", "rival"] as const).flatMap((who) => before[who].monsters.flatMap((slot, zone) => (slot?.card === event.target ? [zoneSpot(who, zone)] : [])));
					const aimed = onField.find((spot) => spot.at === "zone" && spot.side !== event.side) ?? onField[0];
					const grave = (["you", "rival"] as const).find((who) => before[who].graveyard.includes(event.target as CardId));
					if (aimed) join({ kind: "aim", spot: aimed });
					else if (grave) join({ kind: "aim", spot: pileSpot(grave, "graveyard") });
				}
				break;
			}
			case "sprung":
				source = event.card;
				push({ kind: "cast", side: event.side, card: event.card });
				break;
			case "hand-effect":
				source = event.card;
				push({ kind: "cast", side: event.side, card: event.card });
				push({ kind: "shield", side: event.side });
				break;
			case "discarded":
				join(leave("discard", event.card, pileSpot(event.side, "hand"), pileSpot(event.side, "graveyard")));
				break;
			case "ability": {
				source = event.card;
				const from = standing(event.side, event.card);
				const to = standing(other(event.side), event.target);
				if (from && to) push({ kind: "beam", from, to, art: cardOf(event.card).art }, { kind: "aim", spot: to });
				break;
			}
			case "trigger":
				source = event.card;
				push({ kind: "beam", from: pileSpot(event.side, "graveyard"), to: { at: "lantern", side: other(event.side) }, art: cardOf(event.card).art });
				break;
			case "missed":
				push({ kind: "fizzle", spot: pileSpot(event.side, "graveyard"), art: "💤" });
				break;
			case "field": {
				push({ kind: "wave", side: event.side, art: cardOf(event.card).art });
				/* Every monster the Field Spell reaches, on both sides. */
				const raised: Cue[] = [];
				for (const who of ["you", "rival"] as const) {
					after[who].monsters.forEach((slot, zone) => {
						const was = before[who].monsters[zone];
						if (!slot || was?.card !== slot.card) return;
						const amount = atkOf(slot, after) - atkOf(was, before);
						if (amount !== 0) raised.push({ kind: "stat", spot: zoneSpot(who, zone), amount });
					});
				}
				push(...raised);
				break;
			}
			case "banished": {
				if (event.faceDown) {
					/* A cost paid from the top of the Deck: a few cards stand for all of them. */
					push(...event.cards.slice(0, 5).map(() => leave("banished", null, pileSpot(event.side, "deck"), pileSpot(event.side, "banished"))));
					break;
				}
				const gone = event.cards.flatMap((card) => {
					const from = leftZone(event.side, card);
					return from ? [leave("banished", card, from, pileSpot(event.side, "banished"))] : [];
				});
				push(...gone);
				break;
			}
			case "detached": {
				source = event.card;
				const from = standing(event.side, event.card);
				if (from) push(leave("material", event.material, from, pileSpot(event.side, "graveyard")));
				break;
			}
			case "scale":
				push({ kind: "arrive", way: "scale", spot: zoneSpot(event.side, event.zone, "backrow") });
				break;
			case "pendulum": {
				const row = after[event.side].backrow;
				const pillars: Cue[] = [0, row.length - 1].map((zone) => ({ kind: "arrive", way: "scale", spot: zoneSpot(event.side, zone, "backrow") }));
				push(...pillars);
				const landed = after[event.side].monsters.flatMap((slot, zone) => (slot && !before[event.side].monsters[zone] && event.cards.includes(slot.card) ? [{ card: slot.card, spot: zoneSpot(event.side, zone) }] : []));
				push({ kind: "summon", way: "pendulum", cards: landed.map((item) => item.card), spots: landed.map((item) => item.spot), materials: [], numbers: [event.low, event.high], value: 0 });
				break;
			}
			case "gained":
				push({ kind: "lp", side: event.side, from: event.lp - event.amount, to: event.lp, source: CENTER });
				break;
			case "boosted": {
				const spot = standing(event.side, event.card);
				if (spot) push({ kind: "stat", spot, amount: event.amount });
				break;
			}
			case "destroyed": {
				const from = leftZone(event.side, event.card);
				if (!from) break;
				const style = strikeStyle();
				const cues: Cue[] = [{ kind: "strike", style, spot: from }, leave("destroyed", event.card, from, restOf(from.at === "zone" ? from.side : event.side, event.card))];
				/* "Destroy all": every monster is hit at the same moment, in one flash. */
				if (lastKind() === "strike" && style === "bolt") join(...cues);
				else push(...cues);
				break;
			}
			case "no-effect":
				push({ kind: "fizzle", spot: CENTER, art: "💨" });
				break;
			case "attack-declared": {
				const from = standing(event.side, event.attacker);
				const to = event.target ? standing(other(event.side), event.target) : event.zone !== undefined ? zoneSpot(other(event.side), event.zone) : ({ at: "lantern", side: other(event.side) } as const);
				if (from && to) push({ kind: "beam", from, to, art: "⚔️" });
				source = null;
				break;
			}
			case "attack-stopped": {
				const spot = standing(after.turn, event.attacker);
				if (spot) push({ kind: "block", spot, art: sourceArt() });
				break;
			}
			case "returned": {
				const from = leftZone(event.side, event.card);
				if (from) push(leave("returned", event.card, from, pileSpot(event.side, inExtraDeck(event.card) ? "extra" : "hand")));
				break;
			}
			case "battle": {
				const defender = standing(other(event.side), event.defender);
				const gone = event.destroyed.flatMap((lost) => {
					const from = leftZone(lost.side, lost.card);
					return from ? [leave("destroyed", lost.card, from, restOf(lost.side, lost.card))] : [];
				});
				push(...(defender ? [{ kind: "strike", style: "clash", spot: defender } as const] : []), ...gone);
				break;
			}
			case "direct":
				push({ kind: "strike", style: "clash", spot: { at: "lantern", side: other(event.side) } });
				break;
			case "lp":
				push({ kind: "lp", side: event.side, from: event.from, to: event.to, source: { at: "lantern", side: event.side } });
				break;
			case "exodia":
				/* The win comes from the hand, not from damage: the scene ends in the middle of the board, not on the Life Points. */
				push({ kind: "legend", style: "forbidden", card: "exodia-the-forbidden-one", side: event.side, spot: CENTER });
				break;
			case "won":
				push({ kind: "cheer", side: event.side });
				break;
			default:
				break;
		}
	}
	return beats;
}

/** How long each kind of cue lasts, in beats. A beat lasts as long as its longest cue. */
const LENGTH: Partial<Record<Cue["kind"], number>> = { summon: 2.6, legend: 3.4 };
export const beatLength = (beat: Beat): number => Math.max(1, ...beat.map((cue) => LENGTH[cue.kind] ?? 1));
/** When each beat starts, in beats from the move. */
export function timeline(beats: readonly Beat[]): number[] {
	let at = 0;
	return beats.map((beat) => {
		const start = at;
		at += beatLength(beat);
		return start;
	});
}

/** The Monster Zones a card lands in during this move, and when it appears there, in beats: the board waits for a Summon scene. A legend's scene plays over the monster already in its zone. */
export function arrivals(beats: readonly Beat[]): Map<string, number> {
	const out = new Map<string, number>();
	const starts = timeline(beats);
	const land = (spot: Spot, at: number) => {
		if (spot.at !== "zone" || spot.row !== "monsters") return;
		const key = spotKey(spot);
		out.set(key, Math.max(out.get(key) ?? 0, at));
	};
	beats.forEach((beat, index) => {
		const begin = starts[index] ?? 0;
		const end = begin + beatLength(beat);
		for (const cue of beat) {
			if (cue.kind === "arrive") land(cue.spot, begin);
			if (cue.kind === "summon") for (const spot of cue.spots) land(spot, end - 0.35);
		}
	});
	return out;
}
/** The Life Points each player's lantern starts counting from, and when the counting starts, in beats. */
export function lpCounts(beats: readonly Beat[]): Partial<Record<Side, { from: number; at: number }>> {
	const out: Partial<Record<Side, { from: number; at: number }>> = {};
	const starts = timeline(beats);
	beats.forEach((beat, index) => {
		for (const cue of beat) if (cue.kind === "lp" && !out[cue.side]) out[cue.side] = { from: cue.from, at: starts[index] ?? 0 };
	});
	return out;
}

/**
 * The monsters whose ATK or DEF change in this move, with the numbers they showed before it and when, in beats, the
 * new numbers may appear: at the beat that shows the change, not before.
 */
export function statHolds(before: Board, beats: readonly Beat[]): Map<string, { atk: number; def: number; at: number }> {
	const out = new Map<string, { atk: number; def: number; at: number }>();
	const starts = timeline(beats);
	beats.forEach((beat, index) => {
		for (const cue of beat) {
			if (cue.kind !== "stat" || cue.spot.at !== "zone" || cue.spot.row !== "monsters") continue;
			const key = spotKey(cue.spot);
			const slot = before[cue.spot.side].monsters[cue.spot.zone];
			if (!slot || out.has(key)) continue;
			out.set(key, { atk: atkOf(slot, before), def: defOf(slot, before), at: starts[index] ?? 0 });
		}
	});
	return out;
}
