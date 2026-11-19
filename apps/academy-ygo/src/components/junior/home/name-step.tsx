"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { HomeCopy } from "@/lib/junior/home/copy";
import { cleanName, type Avatar } from "@/lib/junior/profiles";
import { AvatarPicture } from "./avatar-picture";
import { bigButton, quietButton } from "./confirm-dialog";
import { NameField } from "./name-field";
import { SaveLanguage } from "./save-language";

/**
 * New game, second step: the optional nickname, under the chosen character, and the save's language ("the site's"
 * unless changed; it can be changed later too). "Skip" keeps the default name, and the language chosen.
 */
export function NameStep({ copy, avatar, onDone, onBack }: { copy: HomeCopy; avatar: Avatar; onDone: (name: string, locale: Locale | null) => void; onBack: () => void }) {
	const [name, setName] = useState("");
	const [locale, setLocale] = useState<Locale | null>(null);
	return (
		<form
			aria-labelledby="name-title"
			className="mx-auto max-w-md space-y-5 px-4 py-8 text-center"
			onSubmit={(event) => {
				event.preventDefault();
				onDone(cleanName(name), locale);
			}}
		>
			<AvatarPicture avatar={avatar} className="mx-auto h-32 w-32" />
			<h2 id="name-title" data-step-heading tabIndex={-1} className="font-display text-3xl text-fg outline-none">
				{copy.nameTitle}
			</h2>
			<NameField copy={copy} value={name} onChange={setName} />
			<div className="flex justify-center">
				<SaveLanguage copy={copy} value={locale} onChange={setLocale} />
			</div>
			<div className="flex flex-wrap justify-center gap-3">
				<button type="button" onClick={onBack} className={quietButton}>
					{copy.back}
				</button>
				<button type="button" onClick={() => onDone("", locale)} className={quietButton}>
					{copy.skip}
				</button>
				<button type="submit" className={`${bigButton} bg-gold-400 text-ink-950`}>
					{copy.ok}
				</button>
			</div>
		</form>
	);
}
