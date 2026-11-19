"use client";

import { Plus, Settings } from "lucide-react";
import type { HomeCopy } from "@/lib/junior/home/copy";
import { WORLD_IDS } from "@/lib/junior/play/levels";
import type { Profile, Slot } from "@/lib/junior/profiles";
import { AvatarPicture } from "./avatar-picture";

/** What a save tile shows, all derived from the slot's profile and play record. */
export interface SlotSummary {
	slot: Slot;
	profile: Profile | null;
	/** Nickname, or the default name in the current language. */
	name: string;
	levels: number;
	islands: number;
	cards: number;
	/** Whole days since the save was last opened. */
	days: number;
}

const TILE = "flex min-h-36 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-center";

/** A tile of the same size before the saves are known, so the screen fills in and nothing jumps. */
export function TilePlaceholder() {
	return <div data-slot-placeholder aria-hidden className={`${TILE} border-white/10 bg-surface/40`} />;
}

export function SaveTile({ summary, copy, mode, onOpen, onManage }: { summary: SlotSummary; copy: HomeCopy; mode: "open" | "replace"; onOpen: () => void; onManage: () => void }) {
	const { profile, name } = summary;
	if (!profile)
		return (
			<button type="button" onClick={onOpen} disabled={mode === "replace"} className={`${TILE} border-dashed border-white/30 bg-surface/40 text-fg-muted hover:border-gold-400 disabled:opacity-40`}>
				<Plus className="h-10 w-10" aria-hidden />
				<span className="font-semibold">{copy.emptySlot}</span>
			</button>
		);
	return (
		<div className="relative">
			<button type="button" onClick={onOpen} aria-label={mode === "replace" ? copy.replaceThis(name) : undefined} className={`${TILE} ${mode === "replace" ? "border-red-400/70 bg-red-950/30" : "border-gold-400/60 bg-surface/70 hover:border-gold-400"}`}>
				<AvatarPicture avatar={profile.avatar} className="h-20 w-20" />
				<span className="sr-only">{mode === "replace" ? "" : copy.open(name)}</span>
				<bdi dir="auto" aria-hidden={mode === "open"} className="text-lg font-semibold text-fg">
					{name}
				</bdi>
				<span className="text-sm text-fg-muted">
					{copy.islands(summary.islands, WORLD_IDS.length)} · {copy.cards(summary.cards)}
				</span>
				{profile.playedAt && <span className="text-xs text-fg-muted">{copy.playedOn(summary.days)}</span>}
			</button>
			{mode === "open" && (
				<button type="button" onClick={onManage} aria-label={copy.manage(name)} title={copy.manage(name)} className="absolute end-1 top-1 grid h-12 w-12 place-items-center rounded-full text-fg-muted hover:text-gold-400">
					<Settings className="h-6 w-6" aria-hidden />
				</button>
			)}
		</div>
	);
}
