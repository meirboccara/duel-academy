import type { CardSources } from "../coverage";
import { destroyCard, effectDestruction, type Duel, type Link } from "../duel";
import { type CardDef, type EffectRecord, effectOf } from "../effects";
import { konamiCardUrl } from "../sources";
import { sendThisToGraveyard } from "./helpers";

const isField = (zone: string) => zone === "monster" || zone === "spell" || zone === "field";

/**
 * The link Ghost Ogre & Snow Rabbit answers: the effect a monster on the field activates, or the effect a Spell/Trap that is already
 * face-up on the field activates. Konami's notes (OCG): not the activation of a Spell/Trap Card itself (`type: "activation"`), not an
 * effect activated from the hand or the Graveyard.
 */
function answered(duel: Duel): Link | undefined {
	const top = duel.chain[duel.chain.length - 1];
	if (!top || !isField(top.card.zone)) return undefined;
	return effectOf(duel, top).type === "activation" ? undefined : top;
}

/**
 * Is the card the link came from still on the field, never having left it since? Konami's notes: nothing happens if it has left the
 * field; a monster turned face-down is still it (Q&A fid 6334). Flips and control changes while it stays on the field keep it.
 */
const stillThere = (duel: Duel, link: Link): boolean => {
	const now = duel.cards[link.card.id]!;
	return isField(now.zone) && now.fieldEntries === link.card.fieldEntries;
};

const effect = (range: "hand" | "field"): EffectRecord => ({
	type: "quick",
	range,
	condition: (duel) => answered(duel) !== undefined,
	cost: sendThisToGraveyard,
	// One effect printed once: the hand record and the field record share its limit (a record has one `range`).
	once: { scope: "name", key: "ghost-ogre-snow-rabbit" },
	operation: (duel, link) => {
		const origin = duel.chain[link.answers!];
		return origin && stillThere(duel, origin) ? destroyCard(duel, origin.card.id, { destruction: effectDestruction(link) }) : duel;
	},
});

/** "When a monster on the field activates its effect, or when a Spell/Trap that is already face-up on the field activates its effect (Quick Effect): You can send this card from your hand or field to the GY; destroy that card on the field." One record per place. */
export const GHOST_OGRE_SNOW_RABBIT: CardDef = {
	code: "ghost-ogre-snow-rabbit",
	kind: "monster",
	facts: { name: "Ghost Ogre & Snow Rabbit", attribute: "LIGHT", monsterType: "Psychic", level: 3, tuner: true, atk: 0, def: 1800 },
	effects: [effect("hand"), effect("field")],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=11708&request_locale=ja";

export const GHOST_OGRE_SNOW_RABBIT_SOURCES: CardSources = {
	code: "ghost-ogre-snow-rabbit",
	cid: 11708,
	french: {
		text: "Lorsqu'un monstre sur le Terrain active son effet, ou lorsqu'un Magie/Piège qui est déjà face recto sur le Terrain active son effet (Effet Rapide) : vous pouvez envoyer cette carte depuis votre main ou Terrain au Cimetière ; détruisez la carte sur le Terrain. Vous ne pouvez utiliser cet effet de \"Ogre Fantôme et Lapin des Neiges\" qu'une fois par tour.",
		url: konamiCardUrl(11708, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{
			id: "text",
			kind: "card-text",
			cid: 11708,
			url: konamiCardUrl(11708, "en"),
			read: "2026-11-24",
			quote: "When a monster on the field activates its effect, or when a Spell/Trap that is already face-up on the field activates its effect (Quick Effect): You can send this card from your hand or field to the GY; destroy that card on the field.",
		},
		{ id: "once", kind: "card-text", cid: 11708, url: konamiCardUrl(11708, "en"), read: "2026-11-24", quote: "You can only use this effect of \"Ghost Ogre & Snow Rabbit\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-12-21), page read 2026-11-24.
		{ id: "notes-field", kind: "jp-notes", cid: 11708, url: NOTES, read: "2026-11-24", quote: "■手札またはモンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-answers", kind: "jp-notes", cid: 11708, url: NOTES, read: "2026-11-24", quote: "（魔法・罠カードの、カードの発動にチェーンして発動することはできません。）" },
		{ id: "notes-not-negation", kind: "jp-notes", cid: 11708, url: NOTES, read: "2026-11-24", quote: "■直前のチェーンブロックの効果の発動や発動した効果を無効にする効果ではありません。" },
		{ id: "notes-left-the-field", kind: "jp-notes", cid: 11708, url: NOTES, read: "2026-11-24", quote: "■処理時に、この効果の発動のきっかけとなったカードがフィールドから離れている場合、処理は何も行われません。" },
		// OCG only. Konami's Q&A (fid 6334, 2017-03-24): a monster turned face-down in the chain (by Book of Moon) is still destroyed, and its effect still applies.
		{
			id: "qa-turned-face-down",
			kind: "jp-qa",
			cid: 11708,
			fid: 6334,
			url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=6334&request_locale=ja",
			read: "2026-11-24",
			quote: "でも、「幽鬼うさぎ」の効果によって、フィールドの「ラヴァルバル・チェイン」は破壊されます。",
		},
	],
	effects: ["text", "once"],
	rulings: [{ source: "notes-field" }, { source: "notes-answers" }, { source: "notes-not-negation" }, { source: "notes-left-the-field" }, { source: "qa-turned-face-down" }],
};
