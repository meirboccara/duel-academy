"use client";

import { animate, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cardArtUrl } from "@/lib/junior/play/card-art";
import { CARDS, cardOf, monsterOf, tributesFor, type CardId } from "@/lib/junior/play/cards";
import { PLAY_COPY, type PlayCopy } from "@/lib/junior/play/copy";
import { EXTRA_ZONE, PHASES, START_LP, atkOf, defOf, mainZones, type Board, type GameEvent, type Phase, type Row, type Side } from "@/lib/junior/play/engine";
import type { PhaseBar as PhaseBarKind } from "@/lib/junior/play/levels";

const KIND_FRAME = { monster: "border-normal-monster bg-normal-monster/15", spell: "border-spell bg-spell/15", trap: "border-trap bg-trap/15" } as const;
/** Ritual Monsters are blue, Fusion purple, Synchro white, Xyz black and Link dark blue. */
const SPECIAL_FRAME = { ritual: "border-ritual bg-ritual/20", fusion: "border-fusion bg-fusion/20", synchro: "border-synchro bg-synchro/15", xyz: "border-white/60 bg-xyz", link: "border-link bg-link/25" } as const;
export const zoneKey = (side: Side, row: Row, zone: number) => `${side}-${row}-${zone}`;
/** The piles beside the zones: a tap opens them. */
export type Pile = "graveyard" | "extra" | "banished";
export const pileKey = (side: Side, pile: Pile) => `${side}-${pile}`;
/** Numbers and sums read left to right in every language. */
const Ltr = ({ children, className }: { children: React.ReactNode; className?: string }) => (
	<bdi dir="ltr" className={className}>
		{children}
	</bdi>
);

interface CardFaceProps {
	card: CardId;
	copy: PlayCopy;
	/** Current ATK and DEF when they differ from the printed ones. */
	atk?: number;
	def?: number;
	/** Hand cards show the effect text and the Tributes a Summon costs. */
	full?: boolean;
	/** In Defense Position the DEF is the number that counts. */
	defending?: boolean;
	/** On the whole mat a zone only fits the picture and the numbers; the name is in the zone's label. */
	compact?: boolean;
	/** How many Xyz Materials lie under it. */
	materials?: number;
}
/** A card's text as printed on it: in English when the cards are not printed in this language (Hebrew). */
export function printedText(copy: PlayCopy, card: CardId): string | undefined {
	return copy.englishCards ? PLAY_COPY.en.cards[card].text : copy.cards[card].text;
}
/** The words beside a monster's Type: what kind of monster it is. */
function typeLine(copy: PlayCopy, card: CardId): string {
	const info = monsterOf(card);
	return [info.type ? copy.types[info.type] : "", info.frame ? copy.frames[info.frame] : "", info.tuner ? copy.tuner : ""].filter(Boolean).join(" / ");
}
/** Level, Rank or Link Rating: an Xyz Monster has a Rank instead of a Level, a Link Monster has neither. */
function gradeOf(copy: PlayCopy, card: CardId): { label: string; value: number } {
	const info = monsterOf(card);
	return info.link ? { label: copy.linkRating, value: info.link } : info.rank ? { label: copy.rank, value: info.rank } : { label: copy.level, value: info.level };
}
const hasEffect = (card: CardId) => {
	const info = monsterOf(card);
	return !!(info.ability || info.detach || info.hand || info.special || info.wins);
};
const isQuick = (card: CardId) => monsterOf(card).ability?.quick === true || !!monsterOf(card).hand;
/** What a screen reader hears for a monster on the field. */
function monsterLabel(copy: PlayCopy, board: Board, slot: NonNullable<Board["you"]["monsters"][number]>): string {
	const info = monsterOf(slot.card);
	const grade = gradeOf(copy, slot.card);
	return [
		copy.cards[slot.card].name,
		`${copy.atk} ${atkOf(slot, board)}`,
		info.link ? `${grade.label} ${grade.value}` : `${copy.def} ${defOf(slot, board)}`,
		slot.position === "defense" ? copy.inDefense : "",
		slot.materials ? copy.materials(slot.materials.length) : "",
		hasEffect(slot.card) ? `${copy.hasEffect}${isQuick(slot.card) ? ` (${copy.quickMark})` : ""}` : "",
	]
		.filter(Boolean)
		.join(", ");
}

/**
 * A card's picture: the official cropped art (our own copy, in `public/cards`) when the card has it, else its emoji.
 * Decorative: the name is always written next to it.
 */
export function CardArt({ card, size, emojiClass }: { card: string; size: "compact" | "face" | "large"; emojiClass?: string }) {
	const small = cardArtUrl(card, 160);
	if (!small) {
		const art = (CARDS as Record<string, { art: string }>)[card]?.art ?? "🃏";
		return (
			<span aria-hidden className={emojiClass ?? "text-2xl leading-none"}>
				{art}
			</span>
		);
	}
	const box = size === "compact" ? "h-6 w-6 rounded-sm" : size === "face" ? "aspect-square w-3/5 max-w-16 rounded" : "aspect-square w-full rounded-md";
	return <img src={size === "large" ? cardArtUrl(card, 480)! : small} srcSet={`${small} 160w, ${cardArtUrl(card, 480)} 480w`} sizes={size === "large" ? "(max-width: 640px) 80vw, 320px" : "64px"} width={size === "large" ? 480 : 160} height={size === "large" ? 480 : 160} alt="" loading="lazy" decoding="async" draggable={false} className={`shrink-0 object-cover ${box}`} />;
}

/** One card in the app's own frame: a picture, its name, and the numbers that matter. */
export function CardFace({ card, copy, atk, def, full, defending, compact, materials }: CardFaceProps) {
	const info = cardOf(card);
	const text = copy.cards[card];
	const printed = printedText(copy, card);
	const tributes = info.kind === "monster" ? tributesFor(info.level) : 0;
	const mark = info.kind === "monster" && hasEffect(card) ? (isQuick(card) ? "⚡" : "✦") : "";
	const frame = info.kind === "monster" && info.frame ? SPECIAL_FRAME[info.frame] : KIND_FRAME[info.kind];
	if (compact) {
		return (
			<span className={`flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md border-2 px-0.5 py-0.5 text-center ${frame}`}>
				<CardArt card={card} size="compact" emojiClass="text-base leading-none" />
				{info.kind === "monster" && (
					<Ltr className="text-[10px] font-bold leading-tight text-fg">{defending ? `${copy.def} ${def ?? info.def}` : (atk ?? info.atk)}</Ltr>
				)}
				{info.kind === "monster" && info.scale !== undefined && materials === undefined && <Ltr className="text-[9px] leading-none text-gold-400">◈{info.scale}</Ltr>}
				{materials !== undefined && (
					<span aria-hidden className="text-[9px] leading-none text-gold-400">
						{"▬".repeat(materials) || "∅"}
					</span>
				)}
			</span>
		);
	}
	const grade = info.kind === "monster" ? gradeOf(copy, card) : null;
	const line = info.kind === "monster" ? typeLine(copy, card) : "";
	return (
		<span className={`flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border-2 px-1 py-1 text-center ${frame}`}>
			<CardArt card={card} size="face" />
			<span dir="auto" lang={copy.englishCards ? "en" : undefined} className="text-xs font-semibold leading-tight text-fg">
				{text.name}
				{mark && <span aria-hidden> {mark}</span>}
			</span>
			{info.kind === "monster" && grade ? (
				<>
					{full && (
						<Ltr className="text-[11px] leading-tight text-gold-400">
							<span aria-hidden>{info.link ? `🔗${info.link}` : "★".repeat(Math.min(grade.value, 8))}</span>
							<span className="sr-only">
								{grade.label} {grade.value}
							</span>
							{(info.rank || info.link) && (
								<span aria-hidden>
									{" "}
									{grade.label} {grade.value}
								</span>
							)}
						</Ltr>
					)}
					{full && line && <span className="text-[11px] font-semibold leading-tight text-fg-muted">{line}</span>}
					{full && info.scale !== undefined && (
						<Ltr className="text-[11px] font-semibold leading-tight text-gold-400">
							{copy.scale} {info.scale}
						</Ltr>
					)}
					<Ltr className={`text-xs font-bold leading-tight ${defending ? "text-fg-muted" : "text-fg"}`}>
						{copy.atk} {atk ?? info.atk}
					</Ltr>
					{!info.link && (
						<Ltr className={`text-xs font-bold leading-tight ${defending ? "text-fg" : "text-fg-muted"}`}>
							{copy.def} {def ?? info.def}
						</Ltr>
					)}
					{full && tributes > 0 && (
						<span aria-hidden className="text-xs leading-none">
							{"🐾".repeat(tributes)}
						</span>
					)}
				</>
			) : (
				<span className="text-[11px] font-semibold uppercase leading-tight text-fg-muted">{info.kind !== "monster" && info.icon ? copy.icons[info.icon] : copy.kinds[info.kind]}</span>
			)}
			{full && printed && (
				<span dir={copy.englishCards ? "ltr" : undefined} lang={copy.englishCards ? "en" : undefined} className="whitespace-pre-line text-[11px] leading-snug text-fg">
					{printed}
				</span>
			)}
		</span>
	);
}

/** Life Points counted from one number to another while an effect plays: where from, and after how many seconds. */
export type LpCount = { from: number; delay: number };
/** ATK and DEF a monster keeps showing while an effect plays, until the moment the change is shown, in seconds. */
export type StatHold = { atk: number; def: number; delay: number };
/** A card on the field that keeps its old numbers until the effect that changes them is shown. */
function HeldFace({ hold, playId, atk, def, ...face }: CardFaceProps & { atk: number; def: number; hold?: StatHold | undefined; playId?: number | undefined }) {
	const [shown, setShown] = useState<number | undefined>(undefined);
	useEffect(() => {
		if (!hold) return;
		const timer = setTimeout(() => setShown(playId), hold.delay * 1000);
		return () => clearTimeout(timer);
	}, [hold, playId]);
	const held = !!hold && shown !== playId;
	return <CardFace {...face} atk={held ? hold.atk : atk} def={held ? hold.def : def} />;
}
/** Life Points as a lantern that drains. The number is always there in words. */
function Lantern({ side, lp, copy, moving, count, playId }: { side: Side; lp: number; copy: PlayCopy; moving: boolean; count?: LpCount | undefined; playId?: number | undefined }) {
	const counting = moving && !!count && count.from !== lp;
	const from = count?.from ?? lp;
	const delay = count?.delay ?? 0;
	const [tick, setTick] = useState<{ id: number | undefined; value: number } | null>(null);
	useEffect(() => {
		if (!counting) return;
		const controls = animate(from, lp, { duration: 0.7, delay, ease: "easeOut", onUpdate: (value) => setTick({ id: playId, value: Math.round(value / 10) * 10 }) });
		return () => controls.stop();
	}, [counting, from, lp, delay, playId]);
	/* The number on show: the real one, or while an effect plays the one the count has reached. */
	const shown = !counting ? lp : tick && tick.id === playId ? tick.value : from;
	const share = Math.max(0, Math.min(100, (shown / START_LP) * 100));
	return (
		<div data-spot={`${side}-lantern`} className="flex items-center gap-2">
			<span aria-hidden className={`text-2xl ${shown === 0 ? "opacity-30 grayscale" : ""}`}>
				🏮
			</span>
			<div className="min-w-0 flex-1">
				{shown === lp ? (
					<p className="text-sm font-semibold text-fg">{copy.lifePoints(side, lp)}</p>
				) : (
					<>
						<p aria-hidden className="text-sm font-semibold text-fg">
							{copy.lifePoints(side, shown)}
						</p>
						<p className="sr-only">{copy.lifePoints(side, lp)}</p>
					</>
				)}
				<div className="h-2 overflow-hidden rounded-full bg-ink-700" dir="ltr">
					<div className={`h-full rounded-full ${side === "you" ? "bg-arcane-400" : "bg-ember-400"} ${moving && !counting ? "transition-[width] duration-700" : ""}`} style={{ width: `${share}%` }} />
				</div>
			</div>
		</div>
	);
}

interface MiniBoardProps {
	board: Board;
	copy: PlayCopy;
	moving: boolean;
	/** Zones and piles that would accept what the child is holding. */
	glow?: ReadonlySet<string>;
	/** Zones already chosen (the attacker, the Tributes, the materials). */
	chosen?: ReadonlySet<string>;
	/** Missing in a demonstration: the board is then only shown. */
	onZone?: (side: Side, row: Row, zone: number) => void;
	/** A tap on a Graveyard, the banished cards or the child's own Extra Deck. */
	onPile?: (side: Side, pile: Pile) => void;
	/** Monster Zones a card lands in while an effect plays: it appears after this many seconds. */
	landing?: ReadonlyMap<string, number> | undefined;
	/** Life Points that count up or down while an effect plays. */
	counting?: Partial<Record<Side, LpCount>> | undefined;
	/** Changes with every move, so a count starts again. */
	playId?: number | undefined;
	/** Monsters whose ATK or DEF change while an effect plays. */
	holding?: ReadonlyMap<string, StatHold> | undefined;
}
/**
 * The duel board. The rival's rows are on top and the child's below, in every language:
 * a side is defined by the game, not by the reading direction.
 */
export function MiniBoard(props: MiniBoardProps) {
	return props.board.full ? <FullMat {...props} /> : <SmallBoard {...props} />;
}

function SmallBoard({ board, copy, moving, glow, chosen, onZone, landing, counting, playId, holding }: MiniBoardProps) {
	const zones = Array.from({ length: mainZones(board) }, (_, zone) => zone);
	const cell = (side: Side, row: "monsters" | "backrow", zone: number) => {
		const key = zoneKey(side, row, zone);
		const monster = row === "monsters" ? board[side].monsters[zone] : null;
		const back = row === "backrow" ? board[side].backrow[zone] : null;
		const zoneName = row === "monsters" ? copy.monsterZone(side, zone + 1) : copy.backZone(side, zone + 1);
		const content = monster ? monsterLabel(copy, board, monster) : back ? (side === "you" ? `${copy.cards[back.card].name}, ${copy.faceDown}` : copy.faceDown) : copy.empty;
		const ring = chosen?.has(key) ? "border-arcane-400 bg-arcane-500/20" : glow?.has(key) ? "border-gold-400 bg-gold-400/15" : "border-white/20 bg-surface-raised";
		const inside = monster ? (
			<motion.span key={monster.card} layout={moving} initial={moving ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1, rotate: monster.position === "defense" ? 90 : 0 }} transition={{ delay: landing?.get(key) ?? 0 }} className="block h-24 w-20">
				<HeldFace hold={holding?.get(key)} playId={playId} card={monster.card} copy={copy} atk={atkOf(monster, board)} def={defOf(monster, board)} defending={monster.position === "defense"} />
			</motion.span>
		) : back ? (
			<motion.span initial={moving ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border-2 border-trap bg-ink-700 px-1 text-center">
				<span aria-hidden className="text-xl">
					🦎
				</span>
				{side === "you" && <span className="px-0.5 text-[11px] leading-tight text-fg-muted">{copy.cards[back.card].name}</span>}
			</motion.span>
		) : null;
		/* Spell & Trap rows are low so board and hand fit one phone screen. The rival only ever has a Trap Set from the start of a level, so its row is a thin strip that grows when it holds one. */
		const className = `flex ${row === "monsters" ? "min-h-26" : side === "rival" ? "min-h-8" : "min-h-14"} items-center justify-center rounded-xl border-2 p-1 ${ring}`;
		/* Nothing can be done with the rival's Spell & Trap row: it is shown, not offered as a control. */
		if (!onZone || (side === "rival" && row === "backrow")) {
			return (
				<div key={key} role="img" aria-label={`${zoneName}: ${content}`} data-spot={key} className={className}>
					{inside}
				</div>
			);
		}
		return (
			<button key={key} type="button" aria-label={`${zoneName}: ${content}`} data-zone={key} data-spot={key} onClick={() => onZone(side, row, zone)} className={`${className} hover:border-gold-400`}>
				{inside}
			</button>
		);
	};
	const row = (side: Side, kind: "monsters" | "backrow") => <div className="grid grid-cols-3 gap-2">{zones.map((zone) => cell(side, kind, zone))}</div>;
	return (
		<div role="group" aria-label={copy.board} dir="ltr" className="mx-auto max-w-md space-y-2 rounded-2xl border border-white/10 bg-surface/70 p-3">
			<div dir="auto">
				<Lantern side="rival" lp={board.rival.lp} copy={copy} moving={moving} count={counting?.rival} playId={playId} />
			</div>
			{row("rival", "backrow")}
			{row("rival", "monsters")}
			<hr className="border-white/15" />
			{row("you", "monsters")}
			{row("you", "backrow")}
			<div dir="auto">
				<Lantern side="you" lp={board.you.lp} copy={copy} moving={moving} count={counting?.you} playId={playId} />
			</div>
			<p dir="auto" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
				{board.you.deck.length > 0 && <span>{copy.deck(board.you.deck.length)}</span>}
				<span>{copy.graveyard("you", board.you.graveyard.length)}</span>
				<span>{copy.graveyard("rival", board.rival.graveyard.length)}</span>
			</p>
		</div>
	);
}

/**
 * The whole mat: for each player five Main Monster Zones with the Field Zone and the Graveyard beside them,
 * five Spell & Trap Zones with the Extra Deck and the Deck beside them, and between the players the Extra
 * Monster Zones and the banished cards. A zone shows the picture and the number; its label says the rest.
 */
function FullMat({ board, copy, moving, glow, chosen, onZone, onPile, landing, counting, playId, holding }: MiniBoardProps) {
	const zones = Array.from({ length: mainZones(board) }, (_, zone) => zone);
	const ringOf = (key: string) => (chosen?.has(key) ? "border-arcane-400 bg-arcane-500/20" : glow?.has(key) ? "border-gold-400 bg-gold-400/15" : "border-white/20 bg-surface-raised");
	const box = "flex min-h-14 min-w-0 items-center justify-center rounded-lg border-2 p-0.5";
	const zone = (side: Side, row: Row, at: number, label: string, content: string, inside: React.ReactNode, active = true) => {
		const key = zoneKey(side, row, at);
		const name = `${label}: ${content}`;
		if (!onZone || !active) {
			return (
				<div key={key} role="img" aria-label={name} data-spot={key} className={`${box} ${ringOf(key)}`}>
					{inside}
				</div>
			);
		}
		return (
			<button key={key} type="button" aria-label={name} data-zone={key} data-spot={key} onClick={() => onZone(side, row, at)} className={`${box} ${ringOf(key)} hover:border-gold-400`}>
				{inside}
			</button>
		);
	};
	const monster = (side: Side, at: number) => {
		const slot = board[side].monsters[at];
		const label = at === EXTRA_ZONE ? copy.extraMonsterZone(side) : copy.mainZone(side, at + 1);
		const inside = slot ? (
			<motion.span key={slot.card} layout={moving} initial={moving ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1, rotate: slot.position === "defense" ? 90 : 0 }} transition={{ delay: landing?.get(zoneKey(side, "monsters", at)) ?? 0 }} className="block h-12 w-full max-w-11">
				<HeldFace hold={holding?.get(zoneKey(side, "monsters", at))} playId={playId} card={slot.card} copy={copy} atk={atkOf(slot, board)} def={defOf(slot, board)} defending={slot.position === "defense"} compact {...(slot.materials ? { materials: slot.materials.length } : {})} />
			</motion.span>
		) : at === EXTRA_ZONE ? (
			<span aria-hidden className="text-xs text-fg-muted">
				✚
			</span>
		) : null;
		return zone(side, "monsters", at, label, slot ? monsterLabel(copy, board, slot) : copy.empty, inside);
	};
	const back = (side: Side, at: number) => {
		const slot = board[side].backrow[at];
		/* The leftmost and rightmost Spell & Trap Zones are the Pendulum Zones while a Pendulum Monster is there. */
		const label = slot?.up ? copy.pendulumZone(side, at === 0 ? 1 : 2) : copy.backZone(side, at + 1);
		const content = !slot ? copy.empty : slot.up ? `${copy.cards[slot.card].name}, ${copy.faceUp}, ${copy.scale} ${monsterOf(slot.card).scale ?? 0}` : side === "you" ? `${copy.cards[slot.card].name}, ${copy.faceDown}` : copy.faceDown;
		const inside = !slot ? null : slot.up ? (
			<span className="block h-12 w-full max-w-11">
				<CardFace card={slot.card} copy={copy} compact />
			</span>
		) : (
			<motion.span initial={moving ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} className="flex h-10 w-full max-w-11 items-center justify-center rounded-md border-2 border-trap bg-ink-700">
				<span aria-hidden className="text-lg">
					🦎
				</span>
			</motion.span>
		);
		/* Nothing can be done with the rival's Spell & Trap row: it is shown, not offered as a control. */
		return zone(side, "backrow", at, label, content, inside, side === "you");
	};
	const field = (side: Side) => {
		const card = board[side].field;
		const inside = card ? (
			<span className="block h-12 w-full max-w-11">
				<CardFace card={card} copy={copy} compact />
			</span>
		) : (
			<span aria-hidden className="text-xs text-fg-muted">
				⛰
			</span>
		);
		return zone(side, "field", 0, copy.fieldZone(side), card ? `${copy.cards[card].name}, ${copy.faceUp}` : copy.empty, inside, side === "you");
	};
	const pile = (side: Side, kind: Pile, icon: string, label: string, count: number, open: boolean) => {
		const key = pileKey(side, kind);
		const inside = (
			<span aria-hidden className="flex flex-col items-center leading-none">
				<span className="text-base">{icon}</span>
				<Ltr className="text-[11px] font-bold text-fg">{count}</Ltr>
			</span>
		);
		if (!onPile || !open) {
			return (
				<div key={key} role="img" aria-label={label} data-spot={key} className={`${box} ${ringOf(key)}`}>
					{inside}
				</div>
			);
		}
		return (
			<button key={key} type="button" aria-label={label} data-pile={key} data-spot={key} onClick={() => onPile(side, kind)} className={`${box} ${ringOf(key)} hover:border-gold-400`}>
				{inside}
			</button>
		);
	};
	const deck = (side: Side) => (
		<div key={`${side}-deck`} role="img" aria-label={side === "you" ? copy.deck(board.you.deck.length) : undefined} aria-hidden={side === "rival" ? true : undefined} data-spot={`${side}-deck`} className={`${box} border-white/20 bg-surface-raised`}>
			<span aria-hidden className="flex flex-col items-center leading-none">
				<span className="text-base">🂠</span>
				<Ltr className="text-[11px] font-bold text-fg">{board[side].deck.length}</Ltr>
			</span>
		</div>
	);
	const graveyard = (side: Side) => pile(side, "graveyard", "🪦", copy.graveyard(side, board[side].graveyard.length), board[side].graveyard.length, true);
	/* The Extra Deck is face-down: its owner may look through it, the opponent may not. */
	const extra = (side: Side) => pile(side, "extra", "🎴", copy.extraDeck(side, board[side].extra.length + board[side].extraUp.length), board[side].extra.length + board[side].extraUp.length, side === "you");
	const banished = (side: Side) => pile(side, "banished", "🌀", copy.banished(side, board[side].banished.length), board[side].banished.length, true);
	const blank = (key: string) => <span key={key} aria-hidden />;
	const line = (cells: React.ReactNode[]) => <div className="grid grid-cols-7 gap-1">{cells}</div>;
	return (
		<div role="group" aria-label={copy.board} dir="ltr" className="mx-auto max-w-xl space-y-1 rounded-2xl border border-white/10 bg-surface/70 p-2">
			<div dir="auto">
				<Lantern side="rival" lp={board.rival.lp} copy={copy} moving={moving} count={counting?.rival} playId={playId} />
			</div>
			{line([extra("rival"), ...zones.map((at) => back("rival", at)), deck("rival")])}
			{line([field("rival"), ...zones.map((at) => monster("rival", at)), graveyard("rival")])}
			{line([banished("rival"), blank("a"), monster("you", EXTRA_ZONE), blank("b"), monster("rival", EXTRA_ZONE), blank("c"), banished("you")])}
			{line([field("you"), ...zones.map((at) => monster("you", at)), graveyard("you")])}
			{line([extra("you"), ...zones.map((at) => back("you", at)), deck("you")])}
			<div dir="auto">
				<Lantern side="you" lp={board.you.lp} copy={copy} moving={moving} count={counting?.you} playId={playId} />
			</div>
			{/* What each small picture on the mat stands for, with the child's own counts. */}
			<p dir="auto" aria-hidden className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] leading-snug text-fg-muted">
				{[`⛰ ${copy.fieldZone("you")}`, `✚ ${copy.extraMonsterZone("you")}`, `🪦 ${copy.graveyard("you", board.you.graveyard.length)}`, `🌀 ${copy.banished("you", board.you.banished.length)}`, `🎴 ${copy.extraDeck("you", board.you.extra.length + board.you.extraUp.length)}`, `🂠 ${copy.deck(board.you.deck.length)}`].map((item) => (
					<span key={item}>{item}</span>
				))}
			</p>
		</div>
	);
}

interface PileViewerProps {
	title: string;
	copy: PlayCopy;
	/** The cards of the pile, in order. A face-down card is counted, not shown. */
	cards: readonly { card: CardId; faceDown?: boolean; faceUp?: boolean }[];
	/** Cards that can be tapped now. */
	pickable?: (index: number) => boolean;
	onPick?: (index: number) => void;
	onClose: () => void;
}
/** A Graveyard, the banished cards or the Extra Deck, opened to look through: every card with its text. */
export function PileViewer({ title, copy, cards, pickable, onPick, onClose }: PileViewerProps) {
	const hidden = cards.filter((item) => item.faceDown).length;
	const shown = cards.map((item, index) => ({ ...item, index })).filter((item) => !item.faceDown);
	return (
		<section aria-label={title} data-pile-viewer className="mx-auto max-w-xl space-y-2 rounded-xl border-2 border-arcane-400 bg-ink-800 p-3">
			<h3 className="font-semibold text-gold-400">{title}</h3>
			{cards.length === 0 && <p className="text-fg-muted">{copy.pileEmpty}</p>}
			{hidden > 0 && <p className="text-fg">{copy.faceDownCards(hidden)}</p>}
			{shown.length > 0 && (
				<ul className="flex flex-wrap gap-2">
					{shown.map((item) => {
						const face = <CardFace card={item.card} copy={copy} full />;
						const tag = item.faceUp ? <span className="block text-center text-[11px] font-semibold text-gold-400">{copy.faceUp}</span> : null;
						return (
							<li key={`${item.card}-${item.index}`} className="w-28">
								{onPick && (pickable?.(item.index) ?? true) ? (
									<button type="button" onClick={() => onPick(item.index)} className="block min-h-28 w-full rounded-xl border-2 border-gold-400 p-0.5">
										{face}
										{tag}
									</button>
								) : (
									<div role="img" aria-label={copy.cards[item.card].name} className="min-h-28 w-full rounded-xl border-2 border-transparent p-0.5">
										{face}
										{tag}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
			<button type="button" onClick={onClose} className="inline-flex min-h-12 items-center rounded-xl border-2 border-white/25 px-4 py-2 font-semibold text-fg hover:border-gold-400">
				{copy.closePile}
			</button>
		</section>
	);
}

const BAR: Record<Exclude<PhaseBarKind, "none">, readonly Phase[]> = { four: ["draw", "main1", "battle", "end"], six: PHASES };
interface PhaseBarProps {
	bar: Exclude<PhaseBarKind, "none">;
	board: Board;
	copy: PlayCopy;
	/** False while the rival acts. */
	enabled: boolean;
	hinted?: Phase | "draw-card" | null;
	onDraw: () => void;
	onPhase: (to: Phase) => void;
}
/** The phases of the turn as chimes to tap, in order. The current one is marked; tapping a later one moves on. */
export function PhaseBar({ bar, board, copy, enabled, hinted, onDraw, onPhase }: PhaseBarProps) {
	const mine = board.turn === "you";
	const mustDraw = mine && board.phase === "draw" && !board.drawn && board.turnNumber > 1;
	return (
		<ol aria-label={copy.phaseBar} className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
			{BAR[bar].map((phase) => {
				const current = mine && board.phase === phase;
				const drawNow = phase === "draw" && mustDraw;
				const glow = hinted === phase || (drawNow && hinted === "draw-card");
				return (
					<li key={phase}>
						<button
							type="button"
							aria-current={current ? "step" : undefined}
							disabled={!enabled || (current && !drawNow)}
							onClick={() => (drawNow ? onDraw() : onPhase(phase))}
							className={`min-h-12 rounded-full border-2 px-2.5 py-2 text-xs font-semibold ${current ? "border-gold-400 bg-gold-400 text-ink-950" : glow ? "border-gold-400 bg-gold-400/15 text-fg" : "border-white/25 bg-surface-raised text-fg"} disabled:opacity-100`}
						>
							{drawNow ? `${copy.phases.draw}: ${copy.draw}` : copy.phases[phase]}
						</button>
					</li>
				);
			})}
		</ol>
	);
}

/** The battle as a sum: the two numbers, the subtraction and the damage, as the board just played it. */
export function ClashBanner({ events, copy, moving }: { events: readonly GameEvent[]; copy: PlayCopy; moving: boolean }) {
	const battle = events.find((event) => event.type === "battle");
	const direct = events.find((event) => event.type === "direct");
	if (battle?.type === "battle") {
		const high = Math.max(battle.attackerValue, battle.defenderValue);
		const low = Math.min(battle.attackerValue, battle.defenderValue);
		const fighter = (card: CardId, value: number, label: string, from: number) => (
			<motion.span initial={moving ? { x: from, opacity: 0 } : false} animate={{ x: 0, opacity: 1 }} className="flex flex-col items-center">
				<span className="text-3xl">{cardOf(card).art}</span>
				<span className="text-lg font-bold text-fg">
					{label} {value}
				</span>
			</motion.span>
		);
		return (
			<div aria-hidden dir="ltr" data-clash className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-xl border-2 border-ember-400 bg-ember-500/10 p-2">
				{fighter(battle.attacker, battle.attackerValue, copy.atk, -40)}
				<span className="text-2xl">💥</span>
				{fighter(battle.defender, battle.defenderValue, battle.defenderPosition === "attack" ? copy.atk : copy.def, 40)}
				<motion.span initial={moving ? { scale: 0.5, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ delay: moving ? 0.35 : 0 }} className="text-lg font-bold text-gold-400">
					{battle.damage ? `${high} − ${low} = ${battle.damage.amount}` : battle.destroyed.length > 0 ? "✓" : "="}
				</motion.span>
			</div>
		);
	}
	if (direct?.type === "direct") {
		return (
			<div aria-hidden dir="ltr" data-clash className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-xl border-2 border-ember-400 bg-ember-500/10 p-2">
				<span className="text-3xl">{cardOf(direct.attacker).art}</span>
				<span className="text-2xl">➜ 🏮</span>
				<span className="text-lg font-bold text-gold-400">− {direct.amount}</span>
			</div>
		);
	}
	return null;
}

/** A chain as a tower of turtles: the last one on is the first one off. */
export function ChainTower({ events, board, copy }: { events: readonly GameEvent[]; board: Board; copy: PlayCopy }) {
	const links = new Map<number, CardId>();
	const resolved: number[] = [];
	for (const event of events) {
		if (event.type === "chain") links.set(event.link, event.card);
		if (event.type === "resolve") {
			links.set(event.link, event.card);
			resolved.push(event.link);
		}
	}
	if (board.pending?.kind === "spell") links.set(1, board.pending.card);
	if (links.size === 0) return null;
	const order = [...links.keys()].sort((a, b) => b - a);
	return (
		<ol aria-hidden data-chain className="mx-auto flex max-w-xs flex-col gap-1">
			{order.map((link) => {
				const card = links.get(link);
				const turn = resolved.indexOf(link);
				return (
					<li key={link} className="flex items-center gap-2 rounded-xl border-2 border-violet-400 bg-violet-500/15 px-3 py-1 text-sm font-semibold text-fg">
						<span className="text-2xl">🐢</span>
						<Ltr>{link}</Ltr>
						<span className="flex-1">{card ? copy.cards[card].name : ""}</span>
						{turn >= 0 && <Ltr className="text-gold-400">#{turn + 1} ✓</Ltr>}
					</li>
				);
			})}
		</ol>
	);
}
