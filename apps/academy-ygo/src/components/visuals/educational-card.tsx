"use client";

import type { Attribute, CardKind, CardPart, CardSpec, LinkArrow } from "@/lib/lesson-types";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export type CardSize = "xs" | "sm" | "md" | "lg";

/** Base font size in px: every dimension inside the card is in `em`, so the whole card scales. */
const SIZE_PX: Record<CardSize, number> = { xs: 4.5, sm: 6.5, md: 10, lg: 16 };

interface Frame {
	bg: string;
	ink: string;
	border: string;
	panel: string;
}

const FRAMES: Record<CardKind, Frame> = {
	normal: { bg: "#d9bf72", ink: "#2a2208", border: "#f2dc94", panel: "#efe2b4" },
	effect: { bg: "#c9803f", ink: "#2b1606", border: "#eaa86a", panel: "#ecd2b0" },
	fusion: { bg: "#7d52b5", ink: "#ffffff", border: "#a98ad6", panel: "#e3d8f2" },
	synchro: { bg: "#e9eaee", ink: "#16181f", border: "#ffffff", panel: "#f5f6f9" },
	xyz: { bg: "#1b1b24", ink: "#f2f2f6", border: "#4a4a5c", panel: "#2b2b38" },
	link: { bg: "#2b72ba", ink: "#ffffff", border: "#6fa8e0", panel: "#d6e6f6" },
	ritual: { bg: "#4a6fcb", ink: "#ffffff", border: "#8aa5e6", panel: "#d9e1f6" },
	spell: { bg: "#2f9e61", ink: "#ffffff", border: "#6fcb97", panel: "#d5efdf" },
	trap: { bg: "#c45aa9", ink: "#ffffff", border: "#e592cf", panel: "#f3d7ec" },
	token: { bg: "#7b7f8c", ink: "#ffffff", border: "#aab0bf", panel: "#e1e3e9" },
};

const ATTRIBUTE: Record<Attribute, { abbr: string; color: string }> = {
	DARK: { abbr: "DRK", color: "#6b3fa0" },
	LIGHT: { abbr: "LGT", color: "#d6a82b" },
	EARTH: { abbr: "ERT", color: "#7a5a2e" },
	WATER: { abbr: "WTR", color: "#2a78c9" },
	FIRE: { abbr: "FIR", color: "#d2452e" },
	WIND: { abbr: "WND", color: "#2f9a6e" },
	DIVINE: { abbr: "DIV", color: "#b8862b" },
};

const ARROW_POS: Record<LinkArrow, { left: string; top: string; rotate: number }> = {
	N: { left: "50%", top: "0%", rotate: 0 },
	NE: { left: "100%", top: "0%", rotate: 45 },
	E: { left: "100%", top: "50%", rotate: 90 },
	SE: { left: "100%", top: "100%", rotate: 135 },
	S: { left: "50%", top: "100%", rotate: 180 },
	SW: { left: "0%", top: "100%", rotate: 225 },
	W: { left: "0%", top: "50%", rotate: 270 },
	NW: { left: "0%", top: "0%", rotate: 315 },
};

const SUBTYPE_LABEL: Record<NonNullable<CardSpec["subtype"]>, string> = {
	normal: "",
	continuous: "Continuous",
	equip: "Equip",
	field: "Field",
	"quick-play": "Quick-Play",
	ritual: "Ritual",
	counter: "Counter",
};

const MONSTER_LABEL: Record<CardKind, string> = {
	normal: "normal monster",
	effect: "effect monster",
	fusion: "fusion monster",
	synchro: "synchro monster",
	xyz: "xyz monster",
	link: "link monster",
	ritual: "ritual monster",
	spell: "spell monster",
	trap: "trap monster",
	token: "token monster",
};

export interface EducationalCardProps {
	card: CardSpec;
	size?: CardSize;
	/** Parts to ring with a gold outline (anatomy slides). */
	highlight?: CardPart[];
	/** Numbered markers drawn on parts, matching a label list. */
	markers?: Partial<Record<CardPart, number>>;
	/** Dim every non-highlighted part. */
	focus?: boolean;
	className?: string;
	/** Hide the caption/aria text when a parent already describes the card. */
	decorative?: boolean;
	/** Override base font size (e.g. container-relative `calc(100cqw / 15)`) for fluid cards. */
	fontSize?: string;
}

export function describeCard(card: CardSpec, t: (english: string) => string = (english) => english): string {
	const bits: string[] = [card.name];
	if (card.kind === "spell" || card.kind === "trap") {
		bits.push(`${card.subtype && card.subtype !== "normal" ? `${t(SUBTYPE_LABEL[card.subtype])} ` : ""}${card.kind === "spell" ? t("Spell Card") : t("Trap Card")}`);
	} else {
		bits.push(t(MONSTER_LABEL[card.kind]));
		if (card.level) bits.push(`${t("Level")} ${card.level}`);
		if (card.rank) bits.push(`${t("Rank")} ${card.rank}`);
		if (card.link) bits.push(`${t("Link")} ${card.link}`);
		if (card.attribute) bits.push(t(card.attribute));
		if (card.atk !== undefined) bits.push(`${t("ATK")} ${card.atk}`);
		if (card.def !== undefined && card.kind !== "link") bits.push(`${t("DEF")} ${card.def}`);
	}
	if (card.position === "defense") bits.push(t("in Defense Position"));
	if (card.position === "facedown-defense" || card.position === "facedown-spelltrap") bits.push(t("face-down"));
	return bits.join(", ");
}

function PartRing({
	part,
	highlight,
	markers,
	focus,
	className,
	children,
	style,
}: {
	part: CardPart;
	highlight?: CardPart[];
	markers?: Partial<Record<CardPart, number>>;
	focus?: boolean;
	className?: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}) {
	const on = highlight?.includes(part) ?? false;
	const marker = markers?.[part];
	return (
		<div
			data-part={part}
			style={style}
			className={cn(
				"relative",
				className,
				on && "rounded-[0.3em] outline outline-[0.2em] outline-offset-[0.1em] outline-[#ffd75e]",
				focus && !on && "opacity-35",
			)}
		>
			{children}
			{marker !== undefined && (
				<span
					aria-hidden
					className="absolute -top-[0.9em] -right-[0.9em] z-20 flex h-[2em] w-[2em] items-center justify-center rounded-full bg-[#ffd75e] text-[1.1em] font-bold text-[#15110a] shadow"
				>
					{marker}
				</span>
			)}
		</div>
	);
}

function CardBack({ size }: { size: CardSize }) {
	return (
		<div
			className="absolute inset-0 rounded-[0.8em] border-[0.35em] border-[#8a5a2b]"
			style={{
				background:
					"repeating-linear-gradient(45deg,#3a2615 0 0.6em,#52361d 0.6em 1.2em)",
				boxShadow: "inset 0 0 0 0.25em #1c1209",
			}}
		>
			<div className="absolute inset-[22%] flex items-center justify-center rounded-full border-[0.25em] border-[#d9a86a] bg-[#26180c]">
				<span className={cn("font-display text-[#d9a86a]", size === "xs" ? "text-[2em]" : "text-[3em]")}>?</span>
			</div>
		</div>
	);
}

export function EducationalCard({
	card,
	size = "md",
	highlight,
	markers,
	focus,
	className,
	decorative,
	fontSize,
}: EducationalCardProps) {
	const { t } = useLanguage();
	const px = SIZE_PX[size];
	const frame = FRAMES[card.kind];
	const position = card.position ?? "attack";
	const sideways = position === "defense" || position === "facedown-defense";
	const facedown = position === "facedown-defense" || position === "facedown-spelltrap";
	const isST = card.kind === "spell" || card.kind === "trap";
	const isLink = card.kind === "link";
	const isXyz = card.kind === "xyz";
	const attr = card.attribute ? ATTRIBUTE[card.attribute] : undefined;
	const stars = isXyz ? card.rank : card.level;
	const compact = size === "xs" || size === "sm";
	const subtype = card.subtype && card.subtype !== "normal" ? t(SUBTYPE_LABEL[card.subtype]) : "";

	const wrapW = sideways ? 17.5 : 12;
	const wrapH = sideways ? 12 : 17.5;

	return (
		<figure
			dir="ltr"
			className={cn("relative m-0 inline-block shrink-0 transition-opacity", card.ghost && "opacity-30", className)}
			style={{ fontSize: fontSize ?? `${px}px`, width: `${wrapW}em`, height: `${wrapH}em` }}
			role={decorative ? "presentation" : "img"}
			aria-label={decorative ? undefined : describeCard(card, t)}
		>
			{card.badge && (
				<span className="absolute -top-[1.7em] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ffd75e] px-[0.8em] py-[0.1em] text-[1.1em] font-bold text-[#15110a]">
					{card.badge}
				</span>
			)}
			{card.order !== undefined && (
				<span
					aria-hidden
					className="absolute -top-[1em] -left-[1em] z-30 flex h-[3em] w-[3em] items-center justify-center rounded-full border-[0.2em] border-[#ffd75e] bg-[#0a1020] text-[1.6em] font-bold text-[#ffd75e]"
				>
					{card.order}
				</span>
			)}
			<div
				className="absolute left-1/2 top-1/2 origin-center"
				style={{
					width: "12em",
					height: "17.5em",
					transform: `translate(-50%, -50%) rotate(${sideways ? 90 : 0}deg)`,
				}}
			>
				{facedown ? (
					<CardBack size={size} />
				) : (
					<div
						className="absolute inset-0 flex flex-col overflow-visible rounded-[0.8em] p-[0.7em] shadow-[0_0.4em_1em_rgba(0,0,0,0.55)]"
						style={{
							background: `linear-gradient(160deg, ${frame.border}, ${frame.bg} 28%, ${frame.bg})`,
							color: frame.ink,
							border: `0.25em solid ${frame.border}`,
						}}
					>
						{/* Name row */}
						<PartRing
							part="name"
							highlight={highlight}
							markers={markers}
							focus={focus}
							className="flex items-center justify-between gap-[0.4em] rounded-[0.3em] px-[0.4em] py-[0.25em]"
							style={{ background: `${frame.panel}22` }}
						>
							<span className="min-w-0 flex-1 truncate text-[1.25em] font-bold leading-tight" title={card.name}>
								{card.name}
							</span>
							{attr ? (
								<PartRing part="attribute" highlight={highlight} markers={markers} focus={focus} className="shrink-0">
									<span
										className="flex h-[2.2em] w-[2.2em] items-center justify-center rounded-full border-[0.15em] border-white/70 text-[0.8em] font-bold text-white"
										style={{ background: attr.color }}
									>
										{attr.abbr}
									</span>
								</PartRing>
							) : isST ? (
								<PartRing part="icon" highlight={highlight} markers={markers} focus={focus} className="shrink-0">
									<span className="flex h-[2.2em] w-[2.2em] items-center justify-center rounded-full border-[0.15em] border-white/70 bg-black/30 text-[0.9em] font-bold">
										{card.kind === "spell" ? "S" : "T"}
									</span>
								</PartRing>
							) : null}
						</PartRing>

						{/* Level / Rank / Link row */}
						{!isST && (
							<PartRing
								part="level"
								highlight={highlight}
								markers={markers}
								focus={focus}
								className={cn("mt-[0.3em] flex min-h-[1.6em] items-center gap-[0.1em] px-[0.3em] text-[1.1em] leading-none", isXyz ? "justify-start" : "justify-end")}
							>
								{isLink ? (
									<span className="font-bold tracking-wide">LINK-{card.link ?? 1}</span>
								) : (
									Array.from({ length: Math.min(stars ?? 0, 12) }).map((_, i) => (
										<span key={i} aria-hidden style={{ color: isXyz ? "#f2f2f6" : "#e5342a" }}>
											★
										</span>
									))
								)}
							</PartRing>
						)}
						{isST && (
							<PartRing
								part="type"
								highlight={highlight}
								markers={markers}
								focus={focus}
								className="mt-[0.3em] px-[0.3em] text-right text-[1em] font-bold uppercase tracking-wider"
							>
								{card.kind === "spell" ? t("Spell Card") : t("Trap Card")}
								{subtype ? ` · ${subtype}` : ""}
							</PartRing>
						)}

						{/* Art box with pendulum scales and link arrows */}
						<PartRing part="art" highlight={highlight} markers={markers} focus={focus} className="relative mt-[0.2em] mx-[0.3em]">
							<div
								className={cn(
									"relative flex items-center justify-center border-[0.2em] border-black/40",
									card.pendulum ? "h-[6.2em]" : "h-[7em]",
								)}
								style={{ background: "linear-gradient(135deg,#1c2640,#3a4a78 55%,#1c2640)" }}
							>
								<span aria-hidden className="select-none text-[2.4em] font-display text-white/25">
									{card.kind === "spell" ? "✦" : card.kind === "trap" ? "◈" : "◆"}
								</span>
								{card.pendulum && (
									<>
										<span className="absolute bottom-0 left-0 flex w-[1.8em] flex-col items-center bg-[#2a78c9] text-[1em] font-bold text-white">
											◄<span>{card.pendulum.left}</span>
										</span>
										<span className="absolute bottom-0 right-0 flex w-[1.8em] flex-col items-center bg-[#d2452e] text-[1em] font-bold text-white">
											►<span>{card.pendulum.right}</span>
										</span>
									</>
								)}
							</div>
							{isLink && card.arrows && (
								<PartRing part="arrows" highlight={highlight} markers={markers} focus={focus} className="pointer-events-none absolute inset-0">
									{card.arrows.map((a) => {
										const p = ARROW_POS[a];
										return (
											<span
												key={a}
												aria-hidden
												className="absolute flex h-[1.6em] w-[1.6em] items-center justify-center text-[1.1em] text-[#ff3b2f]"
												style={{
													left: p.left,
													top: p.top,
													transform: `translate(-50%,-50%) rotate(${p.rotate}deg)`,
													textShadow: "0 0 0.3em #fff",
												}}
											>
												▲
											</span>
										);
									})}
								</PartRing>
							)}
						</PartRing>

						{/* Type line + text */}
						<div className="mx-[0.3em] mt-[0.3em] flex flex-1 flex-col overflow-hidden rounded-[0.3em] p-[0.4em]" style={{ background: frame.panel, color: "#15110a" }}>
							{!isST && card.monsterType && (
								<PartRing part="type" highlight={highlight} markers={markers} focus={focus} className="text-[0.85em] font-bold leading-tight">
									[{card.monsterType}]
								</PartRing>
							)}
							{(card.text || card.pendulum?.text) && (
								<PartRing part="effect" highlight={highlight} markers={markers} focus={focus} className="mt-[0.2em] flex-1 overflow-hidden text-[0.8em] leading-tight">
									{card.pendulum?.text && <span className="block font-semibold">{card.pendulum.text}</span>}
									{card.text}
								</PartRing>
							)}
						</div>

						{/* ATK / DEF */}
						{!isST && (card.atk !== undefined || card.def !== undefined) && (
							<div className="mt-[0.3em] flex items-center justify-end gap-[0.8em] px-[0.4em] text-[1em] font-bold">
								{card.atk !== undefined && (
									<PartRing part="atk" highlight={highlight} markers={markers} focus={focus}>
										{t("ATK")}/{card.atk}
									</PartRing>
								)}
								{!isLink && card.def !== undefined && (
									<PartRing part="def" highlight={highlight} markers={markers} focus={focus}>
										{t("DEF")}/{card.def}
									</PartRing>
								)}
							</div>
						)}
						{card.pendulum && !compact && (
							<span className="absolute -bottom-[1.5em] left-0 right-0 text-center text-[0.9em] text-white/70" aria-hidden>
								{t("Scales")} {card.pendulum.left} / {card.pendulum.right}
							</span>
						)}
					</div>
				)}
			</div>
			{/* Scale highlight marker (placed on card, outside inner rotated frame) */}
			{highlight?.includes("scale") && card.pendulum && (
				<span
					data-part="scale"
					className="absolute bottom-[3.2em] left-[1em] right-[1em] h-[2em] rounded outline outline-[0.2em] outline-[#ffd75e]"
					aria-hidden
				/>
			)}
			{markers?.scale !== undefined && (
				<span aria-hidden className="absolute bottom-[3em] right-[-0.2em] z-20 flex h-[2em] w-[2em] items-center justify-center rounded-full bg-[#ffd75e] text-[1.1em] font-bold text-[#15110a]">
					{markers.scale}
				</span>
			)}
			{markers?.frame !== undefined && (
				<span aria-hidden className="absolute -left-[0.9em] top-1/2 z-20 flex h-[2em] w-[2em] items-center justify-center rounded-full bg-[#ffd75e] text-[1.1em] font-bold text-[#15110a]">
					{markers.frame}
				</span>
			)}
		</figure>
	);
}
