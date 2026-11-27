import { askUpTo } from "../choices";
import type { CardSources } from "../coverage";
import { shuffleDecksOf } from "../deck";
import { type Duel, moveCard, moveCards, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { fromOtherCards } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { factsOf, isEffectMonster } from "./helpers";

const NAME = "The Dragon that Devours the Dogma";
const ALBAZ = "Fallen of Albaz";
const ECCLESIA = "Ecclesia";

const isMonster = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.kind === "monster";

/** "An "Ecclesia" monster is on the field or in either GY": face-up in either player's Monster Zone, or in either Graveyard (Konami's notes). */
const ecclesiaPresent = (duel: Duel): boolean =>
	(["you", "rival"] as const).some((side) => duel.piles[side].monster.some((id) => duel.cards[id]!.face === "up" && belongsTo(duel, id, ECCLESIA)) || duel.piles[side].graveyard.some((id) => isMonster(duel, id) && belongsTo(duel, id, ECCLESIA)));

/** "Up to 2 cards from any GY(s) and/or banishment": every card of both Graveyards and both banishments, face-down banished cards included. */
const toShuffle = (duel: Duel): number[] => [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard, ...duel.piles.you.banished, ...duel.piles.rival.banished];

/** "1 "Dogmatika" or "Tri-Brigade" card from your Deck": any kind of card ("The Fallen & The Virtuous" is always a "Dogmatika" card). */
const toAdd = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => belongsTo(duel, id, "Dogmatika") || belongsTo(duel, id, "Tri-Brigade"));

/**
 * ""Fallen of Albaz" + 1 LIGHT or DARK monster + 1 Effect Monster. While an "Ecclesia" monster is on the field or in either GY, this card gains 500
 * ATK, also it is unaffected by other cards' effects. You can only use each of the following effects of "The Dragon that Devours the Dogma" once per
 * turn. If this card is Special Summoned: You can shuffle up to 2 cards from any GY(s) and/or banishment into the Deck. During the End Phase, if this
 * card is in the GY because it was sent there this turn: You can add 1 "Dogmatika" or "Tri-Brigade" card from your Deck to your hand." A DARK Beast
 * Fusion Effect Monster, Level 8.
 *
 * - Fusion Materials: one card for each of the three, by printed name, Attribute and frame. Neither Sky Striker list can Fusion Summon it: there it
 *   is the cost of "The Fallen & The Virtuous" (its text names "Fallen of Albaz": `facts.mentions`), and it searches that card back.
 * - First effect (Konami's notes: ②, a Continuous Effect of the Monster Zone): while an "Ecclesia" monster is face-up in either Monster Zone or in
 *   either GY (notes), +500 ATK and unaffected by every other card's effects (its controller's other cards too). It stops while negated.
 * - Second effect (notes: ①): an optional "if" Trigger Effect of the Monster Zone on any Special Summon of itself (a Fusion Summon included), also
 *   in the Damage Step (notes; the core puts Trigger Effects on a chain at their trigger point there too). The cards are chosen when it resolves,
 *   1 or 2, among both GYs and both banishments, face-down banished cards included (notes; Konami's Q&A fid 24417: they are not shown to the
 *   opponent, which the core does not model). Each goes to its owner's Deck, which is shuffled; an Extra Deck monster goes back face-down to
 *   the Extra Deck (notes). Offered while at least 1 such card exists (the core's reading).
 * - Third effect (notes: ③): an optional Trigger Effect of the Graveyard in "the End Phase", either player's (`during: "end"`, `eitherTurn`:
 *   S5 of docs/rules-core/sky-striker-gaps.md). It needs the card to have been sent to the GY this turn and to have stayed there since
 *   (`CardInstance.sentTurn`; notes), also when sent there during that End Phase (notes). A card placed in the GY by a rule was not sent.
 *   Offered while a "Dogmatika" or "Tri-Brigade" card is in the Deck (the core's reading); the card is chosen when it resolves.
 * - "Each of the following effects once per turn": one `once` by name for each of the two activated effects.
 * - Its two other Q&A (read) are about 「復活の福音」 (fid 18424: a replacement effect of a card in the GY applies to a monster that is unaffected, as the
 *   replaced card is not the one it is applied to) and 「赫の烙印」 (fid 24308: "cannot attack directly" stays), cards neither list has.
 */
export const THE_DRAGON_THAT_DEVOURS_THE_DOGMA: CardDef = {
	code: "the-dragon-that-devours-the-dogma",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Beast", frame: "fusion", level: 8, atk: 3000, def: 2500, mentions: [ALBAZ, NAME] },
	procedure: {
		kind: "fusion",
		materials: [
			{ min: 1, max: 1, filter: (duel, card) => hasPrintedName(duel, card.id, ALBAZ) },
			{ min: 1, max: 1, filter: (duel, card) => isMonster(duel, card.id) && (factsOf(duel, card.id)?.attribute === "LIGHT" || factsOf(duel, card.id)?.attribute === "DARK") },
			{ min: 1, max: 1, filter: (duel, card) => isEffectMonster(duel, card.id) },
		],
	},
	effects: [
		{
			type: "continuous",
			condition: (duel) => ecclesiaPresent(duel),
			modifies: () => [
				{ kind: "add", stat: "atk", by: 500 },
				{ kind: "protect", against: "effects", from: fromOtherCards },
			],
		},
		{
			type: "trigger",
			timing: "if",
			categories: ["return-to-deck"],
			once: { scope: "name", key: "the-dragon-that-devours-the-dogma-shuffle" },
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.id === card.id,
			condition: (duel) => toShuffle(duel).length > 0,
			operation: (duel, link) => askUpTo(duel, link.player, toShuffle(duel), { min: 1, max: 2 }, (board, picked) => shuffleDecksOf(moveCards(board, picked, { zone: "deck", effect: link }), picked)),
		},
		{
			type: "trigger",
			range: "graveyard",
			during: "end",
			eitherTurn: true,
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "name", key: "the-dragon-that-devours-the-dogma-search" },
			condition: (duel, { player, card }) => card.sentTurn === duel.turn.number && toAdd(duel, player).length > 0,
			operation: (duel, link) => ask(duel, link.player, toAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=22090&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(22090, "en");

export const THE_DRAGON_THAT_DEVOURS_THE_DOGMA_SOURCES: CardSources = {
	code: "the-dragon-that-devours-the-dogma",
	cid: 22090,
	french: {
		text: "\"Albaz le Déchu\" + 1 monstre LUMIÈRE ou TÉNÈBRES + 1 Monstre à Effet\nTant qu'un monstre \"Ecclésia\" est sur le Terrain ou dans l'un des Cimetières, cette carte gagne 500 ATK, et aussi, elle n'est pas affectée par les effets d'autres cartes. Vous ne pouvez utiliser chacun des effets suivants de \"Le Dragon qui Dévore le Dogma\" qu'une fois par tour. Si cette carte est Invoquée Spécialement : vous pouvez mélanger max. 2 cartes depuis les Cimetières et/ou bannissement dans le Deck. Durant la End Phase, si cette carte est dans le Cimetière parce qu'elle y a été envoyée ce tour : vous pouvez ajouter 1 carte \"Dogmatika\" ou \"Tri-Brigade\" depuis votre Deck à votre main.",
		url: konamiCardUrl(22090, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 22090, url: EN, read: "2026-11-26", quote: "The Dragon that Devours the Dogma DARK Level 8 ATK 3000 DEF 2500 Beast ／ Fusion／Effect" },
		{ id: "procedure", kind: "card-text", cid: 22090, url: EN, read: "2026-11-26", quote: "\"Fallen of Albaz\" + 1 LIGHT or DARK monster + 1 Effect Monster" },
		{ id: "ecclesia", kind: "card-text", cid: 22090, url: EN, read: "2026-11-26", quote: "While an \"Ecclesia\" monster is on the field or in either GY, this card gains 500 ATK, also it is unaffected by other cards' effects." },
		{ id: "once", kind: "card-text", cid: 22090, url: EN, read: "2026-11-26", quote: "You can only use each of the following effects of \"The Dragon that Devours the Dogma\" once per turn." },
		{ id: "shuffle", kind: "card-text", cid: 22090, url: EN, read: "2026-11-26", quote: "If this card is Special Summoned: You can shuffle up to 2 cards from any GY(s) and/or banishment into the Deck." },
		{ id: "search", kind: "card-text", cid: 22090, url: EN, read: "2026-11-26", quote: "During the End Phase, if this card is in the GY because it was sent there this turn: You can add 1 \"Dogmatika\" or \"Tri-Brigade\" card from your Deck to your hand." },
		// OCG only. Konami's notes (補足情報, 2025-10-25), page read 2026-11-26. The Japanese text numbers the effects ① (Special Summoned), ② (Ecclesia), ③ (End Phase).
		{ id: "notes-shuffle-trigger", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "【①の効果について】■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-shuffle-damage-step", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-shuffle-face-down", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "■デッキに戻すカードとして、裏側で除外されているカードも選べます。" },
		{ id: "notes-shuffle-extra", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "■融合・シンクロ・エクシーズ・リンクモンスターも選べます。（エクストラデッキに裏側で戻ります。）" },
		{ id: "notes-ecclesia-continuous", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "【②の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-ecclesia-where", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "■自分か相手のモンスターゾーンに「エクレシア」モンスターが表側表示で存在する場合、または自分か相手の墓地に「エクレシア」モンスターが存在する場合に適用されます。" },
		{ id: "notes-search-graveyard", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "【③の効果について】■墓地で発動できる誘発効果です。" },
		{ id: "notes-search-stayed", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "■このカードが墓地へ送られ、そのままそのターンのエンドフェイズまで墓地に存在し続けた場合に発動できます。" },
		{ id: "notes-search-end-phase-sent", kind: "jp-notes", cid: 22090, url: NOTES, read: "2026-11-26", quote: "なお、エンドフェイズに墓地へ送られた場合、そのエンドフェイズに発動できます。" },
		// OCG only. Konami's Q&A fid 24417 (2026-10-29), page read 2026-11-26: its ① chooses face-down banished cards, which are not shown to the opponent.
		// OCG only. Konami's Q&A fids 18424 (2026-04-03) and 24308 (2026-03-26), pages read 2026-11-26.
		{ id: "qa-gospel-18424", kind: "jp-qa", cid: 22090, fid: 18424, url: qa(18424), read: "2026-11-26", quote: "（「復活の福音」「円盤闘技場セリオンズ・リング」などの、破壊される代わりに別の処理を行う効果は、本来破壊されるはずだったカードに適用される効果ではありません。）" },
		{ id: "qa-branded-red-24308", kind: "jp-qa", cid: 22090, fid: 24308, url: qa(24308), read: "2026-11-26", quote: "なお、フィールド・墓地に「エクレシア」モンスターが存在する状況で特殊召喚したかによって処理に違いはありません。" },
		{ id: "qa-face-down-banished-24417", kind: "jp-qa", cid: 22090, fid: 24417, url: qa(24417), read: "2026-11-26", quote: "除外されているカードの種類や内容を指定しない効果であれば、裏側で除外されているカードも選べます。" },
	],
	effects: ["facts", "procedure", "ecclesia", "once", "shuffle", "search"],
	rulings: [
		{ source: "notes-shuffle-trigger" },
		{ source: "notes-shuffle-damage-step" },
		{ source: "notes-shuffle-face-down" },
		{ source: "notes-shuffle-extra" },
		{ source: "notes-ecclesia-continuous" },
		{ source: "notes-ecclesia-where" },
		{ source: "notes-search-graveyard" },
		{ source: "notes-search-stayed" },
		{ source: "notes-search-end-phase-sent" },
		{ source: "qa-face-down-banished-24417" },
		{ source: "qa-gospel-18424", pending: "needs \"Gospel of Revival\" (a card in the GY that replaces a destruction), which the core does not have" },
		{ source: "qa-branded-red-24308", pending: "needs \"Branded in Red\" (a Fusion Summon that stops direct attacks), which the core does not have" },
	],
};
