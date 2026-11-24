import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef, targetsOf } from "../effects";
import { hasPrintedName, mentionsCard } from "../identity";
import { level } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Crimson Dragon";

/** "1 Spell/Trap that mentions "Crimson Dragon"" in the player's Deck (the name in the text, not the card's own name or archetype: Konami's notes). */
const toAdd = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => duel.defs[duel.cards[id]!.code]?.kind !== "monster" && mentionsCard(duel, id, NAME));

const isSynchro = (duel: Duel, id: number): boolean => factsOf(duel, id)?.frame === "synchro";

/** "1 Level 7 or higher Synchro Monster on the field, except "Crimson Dragon"": face-up, in a Monster Zone. */
const fieldTargets = (duel: Duel): number[] => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up" && isSynchro(duel, id) && !hasPrintedName(duel, id, NAME) && level(duel, id) >= 7);

/**
 * "1 Dragon Synchro Monster from your Extra Deck with the same Level as the targeted monster", read in the Extra Deck as it is before this card
 * returns to it (the return and the Summon are done at the same time: Konami's notes, OCG, so this card is not one of them), and that can be
 * Special Summoned as a Synchro Summon once this card has left its zone (the same notes: the zone it leaves is free for the Summon).
 */
const toSummon = (duel: Duel, player: Side, crimson: number, sameLevel: number): number[] => {
	const after = moveCard(duel, crimson, { zone: "extra" });
	return duel.piles[player].extra.filter((id) => id !== crimson && isSynchro(duel, id) && factsOf(duel, id)?.monsterType === "Dragon" && level(duel, id) === sameLevel && canSpecialSummon(after, player, id, "synchro"));
};

/**
 * "1 Tuner + 1+ non-Tuner monsters. If this card is Special Summoned: You can add 1 Spell/Trap that mentions "Crimson Dragon" from your Deck to
 * your hand. (Quick Effect): You can target 1 Level 7 or higher Synchro Monster on the field, except "Crimson Dragon"; return this card to the
 * Extra Deck, and if you do, Special Summon 1 Dragon Synchro Monster from your Extra Deck with the same Level as the targeted monster (this is
 * treated as a Synchro Summon). You can only use each effect of "Crimson Dragon" once per turn." A LIGHT Dragon Synchro Effect Monster of Level 12.
 *
 * - Procedure: the generic Synchro Summon (`procedure: { kind: "synchro" }`: 1 Tuner and 1 or more non-Tuners, whose Levels add up to 12).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone, also in the Damage Step (Konami's notes, OCG), for any Special Summon of
 *   the card. The card is chosen when it resolves (no target). "A Spell/Trap that mentions "Crimson Dragon"" is a card whose text names it as a
 *   card name (`facts.mentions`), not one that only has it in its own name (notes). It is activated only while there is a card to add
 *   (`search-needs-a-card`).
 * - Second effect: a Quick Effect of the Monster Zone, not in the Damage Step (notes; the core lets only effects that change ATK or DEF in it).
 *   It targets a face-up Synchro Monster of Level 7 or higher on either field, other than a monster named "Crimson Dragon", and is activated only
 *   while a Dragon Synchro Monster of the Extra Deck of that Level could be Summoned (the core's reading of "cannot activate when it cannot be
 *   done"). When it resolves (notes): if this card is in the Monster Zone, in any position, it returns to the Extra Deck, and if the target is
 *   still face-up in a Monster Zone the player chooses a Dragon Synchro Monster of the same Level and Special Summons it as a Synchro Summon
 *   (`specialSummon` with `kind: "synchro"`: properly Summoned, a Synchro Summon trigger answers it, and a monster that "must be Synchro Summoned"
 *   may be chosen). The return and the Summon are "treated as simultaneous" (notes): the candidates are read in the Extra Deck as it was before
 *   the return, and the zone the card leaves is free for the Summon. The core performs the two moves one after the other, so the two events are
 *   raised in sequence, not in a shared batch: a limit of the core, with no effect on a card of this list.
 * - Once per turn: each effect once per turn, by name, the two apart.
 */
export const CRIMSON_DRAGON: CardDef = {
	code: "crimson-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 12, atk: 0, def: 0, mentions: [NAME] },
	procedure: { kind: "synchro" },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "name", key: "crimson-dragon-search" },
			condition: (duel, { player }) => toAdd(duel, player).length > 0,
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.id === card.id,
			operation: (duel, link) => ask(duel, link.player, toAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
		{
			type: "quick",
			categories: ["to-extra-deck", "special-summon"],
			once: { scope: "name", key: "crimson-dragon-return" },
			condition: (duel, { player, card }) => card.zone === "monster" && fieldTargets(duel).some((id) => toSummon(duel, player, card.id, level(duel, id)).length > 0),
			target: (duel, { player, card }) => fieldTargets(duel).filter((id) => toSummon(duel, player, card.id, level(duel, id)).length > 0),
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				if (now.zone !== "monster") return duel;
				const target = targetsOf(duel, link)[0];
				// Read before the return: "from your Extra Deck" as it is when the two things are done together.
				const choices = target && target.zone === "monster" && target.face === "up" ? toSummon(duel, link.player, now.id, level(duel, target.id)) : [];
				const returned = moveCard(duel, now.id, { zone: "extra", effect: link });
				// "And if you do": nothing happens after a card that did not return (unaffected by the effect).
				if (returned.cards[now.id]!.zone !== "extra" || choices.length === 0) return returned;
				return ask(returned, link.player, choices, (board, picked) => askSpecialSummon(board, link.player, picked, { kind: "synchro" }));
			},
		},
	],
};

const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=18825&request_locale=ja";
const EN = konamiCardUrl(18825, "en");

export const CRIMSON_DRAGON_SOURCES: CardSources = {
	code: "crimson-dragon",
	cid: 18825,
	french: {
		text: "1 Syntoniseur + 1+ monstre non-Syntoniseur\nSi cette carte est Invoquée Spécialement : vous pouvez ajouter 1 Magie/Piège qui mentionne \"Dragon Cramoisi\" depuis votre Deck à votre main. (Effet Rapide) : vous pouvez cibler 1 Monstre Synchro de min. Niveau 7 sur le Terrain (\"Dragon Cramoisi\" exclu) ; renvoyez cette carte à l'Extra Deck, et si vous le faites, Invoquez Spécialement 1 Monstre Synchro Dragon depuis votre Extra Deck du même Niveau que le monstre ciblé (ceci est traité comme Invocation Synchro). Vous ne pouvez utiliser chaque effet de \"Dragon Cramoisi\" qu'une fois par tour.",
		url: konamiCardUrl(18825, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 18825, url: EN, read: "2026-11-24", quote: "Crimson Dragon LIGHT Level 12 ATK 0 DEF 0 Dragon ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 18825, url: EN, read: "2026-11-24", quote: "1 Tuner + 1+ non-Tuner monsters" },
		{ id: "search", kind: "card-text", cid: 18825, url: EN, read: "2026-11-24", quote: "If this card is Special Summoned: You can add 1 Spell/Trap that mentions \"Crimson Dragon\" from your Deck to your hand." },
		{ id: "return", kind: "card-text", cid: 18825, url: EN, read: "2026-11-24", quote: "(Quick Effect): You can target 1 Level 7 or higher Synchro Monster on the field, except \"Crimson Dragon\"; return this card to the Extra Deck, and if you do, Special Summon 1 Dragon Synchro Monster from your Extra Deck with the same Level as the targeted monster" },
		{ id: "treated", kind: "card-text", cid: 18825, url: EN, read: "2026-11-24", quote: "(this is treated as a Synchro Summon)" },
		{ id: "once", kind: "card-text", cid: 18825, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Crimson Dragon\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2023-04-22), page read 2026-11-24. Its one Q&A, fid 12750 ("Solemn Judgment" and a Summon treated as a Synchro Summon), page read 2026-11-24.
		{ id: "notes-search-field", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-search-damage-step", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-mentions", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■『「赤き竜」のカード名が記された魔法・罠カード』とは、テキストに特定のカード名として『「赤き竜」』と記載されている魔法・罠カードを指します。" },
		{ id: "notes-quick-field", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-resolution", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■処理時に、このカードが（表示形式を問わず）モンスターゾーンに存在する場合、『このカードをEXデッキに戻し』の処理を行います。エクストラデッキに戻すことに成功し、かつ対象のモンスターがモンスターゾーンに表側表示で存在する場合、『対象のモンスターと同じレベルのドラゴン族Sモンスター１体をS召喚扱いでEXデッキから特殊召喚する』処理を行います。" },
		{ id: "notes-simultaneous", kind: "jp-notes", cid: 18825, url: NOTES, read: "2026-11-24", quote: "■戻す処理と特殊召喚する処理は同時に行われたものとして扱います。" },
		{ id: "qa-treated-summon", kind: "jp-qa", cid: 18825, fid: 12750, url: qa(12750), read: "2026-11-24", quote: "以下の効果についても同様に、シンクロ・エクシーズ・リンク召喚扱いとしてモンスターが特殊召喚される際には発動できません。" },
	],
	effects: ["facts", "procedure", "search", "return", "treated", "once"],
	rulings: [{ source: "notes-search-field" }, { source: "notes-search-damage-step" }, { source: "notes-mentions" }, { source: "notes-quick-field" }, { source: "notes-no-damage-step" }, { source: "notes-resolution" }, { source: "notes-simultaneous" }, { source: "qa-treated-summon" }],
};
