import { destroyCard, effectDestruction } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import type { CardSources } from "../coverage";
import { spellsAndTraps } from "./helpers";
import { konamiCardUrl } from "../sources";

/**
 * "Target 1 Spell/Trap on the field; destroy that target." A Quick-Play Spell (Konami's OCG name: "Cyclone", cid 4909).
 *
 * - Target (notes, OCG): a face-up or a face-down Spell/Trap on the field, of either player, the Field Zone too; never the card being activated
 *   (notes; Q&A fid 6077). With no other card in a Spell & Trap Zone it cannot be activated (notes).
 * - A Quick-Play Spell that changes no ATK or DEF, so it is not activated in the Damage Step (notes; the core's rule for Quick-Play Spells).
 * - "That target": it must still be on the field as a Spell or Trap when this resolves, and be the same card (a card that left and came back is
 *   another one: the core's reading of "that target", no Konami page found).
 * - Destroying is a move to the Graveyard attributed to this effect (`effectDestruction`): "If this card is destroyed by the effect of "Mystical
 *   Space Typhoon"" (Radiant Typhoon Vision) reads that attribution.
 */
export const MYSTICAL_SPACE_TYPHOON: CardDef = {
	code: "mystical-space-typhoon",
	kind: "quick-play",
	facts: { name: "Mystical Space Typhoon" },
	effects: [
		{
			type: "activation",
			categories: ["destroy"],
			target: (duel, { card }) => spellsAndTraps(duel).filter((id) => id !== card.id),
			operation: (duel, link) => {
				// "that target": it must still be on the field as a Spell or Trap when this resolves.
				const target = targetsOf(duel, link)[0];
				return target && (target.zone === "spell" || target.zone === "field") ? destroyCard(duel, target.id, { destruction: effectDestruction(link) }) : duel;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4909&request_locale=ja";
const EN = konamiCardUrl(4909, "en");

export const MYSTICAL_SPACE_TYPHOON_SOURCES: CardSources = {
	code: "mystical-space-typhoon",
	cid: 4909,
	french: { text: "Ciblez 1 Magie/Piège sur le Terrain ; détruisez la cible.", url: konamiCardUrl(4909, "fr"), read: "2026-11-26" },
	sources: [
		{ id: "facts", kind: "card-text", cid: 4909, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "text", kind: "card-text", cid: 4909, url: EN, read: "2026-11-26", quote: "Target 1 Spell/Trap on the field; destroy that target." },
		// OCG only. Konami's notes (補足情報, 2022-04-29), page read 2026-11-26. The card has 306 Q&A (all 306 titles listed 2026-11-26). Fids 6077 and 21953 are opened:
		// the others are about Continuous Spells and Traps destroyed in their own chain, Pendulum Monsters, equipped monsters and other cards (none names a card of
		// the lists but fid 21953, whose card is not in Academy).
		{ id: "notes-targets", kind: "jp-notes", cid: 4909, url: NOTES, read: "2026-11-26", quote: "■表側表示・裏側表示のどちらの状態のカードでも対象に選択できます。" },
		{ id: "notes-not-itself", kind: "jp-notes", cid: 4909, url: NOTES, read: "2026-11-26", quote: "■この効果を発動する際に、このカード自身を対象にすることはできません。" },
		{ id: "notes-needs-another-card", kind: "jp-notes", cid: 4909, url: NOTES, read: "2026-11-26", quote: "■魔法&罠ゾーンにこのカード以外のカードが存在しない場合は発動できません。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 4909, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		// OCG only. Konami's Q&A fid 6077 (2017-03-24), page read 2026-11-26.
		{ id: "qa-not-itself", kind: "jp-qa", cid: 4909, fid: 6077, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=6077&request_locale=ja", read: "2026-11-26", quote: "「サイクロン」等の効果によって、破壊する対象として、発動した「サイクロン」自身を選択する事はできません。" },
		// OCG only. Konami's Q&A fid 21953 (2022-12-30), page read 2026-11-26: a Blue-Eyes Spell activated whose effect removes this very card, destroyed by this card in its chain.
		{ id: "qa-blue-eyes-destroyed-in-its-chain", kind: "jp-qa", cid: 4909, fid: 21953, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=21953&request_locale=ja", read: "2026-11-26", quote: "したがって、質問の状況のように、チェーンして発動した「サイクロン」の効果によって「青き眼の激臨」自身が破壊され、フィールドに存在しなくなっている場合には" },
	],
	effects: ["facts", "text"],
	rulings: [
		{ source: "notes-targets" },
		{ source: "notes-not-itself" },
		{ source: "notes-needs-another-card" },
		{ source: "notes-no-damage-step" },
		{ source: "qa-not-itself" },
		{ source: "qa-blue-eyes-destroyed-in-its-chain", pending: "Fid 21953 is about the OCG Spell 「青き眼の激臨」 (its own effect banishes cards including itself, so it does nothing once destroyed in its chain), which Academy does not have; what Mystical Space Typhoon does there (the attribution of its destruction) is tested with Radiant Typhoon Vision" },
	],
};
