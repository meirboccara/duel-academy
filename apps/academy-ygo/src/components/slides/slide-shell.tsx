import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SlideShellProps {
	title: string;
	description: string;
	alt: string;
	children: ReactNode;
	className?: string;
}

/**
 * Presentation canvas: title + short description + visual area.
 * `alt` is exposed for screen readers; the visual itself may be decorative.
 */
export function SlideShell({ title, description, alt, children, className }: SlideShellProps) {
	return (
		<article
			className={cn(
				"slide-canvas relative mx-auto flex flex-col",
				"stage:overflow-hidden stage:rounded-2xl stage:border stage:border-white/10 stage:bg-surface/90 stage:shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
				className,
			)}
			aria-label={title}
		>
			<header className="shrink-0 px-5 pb-4 pt-5 stage:border-b stage:border-white/10 stage:px-10 stage:pb-3 stage:pt-6">
				<h2 className="font-display text-balance text-[1.55rem] leading-[1.15] text-gold-400 stage:text-3xl">{title}</h2>
				<p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-fg/80 stage:mt-2 stage:text-base stage:text-fg-muted">
					{description}
				</p>
			</header>
			<div
				className="relative mx-3 flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-white/8 bg-surface/70 px-3 py-5 stage:mx-0 stage:rounded-none stage:border-0 stage:bg-transparent stage:px-8 stage:py-6"
				aria-describedby="slide-alt"
			>
				<p id="slide-alt" className="sr-only">
					{alt}
				</p>
				{children}
			</div>
		</article>
	);
}
