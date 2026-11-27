import { askMay } from "../choices";
import type { CardSources } from "../coverage";
import { destroyCard, type Duel, effectDestruction, moveCard, type Side } from "../duel";
import { ask, type CardDef, cardTypeOf } from "../effects";
import { breakEffect } from "../events";
import { belongsTo, hasPrintedName } from "../identity";
import { locked } from "../modifiers";
import { askSpecialSummonTogether, canSpecialSummonTogether, tribute } from "../procedures";
import { konamiCardUrl } from "../sources";

const NAME = "Sky Striker Ace = Zero";
const RAYE = "Sky Striker Ace - Raye";
const ROZE = "Sky Striker Ace - Roze";
/** The use limit of the whole card: "You can only use 1 "Sky Striker Ace = Zero" effect per turn, and only once that turn". */
const ONCE = { scope: "name", key: "sky-striker-ace-zero" } as const;

/** "1 "Sky Striker" Spell from your Deck or GY": a Spell of any kind; the Deck is out of reach while cards cannot be added from it to the hand. */
const toAdd = (duel: Duel, player: Side): number[] => {
	const pools = locked(duel, "add-to-hand", player) ? [duel.piles[player].graveyard] : [duel.piles[player].deck, duel.piles[player].graveyard];
	return pools.flat().filter((id) => belongsTo(duel, id, "Sky Striker") && cardTypeOf(duel, duel.cards[id]!) === "spell");
};

/** The monsters of that printed name in the Deck and/or the GY. */
const named = (duel: Duel, player: Side, name: string): number[] => [...duel.piles[player].deck, ...duel.piles[player].graveyard].filter((id) => hasPrintedName(duel, id, name));

/** Every pair "1 Raye and 1 Roze" that can be Special Summoned at the same time (`leaving`: monsters that will have left the field, the cost). */
const pairs = (duel: Duel, player: Side, leaving: readonly number[] = []): [number, number][] =>
	named(duel, player, RAYE).flatMap((raye) => named(duel, player, ROZE).filter((roze) => canSpecialSummonTogether(duel, player, [raye, roze], { leaving })).map((roze): [number, number] => [raye, roze]));

/** "1 card on the field": any card of either field, face-up or face-down, a Spell or Trap and the Field Spell included. */
const onField = (duel: Duel): number[] => (["you", "rival"] as const).flatMap((side) => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field]);

/**
 * "2 "Sky Striker Ace" monsters. You can only Special Summon "Sky Striker Ace = Zero(s)" once per turn. Cannot be used as Link Material. If this card
 * is Special Summoned: You can add 1 "Sky Striker" Spell from your Deck or GY to your hand. (Quick Effect): You can Tribute this card; Special Summon 1
 * "Sky Striker Ace - Raye" and 1 "Sky Striker Ace - Roze" from your Deck and/or GY, then you can destroy 1 card on the field. You can only use 1 "Sky
 * Striker Ace = Zero" effect per turn, and only once that turn." A LIGHT Machine Link Effect Monster, Link 2, arrows at the bottom left and bottom right.
 *
 * - Procedure: 2 "Sky Striker Ace" monsters (`procedure: link`, exactly two). The once-per-turn Special Summon is a card rule, not an effect, whatever the
 *   way of Summoning (`summon.oncePerTurn`); "cannot be used as Link Material" is not an effect either: it holds while the card's effects are negated
 *   (`cannotBeMaterial`, Konami's notes).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone, also in the Damage Step (notes). The Spell is chosen when it resolves (no target),
 *   in the Deck or the Graveyard of the player, a "Sky Striker" Spell of any kind (by the name's archetype; Quick-Play Spells included). It is offered
 *   with a Spell to add; the Deck is not offered while cards cannot be added from it to the hand. It is a search for what answers searches.
 * - Second effect: a Quick Effect of the Monster Zone, not in the Damage Step (notes). It cannot be activated unless "Sky Striker Ace - Raye" and "Sky
 *   Striker Ace - Roze" can both be Special Summoned at the same time, from the Deck and/or the Graveyard (never the hand), each in a free Main Monster
 *   Zone, the zone of this card counting as free once it is Tributed (the cost): `canSpecialSummonTogether` with `leaving`. If at resolution one of the
 *   two cannot be Summoned, nothing is done and the Tribute stays paid (notes). The two are Special Summoned together (one batch), the player choosing
 *   which copy of each when there are several, then may destroy 1 card on the field, chosen then (not a target), after the Summon: the two parts are not
 *   simultaneous (notes). Konami's Q&A fid 23195: an effect that only may destroy is not "an effect that destroys", so its categories carry none.
 * - The limit of the text covers both effects: one use between them each turn (`once.key`), by name.
 */
export const SKY_STRIKER_ACE_ZERO: CardDef = {
	code: "sky-striker-ace-zero",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Machine", frame: "link", link: 2, arrows: ["bottom-left", "bottom-right"], atk: 2000, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME, RAYE, ROZE] },
	summon: { oncePerTurn: true },
	cannotBeMaterial: ["link"],
	procedure: { kind: "link", materials: { min: 2, max: 2, filter: (duel, card) => belongsTo(duel, card.id, "Sky Striker Ace") } },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["search"],
			once: ONCE,
			condition: (duel, { player }) => toAdd(duel, player).length > 0,
			event: (_duel, event, { card }) => event.type === "summoned" && event.card.id === card.id && event.how === "special",
			operation: (duel, link) => ask(duel, link.player, toAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
		{
			type: "quick",
			// From "the Deck and/or the GY": it includes a Special Summon from each (Konami's Q&A fid 23215: such an effect counts as one that Special Summons from the GY even with no monster there).
			categories: ["special-summon", "summon-from-deck", "summon-from-graveyard"],
			once: ONCE,
			condition: (duel, { player, card }) => pairs(duel, player, [card.id]).length > 0,
			cost: (duel, { card }) => tribute(duel, [card.id]),
			operation: (duel, link) =>
				ask(duel, link.player, [...new Set(pairs(duel, link.player).map(([raye]) => raye))], (board, raye) =>
					ask(board, link.player, pairs(board, link.player).filter(([picked]) => picked === raye).map(([, roze]) => roze), (next, roze) =>
						askSpecialSummonTogether(next, link.player, [raye, roze], {
							then: (done) =>
								askMay(breakEffect(done), link.player, link.card.id, (after) => ask(after, link.player, onField(after), (last, target) => destroyCard(last, target, { destruction: effectDestruction(link) }))),
						}),
					),
				),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=21460&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(21460, "en");

export const SKY_STRIKER_ACE_ZERO_SOURCES: CardSources = {
	code: "sky-striker-ace-zero",
	cid: 21460,
	french: {
		text: "2 monstres \"Assaut de l'Air - As\"\nVous ne pouvez Invoquer Spécialement un ou plusieurs \"Assaut de l'Air - As = Zéro\" qu'une fois par tour. Non utilisable comme Matériel Lien. Si cette carte est Invoquée Spécialement : vous pouvez ajouter 1 Magie \"Assaut de l'Air\" depuis votre Deck ou Cimetière à votre main. (Effet Rapide) : vous pouvez Sacrifier cette carte ; Invoquez Spécialement 1 \"Assaut de l'Air - As - Raye\" et 1 \"Assaut de l'Air - As - Roze\" depuis votre Deck et/ou Cimetière, puis vous pouvez détruire 1 carte sur le Terrain. Vous ne pouvez utiliser qu'1 effet de \"Assaut de l'Air - As = Zéro\" par tour, et uniquement une fois le tour.",
		url: konamiCardUrl(21460, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "LIGHT Link 2 ATK 2000 DEF - Machine ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "2 \"Sky Striker Ace\" monsters" },
		{ id: "once-summon", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "You can only Special Summon \"Sky Striker Ace = Zero(s)\" once per turn." },
		{ id: "cannot-be-material", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "Cannot be used as Link Material." },
		{ id: "search", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "If this card is Special Summoned: You can add 1 \"Sky Striker\" Spell from your Deck or GY to your hand." },
		{ id: "summon", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "(Quick Effect): You can Tribute this card; Special Summon 1 \"Sky Striker Ace - Raye\" and 1 \"Sky Striker Ace - Roze\" from your Deck and/or GY," },
		{ id: "destroy", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "then you can destroy 1 card on the field." },
		{ id: "once", kind: "card-text", cid: 21460, url: EN, read: "2026-11-26", quote: "You can only use 1 \"Sky Striker Ace = Zero\" effect per turn, and only once that turn." },
		// OCG only. Konami's notes (補足情報, 2025-04-26), page read 2026-11-26.
		{ id: "notes-not-effect", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。" },
		{ id: "notes-link-material", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■このカードの効果が無効化されている状況でも、リンク素材にできません。" },
		{ id: "notes-trigger", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-trigger-damage-step", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-quick", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-needs-both", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■「閃刀姫－レイ」と「閃刀姫－ロゼ」の両方を特殊召喚できる状況で発動できます。（少なくとも一方が特殊召喚できない場合には発動できません。）" },
		{ id: "notes-sequential", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■特殊召喚する処理と破壊する処理を両方行う場合、それらは同時に行われません。" },
		{ id: "notes-all-or-nothing", kind: "jp-notes", cid: 21460, url: NOTES, read: "2026-11-26", quote: "■処理時に、「閃刀姫－レイ」と「閃刀姫－ロゼ」の内、少なくとも一方を特殊召喚できない場合は何も処理は行いません。" },
		// OCG only. Konami's Q&A fids 23195 (2026-08-07) and 24189 (2026-05-11), pages read 2026-11-26. Its other Q&A are about cards of neither list (24296, 23215, 24184).
		{ id: "qa-optional-destroy-23195", kind: "jp-qa", cid: 21460, fid: 23195, url: qa(23195), read: "2026-11-26", quote: "発動時にカードを破壊する処理を行うかどうかが決まっていない効果は、カードを破壊する効果や、フィールドのカードを破壊する効果として扱いません。" },
		// OCG only. Konami's Q&A fids 24296 (2026-03-06), 23215 (2026-10-30) and 24184 (2025-06-12), pages read 2026-11-26.
		{ id: "qa-eagle-booster-24296", kind: "jp-qa", cid: 21460, fid: 24296, url: qa(24296), read: "2026-11-26", quote: "したがって、コストでリリースされた「閃刀姫＝ゼロ」はその時点で他のカードの効果を受ける状態になりますので、チェーンして発動されたカードの効果を受けます。" },
		{ id: "qa-from-graveyard-23215", kind: "jp-qa", cid: 21460, fid: 23215, url: qa(23215), read: "2026-11-26", quote: "「真の光」１つ目の『●』の効果は、その発動時の墓地の「青眼の白龍」の数を問わず、『墓地からモンスターを特殊召喚する効果を含む効果』に該当します。" },
		{ id: "qa-attack-position-24184", kind: "jp-qa", cid: 21460, fid: 24184, url: qa(24184), read: "2026-11-26", quote: "攻撃表示で特殊召喚した「閃刀姫－レイ」「閃刀姫－ロゼ」はどちらも攻撃表示のままとなります。" },
		{ id: "qa-gozen-match-24189", kind: "jp-qa", cid: 21460, fid: 24189, url: qa(24189), read: "2026-11-26", quote: "「閃刀姫＝ゼロ」の『フィールドのカード１枚を破壊できる』効果で「センサー万別」や「御前試合」を破壊した場合は、特殊召喚した「閃刀姫－レイ」と「閃刀姫－ロゼ」はどちらもフィールドに残ります。" },
	],
	effects: ["facts", "procedure", "once-summon", "cannot-be-material", "search", "summon", "destroy", "once"],
	rulings: [
		{ source: "notes-not-effect" },
		{ source: "notes-link-material" },
		{ source: "notes-trigger" },
		{ source: "notes-trigger-damage-step" },
		{ source: "notes-quick" },
		{ source: "notes-no-damage-step" },
		{ source: "notes-needs-both" },
		{ source: "notes-sequential" },
		{ source: "notes-all-or-nothing" },
		{ source: "qa-optional-destroy-23195" },
		{ source: "qa-eagle-booster-24296", pending: "needs \"Sky Striker Mecha - Eagle Booster\" (an Equip Spell that makes the monster unaffected by other cards' effects), which the core does not have" },
		{ source: "qa-from-graveyard-23215" },
		{ source: "qa-attack-position-24184", pending: "needs a monster that changes the position of the monsters on the field (\"Number 41: Bagooska the Terribly Tired Tapir\"); Special Summoned in Attack Position, the two stay so while its effect is only applied after the chain block" },
		{ source: "qa-gozen-match-24189", pending: "about the cards named 「センサー万別」 and 「御前試合」 in Konami's Japanese text, which are in neither list and which the core does not have" },
	],
};
