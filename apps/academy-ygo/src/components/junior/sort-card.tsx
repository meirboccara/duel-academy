import { Star } from "lucide-react";
import type { CardCopy, Copy } from "@/lib/junior/mission1-copy";
import type { SortCard } from "@/lib/junior/mission1";

/** A schematic card face. It shows the card's text and numbers, never its kind. */
export function SortCardFace({ card, text, copy }: { card: SortCard; text: CardCopy["text"]; copy: Copy }) {
	const stats = card.stats;
	return (
		<div className="mx-auto w-full max-w-sm space-y-3 rounded-2xl border-4 border-gold-500 bg-surface-raised p-4">
			<p className="text-base text-fg">{text}</p>
			{stats && (
				<dl className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-3 text-fg">
					<div className="flex items-center gap-1">
						<dt>{copy.level}</dt>
						<dd className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden />
							<bdi dir="ltr" className="font-bold">{stats.level}</bdi>
						</dd>
					</div>
					<div className="flex items-center gap-1">
						<dt>{copy.atk}</dt>
						<dd><bdi dir="ltr" className="font-bold">{stats.atk}</bdi></dd>
					</div>
					<div className="flex items-center gap-1">
						<dt>{copy.def}</dt>
						<dd><bdi dir="ltr" className="font-bold">{stats.def}</bdi></dd>
					</div>
				</dl>
			)}
		</div>
	);
}
