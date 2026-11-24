import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef, targetsOf } from "../effects";
import { hasPrintedName } from "../identity";
import { addModifier, canBeBanished, unaffectedBy } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const BURST_STREAM = "Burst Stream of Destruction";

/** "1 Normal Monster from your hand or Deck": a monster card with the Normal fact. */
const normalMonsters = (duel: Duel, player: Side): number[] => [...duel.piles[player].hand, ...duel.piles[player].deck].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.normal === true);

/**
 * "During your Main Phase, you can Normal Summon 1 Level 1 LIGHT Tuner in addition to your Normal Summon/Set. (You can only gain this
 * effect once per turn.) Once per turn: You can target 1 face-up monster you control; send 1 Normal Monster from your hand or Deck to the GY,
 * and if you do, the targeted monster gains ATK/DEF equal to the Level of the monster sent to the GY x 100, until the end of this turn (even
 * if this card leaves the field). You can banish this card from your GY; add 1 "Burst Stream of Destruction" from your Deck to your hand."
 * A Field Spell.
 *
 * - First effect: a Continuous Effect of the face-up card, only for its controller (Konami's notes, OCG): the `permit` layer. The printed Level,
 *   Attribute and Tuner status are read from the monster's facts. One additional Normal Summon a turn in all, whatever gives it (the core's
 *   rule, Konami's notes and Q&A fid 24288; "you can only gain this effect once per turn").
 * - Second effect: an Ignition Effect with a target, "Once per turn:" (per copy). It can be activated only while a Normal Monster is in the
 *   hand or Deck (notes). The monster is chosen at resolution. The gain is "if you do": it needs the monster to have reached the GY (guarded; untested, the core has no "banished instead" replacement, Macro Cosmos, Konami fid 18128, pending). It is sent even if the target is gone (nothing is gained), and nothing at all
 *   happens when this card is no longer face-up in the Field Zone (notes). The gain is a lasting modifier: it stays when this card leaves,
 *   and when the monster sent has left the Graveyard (Q&A fid 18125). The Level is the printed Level of the monster sent (the notes say "originally").
 * - Third effect: an Ignition Effect in the Graveyard, banishing itself as the cost; a search, so it needs a "Burst Stream of Destruction" in
 *   the Deck (search-needs-a-card) and is not offered while cards cannot be added from the Deck to the hand.
 */
export const MAUSOLEUM_OF_WHITE: CardDef = {
	code: "mausoleum-of-white",
	kind: "spell",
	facts: { name: "Mausoleum of White", icon: "field", mentions: [BURST_STREAM] },
	effects: [
		{ type: "activation", stays: true, operation: (duel) => duel },
		{
			type: "continuous",
			range: "field",
			affects: () => false,
			modifies: (_duel, source) => [
				{
					kind: "permit",
					what: "normal-summon",
					who: source.controller,
					only: (duel, monster) => {
						const facts = duel.defs[monster.code]?.facts;
						return facts?.level === 1 && facts.attribute === "LIGHT" && facts.tuner === true;
					},
				},
			],
		},
		{
			type: "ignition",
			range: "field",
			once: { scope: "instance" },
			condition: (duel, { player }) => normalMonsters(duel, player).length > 0,
			target: (duel, { player }) => duel.piles[player].monster.filter((id) => duel.cards[id]!.face === "up"),
			operation: (duel, link) => {
				// Nothing at all unless this card is still face-up in the Field Zone (it has not become another card).
				const here = duel.cards[link.card.id]!;
				if (here.moves !== link.card.moves || here.zone !== "field" || here.face !== "up") return duel;
				const target = targetsOf(duel, link)[0];
				return ask(duel, link.player, normalMonsters(duel, link.player), (board, sent) => {
					const level = factsOf(board, sent)?.level ?? 0;
					// Sent and gained at the same time (notes): the target is read on the board before the Normal Monster moves.
					const moved = moveCard(board, sent, { zone: "graveyard" });
					// "send ..., and if you do": the gain needs the Normal Monster to have reached the GY. The core has no "banished instead" replacement (Macro Cosmos, Konami fid 18128, pending) to test it with.
					if (moved.cards[sent]!.zone !== "graveyard") return moved;
					if (!target || target.zone !== "monster" || target.face !== "up" || unaffectedBy(moved, target.id, link)) return moved;
					const affects = { card: target.id, moves: target.moves };
					const until = moved.turn.number;
					return (["atk", "def"] as const).reduce((state, stat) => addModifier(state, { affects, until, by: link, layer: { kind: "add", stat, by: level * 100 } }), moved);
				});
			},
		},
		{
			type: "ignition",
			range: "graveyard",
			categories: ["search"],
			requiresAddToHand: true,
			condition: (duel, { player }) => duel.piles[player].deck.some((id) => hasPrintedName(duel, id, BURST_STREAM)),
			cost: (duel, { player, card }) => (canBeBanished(duel, card.id, player) ? moveCard(duel, card.id, { zone: "banished", player }) : null),
			operation: (duel, link) =>
				ask(
					duel,
					link.player,
					duel.piles[link.player].deck.filter((id) => hasPrintedName(duel, id, BURST_STREAM)),
					(board, picked) => moveCard(board, picked, { zone: "hand" }),
				),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12331&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;

export const MAUSOLEUM_OF_WHITE_SOURCES: CardSources = {
	code: "mausoleum-of-white",
	cid: 12331,
	french: {
		text: "Durant votre Main Phase, vous pouvez Invoquer Normalement 1 Syntoniseur LUMIÈRE de Niveau 1 en plus de votre Invocation/Pose Normale. (Vous ne pouvez gagner cet effet qu'une fois par tour.) Une fois par tour : vous pouvez cibler 1 monstre face recto que vous contrôlez ; envoyez 1 Monstre Normal depuis votre main ou Deck au Cimetière, et si vous le faites, le monstre ciblé gagne une ATK/DEF égales au Niveau du monstre envoyé au Cimetière x 100 jusqu'à la fin de ce tour (même si cette carte quitte le Terrain). Vous pouvez bannir cette carte depuis votre Cimetière ; ajoutez 1 \"Flot Rugissant de Destruction\" depuis votre Deck à votre main.",
		url: konamiCardUrl(12331, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "extra-summon", kind: "card-text", cid: 12331, url: konamiCardUrl(12331, "en"), read: "2026-11-24", quote: "During your Main Phase, you can Normal Summon 1 Level 1 LIGHT Tuner in addition to your Normal Summon/Set." },
		{ id: "gain-once", kind: "card-text", cid: 12331, url: konamiCardUrl(12331, "en"), read: "2026-11-24", quote: "(You can only gain this effect once per turn.)" },
		{ id: "send-gain", kind: "card-text", cid: 12331, url: konamiCardUrl(12331, "en"), read: "2026-11-24", quote: "target 1 face-up monster you control; send 1 Normal Monster from your hand or Deck to the GY, and if you do, the targeted monster gains ATK/DEF equal to the Level of the monster sent to the GY x 100, until the end of this turn (even if this card leaves the field)." },
		{ id: "once", kind: "card-text", cid: 12331, url: konamiCardUrl(12331, "en"), read: "2026-11-24", quote: "Once per turn: You can target 1 face-up monster you control;" },
		{ id: "gy-search", kind: "card-text", cid: 12331, url: konamiCardUrl(12331, "en"), read: "2026-11-24", quote: "You can banish this card from your GY; add 1 \"Burst Stream of Destruction\" from your Deck to your hand." },
		// OCG only. Konami's notes (補足情報, 2016-01-09), page read 2026-11-24.
		{ id: "notes-extra-controller-only", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■このカードのコントローラーのみが使用できます。" },
		{ id: "notes-extra-order", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■通常召喚とこの効果による召喚が両方行える場合、どちらから先に行っても構いません。" },
		{ id: "notes-extra-no-chain", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■この効果で召喚を行う際に、チェーンブロックは作られません。" },
		{ id: "notes-send-gain-activation", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■自分の手札またはデッキに通常モンスターが存在する場合に発動できます。" },
		{ id: "notes-send-gain", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■墓地へ送る処理と攻撃力・守備力をアップする処理は同時に行われたものとして扱います。" },
		{ id: "notes-send-even-if-target-gone", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■処理時に、対象のモンスターがモンスターゾーンに表側表示で存在していない場合でも『手札・デッキから通常モンスター１体を墓地へ送り』の処理を行います。" },
		{ id: "notes-nothing-if-card-gone", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■処理時に、このカードがフィールドゾーンに表側表示で存在していない場合、処理は何も行われません。" },
		{ id: "notes-stats-stay", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■この効果の適用が完了した後に、このカードがフィールドゾーンに表側表示で存在しなくなった場合でも、この効果によって変化した攻撃力・守備力は変化したままとなります。" },
		{ id: "notes-gy", kind: "jp-notes", cid: 12331, url: NOTES, read: "2026-11-24", quote: "■墓地で発動できるチェーンブロックの作られる効果です。" },
		// OCG only. Konami's Q&A on the card (4 entries, all read 2026-11-24).
		{ id: "qa-normal-monster-leaves-gy", kind: "jp-qa", cid: 12331, fid: 18125, url: qa(18125), read: "2026-11-24", quote: "「光の霊堂」の効果でアップした攻撃力・守備力は適用されたままとなります。" },
		{ id: "qa-macro-cosmos", kind: "jp-qa", cid: 12331, fid: 18128, url: qa(18128), read: "2026-11-24", quote: "『対象のモンスターの攻撃力・守備力はターン終了時まで、墓地へ送ったモンスターのレベル×１００アップする』処理は適用されません。" },
		{ id: "qa-double-summon", kind: "jp-qa", cid: 12331, fid: 18129, url: qa(18129), read: "2026-11-24", quote: "合計３回の召喚を行う事ができます。" },
		{ id: "qa-gimmick-puppet", kind: "jp-qa", cid: 12331, fid: 24288, url: qa(24288), read: "2026-11-24", quote: "“通常召喚に加えて召喚を行う効果”を適用して召喚を行った場合、そのターンには他の“通常召喚に加えて召喚を行う効果”は発動できなくなります。" },
	],
	effects: ["extra-summon", "gain-once", "send-gain", "once", "gy-search"],
	rulings: [
		{ source: "notes-extra-controller-only" },
		{ source: "notes-extra-order" },
		{ source: "notes-extra-no-chain" },
		{ source: "notes-send-gain-activation" },
		{ source: "notes-send-gain" },
		{ source: "notes-send-even-if-target-gone" },
		{ source: "notes-nothing-if-card-gone" },
		{ source: "notes-stats-stay" },
		{ source: "notes-gy" },
		{ source: "qa-normal-monster-leaves-gy" },
		{ source: "qa-macro-cosmos", pending: "needs Macro Cosmos's effect (cards sent to the GY are banished instead), which the core does not have" },
		{ source: "qa-double-summon", pending: "needs Double Summon (\"2 Normal Summons/Sets this turn\"), which the core does not model; YGOProJudge disagreed with this entry (README, second readiness slice)" },
		{ source: "qa-gimmick-puppet", pending: "needs Gimmick Puppet - Fantasy Machina, a card the core does not have; the one-additional-Summon-a-turn part is tested through the made-up Field Spell of test/rules/summon-extras-fixtures.ts" },
	],
};
