import type { CardSources } from "../coverage";
import { drawCards } from "../deck";
import { moveCard, type Duel, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { hasPrintedName, mentionsCard } from "../identity";
import { drawLocked, locked } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Ancient Fairy Life Dragon";
const FAIRY_DRAGON = "Ancient Fairy Dragon";
const WORLD = "World of Spirits";
const SUNSHINE = "Eternal Sunshine";
const LIGHT_TYPES = ["Beast", "Plant", "Fairy"];

/** "If "World of Spirits" is on the field": a face-up card of that name on either player's field (a Set card has no name). */
const worldOfSpiritsOnField = (duel: Duel): boolean => (["you", "rival"] as const).some((side) => [...duel.piles[side].spell, ...duel.piles[side].field].some((id) => duel.cards[id]!.face === "up" && hasPrintedName(duel, id, WORLD)));

/** "1 LIGHT monster (Beast, Plant, or Fairy) or 1 "Eternal Sunshine"" in the player's Deck. */
const toAdd = (duel: Duel, player: Side): number[] =>
	duel.piles[player].deck.filter((id) => {
		const facts = factsOf(duel, id);
		if (duel.defs[duel.cards[id]!.code]?.kind === "monster") return facts?.attribute === "LIGHT" && facts.monsterType !== undefined && LIGHT_TYPES.includes(facts.monsterType);
		return hasPrintedName(duel, id, SUNSHINE);
	});

/**
 * "1 Tuner + 1+ non-Tuner monsters. If this card is Synchro Summoned: You can draw 1 card, or if "World of Spirits" is on the field, add 1 LIGHT
 * monster (Beast, Plant, or Fairy) or 1 "Eternal Sunshine" from your Deck to your hand instead. You can only use this effect of "Ancient Fairy
 * Life Dragon" once per turn. Your "Ancient Fairy Dragon" and monsters that mention it can attack while in face-up Defense Position (apply their
 * DEF for damage calculation)." A LIGHT Dragon Synchro Effect Monster of Level 8.
 *
 * - Procedure: the generic Synchro Summon (`procedure: { kind: "synchro" }`: 1 Tuner and 1 or more non-Tuners, whose Levels add up to 8).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone (Konami's notes, OCG), for a Synchro Summon of the card only (a Special Summon
 *   by an effect that does not say "treated as a Synchro Summon" is not one). It is one effect with two outcomes, read when it resolves (notes):
 *   the draw, or, when "World of Spirits" is on either player's field then, the search instead, the card chosen then (no target). It is activated
 *   only while it can be done in the way the field says at activation (the core's reading of "cannot activate when it cannot be done", as for the
 *   other searches): a draw that is not locked, or, with "World of Spirits" on the field, a card to add and no lock on adding from the Deck. A
 *   face-down "World of Spirits" has no name and does not count (the core's reading: a face-down card has no name). Once per turn by name, spent at
 *   activation.
 * - Second effect: a Continuous Effect of the face-up card in the Monster Zone (notes): the `in-defense` attack permission, for the controller's
 *   face-up "Ancient Fairy Dragon" and the monsters whose printed text mentions it (`facts.mentions`), this card included (its text names it). Its
 *   DEF is used for the damage calculation by the core.
 * - Konami's three Q&A entries (OCG only) are about this permission, and the core's attack rules play them for this card: the DEF is used as the ATK
 *   and the lower monster is destroyed with the difference as battle damage (fid 24407), a permission negated before or in the Damage Step ends the
 *   attack or the step (fid 23968), and a monster that attacks in Defense Position is an attacking monster (fid 14252).
 */
export const ANCIENT_FAIRY_LIFE_DRAGON: CardDef = {
	code: "ancient-fairy-life-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 8, atk: 2500, def: 3300, mentions: [FAIRY_DRAGON, WORLD, SUNSHINE, NAME] },
	procedure: { kind: "synchro" },
	effects: [
		{
			type: "trigger",
			timing: "if",
			once: { scope: "name", key: "ancient-fairy-life-dragon-draw" },
			categories: (duel, { player }) => (worldOfSpiritsOnField(duel) && toAdd(duel, player).length > 0 ? ["search"] : ["draw"]),
			condition: (duel, { player }) => (worldOfSpiritsOnField(duel) ? toAdd(duel, player).length > 0 && !locked(duel, "add-to-hand", player) : duel.piles[player].deck.length > 0 && !drawLocked(duel, player)),
			event: (_duel, event, { card }) => event.type === "summoned" && event.card.id === card.id && event.how === "special" && event.kind === "synchro",
			operation: (duel, link) =>
				worldOfSpiritsOnField(duel)
					? locked(duel, "add-to-hand", link.player)
						? duel
						: ask(duel, link.player, toAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link }))
					: drawCards(duel, link.player, 1),
		},
		{
			type: "continuous",
			range: "field",
			modifies: () => [{ kind: "attack", allows: { what: "in-defense" } }],
			affects: (duel, target, source) => target.zone === "monster" && target.face === "up" && target.controller === source.controller && (hasPrintedName(duel, target.id, FAIRY_DRAGON) || mentionsCard(duel, target.id, FAIRY_DRAGON)),
		},
	],
};

const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=21176&request_locale=ja";
const EN = konamiCardUrl(21176, "en");

export const ANCIENT_FAIRY_LIFE_DRAGON_SOURCES: CardSources = {
	code: "ancient-fairy-life-dragon",
	cid: 21176,
	french: {
		text: "1 Syntoniseur + 1+ monstre non-Syntoniseur\nSi cette carte est Invoquée par Synchronisation : vous pouvez piocher 1 carte, ou si \"Monde des Esprits\" est sur le Terrain, ajoutez 1 monstre LUMIÈRE (Bête, Plante ou Elfe) ou 1 \"Ensoleillement Éternel\" depuis votre Deck à votre main à la place. Vous ne pouvez utiliser cet effet de \"Ancien Dragon de la Vie Féerique\" qu'une fois par tour. Votre \"Ancien Dragon Féerique\" et les monstres qui le mentionnent peuvent attaquer tant qu'ils sont en Position de Défense face recto (appliquez leur DEF pour le calcul des dommages).",
		url: konamiCardUrl(21176, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 21176, url: EN, read: "2026-11-24", quote: "LIGHT Level 8 ATK 2500 DEF 3300 Dragon / Synchro / Effect" },
		{ id: "procedure", kind: "card-text", cid: 21176, url: EN, read: "2026-11-24", quote: "1 Tuner + 1+ non-Tuner monsters" },
		{ id: "draw", kind: "card-text", cid: 21176, url: EN, read: "2026-11-24", quote: "If this card is Synchro Summoned: You can draw 1 card, or if \"World of Spirits\" is on the field," },
		{ id: "search", kind: "card-text", cid: 21176, url: EN, read: "2026-11-24", quote: "add 1 LIGHT monster (Beast, Plant, or Fairy) or 1 \"Eternal Sunshine\" from your Deck to your hand instead." },
		{ id: "once", kind: "card-text", cid: 21176, url: EN, read: "2026-11-24", quote: "You can only use this effect of \"Ancient Fairy Life Dragon\" once per turn." },
		{ id: "defense", kind: "card-text", cid: 21176, url: EN, read: "2026-11-24", quote: "Your \"Ancient Fairy Dragon\" and monsters that mention it can attack while in face-up Defense Position" },
		// OCG only. Konami's notes (補足情報, 2025-01-25), page read 2026-11-24, and its 3 Q&A entries (fids 24407, 23968, 14252), pages read 2026-11-24.
		{ id: "notes-trigger", kind: "jp-notes", cid: 21176, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-draw", kind: "jp-notes", cid: 21176, url: NOTES, read: "2026-11-24", quote: "■処理時に、『自分は１枚ドローする』処理を行います。" },
		{ id: "notes-search-world", kind: "jp-notes", cid: 21176, url: NOTES, read: "2026-11-24", quote: "■処理時に、自分または相手のフィールドに「精霊の世界」が存在する場合、『自分は１枚ドローする』処理の代わりに、『デッキから光属性の獣族・植物族・天使族モンスター１体または「エターナル・サンシャイン」１枚を手札に加える』処理を行います。" },
		{ id: "notes-continuous", kind: "jp-notes", cid: 21176, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで適用する永続効果です。" },
		{ id: "qa-damage", kind: "jp-qa", cid: 21176, fid: 24407, url: qa(24407), read: "2026-11-24", quote: "自分が２００の戦闘ダメージを受け、「エンシェント・フェアリー・ライフ・ドラゴン」が戦闘で破壊されます。" },
		{ id: "qa-negated", kind: "jp-qa", cid: 21176, fid: 23968, url: qa(23968), read: "2026-11-24", quote: "ダメージステップに入るまでの間に『表側守備表示のままで攻撃できる』効果が無効化された場合、その「スケアクロー・クシャトリラ」は攻撃を行えなくなり、ダメージステップには入らず、その攻撃は終了します。" },
		{ id: "qa-attacker", kind: "jp-qa", cid: 21176, fid: 14252, url: qa(14252), read: "2026-11-24", quote: "表側守備表示で攻撃を宣言している場合でも、「超重荒神スサノ－O」や「超重神鬼シュテンドウ－G」は攻撃モンスターとして扱われますので、「炸裂装甲」を発動でき、その「超重荒神スサノ－O」を破壊できます。" },
	],
	effects: ["facts", "procedure", "draw", "search", "once", "defense"],
	rulings: [{ source: "notes-trigger" }, { source: "notes-draw" }, { source: "notes-search-world" }, { source: "notes-continuous" }, { source: "qa-damage" }, { source: "qa-negated" }, { source: "qa-attacker" }],
};
