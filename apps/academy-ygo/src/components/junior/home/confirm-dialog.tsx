"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import type { HomeCopy } from "@/lib/junior/home/copy";
import type { Avatar } from "@/lib/junior/profiles";
import { AvatarPicture } from "./avatar-picture";

export const bigButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-2 text-lg font-semibold";
export const quietButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/25 px-4 py-2 font-semibold text-fg";

/** A dialog inside the page (never `window.confirm`): a title, the content, Escape closes, focus starts on `initial`. */
export function Modal({ title, onClose, initial, children }: { title: string; onClose: () => void; initial?: RefObject<HTMLElement | null>; children: ReactNode }) {
	const id = useId();
	const box = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const back = document.activeElement as HTMLElement | null;
		(initial?.current ?? box.current?.querySelector<HTMLElement>("button, input, textarea"))?.focus();
		return () => back?.focus?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return (
		<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm">
			<div ref={box} role="dialog" aria-modal="true" aria-labelledby={id} className="w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-surface p-5 shadow-2xl">
				<h2 id={id} className="font-display text-2xl text-fg">
					{title}
				</h2>
				{children}
			</div>
		</div>
	);
}

/**
 * "Replace" or "Delete" a save: the character and nickname, what will be lost, Keep first with the focus, the
 * destructive button second and apart, and "Save a copy first". Two taps on two different buttons.
 */
export function ConfirmDialog({ kind, name, avatar, levels, cards, copy, onKeep, onConfirm, onSaveCopy }: { kind: "replace" | "delete"; name: string; avatar: Avatar; levels: number; cards: number; copy: HomeCopy; onKeep: () => void; onConfirm: () => void; onSaveCopy: () => void }) {
	const keep = useRef<HTMLButtonElement>(null);
	return (
		<Modal title={kind === "replace" ? copy.confirmReplace(name) : copy.confirmDelete(name)} onClose={onKeep} initial={keep}>
			<div className="flex items-center gap-3">
				<AvatarPicture avatar={avatar} className="h-16 w-16" />
				<p className="text-fg">{copy.loses(levels, cards)}</p>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<button ref={keep} type="button" onClick={onKeep} className={`${bigButton} bg-gold-400 text-ink-950`}>
					{copy.keep}
				</button>
				<button type="button" onClick={onSaveCopy} className={quietButton}>
					{copy.saveCopyFirst}
				</button>
			</div>
			<div className="border-t border-white/10 pt-4">
				<button type="button" onClick={onConfirm} className={`${quietButton} border-red-400/70 text-red-300`}>
					{kind === "replace" ? copy.replace : copy.delete}
				</button>
			</div>
		</Modal>
	);
}
