"use client";

import { ArrowLeft, ArrowRight, EyeOff, RotateCcw, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import { STEPS } from "@/lib/junior/flow";
import { COPY } from "@/lib/junior/mission1-copy";
import { CARD_KINDS, OPTION_IDS, QUIZ_QUESTIONS, SORT_CARDS, checkQuizAnswer, checkSortAnswer, type CardKind, type OptionId } from "@/lib/junior/mission1";
import { JUNIOR_PROGRESS_KEY, emptyProgress, isMastered, loadProgress, mergeProgress, recordAnswer, saveProgress, type JuniorProgress, type JuniorStorage } from "@/lib/junior/progress";
import { CalmToggle } from "./calm-toggle";
import { ChoiceStep } from "./choice-step";
import { BadgeArt, StoryArt } from "./mission-art";
import { SortCardFace } from "./sort-card";

const KIND_ICONS: Record<CardKind, React.ReactNode> = {
	monster: <Shield className="h-6 w-6 shrink-0 text-arcane-300" aria-hidden />,
	spell: <Sparkles className="h-6 w-6 shrink-0 text-spell" aria-hidden />,
	trap: <EyeOff className="h-6 w-6 shrink-0 text-trap" aria-hidden />,
};
function getStorage(): JuniorStorage | undefined {
	try {
		return window.localStorage;
	} catch {
		return undefined;
	}
}
const isOption = (value: string): value is OptionId => OPTION_IDS.some((option) => option === value);
const isKind = (value: string): value is CardKind => CARD_KINDS.some((kind) => kind === value);

export function MissionOne() {
	const { locale } = useLanguage();
	const copy = COPY[locale];
	const [index, setIndex] = useState(0);
	const [progress, setProgress] = useState(emptyProgress);
	const [hydrated, setHydrated] = useState(false);
	const [deviceReduced, setDeviceReduced] = useState(false);
	const progressRef = useRef(progress);
	/* Motion stays off until the saved choice and the device setting are known, so calm never flashes. */
	const moving = hydrated && !progress.calm && !deviceReduced;
	const step = STEPS[index];
	const stepRef = useRef<HTMLDivElement>(null);
	const shownIndex = useRef(index);
	useEffect(() => {
		if (shownIndex.current === index) return;
		shownIndex.current = index;
		stepRef.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus();
	}, [index]);
	const apply = useCallback((value: JuniorProgress) => {
		progressRef.current = value;
		setProgress(value);
	}, []);
	/** A change by the child: save it merged with the latest stored record, then show the merged result. */
	const commit = (change: (current: JuniorProgress) => JuniorProgress) => {
		const changed = change(progressRef.current);
		if (changed === progressRef.current) return;
		apply(saveProgress(getStorage(), changed) ?? changed);
	};
	/* Server and first client render use the empty default; saved progress and the device setting join after hydration. */
	useEffect(() => {
		apply(mergeProgress(progressRef.current, loadProgress(getStorage()).progress));
		setDeviceReduced(typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
		setHydrated(true);
	}, [apply]);
	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = (event: MediaQueryListEvent) => setDeviceReduced(event.matches);
		query.addEventListener?.("change", update);
		return () => query.removeEventListener?.("change", update);
	}, []);
	/* Another tab saved progress: take its answers and its calm choice. */
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== JUNIOR_PROGRESS_KEY) return;
			const latest = loadProgress(getStorage());
			if (latest.writable) apply(mergeProgress(progressRef.current, latest.progress));
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [apply]);
	const next = () => setIndex((current) => Math.min(current + 1, STEPS.length - 1));
	const nextButton = (
		<button type="button" onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950">
			{copy.next}
			<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
		</button>
	);
	return (
		<main data-motion={moving ? "on" : "off"} className="mx-auto max-w-240 space-y-6 px-4 py-6 md:px-6">
			<h1 className="font-display text-3xl text-fg md:text-4xl">{copy.pageTitle}</h1>
			<CalmToggle copy={copy} calm={progress.calm} deviceReduced={deviceReduced} onToggle={() => commit((current) => ({ ...current, calm: !current.calm }))} />
			{step?.kind !== "badge" && (
				<Link href="/" className="inline-flex min-h-12 items-center gap-2 text-fg-muted hover:text-gold-400">
					<ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
					{copy.back}
				</Link>
			)}
			<div ref={stepRef}>
				{step?.kind === "intro" && (
					<section aria-labelledby="step-title" className="space-y-5">
						<h2 id="step-title" data-step-heading tabIndex={-1} className="text-sm font-semibold text-gold-400">{copy.kicker}</h2>
						<p className="text-lg text-fg">{copy.introText}</p>
						{isMastered(progress) && <p role="note" className="rounded-xl border-2 border-gold-400 p-3 text-fg">{copy.masteredNote}</p>}
						<button type="button" onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950">{copy.start}</button>
					</section>
				)}
				{step?.kind === "story" && (
					<section aria-labelledby="step-title" className="space-y-5">
						<p className="text-sm font-semibold text-gold-400">{copy.storyStep(step.number, step.total)}</p>
						<h2 id="step-title" data-step-heading tabIndex={-1} className="font-display text-2xl text-fg md:text-3xl">{copy.story[step.id].title}</h2>
						<StoryArt id={step.id} label={copy.story[step.id].art} moving={moving} />
						<p className="text-lg text-fg">{copy.story[step.id].text}</p>
						{nextButton}
					</section>
				)}
				{step?.kind === "sort" && (() => {
					const card = SORT_CARDS.find((candidate) => candidate.id === step.cardId);
					if (!card) return null;
					const text = copy.cards[card.id];
					return (
						<ChoiceStep
							key={index}
							copy={copy}
							moving={moving}
							stepLabel={copy.sortStep(step.number, step.total)}
							title={text.name}
							prompt={copy.sortPrompt}
							choices={CARD_KINDS.map((kind) => ({ id: kind, text: copy.kinds[kind], icon: KIND_ICONS[kind] }))}
							isCorrect={(id) => isKind(id) && checkSortAnswer(card.id, id)}
							explain={(id) => (isKind(id) ? text.explain[id] : "")}
							onAnswer={(correct) => commit((current) => recordAnswer(current, "sort", card.id, correct))}
							onNext={next}
						>
							<SortCardFace card={card} text={text.text} copy={copy} />
						</ChoiceStep>
					);
				})()}
				{step?.kind === "quiz" && (() => {
					const question = QUIZ_QUESTIONS.find((candidate) => candidate.id === step.questionId);
					if (!question) return null;
					const text = copy.quiz[question.id];
					return (
						<ChoiceStep
							key={index}
							copy={copy}
							moving={moving}
							stepLabel={copy.quizStep(step.number, step.total)}
							title={text.question}
							choices={OPTION_IDS.map((id) => ({ id, text: text.options[id].text }))}
							isCorrect={(id) => isOption(id) && checkQuizAnswer(question.id, id)}
							explain={(id) => (isOption(id) ? text.options[id].explain : "")}
							onAnswer={(correct) => commit((current) => recordAnswer(current, "quiz", question.id, correct))}
							onNext={next}
						/>
					);
				})()}
				{step?.kind === "badge" && (
					<section aria-labelledby="step-title" className="space-y-5 text-center">
						<BadgeArt label={copy.badgeArt} moving={moving} />
						<h2 id="step-title" data-step-heading tabIndex={-1} className="font-display text-2xl text-fg md:text-3xl">{copy.badgeTitle}</h2>
						<p className="text-lg text-fg">{copy.badgeText}</p>
						<div className="flex flex-wrap justify-center gap-3">
							<button type="button" onClick={() => setIndex(0)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-ink-950">
								<RotateCcw className="h-5 w-5" aria-hidden />
								{copy.replay}
							</button>
							<Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-white/25 px-6 py-3 font-semibold text-fg">
								<ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
								{copy.back}
							</Link>
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
