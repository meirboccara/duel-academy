import { readFileSync, writeFileSync } from "node:fs";
import { type Phase, phaseAfter, type Side } from "./duel";
import { type CardDef } from "./effects";
import { HIDDEN } from "./bot/view";
import { READINESS_DECKS } from "./deck-manifests";
import { type Match, type MatchRecord, matchRecord, openMatch, playIndex, raiseDispute, replayMatch, type SeatCard, seatFor } from "./match";

/** Moves by index (src/match.ts): the index picks the legal action itself, whatever names it shares. */
export { playIndex } from "./match";

const PHASE_NAME: Readonly<Record<Phase, string>> = { draw: "Draw Phase", standby: "Standby Phase", main1: "Main Phase 1", battle: "Battle Phase", main2: "Main Phase 2", end: "End Phase" };
const STEP_NAME = { start: "Start Step", battle: "Battle Step", end: "End Step" } as const;

/**
 * What pass does for `side` right now, read from the priority state only (open, passed, holder, chain length, turn, phase and step;
 * the same rules as `pass` in src/chain.ts), never from a hidden card.
 */
function windowLine(match: Match, side: Side): string {
	const { duel } = match;
	if (duel.winner) return "the duel is over";
	if (!seatFor(match, side).toAct) return "you wait: the opponent decides";
	if (duel.asking) return "a choice is pending";
	if (duel.building) return "trigger effects are being chained: passing declines the optional ones left";
	if (duel.chain.length > 0) return "response window: passing lets the chain resolve";
	if (duel.summoning) return "response window: passing lets the Summon succeed";
	if (duel.battle) return "response window: passing moves the attack to its next step";
	const { phase } = duel.turn;
	const step = phase === "battle" ? duel.battleStep ?? "battle" : null;
	const here = step ? `${PHASE_NAME[phase]} ${STEP_NAME[step]}` : PHASE_NAME[phase];
	const { open, passed, holder } = duel.priority;
	const after = phaseAfter(duel);
	const next = step === "start" ? "the Battle Step" : step === "battle" ? "the End Step" : after !== null ? PHASE_NAME[after] : "the next turn";
	if (!open) return duel.closing ? "response window: passing ends the End Phase (the turn moves on)" : `response window: passing keeps ${PHASE_NAME[phase]} (the game state reopens)`;
	if (passed.length === 0) return holder === duel.turn.player ? `open: passing asks to end ${here}; the opponent may still respond` : "open: passing gives the turn player priority";
	return holder === duel.turn.player ? `the opponent passed in ${here}: your pass moves on to ${next}` : `the turn player wants to end ${here}: your pass moves on to ${next}`;
}

/** Deliberate allow-list from seatFor's `SeatView` only (no card id, no View.unknown, setup, RNG or referee action payloads). */
export function seatBoard(match: Match, side: Side) {
	const seat = seatFor(match, side);
	const { view } = seat;
	const relative = (who: Side): "you" | "opponent" => who === side ? "you" : "opponent";
	const codes = (cards: readonly SeatCard[]) => cards.map((card) => card.code);
	// A ref starts with its controller ("rival monster 5"): said from the viewer's seat, "you" or "opponent".
	const rel = (ref: string) => ref.replace(/^(you|rival)(?= )/, (who) => relative(who as Side));
	// A Link Monster has no DEF (`def` absent); a Level monster has a Level, an Xyz Monster a Rank, a Link Monster a Link Rating.
	const field = (cards: readonly SeatCard[]) => cards.map(({ ref, slot, code, face, position, atk, def, level, rank, link, attribute, monsterType, modifiers }) => ({
		ref: rel(ref), slot, code, face,
		...(position === undefined ? {} : { position }),
		...(atk === undefined ? {} : { atk }),
		...(def === undefined ? {} : { def }),
		...(level === undefined ? {} : { level }),
		...(rank === undefined ? {} : { rank }),
		...(link === undefined ? {} : { link }),
		...(attribute === undefined ? {} : { attribute }),
		...(monsterType === undefined ? {} : { monsterType }),
		...(modifiers === undefined ? {} : { modifiers }),
	}));
	const player = (who: Side) => {
		const seen = view.players[who];
		return { lp: seen.lp, hand: codes(seen.hand), deck: seen.deck, extra: codes(seen.extra), monsters: field(seen.monsters), spells: field(seen.spells), field: field(seen.field), graveyard: codes(seen.graveyard), banished: codes(seen.banished) };
	};
	return {
		side, turn: { ...view.turn, player: relative(view.turn.player) }, winner: view.winner === null || view.winner === "draw" ? view.winner : relative(view.winner), toAct: seat.toAct, window: windowLine(match, side),
		...player(side), opponent: player(side === "you" ? "rival" : "you"),
		// Lasting effects in force (locks, negations, modifiers an effect left), said from this seat.
		lasting: view.lasting,
		// The chain by references ("you monster 5": controller, zone, slot; "opponent ..." for the other player), the last link last.
		chain: view.chain.map((link) => ({ player: relative(link.player), code: link.code, ref: rel(link.ref), targets: link.targets.map(rel), targetNames: link.targetCodes.map((code) => (code === HIDDEN ? "a card" : code)) })),
		// The label is the move's name (what `--expect` checks); the detail says what the move does.
		moves: seat.moves.map((name, index) => ({ index, name, detail: seat.details[index]! })),
		log: seat.log.map(({ auto, ...entry }) => ({ ...entry, side: relative(entry.side), ...(auto ? { auto: auto.map((pass) => ({ ...pass, side: relative(pass.side) })) } : {}) })),
		// A seat's own disputes whole; the other seat's only as a notice (no claim, no ruling), as in seatFor.
		disputes: seat.disputes.map((entry) => ({ ...entry, by: relative(entry.by) })),
	};
}

const LOG_TAIL = 15;

type Board = ReturnType<typeof seatBoard>;

/** A logged move as lines: the move, what it did (indented, with ">"), the automatic passes made for players with no legal response. */
function logLines(entry: Board["log"][number]): string[] {
	return [`  T${entry.turn} ${entry.phase} ${entry.side}: ${entry.name}`, ...(entry.notes ?? []).map((note) => `    > ${note}`), ...(entry.auto ?? []).map((pass) => `    ${pass.side}: ${pass.name}`)];
}

/** The board's header lines: turn, phase, who acts, the window, the winner. */
function headerLines(board: Board): string[] {
	const acts = board.toAct ? "you act" : "you wait";
	return [
		`Turn ${board.turn.number}, ${board.turn.phase} phase, ${board.turn.player === "you" ? "your turn" : "opponent's turn"}; ${acts}`,
		`Window: ${board.window}`,
		...(board.winner === null ? [] : [`Winner: ${board.winner === "draw" ? "draw" : board.winner}`]),
	];
}

/** The numbered moves: "[i] label -- detail". */
function moveLines(board: Board): string[] {
	return ["Moves (zero-based, for this board only):", ...(board.moves.length ? board.moves.map((move) => `[${move.index}] ${move.name} -- ${move.detail}`) : ["  none"])];
}

/** A readable text of the board: header (turn, phase, who acts), zones, chain, the log tail, then the numbered moves. */
export function renderSeat(board: Board): string {
	const list = (cards: readonly string[]) => (cards.length ? cards.join(", ") : "-");
	const zone = (cards: Board["monsters"]) =>
		cards.length ? cards.map((card) => {
			const kind = card.link !== undefined ? ` LINK-${card.link}` : card.rank !== undefined ? ` Rank ${card.rank}` : card.level !== undefined ? ` Level ${card.level}` : "";
			const stats = card.atk === undefined ? "" : card.def === undefined ? ` ${card.atk}` : ` ${card.atk}/${card.def}`;
			const mods = card.modifiers?.length ? ` {${card.modifiers.join("; ")}}` : "";
			return `${card.code}${card.face === "down" ? " (face-down)" : ""}${kind}${card.attribute ? ` ${card.attribute}` : ""}${card.monsterType ? ` ${card.monsterType}` : ""}${card.position ? ` ${card.position}` : ""}${stats} [${card.ref}]${mods}`;
		}).join("; ") : "-";
	const section = (title: string, who: typeof board | typeof board.opponent) => [
		`${title} (LP ${who.lp}, deck ${who.deck})`,
		`  hand: ${list(who.hand)}`,
		`  monsters: ${zone(who.monsters)}`,
		`  spells/traps: ${zone(who.spells)}`,
		`  field spell: ${zone(who.field)}`,
		`  graveyard: ${list(who.graveyard)}`,
		`  banished: ${list(who.banished)}`,
		`  extra deck: ${list(who.extra)}`,
	];
	const [turn, window, ...outcome] = headerLines(board);
	const lines = [
		turn!,
		window!,
		...outcome,
		...section("Opponent", board.opponent),
		...section("You", board),
		...(board.lasting.length ? ["Effects in force:", ...board.lasting.map((line) => `  ${line}`)] : []),
		"Chain (last link last):",
		...(board.chain.length ? board.chain.map((link, i) => `  ${i + 1}. ${link.player}: ${link.code} [${link.ref}]${link.targets.length ? `; targets: ${link.targets.map((ref, at) => `${link.targetNames[at]} [${ref}]`).join(", ")}` : ""}`) : ["  empty"]),
		`Log (last ${LOG_TAIL}):`,
		...(board.log.length ? board.log.slice(-LOG_TAIL).flatMap(logLines) : ["  empty"]),
		...(board.disputes.length ? ["Disputes:", ...board.disputes.map((entry) => ("notice" in entry ? `  ${entry.notice}` : `  ${entry.by}: ${entry.claim}${entry.ruling ? ` => ${entry.ruling.decision}` : ""}`))] : []),
		...moveLines(board),
	];
	return lines.join("\n");
}

/** What `move` prints by default: the move played, the log since it, who acts and the window, then the numbered moves. Not the board. */
function renderMoveResult(board: Board, played: string, index: number, since: number): string {
	return [
		`Played [${index}] ${JSON.stringify(played)}`,
		"Log since your move:",
		...(board.log.length > since ? board.log.slice(since).flatMap(logLines) : ["  (nothing logged)"]),
		...headerLines(board),
		...moveLines(board),
	].join("\n");
}

const sideArg = (value: string | undefined): Side => {
	if (value !== "you" && value !== "rival") throw new Error("seat must be you or rival");
	return value;
};
const integer = (value: string | undefined, label: string) => {
	if (value === undefined || !/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${label} must be an integer`);
	return Number(value);
};

/** Local referee command handler. Its returned output is seat-safe; the JSON file is PRIVATE referee data.
 * new FILE --you ID --rival ID --seed N [--first you|rival]
 * show FILE SEAT [--text] | move FILE SEAT INDEX [--expect NAME] [--zone N] [--position attack|defense] [--json|--text]
 * dispute FILE SEAT CLAIM... | replay FILE
 * `move` prints a compact result (the move, the log since it, who acts, the window, the moves); `--json` the whole board, `--text` the whole text board.
 */
export function runCli(args: readonly string[], defs: Readonly<Record<string, CardDef>>): string {
	const [command, file, ...rest] = args;
	if (!file || !["new", "show", "move", "dispute", "replay"].includes(command ?? "")) throw new Error("usage: agent-play new|show|move|dispute|replay FILE ... (FILE is a private referee record)");
	const flag = (name: string) => {
		const at = rest.indexOf(name);
		if (at < 0) return undefined;
		if (rest[at + 1] === undefined || rest[at + 1]!.startsWith("--")) throw new Error(`missing value for ${name}`);
		return rest[at + 1];
	};
	const save = (match: Match) => writeFileSync(file, JSON.stringify(matchRecord(match), null, 2) + "\n", { encoding: "utf8", flag: command === "new" ? "wx" : "w", mode: 0o600 });
	if (command === "new") {
		const deck = (id: number) => {
			const manifest = READINESS_DECKS.find((each) => each.id === id);
			if (!manifest) throw new Error(`no manifest ${id}`);
			const expand = (entries: typeof manifest.main) => entries.flatMap((entry) => {
				if (!entry.code || !defs[entry.code]) throw new Error(`unsupported card ${entry.code ?? entry.name}`);
				return Array<string>(entry.count).fill(entry.code);
			});
			return { deck: expand(manifest.main), extra: expand(manifest.extra) };
		};
		const match = openMatch({ seed: integer(flag("--seed"), "seed"), you: deck(integer(flag("--you"), "you manifest")), rival: deck(integer(flag("--rival"), "rival manifest")), ...(flag("--first") === undefined ? {} : { first: sideArg(flag("--first")) }) }, defs);
		save(match);
		return JSON.stringify({ saved: true });
	}
	// Always rebuild, never trust or persist a serialized live Duel.
	let match = replayMatch(JSON.parse(readFileSync(file, "utf8")) as MatchRecord, defs);
	if (command === "replay") return JSON.stringify({ moves: match.log.length, disputes: match.disputes.length, turn: match.duel.turn.number, phase: match.duel.turn.phase, toAct: seatFor(match, "you").toAct ? "you" : seatFor(match, "rival").toAct ? "rival" : null, winner: match.duel.winner });
	const side = sideArg(rest[0]);
	let compact: { played: string; index: number; since: number } | null = null;
	if (command === "move") {
		const position = flag("--position");
		if (position !== undefined && position !== "attack" && position !== "defense") throw new Error("position must be attack or defense");
		const index = integer(rest[1], "index");
		const played = seatFor(match, side).moves[index];
		const since = match.log.length;
		match = playIndex(match, side, index, { expect: flag("--expect"), zone: flag("--zone") === undefined ? undefined : integer(flag("--zone"), "zone"), position });
		save(match);
		compact = { played: played!, index, since };
	} else if (command === "dispute") {
		const claim = rest.slice(1).join(" ").trim();
		if (!claim) throw new Error("dispute requires a claim");
		match = raiseDispute(match, side, claim);
		save(match);
		// One line, not the board: the dispute's number (for the referee's settle), its place in the game, nothing of the claim.
		if (!rest.includes("--json") && !rest.includes("--text")) {
			const made = match.disputes.at(-1)!;
			return `Dispute ${match.disputes.length - 1} recorded (open): raised by you after move ${made.at}, turn ${made.turn} ${made.phase} phase.`;
		}
	}
	const board = seatBoard(match, side);
	if (rest.includes("--json")) return JSON.stringify(board, null, 2);
	if (rest.includes("--text")) return renderSeat(board);
	if (compact) return renderMoveResult(board, compact.played, compact.index, compact.since);
	return JSON.stringify(board, null, 2);
}
