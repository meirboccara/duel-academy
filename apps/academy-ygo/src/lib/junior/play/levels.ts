import { FORBIDDEN_LIMBS, cardOf, type CardId } from "./cards";
import { EXTRA_ZONE, type Material, type Move, type Setup, type Side } from "./engine";

/** The rules of the Junior course, in teaching order. Each is taught by one level and used again by later ones. */
export const RULE_IDS = ["zones", "battle", "defense", "direct", "summon", "tribute", "phases", "spell", "trap", "chain", "cost", "target", "quick", "once", "timing", "graveyard", "field", "banish", "ritual", "fusion", "synchro", "xyz", "detach", "link", "pendulum", "notarget", "then", "condition", "exodia"] as const;
export type RuleId = (typeof RULE_IDS)[number];

export const WORLD_IDS = ["wake", "shield", "friend", "magic", "puzzles", "tower", "rival", "reading", "mat", "ritual", "fusion", "synchro", "xyz", "link", "pendulum", "words", "legends", "final"] as const;
export type WorldId = (typeof WORLD_IDS)[number];

/** What the scripted rival does on its turn. A step that is no longer possible is skipped. */
export type RivalStep =
	| { do: "summon"; card: CardId }
	/** Attack with this monster. If the target has left the field, it attacks directly when nothing is in the way. */
	| { do: "attack"; attacker: CardId; target: CardId }
	| { do: "spell"; card: CardId; target: CardId }
	/** Every monster attacks the strongest monster it can beat, or directly when the field is empty. */
	| { do: "auto-attack" }
	/** Synchro, Xyz or Link Summon this Extra Deck monster with these monsters. */
	| { do: "extra"; card: CardId; materials: readonly CardId[] }
	/** Fusion Summon this monster with a Spell from the hand; each material comes from the field, or else the hand. */
	| { do: "fusion"; card: CardId; spell: CardId; materials: readonly CardId[] };

export type Goal =
	/** Every card of the starting hand is on the field or was used. */
	| { type: "place-all" }
	/** The rival controls no monster. */
	| { type: "destroy-all" }
	/** The rival's Life Points reach 0. */
	| { type: "win" }
	/** Judged once the rival's turns are over: Life Points not below `lp`, and none of `keep` in the Graveyard. */
	| { type: "hold"; lp: number; keep: readonly CardId[] };

export type PhaseBar = "none" | "four" | "six";

export interface Level {
	id: string;
	world: WorldId;
	/** The rule this level introduces, shown first by its demonstration. */
	teaches?: RuleId;
	/** Rules a child needs here without being told. Solving the level without a hint counts as using them. */
	uses: readonly RuleId[];
	setup: Setup;
	goal: Goal;
	/** Losing one of your monsters ends the try at once. */
	keepMonsters?: boolean;
	/** One list of steps per rival turn. */
	rival?: readonly (readonly RivalStep[])[];
	/** A whole duel: the rival keeps playing `rivalRepeat` once its turns are used up, until someone wins. */
	open?: boolean;
	rivalRepeat?: readonly RivalStep[];
	/** The last duel of the course: its certificate names the Extra Deck. */
	final?: boolean;
	bar: PhaseBar;
	/** One way to solve it, the player's moves only. Checked by the tests. */
	solution: readonly Move[];
}

const place = (card: CardId, zone = 0, extra: { tributes?: number[]; target?: number; discard?: CardId } = {}): Move => {
	return { type: "place", card, row: cardOf(card).kind === "monster" ? "monsters" : "backrow", zone, ...extra };
};
const attack = (attacker: number, target: number | "direct"): Move => ({ type: "attack", attacker, target });
const phase = (to: "standby" | "main1" | "battle" | "main2" | "end"): Move => ({ type: "phase", to });
const turn = (zone: number): Move => ({ type: "position", zone });
const draw: Move = { type: "draw" };
const spring = (zone: number, target?: number): Move => ({ type: "spring", zone, ...(target === undefined ? {} : { target }) });
const effect = (zone: number, target: number): Move => ({ type: "ability", zone, target });
const fromHand = (card: CardId): Move => ({ type: "hand", card });
const detach = (zone: number): Move => ({ type: "ability", zone });
const pass: Move = { type: "pass" };
const fromExtra = (card: CardId, ...materials: number[]): Move => ({ type: "extra", card, materials });
const inField = (card: CardId): Move => ({ type: "place", card, row: "field", zone: 0 });
const scale = (card: CardId, zone: 0 | 4): Move => ({ type: "place", card, row: "backrow", zone });
const special = (card: CardId, zone = 0): Move => ({ type: "place", card, row: "monsters", zone, special: true });
const reborn = (side: Side, index: number, zone = 0): Move => ({ type: "place", card: "monster-reborn", row: "backrow", zone, grave: { side, index } });
const onField = (zone: number): Material => ({ from: "field", zone });
const inHand = (card: CardId): Material => ({ from: "hand", card });
const ritual = (...materials: Material[]): Move => ({ type: "place", card: "black-luster-ritual", row: "backrow", zone: 0, materials });
/** Polymerization: Fusion Summon `summon` with these materials. */
const fusion = (summon: CardId, ...materials: Material[]): Move => ({ type: "place", card: "polymerization", row: "backrow", zone: 0, summon, materials });
const fuse = (...materials: Material[]): Move => fusion("flame-swordsman", ...materials);
const BLUE_EYES: readonly CardId[] = ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"];
const LIMBS = FORBIDDEN_LIMBS;
/** Ten cards for Pot of Desires to banish. */
const TEN: readonly CardId[] = ["pocket-cub", "moss-beetle", "pebble-crab", "mud-toad", "night-bat", "thorn-fox", "bramble-ram", "stone-golem", "glow-charm", "fog-snare"];
/** A turn played with the phase bar, starting in the Draw Phase. */
const strict = { strict: true, phase: "draw" } as const;
/** A "win this turn" board: Main Phase 1, the card for the turn already drawn. */
const puzzle = { strict: true, phase: "main1" } as const;
/** A "win this turn" board on the whole mat. */
const mat = { ...puzzle, full: true } as const;
/** One Exodia lesson board: the four limbs in the hand, the head on top of the Deck. */
const FIFTH_PIECE: Setup = { ...strict, full: true, you: { hand: [...LIMBS], deck: ["exodia-the-forbidden-one"] }, rival: { monsters: ["blue-eyes-white-dragon"] } };

export const LEVELS: readonly Level[] = [
	/* World 1: the three kinds of cards and their zones, then the first battles. */
	{ id: "w1-field", world: "wake", teaches: "zones", uses: [], bar: "none", goal: { type: "place-all" }, setup: { you: { hand: ["pocket-cub", "glow-charm", "sticky-vine"] } }, solution: [place("pocket-cub"), place("glow-charm"), place("sticky-vine")] },
	{ id: "w1-field-2", world: "wake", uses: ["zones"], bar: "none", goal: { type: "place-all" }, setup: { you: { hand: ["moss-beetle", "thunder-clap", "fog-snare"] }, rival: { monsters: ["mud-toad"] } }, solution: [place("moss-beetle"), place("thunder-clap", 0, { target: 0 }), place("fog-snare")] },
	{ id: "w1-clash", world: "wake", teaches: "battle", uses: [], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { monsters: ["pocket-cub", "lantern-owl"] }, rival: { monsters: ["thorn-fox"] } }, solution: [attack(1, 0)] },
	{ id: "w1-clash-2", world: "wake", uses: ["battle"], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { monsters: ["river-otter", "lantern-owl"] }, rival: { monsters: ["night-bat", "thorn-fox"] } }, solution: [attack(0, 0), attack(1, 1)] },
	{ id: "w1-tie", world: "wake", uses: ["battle"], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { monsters: ["river-otter", "lantern-owl"] }, rival: { monsters: ["bramble-ram"] } }, solution: [attack(1, 0)] },

	/* World 2: Defense Position, then Life Points and direct attacks. */
	{ id: "w2-crouch", world: "shield", teaches: "defense", uses: [], bar: "none", goal: { type: "hold", lp: 4000, keep: ["moss-beetle"] }, setup: { you: { monsters: ["moss-beetle"] }, rival: { monsters: ["iron-boar"] } }, rival: [[{ do: "attack", attacker: "iron-boar", target: "moss-beetle" }]], solution: [turn(0), phase("end")] },
	{ id: "w2-stand", world: "shield", uses: ["defense", "battle"], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { monsters: [{ card: "lantern-owl", position: "defense" }] }, rival: { monsters: ["thorn-fox"] } }, solution: [turn(0), attack(0, 0)] },
	{ id: "w2-wall", world: "shield", uses: ["defense"], bar: "none", goal: { type: "hold", lp: 4000, keep: ["pebble-crab"] }, setup: { you: { monsters: ["pebble-crab"] }, rival: { monsters: ["night-bat", "thorn-fox"] } }, rival: [[{ do: "attack", attacker: "night-bat", target: "pebble-crab" }, { do: "attack", attacker: "thorn-fox", target: "pebble-crab" }]], solution: [turn(0), phase("end")] },
	{ id: "w2-lantern", world: "shield", teaches: "direct", uses: ["battle"], bar: "none", goal: { type: "win" }, setup: { you: { monsters: ["river-otter", "lantern-owl"] }, rival: { lp: 2400, monsters: ["mud-toad"] } }, solution: [attack(0, 0), attack(1, "direct")] },
	{ id: "w2-boss", world: "shield", uses: ["battle", "defense", "direct"], bar: "none", goal: { type: "win" }, setup: { you: { monsters: ["pocket-cub", "river-otter", "lantern-owl"] }, rival: { lp: 1900, monsters: ["mud-toad", { card: "pebble-crab", position: "defense" }] } }, solution: [attack(2, 1), attack(0, 0), attack(1, "direct")] },

	/* World 3: Normal Summon, Tributes, then the phases of a turn. */
	{ id: "w3-gem", world: "friend", teaches: "summon", uses: ["battle"], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { hand: ["pocket-cub", "river-otter"] }, rival: { monsters: ["thorn-fox"] } }, solution: [place("river-otter"), attack(0, 0)] },
	{ id: "w3-tribute", world: "friend", teaches: "tribute", uses: ["summon", "battle"], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { hand: ["storm-stag"], monsters: ["pocket-cub"] }, rival: { monsters: ["iron-boar"] } }, solution: [place("storm-stag", 0, { tributes: [0] }), attack(0, 0)] },
	{ id: "w3-two", world: "friend", uses: ["tribute", "battle"], bar: "none", goal: { type: "destroy-all" }, keepMonsters: true, setup: { you: { hand: ["mountain-bison"], monsters: ["pocket-cub", "pebble-crab"] }, rival: { monsters: ["shadow-wolf"] } }, solution: [place("mountain-bison", 0, { tributes: [0, 1] }), attack(0, 0)] },
	{ id: "w3-keep", world: "friend", uses: ["tribute", "battle"], bar: "none", goal: { type: "win" }, setup: { you: { hand: ["storm-stag"], monsters: ["pocket-cub", "lantern-owl"] }, rival: { lp: 1300, monsters: ["iron-boar", "night-bat"] } }, solution: [place("storm-stag", 0, { tributes: [0] }), attack(0, 0), attack(1, 1)] },
	{ id: "w3-magician", world: "friend", uses: ["tribute", "battle"], bar: "none", goal: { type: "win" }, setup: { you: { hand: ["dark-magician"], monsters: ["pocket-cub", "pebble-crab"] }, rival: { lp: 300, monsters: ["shadow-wolf"] } }, solution: [place("dark-magician", 0, { tributes: [0, 1] }), attack(0, 0)] },
	{ id: "w3-blue-eyes", world: "friend", uses: ["tribute", "battle", "direct"], bar: "none", goal: { type: "win" }, setup: { you: { hand: ["blue-eyes-white-dragon"], monsters: ["pocket-cub", "pebble-crab", "river-otter"] }, rival: { lp: 1600, monsters: ["mountain-bison"] } }, solution: [place("blue-eyes-white-dragon", 0, { tributes: [0, 1] }), attack(0, 0), attack(2, "direct")] },
	{ id: "w3-chimes", world: "friend", teaches: "phases", uses: ["summon", "battle"], bar: "four", goal: { type: "win" }, setup: { ...strict, you: { deck: ["river-otter"] }, rival: { lp: 400, monsters: ["night-bat"] } }, solution: [draw, phase("main1"), place("river-otter"), phase("battle"), attack(0, 0)] },
	{ id: "w3-two-turns", world: "friend", uses: ["phases", "tribute", "defense"], bar: "four", goal: { type: "destroy-all" }, setup: { ...strict, you: { deck: ["pocket-cub", "storm-stag"] }, rival: { monsters: [{ card: "stone-golem", position: "defense" }] } }, rival: [[]], solution: [draw, phase("main1"), place("pocket-cub"), phase("end"), draw, phase("main1"), place("storm-stag", 0, { tributes: [0] }), phase("battle"), attack(0, 0)] },

	/* World 4: Normal Spells in the Main Phase, then Traps on the rival's turn. */
	{ id: "w4-spell", world: "magic", teaches: "spell", uses: ["phases", "direct"], bar: "four", goal: { type: "win" }, setup: { ...strict, you: { deck: ["thunder-clap"], monsters: ["river-otter"] }, rival: { lp: 1500, monsters: ["iron-boar"] } }, solution: [draw, phase("main1"), place("thunder-clap", 0, { target: 0 }), phase("battle"), attack(0, "direct")] },
	{ id: "w4-boost", world: "magic", uses: ["spell", "phases", "battle"], bar: "four", goal: { type: "win" }, setup: { ...strict, you: { deck: ["spark-dash"], monsters: ["pocket-cub"] }, rival: { lp: 300, monsters: ["thorn-fox"] } }, solution: [draw, phase("main1"), place("spark-dash", 0, { target: 0 }), phase("battle"), attack(0, 0)] },
	{ id: "w4-ambush", world: "magic", teaches: "trap", uses: ["phases"], bar: "four", goal: { type: "hold", lp: 4000, keep: ["pocket-cub"] }, setup: { ...strict, you: { deck: ["sticky-vine"], monsters: ["pocket-cub"] }, rival: { monsters: ["iron-boar"] } }, rival: [[{ do: "attack", attacker: "iron-boar", target: "pocket-cub" }]], solution: [draw, phase("main1"), place("sticky-vine"), phase("end"), spring(0)] },
	{ id: "w4-counter", world: "magic", uses: ["trap", "phases", "summon", "direct"], bar: "four", goal: { type: "win" }, setup: { ...strict, you: { deck: ["fog-snare", "pocket-cub"], monsters: ["river-otter"] }, rival: { lp: 3000, monsters: ["iron-boar"] } }, rival: [[{ do: "attack", attacker: "iron-boar", target: "river-otter" }]], solution: [draw, phase("main1"), place("fog-snare"), phase("end"), spring(0), draw, phase("main1"), place("pocket-cub", 1), phase("battle"), attack(0, "direct"), attack(1, "direct")] },

	/* World 5: "win this turn" boards. No new rule; each needs earlier rules without saying which. */
	{ id: "p1", world: "puzzles", uses: ["battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { monsters: ["pocket-cub", "lantern-owl"] }, rival: { lp: 1900, monsters: ["night-bat"] } }, solution: [phase("battle"), attack(0, 0), attack(1, "direct")] },
	{ id: "p2", world: "puzzles", uses: ["defense", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { monsters: [{ card: "lantern-owl", position: "defense" }, "pocket-cub"] }, rival: { lp: 1900, monsters: ["night-bat"] } }, solution: [turn(0), phase("battle"), attack(1, 0), attack(0, "direct")] },
	{ id: "p3", world: "puzzles", uses: ["tribute", "battle"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["storm-stag"], monsters: ["pebble-crab", "river-otter"] }, rival: { lp: 1300, monsters: ["iron-boar", "mud-toad"] } }, solution: [place("storm-stag", 0, { tributes: [0] }), phase("battle"), attack(0, 0), attack(1, 1)] },
	{ id: "p4", world: "puzzles", uses: ["spell", "summon", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["thunder-clap", "pocket-cub"], monsters: ["river-otter"] }, rival: { lp: 2700, monsters: ["shadow-wolf"] } }, solution: [place("thunder-clap", 0, { target: 0 }), place("pocket-cub", 1), phase("battle"), attack(0, "direct"), attack(1, "direct")] },
	{ id: "p5", world: "puzzles", uses: ["spell", "battle", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["spark-dash"], monsters: ["pocket-cub", "pebble-crab"] }, rival: { lp: 900, monsters: ["thorn-fox"] } }, solution: [place("spark-dash", 0, { target: 0 }), phase("battle"), attack(0, 0), attack(1, "direct")] },
	{ id: "p6", world: "puzzles", uses: ["trap", "defense"], bar: "four", goal: { type: "hold", lp: 1000, keep: ["lantern-owl"] }, setup: { ...puzzle, you: { lp: 1000, hand: ["fog-snare"], monsters: ["lantern-owl"] }, rival: { monsters: ["shadow-wolf", "thorn-fox"] } }, rival: [[{ do: "auto-attack" }]], solution: [place("fog-snare"), phase("end"), spring(0)] },
	{ id: "p7", world: "puzzles", uses: ["tribute", "defense", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["mountain-bison"], monsters: ["pocket-cub", "pebble-crab", "river-otter"] }, rival: { lp: 1500, monsters: [{ card: "stone-golem", position: "defense" }] } }, solution: [place("mountain-bison", 0, { tributes: [0, 1] }), phase("battle"), attack(0, 0), attack(2, "direct")] },
	{ id: "p8", world: "puzzles", uses: ["tribute", "spell", "battle"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["storm-stag", "thunder-clap", "spark-dash"], monsters: ["pocket-cub"] }, rival: { lp: 1100, monsters: ["shadow-wolf", "iron-boar"] } }, solution: [place("storm-stag", 0, { tributes: [0] }), place("thunder-clap", 0, { target: 0 }), place("spark-dash", 0, { target: 0 }), phase("battle"), attack(0, 1)] },
	{ id: "p9", world: "puzzles", uses: ["spell", "defense"], bar: "four", goal: { type: "hold", lp: 800, keep: ["moss-beetle"] }, setup: { ...puzzle, you: { lp: 300, hand: ["glow-charm"], monsters: ["moss-beetle"] }, rival: { monsters: ["iron-boar"] } }, rival: [[{ do: "auto-attack" }]], solution: [place("glow-charm"), turn(0), phase("end")] },
	{ id: "p10", world: "puzzles", uses: ["tribute", "spell", "defense", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["thunder-clap", "storm-stag"], monsters: [{ card: "lantern-owl", position: "defense" }, "pebble-crab"] }, rival: { lp: 2700, monsters: [{ card: "stone-golem", position: "defense" }, "thorn-fox"] } }, solution: [place("storm-stag", 1, { tributes: [1] }), place("thunder-clap", 0, { target: 0 }), turn(0), phase("battle"), attack(1, 1), attack(0, "direct")] },

	/* World 6: a two-link chain, and the six phase names. */
	{ id: "w6-tower", world: "tower", teaches: "chain", uses: ["trap"], bar: "six", goal: { type: "hold", lp: 4000, keep: ["pocket-cub"] }, setup: { strict: true, turn: "rival", you: { monsters: ["pocket-cub"], backrow: ["quick-burrow"] }, rival: { hand: ["thunder-clap"] } }, rival: [[{ do: "spell", card: "thunder-clap", target: "pocket-cub" }]], solution: [spring(0, 0)] },
	{ id: "w6-double", world: "tower", uses: ["chain", "trap", "phases"], bar: "six", goal: { type: "hold", lp: 4000, keep: ["river-otter"] }, setup: { ...strict, you: { deck: ["sticky-vine"], hand: ["quick-burrow"], monsters: ["river-otter"] }, rival: { hand: ["thunder-clap"], monsters: ["iron-boar"] } }, rival: [[{ do: "spell", card: "thunder-clap", target: "river-otter" }, { do: "attack", attacker: "iron-boar", target: "river-otter" }]], solution: [draw, phase("standby"), phase("main1"), place("quick-burrow", 0), place("sticky-vine", 1), phase("end"), spring(0, 0), spring(1)] },

	/* World 7: a whole short duel against the rival, from the first turn. */
	{
		id: "w7-duel",
		world: "rival",
		uses: ["zones", "battle", "direct", "summon", "phases", "spell", "trap"],
		bar: "six",
		goal: { type: "win" },
		open: true,
		setup: { ...strict, turnNumber: 1, you: { hand: ["river-otter", "fog-snare", "storm-stag", "spark-dash"], deck: ["pocket-cub", "thunder-clap", "lantern-owl", "pebble-crab", "moss-beetle", "glow-charm", "sticky-vine", "mountain-bison", "quick-burrow"] }, rival: { hand: ["iron-boar", "bramble-ram", "night-bat", "mud-toad", "thorn-fox"] } },
		rival: [
			[{ do: "summon", card: "iron-boar" }, { do: "auto-attack" }],
			[{ do: "summon", card: "bramble-ram" }, { do: "auto-attack" }],
			[{ do: "summon", card: "night-bat" }, { do: "auto-attack" }],
			[{ do: "summon", card: "mud-toad" }, { do: "auto-attack" }],
			[{ do: "summon", card: "thorn-fox" }, { do: "auto-attack" }],
		],
		rivalRepeat: [{ do: "auto-attack" }],
		solution: [phase("main1"), place("river-otter"), place("fog-snare"), phase("end"), spring(0), draw, phase("main1"), place("pocket-cub", 1), phase("battle"), attack(0, "direct"), attack(1, "direct"), phase("end"), draw, phase("main1"), place("thunder-clap", 0, { target: 0 }), phase("battle"), attack(0, "direct")],
	},

	/* World 8: reading real card text. Costs, targets, Quick Effects and once per turn, each in the words printed on cards. */
	{ id: "r-cost", world: "reading", teaches: "cost", uses: ["spell", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["spark-trade", "mud-toad"], monsters: ["lantern-owl"] }, rival: { lp: 1800, monsters: ["shadow-wolf"] } }, solution: [place("spark-trade", 0, { discard: "mud-toad" }), phase("battle"), attack(0, "direct")] },
	{ id: "r-paid", world: "reading", uses: ["cost", "trap", "chain", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["spark-trade", "mud-toad"], monsters: ["lantern-owl"] }, rival: { lp: 1200, monsters: ["river-otter"], backrow: ["quick-burrow"] } }, solution: [place("spark-trade", 0, { discard: "mud-toad" }), phase("battle"), attack(0, "direct")] },
	{ id: "r-target", world: "reading", teaches: "target", uses: ["spell", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["thunder-clap"], monsters: ["lantern-owl", "river-otter"] }, rival: { lp: 1500, monsters: ["shadow-wolf", "mud-toad"] } }, solution: [place("thunder-clap", 0, { target: 0 }), phase("battle"), attack(0, 1), attack(1, "direct")] },
	{ id: "r-quick", world: "reading", teaches: "quick", uses: ["battle"], bar: "four", goal: { type: "hold", lp: 4000, keep: ["river-otter"] }, setup: { strict: true, turn: "rival", you: { monsters: ["river-otter", "glint-lynx", "cinder-hedgehog"] }, rival: { monsters: ["iron-boar"] } }, rival: [[{ do: "attack", attacker: "iron-boar", target: "river-otter" }]], solution: [effect(1, 0)] },
	{ id: "r-main", world: "reading", uses: ["quick", "phases", "battle", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { monsters: ["cinder-hedgehog", "river-otter"] }, rival: { lp: 1100, monsters: ["iron-boar"] } }, solution: [effect(0, 0), phase("battle"), attack(1, 0), attack(0, "direct")] },
	{ id: "r-once", world: "reading", teaches: "once", uses: ["quick", "trap"], bar: "four", goal: { type: "hold", lp: 4000, keep: ["river-otter"] }, setup: { strict: true, turn: "rival", you: { monsters: ["river-otter", "glint-lynx"], backrow: ["sticky-vine"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] } }, rival: [[{ do: "attack", attacker: "shadow-wolf", target: "river-otter" }, { do: "attack", attacker: "iron-boar", target: "river-otter" }]], solution: [effect(1, 0), spring(0)] },
	{ id: "r-when", world: "reading", teaches: "timing", uses: ["cost", "summon", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["spark-trade", "dozy-moth", "busy-bee"] }, rival: { lp: 900, monsters: ["shadow-wolf"] } }, solution: [place("spark-trade", 0, { discard: "busy-bee" }), place("dozy-moth", 0), phase("battle"), attack(0, "direct")] },
	{ id: "r-last", world: "reading", uses: ["timing", "summon", "phases"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["dozy-moth"] }, rival: { lp: 500, monsters: ["iron-boar"] } }, rival: [[{ do: "auto-attack" }]], solution: [place("dozy-moth", 0), phase("end")] },
	{ id: "r-boss", world: "reading", uses: ["target", "quick", "once", "battle", "direct"], bar: "four", goal: { type: "win" }, setup: { ...puzzle, you: { hand: ["thunder-clap"], monsters: ["glint-lynx", "lantern-owl"] }, rival: { lp: 1500, monsters: ["shadow-wolf", "iron-boar"] } }, solution: [place("thunder-clap", 0, { target: 0 }), effect(0, 1), phase("battle"), attack(1, 1), attack(0, "direct")] },

	/* World 9: the whole mat. The Graveyard is a place you can use, the Field Zone, and banished cards. */
	{ id: "m-reborn", world: "mat", teaches: "graveyard", uses: ["spell", "target", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["monster-reborn"], graveyard: ["storm-stag"], monsters: ["river-otter"] }, rival: { lp: 1600, monsters: ["shadow-wolf"] } }, solution: [reborn("you", 0), phase("battle"), attack(1, 0), attack(0, "direct")] },
	{ id: "m-either", world: "mat", uses: ["graveyard", "target", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["monster-reborn"], graveyard: ["pocket-cub"], monsters: ["river-otter"] }, rival: { lp: 2200, graveyard: ["mountain-bison"], monsters: ["shadow-wolf"] } }, solution: [reborn("rival", 0), phase("battle"), attack(1, 0), attack(0, "direct")] },
	{ id: "m-field", world: "mat", teaches: "field", uses: ["spell", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["mountain"], monsters: ["lantern-owl", "river-otter"] }, rival: { lp: 1800, monsters: ["iron-boar"] } }, solution: [inField("mountain"), phase("battle"), attack(0, 0), attack(1, "direct")] },
	{ id: "m-both", world: "mat", uses: ["field", "battle", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["mountain"], monsters: ["lantern-owl"] }, rival: { lp: 500, field: "mountain", monsters: ["iron-boar"] } }, solution: [inField("mountain"), phase("battle"), attack(0, 0)] },
	{ id: "m-banish", world: "mat", teaches: "banish", uses: ["trap", "timing"], bar: "four", goal: { type: "hold", lp: 500, keep: [] }, setup: { full: true, strict: true, turn: "rival", you: { lp: 500, backrow: ["sakuretsu-armor", "dimensional-prison"] }, rival: { monsters: ["busy-bee"] } }, rival: [[{ do: "auto-attack" }]], solution: [spring(1)] },
	{ id: "m-desires", world: "mat", uses: ["banish", "cost", "spell", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["pot-of-desires"], deck: [...TEN, "thunder-clap", "spark-dash"], monsters: ["river-otter"] }, rival: { lp: 2000, monsters: ["iron-boar"] } }, solution: [place("pot-of-desires"), place("thunder-clap", 0, { target: 0 }), place("spark-dash", 0, { target: 0 }), phase("battle"), attack(0, "direct")] },
	{ id: "m-mat", world: "mat", uses: ["zones", "field", "graveyard", "trap"], bar: "none", goal: { type: "place-all" }, setup: { full: true, you: { hand: ["mountain", "river-otter", "sticky-vine", "monster-reborn"], graveyard: ["storm-stag"] } }, solution: [inField("mountain"), place("river-otter"), place("sticky-vine"), reborn("you", 0, 1)] },

	/* World 10: the Ritual Summon. A Spell Summons a monster from the hand; the Tributes' Levels are added up. */
	{ id: "ri-first", world: "ritual", teaches: "ritual", uses: ["spell", "tribute", "battle", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["black-luster-ritual", "black-luster-soldier"], monsters: ["storm-stag", "pebble-crab"] }, rival: { lp: 100, monsters: ["mountain-bison"] } }, solution: [ritual(onField(0), onField(1)), phase("battle"), attack(0, 0)] },
	{ id: "ri-hand", world: "ritual", uses: ["ritual", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["black-luster-ritual", "black-luster-soldier", "river-otter", "thorn-fox"], monsters: ["lantern-owl"] }, rival: { lp: 1900, monsters: ["mountain-bison"] } }, solution: [ritual(inHand("river-otter"), inHand("thorn-fox")), phase("battle"), attack(1, 0), attack(0, "direct")] },
	{ id: "ri-more", world: "ritual", uses: ["ritual", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["black-luster-ritual", "black-luster-soldier"], monsters: ["storm-stag", "pocket-cub", "lantern-owl"] }, rival: { lp: 3100, monsters: ["iron-boar"] } }, solution: [ritual(onField(0), onField(1)), phase("battle"), attack(0, 0), attack(2, "direct")] },

	/* World 11: the Extra Deck and the Fusion Summon. */
	{ id: "fu-first", world: "fusion", teaches: "fusion", uses: ["spell", "battle", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["polymerization"], monsters: ["flame-manipulator", "masaki"], extra: ["flame-swordsman"] }, rival: { lp: 100, monsters: ["iron-boar"] } }, solution: [fuse(onField(0), onField(1)), phase("battle"), attack(0, 0)] },
	{ id: "fu-hand", world: "fusion", uses: ["fusion", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["polymerization", "masaki", "thorn-fox"], monsters: ["flame-manipulator", "river-otter"], extra: ["flame-swordsman"] }, rival: { lp: 1600, monsters: ["iron-boar"] } }, solution: [fuse(inHand("masaki"), onField(0)), phase("battle"), attack(0, 0), attack(1, "direct")] },
	{ id: "fu-grave", world: "fusion", uses: ["fusion", "graveyard", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["polymerization", "monster-reborn"], monsters: ["flame-manipulator", "masaki"], extra: ["flame-swordsman"] }, rival: { lp: 1200, monsters: ["iron-boar"] } }, solution: [fuse(onField(0), onField(1)), reborn("you", 2), phase("battle"), attack(0, 0), attack(1, "direct")] },

	/* World 12: the Synchro Summon. One Tuner, and Levels that add up exactly. */
	{ id: "sy-first", world: "synchro", teaches: "synchro", uses: ["battle", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { monsters: ["tune-warrior", "giant-soldier-of-stone"], extra: ["gaia-knight"] }, rival: { lp: 400, monsters: ["shadow-wolf"] } }, solution: [fromExtra("gaia-knight", 0, 1), phase("battle"), attack(0, 0)] },
	{ id: "sy-pick", world: "synchro", uses: ["synchro", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { monsters: ["tune-warrior", "giant-soldier-of-stone", "river-otter"], extra: ["gaia-knight"] }, rival: { lp: 1900, monsters: ["shadow-wolf"] } }, solution: [fromExtra("gaia-knight", 0, 1), phase("battle"), attack(0, 0), attack(2, "direct")] },
	{ id: "sy-tuner", world: "synchro", uses: ["synchro", "summon", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["tune-warrior"], monsters: ["giant-soldier-of-stone", "pocket-cub"], extra: ["gaia-knight"] }, rival: { lp: 1700, monsters: ["shadow-wolf"] } }, solution: [place("tune-warrior", 2), fromExtra("gaia-knight", 1, 2), phase("battle"), attack(1, 0), attack(0, "direct")] },

	/* World 13: the Xyz Summon. Same Level, materials under the monster, and detaching one as a cost. */
	{ id: "xy-first", world: "xyz", teaches: "xyz", uses: ["battle", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { monsters: ["river-otter", "thorn-fox"], extra: ["gem-knight-pearl"] }, rival: { lp: 400, monsters: ["shadow-wolf"] } }, solution: [fromExtra("gem-knight-pearl", 0, 1), phase("battle"), attack(0, 0)] },
	{ id: "xy-level", world: "xyz", uses: ["xyz", "summon", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["thorn-fox"], monsters: ["pocket-cub", "river-otter"], extra: ["gem-knight-pearl"] }, rival: { lp: 1600, monsters: ["shadow-wolf"] } }, solution: [place("thorn-fox", 2), fromExtra("gem-knight-pearl", 1, 2), phase("battle"), attack(1, 0), attack(0, "direct")] },
	{ id: "xy-detach", world: "xyz", teaches: "detach", uses: ["xyz", "cost"], bar: "four", goal: { type: "hold", lp: 4000, keep: ["pocket-cub"] }, setup: { full: true, strict: true, turn: "rival", you: { monsters: [{ card: "utopia", materials: ["river-otter", "thorn-fox"] }, "pocket-cub"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] } }, rival: [[{ do: "attack", attacker: "shadow-wolf", target: "pocket-cub" }, { do: "attack", attacker: "iron-boar", target: "pocket-cub" }]], solution: [detach(0), detach(0)] },
	{ id: "xy-empty", world: "xyz", uses: ["detach", "xyz", "battle"], bar: "four", goal: { type: "hold", lp: 3000, keep: ["utopia"] }, setup: { full: true, strict: true, turn: "rival", you: { monsters: [{ card: "utopia", materials: ["river-otter"] }, "pocket-cub"] }, rival: { monsters: ["shadow-wolf", "mud-toad"] } }, rival: [[{ do: "attack", attacker: "shadow-wolf", target: "pocket-cub" }, { do: "attack", attacker: "mud-toad", target: "utopia" }]], solution: [pass, pass] },

	/* World 14: the Link Summon, without the arrows. Link Rating, the Extra Monster Zone, and no Defense Position. */
	{ id: "li-first", world: "link", teaches: "link", uses: ["battle", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { monsters: ["stone-golem", "pebble-crab"], extra: ["lanphorhynchus"] }, rival: { lp: 100, monsters: ["night-bat"] } }, solution: [fromExtra("lanphorhynchus", 0, 1), phase("battle"), attack(EXTRA_ZONE, 0)] },
	{ id: "li-keep", world: "link", uses: ["link", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { monsters: ["stone-golem", "pebble-crab", "lantern-owl"], extra: ["lanphorhynchus"] }, rival: { lp: 1900, monsters: ["night-bat"] } }, solution: [fromExtra("lanphorhynchus", 0, 1), phase("battle"), attack(EXTRA_ZONE, 0), attack(2, "direct")] },
	{ id: "li-nodef", world: "link", uses: ["link", "trap", "defense", "phases"], bar: "four", goal: { type: "hold", lp: 4000, keep: ["lanphorhynchus"] }, setup: { ...mat, you: { hand: ["sticky-vine"], emz: "lanphorhynchus" }, rival: { monsters: ["shadow-wolf"] } }, rival: [[{ do: "auto-attack" }]], solution: [place("sticky-vine"), phase("end"), spring(0)] },

	/* World 15: the Pendulum Summon, from the hand. Two Scales, and Levels between them. */
	{ id: "pe-first", world: "pendulum", teaches: "pendulum", uses: ["direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["mandragon", "flash-knight", "storm-stag", "river-otter"] }, rival: { lp: 3800 } }, solution: [scale("mandragon", 0), scale("flash-knight", 4), { type: "pendulum", cards: ["storm-stag", "river-otter"] }, phase("battle"), attack(0, "direct"), attack(1, "direct")] },
	{ id: "pe-between", world: "pendulum", uses: ["pendulum", "summon", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["mandragon", "dragong", "flash-knight", "storm-stag", "mountain-bison", "mud-toad"] }, rival: { lp: 3200, monsters: ["iron-boar"] } }, solution: [scale("mandragon", 0), scale("dragong", 4), { type: "pendulum", cards: ["flash-knight", "storm-stag"] }, place("mud-toad", 2), phase("battle"), attack(1, 0), attack(0, "direct"), attack(2, "direct")] },
	{ id: "pe-extra", world: "pendulum", uses: ["pendulum", "graveyard", "battle", "phases"], bar: "four", goal: { type: "win" }, setup: { full: true, strict: true, turn: "rival", you: { hand: ["monster-reborn"], deck: ["pocket-cub"], graveyard: ["storm-stag"], monsters: ["flash-knight"] }, rival: { lp: 100, monsters: ["shadow-wolf"] } }, rival: [[{ do: "attack", attacker: "shadow-wolf", target: "flash-knight" }]], solution: [draw, phase("main1"), reborn("you", 0), phase("battle"), attack(0, 0)] },

	/* World 16: reading real cards. The word that decides the result. */
	{ id: "rd-vortex", world: "words", uses: ["cost", "graveyard", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["lightning-vortex", "monster-reborn", "storm-stag"] }, rival: { lp: 2300, monsters: ["iron-boar", "thorn-fox"] } }, solution: [place("lightning-vortex", 0, { discard: "storm-stag" }), reborn("you", 0), phase("battle"), attack(0, "direct")] },
	{ id: "rd-fissure", world: "words", teaches: "notarget", uses: ["target", "battle", "phases"], bar: "six", goal: { type: "destroy-all" }, keepMonsters: true, setup: { ...mat, you: { hand: ["fissure"], monsters: ["river-otter"] }, rival: { monsters: ["shadow-wolf", "mud-toad"] } }, solution: [phase("battle"), attack(0, 1), phase("main2"), place("fissure")] },
	{ id: "rd-then", world: "words", teaches: "then", uses: ["spell", "target", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["upstart-goblin"], deck: ["thunder-clap"], monsters: ["lantern-owl"] }, rival: { lp: 800, monsters: ["iron-boar"] } }, solution: [place("upstart-goblin"), place("thunder-clap", 0, { target: 0 }), phase("battle"), attack(0, "direct")] },
	{ id: "rd-colon", world: "words", teaches: "condition", uses: ["summon", "battle", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["cyber-dragon", "river-otter"] }, rival: { lp: 2200, monsters: ["thorn-fox"] } }, solution: [special("cyber-dragon"), place("river-otter", 1), phase("battle"), attack(0, 0), attack(1, "direct")] },
	{ id: "rd-kuriboh", world: "words", uses: ["quick", "cost", "trap"], bar: "four", goal: { type: "hold", lp: 2000, keep: [] }, setup: { full: true, strict: true, turn: "rival", you: { lp: 2000, hand: ["kuriboh"], backrow: ["sticky-vine"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] } }, rival: [[{ do: "auto-attack" }]], solution: [spring(0), fromHand("kuriboh")] },

	/* World 17: legends of the first duels. Three dragons become one, and the five pieces of the Forbidden One. */
	{ id: "lg-ultimate", world: "legends", uses: ["fusion", "direct", "phases"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["polymerization", ...BLUE_EYES], extra: ["blue-eyes-ultimate-dragon"] }, rival: { lp: 4500 } }, solution: [fusion("blue-eyes-ultimate-dragon", ...BLUE_EYES.map(inHand)), phase("battle"), attack(0, "direct")] },
	{ id: "lg-exodia", world: "legends", teaches: "exodia", uses: ["phases"], bar: "four", goal: { type: "win" }, setup: FIFTH_PIECE, solution: [draw] },
	{ id: "lg-exodia-2", world: "legends", uses: ["exodia", "then"], bar: "four", goal: { type: "win" }, setup: { ...mat, you: { hand: ["exodia-the-forbidden-one", "right-arm-of-the-forbidden-one", "left-arm-of-the-forbidden-one", "right-leg-of-the-forbidden-one", "upstart-goblin"], deck: ["left-leg-of-the-forbidden-one"] }, rival: { monsters: ["blue-eyes-ultimate-dragon"] } }, solution: [place("upstart-goblin")] },

	/* World 18: the last duel, on the whole mat. Nox uses its Extra Deck too. */
	{
		id: "x-duel",
		world: "final",
		uses: ["trap", "synchro", "xyz", "graveyard", "battle", "direct", "phases"],
		bar: "six",
		goal: { type: "win" },
		open: true,
		final: true,
		setup: {
			full: true,
			...strict,
			turnNumber: 1,
			you: { hand: ["tune-warrior", "sticky-vine", "sakuretsu-armor", "river-otter", "giant-soldier-of-stone"], deck: ["thorn-fox", "monster-reborn", "fissure", "lantern-owl", "lightning-vortex", "pocket-cub", "storm-stag", "upstart-goblin", "moss-beetle", "pebble-crab", "glow-charm", "mountain-bison"], extra: ["gaia-knight", "gem-knight-pearl", "lanphorhynchus"] },
			rival: { hand: ["polymerization", "flame-manipulator", "masaki", "iron-boar", "bramble-ram", "thorn-fox", "night-bat", "mud-toad"], extra: ["flame-swordsman", "gem-knight-pearl"] },
		},
		rival: [
			[{ do: "fusion", card: "flame-swordsman", spell: "polymerization", materials: ["flame-manipulator", "masaki"] }, { do: "summon", card: "iron-boar" }, { do: "auto-attack" }],
			[{ do: "summon", card: "bramble-ram" }, { do: "extra", card: "gem-knight-pearl", materials: ["iron-boar", "bramble-ram"] }, { do: "auto-attack" }],
			[{ do: "summon", card: "thorn-fox" }, { do: "extra", card: "gem-knight-pearl", materials: ["bramble-ram", "thorn-fox"] }, { do: "auto-attack" }],
			[{ do: "summon", card: "night-bat" }, { do: "auto-attack" }],
			[{ do: "summon", card: "mud-toad" }, { do: "auto-attack" }],
		],
		rivalRepeat: [{ do: "auto-attack" }],
		solution: [phase("main1"), place("tune-warrior"), place("sticky-vine", 0), place("sakuretsu-armor", 1), phase("end"), spring(1), spring(0), draw, phase("main1"), place("giant-soldier-of-stone", 1), fromExtra("gaia-knight", 0, 1), phase("battle"), attack(0, 1), phase("end"), draw, phase("main1"), place("river-otter", 1), reborn("rival", 4, 2), fromExtra("gem-knight-pearl", 1, 2), phase("battle"), attack(0, 0), attack(1, "direct")],
	},
];

export const levelById = (id: string): Level | undefined => LEVELS.find((level) => level.id === id);
export const levelsOf = (world: WorldId): Level[] => LEVELS.filter((level) => level.world === world);

/** The demonstration shown before a rule is first played, and again on "Show me". Every move is made by the engine. */
export interface Demo {
	setup: Setup;
	moves: readonly Move[];
}
export const DEMOS: Record<RuleId, Demo> = {
	zones: { setup: { you: { hand: ["moss-beetle", "glow-charm", "fog-snare"] } }, moves: [place("moss-beetle", 1), place("glow-charm", 1), place("fog-snare", 1)] },
	battle: { setup: { you: { monsters: ["river-otter"] }, rival: { monsters: ["night-bat"] } }, moves: [attack(0, 0)] },
	defense: { setup: { you: { monsters: ["moss-beetle"] }, rival: { monsters: ["thorn-fox"] } }, moves: [turn(0), phase("end"), attack(0, 0)] },
	direct: { setup: { you: { monsters: ["pocket-cub", "river-otter"] }, rival: { lp: 1900, monsters: ["mud-toad"] } }, moves: [attack(0, 0), attack(1, "direct")] },
	summon: { setup: { you: { hand: ["river-otter", "pocket-cub"] } }, moves: [place("river-otter", 1)] },
	tribute: { setup: { you: { hand: ["storm-stag"], monsters: ["pebble-crab"] } }, moves: [place("storm-stag", 0, { tributes: [0] })] },
	phases: { setup: { ...strict, you: { deck: ["pocket-cub"] }, rival: { lp: 1200 } }, moves: [draw, phase("main1"), place("pocket-cub", 1), phase("battle"), attack(1, "direct")] },
	spell: { setup: { ...puzzle, you: { hand: ["thunder-clap"], monsters: ["pocket-cub"] }, rival: { lp: 1200, monsters: ["iron-boar"] } }, moves: [place("thunder-clap", 1, { target: 0 }), phase("battle"), attack(0, "direct")] },
	trap: { setup: { ...puzzle, you: { hand: ["sticky-vine"], monsters: ["pebble-crab"] }, rival: { monsters: ["thorn-fox"] } }, moves: [place("sticky-vine", 1), phase("end"), attack(0, 0), spring(1)] },
	chain: { setup: { turn: "rival", you: { monsters: ["pebble-crab"], backrow: ["quick-burrow"] }, rival: { hand: ["thunder-clap"] } }, moves: [place("thunder-clap", 0, { target: 0 }), spring(0, 0)] },
	cost: { setup: { you: { hand: ["spark-trade", "pebble-crab"] }, rival: { monsters: ["iron-boar"] } }, moves: [place("spark-trade", 1, { discard: "pebble-crab" })] },
	target: { setup: { you: { hand: ["thunder-clap"] }, rival: { monsters: ["iron-boar"], backrow: ["quick-burrow"] } }, moves: [place("thunder-clap", 1, { target: 0 }), spring(0, 0)] },
	quick: { setup: { turn: "rival", you: { monsters: ["river-otter", "glint-lynx"] }, rival: { monsters: ["iron-boar"] } }, moves: [attack(0, 0), effect(1, 0)] },
	timing: { setup: { you: { hand: ["spark-trade", "dozy-moth"] }, rival: { monsters: ["iron-boar"] } }, moves: [place("spark-trade", 1, { discard: "dozy-moth" })] },
	once: { setup: { turn: "rival", you: { monsters: ["river-otter", "glint-lynx"] }, rival: { monsters: ["iron-boar", "shadow-wolf"] } }, moves: [attack(0, 0), effect(1, 0), attack(1, 0)] },
	graveyard: { setup: { full: true, you: { hand: ["monster-reborn"], graveyard: ["storm-stag"] } }, moves: [reborn("you", 0)] },
	field: { setup: { full: true, you: { hand: ["mountain"], monsters: ["lantern-owl", "river-otter"] }, rival: { monsters: ["lantern-owl"] } }, moves: [inField("mountain")] },
	banish: { setup: { full: true, turn: "rival", you: { backrow: ["dimensional-prison"] }, rival: { monsters: ["busy-bee"] } }, moves: [attack(0, "direct"), spring(0)] },
	ritual: { setup: { full: true, you: { hand: ["black-luster-ritual", "black-luster-soldier"], monsters: ["storm-stag", "pebble-crab"] } }, moves: [ritual(onField(0), onField(1))] },
	fusion: { setup: { full: true, you: { hand: ["polymerization", "masaki"], monsters: ["flame-manipulator"], extra: ["flame-swordsman"] } }, moves: [fuse(inHand("masaki"), onField(0))] },
	synchro: { setup: { full: true, you: { monsters: ["tune-warrior", "giant-soldier-of-stone"], extra: ["gaia-knight"] } }, moves: [fromExtra("gaia-knight", 0, 1)] },
	xyz: { setup: { full: true, you: { monsters: ["river-otter", "thorn-fox"], extra: ["gem-knight-pearl"] } }, moves: [fromExtra("gem-knight-pearl", 0, 1)] },
	detach: { setup: { full: true, turn: "rival", you: { monsters: [{ card: "utopia", materials: ["river-otter", "thorn-fox"] }, "pocket-cub"] }, rival: { monsters: ["shadow-wolf"] } }, moves: [attack(0, 1), detach(0)] },
	link: { setup: { full: true, you: { monsters: ["stone-golem", "pebble-crab"], extra: ["lanphorhynchus"] } }, moves: [fromExtra("lanphorhynchus", 0, 1)] },
	pendulum: { setup: { full: true, you: { hand: ["mandragon", "flash-knight", "storm-stag", "river-otter"] } }, moves: [scale("mandragon", 0), scale("flash-knight", 4), { type: "pendulum", cards: ["storm-stag", "river-otter"] }] },
	notarget: { setup: { full: true, you: { hand: ["fissure"] }, rival: { monsters: ["shadow-wolf", "mud-toad"] } }, moves: [place("fissure")] },
	then: { setup: { full: true, you: { hand: ["upstart-goblin"], deck: ["thunder-clap"] }, rival: { lp: 800 } }, moves: [place("upstart-goblin")] },
	condition: { setup: { full: true, you: { hand: ["cyber-dragon"] }, rival: { monsters: ["thorn-fox"] } }, moves: [special("cyber-dragon")] },
	exodia: { setup: FIFTH_PIECE, moves: [draw] },
};
