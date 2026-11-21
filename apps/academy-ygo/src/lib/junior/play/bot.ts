import { cardOf, monsterOf } from "./cards";
import { actor, apply, atkOf, defOf, legalPlays, other, type Board, type Move, type Side } from "./engine";

/**
 * The trainers of the masters' island: bots, not scripts. Each move is chosen by trying every legal move on a copy
 * of the board and scoring the board it leads to, from the bot's side. The bot never looks at face-down cards or at
 * the other player's hand: a pending answer is scored as if the other player let it happen.
 * Card effects are carried out by the rules engine, exactly as for the child.
 */
export interface Persona {
	/** How much the bot cares about the opponent's Life Points against its own: Kaiba attacks, Yugi is patient. */
	aggression: number;
	/** How often (0 to 1) the bot plays its best move; otherwise another move that still helps. A gentle trainer makes mistakes. */
	skill: number;
	/** How much the bot fears leaving a monster weaker than the opponent's strongest one in Attack Position. */
	caution: number;
	/** How often (0 to 1) the bot answers when an answer would help: a basic trainer forgets its Traps. */
	answers: number;
	/**
	 * How good a mistake still has to be, as a share of the best move's gain (0 to 1): a basic trainer may play any
	 * move that helps a little, a medium one only a move nearly as good as the best. Missing: any move that helps.
	 */
	slack?: number;
	/** How many more moves of its own turn it looks at, after each move (Summon then attack, destroy the blocker then attack directly). */
	plans?: number;
}
/** The persona used for the child's hints: the best move, carefully. */
export const HINT_PERSONA: Persona = { aggression: 1, skill: 1, caution: 1, answers: 1, plans: 1 };

const WIN = 1_000_000;
/** A random number generator in [0, 1) from a seed: the same seed gives the same duel. */
export function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** The board once nothing is pending any more, if the other player lets everything happen. */
function settled(state: Board): Board {
	let current = state;
	for (let tries = 0; tries < 4 && current.pending && !current.winner; tries++) {
		const passed = apply(current, { type: "pass" });
		if (!passed.ok) break;
		current = passed.board;
	}
	return current;
}

/** How good this board is for `me`. */
export function evaluate(state: Board, me: Side, persona: Persona): number {
	if (state.winner) return state.winner === me ? WIN : -WIN;
	const mine = state[me];
	const theirs = state[other(me)];
	const strength = (who: Side) => state[who].monsters.reduce((sum, slot) => (slot ? sum + worthOf(slot, state, who === me) : sum), 0);
	const setCards = (who: Side) => state[who].backrow.filter((slot) => slot && !slot.up && !slot.open).length;
	let score = mine.lp / 100 - (theirs.lp / 100) * persona.aggression;
	score += strength(me) - strength(other(me));
	score += (mine.hand.length - theirs.hand.length) * 3;
	/* A hand trap is kept to be used: stopping a card with it is worth the trade. (Its own hand only: it knows it.) */
	score -= mine.hand.filter((card) => {
		const info = cardOf(card);
		return info.kind === "monster" && !!info.hand && info.hand !== "no-battle-damage";
	}).length;
	score += (setCards(me) - setCards(other(me))) * 3;
	/* A Trap does nothing in the hand: Set, it is ready for the other player's turn. (Its own Traps only: it knows them.) */
	score += mine.backrow.filter((slot) => slot && !slot.up && !slot.open && cardOf(slot.card).kind === "trap").length;
	score += (mine.field ? 2 : 0) - (theirs.field ? 2 : 0);
	return score - foreseen(state, me) * persona.caution;
}

/** What a face-down monster of the other player is taken to be: the bot never looks at it. */
const UNKNOWN_DEF = 1500;
/** What a monster on the field is worth to its controller. The other player's face-down monsters are unknown. */
function worthOf(slot: NonNullable<Board["you"]["monsters"][number]>, state: Board, own: boolean): number {
	if (slot.faceDown && !own) return (UNKNOWN_DEF * 0.8) / 100 + 4;
	/* A monster with an effect to use is worth less on the turn that effect is negated (Effect Veiler). */
	const info = monsterOf(slot.card);
	const spent = state.used.some((key) => key.includes(`:${slot.card}`));
	/* An effect "when Normal Summoned" only counts on the turn of that Summon, while it has not been used. */
	const fresh = slot.summoned && !!(info.summonSearch || info.summonRevive);
	const silenced = slot.negatedTurn && !spent && (info.act || info.ability || fresh) ? 2.5 : 0;
	return (slot.position === "attack" ? atkOf(slot, state) : defOf(slot, state) * 0.8) / 100 + 4 - silenced;
}
/**
 * What the opponent's next Battle Phase would cost `me`, on the board as both players see it: each of their face-up
 * Attack Position monsters, strongest first, destroys the most valuable of my monsters it beats, or attacks directly
 * once I have none. A monster in Defense Position costs no Life Points. Losing the Duel that way counts most.
 */
function foreseen(state: Board, me: Side): number {
	const attackers = state[other(me)].monsters.flatMap((slot) => (slot && !slot.faceDown && slot.position === "attack" ? [atkOf(slot, state)] : [])).sort((a, b) => b - a);
	const mine = state[me].monsters.flatMap((slot) => (slot ? [{ value: slot.position === "attack" ? atkOf(slot, state) : defOf(slot, state), attack: slot.position === "attack", worth: worthOf(slot, state, true) }] : []));
	let lp = 0;
	let lost = 0;
	for (const atk of attackers) {
		const standing = mine.filter((item) => item.worth > 0);
		if (standing.length === 0) {
			lp += atk;
			continue;
		}
		const beaten = standing.filter((item) => item.value < atk).sort((a, b) => b.worth - a.worth)[0];
		if (!beaten) continue;
		lost += beaten.worth;
		if (beaten.attack) lp += atk - beaten.value;
		beaten.worth = 0;
	}
	if (lp >= state[me].lp) return WIN / 10;
	return lost + lp / 100;
}

/** The smallest gain that makes a move worth playing: moves that change nothing are not played. */
const WORTH = 0.01;
/** How many of its best moves an expert looks past, one move further. */
const PLANNED = 8;

/**
 * The bot's next move, for the player who has to act now. On its own turn it draws, plays what helps in Main Phase 1,
 * attacks while an attack helps, plays what still helps in Main Phase 2, then ends its turn. In strict play it moves
 * through the phases by hand, like the child.
 */
export function botMove(state: Board, persona: Persona, random: () => number = Math.random): Move {
	const me = actor(state);
	const plays = legalPlays(state);
	const score = (board: Board) => evaluate(settled(board), me, persona);
	/**
	 * What a move is worth, by the board it leads to, without knowing what a player cannot know: an attack on a
	 * face-down monster is weighed as an attack on an unknown one, and a coin toss as the average of both results.
	 */
	const worth = (from: Board, play: ReturnType<typeof legalPlays>[number]): number => {
		const move = play.move;
		if (move.type === "attack" && move.target !== "direct") {
			const hidden = from[other(from.turn)].monsters[move.target];
			const attacker = from[from.turn].monsters[move.attacker];
			if (hidden?.faceDown && attacker) {
				const atk = atkOf(attacker, from);
				return score(from) + (atk > UNKNOWN_DEF ? worthOf(hidden, from, false) : -(UNKNOWN_DEF - atk) / 100 - 0.5);
			}
		}
		if (play.events.some((event) => event.type === "coin")) {
			const right = apply(from, move, { coin: true });
			const wrong = apply(from, move, { coin: false });
			if (right.ok && wrong.ok) return (score(right.board) + score(wrong.board)) / 2;
		}
		return score(play.board);
	};
	const unsure = (play: ReturnType<typeof legalPlays>[number]) => play.events.some((event) => event.type === "coin" || (event.type === "flipped" && event.how === "attack"));
	if (state.pending) {
		/* An answer: the move that leaves the best board, letting it happen when nothing does better. */
		const pass = plays.find((play) => play.move.type === "pass");
		let best = pass ?? plays[0];
		let bestScore = best ? worth(state, best) : -Infinity;
		for (const play of plays) {
			const value = worth(state, play);
			if (value > bestScore + WORTH) [best, bestScore] = [play, value];
		}
		if (best && best !== pass && pass && random() > persona.answers) return pass.move;
		return best?.move ?? { type: "pass" };
	}
	if (state.phase === "draw" && !state.drawn && state.turnNumber > 1 && plays.some((play) => play.move.type === "draw")) return { type: "draw" };
	const now = score(state);
	/** The best board `depth` more moves of this turn reach from here (no answer pending, same player still acting). */
	const follow = (board: Board, depth: number): number => {
		const here = score(board);
		if (depth <= 0 || board.pending || board.winner || board.turn !== state.turn) return here;
		const next = legalPlays(board)
			.filter((play) => play.move.type !== "phase" && play.move.type !== "draw")
			.map((play) => ({ board: play.board, value: worth(board, play), sure: !unsure(play) }))
			.sort((a, b) => b.value - a.value)
			.slice(0, PLANNED);
		/* Nothing is planned past a coin toss or a monster it has not seen. */
		return Math.max(here, ...next.map((item) => (depth > 1 && item.sure ? follow(item.board, depth - 1) : item.value)));
	};
	/** The best move of one kind on a board, by how much it improves this turn's board. */
	const pick = (board: Board, options: ReturnType<typeof legalPlays>, kind: "attack" | "other") => {
		/* A hand trap is kept in the hand for the other player's turn: it is only put on the field as a last wall. */
		const exposed = !board[me].monsters.some(Boolean) && board[other(me)].monsters.some((slot) => !!slot && !slot.faceDown && slot.position === "attack");
		const kept = (move: Move) => {
			if (move.type !== "place" || move.row !== "monsters" || exposed) return false;
			const info = cardOf(move.card);
			return info.kind === "monster" && !!info.hand && info.hand !== "no-battle-damage";
		};
		let ranked = options
			.filter((play) => play.move.type !== "phase" && play.move.type !== "draw" && (kind === "attack") === (play.move.type === "attack") && !kept(play.move))
			.map((play) => ({ move: play.move, board: play.board, gain: worth(board, play) - now, sure: !unsure(play) }))
			.sort((a, b) => b.gain - a.gain);
		if (persona.plans && !board.strict) {
			/* An expert also counts the best move each one opens up this turn: a move that sets up a winning attack comes first. */
			ranked = ranked
				.slice(0, PLANNED)
				.map((option) => ({ ...option, gain: option.sure ? Math.max(option.gain, follow(option.board, persona.plans ?? 0) - now - WORTH) : option.gain }))
				.concat(ranked.slice(PLANNED))
				.sort((a, b) => b.gain - a.gain);
		}
		ranked = ranked.filter((option) => option.gain > WORTH);
		if (ranked.length === 0) return null;
		/* A gentle trainer sometimes plays a good move that is not the best one. */
		const close = ranked.filter((option) => option.gain >= (ranked[0]?.gain ?? 0) * (persona.slack ?? 0));
		if (close.length > 1 && random() > persona.skill) return close[1 + Math.floor(random() * (close.length - 1))]?.move ?? null;
		return ranked[0]?.move ?? null;
	};
	const end: Move = { type: "phase", to: "end" };
	/* Outside strict play (the trainers) the phases follow the moves: every move is tried from here. */
	if (!state.strict || state.turn === "rival") {
		/* In the Battle Phase attacks come first: a Main Phase move would end the Battle Phase. */
		if (state.phase === "battle") return pick(state, plays, "attack") ?? pick(state, plays, "other") ?? end;
		return pick(state, plays, "other") ?? pick(state, plays, "attack") ?? end;
	}
	/* In strict play (the child's hints) the phases are moved by hand: look at what the next phase would allow. */
	const at = (phase: "main1" | "battle" | "main2") => {
		const moved = apply(state, { type: "phase", to: phase });
		return moved.ok ? moved.board : null;
	};
	const worthIn = (board: Board | null, kind: "attack" | "other") => !!board && !!pick(board, legalPlays(board), kind);
	if (state.phase === "draw" || state.phase === "standby") return at("main1") ? { type: "phase", to: "main1" } : end;
	if (state.phase === "main1") {
		const build = pick(state, plays, "other");
		if (build) return build;
		if (worthIn(at("battle"), "attack")) return { type: "phase", to: "battle" };
		const battle = at("battle");
		const later = battle ? apply(battle, { type: "phase", to: "main2" }) : null;
		return worthIn(later?.ok ? later.board : null, "other") ? { type: "phase", to: "battle" } : end;
	}
	if (state.phase === "battle") {
		const strike = pick(state, plays, "attack");
		if (strike) return strike;
		return worthIn(at("main2"), "other") ? { type: "phase", to: "main2" } : end;
	}
	return pick(state, plays, "other") ?? end;
}
