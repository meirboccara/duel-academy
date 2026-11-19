/** The Junior cards: the original ones, and real cards by their real names. Language-free facts only; names and texts live in the copy files. */
export type CardKind = "monster" | "spell" | "trap";

export type Effect =
	/** Spell: you gain Life Points. */
	| { type: "gain-lp"; amount: number }
	/** Spell: one of your monsters gains ATK until the end of the turn. */
	| { type: "boost"; amount: number }
	/** Spell: target one face-up monster your opponent controls and destroy it. */
	| { type: "destroy" }
	/** Spell, no target: destroy every monster your opponent controls when it resolves. */
	| { type: "destroy-all" }
	/** Trap, when an opponent's monster declares an attack: that monster loses ATK until the end of the turn. */
	| { type: "weaken-attacker"; amount: number }
	/** Trap, when an opponent's monster declares an attack: the attack is stopped. */
	| { type: "stop-attack" }
	/** Trap, in answer to an opponent's Spell: return one of your monsters to your hand. */
	| { type: "return-to-hand" }
	/** Spell: "Target 1 monster in either GY; Special Summon it." */
	| { type: "revive" }
	/** Field Spell: every monster of these Types on the field, on both sides, gains ATK and DEF while it is face-up. */
	| { type: "field-boost"; types: readonly MonsterType[]; amount: number }
	/** Trap, when an opponent's monster declares an attack: target the attacking monster; destroy it. */
	| { type: "destroy-attacker" }
	/** Trap, when an opponent's monster declares an attack: target the attacking monster; banish it. */
	| { type: "banish-attacker" }
	/** Spell: draw cards. */
	| { type: "draw"; count: number }
	/** Spell: "Draw 1 card, then your opponent gains 1000 LP." */
	| { type: "draw-then-gift"; lp: number }
	/** Spell, no target: destroy the 1 monster your opponent controls with the lowest ATK (your choice, if tied). */
	| { type: "destroy-lowest" }
	/** Ritual Spell: Ritual Summons the named monster from the hand; Tribute monsters from hand or field whose Levels total `total` or more. */
	| { type: "ritual"; monster: string; total: number }
	/** Spell: Fusion Summon 1 Fusion Monster from the Extra Deck, using monsters from the hand or field. */
	| { type: "fusion" };

/** Monster Types that a card in Junior play asks about. */
export type MonsterType = "dragon" | "winged-beast" | "thunder";
/** The colour of a special monster card's frame: where it lives and how it is Summoned. */
export type Frame = "ritual" | "fusion" | "synchro" | "xyz" | "link";

/**
 * A Monster's own effect: "You can target 1 face-up monster your opponent controls; it loses ATK until the end of this turn."
 * With "(Quick Effect)" it can be used on either player's turn, also in answer to the opponent; without it, only in
 * your own Main Phase while nothing else is happening.
 */
export interface Ability {
	quick: boolean;
	/** "You can only use this effect of [this card] once per turn." */
	oncePerTurn: boolean;
	weaken: number;
}
/**
 * "[If|When] this card is sent to the GY: You can inflict 500 damage to your opponent."
 * "If… you can" always gets its chance. "When… you can" only does when going to the GY was the last thing that
 * happened; if something else happened right after (a card was activated, a monster was Summoned), it misses it.
 */
export interface Trigger {
	word: "when" | "if";
	damage: number;
}
export interface MonsterCard {
	kind: "monster";
	level: number;
	atk: number;
	def: number;
	/** A picture made of one emoji, shown when the card has no official art; decorative, never the only way a card is named. */
	art: string;
	ability?: Ability;
	trigger?: Trigger;
	type?: MonsterType;
	/** Missing for Main Deck monsters with a yellow or orange frame. */
	frame?: Frame;
	/** "Tuner" on the Type line: one is needed for a Synchro Summon. */
	tuner?: true;
	/** Xyz Monsters have a Rank instead of a Level; their `level` is 0. */
	rank?: number;
	/** Link Monsters have a Link Rating instead of a Level, and no DEF; their `level` and `def` are 0. */
	link?: number;
	/** A Pendulum Monster: its Pendulum Scale. */
	scale?: number;
	/** Fusion Monster: the monsters its first line names. */
	fusion?: readonly string[];
	/** Xyz Monster: "2 Level 4 monsters". */
	xyz?: { level: number; count: number };
	/** "If only your opponent controls a monster, you can Special Summon this card (from your hand)." No Chain. */
	special?: "alone";
	/** "(Quick Effect): You can discard this card; you take no battle damage from that battle." Used from the hand. */
	hand?: "no-battle-damage";
	/** "When a monster declares an attack: You can detach 1 material from this card; negate the attack." Attacked with no material, it is destroyed. */
	detach?: "negate-attack";
	/** "If you have [the four limbs] in addition to this card in your hand, you win the Duel." */
	wins?: "forbidden-one";
}
export type Cost =
	/** "Discard 1 card;": paid when the card is activated, before anything else happens. */
	| { type: "discard" }
	/** "Banish 10 cards from the top of your Deck, face-down;" */
	| { type: "banish-deck"; count: number };
export interface EffectCard {
	kind: "spell" | "trap";
	effect: Effect;
	cost?: Cost;
	/** The icon beside "SPELL": none for a Normal Spell. A Field Spell goes to the Field Zone and stays. */
	icon?: "field" | "ritual";
	/** "You can only activate 1 [this card] per turn." */
	onePerTurn?: true;
	art: string;
}
export type Card = MonsterCard | EffectCard;

const monster = (level: number, atk: number, def: number, art: string): MonsterCard => ({ kind: "monster", level, atk, def, art });

export const CARDS = {
	/*
	 * Real Normal Monsters, under the ids of the original cards they replaced (saves store level ids, never card ids).
	 * The name in a comment is the real card; its numbers are the printed ones. The emoji is only a fallback picture.
	 */
	"pocket-cub": monster(3, 1200, 800, "🐻"), // Silver Fang
	"moss-beetle": monster(4, 800, 2000, "🧝"), // Mystical Elf
	"river-otter": monster(4, 1500, 1000, "🗿"), // Destroyer Golem
	"lantern-owl": { ...monster(4, 1800, 600, "🦅"), type: "winged-beast" }, // Sky Scout
	"pebble-crab": monster(3, 600, 1500, "🤡"), // Saggi the Dark Clown
	"storm-stag": monster(6, 2300, 1200, "🤖"), // Ally of Justice Clausolas
	"mountain-bison": monster(8, 2900, 2450, "👸"), // Cosmo Queen
	"mud-toad": monster(2, 800, 500, "💘"), // Happy Lover
	"night-bat": monster(3, 1100, 800, "🙏"), // Lady of Faith
	"thorn-fox": monster(4, 1400, 1000, "🧚"), // Fairy's Gift
	"bramble-ram": monster(4, 1500, 1300, "🌙"), // Maiden of the Moonlight
	"iron-boar": monster(4, 1700, 1000, "🐂"), // Battle Ox
	"stone-golem": monster(4, 500, 2000, "🐀"), // Prevent Rat
	"shadow-wolf": monster(6, 2200, 1500, "⚖️"), // Judge Man
	"glint-lynx": { ...monster(4, 1300, 1100, "🐆"), ability: { quick: true, oncePerTurn: true, weaken: 800 } },
	"cinder-hedgehog": { ...monster(3, 1000, 700, "🦔"), ability: { quick: false, oncePerTurn: true, weaken: 800 } },
	"spark-trade": { kind: "spell", cost: { type: "discard" }, effect: { type: "destroy-all" }, art: "🔁" },
	"dozy-moth": { ...monster(2, 400, 400, "🦋"), trigger: { word: "when", damage: 500 } },
	"busy-bee": { ...monster(2, 500, 300, "🐝"), trigger: { word: "if", damage: 500 } },
	"glow-charm": { kind: "spell", effect: { type: "gain-lp", amount: 500 }, art: "✨" },
	"spark-dash": { kind: "spell", effect: { type: "boost", amount: 500 }, art: "⚡" },
	"thunder-clap": { kind: "spell", effect: { type: "destroy" }, art: "🌩️" },
	"fog-snare": { kind: "trap", effect: { type: "weaken-attacker", amount: 500 }, art: "🌫️" },
	"sticky-vine": { kind: "trap", effect: { type: "stop-attack" }, art: "🌿" },
	"quick-burrow": { kind: "trap", effect: { type: "return-to-hand" }, art: "🕳️" },

	/* Real cards, by their real names, numbers and text. Their pictures are the official art (`card-art.ts`). */
	"monster-reborn": { kind: "spell", effect: { type: "revive" }, art: "💫" },
	mountain: { kind: "spell", icon: "field", effect: { type: "field-boost", types: ["dragon", "winged-beast", "thunder"], amount: 200 }, art: "⛰️" },
	"sakuretsu-armor": { kind: "trap", effect: { type: "destroy-attacker" }, art: "💥" },
	"dimensional-prison": { kind: "trap", effect: { type: "banish-attacker" }, art: "🌌" },
	"pot-of-desires": { kind: "spell", cost: { type: "banish-deck", count: 10 }, effect: { type: "draw", count: 2 }, onePerTurn: true, art: "🏺" },
	"black-luster-ritual": { kind: "spell", icon: "ritual", effect: { type: "ritual", monster: "black-luster-soldier", total: 8 }, art: "📜" },
	"black-luster-soldier": { ...monster(8, 3000, 2500, "🛡️"), frame: "ritual" },
	polymerization: { kind: "spell", effect: { type: "fusion" }, art: "🌀" },
	"flame-manipulator": monster(3, 900, 1000, "🧙"),
	masaki: monster(4, 1100, 1100, "⚔️"),
	"flame-swordsman": { ...monster(5, 1800, 1600, "🔥"), frame: "fusion", fusion: ["flame-manipulator", "masaki"] },
	"tune-warrior": { ...monster(3, 1600, 200, "📻"), tuner: true },
	"giant-soldier-of-stone": monster(3, 1300, 2000, "🪨"),
	"gaia-knight": { ...monster(6, 2600, 800, "🏇"), frame: "synchro" },
	"gem-knight-pearl": { ...monster(0, 2600, 1900, "⚪"), frame: "xyz", rank: 4, xyz: { level: 4, count: 2 } },
	utopia: { ...monster(0, 2500, 2000, "🤺"), frame: "xyz", rank: 4, xyz: { level: 4, count: 2 }, detach: "negate-attack" },
	lanphorhynchus: { ...monster(0, 1200, 0, "🦕"), frame: "link", link: 2 },
	"flash-knight": { ...monster(4, 1800, 600, "🌟"), scale: 7 },
	dragong: { ...monster(4, 500, 2100, "🔔"), scale: 7 },
	mandragon: { ...monster(5, 2500, 1000, "🌱"), scale: 2 },
	"lightning-vortex": { kind: "spell", cost: { type: "discard" }, effect: { type: "destroy-all" }, art: "🌪️" },
	fissure: { kind: "spell", effect: { type: "destroy-lowest" }, art: "🌋" },
	"upstart-goblin": { kind: "spell", effect: { type: "draw-then-gift", lp: 1000 }, art: "👺" },
	"cyber-dragon": { ...monster(5, 2100, 1600, "🐉"), special: "alone" },
	kuriboh: { ...monster(1, 300, 200, "🟤"), hand: "no-battle-damage" },

	/* Legendary cards of the first duels, by their real names and numbers. */
	"dark-magician": monster(7, 2500, 2100, "🪄"),
	"blue-eyes-white-dragon": { ...monster(8, 3000, 2500, "🐲"), type: "dragon" },
	"blue-eyes-ultimate-dragon": { ...monster(12, 4500, 3800, "💠"), type: "dragon", frame: "fusion", fusion: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"] },
	"exodia-the-forbidden-one": { ...monster(3, 1000, 1000, "🧞"), wins: "forbidden-one" },
	"right-arm-of-the-forbidden-one": monster(1, 200, 300, "💪"),
	"left-arm-of-the-forbidden-one": monster(1, 200, 300, "🤛"),
	"right-leg-of-the-forbidden-one": monster(1, 200, 300, "🦵"),
	"left-leg-of-the-forbidden-one": monster(1, 200, 300, "🦶"),
} as const satisfies Record<string, Card>;

export type CardId = keyof typeof CARDS;
export const CARD_IDS = Object.keys(CARDS) as CardId[];
export const cardOf = (id: CardId): Card => CARDS[id];
export function monsterOf(id: CardId): MonsterCard {
	const card = cardOf(id);
	if (card.kind !== "monster") throw new Error(`${id} is not a monster`);
	return card;
}
/**
 * Whose Monster a Spell targets when it is activated: "own" (the player's), "foe" (the opponent's),
 * or null when it targets nothing. The one place that decides it, for the rules, the rival and the screen.
 */
export function spellTarget(card: CardId): "own" | "foe" | null {
	const info = cardOf(card);
	if (info.kind !== "spell") return null;
	return info.effect.type === "boost" ? "own" : info.effect.type === "destroy" ? "foe" : null;
}
/** Does the card carry rules text? A Normal Monster only carries a description that does not affect the game. */
export function hasRulesText(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind !== "monster" || !!(card.ability || card.trigger || card.frame || card.special || card.hand || card.wins);
}
/** The four limbs of the Forbidden One. */
export const FORBIDDEN_LIMBS: readonly CardId[] = ["right-arm-of-the-forbidden-one", "left-arm-of-the-forbidden-one", "right-leg-of-the-forbidden-one", "left-leg-of-the-forbidden-one"];
/** The five pieces of the Forbidden One: the head, then the four limbs. All five in one hand win the Duel. */
export const FORBIDDEN_ONE: readonly CardId[] = ["exodia-the-forbidden-one", ...FORBIDDEN_LIMBS];
/** Extra Deck monsters: Fusion, Synchro, Xyz and Link. A Ritual Monster lives in the Main Deck. */
export function inExtraDeck(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind === "monster" && !!card.frame && card.frame !== "ritual";
}
/** Level 1 to 4 needs no Tribute, Level 5 or 6 needs one, Level 7 or higher needs two. */
export function tributesFor(level: number): 0 | 1 | 2 {
	return level >= 7 ? 2 : level >= 5 ? 1 : 0;
}
