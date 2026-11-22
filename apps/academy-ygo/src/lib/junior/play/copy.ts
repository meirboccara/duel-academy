import type { Locale } from "@/lib/i18n/locales";
import { cardOf, type CardId, type CardKind, type Frame, type Icon, type MonsterType } from "@duel-academy/engine";
import type { Board, GameEvent, Move, Phase, Reason, Side } from "@duel-academy/engine";
import type { RuleId, WorldId } from "./levels";
import type { Mastery } from "./progress";
import type { FailReason } from "./session";
import { en, englishCopy } from "./copy-en";
import { fr, frenchCopy } from "./copy-fr";
import { he, hebrewCopy } from "./copy-he";

/** Every word a child reads or hears in Junior play. One line at a time, short enough to be said aloud. */
export interface PlayCopy {
	pageTitle: string;
	intro: string;
	rivalName: string;
	/**
	 * True when cards are printed in another language than this copy: real cards do not exist in Hebrew,
	 * so a Hebrew player sees each card's name and text in English, with a translation beside it.
	 */
	englishCards: boolean;
	worlds: Record<WorldId, { title: string; blurb: string }>;
	/** Keyed by level id. `goal` is the one line the mentor says. */
	levels: Record<string, { title: string; goal: string }>;
	/** `text` is the card text: real-card wording for Spells, Traps and Monsters with an effect. */
	cards: Record<CardId, { name: string; text?: string }>;
	kinds: Record<CardKind, string>;
	/** Monster Types a card asks about, as printed on the Type line. */
	types: Record<MonsterType, string>;
	/** The special kinds of monster, as printed on the Type line. */
	frames: Record<Frame, string>;
	/** The type of a Spell, by its icon: "normal" when it has none. */
	spellTypes: Record<"normal" | Exclude<Icon, "counter">, string>;
	/** The type of a Trap, by its icon: "normal" when it has none. */
	trapTypes: Record<"normal" | "continuous" | "counter", string>;
	tuner: string;
	rank: string;
	linkRating: string;
	scale: string;
	/** The cards under an Xyz Monster. */
	materials: (count: number) => string;
	rules: Record<RuleId, string>;
	mastery: Record<Mastery, string>;
	phases: Record<Phase, string>;
	/** What each phase is for, in one sentence: said the first time the phase starts in a try (Rulebook v10 pp. 34-40). */
	phaseHelp: Record<Phase, string>;
	/** The steps of an attack, named as Konami names them (in English in every language). */
	steps: Record<"battle" | "damage", string>;
	/** What happens in each step, in a few words: said the first time it comes in a try, from the steps island on. */
	stepHelp: Record<"battle" | "damage", string>;
	level: string;
	atk: string;
	def: string;
	lifePoints: (side: Side, lp: number) => string;
	/** How many cards a player holds: shown for the rival, whose hand is face-down. */
	handCount: (side: Side, count: number) => string;
	/** The banner of a new turn: "Your turn!", "Kaiba's turn". */
	turnBanner: (side: Side) => string;
	/** The banner when the child may answer what the rival does. */
	yourChance: string;
	monsterZone: (side: Side, number: number) => string;
	backZone: (side: Side, number: number) => string;
	/** The whole mat: a Main Monster Zone, the Extra Monster Zone, the Field Zone, a Pendulum Zone (1 left, 2 right). */
	mainZone: (side: Side, number: number) => string;
	extraMonsterZone: (side: Side) => string;
	fieldZone: (side: Side) => string;
	pendulumZone: (side: Side, number: number) => string;
	extraDeck: (side: Side, count: number) => string;
	banished: (side: Side, count: number) => string;
	faceDownCards: (count: number) => string;
	faceUp: string;
	pileEmpty: string;
	closePile: string;
	empty: string;
	faceDown: string;
	inDefense: string;
	hasEffect: string;
	quickMark: string;
	hand: string;
	deck: (count: number) => string;
	graveyard: (side: Side, count: number) => string;
	board: string;
	phaseBar: string;
	play: string;
	replay: string;
	continueWith: (title: string) => string;
	locked: string;
	solvedMark: string;
	starMark: string;
	allDone: string;
	levelOf: (number: number, total: number) => string;
	draw: string;
	endTurn: string;
	rivalNext: string;
	pass: string;
	attackDirectly: string;
	turnCard: (card: string) => string;
	useEffect: string;
	cancel: string;
	undo: string;
	restart: string;
	hint: string;
	noHint: string;
	showMe: string;
	watchFirst: string;
	demoStep: (number: number, total: number) => string;
	demoNext: string;
	demoAgain: string;
	demoDone: string;
	backToMap: string;
	backHome: string;
	nextLevel: string;
	quizLink: string;
	calm: string;
	calmHint: string;
	calmDevice: string;
	sound: string;
	soundHint: string;
	/** Label of the card text shown when a card is picked. */
	onTheCard: string;
	/** Label of the translation shown under English card text. */
	meaning: string;
	yourTurn: string;
	rivalTurn: string;
	answerNow: string;
	selected: (card: string) => string;
	chooseZone: string;
	chooseTarget: string;
	chooseTributes: (left: number) => string;
	chooseAttackTarget: string;
	chooseDiscard: string;
	chooseGrave: string;
	/** A card to take in the Deck (Reinforcement of the Army, Magician's Rod). */
	chooseFromDeck: string;
	/** A Ritual Summon: the Levels chosen so far, and the number on the Ritual Spell. */
	chooseRitual: (sum: number, need: number) => string;
	chooseFusion: string;
	chooseExtra: string;
	/** A Synchro Summon: the Levels chosen so far, and the Level to reach. */
	chooseSynchro: (sum: number, level: number) => string;
	chooseXyz: (count: number, level: number) => string;
	chooseLink: (count: number) => string;
	choosePendulum: (low: number, high: number) => string;
	confirmSummon: string;
	specialSummon: string;
	/** Set a Quick-Play Spell face-down instead of activating it. */
	setFaceDown: string;
	/** Set a monster face-down in Defense Position instead of Summoning it. */
	setMonster: string;
	pendulumSummon: string;
	detach: string;
	useFromHand: string;
	solved: string;
	solvedFirstTry: string;
	solvedWithHint: string;
	notYet: string;
	fails: Record<FailReason, string>;
	reasons: Record<Reason, string>;
	rulesTitle: string;
	albumTitle: string;
	albumEmpty: string;
	certificateTitle: string;
	certificateText: string;
	certificateFinalText: string;
	print: string;
	/** One sentence for one thing that happened on the board. */
	narrate: (event: GameEvent) => string;
	/** One sentence for a suggested move. */
	describeMove: (move: Move, board: Board) => string;
}

export const PLAY_COPY: Record<Locale, PlayCopy> = { en, fr, he };
const FOR_RIVAL = { en: englishCopy, fr: frenchCopy, he: hebrewCopy } as const;
const byRival = new Map<string, PlayCopy>();
/** The words for a duel against this rival, by name: Nox's are PLAY_COPY. Hebrew keeps a Latin name left to right. */
export function playCopyFor(locale: Locale, rival: string | null): PlayCopy {
	if (!rival) return PLAY_COPY[locale];
	const key = `${locale}:${rival}`;
	let words = byRival.get(key);
	if (!words) {
		words = FOR_RIVAL[locale](locale === "he" ? `⁦${rival}⁩` : rival);
		byRival.set(key, words);
	}
	return words;
}

/**
 * The language the voice speaks. Hebrew speaks English: the cards a Hebrew-speaking child reads are in English,
 * so the card words are heard as they are printed (and many devices have no Hebrew voice at all).
 */
export const VOICE_LOCALE: Record<Locale, Locale> = { en: "en", fr: "fr", he: "en" };

/** The spoken or announced line for everything a move did. */
export function narrateAll(copy: PlayCopy, events: readonly GameEvent[]): string {
	return events.map((event) => copy.narrate(event)).filter(Boolean).join(" ");
}

/** The child's own phases that start in these events: a phase, or the Draw Phase of a new turn. In order, once each. */
export function phasesStarted(events: readonly GameEvent[]): Phase[] {
	const started: Phase[] = [];
	for (const event of events) {
		if (event.type !== "phase" && event.type !== "turn" && event.type !== "drew") continue;
		if (event.side !== "you") continue;
		const phase = event.type === "phase" ? event.phase : "draw";
		if (!started.includes(phase)) started.push(phase);
	}
	return started;
}

/** The steps of an attack these events show: the Battle Step once an attack is declared, the Damage Step once it goes on to damage. */
export function stepsStarted(events: readonly GameEvent[]): ("battle" | "damage")[] {
	const steps: ("battle" | "damage")[] = [];
	if (events.some((event) => event.type === "attack-declared")) steps.push("battle");
	if (events.some((event) => event.type === "damage-step" || event.type === "battle" || event.type === "direct")) steps.push("damage");
	return steps;
}

/** The type line of a Spell or Trap as printed: "Quick-Play Spell", "Counter Trap"; the kind of card for a Monster. */
export function cardType(copy: PlayCopy, card: CardId): string {
	const info = cardOf(card);
	if (info.kind === "monster") return copy.kinds.monster;
	if (info.kind === "spell") return copy.spellTypes[info.icon && info.icon !== "counter" ? info.icon : "normal"];
	return copy.trapTypes[info.icon === "continuous" || info.icon === "counter" ? info.icon : "normal"];
}
