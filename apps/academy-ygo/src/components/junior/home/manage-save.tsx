"use client";

import { Copy, Download, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { HomeCopy } from "@/lib/junior/home/copy";
import { isPersisted, requestPersist } from "@/lib/junior/persist";
import { emptyPlayProgress, loadPlayProgress, savePlayProgress } from "@/lib/junior/play/progress";
import { characterLocked, createSlot, slotKey, slotStorage, updateSlot, type SlotStorage } from "@/lib/junior/profiles";
import { type ShopRecord, loadShop, mergeShop, shopKeyFor } from "@/lib/junior/world/shop";
import { decodeSave, encodeSave, type SaveData } from "@/lib/junior/save-code";
import { dormKeyFor, loadDorm, saveDorm } from "@/lib/junior/world/dorm";
import { Modal, bigButton, quietButton } from "./confirm-dialog";
import { NameField } from "./name-field";
import { SaveLanguage } from "./save-language";
import type { SlotSummary } from "./save-tile";

/** A save's shop record, as a save code carries it. */
const savedShop = (shop: ShopRecord) => ({ shop: shop.cards, items: shop.items, wear: shop.wear });

export type ManageSection = "menu" | "rename" | "copy" | "load";

/**
 * A save's "manage" view, behind the gear on its tile: change nickname or character, its own language, save a copy (file, share sheet,
 * clipboard), load a copy, delete, and for grown-ups whether the browser agreed to keep the saves and how to add the
 * game to the Home Screen. An empty slot only offers "load a copy".
 */
export function ManageSave({ summary, copy, storage, start = "menu", onChanged, onChangeCharacter, onDelete, onClose }: { summary: SlotSummary; copy: HomeCopy; storage: SlotStorage; start?: ManageSection; onChanged: () => void; onChangeCharacter: () => void; onDelete: () => void; onClose: () => void }) {
	const [section, setSection] = useState<ManageSection>(summary.profile ? start : "load");
	const [persisted, setPersisted] = useState<boolean | null>(null);
	useEffect(() => {
		void isPersisted().then(setPersisted);
	}, []);
	const { slot, profile, name } = summary;
	const title = profile ? copy.manageTitle(name) : copy.loadCopy;
	/* The title screen stays in the site's language; this save's language shows once it is played. */
	const [language, setLanguage] = useState<Locale | null>(profile?.locale ?? null);

	return (
		<Modal title={title} onClose={onClose}>
			{section === "menu" && profile && (
				<div className="grid gap-2">
					<button type="button" className={quietButton} onClick={() => setSection("rename")}>
						{copy.rename}
					</button>
					{characterLocked(summary.levels) ? (
						<p className="text-sm text-fg-muted">{copy.characterLocked}</p>
					) : (
						<button type="button" className={quietButton} onClick={onChangeCharacter}>
							{copy.changeCharacter}
						</button>
					)}
					<SaveLanguage
						copy={copy}
						value={language}
						onChange={(next) => {
							setLanguage(next);
							updateSlot(storage, slot, { locale: next });
							onChanged();
						}}
					/>
					<button type="button" className={quietButton} onClick={() => setSection("copy")}>
						{copy.saveCopy}
					</button>
					<button type="button" className={quietButton} onClick={() => setSection("load")}>
						{copy.loadCopy}
					</button>
					<button type="button" className={`${quietButton} border-red-400/70 text-red-300`} onClick={onDelete}>
						{copy.delete}
					</button>
					{persisted !== null && <p className="text-sm text-fg-muted">{persisted ? copy.persisted : copy.mayDelete}</p>}
					<details className="rounded-xl border border-white/10 p-3 text-sm text-fg-muted">
						<summary className="min-h-12 cursor-pointer content-center font-semibold text-fg">{copy.homeScreenTitle}</summary>
						<p className="pt-2">{copy.homeScreenSteps}</p>
					</details>
				</div>
			)}
			{section === "rename" && profile && <Rename copy={copy} initial={profile.name} onDone={(value) => (updateSlot(storage, slot, { name: value }), onChanged(), setSection("menu"))} onBack={() => setSection("menu")} />}
			{section === "copy" && profile && <SaveCopy copy={copy} data={{ name: profile.name, avatar: profile.avatar, play: loadPlayProgress(slotStorage(storage, slot)).progress, ...savedShop(loadShop(storage, shopKeyFor(slotKey(slot)))), dorm: loadDorm(storage, dormKeyFor(slotKey(slot))), locale: language }} fileName={profile.name || `slot-${slot}`} />}
			{section === "load" && (
				<LoadCopy
					copy={copy}
					onLoad={(save) => {
						if (!profile) {
							createSlot(storage, slot, { name: save.name, avatar: save.avatar, locale: save.locale ?? null });
							savePlayProgress(slotStorage(storage, slot), { ...emptyPlayProgress(), ...save.play });
							void requestPersist();
						} else {
							savePlayProgress(slotStorage(storage, slot), save.play);
							/* As the dorm: a language already chosen here stays; the copy's only fills a save that follows the site. */
							if (save.locale && !language) updateSlot(storage, slot, { locale: save.locale });
						}
						/* What was bought: the union of both, never fewer. A full storage keeps the levels loaded; the rest can be loaded again later. */
						mergeShop(storage, shopKeyFor(slotKey(slot)), { cards: save.shop, items: save.items, wear: save.wear });
						/* A dorm already chosen here stays; the copy's dorm only fills an empty choice. */
						if (save.dorm && !loadDorm(storage, dormKeyFor(slotKey(slot)))) saveDorm(storage, dormKeyFor(slotKey(slot)), save.dorm);
						onChanged();
						onClose();
					}}
				/>
			)}
			<div className="flex justify-end gap-2 border-t border-white/10 pt-3">
				{section !== "menu" && profile && (
					<button type="button" className={quietButton} onClick={() => setSection("menu")}>
						{copy.back}
					</button>
				)}
				<button type="button" className={quietButton} onClick={onClose}>
					{copy.close}
				</button>
			</div>
		</Modal>
	);
}

function Rename({ copy, initial, onDone, onBack }: { copy: HomeCopy; initial: string; onDone: (name: string) => void; onBack: () => void }) {
	const [value, setValue] = useState(initial);
	return (
		<form
			className="space-y-3"
			onSubmit={(event) => {
				event.preventDefault();
				onDone(value);
			}}
		>
			<NameField copy={copy} value={value} onChange={setValue} />
			<div className="flex gap-2">
				<button type="button" className={quietButton} onClick={onBack}>
					{copy.cancel}
				</button>
				<button type="submit" className={`${bigButton} bg-gold-400 text-ink-950`}>
					{copy.ok}
				</button>
			</div>
		</form>
	);
}

function SaveCopy({ copy, data, fileName }: { copy: HomeCopy; data: SaveData; fileName: string }) {
	const code = useMemo(() => encodeSave(data), [data]);
	const [copied, setCopied] = useState(false);
	const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
	const download = () => {
		const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
		const link = Object.assign(document.createElement("a"), { href: url, download: `duel-academy-${fileName}.txt` });
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};
	return (
		<div className="space-y-3">
			<p className="text-sm text-fg-muted">{copy.saveCopyHint}</p>
			<label htmlFor="save-code-out" className="block font-semibold text-fg">
				{copy.pasteLabel}
			</label>
			<textarea id="save-code-out" readOnly value={code} rows={4} onFocus={(event) => event.currentTarget.select()} className="w-full rounded-xl border-2 border-white/25 bg-ink-950 p-2 font-mono text-xs text-fg" dir="ltr" />
			<div className="flex flex-wrap gap-2">
				<button type="button" className={quietButton} onClick={download}>
					<Download className="h-5 w-5" aria-hidden />
					{copy.saveFile}
				</button>
				{canShare && (
					<button type="button" className={quietButton} onClick={() => void navigator.share({ text: code }).catch(() => undefined)}>
						<Share2 className="h-5 w-5" aria-hidden />
						{copy.share}
					</button>
				)}
				<button
					type="button"
					className={quietButton}
					onClick={() =>
						void navigator.clipboard
							?.writeText(code)
							.then(() => setCopied(true))
							.catch(() => undefined)
					}
				>
					<Copy className="h-5 w-5" aria-hidden />
					{copied ? copy.copied : copy.copy}
				</button>
			</div>
			<p role="status" className="sr-only">
				{copied ? copy.copied : ""}
			</p>
		</div>
	);
}

function LoadCopy({ copy, onLoad }: { copy: HomeCopy; onLoad: (save: SaveData) => void }) {
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [found, setFound] = useState<SaveData | null>(null);
	const check = (value: string) => {
		const decoded = decodeSave(value);
		if (decoded.ok) {
			setError(null);
			setFound(decoded.save);
		} else {
			setFound(null);
			setError(decoded.reason === "damaged" ? copy.damaged : copy.notACode);
		}
	};
	if (found)
		return (
			<div className="space-y-3">
				<p className="text-lg text-fg">{copy.loadedPreview(found.name || "?", Object.keys(found.play.levels).length)}</p>
				<div className="flex gap-2">
					<button type="button" className={quietButton} onClick={() => setFound(null)}>
						{copy.cancel}
					</button>
					<button type="button" className={`${bigButton} bg-gold-400 text-ink-950`} onClick={() => onLoad(found)}>
						{copy.ok}
					</button>
				</div>
			</div>
		);
	return (
		<div className="space-y-3">
			<p className="text-sm text-fg-muted">{copy.loadHint}</p>
			<label htmlFor="save-code-in" className="block font-semibold text-fg">
				{copy.pasteLabel}
			</label>
			<textarea id="save-code-in" value={text} rows={4} onChange={(event) => setText(event.target.value)} className="w-full rounded-xl border-2 border-white/25 bg-ink-950 p-2 font-mono text-base text-fg" dir="ltr" autoComplete="off" spellCheck={false} />
			<div className="flex flex-wrap items-center gap-2">
				<label className={`${quietButton} cursor-pointer`}>
					{copy.pickFile}
					<input
						type="file"
						accept=".txt,text/plain"
						className="sr-only"
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file)
								void file.text().then((value) => {
									setText(value);
									check(value);
								});
						}}
					/>
				</label>
				<button type="button" className={`${bigButton} bg-gold-400 text-ink-950`} onClick={() => check(text)}>
					{copy.load}
				</button>
			</div>
			{error && (
				<p role="alert" className="text-red-300">
					{error}
				</p>
			)}
		</div>
	);
}
