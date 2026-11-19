import { effectMonster, lesson, linkMonster, normalMonster, slide, SRC } from "@/content/helpers";
import { SAMPLE } from "@/lib/sample-cards";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = SAMPLE.flameCaster;
const portal = SAMPLE.portalGuide;
const gate = linkMonster("Gate Weaver", 3, 1800, ["SW", "S", "SE"], { text: "2+ monsters", monsterType: "Cyberse / Link / Effect" });
const scout = effectMonster("Hand Scout", 3, 1000, 1000, { attribute: "WIND" });
const nova = SAMPLE.novaDragon;

export const linkSummoningLesson = lesson({
	id: "link-summoning",
	chapterId: "extra-deck",
	title: "Link Summoning",
	description: "Use monsters as Link Materials equal to a Link Rating, follow the arrows to linked zones, and remember Link Monsters have no DEF and cannot be in Defense Position.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"link-what",
			"Link Means Arrows and Rating",
			"A Link Summon uses monsters on your field as Link Materials. The number of materials must equal the Link Rating printed on the Link Monster. Arrows then point to linked zones.",
			{ template: "illustration", cards: [soldier, caster, portal], chips: [{ label: "Materials = Link Rating", tone: "green" }, { label: "Arrows point", tone: "blue" }, { label: "No DEF", tone: "red" }] },
			"Two material monsters beside Portal Guide, with chips for materials equal Link Rating, arrows point, and no DEF.",
		),
		slide(
			"link-frame",
			"Dark Blue Frame and Link Arrows",
			"Link Monsters have a dark blue frame, Link Arrows around the border, a Link Rating instead of Level or Rank, and ATK only. Their DEF box shows a dash.",
			{ template: "card-anatomy", card: portal, highlight: ["frame", "arrows", "atk", "def"], labels: [{ part: "frame", text: "Link frame" }, { part: "arrows", text: "Link Arrows" }, { part: "atk", text: "ATK only" }, { part: "def", text: "No DEF" }] },
			"Portal Guide with frame, Link Arrows, ATK and the empty DEF value highlighted.",
		),
		slide(
			"link-no-defense",
			"No Defense Position Ever",
			"Because Link Monsters have no DEF, they can never be in Defense Position or face-down Defense Position. They are always in Attack Position while on the field.",
			{ template: "comparison", headings: ["Normal monster", "Link Monster"], before: { label: "Can defend", cards: [{ ...soldier, position: "defense" }], note: "Attack or Defense", tone: "gold" }, after: { label: "Attack only", cards: [{ ...portal, position: "attack" }], note: "No Defense Position", tone: "green" }, arrowLabel: "Rule" },
			"Left: a Normal Monster in Defense Position. Right: a Link Monster that must stay in Attack Position.",
		),
		slide(
			"link-rating",
			"Link Rating Equals Materials",
			"Portal Guide is Link 2, so it needs two monsters as materials. Gate Weaver is Link 3 and needs three monsters, or combinations that total three Link Materials under its text.",
			{ template: "numeric", terms: [{ value: 1, label: "Bronze Soldier", tone: "gold" }, { value: 1, label: "Flame Caster", tone: "blue" }], op: "+", result: { value: 2, label: "Link Rating", tone: "green" }, cards: [soldier, caster, portal], footnote: "Two monsters for a Link 2." },
			"One plus one equals Link Rating 2 for Portal Guide.",
		),
		slide(
			"link-materials-field",
			"Materials Come From Your Field",
			"Link Materials must be monsters you control. Face-down monsters usually cannot be used unless a card says so. Choose materials whose count matches the Link Rating.",
			{ template: "duel-field", half: "you", highlight: [{ zone: "mm2" }, { zone: "mm3" }], cards: [{ zone: "mm2", card: soldier }, { zone: "mm3", card: caster }], callout: "Two face-up materials ready." },
			"Your field with two face-up monsters ready to be Link Materials.",
		),
		slide(
			"link-step-send",
			"Materials Go to the Graveyard",
			"When you Link Summon, the materials are sent to the Graveyard. Then the Link Monster is Special Summoned from the Extra Deck to a legal zone.",
			{ template: "sequence", step: 2, of: 3, action: "Send the Link Materials to the Graveyard.", scene: { materials: [{ ...soldier, ghost: true }, { ...caster, ghost: true }], graveyard: [soldier, caster] }, motion: "field-to-graveyard" },
			"Step two of three: both Link Materials leave the field for the Graveyard.",
		),
		slide(
			"link-step-summon",
			"Portal Guide Appears",
			"Portal Guide is Special Summoned to an Extra Monster Zone. Its Link Rating is 2 and its arrows point southwest and southeast toward your Main Monster Zones.",
			{ template: "sequence", step: 3, of: 3, action: "Special Summon Portal Guide from the Extra Deck.", scene: { result: portal, graveyard: [soldier, caster] }, motion: "materials-to-result" },
			"Step three of three: Portal Guide appears as the Link Summon result.",
		),
		slide(
			"link-arrows",
			"Reading Link Arrows",
			"Each arrow points to an adjacent zone. A monster in a pointed zone is linked to that Link Monster. Linked zones also become legal places for future Extra Deck summons.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "mm1" }, { zone: "mm2" }], cards: [{ zone: "emz-left", card: portal }], linkedZones: [{ zone: "mm1" }, { zone: "mm2" }], arrows: [{ from: { zone: "emz-left" }, to: { zone: "mm1" }, label: "SW" }, { from: { zone: "emz-left" }, to: { zone: "mm2" }, label: "SE" }], callout: "Arrows create linked zones." },
			"Portal Guide in the left Extra Monster Zone with arrows pointing to two Main Monster Zones labelled SW and SE.",
		),
		slide(
			"link-co-link",
			"Mutual Links and Co-Linking",
			"If two Link Monsters point at each other, they are co-linked. Some card effects care about that mutual link. For beginners, first learn that arrows open Extra Deck landing spots.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "mm2" }], cards: [{ zone: "emz-left", card: portal }, { zone: "mm2", card: linkMonster("Side Spur", 1, 1000, ["N"], { text: "1 monster" }) }], linkedZones: [{ zone: "mm2" }, { zone: "emz-left" }], callout: "Arrows can point at each other." },
			"Two Link Monsters that can point toward each other, illustrating a mutual link.",
		),
		slide(
			"link-extra-zones",
			"Linked Zones Unlock Extra Deck Summons",
			"After Portal Guide is out, you may Special Summon another Extra Deck monster into a Main Monster Zone it points to. That is how Link Monsters expand your Extra Deck access.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "mm2" }], cards: [{ zone: "emz-left", card: portal }, { zone: "mm2", card: nova }], linkedZones: [{ zone: "mm2" }], callout: "Nova Dragon summoned to a linked Main Monster Zone." },
			"Portal Guide pointing at a Main Monster Zone that now holds Nova Dragon summoned from the Extra Deck.",
		),
		slide(
			"link-using-links",
			"A Link Monster Can Be Material Too",
			"When used as Link Material, a Link Monster usually counts as a number of materials equal to its own Link Rating, if the new monster's text allows Link Monsters as materials.",
			{ template: "numeric", terms: [{ value: 2, label: "Portal Guide as material", tone: "green" }, { value: 1, label: "Hand Scout", tone: "gold" }], op: "+", result: { value: 3, label: "Enough for Link 3", tone: "blue" }, cards: [portal, scout, gate], footnote: "A Link 2 often counts as two materials toward a new Link Summon." },
			"Portal Guide counting as two materials plus Hand Scout equals three toward Gate Weaver.",
		),
		slide(
			"link-emz-rules",
			"Extra Monster Zones Still Matter",
			"Your first Link Monster from the Extra Deck usually lands in an Extra Monster Zone. Later Extra Deck summons can use linked Main Monster Zones instead of the second Extra Monster Zone.",
			{ template: "duel-field", highlight: [{ zone: "emz-left" }, { zone: "emz-right" }, { zone: "mm1" }, { zone: "mm2" }], cards: [{ zone: "emz-left", card: portal }], linkedZones: [{ zone: "mm1" }, { zone: "mm2" }], callout: "EMZ first, then linked Main Monster Zones." },
			"Both Extra Monster Zones highlighted along with Main Monster Zones linked by Portal Guide.",
		),
		slide(
			"link-vs-others",
			"Link Versus Other Extra Deck Methods",
			"Fusion and Synchro send materials away. Xyz overlays them. Link sends materials to the Graveyard like Synchro, but uses a rating and arrows instead of Level math.",
			{ template: "comparison", headings: ["Synchro / Fusion", "Link"], before: { label: "Levels or names", cards: [nova], note: "Level total or named materials", tone: "blue" }, after: { label: "Rating + arrows", cards: [portal], note: "Count materials; follow arrows", tone: "green" }, arrowLabel: "Different tools" },
			"Left: Synchro style Level math. Right: Link style rating and arrows.",
		),
		slide(
			"link-recap",
			"Link Summon Checklist",
			"Match the Link Rating with materials on your field, send them to the Graveyard, Special Summon to an Extra Monster Zone or linked zone, and remember: no DEF, Attack Position only.",
			{ template: "illustration", cards: [soldier, caster, portal, gate], chips: [{ label: "Rating = materials", tone: "green" }, { label: "Arrows open zones", tone: "blue" }, { label: "No Defense Position", tone: "red" }] },
			"Materials and Link Monsters with chips for rating equals materials, arrows open zones, and no Defense Position.",
		),
	],
});
