import type { CardSources } from "../coverage";
import { battledNow, destroyedByBattleNow } from "../battle";
import { type Duel, equipsOf, type Side } from "../duel";
import { type CardDef, type EffectRecord, targetsOf } from "../effects";
import { hasPrintedName } from "../identity";
import { fromTraps } from "../modifiers";
import { askSetByEffect, canSetByEffect } from "../set";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Blue-Eyes Tyrant Dragon";
const BEWD = "Blue-Eyes White Dragon";

/** "1 Trap in your GY" that can be Set now (a Trap Card of any kind, Counter Traps included). */
const toSet = (duel: Duel, player: Side): number[] => duel.piles[player].graveyard.filter((id) => (duel.defs[duel.cards[id]!.code]?.kind === "trap" || duel.defs[duel.cards[id]!.code]?.kind === "counter-trap") && canSetByEffect(duel, player, id));

/**
 * "At the end of the Damage Step, if this card battled": in the Monster Zone when it was not destroyed by that battle, in the Graveyard when it was
 * destroyed by battle and sent there, while banished when it was destroyed by battle and banished face-up (Konami's notes): one record per place.
 */
const setFromTheGraveyard = (range: "field" | "graveyard" | "banished"): EffectRecord => ({
	type: "trigger",
	range,
	timing: "if",
	categories: ["set-from-graveyard"],
	// "Once per turn", by the card: the Q&A fid 23394 says a use made on the field is a use of the card in the Graveyard too (`acrossMoves`);
	// Summoned again after it left the field, it is a new card with a use of its own.
	once: { scope: "instance", key: "blue-eyes-tyrant-dragon-set", acrossMoves: true },
	condition: (duel, { player }) => toSet(duel, player).length > 0,
	target: (duel, { player }) => toSet(duel, player),
	// While banished, only face-up (notes: 表側で除外): banished face-down, it cannot be activated.
	event: (duel, event, { card }) => event.type === "damage-step" && event.step === "end" && battledNow(duel, card.id) && (range === "field") !== destroyedByBattleNow(duel, card.id) && (range !== "banished" || card.face === "up"),
	operation: (duel, link) => {
		const target = targetsOf(duel, link)[0];
		return target && target.zone === "graveyard" ? askSetByEffect(duel, link.player, target.id, { effect: link }) : duel;
	},
});

/**
 * ""Blue-Eyes White Dragon" + 1 Dragon monster. Must first be either Fusion Summoned, or Special Summoned from your Extra Deck by Tributing 1
 * "Blue-Eyes White Dragon" equipped with a Fusion Monster. Unaffected by Trap Cards or effects. Can attack all monsters your opponent controls,
 * once each. Once per turn, at the end of the Damage Step, if this card battled: You can target 1 Trap in your GY; Set it." A LIGHT Dragon Fusion
 * Effect Monster of Level 8.
 *
 * - Summoning condition (not an effect: Konami's notes): the Fusion Summon with "Blue-Eyes White Dragon" and 1 Dragon monster, or the other way,
 *   an action that Tributes (as Fusion Material, so its Equip Card is destroyed) a face-up "Blue-Eyes White Dragon" equipped with a Fusion Monster,
 *   then Special Summons it from the Extra Deck. Both are proper Summons; the second is not a Fusion Summon. From the Extra Deck it comes by those
 *   two ways only (`summon.mustFirstBeProper`); from elsewhere the rule of Fusion Monsters applies.
 * - "Unaffected by Trap Cards or effects": a Continuous Effect of the Monster Zone (notes): the effects of Trap Cards do not apply to it (it can
 *   still be targeted). Konami's Q&A fid 23897 (Skill Drain, 2026-09-05): with "Skill Drain" already applying when it is Summoned, this effect is
 *   itself negated; with "Skill Drain" activated afterwards, it applies as usual and the card is not affected by it. The core orders the two by the
 *   stamp of when each began to apply.
 * - "Can attack all monsters your opponent controls, once each": a Continuous Effect of the Monster Zone (notes), the `all-monsters` permission: no
 *   attack on a monster already attacked, none directly after an attack on a monster or the other way round (Q&A fid 16016); negated at a
 *   later declaration, no further attack, negated in the Damage Step the battle goes on (Q&A fid 11046).
 * - Third effect: an optional Trigger Effect, "if" (it does not miss its timing), at the end of the Damage Step, activated in the Monster Zone when
 *   it was not destroyed by that battle, in the Graveyard when it was destroyed by battle and sent there, while banished when it was destroyed and
 *   banished face-up (notes). It targets 1 Trap Card in the player's own Graveyard that can be Set, and Sets it. Once per turn for the card, a use
 *   on the field also a use in the Graveyard (Q&A fid 23394, `once.acrossMoves`); a card that comes to the field again has a new use.
 */
export const BLUE_EYES_TYRANT_DRAGON: CardDef = {
	code: "blue-eyes-tyrant-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "fusion", level: 8, atk: 3400, def: 2900, archetypes: ["Blue-Eyes"], mentions: [BEWD] },
	summon: { mustFirstBeProper: true },
	procedure: {
		kind: "fusion",
		materials: [
			{ min: 1, max: 1, filter: (duel, card) => hasPrintedName(duel, card.id, BEWD) },
			{ min: 1, max: 1, filter: (duel, card) => factsOf(duel, card.id)?.monsterType === "Dragon" },
		],
		alternatives: [{ how: "tribute", materials: [{ min: 1, max: 1, filter: (duel, card) => card.face === "up" && hasPrintedName(duel, card.id, BEWD) && equipsOf(duel, card.id).some((id) => factsOf(duel, id)?.frame === "fusion") }] }],
	},
	effects: [
		{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromTraps }] },
		{ type: "continuous", modifies: () => [{ kind: "attack", allows: { what: "all-monsters" } }] },
		setFromTheGraveyard("field"),
		setFromTheGraveyard("graveyard"),
		setFromTheGraveyard("banished"),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=16842&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(16842, "en");

export const BLUE_EYES_TYRANT_DRAGON_SOURCES: CardSources = {
	code: "blue-eyes-tyrant-dragon",
	cid: 16842,
	french: {
		text: "\"Dragon Blanc aux Yeux Bleus\" + 1 monstre Dragon\nDoit d'abord être soit Invoquée par Fusion, soit Invoquée Spécialement depuis votre Extra Deck en Sacrifiant 1 \"Dragon Blanc aux Yeux Bleus\" équipé avec un Monstre Fusion. Non affectée ni par des Cartes Piège ni par des effets de Piège. Peut attaquer une fois tous les monstres contrôlés par votre adversaire. Une fois par tour, à la fin de la Damage Step, si cette carte a combattu : vous pouvez cibler 1 Piège dans votre Cimetière ; Posez-le.",
		url: konamiCardUrl(16842, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "Blue-Eyes Tyrant Dragon LIGHT Level 8 ATK 3400 DEF 2900 Dragon ／ Fusion／Effect" },
		{ id: "procedure", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "\"Blue-Eyes White Dragon\" + 1 Dragon monster" },
		{ id: "alternative", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "Must first be either Fusion Summoned, or Special Summoned from your Extra Deck by Tributing 1 \"Blue-Eyes White Dragon\" equipped with a Fusion Monster." },
		{ id: "unaffected", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "Unaffected by Trap Cards or effects." },
		{ id: "attack-all", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "Can attack all monsters your opponent controls, once each." },
		{ id: "set", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "at the end of the Damage Step, if this card battled: You can target 1 Trap in your GY; Set it." },
		{ id: "once", kind: "card-text", cid: 16842, url: EN, read: "2026-11-25", quote: "Once per turn, at the end of the Damage Step, if this card battled:" },
		// OCG only. Konami's notes (補足情報, 2024-03-23), page read 2026-11-25.
		{ id: "notes-alternative-not-effect", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "■効果として扱いません。エクストラデッキのこのモンスターを特殊召喚する方法・手順です。" },
		{ id: "notes-alternative-not-fusion", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "■●の方法での特殊召喚は融合召喚ではありません。ただし、●の方法で特殊召喚する手順に使用するモンスターは融合素材としてリリースします。" },
		{ id: "notes-extra-deck-only", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "■エクストラデッキからの特殊召喚がこれらの方法に限られます。（エクストラデッキ以外からの特殊召喚については、融合モンスターの特殊召喚のルールに従います。）" },
		{ id: "notes-unaffected-field", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "【①の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-attack-all-field", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "【②の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-set-field", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "■このカードが戦闘で破壊されなかった場合にはモンスターゾーンで、" },
		{ id: "notes-set-graveyard", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "戦闘で破壊され墓地へ送られた場合には墓地で、" },
		{ id: "notes-set-banished", kind: "jp-notes", cid: 16842, url: NOTES, read: "2026-11-25", quote: "戦闘で破壊され表側で除外された場合には除外状態で発動できます。" },
		// Its 11 Q&A entries were listed (titles read); the seven that concern its own clauses were opened on 2026-11-25 (OCG only): fids 23897, 11046, 16016, 23394, 20, 12701 and 12647; the other four (Fusion Prohibition Area, Blue-Eyes Twin Burst Dragon with the Swamp King, "Fusion Dismissal" and Chimeratech Fortress Dragon) are about other cards' clauses.
		{ id: "qa-skill-drain-before", kind: "jp-qa", cid: 16842, fid: 23897, url: qa(23897), read: "2026-11-25", quote: "「スキルドレイン」の適用中に、「ジ・アライバル・サイバース＠イグニスター」が特殊召喚された場合、『③：このカードは他のカードの効果を受けない』効果は「スキルドレイン」によって無効になります。" },
		{ id: "qa-skill-drain-after", kind: "jp-qa", cid: 16842, fid: 23897, url: qa(23897), read: "2026-11-25", quote: "また、「ジ・アライバル・サイバース＠イグニスター」が特殊召喚された後に「スキルドレイン」が発動した場合、『③：このカードは他のカードの効果を受けない』効果は通常通り適用されますので、「ジ・アライバル・サイバース＠イグニスター」は「スキルドレイン」の効果を受けません。" },
		{ id: "qa-multi-attack-negated", kind: "jp-qa", cid: 16842, fid: 11046, url: qa(11046), read: "2026-11-25", quote: "２回目以降の攻撃宣言を行った際に永続効果が無効化された場合、２回目以降の攻撃はできなくなります。" },
		{ id: "qa-attack-all-direct", kind: "jp-qa", cid: 16842, fid: 16016, url: qa(16016), read: "2026-11-25", quote: "戦闘の巻き戻しによって攻撃対象をモンスターへと変更して攻撃を行った場合でも、『このカードは相手モンスター全てに１回ずつ攻撃できる』効果によって他のモンスターに攻撃することはできなくなります。" },
		{ id: "qa-once-after-destruction", kind: "jp-qa", cid: 16842, fid: 23394, url: qa(23394), read: "2026-11-25", quote: "そのダメージステップ終了時に再度『③』の効果を発動することはできません。" },
		{ id: "qa-noble-de-noir", kind: "jp-qa", cid: 16842, fid: 12701, url: qa(12701), read: "2026-11-25", quote: "相手の「阿修羅」が１回目の攻撃を行う際に、自分が「マシュマロン」を指定し、それに攻撃宣言させた場合、その後の「阿修羅」が２回目の攻撃を行う際には、「ノーブル・ド・ノワール」を指定し、それに攻撃宣言させることになります。" },
		{ id: "qa-mutation", kind: "jp-qa", cid: 16842, fid: 20, url: qa(20), read: "2026-11-25", quote: "（A）（B）特殊召喚できません。" },
		{ id: "qa-lifeline", kind: "jp-qa", cid: 16842, fid: 12647, url: qa(12647), read: "2026-11-25", quote: "８００アップします。" },
	],
	effects: ["facts", "procedure", "alternative", "unaffected", "attack-all", "set", "once"],
	rulings: [
		{ source: "notes-alternative-not-effect" },
		{ source: "notes-alternative-not-fusion" },
		{ source: "notes-extra-deck-only" },
		{ source: "notes-unaffected-field" },
		{ source: "notes-attack-all-field" },
		{ source: "notes-set-field" },
		{ source: "notes-set-graveyard" },
		{ source: "notes-set-banished" },
		{ source: "qa-skill-drain-before" },
		{ source: "qa-skill-drain-after" },
		{ source: "qa-multi-attack-negated" },
		{ source: "qa-attack-all-direct" },
		{ source: "qa-once-after-destruction" },
		{ source: "qa-mutation" },
		{ source: "qa-noble-de-noir", pending: "Fid 12701 is about a monster that makes the opponent's attackers attack the one it names (\"Noble de Noir\"), which the core does not have" },
		{ source: "qa-lifeline", pending: "Fid 12647 is about \"Lifeline\" (a Trap that Special Summons a monster destroyed by battle, with 800 more ATK), which the core does not have" },
	],
};
