"use client";

import { useState } from "react";
import type { HomeCopy } from "@/lib/junior/home/copy";
import { AVATARS, type Avatar } from "@/lib/junior/profiles";
import { AvatarPicture } from "./avatar-picture";
import { bigButton, quietButton } from "./confirm-dialog";

/**
 * "Who are you?": six still pictures, never live 3D, so nothing heavy loads before the child has chosen and it works
 * without WebGL. A radio group of large buttons; the chosen one gets a gold border and a small bounce.
 *
 * Six fit on one screen without scrolling: three by two on a tablet, two by three on an upright phone, and one row
 * of six on a phone held sideways, where there is width but hardly any height.
 */
export function ChooseAvatar({ copy, initial, onDone, onBack }: { copy: HomeCopy; initial?: Avatar; onDone: (avatar: Avatar) => void; onBack: () => void }) {
	const [chosen, setChosen] = useState<Avatar | null>(initial ?? null);
	return (
		<section aria-labelledby="choose-title" className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-center [@media(max-height:520px)]:max-w-4xl [@media(max-height:520px)]:space-y-3 [@media(max-height:520px)]:py-3">
			<h2 id="choose-title" data-step-heading tabIndex={-1} className="font-display text-3xl text-fg outline-none md:text-4xl">
				{copy.chooseTitle}
			</h2>
			<div role="radiogroup" aria-labelledby="choose-title" className="grid grid-cols-3 gap-3 max-[420px]:grid-cols-2 [@media(max-height:520px)]:grid-cols-6 [@media(max-height:520px)]:gap-2">
				{AVATARS.map((avatar) => {
					const on = chosen === avatar;
					return (
						<button
							key={avatar}
							type="button"
							role="radio"
							aria-checked={on}
							onClick={() => setChosen(avatar)}
							className={`flex min-h-12 flex-col items-center gap-2 rounded-2xl border-4 bg-surface/70 p-3 transition-transform max-[420px]:gap-1 max-[420px]:p-2 [@media(max-height:520px)]:gap-1 [@media(max-height:520px)]:p-2 motion-safe:duration-200 ${on ? "scale-105 border-gold-400 shadow-[0_0_24px_rgba(255,216,74,0.45)] motion-safe:animate-[bounce_0.6s_ease-out_1]" : "border-white/15"}`}
						>
							<AvatarPicture avatar={avatar} className="aspect-square w-full max-w-40 max-[420px]:max-w-24 [@media(max-height:900px)]:max-w-32 [@media(max-height:520px)]:max-w-24" />
							<span className="text-lg font-semibold text-fg max-[420px]:text-base [@media(max-height:520px)]:text-base">{copy.avatars[avatar]}</span>
						</button>
					);
				})}
			</div>
			<div className="flex justify-center gap-3">
				<button type="button" onClick={onBack} className={quietButton}>
					{copy.back}
				</button>
				<button type="button" disabled={!chosen} onClick={() => chosen && onDone(chosen)} className={`${bigButton} bg-gold-400 text-ink-950 disabled:opacity-40`}>
					{copy.ok}
				</button>
			</div>
		</section>
	);
}
