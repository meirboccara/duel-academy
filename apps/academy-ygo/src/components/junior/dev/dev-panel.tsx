"use client";

import { Wrench, X } from "lucide-react";
import { useState } from "react";
import type { DevSettings } from "@/lib/junior/dev/dev-tools";
import type { PlayCopy } from "@/lib/junior/play/copy";
import { LEVELS, WORLD_IDS, levelsOf, type WorldId } from "@/lib/junior/play/levels";
import { TIERS, type Tier } from "@/lib/junior/play/masters";

const field = "min-h-10 rounded-lg border-2 border-white/25 bg-ink-950 px-2 text-sm text-fg";
const action = "min-h-10 rounded-lg border-2 border-gold-400/70 px-3 text-sm font-semibold text-fg hover:bg-gold-400/20";
const danger = "min-h-10 rounded-lg border-2 border-ember-400 px-3 text-sm font-semibold text-fg hover:bg-ember-500/20";

export interface DevActions {
	/** Opens any level, locked or not. */
	onOpen: (levelId: string) => void;
	/** Marks every level before this one solved. */
	onUnlockTo: (levelId: string) => void;
	/** Marks every level up to the end of this island solved. */
	onFinishIsland: (world: WorldId) => void;
	onFinishAll: () => void;
	/** Forgets every solved level of this save (the shop, Deck and dorm stay). */
	onResetProgress: () => void;
	/** Forgets this save's starter Deck, to choose it again. */
	onResetDeck: () => void;
	onSettings: (settings: DevSettings) => void;
}

/**
 * The developer tools panel: shown only under `next dev` (see dev-tools.ts), in English, for the people who build the
 * game. A wrench in the corner opens it.
 */
export function DevPanel({ copy, settings, actions }: { copy: PlayCopy; settings: DevSettings; actions: DevActions }) {
	const [open, setOpen] = useState(false);
	const [levelId, setLevelId] = useState(LEVELS[0]?.id ?? "");
	const [world, setWorld] = useState<WorldId>(WORLD_IDS[0]);
	if (!open) {
		return (
			<button type="button" onClick={() => setOpen(true)} aria-label="Developer tools" title="Developer tools (local only)" className="fixed bottom-3 start-3 z-[70] grid h-11 w-11 place-items-center rounded-full border-2 border-ember-400 bg-ink-950/80 text-ember-400 print:hidden">
				<Wrench className="h-5 w-5" aria-hidden />
			</button>
		);
	}
	return (
		<section aria-label="Developer tools" className="fixed bottom-3 start-3 z-[70] max-h-[85svh] w-[min(26rem,calc(100vw-1.5rem))] space-y-3 overflow-y-auto rounded-2xl border-2 border-ember-400 bg-ink-950/95 p-3 text-fg shadow-xl print:hidden" dir="ltr" lang="en">
			<header className="flex items-center justify-between">
				<h2 className="font-display text-lg">Developer tools · local only</h2>
				<button type="button" onClick={() => setOpen(false)} aria-label="Close the developer tools" className="grid h-9 w-9 place-items-center rounded-lg border-2 border-white/25">
					<X className="h-4 w-4" aria-hidden />
				</button>
			</header>

			<fieldset className="space-y-2">
				<legend className="text-sm font-semibold text-gold-400">Any level, locked or not</legend>
				<select aria-label="Level" value={levelId} onChange={(event) => setLevelId(event.target.value)} className={`${field} w-full`}>
					{WORLD_IDS.map((id, index) => (
						<optgroup key={id} label={`${index + 1}. ${copy.worlds[id].title}`}>
							{levelsOf(id).map((level) => (
								<option key={level.id} value={level.id}>
									{copy.levels[level.id]?.title ?? level.id} ({level.id})
								</option>
							))}
						</optgroup>
					))}
				</select>
				<div className="flex flex-wrap gap-2">
					<button type="button" className={action} onClick={() => actions.onOpen(levelId)}>
						Open it
					</button>
					<button type="button" className={action} onClick={() => actions.onUnlockTo(levelId)}>
						Solve everything before it
					</button>
				</div>
			</fieldset>

			<fieldset className="space-y-2">
				<legend className="text-sm font-semibold text-gold-400">Islands</legend>
				<select aria-label="Island" value={world} onChange={(event) => setWorld(event.target.value as WorldId)} className={`${field} w-full`}>
					{WORLD_IDS.map((id, index) => (
						<option key={id} value={id}>
							{index + 1}. {copy.worlds[id].title}
						</option>
					))}
				</select>
				<div className="flex flex-wrap gap-2">
					<button type="button" className={action} onClick={() => actions.onFinishIsland(world)}>
						Finish up to this island
					</button>
					<button type="button" className={action} onClick={actions.onFinishAll}>
						Finish every island
					</button>
				</div>
			</fieldset>

			<fieldset className="space-y-2">
				<legend className="text-sm font-semibold text-gold-400">Masters&apos; island</legend>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={settings.allCards} onChange={(event) => actions.onSettings({ ...settings, allCards: event.target.checked })} className="h-5 w-5" />
					Every playable card in the binder (Deck editor)
				</label>
				<label className="flex items-center gap-2 text-sm">
					Who starts a duel
					<select aria-label="Who starts a duel" value={settings.first ?? ""} onChange={(event) => actions.onSettings({ ...settings, first: event.target.value === "you" || event.target.value === "rival" ? event.target.value : null })} className={field}>
						<option value="">Coin toss</option>
						<option value="you">The child</option>
						<option value="rival">The trainer</option>
					</select>
				</label>
				<label className="flex items-center gap-2 text-sm">
					Trainer level
					<select aria-label="Trainer level" value={settings.tier ?? ""} onChange={(event) => actions.onSettings({ ...settings, tier: TIERS.find((tier) => tier === event.target.value) ?? (null as Tier | null) })} className={field}>
						<option value="">Their own</option>
						{TIERS.map((tier) => (
							<option key={tier} value={tier}>
								{tier}
							</option>
						))}
					</select>
				</label>
				<button type="button" className={danger} onClick={actions.onResetDeck}>
					Forget the starter Deck
				</button>
			</fieldset>

			<fieldset className="space-y-2">
				<legend className="text-sm font-semibold text-gold-400">This save</legend>
				<button type="button" className={danger} onClick={actions.onResetProgress}>
					Forget every solved level
				</button>
				<p className="text-xs text-fg-muted">In a level, the tools bar under the board plays the solution, lets the bot play your turn, or wins at once.</p>
			</fieldset>
		</section>
	);
}

/** The developer tools in a level: under the board, only under `next dev`. */
export function DevLevelBar({ canSolve, onSolve, onBotTurn, onWin }: { canSolve: boolean; onSolve: () => void; onBotTurn: () => void; onWin: () => void }) {
	return (
		<div role="group" aria-label="Developer tools for this level" dir="ltr" lang="en" className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-ember-400 p-2 print:hidden">
			<span className="text-xs font-semibold uppercase text-ember-400">Dev</span>
			{canSolve && (
				<button type="button" className={action} onClick={onSolve}>
					Play the solution
				</button>
			)}
			<button type="button" className={action} onClick={onBotTurn}>
				Bot plays my turn
			</button>
			<button type="button" className={danger} onClick={onWin}>
				Win now
			</button>
		</div>
	);
}
