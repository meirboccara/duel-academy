"use client";

import { Moon } from "lucide-react";
import type { Copy } from "@/lib/junior/mission1-copy";

interface CalmToggleProps {
	copy: Copy;
	calm: boolean;
	deviceReduced: boolean;
	onToggle: () => void;
}

/** The child's own calm choice. The device's reduced-motion setting also turns motion off, and is said out loud. */
export function CalmToggle({ copy, calm, deviceReduced, onToggle }: CalmToggleProps) {
	return (
		<div className="space-y-1">
			<button
				type="button"
				aria-pressed={calm}
				onClick={onToggle}
				className={`inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 py-2 font-semibold text-fg ${calm ? "border-gold-400 bg-gold-400/20" : "border-white/25"}`}
			>
				<Moon className="h-5 w-5" aria-hidden />
				{copy.calm}
			</button>
			<p className="text-sm text-fg-muted">{deviceReduced ? copy.calmDevice : copy.calmHint}</p>
		</div>
	);
}
