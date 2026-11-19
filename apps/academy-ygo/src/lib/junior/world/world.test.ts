import { describe, expect, it } from "vitest";
import { WORLD_IDS, levelsOf } from "@/lib/junior/play/levels";
import { hexDistance, hexKey, sideTowards } from "./hex";
import pieces from "./kit-pieces.json";
import { exitsOf, type RoadPiece } from "./roads";
import { buildWorld } from "./world";

const world = buildWorld();

describe("buildWorld", () => {
	it("has one island per Junior world, in course order, with one stop per level", () => {
		expect(world.islands.map((island) => island.world)).toEqual([...WORLD_IDS]);
		for (const island of world.islands) expect(island.stops.map((stop) => stop.levelId)).toEqual(levelsOf(island.world).map((level) => level.id));
	});

	it("puts every stop on the road, met in course order on the walk from the dock", () => {
		for (const island of world.islands) {
			const walk = island.walk.map(hexKey);
			const order = island.stops.map((stop) => walk.indexOf(hexKey(stop.hex)));
			expect(order.every((at) => at > 0), island.world).toBe(true);
			expect([...order].sort((a, b) => a - b), island.world).toEqual(order);
			expect(new Set(order).size, island.world).toBe(order.length);
		}
	});

	it("walks one hex at a time, on land", () => {
		for (const island of world.islands) {
			const land = new Set(island.land.map(hexKey));
			island.walk.forEach((hex, i) => {
				expect(land.has(hexKey(hex)), `${island.world} ${hexKey(hex)}`).toBe(true);
				if (i > 0) expect(hexDistance(hex, island.walk[i - 1]!), island.world).toBe(1);
			});
		}
	});

	it("joins every road to another road, except the dock's end that opens onto the sea", () => {
		for (const island of world.islands) {
			const roads = new Map(island.roads.map((road) => [hexKey(road.hex), road]));
			for (const road of island.roads) {
				expect(exitsOf(road.choice).sort(), island.world).toEqual([...road.exits].sort());
				for (const side of road.exits) {
					const next = { q: road.hex.q + [1, 0, -1, -1, 0, 1][side]!, r: road.hex.r + [0, 1, 1, 0, -1, -1][side]! };
					const other = roads.get(hexKey(next));
					if (!other) {
						expect(hexKey(road.hex), `${island.world}: road leaves ${hexKey(road.hex)} by side ${side} to nowhere`).toBe(hexKey(island.dock));
						continue;
					}
					expect(sideTowards(next, road.hex) >= 0 && other.exits.includes(sideTowards(next, road.hex)), `${island.world}: ${hexKey(road.hex)} -> ${hexKey(next)}`).toBe(true);
				}
			}
		}
	});

	it("lays one ground tile per land hex, and at most one thing on each hex, never on the road", () => {
		for (const island of world.islands) {
			const ground = island.tiles.map((tile) => `${tile.x.toFixed(2)},${tile.z.toFixed(2)}`);
			expect(new Set(ground).size, island.world).toBe(island.land.length);
			const roads = new Set(island.roads.map((road) => hexKey(road.hex)));
			const spots = island.props.map((prop) => {
				const r = Math.round(prop.z / Math.sqrt(3));
				const q = Math.round((prop.x - r) / 2);
				return hexKey({ q, r });
			});
			expect(new Set(spots).size, island.world).toBe(spots.length);
			expect(spots.filter((spot) => roads.has(spot)), island.world).toEqual([]);
		}
	});

	it("only uses pieces that are in the kit", () => {
		const kit = new Set(Object.keys(pieces));
		for (const island of world.islands) for (const item of [...island.tiles, ...island.props]) expect(kit.has(item.piece), item.piece).toBe(true);
		const roadPieces: RoadPiece[] = world.islands.flatMap((island) => island.roads.map((road) => road.choice.piece));
		for (const piece of roadPieces) expect(kit.has(piece), piece).toBe(true);
	});

	it("keeps islands apart, with open sea between neighbours", () => {
		world.islands.forEach((a, i) =>
			world.islands.slice(i + 1).forEach((b) => {
				expect(Math.hypot(a.center.x - b.center.x, a.center.z - b.center.z), `${a.world} / ${b.world}`).toBeGreaterThan(a.radius + b.radius + 2);
			}),
		);
	});

	it("sails from each harbour to the next without crossing any land", () => {
		expect(world.routes).toHaveLength(world.islands.length - 1);
		world.routes.forEach((route, i) => {
			expect(route[0]).toEqual(world.islands[i]!.harbour);
			expect(route.at(-1)).toEqual(world.islands[i + 1]!.harbour);
			for (let leg = 1; leg < route.length; leg++) {
				const a = route[leg - 1]!;
				const b = route[leg]!;
				for (let t = 0; t <= 1; t += 0.02) {
					const x = a.x + (b.x - a.x) * t;
					const z = a.z + (b.z - a.z) * t;
					for (const island of world.islands) {
						const near = island.land.some((hex) => {
							const p = { x: island.center.x + 2 * hex.q + hex.r, z: island.center.z + Math.sqrt(3) * hex.r };
							return Math.hypot(p.x - x, p.z - z) < 1.2;
						});
						expect(near, `route ${i} passes over ${island.world} at ${x.toFixed(1)},${z.toFixed(1)}`).toBe(false);
					}
				}
			}
		});
	});

	it("is the same on every visit", () => {
		expect(buildWorld()).toEqual(world);
	});
});
