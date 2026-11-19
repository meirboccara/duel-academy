"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { coverCrop, panelShift } from "@/lib/junior/world/panel-spot";
import type { IslandStatus } from "@/lib/junior/world/status";
import type { Island, World } from "@/lib/junior/world/world";

/**
 * The island's signature card, standing over its landmark: a gold card-shaped panel with the card's art as a
 * texture. Art only, no words: the scene keeps none. It floats above the middle of the island, over the landmark
 * (beside the top of a tall one), and steps aside when a stop stands behind it; taps pass through it.
 *
 * Pictures are fetched lazily: the island in view first, then its two neighbours, which show on the horizon. A
 * picture that is missing or fails simply leaves that island without a panel.
 */
export interface CardPanelsProps {
	world: World;
	focus: number;
	islandStatus: readonly IslandStatus[];
	/** Indexed like `world.islands`: the address of each island's card art, or null. */
	cards: readonly (string | null)[];
	/** Indexed like `world.islands`: the height of each island's landmark. */
	tops: readonly number[];
	clock: React.RefObject<number>;
}

/** A card is 59 by 86. */
const WIDTH = 1.15;
const HEIGHT = (WIDTH * 86) / 59;
const DEPTH = 0.08;
const EDGE = 0.09;
const ART_WIDTH = WIDTH - 0.34;
const ART_TOP = HEIGHT / 2 - 0.2;
/** The panel floats this far above its landmark. */
const GAP = 0.55;
/**
 * The panel's top stays under this height, for each unit of the island's size: higher is behind the island's name.
 * Low, because the close camera that follows the figure makes everything tall climb towards the title.
 */
const CEILING = 0.45;

/** The pictures that have arrived, by address. Each address is asked for once; a failed one is never asked for again. */
export function useCardArt(wanted: readonly string[]): ReadonlyMap<string, THREE.Texture> {
	const { invalidate } = useThree();
	const [ready, setReady] = useState<ReadonlyMap<string, THREE.Texture>>(() => new Map());
	const asked = useRef(new Set<string>());
	const made = useRef(new Set<THREE.Texture>());
	const alive = useRef(true);
	const key = wanted.join("\n");
	useEffect(() => {
		for (const url of key ? key.split("\n") : []) {
			if (asked.current.has(url)) continue;
			asked.current.add(url);
			try {
				new THREE.TextureLoader().load(
					url,
					(texture) => {
						if (!alive.current) return texture.dispose();
						texture.colorSpace = THREE.SRGBColorSpace;
						texture.anisotropy = 4;
						made.current.add(texture);
						setReady((before) => new Map(before).set(url, texture));
						invalidate();
					},
					undefined,
					/* A missing picture is not an error worth showing: the island just has no panel. */
					() => {},
				);
			} catch {
				/* The same: no panel. */
			}
		}
	}, [key, invalidate]);
	useEffect(() => {
		alive.current = true;
		const textures = made.current;
		return () => {
			alive.current = false;
			textures.forEach((texture) => texture.dispose());
			textures.clear();
		};
	}, []);
	return ready;
}

interface Shared {
	frame: THREE.BoxGeometry;
	plane: THREE.PlaneGeometry;
	gold: THREE.MeshLambertMaterial;
	face: THREE.MeshLambertMaterial;
	rim: THREE.MeshBasicMaterial;
	box: THREE.MeshLambertMaterial;
}

function CardPanel({ island, top, texture, phase, shared, clock }: { island: Island; top: number; texture: THREE.Texture; phase: number; shared: Shared; clock: React.RefObject<number> }) {
	const group = useRef<THREE.Group>(null);
	/* The art window takes the picture's shape, between square and 4:3; anything wider or taller is cropped evenly. */
	const image = texture.image as { width?: number; height?: number } | undefined;
	const aspect = image?.width && image.height ? image.width / image.height : 1;
	const windowAspect = THREE.MathUtils.clamp(aspect, 1, 4 / 3);
	const artHeight = ART_WIDTH / windowAspect;
	const material = useMemo(() => {
		/* The texture is this panel's own: its crop can be set on it. */
		const { repeat, offset } = coverCrop(aspect, windowAspect);
		texture.repeat.set(...repeat);
		texture.offset.set(...offset);
		return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
	}, [texture, aspect, windowAspect]);
	useEffect(() => () => material.dispose(), [material]);
	/*
	 * Over the landmark when that fits. The camera frames the island by its size, so on a small island with a tall
	 * castle the panel would climb into the island's name above the map: there it floats beside the castle's top.
	 */
	const ceiling = CEILING * (island.radius + 1.5);
	const tall = top + GAP + HEIGHT > ceiling;
	const base = (tall ? Math.max(1.8, ceiling - HEIGHT - 0.35) : top + GAP) + HEIGHT / 2;
	/* East or west of the middle when a stop stands right behind: the stop, its mark and the figure stay in view. */
	const shift = useMemo(() => panelShift(island, tall), [island, tall]);
	useFrame(() => {
		const node = group.current;
		if (!node) return;
		const t = clock.current ?? 0;
		node.position.y = base + Math.sin(t * 1.3 + phase) * 0.08;
		node.rotation.y = Math.sin(t * 0.7 + phase) * 0.12;
	});
	const boxHeight = HEIGHT - 0.2 - artHeight - 0.14 - 0.2;
	return (
		<group ref={group} position={[island.center.x + shift, base, island.center.z - (tall ? 0.6 : 0)]}>
			{/* Leaning back a little, to face the camera looking down. */}
			<group rotation={[-0.28, 0, 0]}>
				<mesh geometry={shared.frame} material={shared.gold} scale={[WIDTH, HEIGHT, DEPTH]} />
				<mesh geometry={shared.plane} material={shared.face} position={[0, 0, DEPTH / 2 + 0.01]} scale={[WIDTH - EDGE * 2, HEIGHT - EDGE * 2, 1]} />
				<mesh geometry={shared.plane} material={shared.rim} position={[0, ART_TOP - artHeight / 2, DEPTH / 2 + 0.02]} scale={[ART_WIDTH + 0.08, artHeight + 0.08, 1]} />
				<mesh geometry={shared.plane} material={material} position={[0, ART_TOP - artHeight / 2, DEPTH / 2 + 0.03]} scale={[ART_WIDTH, artHeight, 1]} />
				{/* Where a card's words would be: left empty on purpose. */}
				<mesh geometry={shared.plane} material={shared.box} position={[0, ART_TOP - artHeight - 0.14 - boxHeight / 2, DEPTH / 2 + 0.02]} scale={[ART_WIDTH + 0.08, boxHeight, 1]} />
			</group>
		</group>
	);
}

export function CardPanels({ world, focus, islandStatus, cards, tops, clock }: CardPanelsProps) {
	/* The island in view first, then the one after and the one before. Islands under mist show no card. */
	const wanted = useMemo(() => {
		const out: string[] = [];
		for (const index of [focus, focus + 1, focus - 1]) {
			const url = cards[index];
			if (url && islandStatus[index] !== undefined && islandStatus[index] !== "locked" && !out.includes(url)) out.push(url);
		}
		return out;
	}, [focus, cards, islandStatus]);
	const art = useCardArt(wanted);
	const shared = useMemo<Shared>(
		() => ({
			frame: new THREE.BoxGeometry(1, 1, 1),
			plane: new THREE.PlaneGeometry(1, 1),
			gold: new THREE.MeshLambertMaterial({ color: "#f2c230", emissive: "#a86a00", emissiveIntensity: 0.45 }),
			face: new THREE.MeshLambertMaterial({ color: "#c98f4e", emissive: "#5a3a18", emissiveIntensity: 0.35 }),
			rim: new THREE.MeshBasicMaterial({ color: "#7a4f12" }),
			box: new THREE.MeshLambertMaterial({ color: "#f6e7c4", emissive: "#8a7a55", emissiveIntensity: 0.4 }),
		}),
		[],
	);
	useEffect(() => () => Object.values(shared).forEach((thing) => thing.dispose()), [shared]);
	return (
		<>
			{world.islands.map((island, index) => {
				const url = cards[index];
				const texture = url ? art.get(url) : undefined;
				if (!texture || islandStatus[index] === "locked") return null;
				return <CardPanel key={island.world} island={island} top={tops[index] ?? 2} texture={texture} phase={index * 1.7} shared={shared} clock={clock} />;
			})}
		</>
	);
}
