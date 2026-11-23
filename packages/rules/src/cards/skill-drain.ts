import type { CardSources } from "../coverage";
import type { CardDef } from "../effects";
import { payLp } from "../life";
import { konamiCardUrl } from "../sources";

/**
 * "Activate this card by paying 1000 LP. Negate the effects of all face-up monsters while they are face-up on the field (but
 * their effects can still be activated)." A Continuous Trap: the activation pays 1000 LP and the card stays on the field
 * (`stays`); the negation is its continuous effect, read from the board, so it ends the moment the card is no longer face-up
 * on the field and it applies again to a monster that is turned face-up. A negated monster still activates its effects: the
 * effect is negated when it resolves (src/activation.ts, src/chain.ts).
 */
export const SKILL_DRAIN: CardDef = {
	code: "skill-drain",
	kind: "trap",
	effects: [
		{ type: "activation", stays: true, cost: (duel, { player }) => payLp(duel, player, 1000), operation: (duel) => duel },
		{
			type: "continuous",
			range: "field",
			operation: (duel) => duel,
			affects: (_duel, target) => target.zone === "monster" && target.face === "up",
			modifies: () => [{ kind: "negate" }],
		},
	],
};

const notes = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=5740&request_locale=ja";

export const SKILL_DRAIN_SOURCES: CardSources = {
	code: "skill-drain",
	cid: 5740,
	french: {
		text: "Activez cette carte en payant 1000 LP. Annulez les effets de tous les monstres face recto tant qu'ils sont face recto sur le Terrain (mais leurs effets peuvent toujours être activés).",
		url: konamiCardUrl(5740, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{ id: "text", kind: "card-text", cid: 5740, url: konamiCardUrl(5740, "en"), read: "2026-11-23", quote: "Activate this card by paying 1000 LP. Negate the effects of all face-up monsters while they are face-up on the field (but their effects can still be activated)." },
		// OCG only: Konami's Japanese notes for the card (dated 2020-04-01).
		{ id: "notes", kind: "jp-notes", cid: 5740, url: notes, read: "2026-11-23", quote: "■この効果によってモンスターの効果が無効化されている限り、そのモンスターが持つチェーンブロックの作られない効果はモンスターゾーンでは適用されません。" },
		{
			id: "left-the-zone",
			kind: "jp-notes",
			cid: 5740,
			url: notes,
			read: "2026-11-23",
			quote: "■モンスターがモンスターゾーンで効果を発動した処理時に、そのモンスターがモンスターゾーンに表側表示で存在しなくなった場合、そのモンスター効果は無効化されず、処理は行われます。",
		},
	],
	effects: ["text"],
	rulings: [{ source: "notes" }, { source: "left-the-zone" }],
};
