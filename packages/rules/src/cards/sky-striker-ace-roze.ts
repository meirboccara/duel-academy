import { askMay } from "../choices";
import type { CardSources } from "../coverage";
import type { Duel, Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { breakEffect, leftFieldBy } from "../events";
import { belongsTo, hasPrintedName } from "../identity";
import { negateCardEffects } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";

const NAME = "Sky Striker Ace - Roze";
/** The first Extra Monster Zone slot: a monster with a slot from here on is in an Extra Monster Zone. */
const FIRST_EXTRA_MONSTER_ZONE = 5;

/** Is the duel in the Damage Step (an attack has gone past its declaration)? */
const inDamageStep = (duel: Duel): boolean => duel.battle !== null && duel.battle.step !== "declared";

/** "1 face-up monster your opponent controls": the monsters whose effects Roze may negate. */
const negatable = (duel: Duel, player: Side): number[] => (player === "you" ? duel.piles.rival.monster : duel.piles.you.monster).filter((id) => duel.cards[id]!.face === "up");

/** "Special Summon this card" from where it is (the hand or the Graveyard), when it has not moved since the effect was activated. */
const summonItself = (zone: "hand" | "graveyard"): NonNullable<CardDef["effects"]>[number]["operation"] => (duel, link) => {
	const now = duel.cards[link.card.id]!;
	return now.zone === zone && now.moves === link.card.moves ? askSpecialSummon(duel, link.player, now.id) : duel;
};

/**
 * "If a "Sky Striker Ace" monster(s) is Normal or Special Summoned, except "Sky Striker Ace - Roze" (except during the Damage Step): You can Special
 * Summon this card from your hand. If an opponent's monster in the Extra Monster Zone is destroyed by battle, or leaves the field by your card effect,
 * while this card is in your GY: You can Special Summon this card, then you can negate the effects of 1 face-up monster your opponent controls, until
 * the end of this turn. You can only use each effect of "Sky Striker Ace - Roze" once per turn." A LIGHT Warrior Effect Monster of Level 4, "Sky
 * Striker" and "Sky Striker Ace" by its name.
 *
 * - First effect: an optional "if" Trigger Effect of the hand (notes). Triggered by the Normal or Special Summon of a face-up "Sky Striker Ace" monster
 *   other than a card named "Sky Striker Ace - Roze" (`summoned` with `how` normal or special: a Flip Summon is neither). The text says "a ... monster",
 *   not "you control": a monster of either player triggers it (no Konami page on that; the card text). Never when the Summon is made during the Damage
 *   Step (notes). It is offered only when a Monster Zone is free (the core's reading of "cannot be activated when it cannot be done").
 * - Second effect: an optional "if" Trigger Effect of the Graveyard, in the Damage Step too (notes). It is triggered by a monster the opponent controls,
 *   in an Extra Monster Zone (`before.slot`), destroyed by battle (at the end of the Damage Step) or leaving the field by the effect of a card of the
 *   player (`leftFieldBy`: destroyed, banished, returned, sent or Tributed by it; not a material of a Summon, not a move to a Spell & Trap Zone:
 *   Konami's Q&A fids 23445 and 23614, tested with Raye). Roze must be in the Graveyard before: the core never triggers a card that arrived with the
 *   event (notes). It Special Summons this card, then the player may negate the effects of 1 face-up monster the opponent controls until the end of this
 *   turn: the monster is chosen when it resolves (not a target), after the Summon (the two are not simultaneous: notes), and only when there is one.
 * - "Each effect once per turn": two uses by name, one for each effect.
 * - Limit: Konami's Q&A fid 24006 says a player activates only one trigger effect that Special Summons itself and can be activated in the hand per
 *   chain, whichever place it is activated from; the core has one use limit per effect, so this is not modelled (it matters only with another such
 *   card of the same player: none in the exact Sky Striker list).
 */
export const SKY_STRIKER_ACE_ROZE: CardDef = {
	code: "sky-striker-ace-roze",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Warrior", level: 4, atk: 1500, def: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME] },
	effects: [
		{
			type: "trigger",
			range: "hand",
			timing: "if",
			categories: ["special-summon"],
			once: { scope: "name", key: "sky-striker-ace-roze-hand" },
			condition: (duel, { player, card }) => canSpecialSummon(duel, player, card.id),
			event: (duel, event) =>
				event.type === "summoned" && (event.how === "normal" || event.how === "special") && event.card.face === "up" && belongsTo(duel, event.card.id, "Sky Striker Ace") && !hasPrintedName(duel, event.card.id, NAME) && !inDamageStep(duel),
			operation: summonItself("hand"),
		},
		{
			type: "trigger",
			range: "graveyard",
			timing: "if",
			// It Special Summons from the Graveyard (Konami's Q&A fid 23215, about Zero's effect: what answers "an effect that Special Summons from the GY").
			categories: ["special-summon", "summon-from-graveyard"],
			once: { scope: "name", key: "sky-striker-ace-roze-revive" },
			condition: (duel, { player, card }) => canSpecialSummon(duel, player, card.id),
			event: (_duel, event, { player }) => {
				if (event.type !== "moved" || event.before.zone !== "monster" || event.before.controller === player || event.before.slot === null || event.before.slot < FIRST_EXTRA_MONSTER_ZONE) return false;
				if (event.by === "battle" && event.reason === "destroyed") return true;
				const by = leftFieldBy(event);
				return by !== null && by.player === player;
			},
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				if (now.zone !== "graveyard" || now.moves !== link.card.moves) return duel;
				return askSpecialSummon(duel, link.player, now.id, {
					then: (done) =>
						negatable(done, link.player).length === 0
							? done
							: askMay(breakEffect(done), link.player, link.card.id, (board) => ask(board, link.player, negatable(board, link.player), (next, picked) => negateCardEffects(next, picked, next.turn.number, link))),
				});
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=14829&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(14829, "en");

export const SKY_STRIKER_ACE_ROZE_SOURCES: CardSources = {
	code: "sky-striker-ace-roze",
	cid: 14829,
	french: {
		text: "Si un ou plusieurs monstres \"Assaut de l'Air - As\" (\"Assaut de l'Air - As - Roze\" exclu) sont Invoqués Normalement ou Spécialement (sauf durant la Damage Step) : vous pouvez Invoquer Spécialement cette carte depuis votre main. Si un monstre de l'adversaire dans la Zone Monstre Extra est détruit au combat, ou quitte le Terrain par votre effet de carte, tant que cette carte est dans votre Cimetière : vous pouvez Invoquer Spécialement cette carte, puis vous pouvez annuler les effets d'1 monstre face recto contrôlé par votre adversaire, jusqu'à la fin de ce tour. Vous ne pouvez utiliser chaque effet de \"Assaut de l'Air - As - Roze\" qu'une fois par tour.",
		url: konamiCardUrl(14829, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 14829, url: EN, read: "2026-11-26", quote: "LIGHT Level 4 ATK 1500 DEF 1500 Warrior ／ Effect" },
		{ id: "hand-summon", kind: "card-text", cid: 14829, url: EN, read: "2026-11-26", quote: "If a \"Sky Striker Ace\" monster(s) is Normal or Special Summoned, except \"Sky Striker Ace - Roze\" (except during the Damage Step): You can Special Summon this card from your hand." },
		{ id: "grave-summon", kind: "card-text", cid: 14829, url: EN, read: "2026-11-26", quote: "If an opponent's monster in the Extra Monster Zone is destroyed by battle, or leaves the field by your card effect, while this card is in your GY: You can Special Summon this card," },
		{ id: "negate", kind: "card-text", cid: 14829, url: EN, read: "2026-11-26", quote: "then you can negate the effects of 1 face-up monster your opponent controls, until the end of this turn." },
		{ id: "once", kind: "card-text", cid: 14829, url: EN, read: "2026-11-26", quote: "You can only use each effect of \"Sky Striker Ace - Roze\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2019-10-12), page read 2026-11-26.
		{ id: "notes-hand", kind: "jp-notes", cid: 14829, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンに「閃刀姫－ロゼ」以外の「閃刀姫」モンスターが、召喚または表側表示で特殊召喚された場合に発動できます。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 14829, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-grave", kind: "jp-notes", cid: 14829, url: NOTES, read: "2026-11-26", quote: "■墓地で発動できる誘発効果です。" },
		{ id: "notes-already-in-grave", kind: "jp-notes", cid: 14829, url: NOTES, read: "2026-11-26", quote: "■この効果を発動するためには、エクストラモンスターゾーンの相手モンスターが、戦闘で破壊されたダメージステップ終了時の時点、または自分のカードの効果でフィールドから離れた時点でこのカードが既に墓地に存在する必要があります。" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 14829, url: NOTES, read: "2026-11-26", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-sequential", kind: "jp-notes", cid: 14829, url: NOTES, read: "2026-11-26", quote: "■処理時に、『このカードを特殊召喚する』処理を行います。特殊召喚に成功した場合、その後、『相手フィールドの表側表示モンスター１体を選んでその効果をターン終了時まで無効』の処理を行うことができます。これらの処理は同時に行われません。" },
		// OCG only. Konami's Q&A fid 24006 (2026-09-25), page read 2026-11-26: one trigger effect that Special Summons itself from the hand (or the hand and the
		// Graveyard) per chain, for each player. Its other Q&A, fids 24189 (2026-05-11) and 24184 (2025-06-12), are about "Sky Striker Ace = Zero" and cards of neither list.
		{ id: "qa-sensor-array-24189", kind: "jp-qa", cid: 14829, fid: 24189, url: qa(24189), read: "2026-11-26", quote: "「閃刀姫＝ゼロ」の『フィールドのカード１枚を破壊できる』効果で「センサー万別」や「御前試合」を破壊した場合は、特殊召喚した「閃刀姫－レイ」と「閃刀姫－ロゼ」はどちらもフィールドに残ります" },
		{ id: "qa-attack-position-24184", kind: "jp-qa", cid: 14829, fid: 24184, url: qa(24184), read: "2026-11-26", quote: "攻撃表示で特殊召喚した「閃刀姫－レイ」「閃刀姫－ロゼ」はどちらも攻撃表示のままとなります。" },
		{ id: "qa-self-summon-per-chain-24006", kind: "jp-qa", cid: 14829, fid: 24006, url: qa(24006), read: "2026-11-26", quote: "手札で発動する場合でも墓地で発動する場合でも、この種の誘発効果の発動は同一チェーン上で１度しか行えません。" },
	],
	effects: ["facts", "hand-summon", "grave-summon", "negate", "once"],
	rulings: [
		{ source: "notes-hand" },
		{ source: "notes-no-damage-step" },
		{ source: "notes-grave" },
		{ source: "notes-already-in-grave" },
		{ source: "notes-damage-step" },
		{ source: "notes-sequential" },
		{ source: "qa-sensor-array-24189", pending: "about the cards named 「センサー万別」 and 「御前試合」 in Konami's Japanese text, destroyed by Zero's effect: neither is in the core's lists" },
		{ source: "qa-attack-position-24184", pending: "needs a monster that changes the position of the monsters on the field (\"Number 41: Bagooska the Terribly Tired Tapir\"); Special Summoned in Attack Position, the two stay so while its effect is only applied after the chain block" },
		{ source: "qa-self-summon-per-chain-24006", pending: "the core has one use limit per effect, not a limit shared by the self-Summoning trigger effects of a player in one chain; it matters only with another such card of the same player (none in the exact Sky Striker list), so it is left unmodelled" },
	],
};
