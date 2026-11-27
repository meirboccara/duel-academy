import { isEffectMonster } from "./helpers";
import { targetsOf, type CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { other } from "../duel";
import { isNegated, negateCardEffects, negateColumn } from "../modifiers";
import { controlsNoCards } from "../negation";
import { konamiCardUrl } from "../sources";

/**
 * "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn), then if this card was
 * Set before activation and is on the field at resolution, for the rest of this turn all other Spell/Trap effects in this
 * column are negated. If you control no cards, you can activate this card from your hand."
 *
 * The column (step 7), per Konami's notes (OCG): only once the monster's effects were negated, if it was activated from where it was
 * Set and is still in its Spell & Trap Zone; the column is the one it is in then, and every other Spell or Trap there for the rest of
 * the turn is negated, those that arrive later included (`negateColumn`). A Normal Trap: never in the Damage Step (the same notes; no Trap
 * is offered there unless its record is flagged).
 */
export const INFINITE_IMPERMANENCE: CardDef = {
	code: "infinite-impermanence",
	kind: "trap",
	facts: { name: "Infinite Impermanence" },
	effects: [
		{
			type: "activation",
			handIf: (duel, { player }) => controlsNoCards(duel, player),
			// A face-up monster the opponent controls whose effects are not negated already (Konami's note: not a legal target;
			// the TCG text has no such sentence), and not a Normal Monster, which has no effects to negate (same note).
			target: (duel, { player }) => duel.piles[other(player)].monster.filter((id) => duel.cards[id]!.face === "up" && !isNegated(duel, id) && isEffectMonster(duel, id)),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				// "that target": still face-up in the Monster Zone when this resolves.
				if (!target || target.zone !== "monster" || target.face !== "up") return duel;
				const negated = negateCardEffects(duel, target.id, duel.turn.number, link);
				// "then": the column only if the negation was applied.
				if (negated === duel) return duel;
				const self = negated.cards[link.card.id]!;
				const inPlace = self.zone === "spell" && self.moves === link.card.moves;
				return link.wasSet && inPlace ? negateColumn(negated, self.id, duel.turn.number, link) : negated;
			},
		},
	],
};

// Not modelled, and not recorded as pending (a core test requires none for this card): Konami's notes let a Dual Monster not yet re-Summoned be
// targeted (the core has no Dual Monster state, its Normal Monster flag stands for it); Q&A fids 23130 (Statue Angel Azlune, a Continuous Trap
// that becomes a monster) and 23478 (GO-DDD God Zero King Zero God Rage) concern cards the core does not have.
// Page 2's five Q&A were all opened 2026-11-26: fid 21703 backs later arrivals in the column (record below); fids 24053
// (Schubert under Bach), 24115 (ARG☆S Trap Monsters), 24027 (GP-PB and its Equip Cards), and 63 (Jinzo - Jector's
// activation condition) require cards/mechanics absent from the core. Reading them is not a claim those interactions are implemented.
const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13631&request_locale=ja";

export const INFINITE_IMPERMANENCE_SOURCES: CardSources = {
	code: "infinite-impermanence",
	cid: 13631,
	french: {
		text: "Ciblez 1 monstre face recto contrôlé par votre adversaire ; annulez ses effets (jusqu'à la fin de ce tour), puis si cette carte a été Posée avant l'activation et est sur le Terrain à la résolution, tous les autres effets de Magie/Piège dans cette colonne sont annulés le reste de ce tour. Si vous ne contrôlez aucune carte, vous pouvez activer cette carte depuis votre main.",
		url: konamiCardUrl(13631, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-26", quote: "Normal Trap" },
		{ id: "negate", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-23", quote: "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn)" },
		{ id: "column", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-23", quote: "then if this card was Set before activation and is on the field at resolution, for the rest of this turn all other Spell/Trap effects in this column are negated." },
		{ id: "hand", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-23", quote: "If you control no cards, you can activate this card from your hand." },
		// OCG only. Konami's notes (補足情報, 2021-05-15): the column applies only after the monster was negated, from a Set card still in
		// its zone; its place when it applies fixes the column; cards that come there later this turn are negated too.
		{
			id: "column-notes",
			kind: "jp-notes",
			cid: 13631,
			url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13631&request_locale=ja",
			read: "2026-11-23",
			quote: "その適用の時点でのこのカードの位置を参照して無効化する縦列が決まります。適用後、このターン中にその縦列に魔法・罠カードが存在する場合（存在するようになった場合）、その効果は無効化されます。",
		},
		// OCG only. Konami's Q&A (fid 21698, 2022-12-30): an effect activated by a Spell in that column is negated even if the card was sent as its cost.
		{
			id: "wand-column-effect",
			kind: "jp-qa",
			cid: 13631,
			fid: 21698,
			url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=21698&request_locale=ja",
			read: "2026-11-23",
			quote: "同じ縦列で発動した魔法・罠カードのカードの発動の際の効果だけでなく、同じ縦列で発動した魔法・罠の効果の発動の際の効果も無効化されます。",
		},
		// OCG only. Page 2, fid 21703 (opened 2026-11-26): a Spell activated from the hand later in the same column is negated too.
		{ id: "column-later-spell", kind: "jp-qa", cid: 13631, fid: 21703, url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=21703&request_locale=ja", read: "2026-11-26", quote: "その後に、その縦列に手札から発動した魔法カードの効果も無効化される事になります。" },
		// OCG only. The same notes (補足情報, 2021-05-15), page read 2026-11-26.
		{ id: "notes-damage-step", kind: "jp-notes", cid: 13631, url: NOTES, read: "2026-11-26", quote: "■ダメージステップ中には発動できません。" },
		{ id: "notes-column-needs-negation", kind: "jp-notes", cid: 13631, url: NOTES, read: "2026-11-26", quote: "（この効果を受けなかったなどの理由で対象のモンスターの効果を無効化できなかった場合、それ以降の処理は行われません。）" },
	],
	effects: ["facts", "negate", "column", "hand"],
	rulings: [
		{ source: "column-notes" },
		{ source: "wand-column-effect" },
		{ source: "column-later-spell" },
		{ source: "notes-damage-step" },
		{ source: "notes-column-needs-negation" },
	],
};
