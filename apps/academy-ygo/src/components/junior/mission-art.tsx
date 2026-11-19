import type { StoryId } from "@/lib/junior/flow";

/** Original schematic pictures built from simple shapes. `moving` adds one gentle pulse; calm mode turns it off. */
interface ArtProps {
	label: string;
	moving: boolean;
}

function Frame({ label, moving, children }: ArtProps & { children: React.ReactNode }) {
	return (
		<svg viewBox="0 0 200 160" role="img" aria-label={label} className={`mx-auto h-40 w-full max-w-64 ${moving ? "animate-pulse" : ""}`}>
			{children}
		</svg>
	);
}

const Cub = ({ shield }: { shield?: boolean }) => (
	<g>
		<circle cx="70" cy="48" r="14" className="fill-gold-600" />
		<circle cx="130" cy="48" r="14" className="fill-gold-600" />
		<circle cx="100" cy="82" r="44" className="fill-gold-400" />
		<circle cx="85" cy="76" r="5" className="fill-ink-900" />
		<circle cx="115" cy="76" r="5" className="fill-ink-900" />
		<ellipse cx="100" cy="94" rx="10" ry="7" className="fill-ink-900" />
		<rect x="62" y="120" width="76" height="30" rx="12" className="fill-arcane-500" />
		{shield && (
			<g>
				<path d="M140 104h40v26a20 20 0 0 1-40 0z" className="fill-ink-700 stroke-gold-400" strokeWidth="3" />
				<text x="160" y="119" textAnchor="middle" fontSize="11" className="fill-fg" fontWeight="700">ATK</text>
				<text x="160" y="134" textAnchor="middle" fontSize="11" className="fill-fg" fontWeight="700">DEF</text>
			</g>
		)}
	</g>
);

const Stars = () => (
	<g className="fill-gold-400">
		{[60, 100, 140].map((x) => (
			<polygon key={x} points={`${x},8 ${x + 6},22 ${x + 21},23 ${x + 9},33 ${x + 13},48 ${x},40 ${x - 13},48 ${x - 9},33 ${x - 21},23 ${x - 6},22`} transform="translate(0 -4) scale(1)" />
		))}
	</g>
);

const Spark = ({ x = 100, scale = 1 }: { x?: number; scale?: number }) => (
	<g transform={`translate(${x} 80) scale(${scale})`}>
		<polygon points="10,-60 -30,6 -4,6 -14,60 32,-12 4,-12" className="fill-spell stroke-fg" strokeWidth="3" strokeLinejoin="round" />
		<circle cx="-6" cy="-6" r="3" className="fill-ink-900" />
		<circle cx="8" cy="-8" r="3" className="fill-ink-900" />
		<path d="M-6 6q8 8 16 -2" className="fill-none stroke-ink-900" strokeWidth="3" strokeLinecap="round" />
	</g>
);

const Chameleon = ({ x = 100, scale = 1 }: { x?: number; scale?: number }) => (
	<g transform={`translate(${x} 90) scale(${scale})`}>
		<rect x="-60" y="-10" width="70" height="60" rx="8" className="fill-ink-700 stroke-trap" strokeWidth="4" />
		<ellipse cx="14" cy="-8" rx="46" ry="30" className="fill-trap" />
		<circle cx="38" cy="-20" r="11" className="fill-fg" />
		<circle cx="40" cy="-20" r="5" className="fill-ink-900" />
		<path d="M-28 -6q-30 -20 -22 -40q14 6 12 20" className="fill-none stroke-trap" strokeWidth="9" strokeLinecap="round" />
		<path d="M56 -2q8 6 18 0" className="fill-none stroke-ink-900" strokeWidth="3" strokeLinecap="round" />
	</g>
);

export function StoryArt({ id, label, moving }: ArtProps & { id: StoryId }) {
	return (
		<Frame label={label} moving={moving}>
			{id === "cub" && <Cub />}
			{id === "stats" && <Cub shield />}
			{id === "level" && (<><Stars /><g transform="translate(0 20) scale(.85)"><Cub /></g></>)}
			{id === "spark" && <Spark />}
			{id === "chameleon" && <Chameleon />}
			{id === "recap" && (
				<g>
					<g transform="translate(-38 14) scale(.55)"><Cub /></g>
					<Spark x={100} scale={0.6} />
					<Chameleon x={158} scale={0.5} />
				</g>
			)}
		</Frame>
	);
}

export function BadgeArt({ label, moving }: ArtProps) {
	return (
		<Frame label={label} moving={moving}>
			<circle cx="100" cy="80" r="62" className="fill-gold-500 stroke-gold-400" strokeWidth="6" />
			<circle cx="100" cy="80" r="46" className="fill-gold-400" />
			<polygon points="100,38 109,64 137,64 114,80 123,106 100,90 77,106 86,80 63,64 91,64" className="fill-ink-900" />
		</Frame>
	);
}
