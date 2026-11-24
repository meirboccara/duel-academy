import type { CardSources } from "../coverage";
import { delay } from "../delayed";
import { type Duel, moveCard, other, type Side } from "../duel";
import { ask, type CardDef, type EffectRecord, targetsOf } from "../effects";
import { hasPrintedName } from "../identity";
import { canBeBanished, locked } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Bystial Magnamhut";

/** "1 LIGHT or DARK monster in either GY" that can be banished by `player`. */
const banishable = (duel: Duel, player: Side): number[] =>
	[...duel.piles.you.graveyard, ...duel.piles.rival.graveyard].filter((id) => {
		const facts = factsOf(duel, id);
		return duel.defs[duel.cards[id]!.code]?.kind === "monster" && (facts?.attribute === "LIGHT" || facts?.attribute === "DARK") && canBeBanished(duel, id, player);
	});

/** "1 Dragon monster from your Deck or GY", "except "Bystial Magnamhut"": the Deck only while cards can be added from it to the hand. */
const dragons = (duel: Duel, player: Side): number[] =>
	[...(locked(duel, "add-to-hand", player) ? [] : duel.piles[player].deck), ...duel.piles[player].graveyard].filter(
		(id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.monsterType === "Dragon" && !hasPrintedName(duel, id, NAME),
	);

const opponentControlsAMonster = (duel: Duel, player: Side): boolean => duel.piles[other(player)].monster.length > 0;

/** One timing of the first effect: both share its once per turn. */
const summonFromHand = (type: "ignition" | "quick", opponentHasMonster: boolean): EffectRecord => ({
	type,
	range: "hand",
	categories: ["banish", "special-summon"],
	once: { scope: "name", key: "bystial-magnamhut-summon" },
	// An effect that Summons is activated only while it can be done: a monster to banish, and this card Special Summonable.
	condition: (duel, { player, card }) => opponentControlsAMonster(duel, player) === opponentHasMonster && canSpecialSummon(duel, player, card.id) && banishable(duel, player).length > 0,
	target: (duel, { player }) => banishable(duel, player),
	operation: (duel, link) => {
		const target = targetsOf(duel, link)[0];
		if (!target) return duel;
		const banished = moveCard(duel, target.id, { zone: "banished", effect: link, player: link.player });
		// "And if you do": nothing more when the monster was not banished.
		if (banished.cards[target.id]!.zone !== "banished") return banished;
		// The card must still be in the hand when this resolves.
		const now = banished.cards[link.card.id]!;
		return now.zone === "hand" && now.moves === link.card.moves ? askSpecialSummon(banished, link.player, now.id) : banished;
	},
});

/**
 * "You can target 1 LIGHT or DARK monster in either GY; banish it, and if you do, Special Summon this card from your hand. This is a Quick Effect if
 * your opponent controls a monster. If this card is Special Summoned: You can activate this effect; during the End Phase of this turn, add 1 Dragon
 * monster from your Deck or GY to your hand, except "Bystial Magnamhut". You can only use each effect of "Bystial Magnamhut" once per turn." A DARK
 * Dragon Effect Monster.
 *
 * - First effect: an effect of the hand (Konami's notes, OCG): an Ignition Effect, and a Quick Effect while the opponent controls a monster, which
 *   the core writes as two records, one for each case, sharing one use per turn by name (so only one is ever offered). Not in the Damage Step. The
 *   banishing and the Summon are simultaneous in the notes; the core banishes first (the Summon needs no zone the target frees). The monster is
 *   banished "by" the player (a lock on banishing from that Graveyard stops it, `canBeBanished`). Activated only while a monster can be banished
 *   and this card Special Summoned (the core's reading, as for the other Summons).
 * - Second effect: an optional "if" Trigger Effect of the Monster Zone, also in the Damage Step (notes). It leaves a delayed effect for the End Phase
 *   of this turn, with no Chain Link (notes), which adds the Dragon the player chooses; it can be activated with no Dragon in the Deck or GY, and
 *   then owes nothing. Cards cannot be added from the Deck while that is locked (the Deck's Dragons are then not a choice: the core's reading, as `drawCards`).
 *   It declares `search`: Ash Blossom & Joyous Spring can be chained to its activation although the add is done in the End Phase (Konami's Q&A fid
 *   23793, OCG, names this effect: such an effect still "includes an effect that adds a card from the Deck to the hand", whether or not the Deck holds a
 *   Dragon). Dominus Purge has the same wording ("adds a card(s) from the Deck to the hand"), so it answers it too: that is the core's reading from its
 *   text, no Konami page names Dominus Purge here.
 * - "Bystial" is read from `facts.archetypes`: the name's own archetype, which no Konami page lists.
 */
export const BYSTIAL_MAGNAMHUT: CardDef = {
	code: "bystial-magnamhut",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Dragon", level: 6, atk: 2500, def: 2000, archetypes: ["Bystial"], mentions: [NAME] },
	effects: [
		summonFromHand("ignition", false),
		summonFromHand("quick", true),
		{
			type: "trigger",
			timing: "if",
			// "Includes an effect that adds a card from the Deck to the hand" though the add is done in the End Phase (Konami's Q&A fid 23793): Ash Blossom and Dominus Purge answer it.
			categories: ["search"],
			once: { scope: "name", key: "bystial-magnamhut-add" },
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.id === card.id,
			operation: (duel, link) =>
				delay(duel, link, {
					due: { phase: "end", turn: duel.turn.number },
					mandatory: true,
					condition: (board, self) => dragons(board, self.player).length > 0,
					apply: (board, self) => ask(board, self.player, dragons(board, self.player), (next, picked) => moveCard(next, picked, { zone: "hand" })),
				}),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=17762&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(17762, "en");

export const BYSTIAL_MAGNAMHUT_SOURCES: CardSources = {
	code: "bystial-magnamhut",
	cid: 17762,
	french: {
		text: "Vous pouvez cibler 1 monstre LUMIÈRE ou TÉNÈBRES dans l'un des Cimetières ; bannissez-le, et si vous le faites, Invoquez Spécialement cette carte depuis votre main. Ceci est un Effet Rapide si votre adversaire contrôle un monstre. Si cette carte est Invoquée Spécialement : vous pouvez activer cet effet ; durant la End Phase de ce tour, ajoutez 1 monstre Dragon (\"Bystial Magnamhut\" exclu) depuis votre Deck ou Cimetière à votre main. Vous ne pouvez utiliser chaque effet de \"Bystial Magnamhut\" qu'une fois par tour.",
		url: konamiCardUrl(17762, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 17762, url: EN, read: "2026-11-24", quote: "DARK Level 6 ATK 2500 DEF 2000 Dragon／Effect" },
		{ id: "summon", kind: "card-text", cid: 17762, url: EN, read: "2026-11-24", quote: "You can target 1 LIGHT or DARK monster in either GY; banish it, and if you do, Special Summon this card from your hand." },
		{ id: "quick", kind: "card-text", cid: 17762, url: EN, read: "2026-11-24", quote: "This is a Quick Effect if your opponent controls a monster." },
		{ id: "add", kind: "card-text", cid: 17762, url: EN, read: "2026-11-24", quote: "If this card is Special Summoned: You can activate this effect; during the End Phase of this turn, add 1 Dragon monster from your Deck or GY to your hand, except \"Bystial Magnamhut\"." },
		{ id: "once", kind: "card-text", cid: 17762, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Bystial Magnamhut\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-09-14), page read 2026-11-24. Its 4 Q&A entries: titles read, the one about the lock on adding from the Deck opened (below); the others are about other cards' chains (Ash Blossom, Prohibition, Ghost Belle).
		{ id: "notes-summon-ignition", kind: "jp-notes", cid: 17762, url: NOTES, read: "2026-11-24", quote: "■手札で発動できる起動効果です。相手フィールドにモンスターが存在する場合、誘発即時効果として発動できます。" },
		{ id: "notes-summon-quick", kind: "jp-notes", cid: 17762, url: NOTES, read: "2026-11-24", quote: "相手フィールドにモンスターが存在する場合、誘発即時効果として発動できます。" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 17762, url: NOTES, read: "2026-11-24", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-add-end-phase", kind: "jp-notes", cid: 17762, url: NOTES, read: "2026-11-24", quote: "■エンドフェイズに『自分のデッキ・墓地から「深淵の獣マグナムート」以外のドラゴン族モンスター１体を手札に加える』処理を行う際にチェーンブロックは作られません。" },
		{ id: "notes-add-no-dragon", kind: "jp-notes", cid: 17762, url: NOTES, read: "2026-11-24", quote: "■デッキ・墓地にドラゴン族モンスターが１体も存在していなくても、この効果を発動することができます。" },
		// OCG only. Konami's Q&A fid 23793 (Ash Blossom against Magical Book of Judgment; its list of the same ruling names this card's second effect), page read 2026-11-24.
		{ id: "qa-ash-end-phase-add", kind: "jp-qa", cid: 17762, fid: 23793, url: qa(23793), read: "2026-11-24", quote: "エンドフェイズに行われますが、そのような効果も『デッキからカードを手札に加える効果』『デッキからモンスターを特殊召喚する効果』を含む効果にあたります。（デッキに該当のカードがあるかどうかによらず発動できます。）" },
		// OCG only. Konami's Q&A fid 22474 (the lock on adding cards from the Deck: Ancrybo and this card are named in its answer), page read 2026-11-24.
		{ id: "qa-lock-end-phase", kind: "jp-qa", cid: 17762, fid: 22474, url: qa(22474), read: "2026-11-24", quote: "以外のドラゴン族モンスター１体を選んで手札に加える』効果についても同様です。" },
	],
	effects: ["facts", "summon", "quick", "add", "once"],
	rulings: [{ source: "notes-summon-ignition" }, { source: "notes-summon-quick" }, { source: "notes-damage-step" }, { source: "notes-add-end-phase" }, { source: "notes-add-no-dragon" }, { source: "qa-lock-end-phase" }, { source: "qa-ash-end-phase-add" }],
};
