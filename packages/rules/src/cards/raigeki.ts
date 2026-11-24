import type { CardSources } from "../coverage";
import { effectDestruction, moveCards, other } from "../duel";
import type { CardDef } from "../effects";
import { konamiCardUrl } from "../sources";

/**
 * "Destroy all monsters your opponent controls." A Normal Spell. Konami's notes (OCG): it can be activated only while the opponent has a
 * monster in their Monster Zone, and it destroys every monster there when it resolves, whatever its battle position. The monsters are
 * destroyed at the same time (one batch), each attributed to this effect.
 */
export const RAIGEKI: CardDef = {
	code: "raigeki",
	kind: "spell",
	facts: { name: "Raigeki" },
	effects: [
		{
			type: "activation",
			categories: ["destroy"],
			condition: (duel, { player }) => duel.piles[other(player)].monster.length > 0,
			operation: (duel, link) => moveCards(duel, duel.piles[other(link.player)].monster, { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) }),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=4343&request_locale=ja";

export const RAIGEKI_SOURCES: CardSources = {
	code: "raigeki",
	cid: 4343,
	french: { text: "Détruisez tous les monstres contrôlés par votre adversaire.", url: konamiCardUrl(4343, "fr"), read: "2026-11-24" },
	sources: [
		{ id: "text", kind: "card-text", cid: 4343, url: konamiCardUrl(4343, "en"), read: "2026-11-24", quote: "Destroy all monsters your opponent controls." },
		// OCG only. Konami's notes (補足情報, 2024-02-23), page read 2026-11-24. Its 11 Q&A entries are about other cards' effects (none of
		// them a card of the core; Stardust Sifr Divine Dragon, of the Blue-Eyes list, is not scripted yet): titles read, entries not opened.
		{ id: "notes-activation", kind: "jp-notes", cid: 4343, url: NOTES, read: "2026-11-24", quote: "■相手のモンスターゾーンにモンスターが存在する状況で発動できます。" },
		{ id: "notes-all-positions", kind: "jp-notes", cid: 4343, url: NOTES, read: "2026-11-24", quote: "■処理時に、相手のモンスターゾーンに存在するモンスターを全て破壊します。（どの表示形式のモンスターも破壊します。）" },
	],
	effects: ["text"],
	rulings: [{ source: "notes-activation" }, { source: "notes-all-positions" }],
};
