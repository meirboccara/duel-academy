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
	const strength = (who: Side) =>
		state[who].monsters.reduce((sum, slot) => {
			if (!slot) return sum;
			const value = slot.position === "attack" ? atkOf(slot, state) : defOf(slot, state) * 0.8;
			return sum + value / 100 + 4;
		}, 0);
	const setCards = (who: Side) => state[who].backrow.filter((slot) => slot && !slot.up && !slot.open).length;
	let score = mine.lp / 100 - (theirs.lp / 100) * persona.aggression;
	score += strength(me) - strength(other(me));
	score += (mine.hand.length - theirs.hand.length) * 3;
	score += (setCards(me) - setCards(other(me))) * 3;
	score += (mine.field ? 2 : 0) - (theirs.field ? 2 : 0);
	/* A monster left in Attack Position weaker than the opponent's strongest attacker is at risk on the next turn. */
	const threat = Math.max(0, ...theirs.monsters.map((slot) => (slot && slot.position === "attack" ? atkOf(slot, state) : 0)));
	for (const slot of mine.monsters) {
		if (slot?.position === "attack" && atkOf(slot, state) < threat) score -= ((threat - atkOf(slot, state)) / 100) * 0.5 * persona.caution;
	}
	return score;
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
	if (state.pending) {
		/* An answer: the move that leaves the best board, letting it happen when nothing does better. */
		const pass = plays.find((play) => play.move.type === "pass");
		let best = pass ?? plays[0];
		let bestScore = best ? score(best.board) : -Infinity;
		for (const play of plays) {
			const value = score(play.board);
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
			.map((play) => ({ board: play.board, value: score(play.board) }))
			.sort((a, b) => b.value - a.value)
			.slice(0, PLANNED);
		return Math.max(here, ...next.map((item) => (depth > 1 ? follow(item.board, depth - 1) : item.value)));
	};
	/** The best move of one kind on a board, by how much it improves this turn's board. */
	const pick = (board: Board, options: ReturnType<typeof legalPlays>, kind: "attack" | "other") => {
		let ranked = options
			.filter((play) => play.move.type !== "phase" && play.move.type !== "draw" && (kind === "attack") === (play.move.type === "attack"))
			.map((play) => ({ move: play.move, board: play.board, gain: score(play.board) - now }))
			.sort((a, b) => b.gain - a.gain);
		if (persona.plans && !board.strict) {
			/* An expert also counts the best move each one opens up this turn: a move that sets up a winning attack comes first. */
			ranked = ranked
				.slice(0, PLANNED)
				.map((option) => ({ ...option, gain: Math.max(option.gain, follow(option.board, persona.plans ?? 0) - now - WORTH) }))
				.concat(ranked.slice(PLANNED))
				.sort((a, b) => b.gain - a.gain);
		}
		ranked = ranked.filter((option) => option.gain > WORTH);
		if (ranked.length === 0) return null;
		/* A gentle trainer sometimes plays a good move that is not the best one. */
		if (ranked.length > 1 && random() > persona.skill) return ranked[1 + Math.floor(random() * (ranked.length - 1))]?.move ?? null;
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
