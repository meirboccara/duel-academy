import { addModifier, ask, askSpecialSummon, type CardDef, destroyCard, type Duel, effectDestruction, type EffectRecord, flipFaceDown, moveCard, moveCards, negateActivationAndDestroy, negateCardEffects, targetsOf } from "../../src";
import { offered, play } from "../rules/fixtures";

/**
 * Made-up cards for the second Extra Deck batch of the Blue-Eyes list (Blue-Eyes Spirit Dragon, Blue-Eyes Tyrant Dragon, Blue-Eyes Ultimate
 * Spirit Dragon, Neo Blue-Eyes Ultimate Dragon, Psychic End Punisher, Stardust Sifr Divine Dragon, Super Starslayer TY-PHON - Sky Crisis).
 * Every code starts with `fixture-`; none is registered in CARD_DEFS or CARD_SOURCES: a test must never read one as the real card. Each says
 * what it stands for. `fixtureLog` is written by the logging operations; a test empties it before it looks.
 */
export const fixtureLog: string[] = [];
const logs =
	(text: string): EffectRecord["operation"] =>
	(duel) => (fixtureLog.push(text), duel);
const monster = (code: string, facts: NonNullable<CardDef["facts"]>, effects: readonly EffectRecord[] = [], more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts, effects, ...more });

/** Passes until the turn player holds priority in an open game state of `phase`. */
export function toPhase(duel: Duel, phase: Duel["turn"]["phase"]): Duel {
	let next = duel;
	for (let guard = 0; !(next.turn.phase === phase && next.priority.open && next.priority.holder === next.turn.player && next.priority.passed.length === 0) && guard < 200; guard++) next = play(next, "pass");
	return next;
}

/** Answers every question (a card to choose, a zone to place) with its first option and passes until the chain is empty. */
export const settle = (duel: Duel): Duel => {
	let next = duel;
	for (let guard = 0; guard < 16; guard++) {
		if (next.asking) next = play(next, offered(next).find((entry) => entry.startsWith("place") || entry.startsWith("choose"))!);
		else if (next.chain.length > 0) next = play(next, "pass");
		else break;
	}
	return next;
};

const fixtures: CardDef[] = [
		// --- Blue-Eyes Spirit Dragon: effects of cards in the GY, and what is not one ---
		// A monster whose Ignition Effect is activated in the GY ("You can banish this card from your GY; [log]" is not needed: the effect only logs).
		monster("fixture-gy-ignition", { name: "Fixture GY Ignition", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [{ type: "ignition", range: "graveyard", operation: logs("gy-ignition") }]),
		// A monster whose Quick Effect is activated in the Graveyard with itself banished as the cost ("You can banish this card from your GY; [log]").
	monster("fixture-gy-banisher", { name: "Fixture GY Banisher", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [
		{ type: "quick", range: "graveyard", cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }), operation: logs("gy-banisher") },
	]),
	// A Spell Card in the GY with a Quick Effect there (a Trap or Spell Card's effect in the GY is an effect of a card in the GY too).
		{ code: "fixture-gy-spell", kind: "spell", facts: { name: "Fixture GY Spell" }, effects: [{ type: "quick", range: "graveyard", operation: logs("gy-spell") }] },
		// A monster whose Quick Effect is activated from the hand, and one whose Ignition Effect is activated on the field.
		monster("fixture-hand-quick", { name: "Fixture Hand Quick", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [{ type: "quick", range: "hand", operation: logs("hand-quick") }]),
		monster("fixture-field-ignition", { name: "Fixture Field Ignition", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [{ type: "ignition", operation: logs("field-ignition") }]),
		monster("fixture-field-quick-a", { name: "Fixture Field Quick A", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [{ type: "quick", operation: logs("field-quick-a") }]),
		monster("fixture-field-quick-b", { name: "Fixture Field Quick B", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [{ type: "quick", operation: logs("field-quick-b") }]),
		// "When this card is sent to the GY at the end of the Damage Step ...": a mandatory Trigger Effect of the GY at "before damage calculation".
		monster("fixture-gy-effect-before", { name: "Fixture GY Effect Before", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [
			{ type: "trigger", range: "graveyard", mandatory: true, event: (_duel, event) => event.type === "damage-step" && event.step === "before", operation: logs("gy-effect-before") },
		]),
		// A Quick-Play Spell: "Special Summon 1 monster from your GY."
		{
			code: "fixture-grave-call",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].graveyard, (board, picked) => askSpecialSummon(board, link.player, picked)) }],
		},
		// --- Blue-Eyes Tyrant Dragon: Trap effects, a Spell that negates, a Special Summon from the Extra Deck ---
	// A Normal Trap: "Target 1 monster on the field; destroy it."
	{
		code: "fixture-trap-smite",
		kind: "trap",
		facts: { name: "Fixture Trap Smite" },
		effects: [
			{
				type: "activation",
				target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster],
				operation: (duel, link) => targetsOf(duel, link).reduce((next, card) => destroyCard(next, card.id, { destruction: effectDestruction(link) }), duel),
			},
		],
	},
	// A Quick-Play Spell shaped like "Forbidden Droplet": "Target 1 face-up monster on the field; until the end of this turn, its ATK is halved and its
	// effects are negated." It changes ATK, so it can be activated in the Damage Step.
	{
		code: "fixture-droplet",
		kind: "quick-play",
		facts: { name: "Fixture Droplet" },
		effects: [
			{
				type: "activation",
				categories: ["change-atk"],
				target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up"),
				operation: (duel, link) =>
					targetsOf(duel, link).reduce((next, card) => {
						const negated = negateCardEffects(next, card.id, next.turn.number, link);
						return negated === next ? next : addModifier(negated, { affects: { card: card.id, moves: card.moves }, until: next.turn.number, layer: { kind: "base", stat: "atk", to: (original) => Math.ceil(original / 2) }, by: link });
					}, duel),
			},
		],
	},
	// A Spell: "Special Summon 1 monster from your Extra Deck." (not a Fusion Summon)
	{ code: "fixture-extra-call", kind: "spell", facts: { name: "Fixture Extra Call" }, effects: [{ type: "activation", operation: (duel, link) => ask(duel, link.player, duel.piles[link.player].extra, (board, picked) => askSpecialSummon(board, link.player, picked)) }] },
	// --- Blue-Eyes Ultimate Spirit Dragon: activations on the field that it can answer, and one that cannot be negated ---
	// A Continuous Spell: its activation does nothing when it is activated (Konami's Q&A fid 24092: still "a card effect activation").
	{ code: "fixture-continuous-spell", kind: "spell", facts: { name: "Fixture Continuous Spell" }, effects: [{ type: "activation", stays: true, operation: logs("continuous-spell") }] },
	// A Normal Spell: "[log]."
	{ code: "fixture-normal-spell", kind: "spell", facts: { name: "Fixture Normal Spell" }, effects: [{ type: "activation", operation: logs("normal-spell") }] },
	// A Quick-Play Spell: "[log]. This activation cannot be negated."
	{ code: "fixture-unstoppable", kind: "quick-play", facts: { name: "Fixture Unstoppable" }, effects: [{ type: "activation", activationCannotBeNegated: true, operation: logs("unstoppable") }] },
	// A LIGHT Dragon monster in the Main Deck, and a "Blue-Eyes" one that is not LIGHT, to be Special Summoned from the Graveyard.
	monster("fixture-dark-blue-eyes-dragon", { name: "Fixture Dark Blue-Eyes Dragon", attribute: "DARK", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, normal: true, archetypes: ["Blue-Eyes"] }),
	// --- Neo Blue-Eyes Ultimate Dragon: "Blue-Eyes" Extra Deck monsters of other kinds, effects that target, a Counter Trap that destroys ---
	monster("fixture-blue-eyes-fusion", { name: "Fixture Blue-Eyes Fusion", attribute: "LIGHT", monsterType: "Dragon", level: 10, atk: 3000, def: 2500, frame: "fusion", effect: true, archetypes: ["Blue-Eyes"] }),
	monster("fixture-blue-eyes-synchro", { name: "Fixture Blue-Eyes Synchro", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, frame: "synchro", effect: true, archetypes: ["Blue-Eyes"] }, [], { procedure: { kind: "synchro" } }),
	// A 5000 ATK monster with no effect (it destroys the 4500 ATK dragon in battle).
	monster("fixture-titan", { name: "Fixture Titan", attribute: "EARTH", monsterType: "Warrior", level: 10, atk: 5000, def: 5000, normal: true }),
	// A monster: "(Quick Effect): You can target 1 monster on the field; [log]."
	monster("fixture-aimer", { name: "Fixture Aimer", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 0, def: 0, effect: true }, [
		{ type: "quick", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: logs("aimer") },
	]),
	// A Quick-Play Spell: "Target 2 monsters on the field; [log]."
	{
		code: "fixture-pair-spell",
		kind: "quick-play",
		facts: { name: "Fixture Pair Spell" },
		effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], targetCount: { min: 2, max: 2 }, operation: logs("pair-spell") }],
	},
	// A monster: "[Mandatory Trigger] Before damage calculation: [log]." (a monster effect activated in the Damage Step, as Catastor's)
	monster("fixture-catastor", { name: "Fixture Catastor", attribute: "DARK", monsterType: "Machine", level: 6, atk: 2000, def: 1500, effect: true }, [
		{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "damage-step" && event.step === "before", operation: logs("catastor") },
	]),
	// A Counter Trap: "When a monster effect is activated: Negate the activation, and if you do, destroy that card."
	{
		code: "fixture-wrath",
		kind: "counter-trap",
		facts: { name: "Fixture Wrath" },
		effects: [
			{
				type: "activation",
				condition: (duel) => duel.chain.at(-1)?.card.zone === "monster",
				operation: (duel, link) => (link.answers === null ? duel : negateActivationAndDestroy(duel, link.answers, effectDestruction(link))),
			},
		],
	},
	// --- Stardust Sifr Divine Dragon: Synchro Tuners and non-Tuners, "Stardust" monsters, a monster with a Continuous Effect and a Quick Effect ---
	monster("fixture-synchro-tuner-4", { name: "Fixture Synchro Tuner 4", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1500, def: 1500, frame: "synchro", tuner: true, effect: true }, [], { procedure: { kind: "synchro" } }),
	monster("fixture-synchro-tuner-2", { name: "Fixture Synchro Tuner 2", attribute: "LIGHT", monsterType: "Dragon", level: 2, atk: 1000, def: 1000, frame: "synchro", tuner: true, effect: true }, [], { procedure: { kind: "synchro" } }),
	monster("fixture-synchro-4", { name: "Fixture Synchro 4", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1800, def: 1500, frame: "synchro", effect: true }, [], { procedure: { kind: "synchro" } }),
	monster("fixture-synchro-4-b", { name: "Fixture Synchro 4 B", attribute: "LIGHT", monsterType: "Dragon", level: 4, atk: 1800, def: 1500, frame: "synchro", effect: true }, [], { procedure: { kind: "synchro" } }),
	monster("fixture-synchro-2", { name: "Fixture Synchro 2", attribute: "LIGHT", monsterType: "Dragon", level: 2, atk: 800, def: 800, frame: "synchro", effect: true }, [], { procedure: { kind: "synchro" } }),
	monster("fixture-synchro-6", { name: "Fixture Synchro 6", attribute: "LIGHT", monsterType: "Dragon", level: 6, atk: 2200, def: 1800, frame: "synchro", effect: true }, [], { procedure: { kind: "synchro" } }),
	// "Stardust" monsters: Level 8 and 4 (Main Deck), Level 9, a Level 8 Synchro Monster, and a Level 8 monster that is not "Stardust".
	monster("fixture-stardust-4", { name: "Fixture Stardust 4", attribute: "WIND", monsterType: "Dragon", level: 4, atk: 1600, def: 1200, effect: true, archetypes: ["Stardust"] }),
	monster("fixture-stardust-8", { name: "Fixture Stardust 8", attribute: "WIND", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, effect: true, archetypes: ["Stardust"] }),
	monster("fixture-stardust-9", { name: "Fixture Stardust 9", attribute: "WIND", monsterType: "Dragon", level: 9, atk: 2800, def: 2000, effect: true, archetypes: ["Stardust"] }),
	monster("fixture-stardust-synchro-8", { name: "Fixture Stardust Synchro 8", attribute: "WIND", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, frame: "synchro", effect: true, archetypes: ["Stardust"] }, [], { procedure: { kind: "synchro" } }),
	monster("fixture-plain-8-wind", { name: "Fixture Plain 8 Wind", attribute: "WIND", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, effect: true }),
	// A monster with a Continuous Effect ("this card gains 500 ATK") and a Quick Effect ("[log]"), to see which of its effects a negation reaches.
	monster("fixture-boss", { name: "Fixture Boss", attribute: "DARK", monsterType: "Fiend", level: 4, atk: 1000, def: 1000, effect: true }, [
		{ type: "continuous", modifies: () => [{ kind: "add", stat: "atk", by: 500 }] },
		{ type: "quick", operation: logs("boss") },
	]),
	// --- Super Starslayer TY-PHON - Sky Crisis: Level 12 monsters, monsters of 3000 or more ATK and of less, with Quick Effects ---
	monster("fixture-level-12-a", { name: "Fixture Level 12 A", attribute: "DARK", monsterType: "Fiend", level: 12, atk: 2000, def: 2000, normal: true }),
	monster("fixture-level-12-b", { name: "Fixture Level 12 B", attribute: "DARK", monsterType: "Fiend", level: 12, atk: 2500, def: 2000, normal: true }),
	monster("fixture-strong-quick", { name: "Fixture Strong Quick", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, effect: true }, [{ type: "quick", range: "field", operation: logs("strong-quick") }, { type: "ignition", range: "hand", operation: logs("strong-hand") }]),
	monster("fixture-weak-quick", { name: "Fixture Weak Quick", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 2900, def: 2500, effect: true }, [{ type: "quick", range: "field", operation: logs("weak-quick") }]),
	// "Unaffected by other monsters' effects" with a Quick Effect and 3000 ATK.
	monster("fixture-strong-immune", { name: "Fixture Strong Immune", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, effect: true }, [
		{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: (duel, by) => duel.defs[by.card.code]?.kind === "monster" }] },
		{ type: "quick", range: "field", operation: logs("strong-immune") },
	]),
	// Extra Deck monsters of other kinds: a DARK Dragon Synchro Monster, a LIGHT Dragon Fusion Monster, a LIGHT Dragon Xyz Monster.
		monster("fixture-dark-synchro-dragon", { name: "Fixture Dark Synchro Dragon", attribute: "DARK", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, frame: "synchro", effect: true }, [], { procedure: { kind: "synchro" } }),
		monster("fixture-light-fusion-dragon", { name: "Fixture Light Fusion Dragon", attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 2500, def: 2000, frame: "fusion", effect: true }),
		monster("fixture-light-xyz-dragon", { name: "Fixture Light Xyz Dragon", attribute: "LIGHT", monsterType: "Dragon", rank: 8, atk: 2500, def: 2000, frame: "xyz", effect: true }),
];

export const blueEyesExtraFixtures: Record<string, CardDef> = Object.fromEntries(fixtures.map((def) => [def.code, def]));

/** Sends the card to the Graveyard and Special Summons it back by an effect (a Special Summon from the GY). Public operations only. */
export const flipped = (duel: Duel, id: number): Duel => flipFaceDown(duel, id);
export const returnedFromBanishment = (duel: Duel, id: number): Duel => moveCard(moveCards(duel, [id], { zone: "banished" }), id, { zone: "monster", face: "up" });
