import { activationNegated, negateActivation } from "../chain";
import type { CardSources } from "../coverage";
import type { Duel, Side } from "../duel";
import { ask, type CardDef, type EffectRecord } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { addModifier } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Blue-Eyes Ultimate Spirit Dragon";
const BLUE_EYES = "Blue-Eyes";

/** "1 LIGHT Dragon monster from your GY, except "Blue-Eyes Ultimate Spirit Dragon"" that can be Special Summoned now (a zone, no lock on it, properly Summoned first). */
const toSummon = (duel: Duel, player: Side): number[] =>
	duel.piles[player].graveyard.filter((id) => {
		const facts = factsOf(duel, id);
		return duel.defs[duel.cards[id]!.code]?.kind === "monster" && facts?.attribute === "LIGHT" && facts.monsterType === "Dragon" && !hasPrintedName(duel, id, NAME) && canSpecialSummon(duel, player, id);
	});

/** "If this card is destroyed by battle or card effect": it was destroyed on the field and went to `zone` (face-up when banished), where Konami's notes say it triggers. */
const destroyedTo = (zone: "graveyard" | "banished"): EffectRecord["event"] => (_duel, event, { card }) =>
	event.type === "moved" && event.before.id === card.id && event.before.zone === "monster" && event.reason === "destroyed" && (event.by === "battle" || event.destruction?.cause === "battle" || event.destruction?.cause === "effect") && event.after.zone === zone && (zone === "graveyard" || event.after.face === "up");

const summonFromGraveyard = (zone: "graveyard" | "banished"): EffectRecord => ({
	type: "trigger",
	range: zone,
	timing: "if",
	categories: ["special-summon"],
	once: { scope: "name", key: "blue-eyes-ultimate-spirit-dragon-summon" },
	condition: (duel, { player }) => toSummon(duel, player).length > 0,
	event: destroyedTo(zone),
	operation: (duel, link) => ask(duel, link.player, toSummon(duel, link.player), (board, picked) => askSpecialSummon(board, link.player, picked)),
});

/**
 * "2+ Tuners + 1 non-Tuner "Blue-Eyes" monster. Your opponent cannot banish cards from your GY. You can only use each of the following effects of
 * "Blue-Eyes Ultimate Spirit Dragon" once per turn. When a card or effect is activated on the field (Quick Effect): You can negate the activation, and
 * if you do, this card gains 1000 ATK until the end of this turn. If this card is destroyed by battle or card effect: You can Special Summon 1 LIGHT
 * Dragon monster from your GY, except "Blue-Eyes Ultimate Spirit Dragon"." A LIGHT Dragon Synchro Effect Monster of Level 12.
 *
 * - Procedure: the Synchro Summon with 2 or more Tuners (`tuners: { min: 2 }`) and 1 non-Tuner that is a "Blue-Eyes" monster (`facts.archetypes`: the
 *   name's own archetype, which no Konami page lists for this card), Levels adding up to 12.
 * - First effect: a Continuous Effect of the Monster Zone (notes): the opponent cannot banish cards from this card's controller's Graveyard
 *   (`banish-from-graveyard` lock with `banisher: "opponent"`); the controller's own banishments, and the opponent's from their own Graveyard, go on.
 * - Second effect: a Quick Effect of the Monster Zone, also in the Damage Step (notes, OCG only: `damageStep: true`), chained directly to a card or
 *   effect "activated on the field" (the link on top whose card was on the field when activated: a monster effect, or a Spell or Trap Card, which is
 *   placed on the field to be activated, a Continuous Spell or Trap included: Konami's Q&A fid 24092). Not an effect activated from the hand or the
 *   Graveyard. When it resolves (notes), if the activation was negated the card gains 1000 ATK until the end of the turn; that gain is the card's own
 *   effect on itself, so it stops while its effects are negated, and with the card gone from the Monster Zone or turned face-down (a new card).
 *   Once per turn by name, apart from the other effect.
 * - Third effect: an optional "if" Trigger Effect, activated in the Graveyard when it was destroyed by battle or by a card effect and sent there, while
 *   banished when it was destroyed and banished face-up, also in the Damage Step (notes). The monster is chosen when the effect resolves (no
 *   target); the effect is activated only while a LIGHT Dragon monster can be Special Summoned, none being "Blue-Eyes Ultimate Spirit Dragon" by name.
 */
export const BLUE_EYES_ULTIMATE_SPIRIT_DRAGON: CardDef = {
	code: "blue-eyes-ultimate-spirit-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 12, atk: 3500, def: 4000, archetypes: [BLUE_EYES], mentions: [NAME] },
	procedure: { kind: "synchro", tuners: { min: 2 }, nonTuners: { min: 1, max: 1 }, nonTuner: (duel, card) => belongsTo(duel, card.id, BLUE_EYES) },
	effects: [
		{ type: "continuous", range: "field", affects: () => false, modifies: (_duel, source) => [{ kind: "lock", what: "banish-from-graveyard", who: source.controller, banisher: "opponent" }] },
		{
			type: "quick",
			damageStep: true,
			categories: ["negate"],
			once: { scope: "name", key: "blue-eyes-ultimate-spirit-dragon-negate" },
			condition: (duel) => {
				const zone = duel.chain.at(-1)?.card.zone;
				return zone === "monster" || zone === "spell" || zone === "field";
			},
			operation: (duel, link, index) => {
				if (link.answers === null) return duel;
				const negated = negateActivation(duel, link.answers);
				if (!activationNegated(negated, link.answers)) return negated;
				const now = negated.cards[link.card.id]!;
				// The gain is applied only by a card still in the Monster Zone, face-up, and still the card that activated.
				if (now.zone !== "monster" || now.face !== "up" || now.moves !== link.card.moves) return negated;
				return addModifier(negated, { affects: { card: now.id, moves: now.moves }, until: negated.turn.number, layer: { kind: "add", stat: "atk", by: 1000 }, by: link, own: true });
			},
		},
		summonFromGraveyard("graveyard"),
		summonFromGraveyard("banished"),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20607&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(20607, "en");

export const BLUE_EYES_ULTIMATE_SPIRIT_DRAGON_SOURCES: CardSources = {
	code: "blue-eyes-ultimate-spirit-dragon",
	cid: 20607,
	french: {
		text: "2+ Syntoniseurs + 1 monstre non-Syntoniseur \"Yeux Bleus\"\nVotre adversaire ne peut pas bannir de cartes depuis votre Cimetière. Vous ne pouvez utiliser chacun des effets suivants de \"Dragon Esprit Ultime aux Yeux Bleus\" qu'une fois par tour. Lorsqu'une carte ou un effet est activé sur le Terrain (Effet Rapide) : vous pouvez annuler l'activation, et si vous le faites, cette carte gagne 1000 ATK jusqu'à la fin de ce tour. Si cette carte est détruite au combat ou par un effet de carte : vous pouvez Invoquer Spécialement 1 monstre LUMIÈRE Dragon (\"Dragon Esprit Ultime aux Yeux Bleus\" exclu) depuis votre Cimetière.",
		url: konamiCardUrl(20607, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20607, url: EN, read: "2026-11-25", quote: "Blue-Eyes Ultimate Spirit Dragon LIGHT Level 12 ATK 3500 DEF 4000 Dragon ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 20607, url: EN, read: "2026-11-25", quote: "2+ Tuners + 1 non-Tuner \"Blue-Eyes\" monster" },
		{ id: "lock", kind: "card-text", cid: 20607, url: EN, read: "2026-11-25", quote: "Your opponent cannot banish cards from your GY." },
		{ id: "once", kind: "card-text", cid: 20607, url: EN, read: "2026-11-25", quote: "You can only use each of the following effects of \"Blue-Eyes Ultimate Spirit Dragon\" once per turn." },
		{ id: "negate", kind: "card-text", cid: 20607, url: EN, read: "2026-11-25", quote: "When a card or effect is activated on the field (Quick Effect): You can negate the activation, and if you do, this card gains 1000 ATK until the end of this turn." },
		{ id: "special-summon", kind: "card-text", cid: 20607, url: EN, read: "2026-11-25", quote: "If this card is destroyed by battle or card effect: You can Special Summon 1 LIGHT Dragon monster from your GY, except \"Blue-Eyes Ultimate Spirit Dragon\"." },
		// OCG only. Konami's notes (補足情報, 2024-09-07), page read 2026-11-25. Its 2 Q&A entries (fids 24092 and 21322) were opened and read in full.
		{ id: "notes-lock-field", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "【①の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-negate-quick", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "【②の効果について】■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-negate-damage-step", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-negate-resolution", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "■処理時に、『その発動を無効にし』の処理を行い、発動の無効に成功した場合、『このカードの攻撃力をターン終了時まで１０００アップする』処理を行います。" },
		{ id: "notes-atk-ends", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "■このカードがモンスターゾーンに存在しなくなった場合、表側表示から裏側守備表示になった場合、このカードの効果が無効になった場合に、『このカードの攻撃力をターン終了時まで１０００アップする』効果の適用はなくなります。" },
		{ id: "notes-destroyed-trigger", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "■このカードが戦闘または効果で破壊され、墓地へ送られた場合には墓地で、表側表示で除外された場合には除外されている状態で発動できます。" },
		{ id: "notes-destroyed-damage-step", kind: "jp-notes", cid: 20607, url: NOTES, read: "2026-11-25", quote: "表側表示で除外された場合には除外されている状態で発動できます。■ダメージステップでも発動できます。" },
		{ id: "qa-continuous-activation", kind: "jp-qa", cid: 20607, fid: 24092, url: qa(24092), read: "2026-11-25", quote: "魔法・罠カードのカードの発動は、”カードの効果の発動”に該当します。" },
		{ id: "qa-magic-bullet", kind: "jp-qa", cid: 20607, fid: 21322, url: qa(21322), read: "2026-11-25", quote: "（B）発動できません。" },
	],
	effects: ["facts", "procedure", "lock", "once", "negate", "special-summon"],
	rulings: [
		{ source: "notes-lock-field" },
		{ source: "notes-negate-quick" },
		{ source: "notes-negate-damage-step" },
		{ source: "notes-negate-resolution" },
		{ source: "notes-atk-ends" },
		{ source: "notes-destroyed-trigger" },
		{ source: "notes-destroyed-damage-step" },
		{ source: "qa-continuous-activation" },
		{ source: "qa-magic-bullet", pending: "Fid 21322 is about the \"Magical Bullet\" monsters' column effect, which the core does not have" },
	],
};
