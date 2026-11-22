/**
 * Builds the official card pictures of the Junior course: `public/cards/<image>-160.webp` and `<image>-480.webp`,
 * and the generated module `packages/cards/src/card-art.ts` (the printed facts of @duel-academy/cards).
 *
 * The list is `packages/cards/src/card-art.json` (app card id -> YGOPRODeck card id and picture id). YGOPRODeck's
 * API guide asks that every picture is pulled once and stored, never hot-linked: each cropped picture is downloaded
 * once into `.cache/cards` (not in git), one at a time, at most 5 requests a second, and our own WebP copies are
 * made from it. The card facts (English and French names, printed text) are fetched once into the same folder.
 * Run by hand when the list changes (`pnpm --filter academy-ygo cards:art`); the output is committed with the app.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CARDS = join(APP, "..", "..", "packages", "cards", "src");
const LIST = join(CARDS, "card-art.json");
const CACHE = join(APP, ".cache", "cards");
const OUT = join(APP, "public", "cards");
const MODULE = join(CARDS, "card-art.ts");
const WIDTHS = [160, 480];
const GAP_MS = 220; // under 5 requests a second

const list = JSON.parse(await readFile(LIST, "utf8"));
let last = 0;
async function politeFetch(url) {
	const wait = last + GAP_MS - Date.now();
	if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
	last = Date.now();
	const response = await fetch(url, { headers: { "User-Agent": "duel-academy-build/1.0" } });
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	return response;
}
async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
await mkdir(CACHE, { recursive: true });
await mkdir(OUT, { recursive: true });

/* 1. Card facts, in English and French, one call each for the whole list (cached). */
const ids = [...new Set(Object.values(list).map((entry) => entry.card))].sort((a, b) => a - b);
const facts = {};
for (const language of ["en", "fr"]) {
	const path = join(CACHE, `info-${language}.json`);
	const wanted = ids.join(",");
	let cached = (await exists(path)) ? JSON.parse(await readFile(path, "utf8")) : null;
	if (!cached || cached.ids !== wanted) {
		const query = `id=${wanted}${language === "en" ? "" : `&language=${language}`}`;
		const body = await (await politeFetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${query}`)).json();
		cached = { ids: wanted, data: body.data };
		await writeFile(path, JSON.stringify(cached, null, "\t"));
		console.log(`facts ${language}: fetched ${body.data.length}`);
	}
	/* A card asked for by an alternate picture's id comes back under its main id: index it under every picture id. */
	facts[language] = Object.fromEntries(cached.data.flatMap((card) => [card.id, ...(card.card_images ?? []).map((image) => image.id)].map((id) => [id, card])));
}

/* 2. Pictures: download each cropped picture once, then our own two WebP sizes. */
let downloaded = 0;
for (const entry of Object.values(list)) {
	const source = join(CACHE, `${entry.image}.jpg`);
	if (!(await exists(source))) {
		const response = await politeFetch(`https://images.ygoprodeck.com/images/cards_cropped/${entry.image}.jpg`);
		await writeFile(source, Buffer.from(await response.arrayBuffer()));
		downloaded++;
	}
	for (const width of WIDTHS) {
		const target = join(OUT, `${entry.image}-${width}.webp`);
		if (await exists(target)) continue;
		await sharp(source).resize({ width, withoutEnlargement: false }).webp({ quality: width > 200 ? 78 : 72 }).toFile(target);
	}
}
console.log(`pictures: ${downloaded} downloaded, ${Object.keys(list).length} in the list`);

/* 3. The generated module: the app never guesses a file name. */
const lines = Object.entries(list).map(([id, entry]) => {
	const en = facts.en[entry.card];
	const fr = facts.fr[entry.card];
	if (!en) throw new Error(`no card facts for ${id} (${entry.card})`);
	const kind = /Spell/.test(en.type) ? "spell" : /Trap/.test(en.type) ? "trap" : "monster";
	const numbers = kind === "monster" ? `, level: ${en.level ?? en.linkval ?? 0}, atk: ${en.atk ?? 0}, def: ${en.def ?? 0}` : "";
	/* The printed words: the Type (a Monster's Type, or the icon of a Spell or Trap), the frame, and the card text. A Normal Monster's text is a story, not rules: left out. */
	const frame = String(en.frameType ?? "").replace(/_pendulum$/, "");
	const words = frame === "normal" ? "" : `, text: ${JSON.stringify(en.desc ?? "")}, textFr: ${JSON.stringify(fr?.desc ?? en.desc ?? "")}`;
	return `\t${JSON.stringify(id)}: { image: ${entry.image}, name: ${JSON.stringify(en.name)}, nameFr: ${JSON.stringify(fr?.name ?? en.name)}, kind: "${kind}"${numbers}${en.attribute ? `, attribute: ${JSON.stringify(en.attribute)}` : ""}, race: ${JSON.stringify(en.race ?? "")}, frame: ${JSON.stringify(frame)}${en.banlist_info?.ban_tcg ? `, ban: ${JSON.stringify(en.banlist_info.ban_tcg)}` : ""}${words} },`;
});
await writeFile(
	MODULE,
	`/* Generated by scripts/cards/build-art.mjs from card-art.json. Do not edit by hand: change the list and run \`pnpm --filter academy-ygo cards:art\`. */

/** A card's printed facts (YGOPRODeck), and the id of its picture (the app keeps the pictures). */
export interface CardArtEntry {
	image: number;
	name: string;
	nameFr: string;
	kind: "monster" | "spell" | "trap";
	/** Monsters only: Level (or Link Rating), ATK and DEF as printed. */
	level?: number;
	atk?: number;
	def?: number;
	/** A Monster's Attribute: "LIGHT", "DARK", "EARTH", "WATER", "FIRE", "WIND" or "DIVINE". */
	attribute?: string;
	/** A Monster's Type ("Warrior"), or the icon of a Spell or Trap ("Quick-Play", "Normal"), as YGOPRODeck spells it. */
	race: string;
	/** The card frame: "normal", "effect", "fusion", "ritual", "synchro", "xyz", "link", "spell", "trap". */
	frame: string;
	/** The card's status on the current TCG Forbidden & Limited List, when it is on it: "Forbidden", "Limited" or "Semi-Limited". */
	ban?: string;
	/** The printed text in English and French, except for a Normal Monster (its text is a story). */
	text?: string;
	textFr?: string;
}
export const CARD_ART: Readonly<Record<string, CardArtEntry>> = {
${lines.join("\n")}
};
`,
);

console.log(`wrote ${MODULE}`);
