import { describe, expect, it } from "vitest";
import fr from "@/lib/i18n/fr-content.json";
import { UI_FR } from "@/lib/i18n/ui-fr";

/**
 * French game terms as printed on Konami's official French card database
 * (https://www.db.yugioh-card.com/yugiohdb/, request_locale=fr). Each rule lists a variant that is NOT
 * the official wording, so the course never teaches a term players will not see on their cards.
 *
 *  - Polymérisation (cid 4837), Matériels            -> "Matériel", never "matériau"
 *  - Syntonisation de Combat (cid 7742)              -> "Jeu-Rapide" (hyphenated), "Syntoniseur"
 *  - Consécration par la Lumière et les Ténèbres (5907) -> "Sacrifiez" (Tribute)
 *  - Related cards on that database page -> "Bannissez" (modern banish wording)
 */
const NOT_OFFICIAL: { variant: RegExp; official: string }[] = [
	{ variant: /(?<!\p{L})mat[ée]riau(?:x)?(?!\p{L})/iu, official: "Matériel / Matériels (game materials in this catalog)" },
	{ variant: /(?<!\p{L})jeu\s+rapide(?!\p{L})/iu, official: "Jeu-Rapide" },
	{ variant: /(?<!\p{L})tributs?(?!\p{L})/iu, official: "Sacrifice / Sacrifiez (cid 5907)" },
	{ variant: /(?<!\p{L})retir(?:é(?:e?s?)?|er|ez)\s+du jeu(?!\p{L})/iu, official: "bannir / Bannissez (modern wording; legacy cid 7742 says Retirez du jeu)" },
	{ variant: /(?<!\p{L})accordeurs?(?!\p{L})/iu, official: "Syntoniseur" },
];

// Draw Phase, End Phase and Spell Speed rest on an older rulebook mirror, not on this card database, so they are not enforced here.
const MUST_APPEAR = ["Matériel", "Syntoniseur", "Jeu-Rapide", "Invocation Synchro", "Cimetière"];

const all = [...Object.entries(fr as Record<string, string>), ...Object.entries(UI_FR)];

describe("French terminology follows Konami's French database", () => {
	it.each(NOT_OFFICIAL)("never uses $variant (official: $official)", ({ variant }) => {
		const hits = all.filter(([, value]) => variant.test(value)).map(([english]) => english.slice(0, 70));
		expect(hits).toEqual([]);
	});

	it.each(MUST_APPEAR)("uses the official term %s", (term) => {
		expect(all.some(([, value]) => value.includes(term))).toBe(true);
	});
});
