import type { Locale } from "@/lib/i18n/locales";
import type { CardId, CardKind, Frame, MonsterType } from "./cards";
import type { Board, GameEvent, Move, Phase, Reason, Side } from "./engine";
import type { RuleId, WorldId } from "./levels";
import type { Mastery } from "./progress";
import type { FailReason } from "./session";
import { en } from "./copy-en";
import { fr } from "./copy-fr";
import { he } from "./copy-he";

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
	/** The icon of a Spell that is not a Normal Spell. */
	icons: Record<"field" | "ritual", string>;
	tuner: string;
	rank: string;
	linkRating: string;
	scale: string;
	/** The cards under an Xyz Monster. */
	materials: (count: number) => string;
	rules: Record<RuleId, string>;
	mastery: Record<Mastery, string>;
	phases: Record<Phase, string>;
	level: string;
	atk: string;
	def: string;
	lifePoints: (side: Side, lp: number) => string;
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

/**
 * The language the voice speaks. Hebrew speaks English: the cards a Hebrew-speaking child reads are in English,
 * so the card words are heard as they are printed (and many devices have no Hebrew voice at all).
 */
export const VOICE_LOCALE: Record<Locale, Locale> = { en: "en", fr: "fr", he: "en" };

/** The spoken or announced line for everything a move did. */
export function narrateAll(copy: PlayCopy, events: readonly GameEvent[]): string {
	return events.map((event) => copy.narrate(event)).filter(Boolean).join(" ");
}
