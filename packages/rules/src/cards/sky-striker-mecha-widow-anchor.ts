import { askMay } from "../choices";
import type { CardSources } from "../coverage";
import { freeSlots } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import { breakEffect } from "../events";
import { isNegated, negateCardEffects, takeControl } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { isEffectMonster } from "./helpers";
import { noMainMonsters, spellsInGraveyard } from "./sky-striker-helpers";

const NAME = "Sky Striker Mecha - Widow Anchor";

/**
 * "If you control no monsters in your Main Monster Zone: Target 1 face-up Effect Monster on the field; negate that face-up monster's effects until the
 * end of this turn, then, if you have 3 or more Spells in your GY, you can take control of that monster until the End Phase." A Quick-Play Spell,
 * "Sky Striker" by its name.
 *
 * - Condition: no monster of the player in a Main Monster Zone (a face-down one included; the Extra Monster Zones do not count). A Quick-Play Spell that
 *   changes no ATK or DEF, so it is not activated in the Damage Step (notes; the core's rule for Quick-Play Spells).
 * - Target (notes): 1 face-up Effect Monster in a Monster Zone, of either player, in an Extra Monster Zone too. Not a Normal Monster (it has no effects
 *   to negate), and, as for Infinite Impermanence, not a monster whose effects are already negated (Konami's note on that card: not a legal target;
 *   the same reading here, as the TCG text has no such sentence).
 * - It resolves only for a target that is still face-up in the Monster Zone (`targetsOf`; notes: otherwise nothing is done). The negation lasts until
 *   the end of this turn (`negateCardEffects`), and is applied first.
 * - "Then, ... you can take control": a choice (`askMay`) after the negation was applied (the notes: only when it was), not simultaneous with it, with
 *   3 or more Spells in the player's Graveyard (this card is on the field while it resolves, so it is not counted), for a monster the opponent controls
 *   (nothing to take from the player's own field) and with a free Main Monster Zone to take it to (a Main Monster Zone is free when this card is
 *   activated, but a monster may have been Summoned in response). The monster goes to a Main Monster Zone the player chooses, even from an Extra
 *   Monster Zone, and goes back when the End Phase begins (`takeControl`).
 * - The negation follows the monster through the change of control and stands after it goes back in the End Phase, to the end of the turn
 *   (core: `changeControl`; YGOProJudge only, chat of 2026-11-26, no Konami page cited).
 * - Limits: the interplay with Sky Striker Ace - Shizuku's End Phase effect (Konami's Q&A fids 11555 and 17476) needs the End Phase to be orderable and
 *   is tested with Shizuku (batch 7). The control of a monster with no free Main Monster Zone is not offered here (no Konami page; the core's rule
 *   is YGOProJudge's lead: the monster is destroyed).
 */
export const SKY_STRIKER_MECHA_WIDOW_ANCHOR: CardDef = {
	code: "sky-striker-mecha-widow-anchor",
	kind: "quick-play",
	facts: { name: NAME, archetypes: ["Sky Striker"], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["negate"],
			condition: (duel, { player }) => noMainMonsters(duel, player),
			target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up" && isEffectMonster(duel, id) && !isNegated(duel, id)),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target || target.zone !== "monster" || target.face !== "up") return duel;
				const negated = negateCardEffects(duel, target.id, duel.turn.number, link);
				// "Then": only when the negation was applied, for a monster of the opponent, with 3 or more Spells and a zone to take it to.
				if (negated === duel || target.controller === link.player || spellsInGraveyard(negated, link.player) < 3 || freeSlots(negated, link.player, "monster").length === 0) return negated;
				return askMay(breakEffect(negated), link.player, link.card.id, (board) => takeControl(board, target.id, link.player, board.turn.number, link));
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13675&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(13675, "en");

export const SKY_STRIKER_MECHA_WIDOW_ANCHOR_SOURCES: CardSources = {
	code: "sky-striker-mecha-widow-anchor",
	cid: 13675,
	french: {
		text: "Si vous ne contrôlez aucun monstre dans votre Zone Monstre Main : ciblez 1 Monstre à Effet face recto sur le Terrain ; annulez les effets du monstre face recto jusqu'à la fin de ce tour, puis, si vous avez min. 3 Magies dans votre Cimetière, vous pouvez prendre le contrôle du monstre jusqu'à la End Phase.",
		url: konamiCardUrl(13675, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13675, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "condition", kind: "card-text", cid: 13675, url: EN, read: "2026-11-26", quote: "If you control no monsters in your Main Monster Zone: Target 1 face-up Effect Monster on the field;" },
		{ id: "negate", kind: "card-text", cid: 13675, url: EN, read: "2026-11-26", quote: "negate that face-up monster's effects until the end of this turn," },
		{ id: "control", kind: "card-text", cid: 13675, url: EN, read: "2026-11-26", quote: "then, if you have 3 or more Spells in your GY, you can take control of that monster until the End Phase." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-26. Of its 6 Q&A, fids 8398 and 8161 are opened here; 17476 (temporary banishment) and 11555 (Shizuku) wait for batches 7 and 8; 10018, 12521, 22203 are about cards of neither list.
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 13675, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-targets", kind: "jp-notes", cid: 13675, url: NOTES, read: "2026-11-26", quote: "■この効果を発動する際に、モンスターゾーンの表側表示の効果モンスター１体を対象に選択します。" },
		{ id: "notes-then", kind: "jp-notes", cid: 13675, url: NOTES, read: "2026-11-26", quote: "■処理時に、『そのモンスターの効果をターン終了時まで無効にする』処理を行います。無効にする処理を行い、自分の墓地に魔法カードが３枚以上存在する場合には加えて、その後『そのモンスターのコントロールをエンドフェイズまで得る』処理を行うことができます。" },
		{ id: "notes-nothing-if-not-face-up", kind: "jp-notes", cid: 13675, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のモンスターがモンスターゾーンに表側表示で存在しない場合、処理は何も行われません。" },
		// OCG only. Konami's Q&A fid 8398 (2025-12-24, Infinite Impermanence's page, which lists "閃刀機－ウィドウアンカー" among the Spells it applies to), page read 2026-11-26.
		{ id: "qa-negated-cost", kind: "jp-qa", cid: 13675, fid: 8398, url: qa(8398), read: "2026-11-26", quote: "効果自体はモンスターゾーンで発動していますので、無効化されます。" },
	],
	effects: ["facts", "condition", "negate", "control"],
	rulings: [{ source: "notes-no-damage-step" }, { source: "notes-targets" }, { source: "notes-then" }, { source: "notes-nothing-if-not-face-up" }, { source: "qa-negated-cost" }],
};
