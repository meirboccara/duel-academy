import { attackAgain, attackedNow } from "../battle";
import { negateActivationAndDestroy } from "../chain";
import type { CardSources } from "../coverage";
import { type Duel, effectDestruction, moveCard, moveCards, type Side } from "../duel";
import type { CardDef } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Neo Blue-Eyes Ultimate Dragon";
const BEWD = "Blue-Eyes White Dragon";
const BLUE_EYES = "Blue-Eyes";

/** "1 "Blue-Eyes" Fusion Monster from your Extra Deck": what the cost sends. */
const costs = (duel: Duel, player: Side): number[] => duel.piles[player].extra.filter((id) => factsOf(duel, id)?.frame === "fusion" && belongsTo(duel, id, BLUE_EYES));

/** "This is the only face-up card you control": no other face-up card in a Monster Zone, a Spell & Trap Zone (an Equip Card included) or the Field Zone. */
const onlyFaceUpCard = (duel: Duel, player: Side, id: number): boolean => [...duel.piles[player].monster, ...duel.piles[player].spell, ...duel.piles[player].field].every((other) => other === id || duel.cards[other]!.face !== "up");

/**
 * "When a card or effect is activated that targets a "Blue-Eyes" monster(s) you control": the link on top of the chain has, among its targets (the
 * monster is one of them: notes), a "Blue-Eyes" monster face-up in `player`'s Monster Zone that is still the card it targeted.
 */
const aimsAtBlueEyes = (duel: Duel, player: Side): boolean => {
	const top = duel.chain.at(-1);
	return (
		top !== undefined &&
		top.targets.some((id, at) => {
			const target = duel.cards[id]!;
			return target.moves === top.targetMoves[at] && target.controller === player && target.zone === "monster" && target.face === "up" && belongsTo(duel, id, BLUE_EYES);
		})
	);
};

/**
 * ""Blue-Eyes White Dragon" + "Blue-Eyes White Dragon" + "Blue-Eyes White Dragon". At the end of the Damage Step, if this Fusion Summoned card attacked,
 * and this is the only face-up card you control: You can send 1 "Blue-Eyes" Fusion Monster from your Extra Deck to the GY; this card can attack again in a
 * row. You can use this effect of "Neo Blue-Eyes Ultimate Dragon" twice per turn. When a card or effect is activated that targets a "Blue-Eyes"
 * monster(s) you control (Quick Effect): You can banish this card from your GY; negate the activation, and if you do, destroy that card." A LIGHT Dragon
 * Fusion Effect Monster of Level 12, and a "Blue-Eyes" monster (Konami's notes).
 *
 * - Procedure: the Fusion Materials, 3 cards named "Blue-Eyes White Dragon" (an effect that Fusion Summons names where they come from).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone (notes) at the end of the Damage Step, for the attacking monster of that attack
 *   (`attackedNow`: it attacked, with no need for damage calculation: Konami's Q&A fid 19155) that was Fusion Summoned (`summonedBy`: still so after a
 *   flip face-down or a temporary banishment, notes; not after a Special Summon from the GY: Q&A fid 19157), still in the Monster Zone (a card
 *   destroyed by that battle cannot: notes), when it is the only face-up card its controller controls. Sending a "Blue-Eyes" Fusion Monster from
 *   the Extra Deck is the cost (notes). "Attack again in a row" is `attackAgain`. "Twice per turn" is a limit of 2 uses by name.
 * - Second effect: a Quick Effect activated in the Graveyard (notes), also in the Damage Step (notes, OCG only: `damageStep: true`), chained directly to a
 *   card or effect (a Spell, a Trap or a monster effect) that has among its targets a face-up "Blue-Eyes" monster in its controller's Monster Zone. Banishing
 *   this card is the cost; the negation and the destruction of that card are `negateActivationAndDestroy` (the destruction is done only if the activation
 *   was negated: "and if you do").
 */
export const NEO_BLUE_EYES_ULTIMATE_DRAGON: CardDef = {
	code: "neo-blue-eyes-ultimate-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "fusion", level: 12, atk: 4500, def: 3800, archetypes: [BLUE_EYES], mentions: [BEWD] },
	procedure: { kind: "fusion", materials: [1, 2, 3].map(() => ({ min: 1, max: 1, filter: (duel: Duel, card: { readonly id: number }) => hasPrintedName(duel, card.id, BEWD) })) },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["attack-again"],
			once: { scope: "name", key: "neo-blue-eyes-ultimate-dragon-again", times: 2 },
			event: (duel, event, { card }) => event.type === "damage-step" && event.step === "end" && attackedNow(duel, card.id),
			condition: (duel, { player, card }) => card.summonedBy === "fusion" && onlyFaceUpCard(duel, player, card.id) && costs(duel, player).length > 0,
			cost: { pick: (duel, { player }) => costs(duel, player).map((id) => [id]), pay: (duel, _ctx, picked) => (picked.length === 1 ? moveCards(duel, picked, { zone: "graveyard" }) : null) },
			operation: (duel, link) => attackAgain(duel, link.card.id),
		},
		{
			type: "quick",
			range: "graveyard",
			damageStep: true,
			categories: ["negate", "destroy"],
			condition: (duel, { player }) => aimsAtBlueEyes(duel, player),
			cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }),
			operation: (duel, link) => (link.answers === null ? duel : negateActivationAndDestroy(duel, link.answers, effectDestruction(link))),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12484&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(12484, "en");

export const NEO_BLUE_EYES_ULTIMATE_DRAGON_SOURCES: CardSources = {
	code: "neo-blue-eyes-ultimate-dragon",
	cid: 12484,
	french: {
		text: "\"Dragon Blanc aux Yeux Bleus\" + \"Dragon Blanc aux Yeux Bleus\" + \"Dragon Blanc aux Yeux Bleus\"\nÀ la fin de la Damage Step, si cette carte Invoquée par Fusion a attaqué, et que c'est la seule carte face recto que vous contrôlez : vous pouvez envoyer 1 Monstre Fusion \"Yeux Bleus\" depuis votre Extra Deck au Cimetière ; cette carte peut attaquer une nouvelle fois à la suite. Vous pouvez utiliser cet effet de \"Néo Dragon Ultime aux Yeux Bleus\" deux fois par tour. Lorsqu'une carte ou un effet qui cible un ou plusieurs monstres \"Yeux Bleus\" que vous contrôlez est activé (Effet Rapide) : vous pouvez bannir cette carte depuis votre Cimetière ; annulez l'activation, et si vous le faites, détruisez la carte.",
		url: konamiCardUrl(12484, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 12484, url: EN, read: "2026-11-25", quote: "Neo Blue-Eyes Ultimate Dragon LIGHT Level 12 ATK 4500 DEF 3800 Dragon ／ Fusion／Effect" },
		{ id: "procedure", kind: "card-text", cid: 12484, url: EN, read: "2026-11-25", quote: "\"Blue-Eyes White Dragon\" + \"Blue-Eyes White Dragon\" + \"Blue-Eyes White Dragon\"" },
		{ id: "attack-again", kind: "card-text", cid: 12484, url: EN, read: "2026-11-25", quote: "At the end of the Damage Step, if this Fusion Summoned card attacked, and this is the only face-up card you control: You can send 1 \"Blue-Eyes\" Fusion Monster from your Extra Deck to the GY; this card can attack again in a row." },
		{ id: "once", kind: "card-text", cid: 12484, url: EN, read: "2026-11-25", quote: "You can use this effect of \"Neo Blue-Eyes Ultimate Dragon\" twice per turn." },
		{ id: "negate", kind: "card-text", cid: 12484, url: EN, read: "2026-11-25", quote: "When a card or effect is activated that targets a \"Blue-Eyes\" monster(s) you control (Quick Effect): You can banish this card from your GY; negate the activation, and if you do, destroy that card." },
		// OCG only. Konami's notes (補足情報, 2024-03-23), page read 2026-11-25. Its 7 Q&A entries: the titles were read and four opened (fids 19155, 19157, 19182 and 22795, which concern its clauses); the other three (fids 10709, 19414, 19195) are about "Ultimate Burst" and "Cubic Wave" and not about its clauses.
		{ id: "notes-archetype", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "■「ブルーアイズ」モンスターです。" },
		{ id: "notes-attack-field", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "【①の効果について】■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-attack-cost", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "■この効果を発動する際にコストとして、エクストラデッキから「ブルーアイズ」融合モンスター１体を墓地へ送ります。" },
		{ id: "notes-attack-must-remain", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "（このカードが戦闘で破壊されモンスターゾーンを離れた場合には発動できません。）" },
		{ id: "notes-attack-after-flip-banish", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "■融合召喚したこのカードが裏側守備表示になった後に表側表示に戻ったのちに攻撃した場合や、一時的に除外されモンスターゾーンに戻ったのちに攻撃した場合でも、ダメージステップ終了時に発動できます。" },
		{ id: "notes-gy-quick", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "【②の効果について】■墓地で発動できる誘発即時効果です。" },
		{ id: "notes-gy-target-includes", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "■自分のモンスターゾーンの表側表示の「ブルーアイズ」モンスターを対象とする（対象に含む）魔法・罠・モンスターの効果が発動した時、その発動に直接チェーンして発動できます。" },
		{ id: "notes-gy-damage-step", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "■ダメージステップ中でも発動できます。" },
		{ id: "notes-gy-direct-chain", kind: "jp-notes", cid: 12484, url: NOTES, read: "2026-11-25", quote: "■自分のモンスターゾーンに表側表示で存在する「ブルーアイズ」モンスターを対象とする効果の発動（＝魔法・罠カードのカードの発動、魔法・罠カードの効果の発動、モンスターの効果の発動）に直接チェーンして発動できます。" },
		{ id: "qa-divine-punishment", kind: "jp-qa", cid: 12484, fid: 19155, url: qa(19155), read: "2026-11-25", quote: "「真青眼の究極竜」は攻撃を行っていますので、そのダメージステップ終了時にモンスター効果を発動する事はできます。" },
		{ id: "qa-call-of-the-haunted", kind: "jp-qa", cid: 12484, fid: 19157, url: qa(19157), read: "2026-11-25", quote: "攻撃を行った場合でも、ダメージステップ終了時にモンスター効果を発動する事はできません。" },
		{ id: "qa-wonder-clover", kind: "jp-qa", cid: 12484, fid: 19182, url: qa(19182), read: "2026-11-25", quote: "「真青眼の究極竜」の『このカードは続けて攻撃できる』モンスター効果を発動する事はできません。" },
		{ id: "qa-matter-transporter", kind: "jp-qa", cid: 12484, fid: 22795, url: qa(22795), read: "2026-11-25", quote: "自分の墓地から3体の「青眼の白龍」を特殊召喚する事ができます。" },
	],
	effects: ["facts", "procedure", "attack-again", "once", "negate"],
	rulings: [
		{ source: "notes-archetype" },
		{ source: "notes-attack-field" },
		{ source: "notes-attack-cost" },
		{ source: "notes-attack-must-remain" },
		{ source: "notes-attack-after-flip-banish" },
		{ source: "notes-gy-quick" },
		{ source: "notes-gy-target-includes" },
		{ source: "notes-gy-damage-step" },
		{ source: "notes-gy-direct-chain" },
		{ source: "qa-divine-punishment" },
		{ source: "qa-call-of-the-haunted" },
		{ source: "qa-wonder-clover", pending: "Fid 19182 is about \"Wonder Clover\" (an Equip Spell that gives a second attack), which the core does not have; with another permission to attack again already applying, the effect is not activated" },
		{ source: "qa-matter-transporter", pending: "Fid 22795 is about \"Interdimensional Matter Transporter\" and \"Fusion Dismissal\", which the core does not have" },
	],
};
