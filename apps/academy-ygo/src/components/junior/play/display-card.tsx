import type { Locale } from "@/lib/i18n/locales";
import { CARD_ART } from "@/lib/junior/play/card-art";
import { CARDS, type CardId } from "@/lib/junior/play/cards";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { rarityOf } from "@/lib/junior/world/shop";
import { DISPLAY_CARDS } from "@/lib/junior/world/trainers";
import { CardArt, CardFace } from "./mini-board";
import { Foil, RARITY_FRAME } from "./rarity-look";

const FRAME = { monster: "border-normal-monster bg-normal-monster/15", effect: "border-effect-monster bg-effect-monster/15", spell: "border-spell bg-spell/15", fusion: "border-fusion bg-fusion/20", synchro: "border-synchro bg-synchro/15", link: "border-link bg-link/25", pendulum: "border-gold-400 bg-[linear-gradient(180deg,rgba(255,170,60,0.2),rgba(80,200,140,0.2))]" } as const;

/** The printed words of a display-only card: French cards in French, the others (Hebrew included) as printed in English. */
export function displayCardWords(card: string, locale: Locale) {
	const info = DISPLAY_CARDS[card];
	return info ? info.text[locale === "fr" ? "fr" : "en"] : null;
}
/** A card's name in this language, whether it is playable or display-only. */
export function binderCardName(card: string, copy: PlayCopy, locale: Locale): string {
	if (card in CARDS) return copy.cards[card as CardId].name;
	const art = CARD_ART[card];
	return displayCardWords(card, locale)?.name ?? (art ? (locale === "fr" ? art.nameFr : art.name) : card);
}

/** Any card the binder can hold: a playable card, or a signature card shown and given but never played. */
export function BinderCard({ card, copy, locale, gold }: { card: string; copy: PlayCopy; locale: Locale; gold?: boolean }) {
	const ring = gold ? "rounded-lg ring-2 ring-gold-400 ring-offset-2 ring-offset-ink-950" : "";
	if (card in CARDS)
		return (
			<span className={`block h-full w-full ${ring}`}>
				<CardFace card={card as CardId} copy={copy} />
			</span>
		);
	const info = DISPLAY_CARDS[card];
	const words = displayCardWords(card, locale);
	if (!info || !words) return <ArtOnlyCard card={card} copy={copy} locale={locale} ring={ring} />;
	return (
		<span className={`flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border-2 px-1 py-1 text-center ${FRAME[info.kind === "spell" ? "spell" : (info.frame ?? "monster")]} ${ring}`}>
			<CardArt card={card} size="face" />
			<span dir="auto" lang={locale === "fr" ? undefined : "en"} className="text-xs font-semibold leading-tight text-fg">
				{words.name}
			</span>
			{info.atk !== undefined && (
				<bdi dir="ltr" className="text-xs font-bold leading-tight text-fg">
					{copy.atk} {info.atk}
				</bdi>
			)}
		</span>
	);
}

/** A card known only by its official art and printed numbers (a card bought in the shop): art, name and ATK. */
function ArtOnlyCard({ card, copy, locale, ring }: { card: string; copy: PlayCopy; locale: Locale; ring: string }) {
	const art = CARD_ART[card];
	if (!art) return null;
	const kind = art.kind === "spell" ? "bg-spell/15" : art.kind === "trap" ? "bg-trap/15" : "bg-normal-monster/15";
	const rarity = rarityOf(card);
	/* A shop card wears its rarity: the frame of its rarity and, from Super Rare up, a foil over the art. */
	const frame = rarity ? `${RARITY_FRAME[rarity]} ${kind}` : art.kind === "spell" ? FRAME.spell : art.kind === "trap" ? "border-trap bg-trap/15" : FRAME.monster;
	return (
		<span className={`flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border-2 px-1 py-1 text-center ${frame} ${ring}`}>
			<span className="relative isolate inline-block overflow-hidden leading-none">
				<CardArt card={card} size="face" />
				<Foil rarity={rarity} />
			</span>
			<span dir="auto" lang={locale === "fr" ? undefined : "en"} className="text-xs font-semibold leading-tight text-fg">
				{binderCardName(card, copy, locale)}
			</span>
			{art.kind === "monster" && (
				<bdi dir="ltr" className="text-xs font-bold leading-tight text-fg">
					{/* Slifer and Ra print "?" for ATK (YGOPRODeck gives −1). */}
					{copy.atk} {art.atk !== undefined && art.atk < 0 ? "?" : art.atk}
				</bdi>
			)}
		</span>
	);
}
