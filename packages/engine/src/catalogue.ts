/**
 * The cards the engine plays come from a catalogue the app gives it (`setCatalogue`): the engine itself knows no card.
 * This module holds the shapes cards are written in, the catalogue, and the questions the rules ask about a card.
 */

/**
 * The ids of the cards in play. A catalogue package can narrow it to its own ids by declaration merging:
 * `declare module "@duel-academy/engine" { interface CardRegistry { id: keyof typeof CARDS } }`. Otherwise any string.
 */
// biome-ignore lint/suspicious/noEmptyInterface: filled by declaration merging.
export interface CardRegistry {}
export type CardId = CardRegistry extends { id: infer K extends string } ? K : string;

/** A card's printed facts, as the rules read them: its name, Attribute, Type (or Spell/Trap icon) and text. */
export interface CardFacts {
	name: string;
	attribute?: string;
	race?: string;
	text?: string;
}
/** What the engine plays with: every card's rules, and its printed facts when the catalogue has them. */
export interface Catalogue {
	cards: Readonly<Record<string, Card>>;
	facts?: Readonly<Record<string, CardFacts>>;
	/** The five pieces of the Forbidden One, when the catalogue has them: all five in one hand win the Duel. */
	forbiddenOne?: readonly string[];
}
let active: Catalogue | null = null;
/** Gives the engine the cards it plays. Call it once, before the first duel. */
export function setCatalogue(catalogue: Catalogue): void {
	active = catalogue;
}
function catalogue(): Catalogue {
	if (!active) throw new Error("No card catalogue: call setCatalogue() first.");
	return active;
}
/** A card's printed facts, if the catalogue has them. */
export const factsOf = (id: string): CardFacts | undefined => catalogue().facts?.[id];
/** The five pieces of the Forbidden One in this catalogue. */
export const forbiddenOne = (): readonly CardId[] => (catalogue().forbiddenOne ?? []) as readonly CardId[];

/** What a card is, for the rules: the shapes every catalogue's cards are written in. */
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
	| { do: "special-self"; atkOfThat?: true; banishOnLeave?: true }
	/** "Negate that effect": the activation it answers does nothing. */
	| { do: "negate" };
/** Something that happens to other cards, or to this one in the hand, that starts an effect. */
export type Watch =
	/** "When this card is added from the Deck to your hand". */
	| { added: "self" }
	/** "When a monster you control is destroyed by battle". */
	| { destroyedByBattle: "ally" }
	/** "If a [filter] is sent to your GY (except during the Damage Step)". */
	| { sentToGy: CardFilter }
	/** "If you Special Summon [filter] (except during the Damage Step)". */
	| { specialSummoned: CardFilter }
	/** "When a card or effect is activated that targets this card on the field (Quick Effect)": used in answer. */
	| { targeted: "self" };
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
	when: "ignition" | "summoned" | "normal-summoned" | "special-summoned" | "normal-or-special-summoned" | "sent-to-gy" | Watch | readonly Watch[];
	/** "If this card is Special Summoned from the hand or Deck": where it must have come from. */
	summonedFrom?: readonly ("hand" | "deck" | "graveyard")[];
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
	cost?: "discard-self" | "banish-self" | "send-self" | "discard";
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

/** Does this card's printed text mention this card name, in quotes ("Dark Magician")? */
export const mentions = (card: CardId, name: string): boolean => !!factsOf(card)?.text?.includes(`"${name}"`);
/** "Must be Fusion Summoned and cannot be Special Summoned by other ways": never brought back from a Graveyard. */
export const fusionOnly = (card: CardId): boolean => !!factsOf(card)?.text?.includes("cannot be Special Summoned by other ways");
/** Is this card, by name, the one named: itself, or a card whose name becomes it (Dark Magician the Dragon Knight). */
export const named = (card: string, name: string): boolean => card === name || (card in catalogue().cards && cardOf(card as CardId).kind === "monster" && monsterOf(card as CardId).nameAs === name);
/** A monster's Attribute, as printed; the original cards have none. */
export const attributeOf = (id: CardId): Attribute | undefined => factsOf(id)?.attribute as Attribute | undefined;
/** The six icons of Spell and Trap Cards (Rulebook v10 p. 27). A card without an icon is a Normal Spell or Normal Trap. */
export const ICONS = ["quick-play", "continuous", "equip", "field", "ritual", "counter"] as const;
export type Icon = (typeof ICONS)[number];

export function cardOf(id: CardId): Card {
	const card = catalogue().cards[id];
	if (!card) throw new Error(`${id}: not in the card catalogue`);
	return card;
}
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
/** Extra Deck monsters: Fusion, Synchro, Xyz and Link. A Ritual Monster lives in the Main Deck. */
export function inExtraDeck(id: CardId): boolean {
	const card = cardOf(id);
	return card.kind === "monster" && !!card.frame && card.frame !== "ritual";
}
/** Level 1 to 4 needs no Tribute, Level 5 or 6 needs one, Level 7 or higher needs two. */
export function tributesFor(level: number): 0 | 1 | 2 {
	return level >= 7 ? 2 : level >= 5 ? 1 : 0;
}
