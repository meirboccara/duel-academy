"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Hex } from "@/lib/junior/world/hex";
import { behindTrainer, trainerPoint } from "@/lib/junior/world/map-places";
import type { IslandStatus } from "@/lib/junior/world/status";
import type { Island, World } from "@/lib/junior/world/world";
import { useCardArt } from "./card-panel";
import type { Pilot } from "./hero";

/**
 * The island's trainer, standing on the island: the character's own picture (transparent, no words) on a plane that
 * faces the camera, on a small round base with a soft shadow, about one and a half times the child's figure. No
 * taller: the pictures are as wide as they are tall, and a bigger one would hide the first stop behind it. The
 * trainer stands in the front row by the dock, so when the child's figure walks behind the picture, the picture
 * turns see-through until the figure is out again. The camera never turns, so the plane does not have to either.
 *
 * Pictures are fetched lazily, like the cards': the island in view first, then its two neighbours. A picture that
 * is missing or fails leaves the tile empty. Islands under mist show no trainer. Taps pass through.
 */
export interface TrainersProps {
	world: World;
	focus: number;
	islandStatus: readonly IslandStatus[];
	/** Indexed like `world.islands`: the address of each island's trainer picture, or null. */
	pictures: readonly (string | null | undefined)[];
	/** Indexed like `world.islands`: the tile each trainer stands on. */
	tiles: readonly (Hex | null)[];
	/** Where the child's figure is: behind the trainer of the island in view, the picture lets it show through. */
	pilot: React.RefObject<Pilot>;
	clock: React.RefObject<number>;
}

/** The child's figure is about 1.7 tall. */
const HEIGHT = 2.5;
const MAX_WIDTH = 2.6;
const BASE = 0.14;
/** The picture cuts out everything fainter than this. */
const CUT = 0.35;
/** How much of the picture is left while the figure is behind it. */
const SEE_THROUGH = 0.32;
const noTap = () => null;

interface Shared {
	plane: THREE.PlaneGeometry;
	disc: THREE.CircleGeometry;
	base: THREE.CylinderGeometry;
	shadow: THREE.MeshBasicMaterial;
	gold: THREE.MeshLambertMaterial;
}

function Trainer({ island, hex, texture, phase, shared, pilot, clock }: { island: Island; hex: Hex; texture: THREE.Texture; phase: number; shared: Shared; pilot: React.RefObject<Pilot> | null; clock: React.RefObject<number> }) {
	const { invalidate } = useThree();
	const picture = useRef<THREE.Mesh>(null);
	const image = texture.image as { width?: number; height?: number } | undefined;
	const aspect = image?.width && image.height ? image.width / image.height : 1;
	const width = Math.min(MAX_WIDTH, HEIGHT * aspect);
	const height = width / aspect;
	/* `alphaTest` cuts the picture out cleanly: no see-through edge to sort against the sea and the buildings. */
	const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: CUT, toneMapped: false, side: THREE.DoubleSide }), [texture]);
	useEffect(() => () => material.dispose(), [material]);
	useFrame((_, delta) => {
		/* Breathing, hardly more: the trainer is alive, not a sign. */
		if (picture.current) picture.current.scale.y = height * (1 + Math.sin((clock.current ?? 0) * 1.6 + phase) * 0.012);
		/* The figure behind the picture: see-through, so the child never loses sight of it. */
		const figure = pilot?.current.at;
		const wanted = figure && behindTrainer(hex, { x: figure.x - island.center.x, z: figure.z - island.center.z }) ? SEE_THROUGH : 1;
		if (material.opacity === wanted) return;
		const next = THREE.MathUtils.lerp(material.opacity, wanted, 1 - Math.exp(-Math.min(delta, 0.1) * 10));
		material.opacity = Math.abs(next - wanted) < 0.01 ? wanted : next;
		material.alphaTest = CUT * material.opacity;
		invalidate();
	});
	const at = trainerPoint(hex);
	return (
		<group position={[island.center.x + at.x, 0, island.center.z + at.z]}>
			<mesh geometry={shared.disc} material={shared.shadow} position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 0.95, 1]} raycast={noTap} />
			<mesh geometry={shared.base} material={shared.gold} position={[0, BASE / 2, 0]} raycast={noTap} />
			{/* Leaning back a little, to face the camera looking down. The plane's middle is moved up, so it grows from its feet. */}
			<group position={[0, BASE, 0]} rotation={[-0.16, 0, 0]}>
				<mesh ref={picture} geometry={shared.plane} material={material} scale={[width, height, 1]} raycast={noTap} />
			</group>
		</group>
	);
}

export function Trainers({ world, focus, islandStatus, pictures, tiles, pilot, clock }: TrainersProps) {
	const wanted = useMemo(() => {
		const out: string[] = [];
		for (const index of [focus, focus + 1, focus - 1]) {
			const url = pictures[index];
			if (url && tiles[index] && islandStatus[index] !== undefined && islandStatus[index] !== "locked" && !out.includes(url)) out.push(url);
		}
		return out;
	}, [focus, pictures, tiles, islandStatus]);
	const art = useCardArt(wanted);
	const shared = useMemo<Shared>(
		() => ({
			/* One unit tall, standing on y = 0. */
			plane: new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
			disc: new THREE.CircleGeometry(1, 24),
			base: new THREE.CylinderGeometry(0.8, 0.9, BASE, 24),
			shadow: new THREE.MeshBasicMaterial({ color: "#10202c", transparent: true, opacity: 0.26, depthWrite: false }),
			gold: new THREE.MeshLambertMaterial({ color: "#f2c230", emissive: "#a86a00", emissiveIntensity: 0.4 }),
		}),
		[],
	);
	useEffect(() => () => Object.values(shared).forEach((thing) => thing.dispose()), [shared]);
	return (
		<>
			{world.islands.map((island, index) => {
				const url = pictures[index];
				const hex = tiles[index];
				const texture = url ? art.get(url) : undefined;
				if (!texture || !hex || islandStatus[index] === "locked") return null;
				return <Trainer key={island.world} island={island} hex={hex} texture={texture} phase={index * 1.3} shared={shared} pilot={index === focus ? pilot : null} clock={clock} />;
			})}
		</>
	);
}
