import type { CardSources } from "../coverage";
import { destroyCard, effectDestruction, moveCard, other, type Duel, type Side } from "../duel";
import { type CardDef, type EffectRecord, targetsOf } from "../effects";
import { belongsTo, mentionsCard } from "../identity";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";

const NAME = "The Fallen & The Virtuous";
const ALBAZ = "Fallen of Albaz";
const ECCLESIA = "Ecclesia";

/** "1 monster that mentions "Fallen of Albaz" from your Extra Deck": a monster whose text names that card (Konami's notes), whatever its own name. */
const mentioningAlbaz = (duel: Duel, player: Side): number[] => duel.piles[player].extra.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && mentionsCard(duel, id, ALBAZ));

/** "1 face-up card on the field": a face-up monster, Spell or Trap of either player, the Field Zone included, other than this card. */
const faceUpCards = (duel: Duel, self: number): number[] =>
	[...duel.piles.you.monster, ...duel.piles.you.spell, ...duel.piles.you.field, ...duel.piles.rival.monster, ...duel.piles.rival.spell, ...duel.piles.rival.field].filter((id) => id !== self && duel.cards[id]!.face === "up");

/** "An "Ecclesia" monster in your field or GY": face-up on the field, or any in the Graveyard (Konami's notes). */
const hasEcclesia = (duel: Duel, player: Side): boolean =>
	duel.piles[player].monster.some((id) => duel.cards[id]!.face === "up" && belongsTo(duel, id, ECCLESIA)) || duel.piles[player].graveyard.some((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, ECCLESIA));

/** "1 monster in either GY" that can be Special Summoned to the player's field now. */
const reviveable = (duel: Duel, player: Side): number[] => [...duel.piles[player].graveyard, ...duel.piles[other(player)].graveyard].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && canSpecialSummon(duel, player, id));

/** The "You can only activate 1 "The Fallen & The Virtuous" per turn" use, shared by the two effects. A negated activation gives it back. */
const ONCE: EffectRecord["once"] = { scope: "activation", key: "the-fallen-and-the-virtuous" };

/**
 * "(This card is always treated as a "Branded" and "Dogmatika" card.) Activate 1 of these effects; ●Send 1 monster that mentions "Fallen of Albaz"
 * from your Extra Deck to the GY, then target 1 face-up card on the field; destroy it. ●If you have an "Ecclesia" monster in your field or GY:
 * Target 1 monster in either GY; Special Summon it to your field. You can only activate 1 "The Fallen & The Virtuous" per turn." A Quick-Play Spell.
 *
 * - Pattern P1 (docs/rules-core/sky-striker-gaps.md): the two ● are two `activation` records, because the first has a cost and the second none
 *   (`EffectMode` has no cost), sharing one `once` key by activation, so only one can be used a turn and a negated activation gives the use back.
 *   Konami's notes: the ● is chosen at activation, and neither can be activated in the Damage Step (a Quick-Play Spell that changes no ATK or
 *   DEF: the core's rule). The records are told apart by their `effect` index in the tests.
 * - "Always treated as a "Branded" and "Dogmatika" card": `facts.archetypes`, which no negation reaches (notes: not an effect).
 * - ●1: the Extra Deck monster is the cost (the Japanese text sends it and then targets, the notes call the whole an activation): paid when it is
 *   activated, and not paid when the Graveyard sends it elsewhere (`pay` is a plain send, so a redirect makes the cost fail). "Mentions "Fallen of
 *   Albaz"" is the monster's text naming that card (`facts.mentions`; notes). The target is chosen after the cost, among the face-up cards of the
 *   field other than this card (notes: it cannot target itself); it is destroyed when it resolves even if it was turned face-down meanwhile (notes).
 *   Limit: the core makes a card turned face-down a new card, so `targetsOf` forgets it; the card reads it as the same card when it is face-down in
 *   the Monster Zone and has moved exactly once since the activation (a flip), never for a card that left and came back (two moves or more).
 * - ●2: needs an "Ecclesia" monster face-up in the Monster Zone or in the Graveyard (notes), and targets a monster of either Graveyard that can be
 *   Special Summoned: a monster of the Extra Deck sent there without a proper Summon (the Dragon that Devours the Dogma sent by ●1) cannot.
 *   Neither list can use this today ("Ecclesia" cards are in the Extra Deck and are Special Summoned only by their own effects), but it is playable.
 */
export const THE_FALLEN_AND_THE_VIRTUOUS: CardDef = {
	code: "the-fallen-and-the-virtuous",
	kind: "quick-play",
	facts: { name: NAME, archetypes: ["Branded", "Dogmatika"], mentions: [ALBAZ, NAME] },
	effects: [
		{
			type: "activation",
			categories: ["send-to-graveyard", "destroy"],
			once: ONCE,
			cost: {
				pick: (duel, { player }) => mentioningAlbaz(duel, player).map((id) => [id]),
				pay: (duel, _ctx, picked) => (picked.length === 1 ? moveCard(duel, picked[0]!, { zone: "graveyard" }) : null),
			},
			target: (duel, { card }) => faceUpCards(duel, card.id),
			operation: (duel, link) => {
				const chosen = link.targets[0];
				if (chosen === undefined) return duel;
				const now = duel.cards[chosen]!;
				const same = targetsOf(duel, link)[0] !== undefined || (now.zone === "monster" && now.face === "down" && now.moves === link.targetMoves[0]! + 1);
				return same && (now.zone === "monster" || now.zone === "spell" || now.zone === "field") ? destroyCard(duel, chosen, { destruction: effectDestruction(link) }) : duel;
			},
		},
		{
			type: "activation",
			categories: ["special-summon"],
			once: ONCE,
			condition: (duel, { player }) => hasEcclesia(duel, player),
			target: (duel, { player }) => reviveable(duel, player),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				return target && target.zone === "graveyard" ? askSpecialSummon(duel, link.player, target.id) : duel;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=22089&request_locale=ja";
const EN = konamiCardUrl(22089, "en");

export const THE_FALLEN_AND_THE_VIRTUOUS_SOURCES: CardSources = {
	code: "the-fallen-and-the-virtuous",
	cid: 22089,
	french: {
		text: "(Cette carte est toujours traitée comme carte \"Marqué\" et \"Dogmatika\".)\nActivez 1 de ces effets ;\n●Envoyez 1 monstre qui mentionne \"Albaz le Déchu\" depuis votre Extra Deck au Cimetière, puis ciblez 1 carte face recto sur le Terrain ; détruisez-la.\n●Si vous avez un monstre \"Ecclésia\" dans votre Terrain ou Cimetière : ciblez 1 monstre dans l'un des Cimetières ; Invoquez-le Spécialement sur votre Terrain.\nVous ne pouvez activer qu'1 \"Le Déchu et La Vertueuse\" par tour.",
		url: konamiCardUrl(22089, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 22089, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "archetypes", kind: "card-text", cid: 22089, url: EN, read: "2026-11-26", quote: "(This card is always treated as a \"Branded\" and \"Dogmatika\" card.)" },
		{ id: "choose", kind: "card-text", cid: 22089, url: EN, read: "2026-11-26", quote: "Activate 1 of these effects;" },
		{ id: "destroy", kind: "card-text", cid: 22089, url: EN, read: "2026-11-26", quote: "●Send 1 monster that mentions \"Fallen of Albaz\" from your Extra Deck to the GY, then target 1 face-up card on the field; destroy it." },
		{ id: "revive", kind: "card-text", cid: 22089, url: EN, read: "2026-11-26", quote: "●If you have an \"Ecclesia\" monster in your field or GY: Target 1 monster in either GY; Special Summon it to your field." },
		{ id: "once", kind: "card-text", cid: 22089, url: EN, read: "2026-11-26", quote: "You can only activate 1 \"The Fallen & The Virtuous\" per turn." },
		// OCG only. Konami's notes (補足情報, 2025-10-25), page read 2026-11-26. Its single Q&A is fid 13612, opened below (about 「ヤミー☆サプライズ」 and
		// 「霊王の波動」, a card of neither list; its list of examples names this card).
		{ id: "notes-not-effect", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。（このカードの効果が無効化された場合でも、「烙印」カードや「ドラグマ」カードとして扱います。）" },
		{ id: "notes-mode", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■この効果を発動する際に『●』を１つ選択し、その『●』の効果として発動します。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■いずれの効果を選択する場合でも、ダメージステップには発動できません。" },
		{ id: "notes-mentions", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■『「アルバスの落胤」のカード名が記されたモンスター』とは、カードテキストに特定のカード名として「アルバスの落胤」と記されているモンスターを指します。" },
		{ id: "notes-not-itself", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■この効果を発動する際に、このカード自身を対象にすることはできません。" },
		{ id: "notes-face-down-target", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■モンスターを対象としてこの効果を発動し、処理時にそのモンスターが裏側守備表示になっている場合でも破壊の処理を行います。" },
		{ id: "qa-categories-by-mode", kind: "jp-qa", cid: 22089, fid: 13612, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=13612&request_locale=ja", read: "2026-11-26", quote: "（１つ目や３つ目の『●』効果を選択して「ヤミー☆サプライズ」を発動したのであれば、『モンスターを特殊召喚する効果』が含まれていませんので「霊王の波動」をチェーンして発動することはできません。）" },
		{ id: "notes-ecclesia", kind: "jp-notes", cid: 22089, url: NOTES, read: "2026-11-26", quote: "■自分のモンスターゾーンに「エクレシア」モンスターが表側表示で存在する場合、または自分の墓地に「エクレシア」モンスターが存在する場合に、この効果を選択して発動できます。" },
	],
	effects: ["facts", "archetypes", "choose", "destroy", "revive", "once"],
	rulings: [{ source: "notes-not-effect" }, { source: "notes-mode" }, { source: "notes-no-damage-step" }, { source: "notes-mentions" }, { source: "notes-not-itself" }, { source: "notes-face-down-target" }, { source: "notes-ecclesia" }, { source: "qa-categories-by-mode" }],
};
