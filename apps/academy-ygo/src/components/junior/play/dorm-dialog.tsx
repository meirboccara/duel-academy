"use client";

import type { Locale } from "@/lib/i18n/locales";
import { cardArtUrl } from "@/lib/junior/play/card-pictures";
import { DORMS, DORM_INFO, type Dorm } from "@/lib/junior/world/dorm";
import { DORM_COPY } from "@/lib/junior/world/dorm-copy";
import { trainerPicture } from "@/lib/junior/world/trainers";
import { Modal } from "../home/confirm-dialog";

/**
 * "Choose your dorm", once the first island is finished: three big buttons in the dorms' colours, each with its
 * leader (who will wait on the tower island) and its Egyptian God card (given there). Closing it without choosing
 * asks again on the next visit.
 */
export function DormDialog({ locale, onChoose, onClose }: { locale: Locale; onChoose: (dorm: Dorm) => void; onClose: () => void }) {
	const words = DORM_COPY[locale];
	return (
		<Modal title={words.title} onClose={onClose}>
			<p className="text-sm text-fg-muted">{words.intro}</p>
			<ul className="grid grid-cols-3 gap-2">
				{DORMS.map((dorm) => {
					const info = DORM_INFO[dorm];
					const name = words.names[dorm];
					const card = cardArtUrl(info.card, 160);
					return (
						<li key={dorm}>
							<button
								type="button"
								onClick={() => onChoose(dorm)}
								aria-label={`${words.choose(name)}. ${words.about[dorm]}`}
								style={{ borderColor: info.colour, background: `linear-gradient(180deg, ${info.colour}55, transparent 70%)` }}
								className="flex h-full w-full flex-col items-center gap-1 rounded-2xl border-4 p-2 text-center"
							>
								<span className="relative flex h-20 w-full items-end justify-center">
									<img src={trainerPicture(info.leader, 256)} alt="" height={256} className="h-20 w-auto object-contain" />
									{card && <img src={card} alt="" width={160} height={160} className="absolute bottom-0 end-0 h-10 w-10 rounded border-2 border-white/80 object-cover shadow" />}
								</span>
								<span dir="auto" lang={locale === "he" ? "en" : undefined} className="font-display text-base leading-tight text-fg">
									{name}
								</span>
								<span dir="auto" className="text-xs leading-snug text-fg-muted">
									{words.about[dorm]}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</Modal>
	);
}
