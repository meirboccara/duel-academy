import { Star } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { cardArtUrl } from "@/lib/junior/play/card-art";
import { LEVELS, WORLD_IDS } from "@/lib/junior/play/levels";
import type { PlayProgress } from "@/lib/junior/play/progress";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { DORM_INFO, type Dorm } from "@/lib/junior/world/dorm";
import { DORM_COPY } from "@/lib/junior/world/dorm-copy";
import { islandStatus } from "@/lib/junior/world/status";
import { trainerPicture } from "@/lib/junior/world/trainers";

/** The pause menu's Quest page: the dorm and its card, the stars to spend, the islands and missions done, and the save's own language (`language`). */
export function QuestPage({ progress, dorm, stars, locale, language }: { progress: PlayProgress; dorm: Dorm | null; stars: number; locale: Locale; language?: ReactNode }) {
	const words = CONTROLS_COPY[locale];
	const dormWords = DORM_COPY[locale];
	const islands = WORLD_IDS.filter((world) => islandStatus(progress, world) === "done").length;
	const missions = Object.keys(progress.levels).length;
	const info = dorm ? DORM_INFO[dorm] : null;
	const card = info ? cardArtUrl(info.card, 160) : null;
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<div className="flex items-center gap-3 rounded-2xl border-2 p-3" style={{ borderColor: info?.colour ?? "rgba(255,255,255,0.15)" }}>
				{info && dorm ? (
					<>
						<img src={trainerPicture(info.leader, 256)} alt="" height={256} className="h-24 w-auto object-contain" />
						<div className="space-y-1">
							<p dir="auto" lang={locale === "he" ? "en" : undefined} className="font-display text-xl text-fg">
								{dormWords.names[dorm]}
							</p>
							<p dir="auto" className="text-sm text-fg-muted">
								{dormWords.about[dorm]}
							</p>
						</div>
						{card && <img src={card} alt="" width={160} height={160} className="ms-auto h-16 w-16 rounded border-2 border-white/70 object-cover" />}
					</>
				) : (
					<p className="text-fg-muted">{words.noDorm}</p>
				)}
			</div>
			<ul className="space-y-2 rounded-2xl border-2 border-white/15 p-3 text-fg">
				<li className="flex items-center gap-2 text-lg font-semibold text-gold-400">
					<Star className="h-5 w-5 fill-gold-400" aria-hidden />
					{words.stars(stars)}
				</li>
				<li>{words.islandsDone(islands, WORLD_IDS.length)}</li>
				<li>{words.missionsDone(missions, LEVELS.length)}</li>
			</ul>
			{language && <div className="rounded-2xl border-2 border-white/15 p-3 sm:col-span-2">{language}</div>}
		</div>
	);
}
