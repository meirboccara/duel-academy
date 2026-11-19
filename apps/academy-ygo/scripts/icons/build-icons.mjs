/**
 * Draws the app's own icon (no card art: it sits on a home screen, outside the site) and writes the sizes the web app
 * manifest and iOS need: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, and
 * `src/app/apple-icon.png` (180 px, picked up by Next's file convention). Run `node scripts/icons/build-icons.mjs`.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const INK = "#05070f";
const GOLD = "#ffd84a";

/** A gold card, slightly turned, with a star: the site's colours. `pad` keeps the drawing inside a maskable safe zone. */
const svg = (pad) => {
	const s = 512;
	const inner = s - 2 * pad;
	const w = inner * 0.56;
	const h = w * 1.46;
	const x = (s - w) / 2;
	const y = (s - h) / 2;
	const cx = s / 2;
	const cy = s / 2;
	const r = w * 0.26;
	const star = Array.from({ length: 10 }, (_, i) => {
		const a = (Math.PI / 5) * i - Math.PI / 2;
		const d = i % 2 ? r * 0.45 : r;
		return `${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`;
	}).join(" ");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
	<rect width="${s}" height="${s}" fill="${INK}"/>
	<g transform="rotate(-8 ${cx} ${cy})">
		<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.08}" fill="${GOLD}"/>
		<rect x="${x + w * 0.08}" y="${y + w * 0.08}" width="${w * 0.84}" height="${h - w * 0.16}" rx="${w * 0.05}" fill="none" stroke="${INK}" stroke-width="${w * 0.035}"/>
		<polygon points="${star}" fill="${INK}"/>
	</g>
</svg>`;
};

await mkdir(join(APP, "public", "icons"), { recursive: true });
const write = (pad, size, path) => sharp(Buffer.from(svg(pad))).resize(size, size).png({ compressionLevel: 9 }).toFile(path);
await write(24, 192, join(APP, "public", "icons", "icon-192.png"));
await write(24, 512, join(APP, "public", "icons", "icon-512.png"));
await write(80, 512, join(APP, "public", "icons", "icon-maskable-512.png"));
await write(20, 180, join(APP, "src", "app", "apple-icon.png"));
console.log("icons written");
