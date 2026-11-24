import type { CardSources } from "../coverage";
import { type CardInstance, type Duel, moveCard, type Side } from "../duel";
import { ask, askZone, type CardDef, type EffectRecord } from "../effects";
import { hasPrintedName } from "../identity";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf, sendThisToGraveyard } from "./helpers";

const NAME = "Maiden of White";
const TRUE_LIGHT = "True Light";
const BEWD = "Blue-Eyes White Dragon";

/** "1 "True Light" from your hand, Deck, or GY". */
const trueLights = (duel: Duel, player: Side): number[] => [...duel.piles[player].hand, ...duel.piles[player].deck, ...duel.piles[player].graveyard].filter((id) => hasPrintedName(duel, id, TRUE_LIGHT));

/** The Spell & Trap Zones of a player with nothing in them, from their left. */
const freeSpellSlots = (duel: Duel, player: Side): number[] => {
	const taken = new Set(duel.piles[player].spell.map((id) => duel.cards[id]!.slot));
	return [0, 1, 2, 3, 4].filter((slot) => !taken.has(slot));
};

/** "1 "Blue-Eyes White Dragon" or 1 Level 1 LIGHT Tuner from your GY" that can be Special Summoned now. */
const fromGraveyard = (duel: Duel, player: Side): number[] =>
	duel.piles[player].graveyard.filter((id) => {
		const facts = factsOf(duel, id);
		const wanted = hasPrintedName(duel, id, BEWD) || (duel.defs[duel.cards[id]!.code]?.kind === "monster" && facts?.level === 1 && facts.attribute === "LIGHT" && facts.tuner === true);
		return wanted && canSpecialSummon(duel, player, id);
	});

/** Is the Maiden face-up in the Monster Zone (as `ctx.card` stands)? */
const faceUpInMonsterZone = (card: CardInstance): boolean => card.zone === "monster" && card.face === "up";

/** Is the duel in the Damage Step (an attack has gone past its declaration)? */
const inDamageStep = (duel: Duel): boolean => duel.battle !== null && duel.battle.step !== "declared";

const placeTrueLight = (range: "hand" | "field"): EffectRecord => ({
	type: "ignition",
	range,
	// Both records are the one printed effect: one use of the effect per turn.
	once: { scope: "name", key: "maiden-of-white-place" },
	condition: (duel, { player }) => trueLights(duel, player).length > 0 && freeSpellSlots(duel, player).length > 0,
	cost: sendThisToGraveyard,
	operation: (duel, link) =>
		ask(duel, link.player, trueLights(duel, link.player), (board, picked) =>
			askZone(board, link.player, freeSpellSlots(board, link.player), (placed, slot) => moveCard(placed, picked, { zone: "spell", face: "up", slot })),
		),
});

const special: EffectRecord["operation"] = (duel, link) => ask(duel, link.player, fromGraveyard(duel, link.player), (board, picked) => askSpecialSummon(board, link.player, picked));

/** One timing of the third effect: both share its once per turn. */
const inAnswer = (more: Partial<EffectRecord>): EffectRecord => ({
	type: "quick",
	range: "field",
	categories: ["special-summon"],
	once: { scope: "name", key: "maiden-of-white-answer" },
	operation: special,
	...more,
});

/**
 * "You can send this card from your hand or field to the GY; place 1 "True Light" from your hand, Deck, or GY, face-up in your Spell & Trap
 * Zone. If you Special Summon "Blue-Eyes White Dragon" while this card is in your GY (except during the Damage Step): You can Special Summon
 * this card. When a card or effect is activated that targets this card on the field, or when this card is targeted for an attack (Quick
 * Effect): You can Special Summon 1 "Blue-Eyes White Dragon" or 1 Level 1 LIGHT Tuner from your GY. You can only use each effect of "Maiden of
 * White" once per turn." A Level 1 LIGHT Spellcaster Tuner.
 *
 * - First effect: an Ignition Effect of the hand or the Monster Zone (two records for one effect, sharing its use); sending itself is the
 *   cost. The card is placed face-up in the Spell & Trap Zone the player chooses, without being activated: it does not need Spell/Trap Cards
 *   to be activatable (Konami's Q&A fid 24051, OCG only). It can be used only with a "True Light" in the hand, Deck or GY and a free
 *   Spell & Trap Zone (the cost does not free one: this is a monster): YGOProJudge only (asked 2026-11-24, it cited no official source).
 * - Second effect: an optional "if" Trigger Effect of the Graveyard, never in the Damage Step (notes). It Special Summons this very card
 *   (nothing happens if it has left the Graveyard). "You Special Summon": the player who Summons is the Maiden's controller.
 * - Third effect: a Quick Effect of the Monster Zone, face-up (notes), in two timings (two records sharing one use): chained directly to the
 *   activation of a card or effect that targets this card (the link on top of the chain, whoever activated it), or when this card is the
 *   target of an attack declared (`attack-declared`). Never in the Damage Step: only effects that change ATK/DEF can be activated there. The
 *   monster is chosen when it resolves; the effect is activated only while there is one to Summon (the core's reading, as for other Summons).
 * - The text's "once per turn" for each effect is by name (`once.name`).
 */
export const MAIDEN_OF_WHITE: CardDef = {
	code: "maiden-of-white",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Spellcaster", level: 1, tuner: true, atk: 0, def: 0, mentions: [TRUE_LIGHT, BEWD, NAME] },
	effects: [
		placeTrueLight("hand"),
		placeTrueLight("field"),
		{
			type: "trigger",
			range: "graveyard",
			timing: "if",
			once: { scope: "name", key: "maiden-of-white-revive" },
			categories: ["special-summon"],
			// An effect that Summons is activated only while its card can be Summoned (no free Monster Zone: not offered, the use is kept).
			condition: (duel, { player, card }) => canSpecialSummon(duel, player, card.id),
			event: (duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.player === card.controller && hasPrintedName(duel, event.card.id, BEWD) && !inDamageStep(duel),
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				return now.zone === "graveyard" && now.moves === link.card.moves ? askSpecialSummon(duel, link.player, now.id) : duel;
			},
		},
		inAnswer({
			condition: (duel, { player, card }) => {
				const top = duel.chain[duel.chain.length - 1];
				const targeted = top !== undefined && top.targets.some((id, at) => id === card.id && duel.cards[id]!.moves === top.targetMoves[at]);
				return targeted && faceUpInMonsterZone(card) && fromGraveyard(duel, player).length > 0;
			},
		}),
		inAnswer({
			event: (duel, event, { card }) => event.type === "attack-declared" && event.target?.id === card.id && faceUpInMonsterZone(duel.cards[card.id]!),
			condition: (duel, { player, card }) => faceUpInMonsterZone(card) && fromGraveyard(duel, player).length > 0,
		}),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20602&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;

export const MAIDEN_OF_WHITE_SOURCES: CardSources = {
	code: "maiden-of-white",
	cid: 20602,
	french: {
		text: "Vous pouvez envoyer cette carte depuis votre main ou Terrain au Cimetière ; placez face recto 1 \"Véritable Lumière\" depuis votre main, Deck ou Cimetière dans votre Zone Magie & Piège. Si vous Invoquez Spécialement \"Dragon Blanc aux Yeux Bleus\" tant que cette carte est dans votre Cimetière (sauf durant la Damage Step) : vous pouvez Invoquer Spécialement cette carte. Lorsqu'une carte ou un effet qui cible cette carte sur le Terrain est activé, ou lorsque cette carte est ciblée par une attaque (Effet Rapide) : vous pouvez Invoquer Spécialement 1 \"Dragon Blanc aux Yeux Bleus\" ou 1 Syntoniseur LUMIÈRE de Niveau 1 depuis votre Cimetière. Vous ne pouvez utiliser chaque effet de \"Demoiselle Blanche\" qu'une fois par tour.",
		url: konamiCardUrl(20602, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "place", kind: "card-text", cid: 20602, url: konamiCardUrl(20602, "en"), read: "2026-11-24", quote: "You can send this card from your hand or field to the GY; place 1 \"True Light\" from your hand, Deck, or GY, face-up in your Spell & Trap Zone." },
		{ id: "revive", kind: "card-text", cid: 20602, url: konamiCardUrl(20602, "en"), read: "2026-11-24", quote: "If you Special Summon \"Blue-Eyes White Dragon\" while this card is in your GY (except during the Damage Step): You can Special Summon this card." },
		{ id: "protect", kind: "card-text", cid: 20602, url: konamiCardUrl(20602, "en"), read: "2026-11-24", quote: "When a card or effect is activated that targets this card on the field, or when this card is targeted for an attack (Quick Effect): You can Special Summon 1 \"Blue-Eyes White Dragon\" or 1 Level 1 LIGHT Tuner from your GY." },
		{ id: "once", kind: "card-text", cid: 20602, url: konamiCardUrl(20602, "en"), read: "2026-11-24", quote: "You can only use each effect of \"Maiden of White\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-09-07), page read 2026-11-24.
		{ id: "notes-place-hand-or-field", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "■手札またはモンスターゾーンで発動できる起動効果です。" },
		{ id: "notes-revive-gy", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "■墓地で発動できる誘発効果です。" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-protect-field", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-protect-attacked", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンに表側表示で存在するこのカードが攻撃の対象になった時に発動できます。" },
		{ id: "notes-protect-chain", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "モンスターゾーンに表側表示で存在するこのカードを対象とする効果が発動した時、その発動に直接チェーンしてこの効果を発動できます。" },
		{ id: "notes-protect-own", kind: "jp-notes", cid: 20602, url: NOTES, read: "2026-11-24", quote: "自分がこのカードを対象として他の効果を発動した時、相手にチェーンの確認を行い、相手が効果を発動しなければ、自分がこの効果をチェーンして発動できます。" },
		// OCG only. Konami's Q&A on the card (3 entries; titles of all read 2026-11-24, the three below opened).
		{ id: "qa-place-not-activation", kind: "jp-qa", cid: 20602, fid: 24051, url: qa(24051), read: "2026-11-24", quote: "この処理は魔法カードの発動や罠カードの発動としては扱わないためです。" },
		{ id: "qa-banish-instead", kind: "jp-qa", cid: 20602, fid: 14540, url: qa(14540), read: "2026-11-24", quote: "（墓地へ送られるカードが除外されてしまい、コストとしてカードを墓地へ送ることができないためです。）" },
		{ id: "qa-alternative-white-dragon", kind: "jp-qa", cid: 20602, fid: 56, url: qa(56), read: "2026-11-24", quote: "「青眼の亜白龍」は『①：このカードのカード名は、フィールド・墓地に存在する限り「青眼の白龍」として扱う』効果によって、モンスターゾーン（表側表示）では「青眼の白龍」として扱われます。" },
	],
	effects: ["place", "revive", "protect", "once"],
	rulings: [
		{ source: "notes-place-hand-or-field" },
		{ source: "notes-revive-gy" },
		{ source: "notes-damage-step" },
		{ source: "notes-protect-field" },
		{ source: "notes-protect-attacked" },
		{ source: "notes-protect-chain" },
		{ source: "notes-protect-own" },
		{ source: "qa-place-not-activation" },
		{ source: "qa-banish-instead", pending: "needs an effect that banishes cards sent to the GY instead (Macro Cosmos and the like), which the core does not have" },
		{ source: "qa-alternative-white-dragon", pending: "needs Blue-Eyes Alternative White Dragon (its name becomes \"Blue-Eyes White Dragon\" on the field and in the GY), which the core does not have; effective names are not modelled" },
	],
};
