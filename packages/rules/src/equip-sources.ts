import { konamiCardUrl, type SourceRecord } from "./sources";

/**
 * Step 11, monsters treated as Equip Cards: the Konami pages cited by test/rules/monster-equips.test.ts, read on 2026-11-24. RB10 is
 * the TCG rulebook; the card texts are Konami's TCG database (English); the notes are Konami's Japanese database (OCG only: no formal
 * authority over the TCG), from the pages of the two cards of the exact Blue-Eyes list that use the mechanic: Wishes for Eyes of Blue
 * (cid 20604) and Blue-Eyes Tyrant Dragon (cid 16842). The tests use made-up cards with the same wording.
 */
const read = "2026-11-24";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });
const text = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "card-text", cid, url: konamiCardUrl(cid, "en"), read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });

export const EQUIP_SOURCES: readonly SourceRecord[] = [
	// RB10, Glossary, "Equip Cards".
	rb10("equipped-monster-is-equip-spell", "Equipped Traps remain Trap Cards, but equipped monsters are considered to be Equip Spells."),
	rb10("equipped-monster-stays", "If a Monster Card is equipped to another monster, it remains equipped to that monster and cannot be moved to a different target, even by card effects that would normally be able to do so."),

	// Wishes for Eyes of Blue: its text, and its notes on the second effect.
	text("equip-monster-from-extra-deck-text", 20604, "equip 1 \"Blue-Eyes\" monster from your Extra Deck to it as an Equip Spell that gives it 400 ATK."),
	notes("equip-effect-not-applied-to-target", 20604, "■対象のモンスターに適用する効果ではありません。（魔法カードの効果を受けないモンスターにも処理を適用できます。）"),

	// Blue-Eyes Tyrant Dragon: its Summoning condition, and its notes on it.
	text("tribute-equipped-procedure-text", 16842, "Must first be either Fusion Summoned, or Special Summoned from your Extra Deck by Tributing 1 \"Blue-Eyes White Dragon\" equipped with a Fusion Monster."),
	notes("tribute-equipped-not-an-effect", 16842, "■効果として扱いません。エクストラデッキのこのモンスターを特殊召喚する方法・手順です。"),
	notes("tribute-equipped-is-proper", 16842, "■融合召喚も●の方法による特殊召喚も、正規の方法によるこのカードの特殊召喚です。"),
	notes("tribute-equipped-extra-deck-only", 16842, "■エクストラデッキからの特殊召喚がこれらの方法に限られます。（エクストラデッキ以外からの特殊召喚については、融合モンスターの特殊召喚のルールに従います。）"),
	notes("tribute-equipped-then-summon", 16842, "■●の方法で特殊召喚する際には、リリースしたのち特殊召喚を行います。（これらは同時に行われません。）"),
	notes("tribute-equipped-not-fusion-summon", 16842, "■●の方法での特殊召喚は融合召喚ではありません。ただし、●の方法で特殊召喚する手順に使用するモンスターは融合素材としてリリースします。"),
];
