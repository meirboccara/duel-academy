import { effectMonster, facedown, lesson, normalMonster, slide, spell, trap, SRC } from "@/content/helpers";

const soldier = normalMonster("Bronze Soldier", 4, 1500, 1200);
const caster = effectMonster("Flame Caster", 4, 1600, 800, { attribute: "FIRE" });
const recycler = effectMonster("Grave Recycler", 4, 1300, 1100, { attribute: "DARK", text: "Special Summon this card from your GY." });
const exile = spell("Exile Bolt", "normal", { text: "Banish 1 card from your opponent's GY." });
const mirror = trap("Mirror Barrier", "normal");
const combine = spell("Combine Spell", "normal");

export const graveyardBanishedLesson = lesson({
	id: "graveyard-banished",
	chapterId: "spells-and-traps",
	title: "The Graveyard and Banished Cards",
	description: "Learn where cards go when they leave the field, how the Graveyard fuels strategies, and why banished cards are harder to reach.",
	sources: [SRC.rulebook, SRC.rulesFaq],
	slides: [
		slide(
			"what-is-gy",
			"The Graveyard Is a Public Pile",
			"When most cards are destroyed, discarded or finished resolving, they go to the Graveyard. Both players can look through either Graveyard at any time. Order does not matter for play.",
			{ template: "duel-field", highlight: [{ zone: "graveyard" }], cards: [{ zone: "graveyard", card: soldier }, { zone: "mm2", card: caster }], callout: "Graveyard: public knowledge." },
			"The duel field with the Graveyard zone highlighted and Bronze Soldier resting there.",
		),
		slide(
			"how-cards-reach-gy",
			"How Cards Reach the Graveyard",
			"Common paths include destruction, discarding from the hand, tributing, resolving a Normal Spell or Trap, and sending cards as cost or for a Fusion material.",
			{ template: "sequence", step: 2, of: 2, action: "Destroyed Flame Caster is sent from the field to the Graveyard.", scene: { monsters: [null, null, null, null, null], graveyard: [caster, combine] }, motion: "field-to-graveyard" },
			"Step two of two: Flame Caster leaves the Monster Zone and joins Combine Spell in the Graveyard.",
		),
		slide(
			"gy-is-not-gone",
			"The Graveyard Is Still in the Game",
			"Cards in the Graveyard can be revived, banished for cost, or trigger effects when they arrive. Many modern decks treat the Graveyard as a second hand.",
			{ template: "illustration", cards: [recycler, caster, soldier], chips: [{ label: "Revive", tone: "green" }, { label: "Banish for cost", tone: "red" }, { label: "Trigger on arrival", tone: "blue" }] },
			"Three Graveyard cards with chips: revive, banish for cost, and trigger on arrival.",
		),
		slide(
			"revive-from-gy",
			"Special Summoning From the Graveyard",
			"Effects can Special Summon monsters from the Graveyard back to the field. Watch for restrictions: some monsters must have been properly Summoned first.",
			{ template: "sequence", step: 1, of: 2, action: "Activate an effect that Special Summons Grave Recycler from the GY.", scene: { graveyard: [recycler, soldier], monsters: [null, null, null, null, null] }, motion: "hand-to-field" },
			"Step one of two: Grave Recycler sits in the Graveyard ready to be Special Summoned.",
		),
		slide(
			"what-is-banished",
			"Banished Means Set Aside",
			"Banished cards leave the field, hand, Deck or Graveyard and sit in a separate public area. They are not in the Graveyard. Getting them back usually needs a specific effect.",
			{ template: "duel-field", highlight: [{ zone: "banished" }], cards: [{ zone: "banished", card: caster }, { zone: "graveyard", card: soldier }], callout: "Banished is a different zone from the Graveyard." },
			"The field with the Banished zone highlighted holding Flame Caster, while Bronze Soldier remains in the Graveyard.",
		),
		slide(
			"banish-vs-destroy",
			"Banish Versus Destroy",
			"Destroy sends a card to the Graveyard. Banish removes it from play into the Banished zone. Cards that protect only against destruction do not stop banishing.",
			{ template: "comparison", headings: ["Destroy", "Banish"], before: { label: "To Graveyard", cards: [soldier], note: "Can often be revived", tone: "blue" }, after: { label: "To Banished", cards: [{ ...caster, ghost: true }], note: "Harder to recover", tone: "red" }, arrowLabel: "Different destinations" },
			"Left: a destroyed monster in the Graveyard. Right: a banished monster set aside and harder to recover.",
		),
		slide(
			"banish-from-gy",
			"Banishing From the Graveyard",
			"Many costs banish a card from the Graveyard. Exile Bolt can also banish an opponent's Graveyard card so they cannot revive it. Face-up banished cards stay public.",
			{ template: "sequence", step: 2, of: 2, action: "Exile Bolt banishes a card from the opponent's Graveyard.", scene: { spellTraps: [exile, null, null, null, null], graveyard: [mirror], extra: [{ label: "Banished", cards: [caster] }] }, motion: "to-banished" },
			"Exile Bolt resolves and Flame Caster moves from the Graveyard into the Banished area.",
		),
		slide(
			"face-down-banish",
			"Face-Down Banished Cards",
			"Some effects banish cards face-down. Face-down banished cards are private: usually neither player may look at them. They are even harder to interact with than face-up banished cards.",
			{ template: "illustration", cards: [facedown(soldier, "facedown-defense"), caster], chips: [{ label: "Face-down: private", tone: "red" }, { label: "Face-up: public", tone: "green" }] },
			"A face-down banished card beside a face-up banished card, with chips for private versus public.",
		),
		slide(
			"returning-cards",
			"Bringing Cards Back",
			"From the Graveyard you often Special Summon or add to hand. From banished, you need effects that specifically return banished cards. Always read which zone the text names.",
			{ template: "comparison", headings: ["From Graveyard", "From Banished"], before: { label: "Common", cards: [recycler], note: "Many revive effects", tone: "green" }, after: { label: "Rarer", cards: [caster], note: "Needs banished-specific text", tone: "purple" }, arrowLabel: "Check the zone" },
			"Left: recovering from the Graveyard is common. Right: recovering from banished needs specific text.",
		),
		slide(
			"gy-banish-summary",
			"Graveyard and Banished at a Glance",
			"Graveyard is the default resting place and a fuel tank for effects. Banished is the harder exile. Know which zone a card occupies before you plan to reuse it.",
			{ template: "duel-field", highlight: [{ zone: "graveyard" }, { zone: "banished" }], cards: [{ zone: "graveyard", card: soldier }, { zone: "banished", card: caster }, { zone: "mm1", card: recycler }], callout: "Two different out-of-play zones." },
			"Field highlighting both the Graveyard and Banished zones, each holding a different card, with Grave Recycler on the field.",
		),
	],
});
