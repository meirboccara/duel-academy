import type { CardSources } from "../coverage";
import { shuffleDecksOf } from "../deck";
import { type Duel, moveCards, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { hasPrintedName, mentionsCard } from "../identity";
import { level } from "../modifiers";
import { askSpecialSummon, canSpecialSummonTogether } from "../procedures";
import { konamiCardUrl } from "../sources";
import { banishTemporarily } from "../temporary";
import { factsOf } from "./helpers";
import { cardsOnField, leavingAfterChain, stillTargeted } from "./sky-striker-targets";

const NAME = "Ecclesia and the Dark Dragon";
const ALBAZ = "Fallen of Albaz";

const inMainPhase = (duel: Duel): boolean => duel.turn.phase === "main1" || duel.turn.phase === "main2";

/**
 * "1 "Fallen of Albaz" or 1 Level 4 or lower monster that mentions it from your Deck or GY": the monster of that printed name, or a monster whose printed text
 * names it (`mentions`) with a Level of 4 or less (a monster with no Level, a Link Monster, is not one). A monster only "treated as" "Fallen of Albaz" is not
 * modelled. `leaving`: monsters that will have left the field (this card, banished), whose zones count as free.
 */
const toSummon = (duel: Duel, player: Side, leaving: readonly number[] = []): number[] =>
	[...duel.piles[player].deck, ...duel.piles[player].graveyard].filter((id) => {
		if (duel.defs[duel.cards[id]!.code]?.kind !== "monster") return false;
		const named = hasPrintedName(duel, id, ALBAZ);
		const mentioning = mentionsCard(duel, id, ALBAZ) && factsOf(duel, id)?.level !== undefined && level(duel, id) <= 4;
		return (named || mentioning) && canSpecialSummonTogether(duel, player, [id], { leaving });
	});

/** "1 Level 8 Fusion Monster in your GY or banishment": printed Fusion frame and Level 8; a banished one must be face-up (a face-down card has no kind to be seen). */
const level8Fusions = (duel: Duel, player: Side): number[] =>
	[...duel.piles[player].graveyard, ...duel.piles[player].banished.filter((id) => duel.cards[id]!.face === "up")].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.frame === "fusion" && level(duel, id) === 8);

/**
 * LIGHT Spellcaster Synchro Level 8, 2500 ATK / 2500 DEF. "1 Tuner + 1+ non-Tuners. During the Main Phase (Quick Effect): You can banish this card (until the End
 * Phase), and if you do, Special Summon 1 "Fallen of Albaz" or 1 Level 4 or lower monster that mentions it from your Deck or GY. If this card is in your GY: You
 * can target 1 Level 8 Fusion Monster in your GY or banishment and 1 card on the field; shuffle both of those cards and this card into the Deck. You can only use
 * each effect of "Ecclesia and the Dark Dragon" once per turn." An "Ecclesia" monster by its name; its text names "Fallen of Albaz" (`facts.mentions`).
 *
 * - Procedure: the generic Synchro Summon (1 Tuner and 1 or more non-Tuners, Levels adding up to 8).
 * - First effect: a Quick Effect of the Monster Zone in either player's Main Phase (notes), not in the Damage Step, where only the effects that change ATK or DEF
 *   can be activated. It cannot be activated unless a monster can be Special Summoned, the zone of this card counting as free once it is banished (notes: it can
 *   be activated with 5 monsters in the Main Monster Zones, itself included). When it resolves the card banishes itself until the End Phase (S2,
 *   `banishTemporarily`: a face-down card is banished face-down and comes back face-down; with no free Main Monster Zone in the End Phase it is placed in the
 *   Graveyard, not sent there) and, if it was banished, the player chooses the monster among those of the Deck and the Graveyard (a Level 5 or higher monster of
 *   that name too: only "Fallen of Albaz" itself is tested, no monster "treated as" it is modelled) and Special Summons it. The banishment and the Summon are one
 *   step in the notes ("treated as simultaneous"); the core does them one after the other with no break. "Fallen of Albaz" and a monster that mentions it are in
 *   neither Sky Striker list, so this effect is never available in them: it is tested with made-up monsters.
 * - Second effect: an ignition effect of the Graveyard, targeting 1 Level 8 Fusion Monster of the player's Graveyard or face-up banishment (the core's reading: a
 *   face-down card has no printed kind) and 1 card on the field of either player (`targetGroups`). When it resolves all three cards must still be there (this
 *   card in the Graveyard, the targets still the cards targeted) or nothing happens; a target that was turned face-down is still shuffled (`stillTargeted`); a Spell
 *   or Trap Card that was activated in the same Chain and is still to be sent to the Graveyard cannot be returned, so nothing is done for the other two either (notes);
 *   a target that is unaffected by the effect stays and the others are shuffled (notes). A Fusion or Synchro Monster goes to the Extra Deck.
 * - Each effect once per turn, by name, one use each.
 */
export const ECCLESIA_AND_THE_DARK_DRAGON: CardDef = {
	code: "ecclesia-and-the-dark-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Spellcaster", frame: "synchro", level: 8, atk: 2500, def: 2500, archetypes: ["Ecclesia"], mentions: [ALBAZ, NAME] },
	procedure: { kind: "synchro" },
	effects: [
		{
			type: "quick",
			categories: ["banish", "special-summon", "summon-from-deck", "summon-from-graveyard"],
			once: { scope: "name", key: "ecclesia-and-the-dark-dragon-1" },
			condition: (duel, { player, card }) => inMainPhase(duel) && toSummon(duel, player, [card.id]).length > 0,
			operation: (duel, link) => {
				const self = duel.cards[link.card.id]!;
				if (self.zone !== "monster") return duel;
				const banished = banishTemporarily(duel, [self.id], link, { phase: "end", turn: duel.turn.number });
				const now = banished.cards[self.id]!;
				// "And if you do": the Summon follows only if this card was really banished; a banishment can be stopped, so it is checked.
				if (now.zone !== "banished" || now.moves === self.moves) return banished;
				return ask(banished, link.player, toSummon(banished, link.player), (board, picked) => askSpecialSummon(board, link.player, picked));
			},
		},
		{
			type: "ignition",
			range: "graveyard",
			categories: ["return-to-deck"],
			once: { scope: "name", key: "ecclesia-and-the-dark-dragon-2" },
			targetGroups: (duel, { player }) => [
				{ from: level8Fusions(duel, player), min: 1, max: 1 },
				{ from: cardsOnField(duel), min: 1, max: 1 },
			],
			operation: (duel, link) => {
				const [fusion, onField] = stillTargeted(duel, link);
				const self = duel.cards[link.card.id]!;
				if (!fusion || !onField || self.zone !== "graveyard" || self.moves !== link.card.moves) return duel;
				// A Set Normal Trap or Quick-Play Spell activated in this Chain cannot be returned: nothing is done for the other two either.
				if (leavingAfterChain(duel).has(onField.id)) return duel;
				const ids = [fusion.id, onField.id, self.id];
				return shuffleDecksOf(moveCards(duel, ids, { zone: "deck", effect: link }), ids);
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=22144&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(22144, "en");

export const ECCLESIA_AND_THE_DARK_DRAGON_SOURCES: CardSources = {
	code: "ecclesia-and-the-dark-dragon",
	cid: 22144,
	french: {
		text: "1 Syntoniseur + 1+ non-Syntoniseur\nDurant la Main Phase (Effet Rapide) : vous pouvez bannir cette carte (jusqu'à la End Phase), et si vous le faites, Invoquez Spécialement 1 \"Albaz le Déchu\" ou 1 monstre de max. Niveau 4 qui le mentionne depuis votre Deck ou Cimetière. Si cette carte est dans votre Cimetière : vous pouvez cibler 1 Monstre Fusion de Niveau 8 dans votre Cimetière ou bannissement et 1 carte sur le Terrain ; mélangez ces deux cartes et cette carte dans le Deck. Vous ne pouvez utiliser chaque effet de \"Ecclésia et le Dragon des Ténèbres\" qu'une fois par tour.",
		url: konamiCardUrl(22144, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 22144, url: EN, read: "2026-11-26", quote: "LIGHT Level 8 ATK 2500 DEF 2500 Spellcaster ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 22144, url: EN, read: "2026-11-26", quote: "1 Tuner + 1+ non-Tuners" },
		{ id: "banish", kind: "card-text", cid: 22144, url: EN, read: "2026-11-26", quote: "During the Main Phase (Quick Effect): You can banish this card (until the End Phase), and if you do, Special Summon 1 \"Fallen of Albaz\" or 1 Level 4 or lower monster that mentions it from your Deck or GY." },
		{ id: "shuffle", kind: "card-text", cid: 22144, url: EN, read: "2026-11-26", quote: "If this card is in your GY: You can target 1 Level 8 Fusion Monster in your GY or banishment and 1 card on the field; shuffle both of those cards and this card into the Deck." },
		{ id: "once", kind: "card-text", cid: 22144, url: EN, read: "2026-11-26", quote: "You can only use each effect of \"Ecclesia and the Dark Dragon\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2025-10-25), page read 2026-11-26. Its single Q&A, fid 23215 (2026-11-26), read: it lists this effect (①) among those that include a Special Summon from the GY even with no monster there.
		{ id: "qa-from-graveyard-23215", kind: "jp-qa", cid: 22144, fid: 23215, url: qa(23215), read: "2026-11-26", quote: "「黒き竜のエクレシア」①" },
		{ id: "notes-banish-quick", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "【①の効果について】■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-banish-then-summon", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■処理時に『このカードをエンドフェイズまで除外し』の処理を行い、除外に成功した場合、『自分のデッキ・墓地から「アルバスの落胤」またはそのカード名が記されたレベル４以下のモンスター１体を特殊召喚する』処理を行います。" },
		{ id: "notes-banish-treated-as", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■墓地に存在する、カード名を「アルバスの落胤」として扱うモンスター（レベル５以上も含む）を特殊召喚することもできます。" },
		{ id: "notes-banish-simultaneous", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■除外する処理と特殊召喚する処理は同時に行われる扱いです。" },
		{ id: "notes-banish-five-monsters", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■自分のメインモンスターゾーンに、このカードを含む５体のモンスターが存在している場合でも発動できます。" },
		{ id: "notes-banish-face-down", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■処理時に、このカードが裏側守備表示になっている場合、このカードは裏側で除外され、該当のモンスターを特殊召喚し、エンドフェイズに裏側守備表示でモンスターゾーンに戻ります。" },
		{ id: "notes-banish-no-zone", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■エンドフェイズにこのカードをフィールドに戻す際に自分の使用可能なメインモンスターゾーンがない場合、このカードは除外状態から墓地に置かれます。" },
		{ id: "notes-banish-mentions", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■『そのカード名が記されたモンスター』とは、テキストにカード名として「アルバスの落胤」と記されているモンスターを指します。" },
		{ id: "notes-shuffle-graveyard", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "【②の効果について】■墓地で発動できる起動効果です。" },
		{ id: "notes-shuffle-all-or-nothing", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のカードの一部が存在しなくなった場合や、このカードが墓地に存在しなくなった場合には、処理は行われません。対象のカードが全て存在し、かつこのカードが墓地に存在する場合に、『そのカード２枚とこのカードをデッキに戻す』処理が行われます。" },
		{ id: "notes-shuffle-face-down", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンに存在するカードを対象としてこの効果を発動し、処理時にそのカードが裏側表示になっている場合でも、『そのカード２枚とこのカードをデッキに戻す』処理を行います。" },
		{ id: "notes-shuffle-unaffected", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のカードの一部がこの効果を受けない場合、他のカードについて『デッキに戻す』処理を行います。" },
		{ id: "notes-shuffle-set-card-activated", kind: "jp-notes", cid: 22144, url: NOTES, read: "2026-11-26", quote: "■セットされている通常罠カード・速攻魔法カードと融合モンスターを対象としてこの効果を発動し、同一チェーン上でそのセットされていたカードが発動した等によってそのカードをデッキに戻せなくなった場合、融合モンスターとこのカードについては処理が何も行われません。" },
	],
	effects: ["facts", "procedure", "banish", "shuffle", "once"],
	rulings: [
		{ source: "qa-from-graveyard-23215" },
		{ source: "notes-banish-quick" },
		{ source: "notes-banish-then-summon" },
		{ source: "notes-banish-treated-as", pending: "a monster only treated as \"Fallen of Albaz\" is not modelled (effective names), and neither Sky Striker list has one" },
		{ source: "notes-banish-simultaneous", pending: "the core banishes the card and then Special Summons the monster in one operation, with no break, and has no step that is simultaneous for a trigger: nothing in either list would see the difference" },
		{ source: "notes-banish-five-monsters" },
		{ source: "notes-banish-face-down" },
		{ source: "notes-banish-no-zone" },
		{ source: "notes-banish-mentions" },
		{ source: "notes-shuffle-graveyard" },
		{ source: "notes-shuffle-all-or-nothing" },
		{ source: "notes-shuffle-face-down" },
		{ source: "notes-shuffle-unaffected" },
		{ source: "notes-shuffle-set-card-activated" },
	],
};
