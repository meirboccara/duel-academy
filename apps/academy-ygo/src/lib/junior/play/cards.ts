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
	 * Phase"; `needs`: "If you control [this card]"; `foeGains`: "then your opponent gains [n] LP"; `anyFace`: the
	 * card says "1 monster", not "1 face-up monster", so a face-down monster can be targeted too.
	 */
	| { type: "destroy"; skipDraw?: true; needs?: string; foeGains?: number; anyFace?: true }
	/** Quick-Play Spell: toss a coin. Right: destroy the opponent's monsters and inflict half their combined original ATK. Wrong: destroy all monsters you control. */
	| { type: "coin-wipe" }
	/** Dark Magical Curtain: each player Special Summons 1 DARK Spellcaster from the hand or Deck; Dark Magician (Girl) brings a Spell/Trap that mentions "Dark Magician". */
	| { type: "curtain" }
	/** Special Summon 1 [card] from these places; `needs`: only while you control this card, face-up; `lock`: no other Summon that turn (a Set is allowed). */
	| { type: "call"; card: string; from: readonly ("hand" | "deck")[]; needs?: string; lock?: true }
	/** Ancient Rules: "Special Summon 1 Level 5 or higher Normal Monster from your hand." */
	| { type: "hand-summon"; minLevel: number }
	/** Inferno Fire Blast: target 1 [card] you control; inflict its original ATK; it cannot attack this turn. */
	| { type: "fire-blast"; name: string }
	/** Quick-Play, target 1 face-up monster: its original ATK is halved until the end of this turn. */
	| { type: "shrink" }
	/** Quick-Play, target 1 face-up monster: until the end of this turn it gains ATK, but its effects are negated. */
	| { type: "chalice"; amount: number }
	/** Quick-Play, target 1 face-up monster: change it to face-down Defense Position. */
	| { type: "book" }
	/** Quick-Play, target 1 face-up monster your opponent controls: change its battle position. */
	| { type: "switch" }
	/** Destroy the 1 face-up monster your opponent controls with the highest DEF (your choice, if tied). */
	| { type: "smash" }
	/** Trap, when an opponent's monster declares an attack: return all their Attack Position monsters to the hand. */
	| { type: "storm-force" }
	/** Trap, when an opponent's monster declares an attack: destroy their Attack Position monster with the highest ATK. */
	| { type: "ruin" }
	/** Trap, when the opponent Normal or Flip Summons 1 monster with this much ATK or more: destroy it. */
	| { type: "trap-hole"; minAtk: number }
	/** Trap, when the opponent Summons monsters with this much ATK or more: destroy them, and if you do, banish them. */
	| { type: "bottomless"; minAtk: number }
	/** Trap, when a monster is Summoned: destroy all monsters on the field. */
	| { type: "torrential" }
	/** Spell: add 1 monster of this kind, chosen, from your Deck to your hand. */
	| { type: "search-pick"; pool: DeckPool }
	/** Spell: "If you control no face-up monsters:" Special Summon 1 monster of this kind, chosen, from your Deck. */
	| { type: "deck-summon"; pool: DeckPool }
	/** Spell: "Inflict [n] damage to your opponent." */
	| { type: "burn"; amount: number }
	/** Spell: "Destroy all monsters on the field." */
	| { type: "wipe" }
	/** Spell or Trap: destroy every Spell and Trap your opponent controls (`foe`), or on the field (`all`). `needs`: "If you control [this card]". */
	| { type: "clear-backrow"; scope: "foe" | "all"; needs?: string }
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
	/**
	 * Spell, no target: destroy every monster your opponent controls when it resolves. `faceUp`: only the face-up ones;
	 * `needs`: "If you control [a card with this name, or whose id starts with it]"; `lockAttack`: those cannot attack this turn.
	 */
	| { type: "destroy-all"; faceUp?: true; needs?: string; lockAttack?: true }
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
	/** Spell: "Target 1 monster in either GY; Special Summon it." `dragonNormal`: only a Dragon Normal Monster in your own GY (Silver's Cry). */
	| { type: "revive"; dragonNormal?: true }
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
	| { type: "negate-attack" }
	/**
	 * Counter Trap: "When a Spell Card / a Trap Card / a monster effect is activated: negate the activation, and if you do,
	 * destroy it." Spell Speed 3: only another Counter Trap can answer it.
	 */
	| { type: "counter"; negates: "spell" | "trap" | "monster" }
	/** Infinite Impermanence: "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn)." From the hand if its owner controls no cards. */
	| { type: "impermanence" }
	/**
	 * A card written as data: what it does, step by step, from the shared vocabulary (effects.ts). `needs`: "If you
	 * control no monsters in your Main Monster Zone:".
	 */
	| { type: "data"; actions: readonly Action[]; needs?: "no-main-monsters"; conditions?: readonly Condition[] };

/** Which cards an effect looks for, as printed: "1 Level 1 LIGHT Tuner", "1 "Toon" card", "1 Field Spell". */
export interface CardFilter {
	/** Exactly this card, by id. */
	card?: string;
	/** An archetype: the card's printed name contains these words ("Blue-Eyes", "Toon", "HERO"). */
	archetype?: string;
	kind?: "monster" | "spell" | "trap";
	icon?: Icon;
	level?: number;
	attribute?: Attribute;
	tuner?: true;
	/** "Effect Monster". */
	effect?: true;
	/** "except [this card]", by id. */
	except?: string;
	/** "Normal Monster": no effect, a yellow frame. */
	normal?: true;
	/** "Level [n] or lower". */
	maxLevel?: number;
	/** "Level [n] or higher". */
	minLevel?: number;
	/** A Monster Type, as printed ("Dinosaur", "Dragon"). */
	type?: MonsterType;
	/** The frame: "a Ritual Monster". */
	frame?: Frame;
	/** Any one of these ("a "Blue-Eyes" Ritual Monster and/or "Blue-Eyes White Dragon""). */
	anyOf?: readonly CardFilter[];
}
/** The eight arrows of a Link Monster, as seen by its controller. */
export type Arrow = "top-left" | "top" | "top-right" | "left" | "right" | "bottom-left" | "bottom" | "bottom-right";
/**
 * One step of an effect, done in order. A step that chooses a card uses the effect's one chosen card (`pick`); one that
 * targets uses its one target (`target`). When a step finds nothing to do, the steps after it do not happen ("and if you do").
 */
export type Action =
	/** "Add 1 [filter] from your Deck to your hand." */
	| { do: "search"; filter: CardFilter }
	/** "Special Summon 1 [filter] from your hand / Deck / GY", with `to`: "to your zone this card points to". */
	| { do: "special"; from: readonly ("hand" | "deck" | "graveyard")[]; filter: CardFilter; to?: "pointed" }
	/** "Send 1 [filter] from your Deck to the GY." */
	| { do: "mill"; filter: CardFilter }
	/** "Target 1 [filter] you control; send it to the GY." */
	| { do: "send-target"; filter: CardFilter }
	/** "Draw [n] card(s)." */
	| { do: "draw"; count: number }
	/** "Add 1 [filter] from your GY to your hand" ("target 1 … in your GY; add it to your hand"). */
	| { do: "recover"; filter: CardFilter }
	/** "Destroy all monsters your opponent controls." */
	| { do: "destroy-foes" }
	/**
	 * "Then, if [condition], you can Special Summon 1 monster from your Deck with the same name as the Summoned monster."
	 * Done only when the condition holds; when it cannot be done, the steps after it still happen.
	 */
	| { do: "special-same"; if?: Condition }
	/**
	 * "For the rest of this turn": `special` "you cannot Special Summon, except [Types] monsters"; `direct` "you can only
	 * attack directly with [archetype] monsters".
	 */
	| { do: "lock"; special?: readonly MonsterType[]; direct?: string }
	/**
	 * "Special Summon this card" from where it is (hand or GY). `atkOfThat`: "its ATK becomes that monster's" (the card
	 * that started the effect); `banishOnLeave`: "banish it when it leaves the field".
	 */
	| { do: "special-self"; atkOfThat?: true; banishOnLeave?: true };
/** Something that happens to other cards, or to this one in the hand, that starts an effect. */
export type Watch =
	/** "When this card is added from the Deck to your hand". */
	| { added: "self" }
	/** "When a monster you control is destroyed by battle". */
	| { destroyedByBattle: "ally" }
	/** "If a [filter] is sent to your GY (except during the Damage Step)". */
	| { sentToGy: CardFilter }
	/** "If you Special Summon [filter] (except during the Damage Step)". */
	| { specialSummoned: CardFilter };
/** What must be true for an effect to be activated. */
export type Condition =
	/** "If a [filter] monster is on the field": face-up, on either side. */
	| { on: "field"; filter: CardFilter }
	/** "If your opponent controls [n] or more monsters". */
	| { foeMonsters: number }
	/** "Show 3 [card] in your hand, Deck, face-up field, and/or GY". */
	| { show: string; count: number }
	/** "During your Main Phase 2". */
	| { phase: "main2" }
	/** "If this card is in your GY because it was sent there this turn". */
	| { sentThisTurn: true };
/** A monster's effect written as data. */
export interface DataEffect {
	/**
	 * How it starts. "ignition": its owner uses it in their own Main Phase. The others start right after something
	 * happened to this card: it was Summoned (Normal or Special, or only one of them), or sent to the GY.
	 */
	when: "ignition" | "summoned" | "normal-summoned" | "special-summoned" | "normal-or-special-summoned" | "sent-to-gy" | Watch;
	/**
	 * Where the card is when the effect is used: on the field (default), in the hand, in the GY, or either of those two
	 * ("from your GY (if it was there when the monster was sent) or hand").
	 */
	from?: "field" | "hand" | "graveyard" | "hand-or-graveyard";
	/** "You can…": its owner chooses to use it. Without it, the effect happens by itself. */
	optional?: true;
	/**
	 * Paid as it is activated: "You can discard this card", "You can banish this card from your GY", "You can send this
	 * face-up card you control to the GY".
	 */
	cost?: "discard-self" | "banish-self" | "send-self";
	/** What must be true for it to be activated. */
	conditions?: readonly Condition[];
	actions: readonly Action[];
	/**
	 * "You can only use this effect of [card] once per turn" (`name`); "You can only use 1 [card] effect per turn"
	 * (`shared`); "Once per turn", for each copy (`copy`).
	 */
	once?: "name" | "shared" | "copy";
}

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
/**
 * A monster's effect used from the hand, on the opponent's turn (a "hand trap"):
 * - "no-battle-damage" (Kuriboh): discard during damage calculation; no battle damage from that battle.
 * - "ash" (Ash Blossom & Joyous Spring): discard to negate an effect that adds a card from the Deck to the hand,
 *   Special Summons from the Deck, or sends a card from the Deck to the GY. Once per turn.
 * - "veiler" (Effect Veiler): in the opponent's Main Phase, send to the GY to negate an Effect Monster until the end of the turn.
 * - "scarecrow" (Swift Scarecrow): discard on a direct attack; negate the attack, then end the Battle Phase.
 * - "fader" (Battle Fader): on a direct attack, Special Summon it from the hand, then end the Battle Phase; banished when it leaves the field.
 * - "crow" (D.D. Crow): discard to banish 1 card in the opponent's GY.
 */
export type HandEffect = "no-battle-damage" | "ash" | "veiler" | "scarecrow" | "fader" | "crow" | "ogre" | "droll";
/** The cards of the Deck an effect chooses among. */
export type DeckPool = "low-warrior" | "elemental-hero" | "low-elemental-hero";
/** Does this card of the Deck fit what an effect looks for? */
export function inPool(card: CardId, pool: DeckPool): boolean {
	const info = cardOf(card);
	if (info.kind !== "monster" || info.frame) return false;
	if (pool === "low-warrior") return info.type === "warrior" && info.level <= 4;
	return card.startsWith("elemental-hero-") && (pool === "elemental-hero" || info.level <= 4);
}
/** A Fusion Material described, not named: of this Type, of this Attribute, or whose id starts with `prefix` (an archetype). */
export interface FusionMaterial {
	type?: MonsterType;
	attribute?: Attribute;
	prefix?: string;
}
/**
 * A monster's own effect with a cost of "send 1 card from your hand to the GY" (or discard): destroy a face-up monster
 * of the opponent (`quick`: either player's turn; `weaker`: whose original ATK is lower than this card's ATK), negate
 * a Spell, or Tribute this Synchro Summoned card to Special Summon a LIGHT Dragon Synchro Monster (no cost).
 */
export type Act =
	| { kind: "destroy"; quick: boolean; oncePerTurn: boolean; weaker?: true }
	| { kind: "negate-spell" }
	| { kind: "tribute-synchro" }
	/** Time Wizard: once per turn, toss a coin. Right: destroy all monsters the opponent controls. Wrong: destroy your own, and take half their total ATK. */
	| { kind: "coin" }
	/** Blue-Eyes Alternative White Dragon: once per turn, target 1 monster your opponent controls; destroy it. This card cannot attack that turn. */
	| { kind: "destroy-free" };
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
	| { per: "small-hand"; amount: number }
	/** each Dragon monster on the field and in the Graveyards, of both players (Dark Paladin) */
	| { per: "all-dragons"; amount: number }
	/** each card of this archetype in its owner's Graveyard (Shining Flare Wingman) */
	| { per: "graveyard-prefix"; prefix: string; amount: number };
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
	/** A Link Monster's arrows: the zones it points to. */
	arrows?: readonly Arrow[];
	/**
	 * A Link Monster's materials, as printed: "2 monsters" (2 to 2), "2+ monsters" (2 or more), "1 Normal Monster".
	 * A Link Monster used as material counts as 1 or as its Link Rating. Missing: as many monsters as its rating.
	 */
	linkMaterials?: { min: number; max?: number; filter?: CardFilter };
	/** A Pendulum Monster: its Pendulum Scale. */
	scale?: number;
	/** Fusion Monster: its materials, by name, or described ("1 Dragon monster", "1 WIND monster", "1 Elemental HERO monster"). */
	fusion?: readonly (string | FusionMaterial)[];
	/** Xyz Monster: "2 Level 4 monsters". */
	xyz?: { level: number; count: number };
	/**
	 * Special Summoned from the hand by its own text. "alone": "If only your opponent controls a monster". `reveal`:
	 * "by revealing [card] in your hand", once per turn. No Chain.
	 */
	special?: "alone" | { reveal: string };
	/** "Cannot be Normal Summoned/Set." */
	noNormal?: true;
	/** Rocket Warrior: during its controller's Battle Phase it is not destroyed by battle and its controller takes no battle damage from its battles; a monster it attacks loses ATK until the end of the turn. */
	rocket?: { weaken: number };
	/** Magician's Valkyria: the opponent's monsters cannot attack other face-up monsters of this Type. */
	shields?: MonsterType;
	/** "(Quick Effect): You can discard this card; you take no battle damage from that battle." Used from the hand. */
	hand?: HandEffect;
	/** Magician's Rod: "When this card is Normal Summoned: You can add 1 Spell/Trap from your Deck to your hand, that specifically lists the card [name] in its text." */
	summonSearch?: string;
	/** Blazeman: "If this card is Normal or Special Summoned: You can add 1 [card] from your Deck to your hand." */
	summonAdd?: string;
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
	battleImmune?: { fromAtk?: number; perTurn?: number; always?: true };
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
	/** A Synchro Monster whose non-Tuners must be of an archetype (id prefix): "1 or more non-Tuner [Blue-Eyes] monsters". */
	synchroNonTuner?: string;
	/** "This card's name becomes [card] while on the field or in the GY." */
	nameAs?: string;
	/** Dark Magician the Dragon Knight: the opponent cannot destroy the Spells and Traps its controller controls. */
	guardsBackrow?: true;
	/** Its own effect, paid with a card from the hand, or by Tributing it. */
	act?: Act;
	/** Twin Burst: "This card can make up to 2 attacks on monsters": a second attack is never a direct one. */
	monstersOnly?: true;
	/** Twin Burst: "At the end of the Damage Step, when this card attacks an opponent's monster, but the opponent's monster was not destroyed: banish it." */
	banishSurvivor?: true;
	/** Nova Master: "If this card destroys an opponent's monster by battle: Draw 1 card." */
	battleDraw?: true;
	/** Great Tornado: "If this card is Fusion Summoned: Halve the ATK and DEF of all face-up monsters your opponent currently controls." */
	onFusion?: "halve-foes" | "gaia";
	/** Rampart Blaster: "can attack while in face-up Defense Position, but only if your opponent controls no monsters", its ATK halved. */
	defenseAttack?: true;
	/** Its effects written as data (effects.ts), in the order they are printed. */
	effects?: readonly DataEffect[];
	/** "(This card is always treated as a "Blue-Eyes" card.)" */
	treatedAs?: string;
	/** Blue-Eyes Spirit Dragon: "Neither player can Special Summon 2 or more monsters at the same time." */
	oneAtATime?: true;
	/** Blue-Eyes Spirit Dragon: "Once per turn, when an effect of a card in the Graveyard is activated: You can negate the activation" (the opponent's). */
	negatesGraveyard?: true;
}
export type Cost =
	/**
	 * "Discard 1 card;": paid when the card is activated, before anything else happens. `level`: "Discard 1 Level 8
	 * monster". `monster`: "Send 1 monster from your hand to the GY".
	 */
	| { type: "discard"; level?: number; monster?: true }
	/** "Pay half your LP;" */
	| { type: "half-lp" }
	/** "Banish 10 cards from the top of your Deck, face-down;" */
	| { type: "banish-deck"; count: number }
	/** "Pay [n] LP;" */
	| { type: "pay-lp"; amount: number };
export interface EffectCard {
	kind: "spell" | "trap";
	effect: Effect;
	cost?: Cost;
	/** The icon beside "SPELL" or "TRAP": none for a Normal card. A Field Spell goes to the Field Zone and stays. */
	icon?: Icon;
	/** "You can only activate 1 [this card] per turn." */
	onePerTurn?: true;
	/** Its effects written as data that work outside its activation: from the GY (The Guiding Flute of Summoning Dragons). */
	effects?: readonly DataEffect[];
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
/** Does this card's printed text mention this card name, in quotes ("Dark Magician")? */
export const mentions = (card: CardId, name: string): boolean => !!CARD_ART[card]?.text?.includes(`"${name}"`);
/** "Must be Fusion Summoned and cannot be Special Summoned by other ways": never brought back from a Graveyard. */
export const fusionOnly = (card: CardId): boolean => !!CARD_ART[card]?.text?.includes("cannot be Special Summoned by other ways");
/** Is this card, by name, the one named: itself, or a card whose name becomes it (Dark Magician the Dragon Knight). */
export const named = (card: string, name: string): boolean => card === name || (card in CARDS && cardOf(card as CardId).kind === "monster" && monsterOf(card as CardId).nameAs === name);
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
	/* Cards written as data (effects.ts): their effects need no code of their own. */
	/* MAMS (Magnificent Maestros, TCG 2026-11-12). Kaibaman the Legend is a reprint there. */
	"kaibaman-the-legend": real("kaibaman-the-legend", {
		tuner: true,
		effects: [
			{ when: "normal-or-special-summoned", optional: true, once: "name", conditions: [{ show: "blue-eyes-white-dragon", count: 3 }], actions: [{ do: "special", from: ["hand", "deck", "graveyard"], filter: { card: "blue-eyes-white-dragon" } }] },
			{ when: { specialSummoned: { card: "blue-eyes-white-dragon" } }, from: "graveyard", optional: true, cost: "banish-self", once: "name", actions: [{ do: "search", filter: { kind: "monster", archetype: "Blue-Eyes" } }] },
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

export type CardId = keyof typeof CARDS;
export const CARD_IDS = Object.keys(CARDS) as CardId[];
/** Every card with its printed Type filled in where the hand-written data leaves it out (the course's first real monsters). */
const PRINTED: Record<string, Card> = Object.fromEntries(
	Object.entries(CARDS as Record<string, Card>).map(([id, card]) => {
		const entry = CARD_ART[id];
		const type = card.kind === "monster" && !card.type && entry?.kind === "monster" ? asType(entry.race) : undefined;
		return [id, type ? { ...card, type } : card];
	}),
);
export const cardOf = (id: CardId): Card => PRINTED[id] as Card;
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
	const type = info.effect.type;
	if (type === "boost" || type === "equip" || type === "fire-blast") return "own";
	return type === "destroy" || type === "shrink" || type === "chalice" || type === "book" || type === "switch" ? "foe" : null;
}
/** An Effect Monster: a monster with an effect of its own (not a monster that only names its materials). */
export function isEffectMonster(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind === "monster" && hasRulesText(id) && !!Object.keys(card).some((key) => !["kind", "level", "atk", "def", "art", "type", "frame", "tuner", "rank", "link", "arrows", "linkMaterials", "treatedAs", "scale", "fusion", "xyz", "synchroTuner", "synchroNonTuner"].includes(key));
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
	return card.kind !== "monster" || !!(card.ability || card.trigger || card.frame || card.special || card.hand || card.wins || card.detach || card.gains || card.direct || card.pierce || card.attacks || card.noTraps || card.battleImmune || card.noBattleDamage || card.attackBonus || card.standby || card.battleBurn || card.summonRevive || card.act || card.nameAs || card.defenseAttack || card.rocket || card.shields || card.noNormal || card.summonSearch || card.summonAdd || card.effects?.length);
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
