import { Star } from "lucide-react";
import { RARITIES, type Rarity } from "@/lib/junior/world/shop";

/**
 * How a card's rarity shows, like the foils of the real cards: the rarer, the brighter the frame and the more it
 * shines. Common has a plain frame; Rare a silver one; Super Rare a foil; Ultra Rare gold foil with a glow; Secret
 * Rare a rainbow foil with a strong glow.
 */
export const RARITY_FRAME: Record<Rarity, string> = {
	common: "border-white/40",
	rare: "border-sky-200",
	super: "border-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.55)]",
	ultra: "border-gold-400 shadow-[0_0_16px_rgba(255,216,74,0.75)]",
	secret: "border-fuchsia-300 shadow-[0_0_22px_rgba(240,171,252,0.9)]",
};

const FOIL: Partial<Record<Rarity, string>> = {
	super: "bg-[linear-gradient(115deg,transparent_25%,rgba(255,255,255,0.45)_45%,transparent_65%)]",
	ultra: "bg-[linear-gradient(115deg,transparent_20%,rgba(255,236,150,0.6)_40%,rgba(255,255,255,0.5)_50%,transparent_70%)]",
	secret: "bg-[linear-gradient(115deg,rgba(255,120,200,0.35)_0%,rgba(255,240,120,0.35)_25%,rgba(120,255,200,0.35)_50%,rgba(120,180,255,0.35)_75%,rgba(220,140,255,0.35)_100%)]",
};

/** The shine laid over a card's art: none for Common and Rare. Put it inside a `relative` box. */
export function Foil({ rarity }: { rarity: Rarity | undefined }) {
	const foil = rarity && FOIL[rarity];
	return foil ? <span aria-hidden className={`pointer-events-none absolute inset-0 mix-blend-screen ${foil}`} /> : null;
}

/** A small badge: one star for Common up to five for Secret Rare, and the rarity's name. */
export function RarityBadge({ rarity, name, lang }: { rarity: Rarity; name: string; lang?: string }) {
	const count = RARITIES.indexOf(rarity) + 1;
	return (
		<span className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border px-1.5 text-[10px] font-bold leading-4 text-fg ${RARITY_FRAME[rarity]}`}>
			<span aria-hidden className="flex">
				{Array.from({ length: count }, (_, i) => (
					<Star key={i} className="h-2.5 w-2.5 fill-gold-400 text-gold-400" />
				))}
			</span>
			<span lang={lang}>{name}</span>
		</span>
	);
}
