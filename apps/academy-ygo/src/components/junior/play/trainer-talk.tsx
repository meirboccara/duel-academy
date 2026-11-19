import type { Locale } from "@/lib/i18n/locales";
import type { WorldId } from "@/lib/junior/play/levels";
import type { Dorm } from "@/lib/junior/world/dorm";
import { TRAINER_NAMES, islandLines, islandTrainer, trainerPicture } from "@/lib/junior/world/trainers";

/**
 * The island's trainer, in the HTML around the map: the character, a name plate and a speech bubble. Readable by a
 * screen reader, right to left in Hebrew, and shown with or without WebGL. Two trainers stand side by side. On the
 * tower island, the leader of the child's dorm.
 */
export function TrainerTalk({ world, dorm = null, done, locale }: { world: WorldId; dorm?: Dorm | null; done: boolean; locale: Locale }) {
	const island = islandTrainer(world, dorm);
	const line = islandLines(locale, world, dorm);
	if (!island.trainers.length || !line) return null;
	const name = island.trainers.map((id) => TRAINER_NAMES[id]).join(" & ");
	return (
		<figure className="pointer-events-auto flex w-full max-w-xl items-end gap-1 [@media(max-height:32rem)]:hidden" aria-label={name}>
			<div className="flex shrink-0 items-end -space-x-5 rtl:space-x-reverse">
				{island.trainers.map((id) => (
					<img key={id} src={trainerPicture(id, 256)} alt="" height={256} loading="lazy" decoding="async" draggable={false} className="h-24 w-auto max-w-20 object-contain object-bottom drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] md:h-28 md:max-w-24" />
				))}
			</div>
			<div className="min-w-0 flex-1">
				<figcaption>
					<bdi lang="en" dir="ltr" className="inline-block rounded-t-lg bg-gold-400 px-2 py-0.5 text-xs font-bold text-ink-950">
						{name}
					</bdi>
				</figcaption>
				<blockquote dir="auto" className="rounded-xl rounded-ss-none bg-white/95 px-3 py-2 text-sm leading-snug text-ink-950 shadow-lg md:text-base">
					{done ? line.done : line.hello}
				</blockquote>
			</div>
		</figure>
	);
}
