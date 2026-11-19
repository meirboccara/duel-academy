"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";

/** The two ways in from the landing page: the full beginner course and the Junior story mission. */
export function LearningPaths() {
	const { t } = useLanguage();
	const paths = [
		{
			id: "beginner",
			href: "/academy",
			icon: BookOpen,
			title: t("Beginner"),
			audience: t("Teens and adults · 4 chapters"),
			text: t("The full visual course, from your first card to exact rulings, one short presentation at a time."),
			cta: t("Start the course"),
		},
		{
			id: "junior",
			href: "/junior",
			icon: Sparkles,
			title: t("Junior"),
			audience: t("Ages 8 to 12 · story mission"),
			text: t("Meet the Deck in a short story, sort Monster, Spell and Trap cards, then answer three quick questions."),
			cta: t("Start Mission 1"),
		},
	];
	return (
		<section className="relative mx-auto max-w-7xl px-6 pb-16" aria-labelledby="paths-heading">
			<p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">{t("Learning paths")}</p>
			<h2 id="paths-heading" className="mb-8 font-display text-3xl text-fg md:text-4xl">
				{t("Choose your path")}
			</h2>
			<ul className="grid gap-5 md:grid-cols-2">
				{paths.map(({ id, href, icon: Icon, title, audience, text, cta }) => (
					<li key={id} className="flex flex-col rounded-2xl border border-white/10 bg-surface/60 p-6">
						<Icon className="mb-3 h-8 w-8 text-gold-400" aria-hidden />
						<h3 className="font-display text-2xl text-fg">{title}</h3>
						<p className="mt-1 text-xs font-semibold uppercase tracking-wider text-arcane-300">{audience}</p>
						<p className="mt-3 flex-1 leading-relaxed text-fg-muted">{text}</p>
						<Link
							href={href}
							className="mt-6 inline-flex min-h-12 items-center gap-2 self-start rounded-full border border-gold-400/60 px-6 py-2.5 font-semibold text-gold-400 transition hover:bg-gold-400/10 focus-visible:outline-2 focus-visible:outline-gold-400"
						>
							{cta}
							<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
