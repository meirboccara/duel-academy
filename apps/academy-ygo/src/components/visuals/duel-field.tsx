"use client";

import type { CardSpec, FieldArrow, FieldCard, ZoneId, ZoneRef, ZoneSide } from "@/lib/lesson-types";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/provider";
import { EducationalCard } from "@/components/visuals/educational-card";

export interface DuelFieldProps {
	highlight?: ZoneRef[];
	cards?: FieldCard[];
	arrows?: FieldArrow[];
	half?: "both" | "you";
	hand?: CardSpec[];
	labelAll?: boolean;
	linkedZones?: ZoneRef[];
	callout?: string;
	className?: string;
}

const ZONE_LABEL: Record<string, string> = {
	mm1: "Monster 1",
	mm2: "Monster 2",
	mm3: "Monster 3",
	mm4: "Monster 4",
	mm5: "Monster 5",
	st1: "S/T 1",
	st2: "S/T 2",
	st3: "S/T 3",
	st4: "S/T 4",
	st5: "S/T 5",
	field: "Field",
	deck: "Deck",
	graveyard: "Graveyard",
	extra: "Extra Deck",
	"emz-left": "Extra Monster",
	"emz-right": "Extra Monster",
	banished: "Banished",
	hand: "Hand",
};

/** Canonical tile key: Pendulum zones are the outer Spell/Trap zones. */
function canon(zone: ZoneId): ZoneId {
	if (zone === "pz-left") return "st1";
	if (zone === "pz-right") return "st5";
	return zone;
}

const key = (zone: ZoneId, side: ZoneSide | "shared") => `${side}:${canon(zone)}`;

function sideOf(ref: ZoneRef): ZoneSide {
	return ref.side ?? "you";
}

interface Tile {
	zone: ZoneId;
	side: ZoneSide | "shared";
	col: number;
	row: number;
}

/** Build the tile list. Rows depend on whether the opponent half is shown. */
function buildTiles(both: boolean): { tiles: Tile[]; rows: number; rowOf: Record<string, number> } {
	const rowOf = both
		? { oppST: 1, oppMM: 2, emz: 3, youMM: 4, youST: 5, hand: 6 }
		: { oppST: 0, oppMM: 0, emz: 1, youMM: 2, youST: 3, hand: 4 };
	const tiles: Tile[] = [];
	const addHalf = (side: ZoneSide) => {
		const mirror = side === "opponent";
		const c = (col: number) => (mirror ? 8 - col : col);
		const mmRow = side === "you" ? rowOf.youMM : rowOf.oppMM;
		const stRow = side === "you" ? rowOf.youST : rowOf.oppST;
		for (let i = 1; i <= 5; i++) {
			tiles.push({ zone: `mm${i}` as ZoneId, side, col: c(i + 1), row: mmRow });
			tiles.push({ zone: `st${i}` as ZoneId, side, col: c(i + 1), row: stRow });
		}
		tiles.push({ zone: "field", side, col: c(1), row: mmRow });
		tiles.push({ zone: "extra", side, col: c(1), row: stRow });
		tiles.push({ zone: "graveyard", side, col: c(7), row: mmRow });
		tiles.push({ zone: "deck", side, col: c(7), row: stRow });
	};
	addHalf("you");
	if (both) addHalf("opponent");
	tiles.push({ zone: "emz-left", side: "shared", col: 3, row: rowOf.emz });
	tiles.push({ zone: "emz-right", side: "shared", col: 5, row: rowOf.emz });
	tiles.push({ zone: "banished", side: "you", col: 7, row: rowOf.emz });
	if (both) tiles.push({ zone: "banished", side: "opponent", col: 1, row: rowOf.emz });
	const rows = both ? 5 : 3;
	return { tiles, rows, rowOf: rowOf as unknown as Record<string, number> };
}

export function DuelField({
	highlight = [],
	cards = [],
	arrows = [],
	half = "both",
	hand,
	labelAll,
	linkedZones = [],
	callout,
	className,
}: DuelFieldProps) {
	const { t } = useLanguage();
	/* The tile loop below uses `t` for the tile, so keep a second name for translation there. */
	const translate = t;
	const both = half === "both";
	const { tiles, rows } = buildTiles(both);
	const hasHand = Boolean(hand?.length) || highlight.some((h) => h.zone === "hand") || arrows.some((a) => a.from.zone === "hand" || a.to.zone === "hand");
	const totalRows = rows + (hasHand ? 1 : 0);
	const ROW_H = 1.15;
	const hl = new Set(highlight.filter((h) => h.zone !== "hand").map((h) => key(h.zone, h.zone.startsWith("emz") ? "shared" : sideOf(h))));
	const linked = new Set(linkedZones.map((h) => key(h.zone, h.zone.startsWith("emz") ? "shared" : sideOf(h))));
	const handHL = highlight.some((h) => h.zone === "hand");
	const anyFocus = highlight.length > 0;
	const placed = new Map<string, CardSpec>();
	for (const c of cards) placed.set(key(c.zone, c.zone.startsWith("emz") ? "shared" : sideOf(c)), c.card);

	const centre = (ref: ZoneRef): { x: number; y: number } | null => {
		if (ref.zone === "hand") return { x: 3.5, y: (rows + 0.5) * ROW_H };
		const side = ref.zone.startsWith("emz") ? "shared" : sideOf(ref);
		const t = tiles.find((tile) => key(tile.zone, tile.side) === key(ref.zone, side));
		if (!t) return null;
		return { x: t.col - 0.5, y: (t.row - 0.5) * ROW_H };
	};

	const cellStyle = (t: { col: number; row: number }): React.CSSProperties => ({
		gridColumn: t.col,
		gridRow: t.row,
	});

	const summary = `${t("Duel field from above.")} ${both ? t("Both halves shown.") : t("Your half shown.")} ${highlight.length ? `${t("Highlighted:")} ${highlight.map((h) => t(ZONE_LABEL[canon(h.zone)] ?? h.zone)).join(", ")}.` : ""}`;

	return (
		<div dir="ltr" className={cn("relative w-full select-none", className)} role="group" aria-label={summary}>
			{callout && (
				<div className="mx-auto mb-2 w-fit max-w-full rounded-2xl border border-gold-400/70 bg-ink-900/95 px-3 py-1 text-center text-xs font-semibold leading-snug text-gold-400 shadow-lg stage:absolute stage:left-1/2 stage:top-0 stage:z-20 stage:mb-0 stage:-translate-x-1/2 stage:-translate-y-1/2 stage:rounded-full stage:px-4 stage:text-sm">
					{callout}
				</div>
			)}
			<div
				className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-ink-800/80 to-ink-900/90 p-[1.5%] shadow-[0_0_60px_rgba(30,122,232,0.12)]"
			>
				<div
					className="relative grid w-full"
					style={{
						gridTemplateColumns: "repeat(7, 1fr)",
						gridTemplateRows: `repeat(${totalRows}, 1fr)`,
						aspectRatio: `7 / ${totalRows * ROW_H}`,
					}}
				>
					{/* centre divider */}
					{both && (
						<div
							aria-hidden
							className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-arcane-400/50 to-transparent"
							style={{ top: `${(2.5 / totalRows) * 100}%` }}
						/>
					)}
					{tiles.map((t) => {
						const k = key(t.zone, t.side);
						const on = hl.has(k);
						const isLinked = linked.has(k);
						const dim = anyFocus && !on && !isLinked;
						const card = placed.get(k);
						const isP = (t.zone === "st1" || t.zone === "st5") && t.side !== "shared";
						const isEMZ = t.side === "shared";
						const isSt = t.zone.startsWith("st");
						const label = translate(ZONE_LABEL[t.zone] ?? t.zone);
						const showLabel = labelAll || on || isLinked;
						const tint = isEMZ
							? "border-violet-400/70 bg-violet-500/10"
							: t.zone.startsWith("mm")
								? "border-arcane-400/45 bg-arcane-500/10"
								: isSt
									? "border-spell/60 bg-spell/10"
									: "border-white/25 bg-white/5";
						return (
							<div key={k} style={cellStyle(t)} className="min-h-0 min-w-0 p-[3%]">
								<div
									data-zone={t.zone}
									data-side={t.side}
									className={cn(
										"relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md border transition-all duration-300 [container-type:inline-size]",
										tint,
										t.side === "opponent" && "rotate-180",
										on && "z-10 border-gold-400 bg-gold-500/20 shadow-[0_0_18px_rgba(240,196,90,0.55)]",
										isLinked && !on && "border-ember-400 bg-ember-500/15 shadow-[0_0_14px_rgba(255,122,110,0.45)]",
										dim && "opacity-35",
									)}
								>
									{isP && (
										<span aria-hidden className="absolute left-[6%] top-[4%] rounded bg-arcane-500/70 px-[8%] text-[11cqw] font-bold text-white">
											P
										</span>
									)}
									{card ? (
										<EducationalCard
											card={card}
											size="sm"
											decorative
											fontSize={
												card.position === "defense" || card.position === "facedown-defense"
													? "calc(100cqw / 18.8)"
													: "calc(100cqw / 15)"
											}
										/>
									) : (
										showLabel && (
											<span className={cn("px-1 text-center text-[13cqw] font-semibold leading-tight", on ? "text-gold-400" : "text-fg-muted")}>
												{label}
											</span>
										)
									)}
								</div>
							</div>
						);
					})}

					{hasHand && (
						<div
							style={{ gridColumn: "1 / span 7", gridRow: rows + 1 }}
							className={cn(
								"mx-[2%] my-[1%] flex items-center justify-center gap-1 rounded-lg border border-dashed px-1 transition-all stage:mx-[8%] stage:gap-2 stage:px-3",
								handHL ? "border-gold-400 bg-gold-500/15 shadow-[0_0_18px_rgba(240,196,90,0.5)]" : "border-white/20 bg-white/5",
								anyFocus && !handHL && "opacity-40",
							)}
						>
							<span className="mr-2 hidden text-xs font-semibold uppercase tracking-wider text-fg-muted stage:inline">{t("Hand")}</span>
							{hand?.map((c, i) => (
								/* Fluid on phones so a five-card hand stays inside the field. */
								<EducationalCard key={`${c.name}-${i}`} card={c} size="xs" decorative fontSize="min(4.5px, 1.1vw)" />
							))}
						</div>
					)}

					{arrows.length > 0 && (
						<svg
							aria-hidden
							className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
							viewBox={`0 0 7 ${totalRows * ROW_H}`}
						>
							<defs>
								<marker id="field-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
									<path d="M0 0 L10 5 L0 10 z" fill="#f0c45a" />
								</marker>
							</defs>
							{arrows.map((a, i) => {
								const from = centre(a.from);
								const to = centre(a.to);
								if (!from || !to) return null;
								return (
									<g key={i}>
										<line
											x1={from.x}
											y1={from.y}
											x2={to.x}
											y2={to.y}
											stroke="#f0c45a"
											strokeWidth={0.07}
											strokeLinecap="round"
											strokeDasharray="0.2 0.12"
											markerEnd="url(#field-arrowhead)"
										/>
										{a.label && (
											<text
												x={(from.x + to.x) / 2}
												y={(from.y + to.y) / 2 - 0.1}
												textAnchor="middle"
												fontSize={0.26}
												fontWeight={700}
												fill="#f0c45a"
												stroke="#05070f"
												strokeWidth={0.07}
												paintOrder="stroke"
											>
												{a.label}
											</text>
										)}
									</g>
								);
							})}
						</svg>
					)}
				</div>
			</div>
		</div>
	);
}
