import type { SourceRecord } from "./sources";

/**
 * Step 7 (zones): the rules cited by test/rules/zones.test.ts and the card tests that use zones. Quotes copied from the pages read
 * on 2026-11-23 (docs/rules-core/step7/sources.md). RB10 and the 2021 rules update are TCG sources; the Japanese notes and Q&A are OCG only.
 */
const read = "2026-11-23";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const R2021 = "https://www.yugioh-card.com/en/play/2021_rules_update/";
const rule = (id: string, url: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url, read, quote });

export const ZONE_SOURCES: readonly SourceRecord[] = [
	// RB10 printed p. 4, Main Monster Zone and Spell & Trap Zone.
	rule("zone-five-slots", RB10, "This is where you put your monsters when they're played. You can have up to 5 cards here."),
	rule("spell-trap-five-slots", RB10, "This is where you put Spell & Trap Cards. You can have up to 5 cards here."),
	// RB10 printed p. 5, Field Zone.
	rule("field-zone-replace", RB10, "Each player can have 1 Field Spell Card on their own side of the field. To use another Field Spell, send your previous one to the Graveyard."),
	// RB10 printed p. 5, Extra Monster Zone.
	rule("extra-zone-one", RB10, "Normally, each player can only use 1 of these zones. A monster placed in this zone does not count towards the 5-monster limit of your Main Monster Zone."),
	// RB10 printed p. 13, Link Arrows.
	rule("link-arrows-co-linked", RB10, "When two Link Monsters have red arrows that point at each other, they are \"co-linked\"."),
	// RB10 printed p. 14, Link Monster bonuses: Extra Deck monsters may go to zones a Link Monster points to; revived ones to the Main Monster Zone.
	rule("linked-zones-extra-deck", RB10, "every Main Monster Zone that a Link Monster points to can also be used to Summon monsters from your Extra Deck."),
	rule("revived-extra-to-main", RB10, "Monsters that started in the Extra Deck, but later end up in the Graveyard (or are banished) and are Summoned from there, also go in the Main Monster Zones"),
	// RB10 printed p. 15, More about Link Monsters.
	rule("control-extra-zone-to-main", RB10, "If you take control of your opponent's monster in the Extra Monster Zone, it moves to your Main Monster Zone. When it goes back to your opponent, it goes to their Main Monster Zone, not the Extra Monster Zone."),
	// 2021 rules update (Konami TCG), first item: supersedes RB10 for Fusion, Synchro and Xyz Monsters.
	rule("fusion-synchro-xyz-main", R2021, "Fusion, Synchro, and Xyz Monsters can be first Summoned from the Extra Deck to any of your Main Monster Zones."),
	rule("link-pendulum-still-restricted", R2021, "The restrictions requiring an Extra Monster Zone or Link Monster pointing still apply to Link Monsters and Pendulum Monsters that are Summoned from the Extra Deck."),
	// RB10 printed p. 16-17, Pendulum Monsters.
	rule("pendulum-zones", RB10, "activate Pendulum Monster Cards as Spell Cards in your leftmost and rightmost Spell & Trap Zones. These Spell & Trap Zones also become Pendulum Zones."),
	rule("pendulum-to-extra", RB10, "would be sent to the Graveyard, place it face-up on your Extra Deck instead."),
	// RB10 printed p. 29, Equip Spell Cards.
	rule("equip-destroyed-with-monster", RB10, "If the equipped monster is destroyed, flipped face-down, or removed from the field, its Equip Cards are destroyed."),
	rule("field-zone-stays", RB10, "These cards go in your Field Zone and stay there."),
	rule("field-set-inactive", RB10, "These cards may be placed face-down in the Field Zone, but are not active until flipped face-up."),
];
