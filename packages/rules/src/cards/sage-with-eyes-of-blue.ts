import type { CardSources } from "../coverage";
import { moveCard, type Duel, type Side } from "../duel";
import { ask, type CardDef, targetsOf } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf, isEffectMonster, sendThisToGraveyard } from "./helpers";

const NAME = "Sage with Eyes of Blue";

/** "1 Level 1 LIGHT Tuner" in the player's Deck, "except "Sage with Eyes of Blue"". */
const tunersToAdd = (duel: Duel, player: Side): number[] =>
	duel.piles[player].deck.filter((id) => {
		const facts = factsOf(duel, id);
		return duel.defs[duel.cards[id]!.code]?.kind === "monster" && facts?.level === 1 && facts.attribute === "LIGHT" && facts.tuner === true && !hasPrintedName(duel, id, NAME);
	});

/** The "Blue-Eyes" monsters of the player's Deck that could be Special Summoned now. */
const blueEyesToSummon = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, "Blue-Eyes") && canSpecialSummon(duel, player, id));

/** The face-up Effect Monsters the player controls, the targets of the second effect. */
const effectTargets = (duel: Duel, player: Side): number[] => duel.piles[player].monster.filter((id) => duel.cards[id]!.face === "up" && isEffectMonster(duel, id));

/**
 * "When this card is Normal Summoned: You can add 1 Level 1 LIGHT Tuner from your Deck to your hand, except "Sage with Eyes of Blue".
 * You can discard this card, then target 1 Effect Monster you control; send it to the GY, and if you do, Special Summon 1 "Blue-Eyes"
 * monster from your Deck. You can only use this effect of "Sage with Eyes of Blue" once per turn." A Level 1 LIGHT Spellcaster Tuner.
 *
 * - First effect: an optional "when" Trigger Effect of the Monster Zone, only right after the Summon succeeds (Konami's notes, OCG): a Normal
 *   Summon an effect performs at Chain Link 2 or later is followed by another link, so the timing is missed (the core's "when" rule). It has no
 *   limit of its own. It cannot be activated with no Level 1 LIGHT Tuner to add in the Deck (rule record `search-needs-a-card`).
 * - Second effect: an Ignition Effect of the hand, activated only while a "Blue-Eyes" monster of the Deck can be Special Summoned (so the discard, the target and the use are not spent for nothing; the core's reading, as for True Light's modes), the discard being the cost and the target an Effect Monster in the Monster Zone, face-up
 *   (notes). When it resolves the target is sent to the GY (a plain move: the core has no "discarded" reason for the cost either); if that
 *   succeeds, the player chooses a "Blue-Eyes" monster of the Deck and its zone and position. The send and the Summon are "treated as
 *   simultaneous" (notes): the core sends first, so the zone the target left is free for the Summon. A monster unaffected by this effect is
 *   not sent, and nothing is Summoned.
 * - "You can only use this effect ... once per turn" is read as limiting the second effect only, by name: YGOProJudge's answer (asked
 *   2026-11-24, it cited no official source; the text's "this effect" follows the second effect and the first one has no such limit).
 * - "Blue-Eyes" is read from `facts.archetypes`; the archetype of this card, "Eyes of Blue", is the name's wording and no Konami page lists it.
 */
export const SAGE_WITH_EYES_OF_BLUE: CardDef = {
	code: "sage-with-eyes-of-blue",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Spellcaster", level: 1, tuner: true, atk: 0, def: 1500, archetypes: ["Eyes of Blue"], mentions: [NAME] },
	effects: [
		{
			type: "trigger",
			timing: "when",
			categories: ["search"],
			requiresAddToHand: true,
			// "search-needs-a-card" (RB10): not activated with no Level 1 LIGHT Tuner to add in the Deck.
			condition: (duel, { player }) => tunersToAdd(duel, player).length > 0,
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "normal" && event.card.id === card.id,
			operation: (duel, link) => ask(duel, link.player, tunersToAdd(duel, link.player), (board, picked) => moveCard(board, picked, { zone: "hand" })),
		},
		{
			type: "ignition",
			range: "hand",
			categories: ["summon-from-deck"],
			once: { scope: "name" },
			// An effect that Summons is activated only while a card can be Summoned (as True Light's modes and Maiden of White's third effect).
			// The target is sent first, so the zone it leaves counts (the zones may be full now): read with each possible target already in the Graveyard.
			condition: (duel, { player }) => effectTargets(duel, player).some((id) => blueEyesToSummon(moveCard(duel, id, { zone: "graveyard" }), player).length > 0),
			cost: sendThisToGraveyard,
			target: (duel, { player }) => effectTargets(duel, player),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target || target.zone !== "monster" || target.face !== "up") return duel;
				// "send it to the GY": not applied to a monster unaffected by this effect; "if you do" needs it to have reached the Graveyard.
				const sent = moveCard(duel, target.id, { zone: "graveyard", effect: link });
				if (sent.cards[target.id]!.zone !== "graveyard") return sent;
				return ask(sent, link.player, blueEyesToSummon(sent, link.player), (board, picked) => askSpecialSummon(board, link.player, picked));
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12292&request_locale=ja";

export const SAGE_WITH_EYES_OF_BLUE_SOURCES: CardSources = {
	code: "sage-with-eyes-of-blue",
	cid: 12292,
	french: {
		text: "Lorsque cette carte est Invoquée Normalement : vous pouvez ajouter 1 Syntoniseur LUMIÈRE de Niveau 1 (\"Sage avec des Yeux de Bleu\" exclu) depuis votre Deck à votre main. Vous pouvez défausser cette carte, puis ciblez 1 Monstre à Effet que vous contrôlez ; envoyez-le au Cimetière, et si vous le faites, Invoquez Spécialement 1 monstre \"Yeux Bleus\" depuis votre Deck. Vous ne pouvez utiliser cet effet de \"Sage avec des Yeux de Bleu\" qu'une fois par tour.",
		url: konamiCardUrl(12292, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "add-tuner", kind: "card-text", cid: 12292, url: konamiCardUrl(12292, "en"), read: "2026-11-24", quote: "When this card is Normal Summoned: You can add 1 Level 1 LIGHT Tuner from your Deck to your hand, except \"Sage with Eyes of Blue\"." },
		{ id: "discard-send-summon", kind: "card-text", cid: 12292, url: konamiCardUrl(12292, "en"), read: "2026-11-24", quote: "You can discard this card, then target 1 Effect Monster you control; send it to the GY, and if you do, Special Summon 1 \"Blue-Eyes\" monster from your Deck." },
		{ id: "once", kind: "card-text", cid: 12292, url: konamiCardUrl(12292, "en"), read: "2026-11-24", quote: "You can only use this effect of \"Sage with Eyes of Blue\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-03-23), page read 2026-11-24.
		{ id: "notes-trigger-field", kind: "jp-notes", cid: 12292, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-just-after-summon", kind: "jp-notes", cid: 12292, url: NOTES, read: "2026-11-24", quote: "■召喚に成功した時（直後）にのみ発動できます。" },
		{ id: "notes-hand-ignition", kind: "jp-notes", cid: 12292, url: NOTES, read: "2026-11-24", quote: "■手札にて発動できる起動効果です。" },
		{ id: "notes-target-at-activation", kind: "jp-notes", cid: 12292, url: NOTES, read: "2026-11-24", quote: "■この効果を発動する際に、対象として自分のモンスターゾーンの表側表示の効果モンスター１体を選択します。" },
		{ id: "notes-send-then-summon", kind: "jp-notes", cid: 12292, url: NOTES, read: "2026-11-24", quote: "墓地へ送ることに成功した場合、『デッキから「ブルーアイズ」モンスター１体を特殊召喚する』処理を行います。" },
		{ id: "notes-simultaneous", kind: "jp-notes", cid: 12292, url: NOTES, read: "2026-11-24", quote: "■墓地へ送る処理と特殊召喚の処理は同時に行われたものとして扱います。" },
		// OCG only. The card's one Q&A (fid 18319, 2017-03-24), about Phantom Knights' Dark Gauntlet treated as an Effect Monster.
		{ id: "qa-dark-gauntlet", kind: "jp-qa", cid: 12292, fid: 18319, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=18319&request_locale=ja", read: "2026-11-24", quote: "『デッキから「ブルーアイズ」モンスター１体を特殊召喚する』処理は適用されません。" },
	],
	effects: ["add-tuner", "discard-send-summon", "once"],
	rulings: [
		{ source: "notes-trigger-field" },
		{ source: "notes-just-after-summon" },
		{ source: "notes-hand-ignition" },
		{ source: "notes-target-at-activation" },
		{ source: "notes-send-then-summon" },
		{ source: "notes-simultaneous" },
		{ source: "qa-dark-gauntlet", pending: "needs a Trap Card that becomes an Effect Monster and is banished when it leaves the field (Phantom Knights' Dark Gauntlet), which the core does not have" },
	],
};
