/**
 * Typed lesson content. Lessons are plain data: no JSX, no functions. A slide names a template
 * (`type`) and gives that template's typed configuration (`visual`); the renderer picks the component.
 * Text that students read lives in `title` and `description`; deeper explanations go in `speakerNotes`.
 */

export type CardKind =
	| "normal"
	| "effect"
	| "fusion"
	| "synchro"
	| "xyz"
	| "link"
	| "ritual"
	| "spell"
	| "trap"
	| "token";

export type CardSubtype =
	| "normal"
	| "continuous"
	| "equip"
	| "field"
	| "quick-play"
	| "ritual"
	| "counter";

export type Attribute = "DARK" | "LIGHT" | "EARTH" | "WATER" | "FIRE" | "WIND" | "DIVINE";

export type LinkArrow = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type BattlePosition = "attack" | "defense" | "facedown-defense" | "facedown-spelltrap";

export type CardPart =
	| "frame"
	| "name"
	| "attribute"
	| "level"
	| "art"
	| "type"
	| "effect"
	| "atk"
	| "def"
	| "scale"
	| "arrows"
	| "icon";

/** A schematic educational card. Original names and no artwork: never a real printed card. */
export interface CardSpec {
	name: string;
	kind: CardKind;
	/** Spell/Trap icon type. */
	subtype?: CardSubtype;
	/** Level stars (or Rank stars for Xyz; Link Monsters use `link`). */
	level?: number;
	rank?: number;
	link?: number;
	atk?: number | string;
	def?: number | string;
	attribute?: Attribute;
	/** Monster type line, e.g. "Warrior / Effect". */
	monsterType?: string;
	/** Short card text (kept very short on slides). */
	text?: string;
	/** Pendulum monsters carry two Scales and an upper effect box. */
	pendulum?: { left: number; right: number; text?: string };
	arrows?: LinkArrow[];
	/** Orientation on the board. Defaults to attack (vertical, face-up). */
	position?: BattlePosition;
	/** Small badge above the card, e.g. "Tuner". */
	badge?: string;
	/** Dim a card (used by "tribute materials disappear" scenes). */
	ghost?: boolean;
	/** Number overlay (chain link, material count...). */
	order?: number;
}

export type ZoneId =
	| "mm1"
	| "mm2"
	| "mm3"
	| "mm4"
	| "mm5"
	| "st1"
	| "st2"
	| "st3"
	| "st4"
	| "st5"
	| "field"
	| "deck"
	| "graveyard"
	| "extra"
	| "emz-left"
	| "emz-right"
	| "pz-left"
	| "pz-right"
	| "banished"
	| "hand";

export type ZoneSide = "you" | "opponent";

export interface ZoneRef {
	zone: ZoneId;
	side?: ZoneSide;
}

export interface FieldCard extends ZoneRef {
	card: CardSpec;
}

export interface FieldArrow {
	from: ZoneRef;
	to: ZoneRef;
	label?: string;
}

export type Tone = "gold" | "blue" | "purple" | "green" | "red" | "white";

/* ----------------------------- visual configs ----------------------------- */

export interface IllustrationVisual {
	template: "illustration";
	cards?: CardSpec[];
	/** A big symbol/diagram instead of (or besides) cards. */
	motif?: "duelists" | "decks" | "life-points" | "victory" | "draw-loss" | "cards-three" | "curriculum" | "welcome" | "scales" | "tribute" | "shuffle" | "coin" | "judge" | "match";
	/** Short bullets shown beside the illustration (max ~5 words each). */
	chips?: { label: string; tone?: Tone }[];
	/** Life Points shown with the illustration. */
	lifePoints?: [number, number];
}

export interface CardAnatomyVisual {
	template: "card-anatomy";
	card: CardSpec;
	highlight: CardPart[];
	/** Labels pointing at parts. */
	labels?: { part: CardPart; text: string }[];
	/** Show extra comparison cards beside the main one (e.g. Level vs Rank). */
	compare?: CardSpec[];
}

export interface DuelFieldVisual {
	template: "duel-field";
	/** Zones to light up; every other zone is dimmed. */
	highlight: ZoneRef[];
	cards?: FieldCard[];
	arrows?: FieldArrow[];
	/** Show both halves of the field (default) or only the player's half. */
	half?: "both" | "you";
	showHand?: CardSpec[];
	/** Zone captions drawn on all zones (complete overview). */
	labelAll?: boolean;
	/** Link arrows to light up on a placed Link Monster. */
	linkedZones?: ZoneRef[];
	callout?: string;
}

export interface TimelineVisual {
	template: "timeline";
	variant: "phases" | "chain-build" | "chain-resolve" | "battle" | "steps";
	items: { label: string; sub?: string; tone?: Tone }[];
	active: number;
	/** Mark phases that are skipped or changed. */
	skipped?: number[];
	cards?: CardSpec[];
}

export interface SequenceVisual {
	template: "sequence";
	step: number;
	of: number;
	/** What happens at this step (one action). */
	action: string;
	scene: {
		hand?: CardSpec[];
		monsters?: (CardSpec | null)[];
		spellTraps?: (CardSpec | null)[];
		graveyard?: CardSpec[];
		materials?: CardSpec[];
		result?: CardSpec;
		/** Free labelled slots for diagrams (e.g. Pendulum zones). */
		extra?: { label: string; cards: CardSpec[] }[];
		lifePoints?: [number, number];
	};
	/** An arrow of motion drawn between two scene areas. */
	motion?: "hand-to-field" | "field-to-graveyard" | "materials-to-result" | "to-banished" | "to-extra" | "flip";
}

export interface ComparisonPanel {
	label: string;
	cards: CardSpec[];
	lifePoints?: [number, number];
	note?: string;
	tone?: Tone;
}

export interface ComparisonVisual {
	template: "comparison";
	before: ComparisonPanel;
	after: ComparisonPanel;
	/** Text on the arrow between the two panels. */
	arrowLabel?: string;
	/** Replace "Before / After" headings. */
	headings?: [string, string];
}

export interface NumericTerm {
	value: number | string;
	label?: string;
	tone?: Tone;
}

export interface NumericVisual {
	template: "numeric";
	/** terms[0] op terms[1] ... = result. */
	terms: NumericTerm[];
	op: "+" | "-" | "vs" | ">" | "<" | "=" | "range";
	result?: NumericTerm;
	cards?: CardSpec[];
	lifePoints?: { before: [number, number]; after: [number, number] };
	/** Number line for Pendulum Scales: range [low, high] with highlighted levels. */
	numberLine?: { min: number; max: number; scales: [number, number]; legal: number[] };
	footnote?: string;
}

export type SlideVisualConfig =
	| IllustrationVisual
	| CardAnatomyVisual
	| DuelFieldVisual
	| TimelineVisual
	| SequenceVisual
	| ComparisonVisual
	| NumericVisual;

export type SlideType = SlideVisualConfig["template"];

export interface LessonSlide {
	id: string;
	type: SlideType;
	title: string;
	/** ~20-35 words, beginner friendly. */
	description: string;
	visual: SlideVisualConfig;
	/** Accessible text description of the diagram (screen readers / animations off). */
	alt: string;
	speakerNotes?: string;
}

export interface SourceRef {
	label: string;
	url: string;
}

export interface Lesson {
	id: string;
	chapterId: string;
	title: string;
	description: string;
	slides: LessonSlide[];
	/** Official sources for technical rulings. */
	sources?: SourceRef[];
}

export interface Chapter {
	id: string;
	number: number;
	title: string;
	description: string;
	audience: string;
	accent: Tone;
	lessons: Lesson[];
}
