import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { revealCards } from "../deck";
import { effectDestruction, moveCard, moveCards, other } from "../duel";
import type { CardDef, EffectRecord } from "../effects";
import { belongsTo } from "../identity";
import { addModifier } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";

const NAME = "Blue-Eyes White Dragon, the White Phantom Beast";
const BLUE_EYES = "Blue-Eyes";

/** One cause of the first effect: both are the one printed effect, with one use per turn by name. */
const summonItself = (event: EffectRecord["event"]): EffectRecord => ({
	type: "trigger",
	range: "hand",
	timing: "when",
	categories: ["special-summon"],
	once: { scope: "name", key: "blue-eyes-white-dragon-the-white-phantom-beast-summon" },
	event,
	// An effect that Summons is activated only while it can be done: this card Special Summonable.
	condition: (duel, { player, card }) => canSpecialSummon(duel, player, card.id),
	// "Reveal this card in your hand": the cost.
	cost: (duel, { player, card }) => revealCards(duel, player, [card.id]),
	operation: (duel, link) => {
		const now = duel.cards[link.card.id]!;
		return now.zone === "hand" && now.moves === link.card.moves ? askSpecialSummon(duel, link.player, now.id) : duel;
	},
});

/**
 * "When this card is added from the Deck to your hand, or a monster you control is destroyed by battle: You can reveal this card in your hand;
 * Special Summon it. If this card is Special Summoned from the hand or Deck: You can destroy all monsters your opponent controls, also you can only
 * attack directly with "Blue-Eyes" monsters for the rest of this turn. You can only use each of the preceding effects of "Blue-Eyes White Dragon,
 * the White Phantom Beast" once per turn. When a card or effect is activated that targets this card on the field (Quick Effect): You can discard 1
 * card; negate that effect." A LIGHT Dragon Effect Monster of Level 8.
 *
 * - First effect: an optional "when" Trigger Effect of the hand (Konami's notes, OCG), also in the Damage Step (the destruction by battle is
 *   in it): revealing itself is the cost. Two records for one effect (added from the Deck; a monster the player controls destroyed by battle),
 *   sharing one use per turn by name. Added from the Deck: only right after (notes): a "when" effect misses its timing when another Chain Link
 *   follows the one that added it, which is the core's own rule for "when". A draw adds a card from the Deck. Activated only while it can
 *   be Special Summoned (the core's reading, as for the other Summons).
 * - Second effect: an optional "if" Trigger Effect of the Monster Zone, also in the Damage Step (notes), for a Special Summon from the hand or
 *   the Deck only. It destroys all the opponent's monsters, then applies the restriction to the player whether or not any monster was destroyed
 *   (notes), unless the effect was negated; a monster unaffected by the effect is still stopped from attacking directly (the restriction is on
 *   the player). It stops the player's monsters that are not "Blue-Eyes" monsters from attacking directly, until the end of the turn; a turn
 *   when they already attacked directly is no obstacle (notes).
 * - Third effect: a Quick Effect of the Monster Zone, chained directly to the activation that targets this face-up card (the link on top of the
 *   chain, whoever activated it: notes), discarding 1 card as the cost; it can be activated several times in one Chain (notes), so it has no
 *   limit. Not in the Damage Step (notes): the core only allows effects that change ATK/DEF there, which this is not (limit L1 of
 *   docs/rules-core/blue-eyes-gaps.md is about what Konami's notes allow, and here they agree with the core).
 * - "Blue-Eyes" is read from `facts.archetypes`: the name's own archetype, which no Konami page lists.
 */
export const BLUE_EYES_WHITE_DRAGON_THE_WHITE_PHANTOM_BEAST: CardDef = {
	code: "blue-eyes-white-dragon-the-white-phantom-beast",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", level: 8, atk: 3000, def: 2500, archetypes: [BLUE_EYES], mentions: [NAME] },
	effects: [
		summonItself((_duel, event, { card }) => event.type === "added-to-hand" && event.card.id === card.id && event.from === "deck"),
		summonItself((_duel, event, { player }) => event.type === "moved" && event.by === "battle" && event.reason === "destroyed" && event.before.zone === "monster" && event.before.controller === player),
		{
			type: "trigger",
			timing: "if",
			categories: ["destroy"],
			once: { scope: "name", key: "blue-eyes-white-dragon-the-white-phantom-beast-destroy" },
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.id === card.id && (event.from === "hand" || event.from === "deck"),
			operation: (duel, link) => {
				const destroyed = moveCards(duel, duel.piles[other(link.player)].monster, { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) });
				return addModifier(destroyed, { affects: () => false, until: duel.turn.number, layer: { kind: "lock", what: "attack-directly", who: link.player, only: (board, monster) => !belongsTo(board, monster.id, BLUE_EYES) } });
			},
		},
		{
			type: "quick",
			categories: ["negate"],
			condition: (duel, { card }) => {
				const top = duel.chain[duel.chain.length - 1];
				return top !== undefined && card.zone === "monster" && card.face === "up" && top.targets.some((id, at) => id === card.id && duel.cards[id]!.moves === top.targetMoves[at]);
			},
			cost: { pick: (duel, { player }) => duel.piles[player].hand.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }) },
			operation: (duel, link) => (link.answers === null ? duel : negateEffect(duel, link.answers)),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=22716&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(22716, "en");

export const BLUE_EYES_WHITE_DRAGON_THE_WHITE_PHANTOM_BEAST_SOURCES: CardSources = {
	code: "blue-eyes-white-dragon-the-white-phantom-beast",
	cid: 22716,
	french: {
		text: "Lorsque cette carte est ajoutée depuis le Deck à votre main, ou qu'un monstre que vous contrôlez est détruit au combat : vous pouvez révéler cette carte dans votre main ; Invoquez-la Spécialement. Si cette carte est Invoquée Spécialement depuis la main ou Deck : vous pouvez détruire tous les monstres contrôlés par votre adversaire, et aussi, vous ne pouvez attaquer directement qu'avec des monstres \"Yeux Bleus\" le reste de ce tour. Vous ne pouvez utiliser chacun des effets précédents de \"Dragon Blanc aux Yeux Bleus, la Bête Fantôme Blanche\" qu'une fois par tour. Lorsqu'une carte ou un effet qui cible cette carte sur le Terrain est activé (Effet Rapide) : vous pouvez défausser 1 carte ; annulez l'effet.",
		url: konamiCardUrl(22716, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 22716, url: EN, read: "2026-11-24", quote: "LIGHT Level 8 ATK 3000 DEF 2500 Dragon／Effect" },
		{ id: "summon", kind: "card-text", cid: 22716, url: EN, read: "2026-11-24", quote: "When this card is added from the Deck to your hand, or a monster you control is destroyed by battle: You can reveal this card in your hand; Special Summon it." },
		{ id: "destroy", kind: "card-text", cid: 22716, url: EN, read: "2026-11-24", quote: "If this card is Special Summoned from the hand or Deck: You can destroy all monsters your opponent controls," },
		{ id: "lock", kind: "card-text", cid: 22716, url: EN, read: "2026-11-24", quote: "also you can only attack directly with \"Blue-Eyes\" monsters for the rest of this turn." },
		{ id: "once", kind: "card-text", cid: 22716, url: EN, read: "2026-11-24", quote: "You can only use each of the preceding effects of \"Blue-Eyes White Dragon, the White Phantom Beast\" once per turn." },
		{ id: "negate", kind: "card-text", cid: 22716, url: EN, read: "2026-11-24", quote: "When a card or effect is activated that targets this card on the field (Quick Effect): You can discard 1 card; negate that effect." },
		// OCG only. Konami's notes (補足情報, 2026-03-19), page read 2026-11-24. Its 7 Q&A entries: titles read, the two below opened; the others are about other cards.
		{ id: "notes-summon-hand", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■手札で発動できる誘発効果です。" },
		{ id: "notes-summon-damage-step", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-added-immediately", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■このカードがデッキから手札に加わったことを条件として発動する場合、デッキから手札に加わった直後にのみ発動できます。" },
		{ id: "notes-destroy-field", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-lock-applied", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■破壊する処理に成功したかに関わらず、この効果の発動や効果が無効にならなかったのであれば、『このターン、自分は「ブルーアイズ」モンスターでしか直接攻撃できない』状態になります。" },
		{ id: "notes-negate-chain", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■フィールドのこのカードを対象とする効果が発動した時に、直接チェーンして発動できます。" },
		{ id: "notes-negate-damage-step", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-negate-repeat", kind: "jp-notes", cid: 22716, url: NOTES, read: "2026-11-24", quote: "■同一チェーン上で複数回発動できます。" },
		// OCG only. Konami's Q&A fids 24176 (a card shown as a cost can be shown again in the same Chain) and 276 (the Draw Phase's normal draw), pages read 2026-11-24.
		{ id: "qa-reveal-again", kind: "jp-qa", cid: 22716, fid: 24176, url: qa(24176), read: "2026-11-24", quote: "以下の効果を発動する際も同様に、他の効果を発動する際のコストとして手札から見せたカードや、手札で効果を発動する際に見せたカードを、その同一チェーン上で発動する効果の際のコストとして見せることができます。" },
		{ id: "qa-draw-phase", kind: "jp-qa", cid: 22716, fid: 276, url: qa(276), read: "2026-11-24", quote: "が手札に加わった時でも、『このカードがデッキから手札に加わった時』に該当します。）" },
	],
	effects: ["facts", "summon", "destroy", "lock", "once", "negate"],
	rulings: [
		{ source: "notes-summon-hand" },
		{ source: "notes-summon-damage-step" },
		{ source: "notes-added-immediately" },
		{ source: "notes-destroy-field" },
		{ source: "notes-lock-applied" },
		{ source: "notes-negate-chain" },
		{ source: "notes-negate-damage-step" },
		{ source: "notes-negate-repeat" },
		{ source: "qa-reveal-again" },
		{ source: "qa-draw-phase", pending: "needs the Draw Phase's normal draw, which the core does not perform (no card is drawn when a turn begins)" },
	],
};
