import type { CardSources } from "../coverage";
import type { CardDef } from "../effects";
import { konamiCardUrl } from "../sources";
import { mulcharmy } from "./mulcharmy";

/**
 * Mulcharmy Purulia (cid 20206): WATER, Aqua, Level 4, ATK 100, DEF 600. See src/cards/mulcharmy.ts for what the "Mulcharmy" monsters share.
 * Its first ● counts: a Normal Summon (a Tribute Summon too; never a Set, which is not a Summon) or a Special Summon, from the hand.
 */
export const MULCHARMY_PURULIA: CardDef = mulcharmy("mulcharmy-purulia", { name: "Mulcharmy Purulia", attribute: "WATER", monsterType: "Aqua", level: 4, atk: 100, def: 600 }, (event) => event.from === "hand" && (event.how === "normal" || event.how === "special"));

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20206&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const read = "2026-11-24";
const text = (id: string, quote: string) => ({ id, kind: "card-text" as const, cid: 20206, url: konamiCardUrl(20206, "en"), read, quote });
/** OCG only: Konami's notes (補足情報, 2024-04-27) on the card's Q&A page. */
const note = (id: string, quote: string) => ({ id, kind: "jp-notes" as const, cid: 20206, url: NOTES, read, quote });

export const MULCHARMY_PURULIA_SOURCES: CardSources = {
	code: "mulcharmy-purulia",
	cid: 20206,
	french: {
		text: "Si vous ne contrôlez aucune carte (Effet Rapide) : vous pouvez défausser cette carte ; appliquez ces effets ce tour. ●Chaque fois que votre adversaire Invoque Normalement ou Spécialement un ou plusieurs monstres depuis la main, piochez immédiatement 1 carte. ●Une fois, durant cette End Phase, si le nombre de cartes dans votre main est supérieur au nombre de cartes contrôlées par votre adversaire +6, vous devez mélanger au hasard un nombre de cartes depuis votre main dans le Deck afin que le nombre dans votre main soit égal au nombre contrôlé par votre adversaire +6. Le tour où vous activez cet effet, vous ne pouvez activer qu'1 autre effet de monstre \"Mulcharmy\".",
		url: konamiCardUrl(20206, "fr"),
		read,
	},
	sources: [
		// The printed text (Konami's English page, read once on 2026-11-24), clause by clause.
		text("text-activation", "If you control no cards (Quick Effect): You can discard this card; apply these effects this turn."),
		text("text-draw", "●Each time your opponent Normal or Special Summons a monster(s) from the hand, immediately draw 1 card."),
		text("text-end-phase", "●Once, during this End Phase, if the number of cards in your hand is more than the number of cards your opponent controls +6, you must randomly shuffle cards from your hand into the Deck so the number in your hand equals the number your opponent controls +6."),
		text("text-limit", "You can only activate 1 other \"Mulcharmy\" monster effect, the turn you activate this effect."),
		note("notes-limit-not-effect", "【『このカードの効果を発動するターン、自分はこのカード以外の「マルチャミー」モンスターの効果を１度しか発動できない』について】■効果として扱いません。"),
		note("notes-hand-quick", "■手札で発動できる誘発即時効果です。"),
		note("notes-damage-step", "■ダメージステップには発動できません。"),
		note("notes-cannot-draw", "■ドローができない状況でも発動できます。（実際にカードをドローする際に、デッキが０枚の場合は敗北になります。）"),
		note("notes-second-copy", "■既に「マルチャミー・プルリア」の効果が適用されているターンでも、２枚目の「マルチャミー・プルリア」の効果を発動できます。"),
		note("notes-no-chain", "■ドローする際にチェーンブロックは作られません。"),
		note("notes-damage-step-summon", "■ダメージステップ中に特殊召喚が行われた際にも適用されます。"),
		note("notes-per-summon", "■召喚及び特殊召喚されたモンスターの数ではなく、相手が行った召喚及び特殊召喚の回数に応じて適用されます。（ペンデュラム召喚などによって同時に複数体のモンスターが特殊召喚された場合、処理は１度だけ適用され、１枚ドローします。）"),
		note("notes-stacks", "■この効果が２回適用されている場合、相手が手札からモンスターを召喚・特殊召喚する度に、自分は１枚ドローする処理を２回行います。"),
		note("notes-set-not-summon", "■相手が通常召喚として手札からモンスターをセットした場合はドローできません。（召喚とは、通常召喚のうち手札のモンスターを攻撃表示でフィールドに出すことを指します。）"),
		note("notes-end-no-chain", "■『デッキに戻す』処理を行う際にチェーンブロックは作られません。"),
		// OCG only. Konami's Q&A fid 7813 (page dated 2025-03-27): a "Mulcharmy" effect whose activation was negated counts towards the limit.
		{ id: "qa-negated-counts", kind: "jp-qa", cid: 20206, fid: 7813, url: qa(7813), read, quote: "（『このカードの効果を発動するターン、自分はこのカード以外の「マルチャミー」モンスターの効果を１度しか発動できない』は、効果の発動が無効になった「マルチャミー」モンスターの効果も含めて考慮します。）" },
	],
	effects: ["text-activation", "text-draw", "text-end-phase", "text-limit"],
	// The other entries of the card's Q&A list are about cards the core does not have (titles read on 2026-11-24, entries not opened).
	rulings: [
		{ source: "notes-limit-not-effect" }, { source: "notes-hand-quick" }, { source: "notes-damage-step" }, { source: "notes-cannot-draw" }, { source: "notes-second-copy" }, { source: "notes-no-chain" }, { source: "notes-damage-step-summon" }, { source: "notes-per-summon" }, { source: "notes-stacks" }, { source: "notes-set-not-summon" }, { source: "notes-end-no-chain" }, { source: "qa-negated-counts" },
	],
};
