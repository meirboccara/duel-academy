import { askMay } from "../choices";
import type { CardSources } from "../coverage";
import { drawCards } from "../deck";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { breakEffect } from "../events";
import { belongsTo, hasPrintedName } from "../identity";
import { drawLocked } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { noMainMonsters, spellsInGraveyard } from "./sky-striker-helpers";

const NAME = "Sky Striker Mobilize - Engage!";
const SKY_STRIKER = "Sky Striker";

/** "1 "Sky Striker" card from your Deck, except this card": a card of any kind, read when the effect resolves. */
const toAdd = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => belongsTo(duel, id, SKY_STRIKER) && !hasPrintedName(duel, id, NAME));

/**
 * "If you control no monsters in your Main Monster Zone: Add 1 "Sky Striker" card from your Deck to your hand, except "Sky Striker Mobilize -
 * Engage!", then, if you have 3 or more Spells in your GY, you can draw 1 card." A Normal Spell, "Sky Striker" by its name.
 *
 * - Condition: no monster of the player in a Main Monster Zone (slots 0 to 4), a face-down one included; a monster in an Extra Monster Zone does
 *   not stop it. Read at activation only, as the text words it.
 * - The card is chosen when the effect resolves (no target), among the "Sky Striker" cards of the Deck of any kind (`facts.archetypes`, the name's
 *   own archetype: no Konami page lists it), other than a card of this name. It cannot be activated with none to add (`requiresAddToHand`: the
 *   core's reading of "cannot activate when it cannot be done", record `search-needs-a-card`; and while the Deck cannot add to the hand).
 * - "Then, ... you can draw 1 card": after the add, which is done first (notes: not simultaneous), when the add succeeded and the player has 3 or
 *   more Spells in the GY (this card is on the field while it resolves, so it is not counted). The draw is a choice (`askMay`), and is not offered
 *   when the Deck is empty (Konami's Q&A fid 13232: with 1 card left, the card can be activated, and the draw cannot be chosen) or while the player
 *   cannot draw by card effects.
 */
export const SKY_STRIKER_MOBILIZE_ENGAGE: CardDef = {
	code: "sky-striker-mobilize-engage",
	kind: "spell",
	facts: { name: NAME, archetypes: [SKY_STRIKER], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["search"],
			requiresAddToHand: true,
			condition: (duel, { player }) => noMainMonsters(duel, player) && toAdd(duel, player).length > 0,
			operation: (duel, link) =>
				ask(duel, link.player, toAdd(duel, link.player), (board, picked) => {
					const added = moveCard(board, picked, { zone: "hand", effect: link });
					// The add did not take (the card is not in the hand): no draw.
					if (added.cards[picked]!.zone !== "hand" || added.cards[picked]!.moves === board.cards[picked]!.moves) return added;
					if (spellsInGraveyard(added, link.player) < 3 || added.piles[link.player].deck.length === 0 || drawLocked(added, link.player)) return added;
					return askMay(breakEffect(added), link.player, link.card.id, (next) => drawCards(next, link.player, 1));
				}),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13671&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(13671, "en");

export const SKY_STRIKER_MOBILIZE_ENGAGE_SOURCES: CardSources = {
	code: "sky-striker-mobilize-engage",
	cid: 13671,
	french: {
		text: "Si vous ne contrôlez aucun monstre dans votre Zone Monstre Main : ajoutez 1 carte \"Assaut de l'Air\" (\"Assaut de l'Air - Mobilisation - À l'Attaque !\" exclu) depuis votre Deck à votre main, puis, si vous avez min. 3 Magies dans votre Cimetière, vous pouvez piocher 1 carte.",
		url: konamiCardUrl(13671, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13671, url: EN, read: "2026-11-26", quote: "Normal Spell" },
		{ id: "condition", kind: "card-text", cid: 13671, url: EN, read: "2026-11-26", quote: "If you control no monsters in your Main Monster Zone:" },
		{ id: "search", kind: "card-text", cid: 13671, url: EN, read: "2026-11-26", quote: "Add 1 \"Sky Striker\" card from your Deck to your hand, except \"Sky Striker Mobilize - Engage!\"," },
		{ id: "draw", kind: "card-text", cid: 13671, url: EN, read: "2026-11-26", quote: "then, if you have 3 or more Spells in your GY, you can draw 1 card." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-26.
		{ id: "notes-search", kind: "jp-notes", cid: 13671, url: NOTES, read: "2026-11-26", quote: "■処理時に、『デッキから「閃刀起動－エンゲージ」以外の「閃刀」カード１枚を手札に加える』処理を行います。" },
		{ id: "notes-sequential", kind: "jp-notes", cid: 13671, url: NOTES, read: "2026-11-26", quote: "■手札に加える処理とドローする処理を両方行う場合、それらは同時に行われません。" },
		// OCG only. Konami's Q&A fid 13232 (2018-03-30), page read 2026-11-26. Its other Q&A: fid 24167 is about Lemnisgate (batch 6); fids 21992 and 23258 are about cards of neither list.
		{ id: "qa-last-card", kind: "jp-qa", cid: 13671, fid: 13232, url: qa(13232), read: "2026-11-26", quote: "質問の状況のように、自分のデッキのカードの残り枚数が1枚という状況であっても、そのカードが「閃刀起動－エンゲージ」以外の「閃刀」と名のついたカードであるならば、自分は「閃刀起動－エンゲージ」を発動する事ができます。" },
	],
	effects: ["facts", "condition", "search", "draw"],
	rulings: [{ source: "notes-search" }, { source: "notes-sequential" }, { source: "qa-last-card" }],
};
