import type { CardSources } from "../coverage";
import { type Duel, moveCard, other } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import { breakEffect } from "../events";
import { belongsTo } from "../identity";
import { addModifier, FOREVER } from "../modifiers";
import { nextPhaseTurn } from "../delayed";
import { konamiCardUrl } from "../sources";
import { banishTemporarily } from "../temporary";
import { cardsOnField, faceUpMonsters } from "./sky-striker-targets";

const NAME = "Sky Striker Ace - Zeke";

/**
 * DARK Machine Link 2 (arrows at the top and the bottom), 1500 ATK. "2 monsters, including a "Sky Striker Ace" monster. Must be Link Summoned. You can
 * only Special Summon "Sky Striker Ace - Zeke(s)" once per turn. If this card is Link Summoned: You can target 1 face-up monster on the field; banish it
 * until your opponent's next End Phase. Once per turn: You can target 1 other card you control; this card gains 1000 ATK, then, send the targeted card
 * to the GY." Every "Sky Striker Ace" card is also a "Sky Striker" card (the name).
 *
 * - Procedure: 2 monsters of any kind, at least one of them a "Sky Striker Ace" monster (`check`: "including"). "Must be Link Summoned" and the limit of one
 *   Special Summon per turn are card rules, not effects (notes): `summon.onlyByOwnProcedure` and `summon.oncePerTurn`.
 * - First effect: an optional "if" Trigger Effect of the Monster Zone, for a Link Summon of the card (by its procedure or by an effect that Link Summons it).
 *   It targets 1 face-up monster of either player (this card included) and banishes it until the opponent's next End Phase (S2 of
 *   docs/rules-core/sky-striker-gaps.md, `banishTemporarily`): "your opponent's next End Phase" is counted when the effect resolves (this turn's End Phase
 *   if it is the opponent's turn and the End Phase is still to come). The monster comes back in that End Phase, in the position it was banished in, to the
 *   Main Monster Zone of the player who controlled it, who chooses the zone (Konami's Q&A fid 8571); not a Special Summon, no Chain Link. A control change
 *   with a duration ends with the banishment and one without is kept (fid 17476).
 * - Second effect: an ignition effect of the Monster Zone, once per turn for each copy, targeting 1 other card the player controls (a monster, or a Spell or
 *   Trap Card, face-up or face-down). When it resolves the target must still be the card targeted (as for any effect with one target); this card must still
 *   be face-up in the Monster Zone, as the card it was, or nothing happens: the ATK is not gained and nothing is sent (notes). The 1000 ATK stays (a
 *   lasting effect of the card itself: it stops while the card's effects are negated, the core's reading of its own lasting effects, as for Psychic End
 *   Punisher), and then (not simultaneously: notes) the target goes to the Graveyard.
 */
export const SKY_STRIKER_ACE_ZEKE: CardDef = {
	code: "sky-striker-ace-zeke",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Machine", frame: "link", link: 2, arrows: ["top", "bottom"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME] },
	summon: { oncePerTurn: true, onlyByOwnProcedure: true },
	procedure: { kind: "link", materials: { min: 2, max: 2 }, check: (duel: Duel, cards) => cards.some((card) => belongsTo(duel, card.id, "Sky Striker Ace")) },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["banish"],
			target: (duel) => faceUpMonsters(duel),
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.kind === "link" && event.card.id === card.id,
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target || target.zone !== "monster") return duel;
				return banishTemporarily(duel, [target.id], link, { phase: "end", turn: nextPhaseTurn(duel, "end", other(link.player)) });
			},
		},
		{
			type: "ignition",
			categories: ["change-atk", "send-to-graveyard"],
			once: { scope: "instance" },
			target: (duel, { player, card }) => cardsOnField(duel, [player]).filter((id) => id !== card.id),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target) return duel;
				const self = duel.cards[link.card.id]!;
				if (self.zone !== "monster" || self.face !== "up" || self.moves !== link.card.moves) return duel;
				const gained = addModifier(duel, { affects: { card: self.id, moves: self.moves }, until: FOREVER, layer: { kind: "add", stat: "atk", by: 1000 }, by: link, own: true });
				return moveCard(breakEffect(gained), target.id, { zone: "graveyard", effect: link });
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=14947&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(14947, "en");

export const SKY_STRIKER_ACE_ZEKE_SOURCES: CardSources = {
	code: "sky-striker-ace-zeke",
	cid: 14947,
	french: {
		text: "2 monstres (un monstre \"Assaut de l'Air - As\" inclus)\nUniquement Invocable par Lien. Vous ne pouvez Invoquer Spécialement un ou plusieurs \"Assaut de l'Air - As - Zeke\" qu'une fois par tour. Si cette carte est Invoquée par Lien : vous pouvez cibler 1 monstre face recto sur le Terrain ; jusqu'à la prochaine End Phase de votre adversaire, bannissez-le. Une fois par tour : vous pouvez cibler 1 autre carte que vous contrôlez ; cette carte gagne 1000 ATK, puis, envoyez la carte ciblée au Cimetière.",
		url: konamiCardUrl(14947, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 14947, url: EN, read: "2026-11-26", quote: "DARK Link 2 ATK 1500 DEF - Machine ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 14947, url: EN, read: "2026-11-26", quote: "2 monsters, including a \"Sky Striker Ace\" monster" },
		{ id: "link-only", kind: "card-text", cid: 14947, url: EN, read: "2026-11-26", quote: "Must be Link Summoned." },
		{ id: "once-summon", kind: "card-text", cid: 14947, url: EN, read: "2026-11-26", quote: "You can only Special Summon \"Sky Striker Ace - Zeke(s)\" once per turn." },
		{ id: "banish", kind: "card-text", cid: 14947, url: EN, read: "2026-11-26", quote: "If this card is Link Summoned: You can target 1 face-up monster on the field; banish it until your opponent's next End Phase." },
		{ id: "gain", kind: "card-text", cid: 14947, url: EN, read: "2026-11-26", quote: "Once per turn: You can target 1 other card you control; this card gains 1000 ATK, then, send the targeted card to the GY." },
		// OCG only. Konami's notes (補足情報, 2021-12-25), page read 2026-11-26.
		{ id: "notes-not-effect", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。" },
		{ id: "notes-banish-trigger", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-banish-target", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■この効果を発動する際に、モンスターゾーンの表側表示のモンスター１体を対象に選択します。" },
		{ id: "notes-banish-return", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■この効果で除外されたモンスターは次の相手のエンドフェイズに、除外された時の表示形式で、除外された時のコントローラーのメインモンスターゾーンに戻ります。その際にチェーンブロックは作られません。（これは特殊召喚ではありません。）" },
		{ id: "notes-gain-ignition", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる起動効果です。" },
		{ id: "notes-gain-resolution", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■処理時に、『このカードの攻撃力は１０００アップする』を適用します。適用した場合、その後『対象のカードを墓地へ送る』処理を行います。（処理時に、このカードがモンスターゾーンに存在しない場合、攻撃力をアップする効果が適用されていませんので、墓地へ送る処理も行いません。）" },
		{ id: "notes-gain-not-simultaneous", kind: "jp-notes", cid: 14947, url: NOTES, read: "2026-11-26", quote: "■攻撃力をアップする処理と墓地へ送る処理は同時に行われません。" },
		// OCG only. Konami's Q&A fids 8571 (2026-04-09) and 17476 (2026-07-31), pages read 2026-11-26. Both are in this card's Q&A list (3 entries); the third (fid 12619) is about "Farfa" and
		// an Ancestral monster treated as a Monster, cards of neither list, and was not opened.
		{ id: "qa-zone-8571", kind: "jp-qa", cid: 14947, fid: 8571, url: qa(8571), read: "2026-11-26", quote: "相手が決めます。" },
		{ id: "qa-control-no-duration-17476", kind: "jp-qa", cid: 14947, fid: 17476, url: qa(17476), read: "2026-11-26", quote: "「No.11 ビッグ・アイ」のように、コントロールを得る期間が定められていない効果については、一時的に除外された場合でも、相手にコントロールが戻ることはありません。" },
		{ id: "qa-control-duration-17476", kind: "jp-qa", cid: 14947, fid: 17476, url: qa(17476), read: "2026-11-26", quote: "「心変わり」のように、コントロールを得る期間が定められている効果については、一時的に除外された時点で効果の適用が終了し、モンスターゾーンに戻りますと、直ちに相手にコントロールが戻ります。" },
	],
	effects: ["facts", "procedure", "link-only", "once-summon", "banish", "gain"],
	rulings: [
		{ source: "notes-not-effect" },
		{ source: "notes-banish-trigger" },
		{ source: "notes-banish-target" },
		{ source: "notes-banish-return" },
		{ source: "notes-gain-ignition" },
		{ source: "notes-gain-resolution" },
		{ source: "notes-gain-not-simultaneous" },
		{ source: "qa-zone-8571" },
		{ source: "qa-control-no-duration-17476" },
		{ source: "qa-control-duration-17476" },
	],
};
