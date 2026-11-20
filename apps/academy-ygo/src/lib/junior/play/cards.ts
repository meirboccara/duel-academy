import { CARD_ART } from "./card-art";

/** The Junior cards: the original ones, and real cards by their real names. Language-free facts only; names and texts live in the copy files. */
export type CardKind = "monster" | "spell" | "trap";

export type Effect =
	/** Spell: you gain Life Points. */
	| { type: "gain-lp"; amount: number }
	/** Spell: one of your monsters gains ATK until the end of the turn. */
	| { type: "boost"; amount: number }
	/**
	 * Spell: target one face-up monster your opponent controls and destroy it. `skipDraw`: "also skip your next Draw
	 * Phase"; `needs`: "If you control [this card]"; `foeGains`: "then your opponent gains [n] LP".
	 */
	| { type: "destroy"; skipDraw?: true; needs?: string; foeGains?: number }
	/** Spell: "Inflict [n] damage to your opponent." */
	| { type: "burn"; amount: number }
	/** Spell: "Destroy all monsters on the field." */
	| { type: "wipe" }
	/** Spell or Trap: destroy every Spell and Trap your opponent controls (`foe`), or on the field (`all`). */
	| { type: "clear-backrow"; scope: "foe" | "all" }
	/** Swords of Revealing Light: it stays; the opponent's monsters cannot declare an attack; destroyed in the End Phase of the opponent's 3rd turn. */
	| { type: "swords" }
	/** Spell: "Add 1 [card] from your Deck to your hand." */
	| { type: "search"; card: string }
	/** Spell: "Target 1 [Type] monster in your GY; add that target to your hand." */
	| { type: "recover"; monsterType: MonsterType }
	/** Trap, when an opponent's monster declares an attack: "Destroy all your opponent's Attack Position monsters." */
	| { type: "mirror-force" }
	/** Trap, when an opponent's monster declares an attack: negate it, and inflict damage equal to its ATK. */
	| { type: "magic-cylinder" }
	/** Trap: "Inflict 500 damage to your opponent for each monster they control." */
	| { type: "just-desserts"; amount: number }
	/** Trap: "Gain 1000 LP for each face-up [Elemental HERO] monster you control." */
	| { type: "recharge"; amount: number; prefix: string }
	/** Spell, no target: destroy every monster your opponent controls when it resolves. */
	| { type: "destroy-all" }
	/** Trap, when an opponent's monster declares an attack: that monster loses ATK until the end of the turn. */
	| { type: "weaken-attacker"; amount: number }
	/**
	 * Trap, when an opponent's monster declares an attack: the attack is stopped. `gain`: and you gain LP equal to the
	 * attacker's ATK. `needs`: only if you control a face-up monster whose id starts with this (checked as it resolves).
	 */
	| { type: "stop-attack"; gain?: true; needs?: string }
	/** Trap, in answer to an attack: target 1 face-up monster you control; it gains ATK until the end of the turn. */
	| { type: "reinforce"; amount: number }
	/** Trap, in answer to an opponent's Spell: return one of your monsters to your hand. */
	| { type: "return-to-hand" }
	/** Spell: "Target 1 monster in either GY; Special Summon it." */
	| { type: "revive" }
	/** Field Spell: every monster of these Types on the field, on both sides, gains ATK and DEF while it is face-up; those of `minus` lose as much. */
	| { type: "field-boost"; types: readonly MonsterType[]; amount: number; minus?: readonly MonsterType[] }
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
	| { type: "fusion" }
	/** Continuous Spell: "All monsters you control gain ATK during your Battle Phase only." It stays face-up. */
	| { type: "banner"; amount: number }
	/** Equip Spell: equipped to 1 face-up monster you control (of this Type, with `only`, or this Attribute); it gains ATK and DEF. It stays, linked to that monster. */
	| { type: "equip"; atk: number; def: number; only?: MonsterType; attribute?: Attribute }
	/** Continuous Trap: "target 1 monster in your GY; Special Summon that target in Attack Position." Linked to it both ways. */
	| { type: "haunt" }
	/** Counter Trap, when an opponent's monster declares an attack: negate the attack, then end the Battle Phase. */
	| { type: "negate-attack" };

/** Monster Types, as printed on the Type line. */
export const MONSTER_TYPES = ["aqua", "beast", "beast-warrior", "cyberse", "dinosaur", "divine-beast", "dragon", "fairy", "fiend", "fish", "insect", "machine", "plant", "psychic", "pyro", "reptile", "rock", "sea-serpent", "spellcaster", "thunder", "warrior", "winged-beast", "wyrm", "zombie"] as const;
export type MonsterType = (typeof MONSTER_TYPES)[number];
export type Attribute = "LIGHT" | "DARK" | "EARTH" | "WATER" | "FIRE" | "WIND" | "DIVINE";
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
	/** Damage it inflicts to the opponent, or (`gain`) Life Points its owner gains. */
	damage: number;
	gain?: number;
	/** No "you can": it always happens, even when going to the GY was not the last thing (it cannot miss its timing). */
	forced?: true;
}
/** "Gains [n] ATK for each…": what is counted. */
export type Gains =
	/** each of these cards in either Graveyard (Dark Magician Girl) */
	| { per: "in-graveyards"; cards: readonly string[]; amount: number }
	/** each Dragon monster the opponent controls or is in their Graveyard (Buster Blader) */
	| { per: "foe-dragons"; amount: number }
	/** each card in its controller's hand, ATK and DEF (Muka Muka) */
	| { per: "hand"; amount: number }
	/** each of these cards its controller controls (the Battleguards) */
	| { per: "allies"; cards: readonly string[]; amount: number }
	/** while its controller has 1 or fewer cards in hand (Blade Knight) */
	| { per: "small-hand"; amount: number };
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
	/** Its ATK grows with what is counted. */
	gains?: Gains;
	/** "This monster may attack your opponent's Life Points directly", always or only while every face-up monster they control has one of these Attributes. */
	direct?: true | readonly Attribute[];
	/** "If this card attacks a Defense Position monster, inflict piercing battle damage." */
	pierce?: true;
	/** "This card can make a second attack during each Battle Phase." */
	attacks?: 2;
	/** Jinzo: "Trap Cards, and their effects on the field, cannot be activated." */
	noTraps?: true;
	/** Cannot be destroyed by battle: by a monster with this much ATK or more (`fromAtk`), or this many times a turn (`perTurn`). */
	battleImmune?: { fromAtk?: number; perTurn?: number };
	/** "You take no battle damage from attacks involving this card." */
	noBattleDamage?: true;
	/** "If this card attacks, it gains [n] ATK during the Damage Step only" (against a monster of `vs`, with it). */
	attackBonus?: { amount: number; vs?: Attribute };
	/** "Once per turn, during your Standby Phase:" inflict damage, or this card gains ATK. */
	standby?: { burn?: number; gain?: number };
	/** Flame Wingman: "When this card destroys a monster by battle and sends it to the GY: inflict damage equal to its ATK." */
	battleBurn?: true;
	/** Junk Synchron: "When this card is Normal Summoned: You can target 1 Level [n] or lower monster in your GY; Special Summon it in Defense Position, but it has its effects negated." */
	summonRevive?: { maxLevel: number };
	/** A Synchro Monster that names its Tuner: "[Junk Synchron] + 1 or more non-Tuner monsters". */
	synchroTuner?: string;
	/** Junk Warrior: "If this card is Synchro Summoned: It gains ATK equal to the total ATK of all Level [n] or lower monsters you currently control." */
	synchroGain?: { maxLevel: number };
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
	/** The icon beside "SPELL" or "TRAP": none for a Normal card. A Field Spell goes to the Field Zone and stays. */
	icon?: Icon;
	/** "You can only activate 1 [this card] per turn." */
	onePerTurn?: true;
	art: string;
}
export type Card = MonsterCard | EffectCard;

/** The Type of a real card as YGOPRODeck spells it ("Beast-Warrior", "Sea Serpent"), as a MonsterType. */
const asType = (race: string): MonsterType | undefined => {
	const type = race.toLowerCase().replace(/ /g, "-") as MonsterType;
	return MONSTER_TYPES.includes(type) ? type : undefined;
};
/**
 * A real monster, with its printed Level, ATK, DEF, Type and frame from card-art.ts (Konami's data, fetched by
 * scripts/cards/build-art.mjs): only its effect, if it has one, is written by hand.
 */
function real(id: string, rest: Partial<MonsterCard> = {}): MonsterCard {
	const entry = CARD_ART[id];
	if (!entry || entry.kind !== "monster") throw new Error(`${id}: no printed monster in card-art.ts`);
	const frame = (["ritual", "fusion", "synchro", "xyz", "link"] as const).find((kind) => kind === entry.frame);
	const type = asType(entry.race);
	return { kind: "monster", level: entry.level ?? 0, atk: entry.atk ?? 0, def: entry.def ?? 0, art: "🃏", ...(type ? { type } : {}), ...(frame ? { frame } : {}), ...rest };
}
/** A monster's Attribute, as printed; the original cards have none. */
export const attributeOf = (id: CardId): Attribute | undefined => CARD_ART[id]?.attribute as Attribute | undefined;
/** The six icons of Spell and Trap Cards (Rulebook v10 p. 27). A card without an icon is a Normal Spell or Normal Trap. */
export const ICONS = ["quick-play", "continuous", "equip", "field", "ritual", "counter"] as const;
export type Icon = (typeof ICONS)[number];

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
	"shadow-wolf": { ...monster(6, 2200, 1500, "⚖️"), type: "warrior" }, // Judge Man
	"glint-lynx": { ...monster(4, 1300, 1100, "🐆"), ability: { quick: true, oncePerTurn: true, weaken: 800 } },
	"cinder-hedgehog": { ...monster(3, 1000, 700, "🦔"), ability: { quick: false, oncePerTurn: true, weaken: 800 } },
	"spark-trade": { kind: "spell", cost: { type: "discard" }, effect: { type: "destroy" }, art: "🔁" }, // Tribute to the Doomed
	"dozy-moth": { ...monster(2, 400, 400, "🦋"), trigger: { word: "when", damage: 500 } },
	"busy-bee": { ...monster(2, 500, 300, "🐝"), trigger: { word: "if", damage: 500 } },
	/* Real Spells and Traps, under the ids of the original cards they replaced. The other side's targets are left out. */
	"glow-charm": { kind: "spell", effect: { type: "gain-lp", amount: 500 }, art: "✨" }, // Red Medicine
	"spark-dash": { kind: "spell", icon: "quick-play", effect: { type: "boost", amount: 700 }, art: "⚡" }, // Rush Recklessly
	"thunder-clap": { kind: "spell", icon: "quick-play", effect: { type: "destroy", skipDraw: true }, art: "🌩️" }, // Offerings to the Doomed
	"fog-snare": { kind: "trap", effect: { type: "reinforce", amount: 500 }, art: "🌫️" }, // Reinforcements
	"sticky-vine": { kind: "trap", effect: { type: "stop-attack", gain: true }, art: "🌿" }, // Draining Shield
	"quick-burrow": { kind: "trap", effect: { type: "return-to-hand" }, art: "🕳️" }, // Compulsory Evacuation Device

	/* Real cards, by their real names, numbers and text. Their pictures are the official art (`card-art.ts`). */
	"monster-reborn": { kind: "spell", effect: { type: "revive" }, art: "💫" },
	mountain: { kind: "spell", icon: "field", effect: { type: "field-boost", types: ["dragon", "winged-beast", "thunder"], amount: 200 }, art: "⛰️" },
	"sakuretsu-armor": { kind: "trap", effect: { type: "destroy-attacker" }, art: "💥" },
	"dimensional-prison": { kind: "trap", effect: { type: "banish-attacker" }, art: "🌌" },
	"pot-of-desires": { kind: "spell", cost: { type: "banish-deck", count: 10 }, effect: { type: "draw", count: 2 }, onePerTurn: true, art: "🏺" },
	"black-luster-ritual": { kind: "spell", icon: "ritual", effect: { type: "ritual", monster: "black-luster-soldier", total: 8 }, art: "📜" },
	"black-luster-soldier": { ...monster(8, 3000, 2500, "🛡️"), type: "warrior", frame: "ritual" },
	polymerization: { kind: "spell", effect: { type: "fusion" }, art: "🌀" },
	"flame-manipulator": monster(3, 900, 1000, "🧙"),
	masaki: { ...monster(4, 1100, 1100, "⚔️"), type: "warrior" },
	"flame-swordsman": { ...monster(5, 1800, 1600, "🔥"), type: "warrior", frame: "fusion", fusion: ["flame-manipulator", "masaki"] },
	"tune-warrior": { ...monster(3, 1600, 200, "📻"), type: "warrior", tuner: true },
	"giant-soldier-of-stone": monster(3, 1300, 2000, "🪨"),
	"gaia-knight": { ...monster(6, 2600, 800, "🏇"), type: "warrior", frame: "synchro" },
	"gem-knight-pearl": { ...monster(0, 2600, 1900, "⚪"), frame: "xyz", rank: 4, xyz: { level: 4, count: 2 } },
	utopia: { ...monster(0, 2500, 2000, "🤺"), type: "warrior", frame: "xyz", rank: 4, xyz: { level: 4, count: 2 }, detach: "negate-attack" },
	lanphorhynchus: { ...monster(0, 1200, 0, "🦕"), frame: "link", link: 2 },
	"flash-knight": { ...monster(4, 1800, 600, "🌟"), type: "warrior", scale: 7 },
	dragong: { ...monster(4, 500, 2100, "🔔"), scale: 7 },
	mandragon: { ...monster(5, 2500, 1000, "🌱"), scale: 2 },
	"lightning-vortex": { kind: "spell", cost: { type: "discard" }, effect: { type: "destroy-all" }, art: "🌪️" },
	fissure: { kind: "spell", effect: { type: "destroy-lowest" }, art: "🌋" },
	"upstart-goblin": { kind: "spell", effect: { type: "draw-then-gift", lp: 1000 }, art: "👺" },
	"cyber-dragon": { ...monster(5, 2100, 1600, "🐉"), special: "alone" },
	kuriboh: { ...monster(1, 300, 200, "🟤"), hand: "no-battle-damage" },

	/* The other icons of Spells and Traps. */
	"banner-of-courage": { kind: "spell", icon: "continuous", effect: { type: "banner", amount: 200 }, art: "🚩" },
	"legendary-sword": { kind: "spell", icon: "equip", effect: { type: "equip", atk: 300, def: 300, only: "warrior" }, art: "🗡️" },
	"call-of-the-haunted": { kind: "trap", icon: "continuous", effect: { type: "haunt" }, art: "👻" },
	"negate-attack": { kind: "trap", icon: "counter", effect: { type: "negate-attack" }, art: "✋" },

	/* Legendary cards of the first duels, by their real names and numbers. */
	"dark-magician": monster(7, 2500, 2100, "🪄"),
	"blue-eyes-white-dragon": { ...monster(8, 3000, 2500, "🐲"), type: "dragon" },
	"blue-eyes-ultimate-dragon": { ...monster(12, 4500, 3800, "💠"), type: "dragon", frame: "fusion", fusion: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"] },
	"exodia-the-forbidden-one": { ...monster(3, 1000, 1000, "🧞"), wins: "forbidden-one" },
	"right-arm-of-the-forbidden-one": monster(1, 200, 300, "💪"),
	"left-arm-of-the-forbidden-one": monster(1, 200, 300, "🤛"),
	"right-leg-of-the-forbidden-one": monster(1, 200, 300, "🦵"),
	"left-leg-of-the-forbidden-one": monster(1, 200, 300, "🦶"),

	/*
	 * The masters' decks (master-decks.ts). Printed numbers, Types and frames come from card-art.ts; each effect is
	 * written by hand, as printed. Normal Monsters first.
	 */
	"two-headed-king-rex": real("two-headed-king-rex"),
	"crawling-dragon-2": real("crawling-dragon-2"),
	"uraby": real("uraby"),
	"megazowler": real("megazowler"),
	"sword-arm-of-dragon": real("sword-arm-of-dragon"),
	"trakodon": real("trakodon"),
	"red-eyes-black-dragon": real("red-eyes-black-dragon"),
	"serpent-night-dragon": real("serpent-night-dragon"),
	"little-d": real("little-d"),
	"lesser-dragon": real("lesser-dragon"),
	"fairy-dragon": real("fairy-dragon"),
	"one-eyed-shield-dragon": real("one-eyed-shield-dragon"),
	"basic-insect": real("basic-insect"),
	"big-insect": real("big-insect"),
	"flying-kamakiri-2": real("flying-kamakiri-2"),
	"gokibore": real("gokibore"),
	"hercules-beetle": real("hercules-beetle"),
	"killer-needle": real("killer-needle"),
	"giant-flea": real("giant-flea"),
	"petit-moth": real("petit-moth"),
	"jellyfish": real("jellyfish"),
	"amphibian-beast": real("amphibian-beast"),
	"fiend-kraken": real("fiend-kraken"),
	"flying-fish": real("flying-fish"),
	"great-white": real("great-white"),
	"kairyu-shin": real("kairyu-shin"),
	"7-colored-fish": real("7-colored-fish"),
	"giant-red-seasnake": real("giant-red-seasnake"),
	"crazy-fish": real("crazy-fish"),
	"fire-kraken": real("fire-kraken"),
	"bottom-dweller": real("bottom-dweller"),
	"armored-starfish": real("armored-starfish"),
	"alligators-sword": real("alligators-sword"),
	"axe-raider": real("axe-raider"),
	"baby-dragon": real("baby-dragon"),
	"battle-warrior": real("battle-warrior"),
	"swordsman-of-landstar": real("swordsman-of-landstar"),
	"garoozis": real("garoozis"),
	"kojikocy": real("kojikocy"),
	"leogun": real("leogun"),
	"tiger-axe": real("tiger-axe"),
	"rude-kaiser": real("rude-kaiser"),
	"aqua-madoor": real("aqua-madoor"),
	"illusionist-faceless-mage": real("illusionist-faceless-mage"),
	"headless-knight": real("headless-knight"),
	"the-earl-of-demise": real("the-earl-of-demise"),
	"doma-the-angel-of-silence": real("doma-the-angel-of-silence"),
	"earthbound-spirit": real("earthbound-spirit"),
	"souls-of-the-forgotten": real("souls-of-the-forgotten"),
	"the-gross-ghost-of-fled-dreams": real("the-gross-ghost-of-fled-dreams"),
	"the-portraits-secret": real("the-portraits-secret"),
	"feral-imp": real("feral-imp"),
	"ryu-kishin-powered": real("ryu-kishin-powered"),
	"gil-garth": real("gil-garth"),
	"melchid-the-four-face-beast": real("melchid-the-four-face-beast"),
	"dark-rabbit": real("dark-rabbit"),
	"parrot-dragon": real("parrot-dragon"),
	"red-archery-girl": real("red-archery-girl"),
	"ryu-ran": real("ryu-ran"),
	"thousand-eyes-idol": real("thousand-eyes-idol"),
	"toon-alligator": real("toon-alligator"),
	"alpha-the-magnet-warrior": real("alpha-the-magnet-warrior"),
	"beta-the-magnet-warrior": real("beta-the-magnet-warrior"),
	"gamma-the-magnet-warrior": real("gamma-the-magnet-warrior"),
	"gazelle-the-king-of-mythical-beasts": real("gazelle-the-king-of-mythical-beasts"),
	"curse-of-dragon": real("curse-of-dragon"),
	"queens-knight": real("queens-knight"),
	"summoned-skull": real("summoned-skull"),
	"gaia-the-fierce-knight": real("gaia-the-fierce-knight"),
	"elemental-hero-avian": real("elemental-hero-avian"),
	"elemental-hero-burstinatrix": real("elemental-hero-burstinatrix"),
	"elemental-hero-clayman": real("elemental-hero-clayman"),
	"elemental-hero-sparkman": real("elemental-hero-sparkman"),
	"elemental-hero-neos": real("elemental-hero-neos"),
	"oscillo-hero": real("oscillo-hero"),
	"beaver-warrior": real("beaver-warrior"),
	"ojama-yellow": real("ojama-yellow"),
	"unicycular": real("unicycular"),
	"tri-horned-dragon": real("tri-horned-dragon"),
	"yaranzo": real("yaranzo"),
	"vorse-raider": real("vorse-raider"),
	"la-jinn-the-mystical-genie-of-the-lamp": real("la-jinn-the-mystical-genie-of-the-lamp"),
	"x-head-cannon": real("x-head-cannon"),
	"swordstalker": real("swordstalker"),
	"gadget-soldier": real("gadget-soldier"),
	"hitotsu-me-giant": real("hitotsu-me-giant"),
	"hyozanryu": real("hyozanryu"),
	"luster-dragon-2": real("luster-dragon-2"),
	"mystic-horseman": real("mystic-horseman"),
	"grappler": real("grappler"),
	"gyakutenno-megami": real("gyakutenno-megami"),
	"celtic-guardian": real("celtic-guardian"),
	"flamvell-guard": real("flamvell-guard", { tuner: true }),
	/* Effect, Fusion, Ritual and Synchro Monsters. */
	leghul: real("leghul", { direct: true }),
	"skull-mark-ladybug": real("skull-mark-ladybug", { trigger: { word: "when", damage: 0, gain: 1000, forced: true } }),
	"insect-soldiers-of-the-sky": real("insect-soldiers-of-the-sky", { attackBonus: { amount: 1000, vs: "WIND" } }),
	"hayabusa-knight": real("hayabusa-knight", { attacks: 2 }),
	"mad-sword-beast": real("mad-sword-beast", { pierce: true }),
	jinzo: real("jinzo", { noTraps: true }),
	"lava-battleguard": real("lava-battleguard", { gains: { per: "allies", cards: ["swamp-battleguard"], amount: 500 } }),
	"swamp-battleguard": real("swamp-battleguard", { gains: { per: "allies", cards: ["lava-battleguard"], amount: 500 } }),
	"dark-magician-girl": real("dark-magician-girl", { gains: { per: "in-graveyards", cards: ["dark-magician", "magician-of-black-chaos"], amount: 300 } }),
	"buster-blader": real("buster-blader", { gains: { per: "foe-dragons", amount: 500 } }),
	"obnoxious-celtic-guard": real("obnoxious-celtic-guard", { battleImmune: { fromAtk: 1900 } }),
	"sonic-chick": real("sonic-chick", { battleImmune: { fromAtk: 1900 } }),
	"shield-wing": real("shield-wing", { battleImmune: { perTurn: 2 } }),
	"fortress-warrior": real("fortress-warrior", { battleImmune: { perTurn: 1 }, noBattleDamage: true }),
	"dash-warrior": real("dash-warrior", { attackBonus: { amount: 1200 } }),
	"muka-muka": real("muka-muka", { gains: { per: "hand", amount: 300 } }),
	"blade-knight": real("blade-knight", { gains: { per: "small-hand", amount: 400 } }),
	"elemental-hero-bladedge": real("elemental-hero-bladedge", { pierce: true }),
	bowganian: real("bowganian", { standby: { burn: 600 } }),
	"legendary-fiend": real("legendary-fiend", { standby: { gain: 700 } }),
	"junk-synchron": real("junk-synchron", { tuner: true, summonRevive: { maxLevel: 2 } }),
	"fortress-whale": real("fortress-whale"),
	"bracchio-raidus": real("bracchio-raidus", { fusion: ["two-headed-king-rex", "crawling-dragon-2"] }),
	"gaia-the-dragon-champion": real("gaia-the-dragon-champion", { fusion: ["gaia-the-fierce-knight", "curse-of-dragon"] }),
	"alligators-sword-dragon": real("alligators-sword-dragon", { fusion: ["baby-dragon", "alligators-sword"], direct: ["EARTH", "WATER", "FIRE"] }),
	"elemental-hero-flame-wingman": real("elemental-hero-flame-wingman", { fusion: ["elemental-hero-avian", "elemental-hero-burstinatrix"], battleBurn: true }),
	"rabid-horseman": real("rabid-horseman", { fusion: ["iron-boar", "mystic-horseman"] }),
	"junk-warrior": real("junk-warrior", { synchroTuner: "junk-synchron", synchroGain: { maxLevel: 2 } }),
	/* Spells. */
	"pot-of-greed": { kind: "spell", effect: { type: "draw", count: 2 }, art: "🏺" },
	raigeki: { kind: "spell", effect: { type: "destroy-all" }, art: "⚡" },
	"dark-hole": { kind: "spell", effect: { type: "wipe" }, art: "🕳️" },
	hinotama: { kind: "spell", effect: { type: "burn", amount: 500 }, art: "🔥" },
	ookazi: { kind: "spell", effect: { type: "burn", amount: 800 }, art: "🔥" },
	"harpies-feather-duster": { kind: "spell", effect: { type: "clear-backrow", scope: "foe" }, art: "🪶" },
	"heavy-storm": { kind: "spell", effect: { type: "clear-backrow", scope: "all" }, art: "🌪️" },
	"thousand-knives": { kind: "spell", effect: { type: "destroy", needs: "dark-magician" }, art: "🔪" },
	"soul-taker": { kind: "spell", effect: { type: "destroy", foeGains: 1000 }, art: "👻" },
	"swords-of-revealing-light": { kind: "spell", effect: { type: "swords" }, art: "🗡️" },
	"fusion-sage": { kind: "spell", effect: { type: "search", card: "polymerization" }, art: "📖" },
	"the-warrior-returning-alive": { kind: "spell", effect: { type: "recover", monsterType: "warrior" }, art: "🛡️" },
	"raise-body-heat": { kind: "spell", icon: "equip", effect: { type: "equip", atk: 300, def: 300, only: "dinosaur" }, art: "🦖" },
	"laser-cannon-armor": { kind: "spell", icon: "equip", effect: { type: "equip", atk: 300, def: 300, only: "insect" }, art: "🔫" },
	"book-of-secret-arts": { kind: "spell", icon: "equip", effect: { type: "equip", atk: 300, def: 300, only: "spellcaster" }, art: "📕" },
	salamandra: { kind: "spell", icon: "equip", effect: { type: "equip", atk: 700, def: 0, attribute: "FIRE" }, art: "🦎" },
	"shine-palace": { kind: "spell", icon: "equip", effect: { type: "equip", atk: 700, def: 0, attribute: "LIGHT" }, art: "🏯" },
	forest: { kind: "spell", icon: "field", effect: { type: "field-boost", types: ["insect", "beast", "plant", "beast-warrior"], amount: 200 }, art: "🌲" },
	umi: { kind: "spell", icon: "field", effect: { type: "field-boost", types: ["fish", "sea-serpent", "thunder", "aqua"], amount: 200, minus: ["machine", "pyro"] }, art: "🌊" },
	"fortress-whales-oath": { kind: "spell", icon: "ritual", effect: { type: "ritual", monster: "fortress-whale", total: 7 }, art: "📜" },
	/* Traps. */
	"mirror-force": { kind: "trap", effect: { type: "mirror-force" }, art: "🪞" },
	"magic-cylinder": { kind: "trap", effect: { type: "magic-cylinder" }, art: "🎩" },
	"just-desserts": { kind: "trap", effect: { type: "just-desserts", amount: 500 }, art: "🍰" },
	"malevolent-catastrophe": { kind: "trap", effect: { type: "clear-backrow", scope: "all" }, art: "☄️" },
	"hero-barrier": { kind: "trap", effect: { type: "stop-attack", needs: "elemental-hero-" }, art: "🛡️" },
	"elemental-recharge": { kind: "trap", effect: { type: "recharge", amount: 1000, prefix: "elemental-hero-" }, art: "🔋" },
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
	return info.effect.type === "boost" || info.effect.type === "equip" ? "own" : info.effect.type === "destroy" ? "foe" : null;
}
/** A Spell or Trap that stays face-up on the field once it has resolved: Continuous, Equip and Field. */
export function staysOnField(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind !== "monster" && (card.icon === "continuous" || card.icon === "equip" || card.icon === "field");
}
/** A Quick-Play Spell: it may be Set, then activated on either player's turn (not the turn it was Set). */
export const isQuickPlay = (id: CardId): boolean => {
	const card = cardOf(id);
	return card.kind === "spell" && card.icon === "quick-play";
};
/** A Trap that targets one of its owner's own monsters when it is flipped. */
export function trapTargetsOwn(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind === "trap" && (card.effect.type === "return-to-hand" || card.effect.type === "reinforce");
}
/** Does the card carry rules text? A Normal Monster only carries a description that does not affect the game. */
export function hasRulesText(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind !== "monster" || !!(card.ability || card.trigger || card.frame || card.special || card.hand || card.wins || card.detach || card.gains || card.direct || card.pierce || card.attacks || card.noTraps || card.battleImmune || card.noBattleDamage || card.attackBonus || card.standby || card.battleBurn || card.summonRevive);
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
