import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { destroyCard, type Duel, effectDestruction, other, type Side } from "../duel";
import type { CardDef } from "../effects";
import { addModifier, FOREVER } from "../modifiers";
import { konamiCardUrl } from "../sources";

const NAME = "Dominus Purge";
/** What a card or effect that "includes an effect that adds a card(s) from the Deck to the hand" declares: a search, and a draw (a draw adds a card from the Deck: Konami's Q&A fid 21685 on Ash Blossom). */
const ADDS_FROM_DECK: readonly string[] = ["search", "draw"];
const LOCKED_ATTRIBUTES: readonly string[] = ["DARK", "WATER", "FIRE"];

/** Does the player have a Trap Card in the Graveyard (a Counter Trap is one)? */
const hasTrapInGraveyard = (duel: Duel, player: Side): boolean => duel.piles[player].graveyard.some((id) => ["trap", "counter-trap"].includes(duel.defs[duel.cards[id]!.code]?.kind ?? ""));

/** Does the player's opponent control a card: a monster, a Spell or Trap Card, or the Field Spell? */
const opponentControlsACard = (duel: Duel, player: Side): boolean => {
	const piles = duel.piles[other(player)];
	return piles.monster.length + piles.spell.length + piles.field.length > 0;
};

/**
 * "If your opponent controls a card, you can activate this card from your hand. When a card or effect is activated that includes an effect that
 * adds a card(s) from the Deck to the hand: Negate that effect, then if you have a Trap in your GY, destroy that card. If you activated this
 * card from your hand, you cannot activate the effects of DARK, WATER, and FIRE monsters for the rest of this Duel. You can only activate 1
 * "Dominus Purge" per turn." A Normal Trap.
 *
 * - Activation from the hand: not an effect (Konami's notes, OCG); `handIf`, in either player's turn.
 * - Chained directly to a link that declares an effect that adds a card from the Deck to the hand (a search or a draw). It negates the effect of
 *   that whole link (notes), then, if the player has a Trap in the GY when it resolves (the Purge is not in it yet), destroys the card whose
 *   effect it negated, where it is: on the field, or in the hand (the core's reading, as `negateActivationAndDestroy`: YGOProJudge only). "Then"
 *   needs the negation to have taken: nothing is destroyed when the effect could not be negated.
 * - The restriction is applied when it resolves (notes), when the card was activated from the hand, whether or not the negation took, and
 *   lasts the rest of the Duel. It stops the player's activations of the effects of monsters whose printed Attribute is DARK, WATER or FIRE.
 * - Once per turn by activation: a negated activation gives the use back.
 */
export const DOMINUS_PURGE: CardDef = {
	code: "dominus-purge",
	kind: "trap",
	facts: { name: NAME, mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["negate"],
			once: { scope: "activation", key: "dominus-purge" },
			handIf: (duel, { player }) => opponentControlsACard(duel, player),
			condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.some((category) => ADDS_FROM_DECK.includes(category)) ?? false,
			operation: (duel, link) => {
				const index = link.answers;
				const answered = index === null ? undefined : duel.chain[index];
				const negated = index === null ? duel : negateEffect(duel, index);
				// The restriction of the second sentence: applied now, from the hand only, whether or not the negation took.
				const locked = link.wasSet
					? negated
					: addModifier(negated, { affects: () => false, until: FOREVER, layer: { kind: "lock", what: "activate", who: link.player, stops: (_board, { def }) => def.kind === "monster" && LOCKED_ATTRIBUTES.includes(def.facts?.attribute ?? ""), describe: "the effects of DARK, WATER, and FIRE monsters" } });
				if (!answered || negated === duel || !hasTrapInGraveyard(locked, link.player)) return locked;
				const now = locked.cards[answered.card.id]!;
				const there = (now.zone === "monster" || now.zone === "spell" || now.zone === "field" || now.zone === "hand") && now.moves === answered.card.moves;
				return there ? destroyCard(locked, now.id, { destruction: effectDestruction(link) }) : locked;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20257&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(20257, "en");

export const DOMINUS_PURGE_SOURCES: CardSources = {
	code: "dominus-purge",
	cid: 20257,
	french: {
		text: "Si votre adversaire contrôle une carte, vous pouvez activer cette carte depuis votre main. Lorsqu'une carte ou un effet qui inclut un effet qui ajoute une ou plusieurs cartes depuis le Deck à la main est activé : annulez l'effet, puis si vous avez un Piège dans votre Cimetière, détruisez la carte. Si vous avez activé cette carte depuis votre main, vous ne pouvez pas activer les effets de monstres TÉNÈBRES, EAU et FEU le reste de ce Duel. Vous ne pouvez activer qu'1 \"Purge Dominus\" par tour.",
		url: konamiCardUrl(20257, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20257, url: EN, read: "2026-11-24", quote: "Normal Trap" },
		{ id: "hand", kind: "card-text", cid: 20257, url: EN, read: "2026-11-24", quote: "If your opponent controls a card, you can activate this card from your hand." },
		{ id: "negate", kind: "card-text", cid: 20257, url: EN, read: "2026-11-24", quote: "When a card or effect is activated that includes an effect that adds a card(s) from the Deck to the hand: Negate that effect, then if you have a Trap in your GY, destroy that card." },
		{ id: "lock", kind: "card-text", cid: 20257, url: EN, read: "2026-11-24", quote: "If you activated this card from your hand, you cannot activate the effects of DARK, WATER, and FIRE monsters for the rest of this Duel." },
		{ id: "once", kind: "card-text", cid: 20257, url: EN, read: "2026-11-24", quote: "You can only activate 1 \"Dominus Purge\" per turn." },
		// OCG only. Konami's notes (補足情報, 2024-04-27), page read 2026-11-24. Its 10 Q&A entries: titles read, the three below opened; the others are about other cards' chains.
		{ id: "notes-hand-not-effect", kind: "jp-notes", cid: 20257, url: NOTES, read: "2026-11-24", quote: "■効果として扱いません。" },
		{ id: "notes-hand-either-turn", kind: "jp-notes", cid: 20257, url: NOTES, read: "2026-11-24", quote: "■自分のターンでも相手のターンでもこの方法で発動できます。" },
		{ id: "notes-chain-direct", kind: "jp-notes", cid: 20257, url: NOTES, read: "2026-11-24", quote: "■デッキからカードを手札に加える効果を含む、魔法・罠・モンスターの効果に、直接チェーンして発動できます。" },
		{ id: "notes-whole-link", kind: "jp-notes", cid: 20257, url: NOTES, read: "2026-11-24", quote: "■直前のチェーンブロック１つ分の効果処理が無効化されます。" },
		{ id: "notes-lock-at-resolution", kind: "jp-notes", cid: 20257, url: NOTES, read: "2026-11-24", quote: "（『このカードを手札から発動した場合、発動後、このデュエル中に自分は闇・水・炎属性モンスターの効果を発動できない』は効果処理であり、効果処理以降から適用されます。）" },
		{ id: "notes-lock-already", kind: "jp-notes", cid: 20257, url: NOTES, read: "2026-11-24", quote: "■既に自分が闇・水・炎属性モンスターの効果を発動したデュエル中でも、手札からこのカードを発動できます。" },
		// OCG only. Konami's Q&A on the card (10 entries, titles read 2026-11-24, the three below opened).
		{ id: "qa-destroy-where", kind: "jp-qa", cid: 20257, fid: 23949, url: qa(23949), read: "2026-11-24", quote: "直前のチェーンブロックで効果を発動したモンスターが効果を発動した場所に存在しない場合、破壊する処理や除外する処理は行いません。" },
		{ id: "qa-lock-still-includes", kind: "jp-qa", cid: 20257, fid: 24162, url: qa(24162), read: "2026-11-24", quote: "『●デッキからカードを手札に加える効果』が含まれているためです。" },
		{ id: "qa-multi-attribute", kind: "jp-qa", cid: 20257, fid: 24299, url: qa(24299), read: "2026-11-24", quote: "複数の属性を持つモンスターの例として、以下のモンスターが挙げられます。" },
	],
	effects: ["facts", "hand", "negate", "lock", "once"],
	rulings: [{ source: "notes-hand-not-effect" }, { source: "notes-hand-either-turn" }, { source: "notes-chain-direct" }, { source: "notes-whole-link" }, { source: "notes-lock-at-resolution" }, { source: "notes-lock-already" }, { source: "qa-destroy-where" }, { source: "qa-lock-still-includes" }, { source: "qa-multi-attribute", pending: "needs a monster with several Attributes (a card that is also treated as another Attribute): the core gives a monster one printed Attribute" }],
};
