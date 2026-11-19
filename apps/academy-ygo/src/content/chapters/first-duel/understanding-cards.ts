import type { Lesson } from "@/lib/lesson-types";
import { SAMPLE } from "@/lib/sample-cards";
import { lesson, slide, SRC } from "@/content/helpers";

export const understandingCardsLesson: Lesson = lesson({
	id: "understanding-cards",
	chapterId: "first-duel",
	title: "Understanding the Cards",
	description: "Learn to read a Monster, Spell or Trap card: name, Level, ATK, DEF and effect text.",
	sources: [SRC.rulebook, SRC.beginners],
	slides: [
		slide(
			"cards-monster-anatomy",
			"Anatomy of a Monster card",
			"Every Monster card shows its name on top, an Attribute symbol, Level stars, an artwork box, a type line, its text, and ATK and DEF numbers at the bottom.",
			{
				template: "card-anatomy",
				card: SAMPLE.bronzeSoldier,
				highlight: ["name", "attribute", "level", "art"],
				labels: [
					{ part: "name", text: "Card name" },
					{ part: "attribute", text: "Attribute" },
					{ part: "level", text: "Level stars" },
					{ part: "art", text: "Artwork" },
				],
			},
			"Bronze Soldier card with the name, Attribute, Level stars and artwork box highlighted and labelled.",
		),
		slide(
			"cards-atk-def",
			"ATK and DEF: attack and defense",
			"ATK is the monster's strength when it attacks or is attacked in Attack Position. DEF is its strength when it defends in Defense Position. Both are compared in battle.",
			{
				template: "card-anatomy",
				card: SAMPLE.bronzeSoldier,
				highlight: ["atk", "def"],
				labels: [
					{ part: "atk", text: "ATK 1500" },
					{ part: "def", text: "DEF 1200" },
				],
			},
			"Bronze Soldier card with the ATK value 1500 and the DEF value 1200 highlighted at the bottom.",
		),
		slide(
			"cards-level",
			"Level tells you the summoning cost",
			"The number of stars is the monster's Level, from 1 to 12. Levels 1 to 4 are summoned freely. Level 5 and higher need Tributes, which a later lesson explains.",
			{
				template: "card-anatomy",
				card: SAMPLE.middleTitan,
				highlight: ["level"],
				labels: [{ part: "level", text: "Level 5 = needs 1 Tribute" }],
				compare: [SAMPLE.bronzeSoldier, SAMPLE.gigantGuardian],
			},
			"Middle Titan with its five Level stars highlighted, shown beside Bronze Soldier at Level 4 and Gigant Guardian at Level 7.",
			"Do not teach Rank or Link ratings here. Mention only that Extra Deck monsters use other numbers and are covered later.",
		),
		slide(
			"cards-type-line",
			"The type line describes the monster",
			"Under the artwork, the type line lists the monster's race, such as Warrior or Spellcaster, then its card category, such as Normal or Effect. It matters for many card effects.",
			{
				template: "card-anatomy",
				card: SAMPLE.flameCaster,
				highlight: ["type"],
				labels: [{ part: "type", text: "Spellcaster / Effect" }],
			},
			"Flame Caster card with its type line, Spellcaster slash Effect, highlighted.",
		),
		slide(
			"cards-normal-vs-effect",
			"Normal monsters and Effect monsters",
			"A Normal Monster has only flavor text and no ability. An Effect Monster has written effects that change the game when they work. Effect text uses plain colons, such as Once per turn.",
			{
				template: "comparison",
				headings: ["Normal Monster", "Effect Monster"],
				before: {
					label: "Bronze Soldier",
					cards: [SAMPLE.bronzeSoldier],
					note: "Flavor text only. Wins with raw stats.",
					tone: "gold",
				},
				after: {
					label: "Flame Caster",
					cards: [SAMPLE.flameCaster],
					note: "Has an effect you can use.",
					tone: "blue",
				},
				arrowLabel: "vs",
			},
			"Left panel shows the Normal Monster Bronze Soldier with flavor text only. Right panel shows the Effect Monster Flame Caster with an activated effect.",
		),
		slide(
			"cards-spell-card",
			"Spell cards: green and powerful",
			"Spell cards have a green frame and a small icon in the corner. Most are played from your hand during your own Main Phase, do their job, then go to the Graveyard.",
			{
				template: "card-anatomy",
				card: SAMPLE.polymerization,
				highlight: ["frame", "icon", "effect"],
				labels: [
					{ part: "frame", text: "Green frame" },
					{ part: "icon", text: "Spell icon" },
					{ part: "effect", text: "Effect text" },
				],
			},
			"Combine Spell card with its green frame, subtype icon and effect text highlighted.",
		),
		slide(
			"cards-spell-subtypes",
			"Five kinds of Spell",
			"A Normal Spell is used once then discarded. Others stay: Continuous and Equip Spells remain face-up, a Field Spell goes in the Field Zone, and Quick-Play Spells are extra fast.",
			{
				template: "illustration",
				cards: [SAMPLE.polymerization, SAMPLE.swordBoost, SAMPLE.stormField, SAMPLE.quickStrike],
				chips: [
					{ label: "Normal", tone: "green" },
					{ label: "Equip", tone: "green" },
					{ label: "Field", tone: "green" },
					{ label: "Quick-Play", tone: "green" },
				],
			},
			"Four Spell cards, one per subtype: Normal, Equip, Field and Quick-Play. Continuous Spells exist too and behave like Equip cards that stay on the field.",
			"The fifth subtype, Ritual, belongs to Ritual Monsters and is taught in a later chapter.",
		),
		slide(
			"cards-trap-card",
			"Trap cards: the hidden surprise",
			"Trap cards have a purple frame. You Set them face-down in a Spell and Trap Zone, then flip them up at the right moment to stop or punish your opponent.",
			{
				template: "card-anatomy",
				card: SAMPLE.mirrorBarrier,
				highlight: ["frame", "icon", "effect"],
				labels: [
					{ part: "frame", text: "Purple frame" },
					{ part: "icon", text: "Trap icon" },
					{ part: "effect", text: "Trigger and result" },
				],
			},
			"Mirror Barrier Trap card with its purple frame, icon and effect text highlighted. The effect reads: negate the attack.",
		),
		slide(
			"cards-spell-vs-trap",
			"Spells play now, Traps wait",
			"A Spell can be played from your hand the moment you have a free Main Phase. A Trap must first be Set face-down, and cannot be activated until your opponent's next turn or later.",
			{
				template: "comparison",
				headings: ["Spell Card", "Trap Card"],
				before: {
					label: "Played from hand",
					cards: [SAMPLE.polymerization],
					note: "Activate in your Main Phase, same turn.",
					tone: "green",
				},
				after: {
					label: "Set, then wait",
					cards: [SAMPLE.mirrorBarrier],
					note: "Set this turn. Usable from the next turn.",
					tone: "purple",
				},
				arrowLabel: "timing",
			},
			"Left panel: a Spell card played straight from hand. Right panel: a Trap card that is Set and has to wait before it can be activated.",
			"Quick-Play Spells and the matching Traps have extra timing rules. Keep those for the chain chapter.",
		),
		slide(
			"cards-extra-deck-preview",
			"A first look at the Extra Deck",
			"Fusion, Synchro, Xyz and Link Monsters live in the Extra Deck, not the Main Deck. They are summoned by special methods you will study later. Do not worry about them yet.",
			{
				template: "illustration",
				cards: [SAMPLE.unityBeast, SAMPLE.novaDragon, SAMPLE.rankedRaider, SAMPLE.portalGuide],
				chips: [
					{ label: "Fusion", tone: "purple" },
					{ label: "Synchro", tone: "white" },
					{ label: "Xyz", tone: "blue" },
					{ label: "Link", tone: "green" },
				],
			},
			"Four Extra Deck monsters: Unity Beast (Fusion), Nova Dragon (Synchro), Ranked Raider (Xyz) and Portal Guide (Link).",
		),
		slide(
			"cards-read-a-card",
			"Putting it together",
			"Read a card from top to bottom: name, Attribute, Level, type line, effect text, then ATK and DEF. Flame Caster is a Level 4 Spellcaster with 1600 ATK and 800 DEF.",
			{
				template: "card-anatomy",
				card: SAMPLE.flameCaster,
				highlight: ["name", "attribute", "level", "type", "effect", "atk", "def"],
				labels: [
					{ part: "level", text: "Level 4" },
					{ part: "type", text: "Spellcaster / Effect" },
					{ part: "atk", text: "ATK 1600" },
					{ part: "def", text: "DEF 800" },
				],
			},
			"Flame Caster with every part highlighted: name, Attribute, Level 4, type line, effect text, ATK 1600 and DEF 800.",
		),
	],
});
