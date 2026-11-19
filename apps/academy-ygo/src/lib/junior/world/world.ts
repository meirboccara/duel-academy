import { WORLD_IDS, levelsOf, type WorldId } from "@/lib/junior/play/levels";
import { HEX_CORNER, disk, hexDistance, hexKey, hexToPoint, neighbour, opposite, ring, scale, DIRECTIONS, sideTowards, type Hex, type Point } from "./hex";
import { roadPiece, type RoadChoice } from "./roads";
import { FAR_SHORE, PIECE_SCALE, SHORE, THEMES, type IslandColor } from "./themes";

/**
 * The Junior island world as data: one island per world, built from KayKit hexagon tiles, and the sea routes the
 * boat sails between them. Everything is computed from the course itself (`levelsOf`), the same every time, so
 * the 3D scene only draws it and the tests can check it.
 */

/** One model in the scene. Island pieces are relative to the island's centre; `rotY` is three.js `rotation.y`. */
export interface Placement {
	piece: string;
	x: number;
	y: number;
	z: number;
	rotY: number;
	scale: number;
}
export interface IslandStop {
	levelId: string;
	hex: Hex;
	/** Position on the island (relative to its centre). */
	at: Point;
}
export interface RoadTile {
	hex: Hex;
	/** The sides the road leaves by. */
	exits: number[];
	choice: RoadChoice;
}
export interface Island {
	world: WorldId;
	index: number;
	color: IslandColor;
	/** World position of the island's centre. */
	center: Point;
	/** Every piece of land is closer than this to the centre. */
	radius: number;
	land: Hex[];
	roads: RoadTile[];
	/** Ground tiles: one per land hex. */
	tiles: Placement[];
	/** Buildings, trees, rocks: at most one per hex. */
	props: Placement[];
	/** In course order. */
	stops: IslandStop[];
	/** The walk from the dock round the road loop, hex by hex. Every stop is on it, in course order. */
	walk: Hex[];
	/** The landing hex at the island's edge, facing the camera. */
	dock: Hex;
	/** Where the boat waits, in the sea just off the dock (world position). */
	harbour: Point;
}
export interface World {
	islands: Island[];
	/** `routes[i]` takes the boat from island i's harbour to island i + 1's (world positions). */
	routes: Point[][];
}

/** The dock faces side 1, towards the camera and the next island. */
const DOCK_SIDE = 1;
const GAP = 6;

/** A small seeded random generator, so every island is the same on every visit. */
function seeded(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const sizeFor = (stops: number) => (stops <= 3 ? 2 : stops <= 6 ? 3 : 4);

/** Turn a piece so its front (+z) looks along `side`. */
const facing = (side: number) => Math.PI / 2 - (side * Math.PI) / 3;

function buildIsland(world: WorldId, index: number): Omit<Island, "center" | "harbour"> {
	const random = seeded(index * 7919 + 17);
	const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!;
	const theme = THEMES[world];
	const levels = levelsOf(world);
	const size = sizeFor(levels.length);
	const loopRadius = size - 1;

	/* The road loop, starting at the hex next to the dock. */
	const dock = scale(DIRECTIONS[DOCK_SIDE]!, size);
	const junction = scale(DIRECTIONS[DOCK_SIDE]!, loopRadius);
	const loop = ring(loopRadius);
	const start = loop.findIndex((hex) => hexKey(hex) === hexKey(junction));
	const ordered = [...loop.slice(start), ...loop.slice(0, start)];
	const walk = [dock, ...ordered];
	const stopHexes = levels.map((_, i) => ordered[1 + Math.floor((i * (ordered.length - 1)) / levels.length)]!);

	const used = new Set<string>(walk.map(hexKey));
	const props: Placement[] = [];
	const place = (hex: Hex, piece: string, rotY: number, jitter = 0) => {
		const at = hexToPoint(hex);
		used.add(hexKey(hex));
		props.push({ piece, x: at.x + (random() - 0.5) * jitter, y: 0, z: at.z + (random() - 0.5) * jitter, rotY, scale: PIECE_SCALE[piece] ?? 1 });
	};

	/* Land: the full disk, minus a few beach hexes so the coast is not a perfect hexagon. */
	const reserved = new Set<string>([hexKey(dock)]);
	const beside: Hex[] = stopHexes.map((stop) => {
		const out = DIRECTIONS.map((_, side) => neighbour(stop, side)).find((hex) => hexDistance(hex, { q: 0, r: 0 }) === size && !reserved.has(hexKey(hex)));
		const spot = out ?? DIRECTIONS.map((_, side) => neighbour(stop, side)).find((hex) => hexDistance(hex, { q: 0, r: 0 }) < loopRadius && !reserved.has(hexKey(hex)));
		if (spot) reserved.add(hexKey(spot));
		return spot ?? stop;
	});
	const land = disk(size).filter((hex) => hexDistance(hex, { q: 0, r: 0 }) < size || reserved.has(hexKey(hex)) || random() > 0.3);
	const isLand = new Set(land.map(hexKey));

	/* Roads: each loop hex joins its two loop neighbours; the junction also joins the dock, which opens to the sea. */
	const roads: RoadTile[] = walk.map((hex, i) => {
		const exits = new Set<number>();
		if (i === 0) {
			exits.add(DOCK_SIDE);
			exits.add(opposite(DOCK_SIDE));
		} else {
			const at = i - 1;
			const before = ordered[(at - 1 + ordered.length) % ordered.length]!;
			const after = ordered[(at + 1) % ordered.length]!;
			exits.add(sideTowards(hex, before));
			exits.add(sideTowards(hex, after));
			if (at === 0) exits.add(DOCK_SIDE);
		}
		const list = [...exits].sort((a, b) => a - b);
		return { hex, exits: list, choice: roadPiece(list) };
	});
	const roadAt = new Map(roads.map((road) => [hexKey(road.hex), road]));

	const tiles: Placement[] = land.map((hex) => {
		const at = hexToPoint(hex);
		const road = roadAt.get(hexKey(hex));
		return { piece: road ? road.choice.piece : "hex_grass", x: at.x, y: 0, z: at.z, rotY: road ? (road.choice.turns * Math.PI) / 3 : 0, scale: 1 };
	});

	/* A building beside each stop, looking at the road. */
	stopHexes.forEach((stop, i) => {
		const spot = beside[i]!;
		if (hexKey(spot) !== hexKey(stop)) place(spot, theme.buildings[i % theme.buildings.length]!, facing(sideTowards(spot, stop)));
	});
	/* The landmark in the middle, and a village inside the loop on the bigger islands. */
	place({ q: 0, r: 0 }, theme.landmark, facing(DOCK_SIDE));
	for (const hex of land) {
		if (used.has(hexKey(hex))) continue;
		const far = hexToPoint(hex).z < -0.5;
		const inside = hexDistance(hex, { q: 0, r: 0 }) < loopRadius;
		if (inside) {
			if (theme.village.length) place(hex, pick(theme.village), Math.floor(random() * 6) * (Math.PI / 3), 0.3);
		} else place(hex, far && random() < 0.6 ? pick(FAR_SHORE) : pick(SHORE), Math.floor(random() * 6) * (Math.PI / 3), 0.3);
	}

	const radius = Math.max(...land.map((hex) => Math.hypot(hexToPoint(hex).x, hexToPoint(hex).z))) + HEX_CORNER;
	return {
		world,
		index,
		color: theme.color,
		radius,
		land: land.filter((hex) => isLand.has(hexKey(hex))),
		roads,
		tiles,
		props,
		stops: levels.map((level, i) => ({ levelId: level.id, hex: stopHexes[i]!, at: hexToPoint(stopHexes[i]!) })),
		walk,
		dock,
	};
}

/** Islands sit in a row from west to east, rising and falling a little, with open sea between them. */
export function buildWorld(): World {
	const islands: Island[] = [];
	let x = 0;
	WORLD_IDS.forEach((world, index) => {
		const shape = buildIsland(world, index);
		const previous = islands[index - 1];
		if (previous) x += previous.radius + shape.radius + GAP;
		const center = { x, z: Math.sin(index * 1.3) * 5 };
		const dock = hexToPoint(shape.dock);
		const out = hexToPoint(DIRECTIONS[DOCK_SIDE]!);
		const harbour = { x: center.x + dock.x + out.x * 1.4, z: center.z + dock.z + out.z * 1.4 };
		islands.push({ ...shape, center, harbour });
	});
	/* Between two islands the boat goes out to sea, south of both, then back in: it never crosses land. */
	const routes = islands.slice(1).map((to, i) => {
		const from = islands[i]!;
		const south = Math.max(from.center.z + from.radius, to.center.z + to.radius) + 2.5;
		return [from.harbour, { x: from.harbour.x + 1, z: south }, { x: to.harbour.x - 1, z: south }, to.harbour];
	});
	return { islands, routes };
}
