import * as THREE from "three";
import { cardArtUrl, type ArtSize } from "@/lib/junior/play/card-pictures";
import type { FaceSpec } from "@/lib/junior/play/board3d-view";
import { cardOf, type CardId } from "@duel-academy/engine";

/**
 * The pictures on the 3D cards, painted on small canvases: the frame in the colour of the card's kind, its name, its
 * official art (our own copies in `public/cards`, the same files the HTML board shows) and the numbers that matter.
 * One picture per different face, made once and shared by every card that shows it; all released with the scene.
 */

const W = 256;
const H = 372;
/* The colours of the frames, as in `globals.css`. */
const FRAME = { monster: "#c9b06a", effect: "#c97a3a", spell: "#2f9e5f", trap: "#c45aa8", ritual: "#4a6ec8", fusion: "#7a4fb0", synchro: "#e8e8ea", xyz: "#1a1a22", link: "#2a6fb8" } as const;
const FONT = '"Source Sans 3", "Heebo", system-ui, sans-serif';

export function frameColor(card: CardId): string {
	const info = cardOf(card);
	if (info.kind !== "monster") return FRAME[info.kind];
	if (info.frame) return FRAME[info.frame];
	return info.ability || info.detach || info.hand || info.special || info.wins ? FRAME.effect : FRAME.monster;
}
export const BACK_COLOR = "#7a4a22";

function rounded(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	context.beginPath();
	context.moveTo(x + r, y);
	context.arcTo(x + w, y, x + w, y + h, r);
	context.arcTo(x + w, y + h, x, y + h, r);
	context.arcTo(x, y + h, x, y, r);
	context.arcTo(x, y, x + w, y, r);
	context.closePath();
}
/** Writes one line as big as fits the width, never bigger than `size`. */
function fitText(context: CanvasRenderingContext2D, text: string, cx: number, cy: number, width: number, size: number, weight = 800) {
	let px = size;
	context.font = `${weight} ${px}px ${FONT}`;
	const wide = context.measureText(text).width;
	if (wide > width) px = Math.max(12, Math.floor((px * width) / wide));
	context.font = `${weight} ${px}px ${FONT}`;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(text, cx, cy);
}

/** The signs printed in the zones of the mat. */
export type ZoneSign = "monsters" | "emz" | "backrow" | "pendulum" | "field" | "graveyard" | "deck" | "extra" | "banished";

export class CardTextures {
	private readonly made = new Map<string, THREE.CanvasTexture>();
	private readonly images = new Map<string, HTMLImageElement | "loading" | "failed">();
	private readonly waiting = new Map<string, Set<() => void>>();
	private gone = false;
	/** `changed` is called when a picture that was still loading has been painted in. */
	constructor(
		private readonly art: ArtSize,
		private readonly changed: () => void,
	) {}

	private texture(key: string, paint: (context: CanvasRenderingContext2D) => void, width = W, height = H): THREE.CanvasTexture {
		const known = this.made.get(key);
		if (known) return known;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = 4;
		const draw = () => {
			const context = canvas.getContext("2d");
			if (!context) return;
			context.clearRect(0, 0, width, height);
			paint(context);
			texture.needsUpdate = true;
		};
		draw();
		this.made.set(key, texture);
		/* Painted again when its art arrives. */
		(texture.userData as { redraw?: () => void }).redraw = draw;
		return texture;
	}

	/** The art of a card if it has arrived; asks for it otherwise and repaints `key` when it does. */
	private image(card: CardId, key: string): HTMLImageElement | null {
		const url = cardArtUrl(card, this.art);
		if (!url) return null;
		const known = this.images.get(url);
		if (known && typeof known !== "string") return known;
		if (known === "failed") return null;
		const again = () => (this.made.get(key)?.userData as { redraw?: () => void } | undefined)?.redraw?.();
		const queue = this.waiting.get(url) ?? new Set();
		queue.add(again);
		this.waiting.set(url, queue);
		if (known === "loading") return null;
		this.images.set(url, "loading");
		const image = new Image();
		image.decoding = "async";
		image.onload = () => {
			if (this.gone) return;
			this.images.set(url, image);
			this.waiting.get(url)?.forEach((redraw) => redraw());
			this.waiting.delete(url);
			this.changed();
		};
		/* A missing picture is not worth an error: the card keeps its emoji. */
		image.onerror = () => {
			this.images.set(url, "failed");
			this.waiting.delete(url);
		};
		image.src = url;
		return null;
	}

	face(spec: FaceSpec): THREE.CanvasTexture {
		const key = `face|${spec.card}|${spec.name}|${spec.line}|${spec.note ?? ""}|${spec.compact ? "c" : ""}`;
		return this.texture(key, (context) => {
			const color = frameColor(spec.card);
			const dark = color === FRAME.xyz;
			const light = color === FRAME.synchro;
			context.fillStyle = color;
			rounded(context, 0, 0, W, H, 18);
			context.fill();
			context.lineWidth = 6;
			context.strokeStyle = dark ? "#f0c45a" : "rgba(0,0,0,0.45)";
			rounded(context, 3, 3, W - 6, H - 6, 16);
			context.stroke();
			/* Name: left out on a compact card, whose picture and number take its room. */
			context.fillStyle = dark ? "#ffffff" : light ? "#121a2e" : "#10131c";
			if (!spec.compact) fitText(context, spec.name, W / 2, 30, W - 28, 28, 700);
			/* Art, in a dark window. */
			const size = spec.compact ? 228 : 212;
			const left = (W - size) / 2;
			const top = spec.compact ? 16 : 52;
			context.fillStyle = "#10131c";
			context.fillRect(left - 4, top - 4, size + 8, size + 8);
			const image = this.image(spec.card, key);
			if (image) context.drawImage(image, left, top, size, size);
			else {
				context.fillStyle = "#273352";
				context.fillRect(left, top, size, size);
				context.fillStyle = "#ffffff";
				fitText(context, cardOf(spec.card).art, W / 2, top + size / 2 + 6, size - 40, 120, 400);
			}
			/* The numbers, big: they are what the child reads from across the mat. */
			context.fillStyle = "rgba(5,7,15,0.88)";
			if (spec.compact) {
				rounded(context, 10, 252, W - 20, 110, 12);
				context.fill();
				context.fillStyle = "#ffffff";
				if (spec.note) {
					fitText(context, spec.line, W / 2, 290, W - 36, 64);
					context.fillStyle = "#f0c45a";
					fitText(context, spec.note, W / 2, 340, W - 44, 30, 700);
				} else fitText(context, spec.line, W / 2, 309, W - 36, 78);
				return;
			}
			rounded(context, 12, 274, W - 24, 86, 12);
			context.fill();
			context.fillStyle = "#ffffff";
			if (spec.note) {
				fitText(context, spec.line, W / 2, 304, W - 44, 46);
				context.fillStyle = "#f0c45a";
				fitText(context, spec.note, W / 2, 342, W - 44, 26, 700);
			} else fitText(context, spec.line, W / 2, 319, W - 44, 58);
		});
	}

	/** A face-down card. The child's own Set card keeps its name on its back, as the HTML board says it. */
	back(name?: string): THREE.CanvasTexture {
		return this.texture(`back|${name ?? ""}`, (context) => {
			context.fillStyle = BACK_COLOR;
			rounded(context, 0, 0, W, H, 18);
			context.fill();
			context.lineWidth = 8;
			context.strokeStyle = "#3a1f0c";
			rounded(context, 14, 14, W - 28, H - 28, 12);
			context.stroke();
			/* A swirl, like the back of a real card. */
			const swirl = context.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, 96);
			swirl.addColorStop(0, "#f0c45a");
			swirl.addColorStop(0.45, "#b8742c");
			swirl.addColorStop(1, "#5a3214");
			context.fillStyle = swirl;
			context.beginPath();
			context.ellipse(W / 2, H / 2, 84, 112, 0, 0, Math.PI * 2);
			context.fill();
			context.fillStyle = "#3a1f0c";
			context.beginPath();
			context.ellipse(W / 2, H / 2, 30, 44, 0.5, 0, Math.PI * 2);
			context.fill();
			if (name) {
				context.fillStyle = "rgba(5,7,15,0.85)";
				rounded(context, 14, H - 92, W - 28, 74, 10);
				context.fill();
				context.fillStyle = "#ffffff";
				fitText(context, name, W / 2, H - 55, W - 48, 36, 700);
			}
		});
	}

	/**
	 * What is printed on the mat in a zone, as on a real playmat: the outline of a card, a sign for the kind of place
	 * and its name. Painted in white; the scene shows it faintly, fainter still for a place the level does not use.
	 */
	zone(kind: ZoneSign, label: string): THREE.CanvasTexture {
		const S = 256;
		return this.texture(
			`zone|${kind}|${label}`,
			(context) => {
				context.strokeStyle = "#ffffff";
				context.fillStyle = "#ffffff";
				context.lineWidth = 5;
				context.lineJoin = "round";
				/* The outline of a card standing in the zone: where the card goes. Piles show two, one behind the other. */
				const w = 112;
				const h = 162;
				const x = (S - w) / 2;
				const y = 18;
				if (kind === "deck" || kind === "extra") {
					rounded(context, x + 10, y - 8, w, h, 10);
					context.stroke();
				}
				if (kind === "banished") context.setLineDash([12, 9]);
				rounded(context, x, y, w, h, 10);
				context.stroke();
				context.setLineDash([]);
				const cx = S / 2;
				const cy = y + h / 2;
				context.lineWidth = 7;
				context.beginPath();
				if (kind === "monsters" || kind === "emz") {
					/* A sword: Monsters fight. An Extra Monster Zone has a plus beside it. */
					context.moveTo(cx - 26, cy + 30);
					context.lineTo(cx + 24, cy - 34);
					context.moveTo(cx - 30, cy + 6);
					context.lineTo(cx - 4, cy + 30);
					if (kind === "emz") {
						context.moveTo(cx + 12, cy + 32);
						context.lineTo(cx + 40, cy + 32);
						context.moveTo(cx + 26, cy + 18);
						context.lineTo(cx + 26, cy + 46);
					}
				} else if (kind === "backrow" || kind === "pendulum") {
					/* A four-pointed spark: Spells and Traps. A Pendulum Zone has a diamond over it. */
					for (let point = 0; point < 4; point++) {
						const angle = (point * Math.PI) / 2;
						context.moveTo(cx, cy + 6);
						context.lineTo(cx + Math.cos(angle) * 30, cy + 6 + Math.sin(angle) * 30);
					}
					if (kind === "pendulum") {
						context.moveTo(cx, y + 12);
						context.lineTo(cx + 14, y + 30);
						context.lineTo(cx, y + 48);
						context.lineTo(cx - 14, y + 30);
						context.closePath();
					}
				} else if (kind === "field") {
					/* Two hills: the Field. */
					context.moveTo(cx - 40, cy + 28);
					context.lineTo(cx - 10, cy - 24);
					context.lineTo(cx + 8, cy + 6);
					context.lineTo(cx + 20, cy - 10);
					context.lineTo(cx + 40, cy + 28);
					context.closePath();
				} else if (kind === "graveyard") {
					/* A headstone. */
					context.moveTo(cx - 24, cy + 34);
					context.lineTo(cx - 24, cy - 8);
					context.arc(cx, cy - 8, 24, Math.PI, 0);
					context.lineTo(cx + 24, cy + 34);
					context.closePath();
				} else if (kind === "banished") {
					/* A swirl: cards that left the game. */
					for (let step = 0; step <= 40; step++) {
						const angle = step * 0.42;
						const radius = 4 + step * 0.85;
						if (step === 0) context.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
						else context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
					}
				} else if (kind === "extra") {
					/* A star: the monsters of the Extra Deck. */
					for (let point = 0; point < 10; point++) {
						const radius = point % 2 === 0 ? 32 : 14;
						const angle = (point / 10) * Math.PI * 2 - Math.PI / 2;
						if (point === 0) context.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
						else context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
					}
					context.closePath();
				}
				context.stroke();
				fitText(context, label, S / 2, S - 34, S - 20, 34, 700);
			},
			S,
			S,
		);
	}

	/** How many cards a pile holds: a number on a dark badge. */
	count(count: number): THREE.CanvasTexture {
		const S = 128;
		return this.texture(
			`count|${count}`,
			(context) => {
				context.fillStyle = "rgba(5,7,15,0.88)";
				rounded(context, 6, 26, S - 12, S - 52, 22);
				context.fill();
				context.strokeStyle = "#f0c45a";
				context.lineWidth = 5;
				rounded(context, 6, 26, S - 12, S - 52, 22);
				context.stroke();
				context.fillStyle = "#ffffff";
				fitText(context, String(count), S / 2, S / 2 + 3, S - 34, 66);
			},
			S,
			S,
		);
	}

	dispose() {
		this.gone = true;
		this.made.forEach((texture) => texture.dispose());
		this.made.clear();
		this.waiting.clear();
	}
}
