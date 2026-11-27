import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef, cardTypeOf } from "../effects";
import { belongsTo, printedFacts } from "../identity";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";
import { spellsInGraveyard } from "./sky-striker-helpers";

const NAME = "Sky Striker Ace - Shizuku";

/** "1 "Sky Striker" Spell from your Deck, with a name different from the cards in your GY": a Spell of any kind, read when the effect resolves. */
const toAdd = (duel: Duel, player: Side): number[] => {
	const inGraveyard = new Set(duel.piles[player].graveyard.map((id) => printedFacts(duel, id)?.name));
	return duel.piles[player].deck.filter((id) => belongsTo(duel, id, "Sky Striker") && cardTypeOf(duel, duel.cards[id]!) === "spell" && !inGraveyard.has(printedFacts(duel, id)?.name));
};

/**
 * "1 non-WATER "Sky Striker Ace" monster. Monsters your opponent controls lose 100 ATK/DEF for each Spell in your GY. Once per turn, during the End Phase,
 * if this card was Special Summoned this turn: You can add 1 "Sky Striker" Spell from your Deck to your hand, with a name different from the cards in
 * your GY. You can only Special Summon "Sky Striker Ace - Shizuku(s)" once per turn." A WATER Machine Link Effect Monster, Link 1, arrow at the top right.
 *
 * - Procedure: 1 non-WATER "Sky Striker Ace" monster (every Ace is also a "Sky Striker" card, by its name). The once-per-turn Special Summon is a card
 *   rule, not an effect, whatever the way of Summoning (`summon.oncePerTurn`, notes).
 * - First effect: a Continuous Effect of the Monster Zone (notes): each monster the controller's opponent controls (any zone of the Monster Zones, an
 *   Extra Monster Zone too) loses 100 ATK and 100 DEF for each Spell in the controller's own Graveyard (Spells of any kind, not Traps or monsters).
 *   It is the monster's effect: it stops while negated.
 * - Second effect: an optional Trigger Effect of the Monster Zone (notes) "during the End Phase", not "your": `during: "end"` with `eitherTurn` (Konami's
 *   Q&A fid 11555: the card is Special Summoned by an effect of the opponent's Raye in the other player's turn, and its controller still uses it in that
 *   End Phase). It needs the monster to have been Special Summoned this turn and to have stayed face-up on the field since (`specialSummoned` with
 *   `summonedTurn`: a monster that left, was turned face-down or was banished temporarily is a new card with none: Q&A fid 24032). The Spell is chosen
 *   when it resolves (no target), from the Deck of the player who activates it, with a printed name that no card of their Graveyard has. It is offered
 *   with one to add (the core's reading), and while cards can be added from the Deck.
 * - "Once per turn": a use for each copy that follows the card to the Graveyard and banishment and, as the Q&A fid 11555 needs, is kept when control
 *   of the monster changes: `{ scope: "instance", acrossMoves: true }`. The player who took control "until the End Phase" and activates it first leaves
 *   nothing for its controller after the control is given back; given back first, the controller can activate it.
 */
export const SKY_STRIKER_ACE_SHIZUKU: CardDef = {
	code: "sky-striker-ace-shizuku",
	kind: "monster",
	facts: { name: NAME, attribute: "WATER", monsterType: "Machine", frame: "link", link: 1, arrows: ["top-right"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME] },
	summon: { oncePerTurn: true },
	procedure: { kind: "link", materials: { min: 1, max: 1, filter: (duel, card) => belongsTo(duel, card.id, "Sky Striker Ace") && factsOf(duel, card.id)?.attribute !== "WATER" } },
	effects: [
		{
			type: "continuous",
			affects: (_duel, target, source) => target.zone === "monster" && target.controller !== source.controller,
			modifies: () => (["atk", "def"] as const).map((stat) => ({ kind: "add" as const, stat, by: (duel: Duel, source: { readonly controller: Side } | null) => (source === null ? 0 : -100 * spellsInGraveyard(duel, source.controller)) })),
		},
		{
			type: "trigger",
			during: "end",
			eitherTurn: true,
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "instance", acrossMoves: true },
			condition: (duel, { player, card }) => card.specialSummoned && card.summonedTurn === duel.turn.number && toAdd(duel, player).length > 0,
			operation: (duel, link) => ask(duel, link.player, toAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13669&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(13669, "en");

export const SKY_STRIKER_ACE_SHIZUKU_SOURCES: CardSources = {
	code: "sky-striker-ace-shizuku",
	cid: 13669,
	french: {
		text: "1 monstre \"Assaut de l'Air - As\" non-EAU\nLes monstres contrôlés par votre adversaire perdent 100 ATK/DEF pour chaque Magie dans votre Cimetière. Une fois par tour, durant la End Phase, si cette carte a été Invoquée Spécialement ce tour : vous pouvez ajouter 1 Magie \"Assaut de l'Air\" depuis votre Deck à votre main, de nom différent des cartes dans votre Cimetière. Vous ne pouvez Invoquer Spécialement un ou plusieurs \"Assaut de l'Air - As - Shizuku\" qu'une fois par tour.",
		url: konamiCardUrl(13669, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13669, url: EN, read: "2026-11-26", quote: "WATER Link 1 ATK 1500 DEF - Machine ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 13669, url: EN, read: "2026-11-26", quote: "1 non-WATER \"Sky Striker Ace\" monster" },
		{ id: "loss", kind: "card-text", cid: 13669, url: EN, read: "2026-11-26", quote: "Monsters your opponent controls lose 100 ATK/DEF for each Spell in your GY." },
		{ id: "once", kind: "card-text", cid: 13669, url: EN, read: "2026-11-26", quote: "Once per turn, during the End Phase," },
		{ id: "search", kind: "card-text", cid: 13669, url: EN, read: "2026-11-26", quote: "if this card was Special Summoned this turn: You can add 1 \"Sky Striker\" Spell from your Deck to your hand, with a name different from the cards in your GY." },
		{ id: "once-summon", kind: "card-text", cid: 13669, url: EN, read: "2026-11-26", quote: "You can only Special Summon \"Sky Striker Ace - Shizuku(s)\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2021-12-25), page read 2026-11-26.
		{ id: "notes-not-effect", kind: "jp-notes", cid: 13669, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。" },
		{ id: "notes-any-summon", kind: "jp-notes", cid: 13669, url: NOTES, read: "2026-11-26", quote: "■リンク召喚による特殊召喚かどうかにかかわらず、１ターンに１度しか特殊召喚できません。" },
		{ id: "notes-continuous", kind: "jp-notes", cid: 13669, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-trigger", kind: "jp-notes", cid: 13669, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-end", kind: "jp-notes", cid: 13669, url: NOTES, read: "2026-11-26", quote: "■エンドフェイズに、このカードがこのターンに特殊召喚されたモンスターである場合に発動できます。" },
		// OCG only. Konami's Q&A fids 24032 (2026-09-13) and 11555 (2018-04-12), pages read 2026-11-26. Fid 11555 names Mind Control (a card the core does not
		// have: tested with a made-up card of its wording) and the monster Special Summoned by "Sky Striker Ace - Raye"; its Widow Anchor variant has no page.
		{ id: "qa-temporary-banish-24032", kind: "jp-qa", cid: 13669, fid: 24032, url: qa(24032), read: "2026-11-26", quote: "発動できません。「閃刀姫－シズク」の②の効果を発動するには、特殊召喚されてからエンドフェイズまで、モンスターゾーンに表側表示で存在し続ける必要があります。" },
		{ id: "qa-control-order-11555", kind: "jp-qa", cid: 13669, fid: 11555, url: qa(11555), read: "2026-11-26", quote: "エンドフェイズに「精神操作」の効果が適用されている「閃刀姫－シズク」のコントロールを相手に戻す処理と、「閃刀姫－シズク」の『デッキから、同名カードが自分の墓地に存在しない「閃刀」魔法カード１枚を手札に加える』モンスター効果の発動の、どちらを先に行うか選ぶ事ができます。" },
		{ id: "qa-control-activate-first-11555", kind: "jp-qa", cid: 13669, fid: 11555, url: qa(11555), read: "2026-11-26", quote: "自分が「閃刀姫－シズク」のモンスター効果の発動を行った後に、「閃刀姫－シズク」のコントロールを相手に戻した場合には、相手プレイヤーは「閃刀姫－シズク」のモンスター効果を発動する事はできません。" },
	],
	effects: ["facts", "procedure", "loss", "once", "search", "once-summon"],
	rulings: [
		{ source: "notes-not-effect" },
		{ source: "notes-any-summon" },
		{ source: "notes-continuous" },
		{ source: "notes-trigger" },
		{ source: "notes-end" },
		{ source: "qa-temporary-banish-24032" },
		{ source: "qa-control-order-11555" },
		{ source: "qa-control-activate-first-11555" },
	],
};
