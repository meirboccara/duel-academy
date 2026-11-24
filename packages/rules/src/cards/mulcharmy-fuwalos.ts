import type { CardSources } from "../coverage";
import type { CardDef } from "../effects";
import { konamiCardUrl } from "../sources";
import { mulcharmy } from "./mulcharmy";

/**
 * Mulcharmy Fuwalos (cid 20500): WIND, Winged Beast, Level 4, ATK 100, DEF 600. See src/cards/mulcharmy.ts for what the "Mulcharmy" monsters share.
 * Its first ● counts: a Special Summon from the Deck and/or the Extra Deck (face-up Pendulum Monsters of the Extra Deck included).
 */
export const MULCHARMY_FUWALOS: CardDef = mulcharmy("mulcharmy-fuwalos", { name: "Mulcharmy Fuwalos", attribute: "WIND", monsterType: "Winged Beast", level: 4, atk: 100, def: 600 }, (event) => event.how === "special" && (event.from === "deck" || event.from === "extra"));

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20500&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const read = "2026-11-24";
const text = (id: string, quote: string) => ({ id, kind: "card-text" as const, cid: 20500, url: konamiCardUrl(20500, "en"), read, quote });
/** OCG only: Konami's notes (補足情報, 2024-07-27) on the card's Q&A page. */
const note = (id: string, quote: string) => ({ id, kind: "jp-notes" as const, cid: 20500, url: NOTES, read, quote });

export const MULCHARMY_FUWALOS_SOURCES: CardSources = {
	code: "mulcharmy-fuwalos",
	cid: 20500,
	french: {
		text: "Si vous ne contrôlez aucune carte (Effet Rapide) : vous pouvez défausser cette carte ; appliquez ces effets ce tour. ●Chaque fois que votre adversaire Invoque Spécialement un ou plusieurs monstres depuis le Deck et/ou Extra Deck, piochez immédiatement 1 carte. ●Une fois, durant cette End Phase, si le nombre de cartes dans votre main est supérieur au nombre de cartes contrôlées par votre adversaire +6, vous devez mélanger au hasard un nombre de cartes depuis votre main dans le Deck afin que le nombre dans votre main soit égal au nombre contrôlé par votre adversaire +6. Le tour où vous activez cet effet, vous ne pouvez activer qu'1 autre effet de monstre \"Mulcharmy\".",
		url: konamiCardUrl(20500, "fr"),
		read,
	},
	sources: [
		// The printed text (Konami's English page, read once on 2026-11-24), clause by clause.
		text("text-activation", "If you control no cards (Quick Effect): You can discard this card; apply these effects this turn."),
		text("text-draw", "●Each time your opponent Special Summons a monster(s) from the Deck and/or Extra Deck, immediately draw 1 card."),
		text("text-end-phase", "●Once, during this End Phase, if the number of cards in your hand is more than the number of cards your opponent controls +6, you must randomly shuffle cards from your hand into the Deck so the number in your hand equals the number your opponent controls +6."),
		text("text-limit", "You can only activate 1 other \"Mulcharmy\" monster effect, the turn you activate this effect."),
		note("notes-limit-not-effect", "【『このカードの効果を発動するターン、自分はこのカード以外の「マルチャミー」モンスターの効果を１度しか発動できない』について】■効果として扱いません。"),
		note("notes-hand-quick", "■手札で発動できる誘発即時効果です。"),
		note("notes-damage-step", "■ダメージステップには発動できません。"),
		note("notes-cannot-draw", "■ドローができない状況でも発動できます。（実際にカードをドローする際に、デッキが０枚の場合は敗北になります。）"),
		note("notes-second-copy", "■既に「マルチャミー・フワロス」の効果が適用されているターンでも、２枚目の「マルチャミー・フワロス」の効果を発動できます。"),
		note("notes-no-chain", "■ドローする際にチェーンブロックは作られません。"),
		note("notes-damage-step-summon", "■ダメージステップ中に特殊召喚が行われた際にも適用されます。"),
		note("notes-per-summon", "■特殊召喚されたモンスターの数ではなく、相手が行った特殊召喚の回数に応じて適用されます。（同時に複数体のモンスターが特殊召喚された場合、処理は１度だけ適用され、１枚ドローします。）"),
		note("notes-stacks", "■この効果が２回適用されている場合、相手がデッキ・エクストラデッキからモンスターを特殊召喚する度に、自分は１枚ドローする処理を２回行います。"),
		note("notes-end-no-chain", "■『デッキに戻す』処理を行う際にチェーンブロックは作られません。"),
		// OCG only. Konami's Q&A fid 7813 (page dated 2025-03-27): a "Mulcharmy" effect whose activation was negated counts towards the limit.
		{ id: "qa-negated-counts", kind: "jp-qa", cid: 20500, fid: 7813, url: qa(7813), read, quote: "（『このカードの効果を発動するターン、自分はこのカード以外の「マルチャミー」モンスターの効果を１度しか発動できない』は、効果の発動が無効になった「マルチャミー」モンスターの効果も含めて考慮します。）" },
		// OCG only. Konami's Q&A fid 24217 (page dated 2025-09-04): the opponent Special Summons from the Fuwalos player's own Deck to their field.
		{ id: "qa-opponent-summons-from-my-deck", kind: "jp-qa", cid: 20500, fid: 24217, url: qa(24217), read, quote: "ドローします。以下の効果により、自分が相手のデッキ・エクストラデッキからモンスターを特殊召喚した場合も同様に、相手は「 マルチャミー・フワロス 」の効果によってカードをドローします。" },
	],
	effects: ["text-activation", "text-draw", "text-end-phase", "text-limit"],
	// The other entries of the card's Q&A list are about cards the core does not have (titles read on 2026-11-24, entries not opened).
	rulings: [
		{ source: "notes-limit-not-effect" }, { source: "notes-hand-quick" }, { source: "notes-damage-step" }, { source: "notes-cannot-draw" }, { source: "notes-second-copy" }, { source: "notes-no-chain" }, { source: "notes-damage-step-summon" }, { source: "notes-per-summon" }, { source: "notes-stacks" }, { source: "notes-end-no-chain" }, { source: "qa-negated-counts" }, { source: "qa-opponent-summons-from-my-deck" },
	],
};
