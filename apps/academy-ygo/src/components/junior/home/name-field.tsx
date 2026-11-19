"use client";

import type { HomeCopy } from "@/lib/junior/home/copy";
import { NAME_MAX } from "@/lib/junior/profiles";

/**
 * The nickname field: at most 12 characters as the reader sees them (cleaned again on save), any alphabet, right to
 * left when typed in Hebrew, and text at 16 px or more so Safari on iPhone does not zoom in.
 */
export function NameField({ copy, value, onChange }: { copy: HomeCopy; value: string; onChange: (value: string) => void }) {
	return (
		<div className="space-y-1 text-start">
			<label htmlFor="nickname" className="block font-semibold text-fg">
				{copy.nameLabel}
			</label>
			<input
				id="nickname"
				type="text"
				value={value}
				onChange={(event) => onChange(Array.from(event.target.value).slice(0, NAME_MAX).join(""))}
				maxLength={NAME_MAX * 2}
				autoComplete="off"
				autoCorrect="off"
				spellCheck={false}
				autoCapitalize="words"
				enterKeyHint="done"
				dir="auto"
				aria-describedby="nickname-hint"
				className="min-h-12 w-full rounded-xl border-2 border-white/25 bg-ink-950 px-3 text-lg text-fg focus:border-gold-400 focus:outline-none"
			/>
			<p id="nickname-hint" className="text-sm text-fg-muted">
				{copy.nameHint}
			</p>
		</div>
	);
}
