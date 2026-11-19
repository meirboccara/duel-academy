"use client";

import { ArrowRight, CircleCheck, Lightbulb } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Copy } from "@/lib/junior/mission1-copy";

export interface Choice {
	id: string;
	text: string;
	icon?: React.ReactNode;
}
interface ChoiceStepProps {
	copy: Copy;
	moving: boolean;
	stepLabel: string;
	title: string;
	prompt?: string;
	children?: React.ReactNode;
	choices: readonly Choice[];
	isCorrect: (id: string) => boolean;
	explain: (id: string) => string;
	onAnswer: (correct: boolean) => void;
	onNext: () => void;
}

/** One question at a time. Wrong answers explain kindly and can be retried; Next appears only after a correct answer. */
export function ChoiceStep({ copy, moving, stepLabel, title, prompt, children, choices, isCorrect, explain, onAnswer, onNext }: ChoiceStepProps) {
	const [picked, setPicked] = useState<string | null>(null);
	const [solved, setSolved] = useState(false);
	const nextRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (solved) nextRef.current?.focus();
	}, [solved]);
	const pickedCorrect = picked !== null && isCorrect(picked);
	const choose = (id: string) => {
		const correct = isCorrect(id);
		setPicked(id);
		if (correct) setSolved(true);
		onAnswer(correct);
	};
	const fade = moving ? "transition-colors" : "";
	return (
		<section aria-labelledby="step-title" className="space-y-5">
			<p className="text-sm font-semibold text-gold-400">{stepLabel}</p>
			<h2 id="step-title" data-step-heading tabIndex={-1} className="font-display text-2xl text-fg md:text-3xl">{title}</h2>
			{children}
			{prompt && <p className="text-lg text-fg">{prompt}</p>}
			<div role="group" aria-labelledby="step-title" className="grid gap-3 sm:grid-cols-3">
				{choices.map((choice) => (
					<button
						key={choice.id}
						type="button"
						disabled={solved}
						onClick={() => choose(choice.id)}
						className={`inline-flex min-h-12 items-center justify-start gap-3 rounded-xl border-2 px-4 py-3 text-start text-base font-semibold text-fg ${fade} ${
							picked === choice.id ? (pickedCorrect ? "border-spell bg-spell/20" : "border-ember-400 bg-ember-500/10") : "border-white/25 bg-surface-raised hover:border-gold-400"
						} disabled:opacity-70`}
					>
						{choice.icon}
						<span>{choice.text}</span>
					</button>
				))}
			</div>
			<div role="status" aria-live="polite" className="min-h-16">
				{picked !== null && (
					<div className={`flex gap-3 rounded-xl border-2 p-4 ${pickedCorrect ? "border-spell bg-spell/10" : "border-ember-400 bg-ember-500/10"}`}>
						{pickedCorrect ? <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-spell" aria-hidden /> : <Lightbulb className="mt-0.5 h-6 w-6 shrink-0 text-ember-400" aria-hidden />}
						<p>
							<strong className="block">{pickedCorrect ? copy.right : copy.notYet}</strong>
							{explain(picked)}
							{!pickedCorrect && <span className="mt-1 block text-fg-muted">{copy.tryAgain}</span>}
						</p>
					</div>
				)}
			</div>
			{solved && (
				<button ref={nextRef} type="button" onClick={onNext} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950">
					{copy.next}
					<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
				</button>
			)}
		</section>
	);
}
