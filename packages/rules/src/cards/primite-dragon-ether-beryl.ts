import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo } from "../identity";
import { askSetByEffect, canSetByEffect } from "../set";
import { tribute } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Primite Dragon Ether Beryl";
const PRIMITE = "Primite";

const isNormalMonster = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.normal === true;

/** The "Primite" Spells and Traps of the player's Deck that can be Set now. */
const toSet = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => belongsTo(duel, id, PRIMITE) && canSetByEffect(duel, player, id));

/** The Normal Monsters of the player's Deck. */
const normalsInDeck = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => isNormalMonster(duel, id));

/** "A Normal Monster in your field or GY": face-up in the Monster Zone, or in the Graveyard (Konami's notes). */
const hasNormalMonster = (duel: Duel, player: Side): boolean => [...duel.piles[player].monster.filter((id) => duel.cards[id]!.face === "up"), ...duel.piles[player].graveyard].some((id) => isNormalMonster(duel, id));

/**
 * "If this card is Normal Summoned: You can Set 1 "Primite" Spell/Trap from your Deck. You can only use each of the following effects of
 * "Primite Dragon Ether Beryl" once per turn. You can Tribute this card; send 1 Normal Monster from your Deck to the GY. During your Standby
 * Phase, if you have a Normal Monster in your field or GY: You can add this card from the GY to your hand." An EARTH Dragon Effect Monster.
 *
 * - First effect: an optional "if" Trigger Effect of the Monster Zone (Konami's notes, OCG), on its own Normal Summon (not a Special Summon,
 *   not a Flip Summon). No limit of its own: the printed limit sits after it and names "the following effects". The card is chosen when it
 *   resolves; it is activated only while a "Primite" Spell/Trap can be Set (the core's reading of "cannot activate when it cannot be done",
 *   by analogy with `search-needs-a-card`; no Konami page read). The Set card cannot be activated this turn if it is a Trap or Quick-Play Spell.
 * - Second effect: an Ignition Effect of the Monster Zone (notes), the Tribute of itself being the cost; once per turn by name. Activated only
 *   while a Normal Monster is in the Deck (the core's reading); the monster is chosen when it resolves.
 * - Third effect: a Trigger Effect of the Graveyard (notes), once per turn by name, offered when the controller's Standby Phase begins, if a
 *   Normal Monster is face-up in their Monster Zone or in their Graveyard (notes). The core offers it only once, at the start of the phase
 *   (limit L2 of docs/rules-core/blue-eyes-gaps.md): it cannot be activated later in the same Standby Phase.
 * - "Primite" is read from `facts.archetypes`: the name's own archetype, which no Konami page lists; another card of the list says "Primite"
 *   cards "except Primite Drillbeam"/"except Primite Lordly Lode", the card's wording being the only evidence.
 */
export const PRIMITE_DRAGON_ETHER_BERYL: CardDef = {
	code: "primite-dragon-ether-beryl",
	kind: "monster",
	facts: { name: NAME, attribute: "EARTH", monsterType: "Dragon", level: 4, atk: 1600, def: 0, archetypes: [PRIMITE], mentions: [NAME] },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["set-from-deck"],
			condition: (duel, { player }) => toSet(duel, player).length > 0,
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "normal" && event.card.id === card.id,
			operation: (duel, link) => ask(duel, link.player, toSet(duel, link.player), (board, picked) => askSetByEffect(board, link.player, picked, { effect: link })),
		},
		{
			type: "ignition",
			categories: ["send-from-deck"],
			once: { scope: "name", key: "primite-dragon-ether-beryl-tribute" },
			condition: (duel, { player }) => normalsInDeck(duel, player).length > 0,
			cost: (duel, { card }) => tribute(duel, [card.id]),
			operation: (duel, link) => ask(duel, link.player, normalsInDeck(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "graveyard", effect: link })),
		},
		{
			type: "trigger",
			range: "graveyard",
			timing: "if",
			categories: ["add-to-hand"],
			once: { scope: "name", key: "primite-dragon-ether-beryl-retrieve" },
			condition: (duel, { player }) => hasNormalMonster(duel, player),
			event: (duel, event, { card }) => event.type === "phase" && event.phase === "standby" && event.player === card.controller && duel.turn.player === card.controller,
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				return now.zone === "graveyard" && now.moves === link.card.moves ? moveCard(duel, now.id, { zone: "hand", effect: link }) : duel;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20754&request_locale=ja";
const EN = konamiCardUrl(20754, "en");

export const PRIMITE_DRAGON_ETHER_BERYL_SOURCES: CardSources = {
	code: "primite-dragon-ether-beryl",
	cid: 20754,
	french: {
		text: "Si cette carte est Invoquée Normalement : vous pouvez Poser 1 Magie/Piège \"Primite\" depuis votre Deck. Vous ne pouvez utiliser chacun des effets suivants de \"Dragon Béryl Éthérique Primite\" qu'une fois par tour. Vous pouvez Sacrifier cette carte ; envoyez 1 Monstre Normal depuis votre Deck au Cimetière. Durant votre Standby Phase, si vous avez un Monstre Normal dans votre Terrain ou Cimetière : vous pouvez ajouter cette carte depuis le Cimetière à votre main.",
		url: konamiCardUrl(20754, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20754, url: EN, read: "2026-11-24", quote: "EARTH Level 4 ATK 1600 DEF 0 Dragon／Effect" },
		{ id: "set", kind: "card-text", cid: 20754, url: EN, read: "2026-11-24", quote: "If this card is Normal Summoned: You can Set 1 \"Primite\" Spell/Trap from your Deck." },
		{ id: "once", kind: "card-text", cid: 20754, url: EN, read: "2026-11-24", quote: "You can only use each of the following effects of \"Primite Dragon Ether Beryl\" once per turn." },
		{ id: "tribute", kind: "card-text", cid: 20754, url: EN, read: "2026-11-24", quote: "You can Tribute this card; send 1 Normal Monster from your Deck to the GY." },
		{ id: "retrieve", kind: "card-text", cid: 20754, url: EN, read: "2026-11-24", quote: "During your Standby Phase, if you have a Normal Monster in your field or GY: You can add this card from the GY to your hand." },
		// OCG only. Konami's notes (補足情報, 2024-10-26), page read 2026-11-24. Its 1 Q&A entry is about another card (title not opened).
		{ id: "notes-set-trigger", kind: "jp-notes", cid: 20754, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-tribute-ignition", kind: "jp-notes", cid: 20754, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる起動効果です。" },
		{ id: "notes-retrieve-conditions", kind: "jp-notes", cid: 20754, url: NOTES, read: "2026-11-24", quote: "■自分のモンスターゾーンに表側表示の通常モンスターが存在する、または自分の墓地に通常モンスターが存在する場合に発動できます。" },
	],
	effects: ["facts", "set", "once", "tribute", "retrieve"],
	rulings: [{ source: "notes-set-trigger" }, { source: "notes-tribute-ignition" }, { source: "notes-retrieve-conditions" }],
};
