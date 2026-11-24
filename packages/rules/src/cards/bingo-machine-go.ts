import type { CardSources } from "../coverage";
import { askUpTo } from "../choices";
import { pickRandom, revealCards, shuffleDeck } from "../deck";
import { type Duel, moveCard, type Side } from "../duel";
import type { CardDef } from "../effects";
import { belongsTo, hasPrintedName, mentionsCard } from "../identity";
import { konamiCardUrl } from "../sources";

const NAME = "Bingo Machine, Go!!!";
const BEWD = "Blue-Eyes White Dragon";
const BEUD = "Blue-Eyes Ultimate Dragon";

/**
 * The cards of the Deck that meet at least 1 of the two criteria: a "Blue-Eyes" monster, or a Spell/Trap that mentions "Blue-Eyes White
 * Dragon" or "Blue-Eyes Ultimate Dragon", except "Bingo Machine, Go!!!". Konami's notes: "mentions" is the card name printed in the text as
 * a card name (`facts.mentions`), not the archetype.
 */
const revealable = (duel: Duel, player: Side): number[] =>
	duel.piles[player].deck.filter((id) => {
		const def = duel.defs[duel.cards[id]!.code];
		if (def === undefined) return false;
		if (def.kind === "monster") return belongsTo(duel, id, "Blue-Eyes");
		return !hasPrintedName(duel, id, NAME) && (mentionsCard(duel, id, BEWD) || mentionsCard(duel, id, BEUD));
	});

/**
 * "Reveal 3 cards from your Deck that each meets at least 1 of the criteria listed below, your opponent randomly picks 1 for you to add to
 * your hand, and you shuffle the rest into your Deck. You can only activate 1 "Bingo Machine, Go!!!" per turn." A Normal Spell.
 *
 * - The player chooses the 3 cards (any mix of the two criteria, copies of one name allowed) and they are revealed; the opponent's random
 *   pick is the Duel's RNG (`pickRandom`); the card goes to the hand, then the Deck is shuffled, all in the resolution (Konami's notes: the
 *   adding and the returning are simultaneous: no window between).
 * - YGOProJudge only (asked 2026-11-24, no official source cited): it cannot be activated with fewer than 3 cards that meet a criterion in
 *   the Deck; the 3 cards may be copies of the same card. With fewer than 3 left when it resolves, nothing is revealed (the core's reading).
 * - A search that adds a card from the Deck: `requiresAddToHand` (not offered under Droll & Lock Bird's lock), as Terraforming.
 * - `facts.mentions` lists the card's own name too: it is printed in the text ("You can only activate 1 ...").
 */
export const BINGO_MACHINE_GO: CardDef = {
	code: "bingo-machine-go",
	kind: "spell",
	facts: { name: NAME, mentions: [BEWD, BEUD, NAME] },
	effects: [
		{
			type: "activation",
			categories: ["search"],
			requiresAddToHand: true,
			once: { scope: "activation" },
			condition: (duel, { player }) => revealable(duel, player).length >= 3,
			operation: (duel, link) =>
				askUpTo(duel, link.player, revealable(duel, link.player), { min: 3, max: 3 }, (board, shown) => {
					if (shown.length < 3) return board;
					const revealed = revealCards(board, link.player, shown);
					const { duel: picked, picked: chosen } = pickRandom(revealed, shown, 1);
					return shuffleDeck(moveCard(picked, chosen[0]!, { zone: "hand" }), link.player);
				}),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13844&request_locale=ja";

export const BINGO_MACHINE_GO_SOURCES: CardSources = {
	code: "bingo-machine-go",
	cid: 13844,
	french: {
		text: "Révélez 3 cartes depuis votre Deck qui correspondent chacune à min. 1 des critères listés ci-dessous, votre adversaire en prend 1 au hasard pour vous à ajouter à votre main, et vous mélangez les cartes restantes dans votre Deck. Vous ne pouvez activer qu'1 \"Machine Bingo, Go !!!\" par tour.\n●Monstre \"Yeux Bleus\"\n●Magie/Piège (\"Machine Bingo, Go !!!\" exclu) qui mentionne \"Dragon Blanc aux Yeux Bleus\" ou \"Dragon Ultime aux Yeux Bleus\"",
		url: konamiCardUrl(13844, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "reveal", kind: "card-text", cid: 13844, url: konamiCardUrl(13844, "en"), read: "2026-11-24", quote: "Reveal 3 cards from your Deck that each meets at least 1 of the criteria listed below" },
		{ id: "criterion-monster", kind: "card-text", cid: 13844, url: konamiCardUrl(13844, "en"), read: "2026-11-24", quote: "●\"Blue-Eyes\" monster" },
		{ id: "criterion-spell-trap", kind: "card-text", cid: 13844, url: konamiCardUrl(13844, "en"), read: "2026-11-24", quote: "●Spell/Trap that mentions \"Blue-Eyes White Dragon\" or \"Blue-Eyes Ultimate Dragon\", except \"Bingo Machine, Go!!!\"" },
		{ id: "random-pick", kind: "card-text", cid: 13844, url: konamiCardUrl(13844, "en"), read: "2026-11-24", quote: "your opponent randomly picks 1 for you to add to your hand" },
		{ id: "shuffle", kind: "card-text", cid: 13844, url: konamiCardUrl(13844, "en"), read: "2026-11-24", quote: "and you shuffle the rest into your Deck." },
		{ id: "once", kind: "card-text", cid: 13844, url: konamiCardUrl(13844, "en"), read: "2026-11-24", quote: "You can only activate 1 \"Bingo Machine, Go!!!\" per turn." },
		// OCG only. Konami's notes (補足情報, 2024-03-23), page read 2026-11-24. Its one Q&A (2021-12-03) is about Puppet Queen, a card the
		// core does not have: its title was read, the entry was not opened.
		{ id: "notes-mentions", kind: "jp-notes", cid: 13844, url: NOTES, read: "2026-11-24", quote: "のカード名が記された魔法・罠カード』とは、テキストに特定のカード名として" },
		{ id: "notes-simultaneous", kind: "jp-notes", cid: 13844, url: NOTES, read: "2026-11-24", quote: "■『そのカード１枚を自分の手札に加え』の処理と、『残りのカードはデッキに戻す』処理は同時に行われたものとして扱います。" },
	],
	effects: ["reveal", "criterion-monster", "criterion-spell-trap", "random-pick", "shuffle", "once"],
	rulings: [{ source: "notes-mentions" }, { source: "notes-simultaneous" }],
};
