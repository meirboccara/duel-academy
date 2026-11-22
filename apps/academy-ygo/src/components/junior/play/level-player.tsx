"use client";

import { ArrowLeft, ArrowRight, Box, CircleCheck, Hand, Lightbulb, MonitorPlay, Printer, RotateCcw, Square, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { cardOf, hasRulesText, inPool, isQuickPlay, mentions, monsterOf, spellTarget, tributesFor, type CardId } from "@duel-academy/engine";
import { PLAY_COPY, VOICE_LOCALE, narrateAll, phasesStarted, playCopyFor, stepsStarted, type PlayCopy } from "@/lib/junior/play/copy";
import { MASTER_NAMES, masterPicture } from "@/lib/junior/play/masters";
import { actor, apply, effectMoves, fusionFits, mainZones, scalesOf, type Board, type GameEvent, type Move, type Phase, type Row, type Side } from "@duel-academy/engine";
import { WORLD_IDS, type Level } from "@/lib/junior/play/levels";
import { hint as askHint, botTurn, forceWin, next, outcome, play, playOut, restart, start, undo, type Outcome, type Session } from "@/lib/junior/play/session";
import { DevLevelBarSlot } from "../dev/dev-slot";
import { chime, speak, stopSpeaking } from "@/lib/junior/play/sound";
import { BEAT, BoardStage } from "./board-stage";
import type { HandItem } from "./board3d/board-3d-stage";
import { BOARD3D_COPY, Board3dContext, useBoard3d, type Board3d } from "./board3d/support";
import { DemoTheatre } from "./demo-theatre";
import { CardFace, ChainTower, ClashBanner, PhaseBar, PileViewer, pileKey, printedText, zoneKey, type Pile } from "./mini-board";

/** What the child is holding between two taps. */
type Holding =
	/** A card of the hand; `set`: a Quick-Play Spell to Set face-down instead of activating it. */
	| { kind: "hand"; card: CardId; set?: true }
	/** A Spell placed in a zone, waiting for the Monster it should hit. */
	| { kind: "aim"; card: CardId; zone: number }
	| { kind: "tributes"; card: CardId; chosen: number[]; set?: true }
	| { kind: "monster"; zone: number }
	/** A Set card being flipped, waiting for the Monster it targets: one of the child's (`you`) or of the rival. */
	| { kind: "trap"; zone: number; aim: Side }
	/** Call of the Haunted being flipped, waiting for the monster in the child's Graveyard. */
	| { kind: "haunt"; zone: number }
	/** Junk Synchron's effect right after its Normal Summon, waiting for the monster in the child's Graveyard. */
	| { kind: "revive"; zone: number }
	/** A monster's effect paid with a card from the hand (Dark Paladin, a Dragon Knight, Thunder Giant), waiting for that card. */
	/** A card of the hand to discard as a cost: for a monster's effect, or (`trap`) for a Set Counter Trap such as Magic Jammer. */
	| { kind: "act-cost"; zone: number; target?: number; trap?: true }
	/** A Monster whose effect is being used, waiting for its target. */
	| { kind: "ability"; zone: number }
	/** A Spell with a cost, waiting for the card to discard; with `pick`, a Spell waiting for the monster of the hand it Special Summons. */
	| { kind: "cost"; card: CardId; zone: number; target?: number; pick?: true }
	/** A Spell that targets a card in a Graveyard, waiting for that card. */
	| { kind: "grave"; card: CardId; zone: number }
	/** A card to choose in the Deck: for a Spell that searches (`card`), or for the monster just Normal Summoned in `zone` (Magician's Rod). */
	| { kind: "search"; card?: CardId; zone: number }
	/** A Ritual Spell or Polymerization, waiting for the monsters to use; `summon` is the Fusion Monster. */
	| { kind: "materials"; mode: "ritual" | "fusion"; card: CardId; zone: number; summon?: CardId; chosen: Chosen[] }
	/** A Synchro, Xyz or Link Monster picked in the Extra Deck, waiting for its materials on the field. */
	| { kind: "extra"; card: CardId; chosen: number[] }
	/** A Pendulum Summon, waiting for the monsters in the hand (by their place in it). */
	| { kind: "pendulum"; chosen: number[] }
	| null;
/** A monster picked as a Tribute or material: a card of the hand, by its place in it, or a Monster Zone. */
type Chosen = { from: "hand"; card: CardId; index: number } | { from: "field"; zone: number };

const primary = "inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950";
const quiet = "inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-white/25 px-4 py-2 font-semibold text-fg hover:border-gold-400";
const needsTarget = (card: CardId) => spellTarget(card) !== null;
const aimsAt = (card: CardId): Side => (spellTarget(card) === "own" ? "you" : "rival");
const firstFree = (board: Board) => Math.max(0, board.you.backrow.findIndex((slot) => !slot));
const firstMonsterZone = (board: Board) => Math.max(0, board.you.monsters.findIndex((slot, zone) => zone < mainZones(board) && !slot));
const levelOf = (card: CardId) => monsterOf(card).level;
/** A Spell that targets a card in a Graveyard is not Set: it could not be given its target when flipped. */
const isReviver = (card: CardId) => {
	const info = cardOf(card);
	return info.kind === "spell" && info.effect.type === "revive";
};
const handEffect = (card: CardId) => {
	const info = cardOf(card);
	return (info.kind === "monster" && !!info.hand) || isImpermanence(card);
};
/** Infinite Impermanence: a Trap that can be activated from the hand. */
const isImpermanence = (card: CardId) => {
	const info = cardOf(card);
	return info.kind === "trap" && info.effect.type === "impermanence";
};
/** Effect Veiler, Infinite Impermanence: used from the hand, they wait for the rival's Monster they target. */
const handAims = (card: CardId) => {
	const info = cardOf(card);
	return (info.kind === "monster" && info.hand === "veiler") || isImpermanence(card);
};
/** The cards of the Deck a searching effect may take, each once. */
const searchable = (board: Board, pick: { card?: CardId; zone: number }): CardId[] => {
	const deck = [...new Set(board.you.deck)];
	if (pick.card) {
		const info = cardOf(pick.card);
		const effect = info.kind === "spell" ? info.effect : null;
		return effect && (effect.type === "search-pick" || effect.type === "deck-summon") ? deck.filter((card) => inPool(card, effect.pool)) : [];
	}
	const source = board.summonTrigger?.card ?? board.you.monsters[pick.zone]?.card;
	const named = source ? monsterOf(source).summonSearch : undefined;
	return named ? deck.filter((card) => cardOf(card).kind !== "monster" && mentions(card, named)) : [];
};

export interface LevelPlayerProps {
	/** The developer tools bar under the board: only under `next dev`. */
	dev?: boolean;
	level: Level;
	number: number;
	total: number;
	copy: PlayCopy;
	locale: Locale;
	moving: boolean;
	sound: boolean;
	/** A level solved before skips the automatic demonstration. */
	solvedBefore: boolean;
	hasNext: boolean;
	onSolved: (result: Outcome) => void;
	onNext: () => void;
	onExit: () => void;
}

/**
 * One level on the mini board. The child taps a card and then a zone, or a Monster and then its target;
 * the board answers by playing the rule out. Nothing is asked: a move that breaks a rule gets one line
 * of explanation, a losing move is shown and can be taken back.
 *
 * Where the browser draws WebGL the level fills the screen like a game: the duel mat in 3D with the child's hand in
 * front of it, and beside it (under it on an upright tablet) a panel with the goal, what just happened and the
 * buttons. Tapping a 3D zone, pile or card calls the very same handlers as the HTML buttons. Those HTML buttons are
 * still on the page, hidden from the eyes only, so a keyboard and a screen reader play exactly as before, and a
 * "Flat board" button brings the HTML board back for anyone who prefers it. Without WebGL nothing changes.
 */
export function LevelPlayer({ dev = false, level, number, total, copy, locale, moving, sound, solvedBefore, hasNext, onSolved, onNext, onExit }: LevelPlayerProps) {
	const [session, setSession] = useState<Session>(() => start(level));
	const [pick, setPick] = useState<Holding>(null);
	/** The pile the child has opened to look through. */
	const [open, setOpen] = useState<{ side: Side; pile: Pile } | null>(null);
	const [hinted, setHinted] = useState<Move | null>(null);
	const [noHint, setNoHint] = useState(false);
	const demoRule = level.teaches ?? level.uses[0];
	const [demo, setDemo] = useState(() => !!level.teaches && !solvedBefore);
	const text = copy.levels[level.id];
	const { board, status } = session;
	const resultRef = useRef<HTMLButtonElement>(null);
	const reported = useRef(false);
	/* The 3D mat: whether it can and should be drawn, the room kept for it, and the card of the hand the keyboard is on. */
	const view = useBoard3d();
	const solid = view.ready && !view.flat;
	const [slot, setSlot] = useState<HTMLElement | null>(null);
	const [handFocus, setHandFocus] = useState<number | null>(null);
	const failView = view.fail;
	const three = useMemo<Board3d | null>(() => (solid ? { slot, locale, fail: failView } : null), [solid, slot, locale, failView]);

	/*
	 * With the phase bar, each of the child's phases is explained in one sentence the first time it starts in this
	 * level. Worked out once per batch of events, so going back and forth never says it twice.
	 */
	/* From the island of steps on, the two steps of an attack are explained the same way. */
	const withSteps = WORLD_IDS.indexOf(level.world) >= WORLD_IDS.indexOf("steps");
	type Topic = Phase | "battle-step" | "damage-step";
	const taught = useRef<{ events: readonly GameEvent[] | null; fresh: Topic[]; seen: Set<Topic> }>({ events: null, fresh: [], seen: new Set() });
	if (taught.current.events !== session.events) {
		const phases: Topic[] = level.bar === "none" ? [] : phasesStarted(session.events);
		const steps: Topic[] = withSteps ? stepsStarted(session.events).map((step): Topic => (step === "battle" ? "battle-step" : "damage-step")) : [];
		const fresh = [...phases, ...steps].filter((topic) => !taught.current.seen.has(topic));
		for (const topic of fresh) taught.current.seen.add(topic);
		taught.current = { events: session.events, fresh, seen: taught.current.seen };
	}
	const explain = (words: PlayCopy, topic: Topic) => (topic === "battle-step" ? words.stepHelp.battle : topic === "damage-step" ? words.stepHelp.damage : words.phaseHelp[topic]);
	const told = (words: PlayCopy) => [narrateAll(words, session.events), ...taught.current.fresh.map((topic) => explain(words, topic))].filter(Boolean).join(" ");
	const line = session.rejected ? copy.reasons[session.rejected] : told(copy);
	/* Voice and sounds follow what just happened. They start only after the child's own tap. Hebrew is spoken in English, like the cards. */
	const voice = level.duel ? playCopyFor(VOICE_LOCALE[locale], MASTER_NAMES[level.duel.master]) : PLAY_COPY[VOICE_LOCALE[locale]];
	const voiceLine = session.rejected ? voice.reasons[session.rejected] : told(voice);
	const spoken = useRef("");
	useEffect(() => {
		if (!sound || demo) return;
		const say = voiceLine || voice.levels[level.id]?.goal || "";
		/* The same refusal twice in a row is said twice: the count of slips tells them apart. */
		const key = `${say}#${session.stats.slips.length}#${session.moves.length}`;
		if (key === spoken.current) return;
		spoken.current = key;
		speak(say, VOICE_LOCALE[locale]);
		if (session.rejected) chime("no");
		else if (session.events.some((event) => event.type === "won") || status === "solved") chime("win");
		else if (session.events.some((event) => event.type === "battle" || event.type === "direct")) chime("clash");
		else if (session.events.some((event) => event.type === "destroyed")) chime("zap", moving ? BEAT : 0);
		else if (session.events.some((event) => event.type === "gained")) chime("heal", moving ? BEAT : 0);
		else if (session.events.some((event) => event.type === "lp")) chime("hurt");
		else if (session.events.length > 0) chime("place");
	}, [sound, demo, voiceLine, voice, level.id, locale, session, status, moving]);
	useEffect(() => stopSpeaking, []);
	useEffect(() => {
		if (status === "solved" && !reported.current) {
			reported.current = true;
			onSolved(outcome(session));
		}
	}, [status, session, onSolved]);
	/* The result takes the focus once, when the try ends. */
	useEffect(() => {
		if (status === "solved" || status === "failed") resultRef.current?.focus();
	}, [status]);
	/* Leaving the demonstration puts the focus back on the level heading. */
	const headingRef = useRef<HTMLHeadingElement>(null);
	const closeDemo = () => {
		setDemo(false);
		headingRef.current?.focus();
	};

	const update = (nextSession: Session) => {
		setSession(nextSession);
		setPick(null);
		setOpen(null);
		setHinted(null);
		setNoHint(false);
	};
	const act = (move: Move) => update(play(session, move));
	/** A monster's effect: one paid with a card from the hand waits for that card; any other is used at once. */
	const useAbility = (zone: number, target?: number) => {
		const slot = session.board[actor(session.board)].monsters[zone];
		const paid = slot ? monsterOf(slot.card).act : undefined;
		if (paid && (paid.kind === "destroy" || paid.kind === "negate-spell")) return setPick({ kind: "act-cost", zone, ...(target === undefined ? {} : { target }) });
		act({ type: "ability", zone, ...(target === undefined ? {} : { target }) });
	};
	/* Against a trainer of the masters' island, the trainer plays its turn by itself, one move at a time. */
	useEffect(() => {
		if (!level.duel || session.status !== "rival") return;
		/* After the trainer activates a card or changes a monster's ATK, a longer pause: the child reads what changed. */
		const telling = session.events.some((event) => (event.type === "activated" || event.type === "sprung" || event.type === "boosted") && event.side === "rival");
		const timer = window.setTimeout(() => update(next(session)), telling ? 2200 : moving ? 700 : 250);
		return () => window.clearTimeout(timer);
	}, [level.duel?.master, session, moving]);
	const showHint = (from: Session) => {
		const { move, session: counted } = askHint(from);
		setSession(counted);
		setPick(null);
		setHinted(move);
		setNoHint(!move);
	};
	/** After three failed tries the next move is shown without being asked for. */
	const comeBack = (again: Session) => (again.stats.tries > 3 && (again.status === "playing" || again.status === "answer") ? showHint(again) : update(again));

	const free = status === "playing";
	/* Effects written as data (Sage with Eyes of Blue, Destiny HERO - Malicious…): each way to use one now is a button. */
	const effectChoices = useMemo(() => (free ? effectMoves(board).filter((move) => apply(board, move).ok) : []), [free, board]);
	/** Activating a Spell: one with a cost first waits for the card to discard. */
	const placeSpell = (card: CardId, zone: number, target?: number) => {
		const extra = target === undefined ? {} : { target };
		const info = cardOf(card);
		/* With no other card in hand there is nothing to pay with: the move is tried, and the rule explains why not. */
		const others = board.you.hand.filter((held) => held !== card).length + board.you.hand.filter((held) => held === card).length - 1;
		if (info.kind !== "monster" && info.cost?.type === "discard" && others > 0) return setPick({ kind: "cost", card, zone, ...extra });
		/* Ancient Rules: the monster of the hand to Special Summon is chosen like a cost, by tapping it. */
		if (info.kind === "spell" && info.effect.type === "hand-summon" && others > 0) return setPick({ kind: "cost", card, zone, pick: true });
		act({ type: "place", card, row: "backrow", zone, ...extra });
	};
	const onHand = (card: CardId, index: number) => {
		/* In answer to an attack, a card with a Quick Effect in the hand can be picked to read it, then used. */
		if (pick?.kind === "act-cost" && pick.trap) return act({ type: "spring", zone: pick.zone, discard: card });
		if (pick?.kind === "act-cost") return act({ type: "ability", zone: pick.zone, ...(pick.target === undefined ? {} : { target: pick.target }), discard: card });
		if (status === "answer") return handEffect(card) ? setPick(pick?.kind === "hand" && pick.card === card ? null : { kind: "hand", card }) : undefined;
		if (!free) return;
		if (pick?.kind === "pendulum") return setPick({ ...pick, chosen: pick.chosen.includes(index) ? pick.chosen.filter((at) => at !== index) : [...pick.chosen, index] });
		if (pick?.kind === "materials" && pick.card !== card) {
			const already = pick.chosen.some((item) => item.from === "hand" && item.index === index);
			return setPick({ ...pick, chosen: already ? pick.chosen.filter((item) => !(item.from === "hand" && item.index === index)) : [...pick.chosen, { from: "hand", card, index }] });
		}
		if (pick && pick.kind !== "extra" && "card" in pick && pick.card === card) return setPick(null);
		if (pick?.kind === "cost") return act({ type: "place", card: pick.card, row: "backrow", zone: pick.zone, ...(pick.target === undefined ? {} : { target: pick.target }), ...(pick.pick ? { pick: card } : { discard: card }) });
		const info = cardOf(card);
		if (info.kind === "spell" && (info.effect.type === "search-pick" || info.effect.type === "deck-summon")) return setPick({ kind: "search", card, zone: firstFree(board) });
		if (info.kind === "spell" && info.effect.type === "revive") return setPick({ kind: "grave", card, zone: firstFree(board) });
		if (info.kind === "spell" && info.effect.type === "ritual") return setPick({ kind: "materials", mode: "ritual", card, zone: firstFree(board), chosen: [] });
		if (info.kind === "spell" && info.effect.type === "fusion") {
			/* The Fusion Monster to Summon is the one in the Extra Deck; with none there, the rule explains why not. */
			const summon = board.you.extra.find((item) => monsterOf(item).fusion);
			return summon ? setPick({ kind: "materials", mode: "fusion", card, zone: firstFree(board), summon, chosen: [] }) : act({ type: "place", card, row: "backrow", zone: firstFree(board) });
		}
		setPick(info.kind === "monster" && tributesFor(info.level) > 0 && info.scale === undefined ? { kind: "tributes", card, chosen: [] } : { kind: "hand", card });
	};
	const toggleZone = (zones: readonly number[], zone: number) => (zones.includes(zone) ? zones.filter((at) => at !== zone) : [...zones, zone]);
	const onPile = (side: Side, pile: Pile) => setOpen(open?.side === side && open.pile === pile ? null : { side, pile });
	/** A card tapped in an open pile: the Graveyard card a Spell targets, or the Extra Deck monster to Summon. */
	const onPileCard = (index: number) => {
		if (!open || !free) return;
		if (open.pile === "graveyard" && pick?.kind === "grave") return act({ type: "place", card: pick.card, row: "backrow", zone: pick.zone, grave: { side: open.side, index } });
		if (open.pile === "graveyard" && pick?.kind === "haunt") return act({ type: "spring", zone: pick.zone, grave: { side: open.side, index } });
		if (open.pile === "graveyard" && pick?.kind === "revive") return act({ type: "ability", zone: pick.zone, grave: { side: open.side, index } });
		const card = open.pile === "extra" ? board.you.extra[index] : undefined;
		if (!card) return;
		/* A Fusion Monster cannot be Summoned from here: the move is tried, and the rule says what it needs. */
		if (monsterOf(card).fusion) return act({ type: "extra", card, materials: [] });
		setPick({ kind: "extra", card, chosen: [] });
		setOpen(null);
	};
	const confirm = () => {
		if (pick?.kind === "materials") {
			const materials = pick.chosen.map((item) => (item.from === "hand" ? ({ from: "hand", card: item.card } as const) : ({ from: "field", zone: item.zone } as const)));
			/* The Fusion Monster these materials make: the first one of the Extra Deck whose materials they are. */
			const used = pick.chosen.flatMap((item) => (item.from === "hand" ? [item.card] : board.you.monsters[item.zone] ? [board.you.monsters[item.zone]!.card] : []));
			const fused = pick.mode === "fusion" ? (board.you.extra.find((card) => fusionFits(used, monsterOf(card).fusion ?? [])) ?? pick.summon) : pick.summon;
			return act({ type: "place", card: pick.card, row: "backrow", zone: pick.zone, ...(fused ? { summon: fused } : {}), materials });
		}
		if (pick?.kind === "extra") return act({ type: "extra", card: pick.card, materials: pick.chosen });
		if (pick?.kind === "pendulum") return act({ type: "pendulum", cards: pick.chosen.flatMap((at) => board.you.hand[at] ?? []) });
	};
	const onZone = (side: Side, row: Row, zone: number) => {
		/* A Set card that targets: the Monster tapped on the side it aims at. */
		if ((status === "answer" || free) && pick?.kind === "trap" && row === "monsters") return side === pick.aim ? act({ type: "spring", zone: pick.zone, target: zone }) : undefined;
		if (status === "answer") {
			if (pick?.kind === "hand" && handAims(pick.card) && side === "rival" && row === "monsters") return act({ type: "hand", card: pick.card, target: zone });
			if (pick?.kind === "ability" && side === "rival" && row === "monsters") return useAbility(pick.zone, zone);
			if (side !== "you") return;
			if (row === "monsters") {
				const slot = board.you.monsters[zone];
				if (slot && (monsterOf(slot.card).ability || monsterOf(slot.card).detach || monsterOf(slot.card).act)) setPick(pick?.kind === "ability" && pick.zone === zone ? null : { kind: "ability", zone });
				return;
			}
			if (row !== "backrow") return;
			const slot = board.you.backrow[zone];
			const info = slot ? cardOf(slot.card) : null;
			/* A Trap that targets one of your Monsters, or a Quick-Play Spell, waits for its target to be tapped. */
			const answers = info?.kind === "trap" && ((info.effect.type === "return-to-hand" && board.pending?.kind === "spell") || (info.effect.type === "reinforce" && board.pending?.kind === "attack"));
			if (answers) return setPick({ kind: "trap", zone, aim: "you" });
			/* Infinite Impermanence targets the rival's Monster; Magic Jammer is paid with a card of the hand. */
			if (slot && isImpermanence(slot.card)) return setPick({ kind: "trap", zone, aim: "rival" });
			if (info && info.kind === "trap" && info.cost?.type === "discard") return setPick({ kind: "act-cost", zone, trap: true });
			if (slot && isQuickPlay(slot.card) && needsTarget(slot.card)) return setPick({ kind: "trap", zone, aim: aimsAt(slot.card) });
			return act({ type: "spring", zone });
		}
		if (!free) return;
		if (pick?.kind === "grave" || pick?.kind === "pendulum" || pick?.kind === "search") return;
		if (pick?.kind === "materials" || pick?.kind === "extra") {
			/* Choosing monsters on the field: a tap adds one, a second tap takes it back. */
			if (side !== "you" || row !== "monsters" || !board.you.monsters[zone]) return;
			if (pick.kind === "extra") return setPick({ ...pick, chosen: toggleZone(pick.chosen, zone) });
			const already = pick.chosen.some((item) => item.from === "field" && item.zone === zone);
			return setPick({ ...pick, chosen: already ? pick.chosen.filter((item) => !(item.from === "field" && item.zone === zone)) : [...pick.chosen, { from: "field", zone }] });
		}
		if (row === "field") return side === "you" && pick?.kind === "hand" ? act({ type: "place", card: pick.card, row, zone: 0 }) : undefined;
		if (side === "rival") {
			if (row !== "monsters") return;
			if (pick?.kind === "ability") return useAbility(pick.zone, zone);
			if (pick?.kind === "monster") return act({ type: "attack", attacker: pick.zone, target: zone });
			if (pick?.kind === "aim") return placeSpell(pick.card, pick.zone, aimsAt(pick.card) === "rival" ? zone : undefined);
			if (pick?.kind === "hand" && needsTarget(pick.card)) return placeSpell(pick.card, firstFree(board), aimsAt(pick.card) === "rival" ? zone : undefined);
			return;
		}
		if (row === "backrow") {
			if (pick?.kind === "hand") {
				/* A Pendulum Monster tapped onto the Spell & Trap row is placed as a Scale. */
				if (cardOf(pick.card).kind === "monster" && monsterOf(pick.card).scale !== undefined) return act({ type: "place", card: pick.card, row, zone });
				if (pick.set) return act({ type: "place", card: pick.card, row, zone, set: true });
				if (needsTarget(pick.card) && !board.you.backrow[zone]) return setPick({ kind: "aim", card: pick.card, zone });
				if (cardOf(pick.card).kind === "spell" && !board.you.backrow[zone]) return placeSpell(pick.card, zone);
				return act({ type: "place", card: pick.card, row, zone });
			}
			if (pick?.kind === "tributes") return act({ type: "place", card: pick.card, row, zone });
			const held = board.you.backrow[zone];
			if (held && !held.up && !held.open) {
				/* A Set card flipped on the child's own turn: a Quick-Play Spell waits for its target, Call of the Haunted for a monster in the Graveyard. */
				const info = cardOf(held.card);
				if (info.kind === "trap" && info.effect.type === "haunt" && !held.setThisTurn) {
					setPick({ kind: "haunt", zone });
					return setOpen({ side: "you", pile: "graveyard" });
				}
				if (isQuickPlay(held.card) && needsTarget(held.card) && !held.setThisTurn) return setPick({ kind: "trap", zone, aim: aimsAt(held.card) });
			}
			if (held) return act({ type: "spring", zone });
			return;
		}
		/* A Spell that helps one of your Monsters may be dropped straight onto it. */
		if (pick?.kind === "hand" && needsTarget(pick.card) && aimsAt(pick.card) === "you" && board.you.monsters[zone]) return placeSpell(pick.card, firstFree(board), zone);
		if (pick?.kind === "hand") return act({ type: "place", card: pick.card, row, zone, ...(pick.set ? { set: true as const } : {}) });
		if (pick?.kind === "aim") return placeSpell(pick.card, pick.zone, aimsAt(pick.card) === "you" ? zone : undefined);
		if (pick?.kind === "tributes") {
			const info = cardOf(pick.card);
			const need = info.kind === "monster" ? tributesFor(info.level) : 0;
			const face = pick.set ? { set: true as const } : {};
			if (!board.you.monsters[zone] || pick.chosen.includes(zone)) return act({ type: "place", card: pick.card, row, zone, tributes: pick.chosen, ...face });
			const chosen = [...pick.chosen, zone];
			/* The last Tribute makes room: the big Monster lands where the first one stood. */
			return chosen.length >= need ? act({ type: "place", card: pick.card, row, zone: chosen[0] ?? zone, tributes: chosen, ...face }) : setPick({ ...pick, chosen });
		}
		if (!board.you.monsters[zone]) return;
		setPick(pick?.kind === "monster" && pick.zone === zone ? null : { kind: "monster", zone });
	};

	/* Main Monster Zones and Spell & Trap Zones; `every` adds the Extra Monster Zone of the whole mat. */
	const all = Array.from({ length: mainZones(board) }, (_, zone) => zone);
	const every = board.you.monsters.map((_, zone) => zone);
	const glow = new Set<string>();
	const chosen = new Set<string>();
	if (status === "answer" && pick?.kind === "hand") {
		/* A card of the hand is being read before its Quick Effect is used: nothing on the board to tap. */
	} else if (pick?.kind === "hand") {
		const info = cardOf(pick.card);
		if (info.kind === "spell" && info.icon === "field") glow.add(zoneKey("you", "field", 0));
		else {
			const row = info.kind === "monster" ? "monsters" : "backrow";
			for (const zone of all) if (!board.you[row][zone]) glow.add(zoneKey("you", row, zone));
			/* A Pendulum Monster may also go to a Pendulum Zone: the leftmost or rightmost Spell & Trap Zone. */
			if (info.kind === "monster" && info.scale !== undefined && board.full) for (const zone of [0, all.length - 1]) if (!board.you.backrow[zone]) glow.add(zoneKey("you", "backrow", zone));
		}
	} else if (pick?.kind === "haunt" || pick?.kind === "revive") {
		chosen.add(zoneKey("you", "backrow", pick.zone));
		glow.add(pileKey("you", "graveyard"));
	} else if (pick?.kind === "grave") {
		chosen.add(zoneKey("you", "backrow", pick.zone));
		glow.add(pileKey("you", "graveyard"));
		glow.add(pileKey("rival", "graveyard"));
	} else if (pick?.kind === "materials" || pick?.kind === "extra") {
		const taken = pick.kind === "extra" ? pick.chosen : pick.chosen.flatMap((item) => (item.from === "field" ? [item.zone] : []));
		for (const zone of every) if (board.you.monsters[zone]) (taken.includes(zone) ? chosen : glow).add(zoneKey("you", "monsters", zone));
	} else if (pick?.kind === "pendulum") {
		for (const zone of [0, all.length - 1]) chosen.add(zoneKey("you", "backrow", zone));
	} else if (pick?.kind === "aim") {
		chosen.add(zoneKey("you", "backrow", pick.zone));
		for (const zone of every) if (board[aimsAt(pick.card)].monsters[zone]) glow.add(zoneKey(aimsAt(pick.card), "monsters", zone));
	} else if (pick?.kind === "tributes") {
		for (const zone of pick.chosen) chosen.add(zoneKey("you", "monsters", zone));
		for (const zone of every) if (board.you.monsters[zone] && !pick.chosen.includes(zone)) glow.add(zoneKey("you", "monsters", zone));
	} else if (pick?.kind === "monster") {
		chosen.add(zoneKey("you", "monsters", pick.zone));
		for (const zone of every) if (board.rival.monsters[zone]) glow.add(zoneKey("rival", "monsters", zone));
	} else if (pick?.kind === "trap") {
		chosen.add(zoneKey("you", "backrow", pick.zone));
		for (const zone of every) if (board[pick.aim].monsters[zone]) glow.add(zoneKey(pick.aim, "monsters", zone));
	} else if (pick?.kind === "ability") {
		chosen.add(zoneKey("you", "monsters", pick.zone));
		for (const zone of every) if (board.rival.monsters[zone]) glow.add(zoneKey("rival", "monsters", zone));
	} else if (pick?.kind === "act-cost") {
		chosen.add(zoneKey("you", pick.trap ? "backrow" : "monsters", pick.zone));
		if (pick.target !== undefined) chosen.add(zoneKey("rival", "monsters", pick.target));
	} else if (pick?.kind === "cost") {
		chosen.add(zoneKey("you", "backrow", pick.zone));
	} else if (status === "answer") {
		for (const zone of all) if (board.you.backrow[zone]) glow.add(zoneKey("you", "backrow", zone));
		for (const zone of every) {
			const slot = board.you.monsters[zone];
			const ability = slot ? monsterOf(slot.card).ability : undefined;
			if (slot && ability?.quick && !(ability.oncePerTurn && board.used.includes(`you:${slot.card}`))) glow.add(zoneKey("you", "monsters", zone));
			if (slot && monsterOf(slot.card).detach && (slot.materials?.length ?? 0) > 0 && board.pending?.kind === "attack") glow.add(zoneKey("you", "monsters", zone));
		}
		for (const zone of all) if (board.you.backrow[zone]?.up || board.you.backrow[zone]?.open) glow.delete(zoneKey("you", "backrow", zone));
	}
	if (hinted?.type === "extra") glow.add(pileKey("you", "extra"));
	if (hinted?.type === "place" && hinted.grave) glow.add(pileKey(hinted.grave.side, "graveyard"));
	if (hinted?.type === "place" && hinted.row === "field") glow.add(zoneKey("you", "field", 0));
	if (hinted?.type === "attack" || hinted?.type === "position") glow.add(zoneKey("you", "monsters", hinted.type === "attack" ? hinted.attacker : hinted.zone));
	if (hinted?.type === "spring") glow.add(zoneKey("you", "backrow", hinted.zone));
	if (hinted?.type === "ability") glow.add(zoneKey("you", "monsters", hinted.zone));

	const picked = pick && "card" in pick ? pick.card : null;
	/** Cards of the hand chosen as Tributes, materials or for a Pendulum Summon, by their place in the hand. */
	const handChosen = pick?.kind === "pendulum" ? pick.chosen : pick?.kind === "materials" ? pick.chosen.flatMap((item) => (item.from === "hand" ? [item.index] : [])) : [];
	const pickedSpecial = free && pick && (pick.kind === "hand" || pick.kind === "tributes") && cardOf(pick.card).kind === "monster" && monsterOf(pick.card).special ? pick.card : null;
	const scales = scalesOf(board, "you");
	const pickedAbility = pick?.kind === "ability" ? board.you.monsters[pick.zone] : null;
	const detaching = !!pickedAbility && !!monsterOf(pickedAbility.card).detach;
	/* An effect with no target to tap: Dark Paladin negating a Spell, Blue-Eyes Spirit Dragon Tributing itself. */
	const pickedAct = pickedAbility ? monsterOf(pickedAbility.card).act : undefined;
	const untargeted = !!pickedAct && pickedAct.kind !== "destroy" && pickedAct.kind !== "destroy-free";
	/* Setting a monster face-down is taught on the island of steps: offered from there on. */
	const settable = WORLD_IDS.indexOf(level.world) >= WORLD_IDS.indexOf("steps");
	/** The words for the choice being made: what to tap, and the sum so far. */
	const choosing = (): string => {
		if (pick?.kind === "grave" || pick?.kind === "haunt" || pick?.kind === "revive") return copy.chooseGrave;
		if (pick?.kind === "act-cost") return copy.chooseDiscard;
		if (pick?.kind === "search") return copy.chooseFromDeck;
		if (pick?.kind === "pendulum") return scales ? copy.choosePendulum(scales.low, scales.high) : "";
		if (pick?.kind === "materials") {
			if (pick.mode === "fusion") return copy.chooseFusion;
			const spell = cardOf(pick.card);
			const sum = pick.chosen.reduce((total, item) => total + levelOf(item.from === "hand" ? item.card : (board.you.monsters[item.zone]?.card ?? pick.card)), 0);
			return copy.chooseRitual(sum, spell.kind === "spell" && spell.effect.type === "ritual" ? spell.effect.total : 0);
		}
		if (pick?.kind === "extra") {
			const info = monsterOf(pick.card);
			if (info.xyz) return copy.chooseXyz(info.xyz.count, info.xyz.level);
			if (info.link) return copy.chooseLink(info.link);
			return copy.chooseSynchro(pick.chosen.reduce((total, zone) => total + levelOf(board.you.monsters[zone]?.card ?? pick.card), 0), info.level);
		}
		return "";
	};
	const pickedMonster = pick?.kind === "monster" ? board.you.monsters[pick.zone] : null;
	const tributesLeft = pick?.kind === "tributes" ? tributesFor(monsterOf(pick.card).level) - pick.chosen.length : 0;
	const prompt =
		status === "rival"
			? copy.rivalTurn
			: status === "answer"
				? (pick?.kind === "hand" && !handAims(pick.card)) || detaching
					? ""
					: pick?.kind === "trap" || pick?.kind === "ability" || pick?.kind === "hand"
						? copy.chooseTarget
						: pick?.kind === "act-cost"
							? copy.chooseDiscard
							: copy.answerNow
				: status !== "playing"
					? ""
					: pick?.kind === "grave" || pick?.kind === "materials" || pick?.kind === "extra" || pick?.kind === "pendulum" || pick?.kind === "search"
						? choosing()
						: pick?.kind === "hand"
						? `${copy.selected(copy.cards[pick.card].name)} ${copy.chooseZone}`
						: pick?.kind === "aim" || pick?.kind === "ability"
							? copy.chooseTarget
							: pick?.kind === "cost" || pick?.kind === "act-cost"
								? copy.chooseDiscard
								: pick?.kind === "tributes"
								? `${copy.selected(copy.cards[pick.card].name)} ${copy.chooseTributes(Math.max(1, tributesLeft))}`
								: pick?.kind === "monster" && pickedMonster
									? `${copy.selected(copy.cards[pickedMonster.card].name)} ${copy.chooseAttackTarget}`
									: copy.yourTurn;
	const result = status === "solved" ? outcome(session) : null;
	const over = status === "solved" || status === "failed";
	/* The card being read: the one in hand being played, or a Monster whose effect is being looked at. */
	const abilityZone = pick?.kind === "ability" ? pick.zone : pick?.kind === "monster" ? pick.zone : null;
	const abilityCard = abilityZone === null ? null : (board.you.monsters[abilityZone]?.card ?? null);
	const reading = picked ?? (abilityCard && hasRulesText(abilityCard) ? abilityCard : null);
	const opened = !open
		? null
		: open.pile === "graveyard"
			? { title: copy.graveyard(open.side, board[open.side].graveyard.length), cards: board[open.side].graveyard.map((card) => ({ card })) }
			: open.pile === "banished"
				? { title: copy.banished(open.side, board[open.side].banished.length), cards: board[open.side].banished }
				: { title: copy.extraDeck("you", board.you.extra.length + board.you.extraUp.length), cards: [...board.you.extra.map((card) => ({ card })), ...board.you.extraUp.map((card) => ({ card, faceUp: true }))] };
	/* A Graveyard card can be tapped while a Spell is looking for its target there; an Extra Deck monster while nothing else is held. */
	const graveCard = (index: number) => (open ? board[open.side].graveyard[index] : undefined);
	const pileTap = !open || !free ? undefined : open.pile === "graveyard" ? (pick?.kind === "grave" ? (index: number) => cardOf(graveCard(index) ?? pick.card).kind === "monster" : undefined) : open.pile === "extra" ? (index: number) => index < board.you.extra.length : undefined;
	const printed = reading ? printedText(copy, reading) : undefined;
	/* A card of the hand: picked (or chosen as a material), or the one to play now. The HTML button and the 3D card show the same. */
	const handPicked = (card: CardId, index: number) => (picked === card && pick?.kind !== "extra") || handChosen.includes(index);
	const handGold = (card: CardId) => (status === "answer" && handEffect(card)) || (hinted?.type === "place" && (hinted.card === card || hinted.discard === card)) || (pick?.kind === "cost" && pick.card !== card);
	const handEnabled = (card: CardId) => free || pick?.kind === "act-cost" || (status === "answer" && handEffect(card));
	const handItems: HandItem[] | undefined = solid ? board.you.hand.map((card, index) => ({ card, state: handPicked(card, index) ? "picked" : handGold(card) ? "hint" : "plain", enabled: handEnabled(card), onTap: () => onHand(card, index) })) : undefined;
	const focusHand = (event: FocusEvent<HTMLButtonElement>, index: number) => {
		let shows = true;
		try {
			shows = event.target.matches(":focus-visible");
		} catch {
			/* An old browser: show the ring. */
		}
		if (shows) setHandFocus(index);
	};
	const words = BOARD3D_COPY[locale];

	const body = (
		<>
			<p className="text-sm font-semibold text-gold-400">
				{copy.worlds[level.world].title} · {copy.levelOf(number, total)}
			</p>
			<h2 ref={headingRef} id="level-title" data-step-heading tabIndex={-1} className={`flex items-center gap-2 ${solid ? "font-display text-xl text-fg outline-none" : "font-display text-2xl text-fg md:text-3xl"}`}>
				{level.duel && <img src={masterPicture(level.duel.master)} alt="" height={256} className={`${solid ? "h-10" : "h-14"} w-auto object-contain`} />}
				{text?.title}
			</h2>
			<p className={`flex items-start gap-3 rounded-2xl border border-white/15 bg-surface-raised text-fg ${solid ? "p-2 text-base" : "p-3 text-lg"}`}>
				<span aria-hidden className={`leading-none ${solid ? "text-2xl" : "text-3xl"}`}>
					🐻
				</span>
				<span>{text?.goal}</span>
			</p>
			{demo && demoRule ? (
				<DemoTheatre rule={demoRule} copy={copy} locale={locale} moving={moving} sound={sound} onDone={closeDemo} />
			) : (
				<>
					<BoardStage board={board} events={session.events} copy={copy} moving={moving} glow={glow} chosen={chosen} onZone={onZone} onPile={onPile} {...(handItems ? { hand: handItems, handFocus } : {})} />
					{opened && <PileViewer title={opened.title} copy={copy} cards={opened.cards} {...(pileTap ? { pickable: pileTap, onPick: onPileCard } : {})} onClose={() => setOpen(null)} />}
					<ClashBanner events={session.events} copy={copy} moving={moving} />
					{dev && DevLevelBarSlot && <DevLevelBarSlot canSolve={!level.duel} onSolve={() => update({ ...playOut(start(level), level.solution), stats: session.stats })} onBotTurn={() => update(botTurn(session))} onWin={() => update(forceWin(session))} />}
					<ChainTower events={session.events} board={board} copy={copy} />
					<div className="mx-auto max-w-md space-y-2 rounded-xl border border-white/20 bg-ink-800 p-3">
						<div role="status" aria-live="polite" className="min-h-14 space-y-1">
							{line && (
								<p className={`flex gap-2 text-lg ${session.rejected ? "text-ember-400" : "text-fg"}`}>
									{session.rejected && <Hand className="mt-1 h-5 w-5 shrink-0" aria-hidden />}
									<span>{line}</span>
								</p>
							)}
							{hinted && <p className="text-lg text-gold-400">{copy.describeMove(hinted, board)}</p>}
							{noHint && <p className="text-lg text-gold-400">{copy.noHint}</p>}
							{status === "solved" && result && (
								<p className="flex gap-2 text-lg font-semibold text-spell">
									<CircleCheck className="mt-1 h-5 w-5 shrink-0" aria-hidden />
									{copy.solved} {result.firstTry ? copy.solvedFirstTry : result.clean ? "" : copy.solvedWithHint}
								</p>
							)}
							{status === "failed" && session.fail && (
								<p className="flex gap-2 text-lg font-semibold text-ember-400">
									<Lightbulb className="mt-1 h-5 w-5 shrink-0" aria-hidden />
									{copy.notYet} {copy.fails[session.fail]}
								</p>
							)}
							{prompt && <p className="text-fg-muted">{prompt}</p>}
						</div>
						{reading && printed && (
							<div data-card-text className="space-y-1 rounded-lg border border-white/15 bg-surface p-2 text-sm">
								<p className="font-semibold text-gold-400">
									{copy.onTheCard}{" "}
									<bdi lang={copy.englishCards ? "en" : undefined}>{copy.cards[reading].name}</bdi>
								</p>
								<p dir={copy.englishCards ? "ltr" : undefined} lang={copy.englishCards ? "en" : undefined} className="whitespace-pre-line text-start text-fg">
									{printed}
								</p>
								{copy.englishCards && copy.cards[reading].text && copy.cards[reading].text !== PLAY_COPY.en.cards[reading].text && (
									<>
										<p className="font-semibold text-gold-400">{copy.meaning}</p>
										<p className="whitespace-pre-line text-fg">{copy.cards[reading].text}</p>
									</>
								)}
							</div>
						)}
						<div className="flex flex-wrap gap-3 empty:hidden">
							{status === "rival" && (
								<button type="button" onClick={() => update(next(session))} className={primary}>
									{copy.rivalNext}
									<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
								</button>
							)}
							{free &&
								pick?.kind === "search" &&
								searchable(board, pick).map((card) => (
									<button
										key={card}
										type="button"
										data-search={card}
										onClick={() => act(pick.card ? { type: "place", card: pick.card, row: "backrow", zone: pick.zone, pick: card } : { type: "ability", zone: pick.zone, pick: card })}
										className={quiet}
									>
										<bdi lang={copy.englishCards ? "en" : undefined}>{copy.cards[card].name}</bdi>
									</button>
								))}
							{free &&
								!pick &&
								effectChoices.map((move) => (
									<button key={JSON.stringify(move)} type="button" data-effect={move.type === "effect" ? move.card : undefined} onClick={() => act(move)} className={quiet}>
										{copy.describeMove(move, board)}
									</button>
								))}
							{status === "answer" && pick?.kind === "hand" && !handAims(pick.card) && (
								<button type="button" onClick={() => act({ type: "hand", card: pick.card })} className={primary}>
									{copy.useFromHand}
								</button>
							)}
							{(status === "answer" || free) && pick?.kind === "ability" && untargeted && (
								<button type="button" onClick={() => useAbility(pick.zone)} className={primary}>
									{copy.useEffect}
								</button>
							)}
							{status === "answer" && pick?.kind === "ability" && detaching && (
								<button type="button" onClick={() => act({ type: "ability", zone: pick.zone })} className={primary}>
									{copy.detach}
								</button>
							)}
							{status === "answer" && (
								<button type="button" onClick={() => act({ type: "pass" })} className={quiet}>
									{copy.pass}
								</button>
							)}
							{free && (pick?.kind === "materials" || pick?.kind === "extra" || pick?.kind === "pendulum") && (
								<button type="button" onClick={confirm} className={primary}>
									{copy.confirmSummon}
								</button>
							)}
							{free && !pick && board.summonTrigger?.side === "you" && (
								<button
									type="button"
									onClick={() => {
										const zone = board.summonTrigger?.zone ?? 0;
										const summoned = board.summonTrigger?.card ?? board.you.monsters[zone]?.card;
										/* Magician's Rod takes a card in the Deck; Junk Synchron a monster in the Graveyard. */
										if (summoned && monsterOf(summoned).summonSearch) return setPick({ kind: "search", zone });
										setPick({ kind: "revive", zone });
										setOpen({ side: "you", pile: "graveyard" });
									}}
									className={primary}
								>
									{copy.useEffect}
								</button>
							)}
							{free && (pick?.kind === "hand" || pick?.kind === "tributes") && !pick.set && ((isQuickPlay(pick.card) && !isReviver(pick.card)) || (settable && cardOf(pick.card).kind === "monster" && !monsterOf(pick.card).frame && !monsterOf(pick.card).noNormal)) && (
								<button type="button" onClick={() => setPick({ ...pick, set: true })} className={quiet}>
									{cardOf(pick.card).kind === "monster" ? copy.setMonster : copy.setFaceDown}
								</button>
							)}
							{pickedSpecial && (
								<button type="button" onClick={() => act({ type: "place", card: pickedSpecial, row: "monsters", zone: firstMonsterZone(board), special: true })} className={quiet}>
									{copy.specialSummon}
								</button>
							)}
							{free && !pick && scales && !board.pendulumUsed && (
								<button type="button" onClick={() => setPick({ kind: "pendulum", chosen: [] })} className={`${quiet} ${hinted?.type === "pendulum" ? "border-gold-400" : ""}`}>
									{copy.pendulumSummon}
								</button>
							)}
							{free && pick?.kind === "monster" && pickedMonster && (
								<>
									<button type="button" onClick={() => act({ type: "attack", attacker: pick.zone, target: "direct" })} className={quiet}>
										{copy.attackDirectly}
									</button>
									<button type="button" onClick={() => act({ type: "position", zone: pick.zone })} className={quiet}>
										{copy.turnCard(copy.cards[pickedMonster.card].name)}
									</button>
									{(monsterOf(pickedMonster.card).ability || monsterOf(pickedMonster.card).act) && (
										<button type="button" onClick={() => setPick({ kind: "ability", zone: pick.zone })} className={quiet}>
											{copy.useEffect}
										</button>
									)}
								</>
							)}
							{(free || status === "answer") && pick && pick.kind !== "monster" && (
								<button type="button" onClick={() => setPick(null)} className={quiet}>
									{copy.cancel}
								</button>
							)}
							{free && level.bar === "none" && level.goal.type !== "place-all" && (
								<button type="button" onClick={() => act({ type: "phase", to: "end" })} className={quiet}>
									{copy.endTurn}
								</button>
							)}
							{status === "solved" && hasNext && (
								<button ref={resultRef} type="button" onClick={onNext} className={primary}>
									{copy.nextLevel}
									<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
								</button>
							)}
							{status === "solved" && !hasNext && (
								<button ref={resultRef} type="button" onClick={onExit} className={primary}>
									{copy.backToMap}
								</button>
							)}
							{status === "failed" && (
								<button ref={resultRef} type="button" onClick={() => comeBack(undo(session))} className={primary}>
									<Undo2 className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
									{copy.undo}
								</button>
							)}
						</div>
					</div>
					{level.bar !== "none" && (
						<PhaseBar
							bar={level.bar}
							board={board}
							copy={copy}
							enabled={free}
							hinted={hinted?.type === "draw" ? "draw-card" : hinted?.type === "phase" ? hinted.to : null}
							onDraw={() => act({ type: "draw" })}
							onPhase={(to: Phase) => act({ type: "phase", to })}
						/>
					)}
					{board.you.hand.length > 0 && (
						<ul aria-label={copy.hand} className={solid ? "sr-only" : "mx-auto flex max-w-md flex-wrap justify-center gap-2"}>
							{board.you.hand.map((card, index) => (
								<li key={`${card}-${index}`} className="w-28">
									<button
										type="button"
										aria-pressed={handPicked(card, index)}
										disabled={!handEnabled(card)}
										onClick={() => onHand(card, index)}
										{...(solid ? { onFocus: (event: FocusEvent<HTMLButtonElement>) => focusHand(event, index), onBlur: () => setHandFocus(null) } : {})}
										className={`block min-h-32 w-full rounded-xl border-2 p-0.5 ${handPicked(card, index) ? "border-arcane-400" : handGold(card) ? "border-gold-400" : "border-transparent"} disabled:opacity-70`}
									>
										<CardFace card={card} copy={copy} full />
									</button>
								</li>
							))}
						</ul>
					)}
					{status === "solved" && level.open && (
						<div className="mx-auto max-w-md space-y-2 rounded-2xl border-4 border-double border-gold-400 p-5 text-center">
							<p aria-hidden className="text-4xl">
								🏅
							</p>
							<h3 className="font-display text-2xl text-gold-400">{copy.certificateTitle}</h3>
							<p className="text-fg">{level.final ? copy.certificateFinalText : copy.certificateText}</p>
							<button type="button" onClick={() => window.print()} className={`${quiet} print:hidden`}>
								<Printer className="h-5 w-5" aria-hidden />
								{copy.print}
							</button>
						</div>
					)}
					<div className="mx-auto flex max-w-md flex-wrap gap-3 print:hidden">
						{!over && session.past.length > 0 && status !== "rival" && (
							<button type="button" onClick={() => update(undo(session))} className={quiet}>
								<Undo2 className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
								{copy.undo}
							</button>
						)}
						{(session.past.length > 0 || over) && (
							<button type="button" onClick={() => comeBack(restart(session))} className={quiet}>
								<RotateCcw className="h-5 w-5" aria-hidden />
								{status === "solved" ? copy.replay : copy.restart}
							</button>
						)}
						{(status === "playing" || status === "answer") && (
							<button type="button" onClick={() => showHint(session)} className={quiet}>
								<Lightbulb className="h-5 w-5" aria-hidden />
								{copy.hint}
							</button>
						)}
						{demoRule && !over && (
							<button type="button" onClick={() => setDemo(true)} className={`${quiet} ${session.stats.tries > 2 ? "border-gold-400" : ""}`}>
								<MonitorPlay className="h-5 w-5" aria-hidden />
								{copy.showMe}
							</button>
						)}
					</div>
				</>
			)}
			<button type="button" onClick={onExit} className={`${quiet} print:hidden`}>
				<ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
				{copy.backToMap}
			</button>
			{/* Only where 3D can be drawn: the choice between the 3D mat and the flat HTML board. */}
			{view.ready && (
				<button type="button" onClick={() => view.setFlat(!view.flat)} className={`${quiet} ms-3 print:hidden`}>
					{view.flat ? <Box className="h-5 w-5" aria-hidden /> : <Square className="h-5 w-5" aria-hidden />}
					{view.flat ? words.solid : words.flat}
				</button>
			)}
		</>
	);
	if (!solid) {
		return (
			<section aria-labelledby="level-title" className="space-y-4">
				{body}
			</section>
		);
	}
	return (
		<Board3dContext.Provider value={three}>
			{/*
			 * The whole screen, over the page: the mat takes all the room the panel leaves. On a wide screen (a phone on
			 * its side, a desktop, an iPad on its side) the panel is beside the mat; on an upright iPad it is under it.
			 */}
			<section aria-labelledby="level-title" data-board-view="3d" className="fixed inset-0 z-50 flex flex-col bg-[linear-gradient(180deg,#7cc8f2_0%,#bfe8ff_55%,#e9f7ff_100%)] landscape:flex-row print:static print:block">
				<div ref={setSlot} className="relative min-h-0 min-w-0 flex-1 print:hidden" />
				<div className="space-y-3 overflow-y-auto overscroll-contain bg-ink-950 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] portrait:max-h-[44svh] landscape:w-[min(23rem,40vw)] landscape:pe-[max(0.75rem,env(safe-area-inset-right))]">{body}</div>
			</section>
		</Board3dContext.Provider>
	);
}
