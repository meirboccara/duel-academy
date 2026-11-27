import type { DeckPlan } from "./bot";

/**
 * Step 9 combo data (docs/card-plan.md, "Combo data for the bot") for the two exact lists of the readiness manifests (src/deck-manifests.ts).
 * Plain data in the existing `DeckPlan` contract: in each plan the first line is the main line (medium), the others are the alternatives
 * (strong, expert). Every step is a name in the grammar of `actionName`; an alternative repeats the steps the main line played before the
 * interruption, so the planner's prefix rule switches to it where the interrupted line stopped. Every line was written by playing the real
 * card scripts of src/cards and is proven by test/bot/exact-deck-plans.test.ts at `decide`/`act`. These are opening-turn Main Phase 1 plans;
 * they are not a complete combo set for either deck, and nothing in the app uses them yet.
 *
 * Constraints of the planner, recorded here rather than worked around (no new planner):
 * - One plan per opening hand. Medium plays only `lines[0]`, and strong starts the first line whose first step is legal: lines for two
 *   different hands in one plan would make medium play only one hand's line, and strong start a line meant for another hand. So each deck
 *   has a list of `OpenerPlan`s; choosing the opener from the hand is the caller's job (the `hand` field is data for it: the planner does
 *   not read it). `BLUE_EYES_746021_PLAN` and `SKY_STRIKER_745443_PLAN` stay the first opener's plan.
 * - No branch predicates. A step is a name only: a line cannot say "if 3 Spells are in the GY" or "if a second copy is in the Deck". The core
 *   asks no question when there is a single candidate, so a "choose x" step exists only when the Deck/GY offers two or more cards at that
 *   point; the prerequisites below give the Deck contents each line was proven with, and a different Deck can make a step disappear (the
 *   line then stops, and strong falls through to an alternative or to the greedy search).
 * - Zones are written ("place n"): a board already holding cards in those zones stops the line at that step.
 * - Response windows are steps: where the player can answer their own move (Raye's Quick Effect, True Light), the line says "pass" or the
 *   answer it wants, else the greedy search would choose there.
 */

/** A plan for one kind of opening hand: `hand` lists the codes the opener needs in the hand (repeats for copies). */
export interface OpenerPlan {
	readonly name: string;
	readonly hand: readonly string[];
	readonly plan: DeckPlan;
}

const LODE = "primite-lordly-lode";
const MAIDEN = "maiden-of-white";
const BEWD = "blue-eyes-white-dragon";
const BERYL = "primite-dragon-ether-beryl";
const SAGE = "sage-with-eyes-of-blue";
const WISHES = "wishes-for-eyes-of-blue";
const SPIRIT = "spirit-with-eyes-of-blue";

/** Lode's activation, Beryl searched, Maiden places True Light (Spell & Trap slot 2), Lode's Summon declares Blue-Eyes White Dragon. */
const LODE_HEAD = [`activate ${LODE} #1`, `choose ${BERYL}`, `activate ${MAIDEN} #1`, "place 2", `activate ${LODE} #2 =Blue-Eyes White Dragon`];
/** Maiden revives from the GY on the dragon's Special Summon, then Maiden + the dragon make Blue-Eyes Spirit Dragon in the Extra Monster Zone. */
const MAIDEN_SPIRIT_DRAGON = [`activate ${MAIDEN} #3`, "place 1", "special-summon blue-eyes-spirit-dragon", "place 5"];

/**
 * Lode + Maiden. Prerequisites: "Primite Lordly Lode" and "Maiden of White" in the hand; in the Deck "Primite Dragon Ether Beryl", another
 * "Primite" card ("Primite Drillbeam": the search asks a choice, and Beryl Sets it), exactly one "True Light" accessible (no choice), and both
 * "Blue-Eyes White Dragon" (the Summon asks a choice); "Blue-Eyes Spirit Dragon" in the Extra Deck; an empty field, an unused Normal Summon.
 * - main: Lode adds Beryl; Maiden places True Light; Lode Special Summons a Blue-Eyes White Dragon from the Deck in Defense Position and Maiden
 *   revives; Maiden + the dragon Synchro Summon Blue-Eyes Spirit Dragon; True Light brings the dragon back from the GY; Beryl is Normal Summoned
 *   and Sets Drillbeam. Lode's restriction (no effects of Special Summoned monsters on the field this turn) leaves the Spirit Dragon's effects
 *   unused, which is why the line ends there.
 * - Ash Blossom on Lode's activation: nothing is added (Lode stays face-up), the rest runs the same without Beryl.
 * - Ash Blossom on Lode's Summon: Beryl is Normal Summoned, Sets Drillbeam, Tributes itself to send a dragon from the Deck, True Light revives
 *   it, Maiden revives, and the Spirit Dragon is still made.
 */
const BLUE_EYES_LODE_MAIDEN: OpenerPlan = {
	name: "lode-maiden",
	hand: [LODE, MAIDEN],
	plan: {
		lines: [
			{
				name: "lode, beryl, maiden, spirit dragon",
				steps: [...LODE_HEAD, `choose ${BEWD}`, "place 0", ...MAIDEN_SPIRIT_DRAGON, "activate true-light #5 :1", "place 0", `summon ${BERYL}`, `activate ${BERYL} #1`, "place 1"],
			},
			{
				name: "maiden after a negated lode",
				steps: [`activate ${LODE} #1`, `activate ${MAIDEN} #1`, "place 2", `activate ${LODE} #2 =Blue-Eyes White Dragon`, `choose ${BEWD}`, "place 0", ...MAIDEN_SPIRIT_DRAGON, "activate true-light #5 :1", "place 0"],
			},
			{
				name: "beryl after a negated lode summon",
				steps: [...LODE_HEAD, `summon ${BERYL}`, `activate ${BERYL} #1`, "place 1", `activate ${BERYL} #2`, `choose ${BEWD}`, "activate true-light #5 :1", "place 0", ...MAIDEN_SPIRIT_DRAGON],
			},
		],
	},
};

/** Wishes is banished from the GY to equip Neo Blue-Eyes Ultimate Dragon to the dragon, then Tyrant Tributes that dragon by its own procedure. */
const WISHES_TAIL = [`activate ${WISHES} #2 > ${BEWD}`, "choose neo-blue-eyes-ultimate-dragon", "place 1", "special-summon blue-eyes-tyrant-dragon"];
const WISHES_HEAD = [
	`activate ${WISHES} #1 ~ ${BEWD}`,
	`choose ${MAIDEN}`,
	"choose true-light",
	`activate ${MAIDEN} #1`,
	"place 0",
	"activate true-light #5 :1",
	"place 0",
	`activate ${MAIDEN} #3`,
	"place 1",
	...WISHES_TAIL,
	"place 0",
	`special-summon ${SPIRIT}`,
	"place 5",
	`activate ${SPIRIT} #2`,
];

/**
 * Wishes + Blue-Eyes White Dragon + Sage. Prerequisites: those three in the hand; in the Deck "Maiden of White", "Sage with Eyes of Blue" (so
 * Wishes's tuner is a choice), "True Light" and "Roar of the Blue-Eyed Dragons" (the Spell/Trap is a choice), "Blue-Eyes White Dragon" and
 * "Mausoleum of White"; in the Extra Deck "Blue-Eyes Tyrant Dragon", "Neo Blue-Eyes Ultimate Dragon", "Blue-Eyes Spirit Dragon" (the equip
 * is a choice) and "Spirit with Eyes of Blue"; an empty field.
 * - main: Wishes discards the dragon and adds Maiden + True Light; Maiden places True Light; True Light revives the dragon and Maiden revives;
 *   Wishes is banished from the GY to equip Neo Blue-Eyes Ultimate Dragon to the dragon; Blue-Eyes Tyrant Dragon is Special Summoned by its
 *   own procedure (Tributing the dragon equipped with a Fusion Monster); Maiden is the Link Material of Spirit with Eyes of Blue, which adds
 *   Mausoleum and Tributes itself to bring the dragon back from the GY. Sage stays in the hand.
 * - Droll & Lock Bird after Wishes's add: Spirit's add cannot be chosen (the core sends Mausoleum to the GY), the rest is the same.
 * - Ash Blossom on Wishes: Sage is Normal Summoned and adds Maiden (the only other Level 1 LIGHT Tuner of the Deck: no choice), Maiden places
 *   True Light from the Deck, True Light revives the discarded dragon, and the Tyrant is made the same way; Sage and Maiden stay on the field.
 */
const BLUE_EYES_WISHES_DRAGON_SAGE: OpenerPlan = {
	name: "wishes-dragon-sage",
	hand: [WISHES, BEWD, SAGE],
	plan: {
		lines: [
			{ name: "wishes, tyrant, spirit with eyes of blue", steps: [...WISHES_HEAD, "choose mausoleum-of-white", `activate ${SPIRIT} #3`, "place 1"] },
			{ name: "spirit sends mausoleum under droll", steps: [...WISHES_HEAD, `activate ${SPIRIT} #3`, "place 1"] },
			{
				name: "sage after a negated wishes",
				steps: [`activate ${WISHES} #1 ~ ${BEWD}`, `summon ${SAGE}`, `activate ${SAGE} #1`, `activate ${MAIDEN} #1`, "place 0", "activate true-light #5 :1", "place 1", `activate ${MAIDEN} #3`, "place 2", ...WISHES_TAIL, "place 1"],
			},
		],
	},
};

/**
 * Sage x2. Prerequisites: two "Sage with Eyes of Blue" in the hand; in the Deck "Maiden of White" (Sage's only other Level 1 LIGHT Tuner: no
 * choice), "True Light" and both "Blue-Eyes White Dragon" (the Summon asks a choice); "Blue-Eyes Spirit Dragon" in the Extra Deck; an empty field.
 * - main: Sage is Normal Summoned and adds Maiden; Maiden places True Light; the second Sage is discarded to send the first and Special Summon a
 *   dragon from the Deck; Maiden revives; Maiden + the dragon make Blue-Eyes Spirit Dragon; True Light brings the dragon back.
 * - Ash Blossom on Sage's search, or Infinite Impermanence on the Normal Summoned Sage (its search negated): the second Sage still Summons a
 *   dragon from the Deck; there is no Maiden, so the line ends with the dragon.
 */
const BLUE_EYES_SAGE_SAGE: OpenerPlan = {
	name: "sage-sage",
	hand: [SAGE, SAGE],
	plan: {
		lines: [
			{
				name: "sage, maiden, spirit dragon",
				steps: [`summon ${SAGE}`, `activate ${SAGE} #1`, `activate ${MAIDEN} #1`, "place 0", `activate ${SAGE} #2 > ${SAGE}`, `choose ${BEWD}`, "place 0", ...MAIDEN_SPIRIT_DRAGON, "activate true-light #5 :1", "place 0"],
			},
			{ name: "second sage after a negated search", steps: [`summon ${SAGE}`, `activate ${SAGE} #1`, `activate ${SAGE} #2 > ${SAGE}`, `choose ${BEWD}`, "place 0"] },
		],
	},
};

/**
 * Blue-Eyes 746021: one plan per opening hand (see the note at the top). Not covered yet: Deep-Eyes, Bingo Machine, Roar of the Blue-Eyed
 * Dragons (its Fusion is a later turn's), Majesty, Mausoleum's effects, Pot of Prosperity; the boss lines of Neo Blue-Eyes Ultimate Dragon
 * (only as Tyrant's equip here), Blue-Eyes Ultimate Spirit Dragon, Stardust Sifr Divine Dragon and the other Extra Deck monsters; Effect
 * Veiler and Ghost Ogre as interruptions.
 */
export const BLUE_EYES_746021_OPENERS: readonly OpenerPlan[] = [BLUE_EYES_LODE_MAIDEN, BLUE_EYES_WISHES_DRAGON_SAGE, BLUE_EYES_SAGE_SAGE];

export const BLUE_EYES_746021_PLAN: DeckPlan = BLUE_EYES_LODE_MAIDEN.plan;

const ENGAGE = "sky-striker-mobilize-engage";
const RAYE = "sky-striker-ace-raye";
const ROZE = "sky-striker-ace-roze";
const KAGARI = "sky-striker-ace-kagari";
const ZERO = "sky-striker-ace-zero";

/** Raye Tributes itself for Kagari in the Extra Monster Zone, and Kagari takes Engage back from the GY. */
const RAYE_KAGARI = [`summon ${RAYE}`, `activate ${RAYE} #1`, `choose ${KAGARI}`, "place 5", `activate ${KAGARI} #1 > ${ENGAGE}`];
/** Engage again for Roze; Kagari is the material of Shizuku; Roze Special Summons itself on that Summon; Shizuku + Roze make Zero, which adds Engage from the GY. */
const ENGAGE_ROZE_ZERO = [`activate ${ENGAGE}`, `choose ${ROZE}`, "special-summon sky-striker-ace-shizuku", "place 5", `activate ${ROZE} #1`, "place 0", `special-summon ${ZERO}`, "place 5", `activate ${ZERO} #1`, `choose ${ENGAGE}`, `activate ${ENGAGE}`];

/**
 * Engage + Raye. Prerequisites: "Sky Striker Mobilize - Engage!" and "Sky Striker Ace - Raye" in the hand; in the Deck a second Raye, "Sky
 * Striker Ace - Roze" and "Sky Striker Mecha - Widow Anchor" (each search a choice) and no second Engage (Zero's add is then the GY's Engage or
 * Widow Anchor); in the Extra Deck "Sky Striker Ace = Zero", "Kagari", "Hayate" and "Shizuku"; an empty field, fewer than 3 Spells in the GY
 * (no optional draw), an unused Normal Summon.
 * - main: Engage adds Roze; Raye is Normal Summoned and Roze Special Summons itself (the player passes on Raye's Quick Effect twice); Raye + Roze
 *   make Zero in the Extra Monster Zone; Zero adds Engage from the GY; Engage (no monster in a Main Monster Zone) adds the second Raye.
 * - Ash Blossom on Engage: Raye is Normal Summoned and Tributed for Kagari; Kagari takes Engage back; Engage adds Roze; Kagari becomes Shizuku,
 *   Roze joins on that Summon, Shizuku + Roze make Zero, Zero adds Engage, and Engage adds the second Raye.
 */
const SKY_STRIKER_ENGAGE_RAYE: OpenerPlan = {
	name: "engage-raye",
	hand: [ENGAGE, RAYE],
	plan: {
		lines: [
			{
				name: "engage, roze, zero",
				steps: [`activate ${ENGAGE}`, `choose ${ROZE}`, `summon ${RAYE}`, `activate ${ROZE} #1`, "pass", "place 1", "pass", `special-summon ${ZERO}`, "place 5", `activate ${ZERO} #1`, `choose ${ENGAGE}`, `activate ${ENGAGE}`, `choose ${RAYE}`],
			},
			{ name: "kagari after a negated engage", steps: [`activate ${ENGAGE}`, ...RAYE_KAGARI, ...ENGAGE_ROZE_ZERO, `choose ${RAYE}`] },
		],
	},
};

/**
 * Engage with no Raye in the hand. Prerequisites: "Sky Striker Mobilize - Engage!" in the hand; in the Deck "Sky Striker Ace - Raye", "Roze"
 * and "Sky Striker Mecha - Widow Anchor" and no second Engage (the last Engage then adds Widow Anchor, the only card left: no choice); the
 * Extra Deck and the field as for "engage-raye".
 * - main: Engage adds Raye; Raye is Normal Summoned and Tributed for Kagari; Kagari takes Engage back; then as the Ash Blossom line above,
 *   the last Engage adding Widow Anchor.
 * - Droll & Lock Bird after the first add (Kagari still takes Engage from the GY, but Engage cannot be activated under the lock), or Effect Veiler
 *   on Kagari's effect (Engage stays in the GY): Kagari becomes Hayate.
 */
const SKY_STRIKER_ENGAGE: OpenerPlan = {
	name: "engage",
	hand: [ENGAGE],
	plan: {
		lines: [
			{ name: "engage, raye, kagari, zero", steps: [`activate ${ENGAGE}`, `choose ${RAYE}`, ...RAYE_KAGARI, ...ENGAGE_ROZE_ZERO] },
			{ name: "hayate when engage cannot go on", steps: [`activate ${ENGAGE}`, `choose ${RAYE}`, ...RAYE_KAGARI, "special-summon sky-striker-ace-hayate", "place 5"] },
		],
	},
};

/**
 * Sky Striker 745443: one plan per opening hand (see the note at the top). Not covered yet: openers without Engage (Raye alone, Linkage,
 * Lemnisgate, the Mecha Quick-Play Spells), Zeke, Azalea, Amatsu and the Extra Deck's other monsters, Zero's Quick Effect (its one use goes to
 * the add here), the End Phase (Shizuku's add), Infinite Impermanence as an interruption.
 */
export const SKY_STRIKER_745443_OPENERS: readonly OpenerPlan[] = [SKY_STRIKER_ENGAGE_RAYE, SKY_STRIKER_ENGAGE];

export const SKY_STRIKER_745443_PLAN: DeckPlan = SKY_STRIKER_ENGAGE_RAYE.plan;
