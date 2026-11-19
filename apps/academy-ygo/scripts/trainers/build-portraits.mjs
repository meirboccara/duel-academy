/**
 * Builds the island trainers' pictures: `public/trainers/<trainer>-256.webp` and `-512.webp` (height in pixels,
 * transparent background), from the character art of the official anime site, yugioh.com (the owner chose official
 * character art over commissioned drawings; the rights are on record in
 * docs/research/junior-save-slots-character-choice-official-art.md §5.6). Each picture is downloaded once into
 * `.cache/trainers` (not in git), one at a time, and our own copies are made from it: the site never loads a picture
 * from yugioh.com. Run by hand when the list changes: `pnpm --filter academy-ygo trainers:portraits`.
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE = join(APP, ".cache", "trainers");
const OUT = join(APP, "public", "trainers");
const HEIGHTS = [256, 512];
const RIGHT_HALF = new Set(["playmaker"]);
/** Where Playmaker's half of the shared picture starts, as a share of its width. */
const CUT = 0.55;

/** Trainer id (as in src/lib/junior/world/trainers.ts) to the "detail" picture of its yugioh.com character page. */
const SOURCES = {
	"solomon-muto": "https://uploads1.yugioh.com/character/4/detail/detail/solomon-l.png",
	"yugi-muto": "https://uploads3.yugioh.com/character/2/detail/detail/yugi-l.png",
	"yami-yugi": "https://uploads3.yugioh.com/character/3/detail/detail/yamiyugi-l.png",
	"mai-valentine": "https://uploads3.yugioh.com/character/6/detail/detail/mai-l.png",
	"seto-kaiba": "https://uploads4.yugioh.com/character/11/detail/detail/kaib-l.png",
	"joey-wheeler": "https://uploads2.yugioh.com/character/5/detail/detail/joey-l.png",
	"jaden-yuki": "https://uploads4.yugioh.com/character/24/detail/detail/jaden-l.png",
	"yusei-fudo": "https://uploads4.yugioh.com/character/31/detail/detail/yusei-l.png",
	"yuma-tsukumo": "https://uploads3.yugioh.com/character/1/detail/detail/yuma-l.png",
	playmaker: "https://uploads3.yugioh.com/character/504/detail/detail/Yusaku-lrg.png",
	"yuya-sakaki": "https://uploads3.yugioh.com/character/492/detail/detail/character-yuya.png",
	"zane-truesdale": "https://uploads2.yugioh.com/character/26/detail/detail/zane-l.png",
	/* The heads of the dorms that are not on an island already: Ra Yellow and Obelisk Blue (Jaden is Slifer Red's). */
	"bastion-misawa": "https://uploads4.yugioh.com/character/20/detail/detail/bastion-l.png",
	"alexis-rhodes": "https://uploads1.yugioh.com/character/19/detail/detail/alexis-l.png",
};

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
let downloaded = 0;
for (const [id, url] of Object.entries(SOURCES)) {
	const source = join(CACHE, `${id}.png`);
	if (!(await exists(source))) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		const response = await fetch(url, { headers: { "User-Agent": "duel-academy-build/1.0" } });
		if (!response.ok) throw new Error(`${response.status} ${url}`);
		await writeFile(source, Buffer.from(await response.arrayBuffer()));
		downloaded++;
	}
	for (const height of HEIGHTS) {
		const target = join(OUT, `${id}-${height}.webp`);
		if (await exists(target)) continue;
		/* Yusaku and Playmaker share one picture: the trainer is Playmaker, on the right. */
		const meta = await sharp(source).metadata();
		const base = RIGHT_HALF.has(id) ? sharp(await sharp(source).extract({ left: Math.round(meta.width * CUT), top: 0, width: meta.width - Math.round(meta.width * CUT), height: meta.height }).toBuffer()) : sharp(source);
		await base.trim({ threshold: 1 }).resize({ height, withoutEnlargement: false }).webp({ quality: 82, alphaQuality: 90 }).toFile(target);
	}
}
console.log(`trainers: ${downloaded} downloaded, ${Object.keys(SOURCES).length} in the list`);
