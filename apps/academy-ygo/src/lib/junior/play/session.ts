/* The cards every duel is played with: importing the package gives them to the engine. */
import "@duel-academy/cards";
import { HINT_PERSONA, botMove, seeded } from "@duel-academy/engine";
import { cardOf, spellTarget, type CardId } from "@duel-academy/engine";
import { actor, apply, atkOf, board as makeBoard, defOf, legalMoves, mainZones, type Board, type GameEvent, type Material, type Move, type Reason } from "@duel-academy/engine";
import type { Demo, Level, RivalStep } from "./levels";
import { PERSONAS } from "./masters";

/**
 * One try at a level: the board, whose turn it is to act, and what the child did on the way.
 * Pure functions: each returns a new session. The rival's turn is taken one step per `next` call,
 * so the child sets the pace and sees one thing happen at a time.
 */
export type Status =
	/** The child may move. */
	| "playing"
	/** The rival's action is frozen: the child may answer with a Set Trap, or pass. */
	| "answer"
	/** The rival's turn: call `next` for its next step. */
	| "rival"
	| "solved"
	| "failed";
export type FailReason = "lost" | "monster-lost" | "lp-lost" | "out-of-moves" | "out-of-turns";

export interface Stats {
	/** 1, plus one for every failed try. */
	tries: number;
	hints: number;
	undos: number;
	/** Every refused move, by the rule it broke: each one is a specific misunderstanding. */
	slips: Reason[];
}
interface Snapshot {
	board: Board;
	status: Status;
	fail: FailReason | null;
	rivalTurn: number;
	rivalStep: number;
	moves: Move[];
}
export interface Session extends Snapshot {
	level: Level;
	/** What the last accepted move or rival step did, in order. */
	events: GameEvent[];
	/** Why the last move was refused, or null. */
	rejected: Reason | null;
	past: Snapshot[];
	stats: Stats;
}

const snapshot = ({ board, status, fail, rivalTurn, rivalStep, moves }: Snapshot): Snapshot => ({ board, status, fail, rivalTurn, rivalStep, moves });
const rivalTurns = (level: Level) => level.rival?.length ?? 0;

export function start(level: Level): Session {
	const session: Session = { level, board: makeBoard(level.setup), status: "playing", fail: null, rivalTurn: 0, rivalStep: 0, moves: [], events: [], rejected: null, past: [], stats: { tries: 1, hints: 0, undos: 0, slips: [] } };
	return settle(session);
}

function lostMonster(events: readonly GameEvent[]): boolean {
	return events.some((event) => (event.type === "battle" && event.destroyed.some((lost) => lost.side === "you")) || (event.type === "destroyed" && event.side === "you" && cardOf(event.card).kind === "monster"));
}
/** Is there anything left to do this turn besides moving through the phases? */
function canStillAct(state: Board): boolean {
	const useful = (candidate: Board) => legalMoves(candidate).some((move) => move.type !== "phase");
	if (useful(state)) return true;
	if (!state.strict) return false;
	if (state.phase !== "battle" && state.phase !== "main2") return true;
	const later = apply(state, { type: "phase", to: "main2" });
	return later.ok && useful(later.board);
}

/** Works out who acts next, or whether the try is over. */
function settle(session: Session): Session {
	const { level, board } = session;
	const done = (status: "solved" | "failed", fail: FailReason | null = null): Session => ({ ...session, status, fail, stats: status === "failed" ? { ...session.stats, tries: session.stats.tries + 1 } : session.stats });
	if (board.winner === "rival") return done("failed", "lost");
	if (board.winner === "you") return done("solved");
	if (level.keepMonsters && lostMonster(session.events)) return done("failed", "monster-lost");
	if (level.goal.type === "place-all" && board.you.hand.length === 0) return done("solved");
	if (level.goal.type === "destroy-all" && !board.rival.monsters.some(Boolean)) return done("solved");
	if (board.pending) return { ...session, status: actor(board) === "you" ? "answer" : "rival" };
	if (board.turn === "rival") return level.open || session.rivalTurn < rivalTurns(level) ? { ...session, status: "rival" } : done("failed", "out-of-turns");
	if (level.open) return { ...session, status: "playing" };
	const lastTurn = session.rivalTurn >= rivalTurns(level);
	if (level.goal.type === "hold") {
		if (!lastTurn) return { ...session, status: "playing" };
		if (level.goal.keep.some((card) => board.you.graveyard.includes(card))) return done("failed", "monster-lost");
		return board.you.lp >= level.goal.lp ? done("solved") : done("failed", "lp-lost");
	}
	if (lastTurn && !canStillAct(board)) return done("failed", "out-of-moves");
	return { ...session, status: "playing" };
}

/** A move by the child. A move that breaks a rule changes nothing and is remembered as a slip. */
export function play(session: Session, move: Move): Session {
	if (session.status !== "playing" && session.status !== "answer") return session;
	const result = apply(session.board, move);
	if (!result.ok) return { ...session, rejected: result.reason, stats: { ...session.stats, slips: [...session.stats.slips, result.reason] } };
	return settle({ ...session, board: result.board, events: result.events, rejected: null, moves: [...session.moves, move], past: [...session.past, snapshot(session)] });
}

const zoneOf = (state: Board, who: "you" | "rival", card: CardId) => state[who].monsters.findIndex((slot) => slot?.card === card);
const valueOf = (slot: NonNullable<Board["you"]["monsters"][number]>, state: Board) => (slot.position === "attack" ? atkOf(slot, state) : defOf(slot, state));
/** The strongest of the child's monsters this attacker can beat; a direct attack when the field is empty. */
function autoTarget(state: Board, attacker: number): number | "direct" | null {
	const mine = state.rival.monsters[attacker];
	if (!mine) return null;
	if (!state.you.monsters.some(Boolean)) return "direct";
	let best: number | null = null;
	state.you.monsters.forEach((slot, zone) => {
		if (!slot || valueOf(slot, state) >= atkOf(mine, state)) return;
		const current = best === null ? null : state.you.monsters[best];
		if (!current || valueOf(slot, state) > valueOf(current, state)) best = zone;
	});
	return best;
}
/** Turns one scripted step into a move on this board, or null when it cannot be done any more. */
function rivalMove(state: Board, step: RivalStep): Move | null {
	if (step.do === "summon") {
		/* A Normal Summon goes to a Main Monster Zone, never to the Extra Monster Zone. */
		const zone = state.rival.monsters.findIndex((slot, at) => at < mainZones(state) && !slot);
		return zone < 0 || !state.rival.hand.includes(step.card) ? null : { type: "place", card: step.card, row: "monsters", zone };
	}
	if (step.do === "extra") {
		/* A Synchro, Xyz or Link Summon with the monsters named, if they are all still there. */
		const materials = step.materials.map((card) => zoneOf(state, "rival", card));
		return materials.some((zone) => zone < 0) ? null : { type: "extra", card: step.card, materials };
	}
	if (step.do === "fusion") {
		/* A Fusion Summon: each named material is taken from the field if it is there, or else from the hand. */
		const zone = state.rival.backrow.findIndex((slot) => !slot);
		const materials = step.materials.map((card): Material => {
			const at = zoneOf(state, "rival", card);
			return at >= 0 ? { from: "field", zone: at } : { from: "hand", card };
		});
		return zone < 0 || !state.rival.hand.includes(step.spell) ? null : { type: "place", card: step.spell, row: "backrow", zone, summon: step.card, materials };
	}
	if (step.do === "cast") {
		const zone = state.rival.backrow.findIndex((slot) => !slot);
		return zone < 0 || !state.rival.hand.includes(step.card) || cardOf(step.card).kind !== "spell" ? null : { type: "place", card: step.card, row: "backrow", zone, ...(step.pick ? { pick: step.pick } : {}) };
	}
	if (step.do === "spell") {
		const target = zoneOf(state, "you", step.target);
		const zone = state.rival.backrow.findIndex((slot) => !slot);
		return target < 0 || zone < 0 || !state.rival.hand.includes(step.card) || cardOf(step.card).kind !== "spell" ? null : { type: "place", card: step.card, row: "backrow", zone, target };
	}
	if (step.do === "attack") {
		const attacker = zoneOf(state, "rival", step.attacker);
		if (attacker < 0) return null;
		const target = zoneOf(state, "you", step.target);
		if (target >= 0) return { type: "attack", attacker, target };
		return state.you.monsters.some(Boolean) ? null : { type: "attack", attacker, target: "direct" };
	}
	const order = state.rival.monsters
		.map((_, zone) => zone)
		.filter((zone) => {
			const slot = state.rival.monsters[zone];
			return slot && slot.position === "attack" && !slot.attacked;
		})
		.sort((a, b) => atkOf(state.rival.monsters[b]!, state) - atkOf(state.rival.monsters[a]!, state));
	for (const attacker of order) {
		const target = autoTarget(state, attacker);
		if (target !== null) return { type: "attack", attacker, target };
	}
	return null;
}

/**
 * The rival answering the child: Nox always flips a Set Trap when it can. A Trap that returns a Monster
 * saves the one a Spell aims at, or else its strongest Monster.
 */
function rivalAnswer(state: Board): Move {
	const answers = legalMoves(state).filter((move) => move.type !== "pass");
	/* A Spell that targets one of Nox's Monsters, or an attack on one, says which one is in danger. */
	const pending = state.pending;
	const aimed = pending?.kind === "spell" && spellTarget(pending.card) === "foe" ? pending.target : pending?.kind === "attack" && pending.target !== "direct" ? pending.target : undefined;
	const strongest = state.rival.monsters.reduce<number>((best, slot, zone) => (slot && (best < 0 || atkOf(slot, state) > atkOf(state.rival.monsters[best]!, state)) ? zone : best), -1);
	const wanted = aimed ?? strongest;
	/* A card that destroys aims at the child's attacker; one that helps aims at Nox's monster in danger. */
	const destroys = (move: Move) => {
		const slot = move.type === "spring" ? state.rival.backrow[move.zone] : null;
		const info = slot ? cardOf(slot.card) : null;
		return info?.kind !== "monster" && info?.effect.type === "destroy";
	};
	const attacker = pending?.kind === "attack" ? pending.attacker : undefined;
	return (
		answers.find((move) => move.type === "spring" && destroys(move) && move.target === attacker) ??
		answers.find((move) => move.type === "spring" && !destroys(move) && move.target === wanted) ??
		answers.find((move) => move.type === "spring" && !destroys(move)) ??
		/* A card from the hand that answers (Ash Blossom & Joyous Spring): Nox uses it as well. */
		answers.find((move) => move.type === "hand") ?? { type: "pass" }
	);
}

/** The most moves a trainer makes in one turn: a safety net, never reached in play. */
const MOST_BOT_MOVES = 80;
/** The same duel gives the same trainer moves: the random numbers come from the duel's seed and how far it has gone. */
const botRandom = (session: Session) => seeded((session.level.duel?.seed ?? 1) * 7919 + session.board.turnNumber * 131 + session.rivalStep);

/** A trainer of the masters' island: one move at a time, chosen by the bot; the turn ends once nothing helps any more. */
function botNext(session: Session): Session {
	const master = session.level.duel?.master;
	if (!master) return session;
	const persona = session.level.duel?.persona ?? PERSONAS[master];
	const tired = !session.board.pending && session.rivalStep >= MOST_BOT_MOVES;
	const move: Move = tired ? { type: "phase", to: "end" } : botMove(session.board, persona, botRandom(session));
	let result = apply(session.board, move);
	if (!result.ok) result = apply(session.board, session.board.pending ? { type: "pass" } : { type: "phase", to: "end" });
	/* Nothing at all can be done: the try ends rather than waiting for ever. */
	if (!result.ok) return { ...session, status: "failed", fail: "out-of-moves" };
	const turnOver = result.board.turn !== session.board.turn;
	return settle({ ...session, board: result.board, events: result.events, rejected: null, rivalTurn: session.rivalTurn + (turnOver ? 1 : 0), rivalStep: turnOver ? 0 : session.rivalStep + 1 });
}

/** The rival's next step: an answer to the child, one move of its turn, or the end of its turn once its steps are used up. */
export function next(session: Session): Session {
	if (session.status !== "rival") return session;
	if (session.level.duel) return botNext(session);
	if (session.board.pending) {
		const answered = apply(session.board, rivalAnswer(session.board));
		return answered.ok ? settle({ ...session, board: answered.board, events: answered.events, rejected: null }) : session;
	}
	const { level } = session;
	const steps = level.rival?.[session.rivalTurn] ?? (level.open ? (level.rivalRepeat ?? []) : []);
	for (let index = session.rivalStep; index < steps.length; index++) {
		const step = steps[index];
		if (!step) continue;
		const move = rivalMove(session.board, step);
		const result = move ? apply(session.board, move) : null;
		if (!result?.ok) continue;
		/* "auto-attack" stays the current step until no monster can attack any more. */
		return settle({ ...session, board: result.board, events: result.events, rejected: null, rivalStep: step.do === "auto-attack" ? index : index + 1 });
	}
	const ended = apply(session.board, { type: "phase", to: "end" });
	if (!ended.ok) return session;
	return settle({ ...session, board: ended.board, events: ended.events, rejected: null, rivalTurn: session.rivalTurn + 1, rivalStep: 0 });
}

/** Goes back to just before the child's last move. */
export function undo(session: Session): Session {
	const previous = session.past.at(-1);
	if (!previous) return session;
	return { ...session, ...previous, events: [], rejected: null, past: session.past.slice(0, -1), stats: { ...session.stats, undos: session.stats.undos + 1 } };
}
/** The first board again. What happened so far still counts, and starting over after a move counts as going back. */
export function restart(session: Session): Session {
	const undos = session.stats.undos + (session.moves.length > 0 && session.status !== "solved" && session.status !== "failed" ? 1 : 0);
	return { ...start(session.level), stats: { ...session.stats, undos } };
}

const sameMoves = (a: readonly Move[], b: readonly Move[]) => JSON.stringify(a) === JSON.stringify(b);
const rivalDone = (session: Session): Session => {
	let current = session;
	while (current.status === "rival") current = next(current);
	return current;
};
/** Shortest line of moves that solves the level from here, by trying every legal move. Null when there is none within `cap` boards. */
function search(from: Session, cap: number): Move | null {
	const key = (session: Session) => JSON.stringify([session.board, session.rivalTurn, session.rivalStep]);
	const first = rivalDone(from);
	const seen = new Set([key(first)]);
	let frontier: { session: Session; first: Move | null }[] = [{ session: first, first: null }];
	while (frontier.length > 0 && seen.size < cap) {
		const following: typeof frontier = [];
		for (const node of frontier) {
			if (node.session.status !== "playing" && node.session.status !== "answer") continue;
			for (const move of legalMoves(node.session.board)) {
				const after = rivalDone(play(node.session, move));
				const lead = node.first ?? move;
				if (after.status === "solved") return lead;
				if (after.status === "failed" || seen.has(key(after))) continue;
				seen.add(key(after));
				following.push({ session: after, first: lead });
			}
		}
		frontier = following;
	}
	return null;
}
/** The next move of a line that still solves the level, or null when there is none from here. Asking counts as a hint. */
export function hint(session: Session): { move: Move | null; session: Session } {
	const counted: Session = { ...session, stats: { ...session.stats, hints: session.stats.hints + 1 } };
	if (session.status !== "playing" && session.status !== "answer") return { move: null, session: counted };
	/* Against a trainer there is no recorded line: the hint is the move the best bot would make in the child's place. */
	if (session.level.duel) return { move: botMove(session.board, HINT_PERSONA, seeded(session.moves.length + 1)), session: counted };
	const { solution } = session.level;
	const onPath = sameMoves(session.moves, solution.slice(0, session.moves.length)) ? solution[session.moves.length] : undefined;
	return { move: onPath ?? search(session, session.level.open ? 1500 : 6000), session: counted };
}

export interface Outcome {
	tries: number;
	/** Solved with no failed try, no refused move, no step back and no hint. */
	firstTry: boolean;
	/** Solved without a hint. */
	clean: boolean;
	hints: number;
	slips: Reason[];
}
export function outcome(session: Session): Outcome {
	const { tries, hints, undos, slips } = session.stats;
	return { tries, firstTry: tries === 1 && hints === 0 && undos === 0 && slips.length === 0, clean: hints === 0, hints, slips: [...new Set(slips)] };
}

export interface Frame {
	board: Board;
	events: GameEvent[];
}
/** The boards of a demonstration, one per move, each made by the rules engine. */
export function demoFrames(demo: Demo): Frame[] {
	const frames: Frame[] = [{ board: makeBoard(demo.setup), events: [] }];
	for (const move of demo.moves) {
		const result = apply(frames[frames.length - 1]!.board, move);
		if (!result.ok) throw new Error(`demo move refused: ${result.reason}`);
		frames.push({ board: result.board, events: result.events });
	}
	return frames;
}

/**
 * Plays these moves of the child, with the rival's steps in between, until the try ends or the moves run out. For the
 * developer tools ("play the solution") and the tests.
 */
export function playOut(session: Session, moves: readonly Move[]): Session {
	let current = session;
	for (const move of moves) {
		while (current.status === "rival") current = next(current);
		if (current.status !== "playing" && current.status !== "answer") break;
		current = play(current, move);
	}
	while (current.status === "rival") current = next(current);
	return current;
}
/** The developer tools' "win now": the rival's Life Points drop to 0, to see what a win gives. */
export function forceWin(session: Session): Session {
	/* A try already over stays as it ended. */
	if (session.status === "solved" || session.status === "failed") return session;
	const board = { ...session.board, rival: { ...session.board.rival, lp: 0 }, winner: "you" as const, pending: null };
	return settle({ ...session, board, events: [{ type: "won", side: "you" }], rejected: null });
}
/** The developer tools' "bot plays my turn": the hint bot plays the child's moves until the turn passes or the try ends. */
export function botTurn(session: Session): Session {
	let current = session;
	const turn = current.board.turnNumber;
	const random = seeded(turn * 31 + session.moves.length);
	for (let step = 0; step < 80 && current.board.turnNumber === turn; step++) {
		/* The rival answering in the middle of the turn (a Trap flipped): it answers, then the turn goes on. */
		if (current.status === "rival") {
			current = next(current);
			continue;
		}
		if (current.status !== "playing" && current.status !== "answer") break;
		/* The best bot's move, at once: never the slow search of the hints. */
		const move = botMove(current.board, HINT_PERSONA, random);
		const after = play(current, move);
		current = after.rejected ? play(current, current.board.pending ? { type: "pass" } : { type: "phase", to: "end" }) : after;
		if (current.rejected) break;
	}
	/* What the bot did is not the child's: no refused move of its own counts as a slip. Failed tries still count. */
	return { ...current, rejected: null, stats: { ...current.stats, slips: session.stats.slips } };
}

