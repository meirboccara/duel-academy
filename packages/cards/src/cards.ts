import { type Card, MONSTER_TYPES, type MonsterCard, type MonsterType } from "@duel-academy/engine";
import { CARD_ART } from "./card-art";

/**
 * The Junior cards: the original ones, and real cards by their real names. Language-free facts only; names and texts
 * of the lessons live in the app's copy files, printed names and texts in card-art.ts.
 */

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
	"spark-trade": { kind: "spell", cost: { type: "discard" }, effect: { type: "destroy", anyFace: true }, art: "🔁" }, // Tribute to the Doomed
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
	lanphorhynchus: { ...monster(0, 1200, 0, "🦕"), frame: "link", link: 2, arrows: ["bottom-left", "bottom-right"], linkMaterials: { min: 2, max: 2 } },
	"flash-knight": { ...monster(4, 1800, 600, "🌟"), type: "warrior", scale: 7 },
	dragong: { ...monster(4, 500, 2100, "🔔"), scale: 7 },
	mandragon: { ...monster(5, 2500, 1000, "🌱"), scale: 2 },
	"lightning-vortex": { kind: "spell", cost: { type: "discard" }, effect: { type: "destroy-all", faceUp: true }, art: "🌪️" },
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
	/* The starter Decks' Extra Decks. */
	"dark-paladin": real("dark-paladin", { fusion: ["dark-magician", "buster-blader"], gains: { per: "all-dragons", amount: 500 }, act: { kind: "negate-spell" } }),
	"dark-magician-the-dragon-knight": real("dark-magician-the-dragon-knight", { fusion: ["dark-magician", { type: "dragon" }], nameAs: "dark-magician", guardsBackrow: true }),
	"dark-magician-girl-the-dragon-knight": real("dark-magician-girl-the-dragon-knight", { fusion: ["dark-magician-girl", { type: "dragon" }], act: { kind: "destroy", quick: true, oncePerTurn: true } }),
	"black-skull-dragon": real("black-skull-dragon", { fusion: ["summoned-skull", "red-eyes-black-dragon"] }),
	"gaia-dragon-the-thunder-charger": real("gaia-dragon-the-thunder-charger", { level: 0, rank: 7, xyz: { level: 7, count: 2 }, pierce: true }),
	"blue-eyes-twin-burst-dragon": real("blue-eyes-twin-burst-dragon", { fusion: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"], battleImmune: { always: true }, attacks: 2, monstersOnly: true, banishSurvivor: true }),
	"blue-eyes-spirit-dragon": real("blue-eyes-spirit-dragon", { synchroNonTuner: "blue-eyes-", oneAtATime: true, negatesGraveyard: true, act: { kind: "tribute-synchro" } }),
	"elemental-hero-shining-flare-wingman": real("elemental-hero-shining-flare-wingman", { fusion: ["elemental-hero-flame-wingman", "elemental-hero-sparkman"], gains: { per: "graveyard-prefix", prefix: "elemental-hero-", amount: 300 }, battleBurn: true }),
	"elemental-hero-thunder-giant": real("elemental-hero-thunder-giant", { fusion: ["elemental-hero-sparkman", "elemental-hero-clayman"], act: { kind: "destroy", quick: false, oncePerTurn: true, weaker: true } }),
	"elemental-hero-great-tornado": real("elemental-hero-great-tornado", { fusion: [{ prefix: "elemental-hero-" }, { attribute: "WIND" }], onFusion: "halve-foes" }),
	"elemental-hero-nova-master": real("elemental-hero-nova-master", { fusion: [{ prefix: "elemental-hero-" }, { attribute: "FIRE" }], battleDraw: true }),
	"elemental-hero-rampart-blaster": real("elemental-hero-rampart-blaster", { fusion: ["elemental-hero-clayman", "elemental-hero-burstinatrix"], defenseAttack: true }),
	/* Trainers' and starters' newer cards. */
	"time-wizard": real("time-wizard", { act: { kind: "coin" } }),
	"thousand-dragon": real("thousand-dragon", { fusion: ["time-wizard", "baby-dragon"] }),
	"meteor-dragon": real("meteor-dragon"),
	"meteor-black-dragon": real("meteor-black-dragon", { fusion: ["red-eyes-black-dragon", "meteor-dragon"] }),
	"blue-eyes-alternative-white-dragon": real("blue-eyes-alternative-white-dragon", { special: { reveal: "blue-eyes-white-dragon" }, noNormal: true, nameAs: "blue-eyes-white-dragon", act: { kind: "destroy-free" } }),
	"rocket-warrior": real("rocket-warrior", { rocket: { weaken: 500 } }),
	"magicians-valkyria": real("magicians-valkyria", { shields: "spellcaster" }),
	"dark-time-wizard": { kind: "spell", icon: "quick-play", effect: { type: "coin-wipe" }, onePerTurn: true, art: "⏳" },
	"dark-magical-curtain": { kind: "spell", icon: "quick-play", effect: { type: "curtain" }, onePerTurn: true, art: "🎭" },
	"dark-magic-curtain": { kind: "spell", cost: { type: "half-lp" }, effect: { type: "call", card: "dark-magician", from: ["deck"], lock: true }, art: "🎪" },
	"sages-stone": { kind: "spell", effect: { type: "call", card: "dark-magician", from: ["hand", "deck"], needs: "dark-magician-girl" }, art: "💎" },
	"dark-magic-attack": { kind: "spell", effect: { type: "clear-backrow", scope: "foe", needs: "dark-magician" }, art: "🪄" },
	"dark-burning-attack": { kind: "spell", effect: { type: "destroy-all", faceUp: true, needs: "dark-magician-girl" }, art: "🔥" },
	"burst-stream-of-destruction": { kind: "spell", effect: { type: "destroy-all", needs: "blue-eyes-white-dragon", lockAttack: true }, art: "💥" },
	"trade-in": { kind: "spell", cost: { type: "discard", level: 8 }, effect: { type: "draw", count: 2 }, art: "🔄" },
	"ancient-rules": { kind: "spell", effect: { type: "hand-summon", minLevel: 5 }, art: "📜" },
	"silvers-cry": { kind: "spell", icon: "quick-play", effect: { type: "revive", dragonNormal: true }, onePerTurn: true, art: "🐉" },
	"inferno-fire-blast": { kind: "spell", effect: { type: "fire-blast", name: "red-eyes-black-dragon" }, art: "☄️" },
	shrink: { kind: "spell", icon: "quick-play", effect: { type: "shrink" }, art: "🔻" },
	"forbidden-chalice": { kind: "spell", icon: "quick-play", effect: { type: "chalice", amount: 400 }, art: "🏆" },
	"book-of-moon": { kind: "spell", icon: "quick-play", effect: { type: "book" }, art: "🌙" },
	"enemy-controller": { kind: "spell", icon: "quick-play", effect: { type: "switch" }, art: "🎮" },
	"smashing-ground": { kind: "spell", effect: { type: "smash" }, art: "👊" },
	"storming-mirror-force": { kind: "trap", effect: { type: "storm-force" }, art: "🌬️" },
	"widespread-ruin": { kind: "trap", effect: { type: "ruin" }, art: "💣" },
	/* Hand traps, Traps that answer a Summon, and searchers. */
	"ash-blossom-joyous-spring": real("ash-blossom-joyous-spring", { tuner: true, hand: "ash" }),
	"effect-veiler": real("effect-veiler", { tuner: true, hand: "veiler" }),
	"droll-lock-bird": real("droll-lock-bird", { hand: "droll" }),
	/* Link Monsters with their arrows (Konami's data, through YGOPRODeck). */
	"gaia-saber-the-lightning-shadow": real("gaia-saber-the-lightning-shadow", { link: 3, arrows: ["left", "right", "bottom"], linkMaterials: { min: 2 } }),
	"link-spider": real("link-spider", {
		link: 1,
		arrows: ["bottom"],
		linkMaterials: { min: 1, max: 1, filter: { normal: true } },
		effects: [{ when: "ignition", once: "copy", actions: [{ do: "special", from: ["hand"], filter: { normal: true, maxLevel: 4 }, to: "pointed" }] }],
	}),
	"traffic-ghost": real("traffic-ghost", { link: 3, arrows: ["bottom-left", "bottom", "bottom-right"], linkMaterials: { min: 2, max: 3 } }),
	/* Generic Synchro and Xyz Monsters: "1 Tuner + 1 or more non-Tuner monsters", "3 Level 4 monsters". */
	"scrap-archfiend": real("scrap-archfiend"),
	"gagagigo-the-risen": real("gagagigo-the-risen", { level: 0, rank: 4, xyz: { level: 4, count: 3 } }),
	/* Cards written as data (effects.ts): their effects need no code of their own. */
	/* MAMS (Magnificent Maestros, TCG 2026-11-12). Kaibaman the Legend is a reprint there. */
	"kaibaman-the-legend": real("kaibaman-the-legend", {
		tuner: true,
		effects: [
			{ when: "normal-or-special-summoned", optional: true, once: "name", conditions: [{ show: "blue-eyes-white-dragon", count: 3 }], actions: [{ do: "special", from: ["hand", "deck", "graveyard"], filter: { card: "blue-eyes-white-dragon" } }] },
			{ when: { specialSummoned: { card: "blue-eyes-white-dragon" } }, from: "graveyard", optional: true, cost: "banish-self", once: "name", actions: [{ do: "search", filter: { kind: "monster", archetype: "Blue-Eyes" } }] },
		],
	}),
	"blue-eyes-white-dragon-the-white-phantom-beast": real("blue-eyes-white-dragon-the-white-phantom-beast", {
		effects: [
			{ when: [{ added: "self" }, { destroyedByBattle: "ally" }], from: "hand", optional: true, once: "name", actions: [{ do: "special-self" }] },
			{ when: "special-summoned", summonedFrom: ["hand", "deck"], optional: true, once: "name", conditions: [{ foeMonsters: 1 }], actions: [{ do: "lock", direct: "Blue-Eyes" }, { do: "destroy-foes" }] },
			{ when: { targeted: "self" }, cost: "discard", actions: [{ do: "negate" }] },
		],
	}),
	"deep-eyes-white-dragon-the-blue-abyss": real("deep-eyes-white-dragon-the-blue-abyss", {
		treatedAs: "Blue-Eyes",
		effects: [
			{ when: "ignition", from: "hand", cost: "discard-self", once: "name", actions: [{ do: "search", filter: { level: 1, attribute: "LIGHT", tuner: true } }] },
			{
				when: { sentToGy: { anyOf: [{ archetype: "Blue-Eyes", frame: "ritual" }, { card: "blue-eyes-white-dragon" }] } },
				from: "hand-or-graveyard",
				optional: true,
				once: "name",
				actions: [{ do: "special-self", atkOfThat: true, banishOnLeave: true }],
			},
		],
	}),
	"the-guiding-flute-of-summoning-dragons": {
		kind: "spell",
		onePerTurn: true,
		effect: {
			type: "data",
			conditions: [{ on: "field", filter: { kind: "monster", type: "spellcaster" } }],
			actions: [{ do: "special", from: ["deck"], filter: { kind: "monster", type: "dragon", minLevel: 5 } }, { do: "special-same", if: { foeMonsters: 2 } }, { do: "lock", special: ["dragon", "spellcaster"] }],
		},
		effects: [{ when: "ignition", from: "graveyard", cost: "banish-self", once: "name", conditions: [{ phase: "main2" }, { sentThisTurn: true }], actions: [{ do: "draw", count: 1 }] }],
		art: "🪈",
	},
	"fossil-dig": { kind: "spell", effect: { type: "data", actions: [{ do: "search", filter: { kind: "monster", type: "dinosaur", maxLevel: 6 } }] }, art: "🦴" },
	"summoners-art": { kind: "spell", effect: { type: "data", actions: [{ do: "search", filter: { normal: true, minLevel: 5 } }] }, art: "📜" },
	"armageddon-knight": real("armageddon-knight", { effects: [{ when: "summoned", optional: true, actions: [{ do: "mill", filter: { kind: "monster", attribute: "DARK" } }] }] }),
	"black-dragons-chick": real("black-dragons-chick", { effects: [{ when: "ignition", cost: "send-self", actions: [{ do: "special", from: ["hand"], filter: { card: "red-eyes-black-dragon" } }] }] }),
	terraforming: { kind: "spell", effect: { type: "data", actions: [{ do: "search", filter: { kind: "spell", icon: "field" } }] }, art: "🌍" },
	"one-for-one": { kind: "spell", cost: { type: "discard", monster: true }, effect: { type: "data", actions: [{ do: "special", from: ["hand", "deck"], filter: { kind: "monster", level: 1 } }] }, art: "☝️" },
	"toon-table-of-contents": { kind: "spell", effect: { type: "data", actions: [{ do: "search", filter: { archetype: "Toon" } }] }, art: "📖" },
	"foolish-burial": { kind: "spell", effect: { type: "data", actions: [{ do: "mill", filter: { kind: "monster" } }] }, art: "⚰️" },
	"sage-with-eyes-of-blue": real("sage-with-eyes-of-blue", {
		tuner: true,
		effects: [
			{ when: "normal-summoned", optional: true, actions: [{ do: "search", filter: { level: 1, attribute: "LIGHT", tuner: true, except: "sage-with-eyes-of-blue" } }] },
			{ when: "ignition", from: "hand", cost: "discard-self", once: "name", actions: [{ do: "send-target", filter: { effect: true } }, { do: "special", from: ["deck"], filter: { kind: "monster", archetype: "Blue-Eyes" } }] },
		],
	}),
	"protector-with-eyes-of-blue": real("protector-with-eyes-of-blue", {
		tuner: true,
		effects: [
			{ when: "normal-summoned", optional: true, actions: [{ do: "special", from: ["hand"], filter: { level: 1, attribute: "LIGHT", tuner: true } }] },
			{ when: "ignition", once: "name", actions: [{ do: "send-target", filter: { effect: true } }, { do: "special", from: ["hand"], filter: { kind: "monster", archetype: "Blue-Eyes" } }] },
		],
	}),
	"the-white-stone-of-legend": real("the-white-stone-of-legend", { tuner: true, effects: [{ when: "sent-to-gy", actions: [{ do: "search", filter: { card: "blue-eyes-white-dragon" } }] }] }),
	"destiny-hero-malicious": real("destiny-hero-malicious", { effects: [{ when: "ignition", from: "graveyard", cost: "banish-self", actions: [{ do: "special", from: ["deck"], filter: { card: "destiny-hero-malicious" } }] }] }),
	"elemental-hero-shadow-mist": real("elemental-hero-shadow-mist", {
		effects: [
			{ when: "special-summoned", optional: true, once: "shared", actions: [{ do: "search", filter: { kind: "spell", icon: "quick-play", archetype: "Change" } }] },
			{ when: "sent-to-gy", optional: true, once: "shared", actions: [{ do: "search", filter: { kind: "monster", archetype: "HERO", except: "elemental-hero-shadow-mist" } }] },
		],
	}),
	"ghost-ogre-snow-rabbit": real("ghost-ogre-snow-rabbit", { tuner: true, hand: "ogre" }),
	"infinite-impermanence": { kind: "trap", effect: { type: "impermanence" }, art: "♾️" },
	"seven-tools-of-the-bandit": { kind: "trap", icon: "counter", cost: { type: "pay-lp", amount: 1000 }, effect: { type: "counter", negates: "trap" }, art: "🧰" },
	"magic-jammer": { kind: "trap", icon: "counter", cost: { type: "discard" }, effect: { type: "counter", negates: "spell" }, art: "📵" },
	"solemn-strike": { kind: "trap", icon: "counter", cost: { type: "pay-lp", amount: 1500 }, effect: { type: "counter", negates: "monster" }, art: "⚖️" },
	"swift-scarecrow": real("swift-scarecrow", { hand: "scarecrow" }),
	"battle-fader": real("battle-fader", { hand: "fader" }),
	"dd-crow": real("dd-crow", { hand: "crow" }),
	"magicians-rod": real("magicians-rod", { summonSearch: "Dark Magician" }),
	"elemental-hero-blazeman": real("elemental-hero-blazeman", { summonAdd: "polymerization" }),
	"elemental-hero-gaia": real("elemental-hero-gaia", { fusion: [{ prefix: "elemental-hero-" }, { attribute: "EARTH" }], onFusion: "gaia" }),
	"trap-hole": { kind: "trap", effect: { type: "trap-hole", minAtk: 1000 }, art: "🕳️" },
	"bottomless-trap-hole": { kind: "trap", effect: { type: "bottomless", minAtk: 1500 }, art: "⚫" },
	"torrential-tribute": { kind: "trap", effect: { type: "torrential" }, art: "🌊" },
	"reinforcement-of-the-army": { kind: "spell", effect: { type: "search-pick", pool: "low-warrior" }, art: "📯" },
	"e-emergency-call": { kind: "spell", effect: { type: "search-pick", pool: "elemental-hero" }, art: "🚨" },
	"a-hero-lives": { kind: "spell", cost: { type: "half-lp" }, effect: { type: "deck-summon", pool: "low-elemental-hero" }, art: "🦸" },
	/* Spells. */
	"pot-of-greed": { kind: "spell", effect: { type: "draw", count: 2 }, art: "🏺" },
	raigeki: { kind: "spell", effect: { type: "destroy-all" }, art: "⚡" },
	"dark-hole": { kind: "spell", effect: { type: "wipe" }, art: "🕳️" },
	hinotama: { kind: "spell", effect: { type: "burn", amount: 500 }, art: "🔥" },
	ookazi: { kind: "spell", effect: { type: "burn", amount: 800 }, art: "🔥" },
	"harpies-feather-duster": { kind: "spell", effect: { type: "clear-backrow", scope: "foe" }, art: "🪶" },
	"heavy-storm": { kind: "spell", effect: { type: "clear-backrow", scope: "all" }, art: "🌪️" },
	"thousand-knives": { kind: "spell", effect: { type: "destroy", needs: "dark-magician", anyFace: true }, art: "🔪" },
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

export type JuniorCardId = keyof typeof CARDS;
export const CARD_IDS = Object.keys(CARDS) as JuniorCardId[];
/** Every card with its printed Type filled in where the hand-written data leaves it out (the course's first real monsters). */
export const PRINTED: Record<string, Card> = Object.fromEntries(
	Object.entries(CARDS as Record<string, Card>).map(([id, card]) => {
		const entry = CARD_ART[id];
		const type = card.kind === "monster" && !card.type && entry?.kind === "monster" ? asType(entry.race) : undefined;
		return [id, type ? { ...card, type } : card];
	}),
);
/** The four limbs of the Forbidden One. */
export const FORBIDDEN_LIMBS: readonly JuniorCardId[] = ["right-arm-of-the-forbidden-one", "left-arm-of-the-forbidden-one", "right-leg-of-the-forbidden-one", "left-leg-of-the-forbidden-one"];
/** The five pieces of the Forbidden One: the head, then the four limbs. All five in one hand win the Duel. */
export const FORBIDDEN_ONE: readonly JuniorCardId[] = ["exodia-the-forbidden-one", ...FORBIDDEN_LIMBS];
