import type { CardSources } from "../coverage";
import { type Duel, effectDestruction, type Link, moveCards, other, type Side } from "../duel";
import type { CardDef } from "../effects";
import { konamiCardUrl } from "../sources";

/** The cards on a player's field (Monster, Spell & Trap and Field Zones). */
const fieldOf = (duel: Duel, side: Side): number[] => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field];
const attackPositionMonsters = (duel: Duel, side: Side): number[] => duel.piles[side].monster.filter((id) => duel.cards[id]!.face === "up" && duel.cards[id]!.position === "attack");
/** "Spells and Traps your opponent controls": every card in their Spell & Trap Zones (Pendulum Zones included) and Field Zone. */
const spellsAndTrapsOf = (duel: Duel, side: Side): number[] => [...duel.piles[side].spell, ...duel.piles[side].field];
const destroyAll = (duel: Duel, ids: readonly number[], link: Link): Duel => moveCards(duel, ids, { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) });

/**
 * "If you control no face-up cards: Activate 1 of these effects; ● Destroy all Attack Position monsters your opponent controls.
 * ● Destroy all Spells and Traps your opponent controls. You can only activate 1 "Lightning Storm" per turn." A Normal Spell.
 *
 * The effect is chosen when the card is activated, and it resolves as that effect (Konami's notes, OCG): two `modes`. Read only at
 * activation, and only YGOProJudge's answers back these (asked 2026-11-24, no source cited): a mode with nothing to destroy cannot be
 * chosen; "you control no face-up cards" is not checked again when it resolves; Pendulum Monsters in the Pendulum Zones are among the
 * Spells and Traps destroyed (the Field Spell and Set cards too, which the text says plainly).
 */
export const LIGHTNING_STORM: CardDef = {
	code: "lightning-storm",
	kind: "spell",
	facts: { name: "Lightning Storm" },
	effects: [
		{
			type: "activation",
			once: { scope: "activation" },
			condition: (duel, { player }) => fieldOf(duel, player).every((id) => duel.cards[id]!.face === "down"),
			modes: [
				{
					categories: ["destroy"],
					condition: (duel, { player }) => attackPositionMonsters(duel, other(player)).length > 0,
					operation: (duel, link) => destroyAll(duel, attackPositionMonsters(duel, other(link.player)), link),
				},
				{
					categories: ["destroy"],
					condition: (duel, { player }) => spellsAndTrapsOf(duel, other(player)).length > 0,
					operation: (duel, link) => destroyAll(duel, spellsAndTrapsOf(duel, other(link.player)), link),
				},
			],
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=14876&request_locale=ja";

export const LIGHTNING_STORM_SOURCES: CardSources = {
	code: "lightning-storm",
	cid: 14876,
	french: {
		text: "Si vous ne contrôlez aucune carte face recto : activez 1 de ces effets ;\n●Détruisez tous les monstres en Position d'Attaque contrôlés par votre adversaire.\n●Détruisez toutes les Magies et tous les Pièges contrôlés par votre adversaire.\nVous ne pouvez activer qu'1 \"Orage Foudroyant\" par tour.",
		url: konamiCardUrl(14876, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 14876,
			url: konamiCardUrl(14876, "en"),
			read: "2026-11-24",
			quote: "If you control no face-up cards: Activate 1 of these effects;\n●Destroy all Attack Position monsters your opponent controls.\n●Destroy all Spells and Traps your opponent controls.\nYou can only activate 1 \"Lightning Storm\" per turn.",
		},
		// OCG only. Konami's notes (補足情報, 2021-05-15), page read 2026-11-24; the page lists no Q&A for the card.
		{ id: "notes-mode", kind: "jp-notes", cid: 14876, url: NOTES, read: "2026-11-24", quote: "■この効果を発動する際●を１つ選択し、その●の効果として発動します。" },
	],
	effects: ["text"],
	rulings: [{ source: "notes-mode" }],
};
