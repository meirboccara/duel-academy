"use client";

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { masterOfLevel, masterPicture } from "@/lib/junior/play/masters";
import type { Avatar } from "@/lib/junior/profiles";
import { FOV, closeView, farDistance, seaView } from "@/lib/junior/world/camera";
import type { MapAction, MapControls } from "@/lib/junior/world/controls";
import { hexToPoint, type Hex, type Point } from "@/lib/junior/world/hex";
import { STOP_FACE_BACK, behindStop, canBoard, nearShop, restIndex, shopSpot, stopOn, trainerHex, trainerPoint, type ShopSpot } from "@/lib/junior/world/map-places";
import { SAIL_SPEED, SAIL_STEP, landingAt, seaRoute, steerBoat } from "@/lib/junior/world/sea";
import type { IslandStatus, StopStatus } from "@/lib/junior/world/status";
import { nearestWalkable, spotOf } from "@/lib/junior/world/walk-graph";
import type { Outfit } from "@/lib/junior/world/wardrobe";
import type { Island, Placement, World } from "@/lib/junior/world/world";
import { CardPanels, useCardArt } from "./card-panel";
import { Hero, newPilot, type Pilot } from "./hero";
import { useMapInput, type MapInput } from "./map-input";
import { Trainers } from "./trainer-figure";

/**
 * The 3D island world: KayKit tiles merged into one mesh per island, a toy sea, a boat, a marker on every stop, the
 * child's figure, each island's trainer standing by the dock (or its signature card where there is no trainer), and
 * the game shop's sign on the first island.
 *
 * The camera stands close and follows the figure, which the child moves by tapping the island, with the arrow keys
 * or with the on-screen direction pad. Nothing opens by walking: on a stop, by the shop, by the boat and at a
 * harbour, the page's action button (which the scene keeps informed) plays the level, opens the shop, boards or
 * lands. In the boat the child steers freely over the sea and lands at any island; the boat still sails by itself
 * when an island is tapped or chosen with the HTML buttons. The camera steps
 * back to show the whole island during such a trip, on an island still asleep, and when there is no figure.
 *
 * Every control has an HTML twin outside the canvas, which is hidden from screen readers; walking and sailing about
 * are play, not controls. Frames are drawn on demand: while something moves, and a few times a second for the idle
 * motion when motion is allowed.
 */
export interface WorldSceneProps {
	world: World;
	focus: number;
	islandStatus: readonly IslandStatus[];
	stopStatus: Readonly<Record<string, StopStatus>>;
	moving: boolean;
	/** The child's figure. It loads after the islands; without it the boat alone shows where the child is. */
	avatar?: Avatar;
	/** What the figure wears from the shop: colours, a hat, something in the hand. */
	outfit?: Outfit;
	/** Indexed like `world.islands`: the address of the art of each island's signature card, shown on a panel where no trainer stands. */
	islandCards?: readonly (string | null)[];
	/** Indexed like `world.islands`: a transparent picture of the island's trainer, who stands by the dock. Null: no trainer. */
	trainerPictures?: readonly (string | null)[];
	/** The on-screen direction pad and action button: the scene obeys them, and says what the action button does. */
	controls?: MapControls;
	/** The island whose house by the road is the game shop. */
	shopIsland?: number;
	onShop?: () => void;
	onPickIsland: (index: number) => void;
	onPickStop: (levelId: string) => void;
	onLost: () => void;
}

const KIT_URL = "/world/kit.glb";
const WATER_Y = -0.28;
const SKY = new THREE.Color("#bfe8ff");
const COLORS = { blue: "#4f8fe6", green: "#59b85c", red: "#e0574f", yellow: "#f2c230" } as const;

/* ---------- Kit: one geometry per piece ---------- */

interface Kit {
	geometries: Map<string, THREE.BufferGeometry>;
	texture: THREE.Texture | null;
}

/**
 * Plain float position, normal and uv, always all three, and always indexed: pieces from a compressed file can
 * then be merged together. A part missing normals gets computed ones; missing uvs read the texture's first texel.
 */
function plain(source: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry();
	const count = source.getAttribute("position").count;
	for (const [name, size] of [["position", 3], ["normal", 3], ["uv", 2]] as const) {
		const attribute = source.getAttribute(name);
		const out = new Float32Array(count * size);
		if (attribute) for (let i = 0; i < count; i++) for (let k = 0; k < size; k++) out[i * size + k] = attribute.getComponent(i, k);
		geometry.setAttribute(name, new THREE.BufferAttribute(out, size));
	}
	const index = source.getIndex();
	const indices = index ? Array.from({ length: index.count }, (_, i) => index.getX(i)) : Array.from({ length: count }, (_, i) => i);
	geometry.setIndex(new THREE.BufferAttribute(count > 65535 ? new Uint32Array(indices) : new Uint16Array(indices), 1));
	if (!source.getAttribute("normal")) geometry.computeVertexNormals();
	geometry.applyMatrix4(matrix);
	return geometry;
}

function useKit(): Kit {
	const gltf = useLoader(GLTFLoader, KIT_URL, (loader) => {
		loader.setMeshoptDecoder(MeshoptDecoder);
	});
	const kit = useMemo(() => {
		const geometries = new Map<string, THREE.BufferGeometry>();
		let texture: THREE.Texture | null = null;
		gltf.scene.updateMatrixWorld(true);
		for (const root of gltf.scene.children) {
			const parts: THREE.BufferGeometry[] = [];
			const inverse = root.matrixWorld.clone().invert();
			root.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				parts.push(plain(object.geometry, inverse.clone().multiply(object.matrixWorld)));
				for (const material of [object.material].flat() as THREE.MeshStandardMaterial[]) if (!texture && material.map) texture = material.map;
			});
			const merged = parts.length === 1 ? parts[0]! : mergeGeometries(parts, false);
			if (parts.length > 1) for (const part of parts) part.dispose();
			if (merged) geometries.set(root.name, merged);
			else console.warn(`Island world: piece "${root.name}" could not be merged and is left out.`);
		}
		return { geometries, texture };
	}, [gltf]);
	/* The copies made here belong to this scene: release them when it closes. The loaded file stays cached. */
	useEffect(() => () => kit.geometries.forEach((geometry) => geometry.dispose()), [kit]);
	return kit;
}

function mergePlacements(kit: Kit, placements: readonly Placement[]): THREE.BufferGeometry | null {
	const parts: THREE.BufferGeometry[] = [];
	const matrix = new THREE.Matrix4();
	const rotation = new THREE.Quaternion();
	const up = new THREE.Vector3(0, 1, 0);
	for (const item of placements) {
		const geometry = kit.geometries.get(item.piece);
		if (!geometry) continue;
		rotation.setFromAxisAngle(up, item.rotY);
		matrix.compose(new THREE.Vector3(item.x, item.y, item.z), rotation, new THREE.Vector3(item.scale, item.scale, item.scale));
		parts.push(geometry.clone().applyMatrix4(matrix));
	}
	if (!parts.length) return null;
	const merged = mergeGeometries(parts, false);
	for (const part of parts) part.dispose();
	merged?.computeBoundingSphere();
	return merged;
}

/* ---------- Islands ---------- */

const MIST = new THREE.Color("#a9b8cc");

function IslandMesh({ kit, island, status, cleared, onPick }: { kit: Kit; island: Island; status: IslandStatus; cleared: Hex | null; onPick: (at: THREE.Vector3) => void }) {
	/* Where the trainer stands, the plan's building or tree is left out; the tile stays closed to the figure. */
	const geometry = useMemo(() => {
		const at = cleared && hexToPoint(cleared);
		return mergePlacements(kit, [...island.tiles, ...island.props.filter((item) => !at || Math.hypot(item.x - at.x, item.z - at.z) > 0.75)]);
	}, [kit, island, cleared]);
	const material = useMemo(() => new THREE.MeshLambertMaterial({ map: kit.texture ?? undefined }), [kit]);
	useEffect(() => {
		material.color.set(status === "locked" ? MIST : "#ffffff");
	}, [material, status]);
	useEffect(() => () => geometry?.dispose(), [geometry]);
	useEffect(() => () => material.dispose(), [material]);
	if (!geometry) return null;
	return (
		<mesh
			geometry={geometry}
			material={material}
			position={[island.center.x, 0, island.center.z]}
			onClick={(event: ThreeEvent<MouseEvent>) => {
				event.stopPropagation();
				onPick(event.point);
			}}
		/>
	);
}

/** A soft cloud resting over an island that is still asleep. */
function SleepCloud({ kit, island }: { kit: Kit; island: Island }) {
	const geometry = kit.geometries.get("cloud_big");
	if (!geometry) return null;
	return (
		<mesh geometry={geometry} position={[island.center.x, 4.2 + island.radius * 0.25, island.center.z - 1]} scale={0.9 + island.radius * 0.12}>
			<meshLambertMaterial color="#ffffff" emissive="#dfe9f5" emissiveIntensity={0.35} transparent opacity={0.92} />
		</mesh>
	);
}

/* ---------- Stops ---------- */

function starShape() {
	const shape = new THREE.Shape();
	for (let i = 0; i < 10; i++) {
		const radius = i % 2 === 0 ? 0.5 : 0.22;
		const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		if (i === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	shape.closePath();
	return shape;
}

/** A trainer's face over a duel stop: about the child's figure's height, so the stops on the road stay apart. */
const PORTRAIT = 1.5;
/** The face stands a little behind the stop, so the child's figure on the stop is in front of it. */
const PORTRAIT_BACK = -STOP_FACE_BACK;
/** The face cuts out everything fainter than this; with the figure behind it, this much of the face is left. */
const PORTRAIT_CUT = 0.35;
const PORTRAIT_SEE_THROUGH = 0.32;

/**
 * A trainer to duel, standing on the stop: the character's own picture on a plane that faces the camera, like the
 * island trainers. Greyed while the duel is locked. Taps pass through to the stop. When the child's figure walks
 * behind it, the face turns see-through, so the figure is never lost.
 */
function StopPortrait({ texture, locked, at, pilot }: { texture: THREE.Texture; locked: boolean; at: Point; pilot: React.RefObject<Pilot> }) {
	const { invalidate } = useThree();
	const image = texture.image as { width?: number; height?: number } | undefined;
	const aspect = image?.width && image.height ? image.width / image.height : 1;
	const width = Math.min(PORTRAIT, PORTRAIT * aspect);
	const height = width / aspect;
	const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: PORTRAIT_CUT, toneMapped: false, side: THREE.DoubleSide, color: locked ? "#7d838e" : "#ffffff" }), [texture, locked]);
	useEffect(() => () => material.dispose(), [material]);
	useFrame((_, delta) => {
		const figure = pilot.current.at;
		const wanted = figure && behindStop(at, figure) ? PORTRAIT_SEE_THROUGH : 1;
		if (material.opacity === wanted) return;
		const next = THREE.MathUtils.lerp(material.opacity, wanted, 1 - Math.exp(-Math.min(delta, 0.1) * 10));
		material.opacity = Math.abs(next - wanted) < 0.01 ? wanted : next;
		material.alphaTest = PORTRAIT_CUT * material.opacity;
		invalidate();
	});
	/* One unit tall, standing on its feet. */
	const plane = useMemo(() => new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), []);
	useEffect(() => () => plane.dispose(), [plane]);
	return (
		<group position={[0, 0.08, PORTRAIT_BACK]} rotation={[-0.16, 0, 0]}>
			<mesh geometry={plane} material={material} scale={[width, height, 1]} raycast={() => null} />
		</group>
	);
}

function StopMarker({ at, status, color, star, portrait, pilot, onPick, clock }: { at: Point; status: StopStatus; color: string; star: THREE.BufferGeometry; portrait?: THREE.Texture; pilot: React.RefObject<Pilot>; onPick: () => void; clock: React.RefObject<number> }) {
	const spinner = useRef<THREE.Group>(null);
	/* With a trainer's face on the stop, the star or the gem floats over the trainer's head. */
	const rest = portrait ? PORTRAIT + 0.35 : 1.05;
	const lifted = portrait ? PORTRAIT + 0.5 : 1.7;
	useFrame(() => {
		const group = spinner.current;
		if (!group) return;
		const t = clock.current ?? 0;
		if (status === "next") {
			group.position.y = lifted + Math.sin(t * 2.4) * 0.18;
			group.rotation.y = t * 1.2;
		} else group.rotation.y = t * 0.5;
	});
	const pick = (event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		onPick();
	};
	return (
		<group position={[at.x, 0, at.z]}>
			{/* A generous invisible target, so small fingers do not have to hit the marker itself. */}
			<mesh position={[0, 1, 0]} onClick={pick}>
				<cylinderGeometry args={[0.95, 0.95, 2.4, 12]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			{portrait && <StopPortrait texture={portrait} locked={status === "locked"} at={at} pilot={pilot} />}
			{status === "locked" ? (
				<mesh position={[0, 0.06, 0]}>
					<cylinderGeometry args={[0.28, 0.32, 0.12, 12]} />
					<meshLambertMaterial color="#8b93a3" />
				</mesh>
			) : (
				<>
					<mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
						<ringGeometry args={[0.55, 0.78, 32]} />
						<meshBasicMaterial color={status === "next" ? "#ffd84a" : color} transparent opacity={0.9} />
					</mesh>
					<group ref={spinner} position={[0, status === "next" ? lifted : rest, portrait ? PORTRAIT_BACK : 0]} scale={portrait ? 0.6 : 1}>
						{status === "next" ? (
							<mesh scale={[0.42, 0.6, 0.42]}>
								<octahedronGeometry args={[1, 0]} />
								<meshLambertMaterial color="#ffd84a" emissive="#ffb300" emissiveIntensity={0.55} flatShading />
							</mesh>
						) : (
							<mesh geometry={star} scale={0.9}>
								<meshLambertMaterial color={status === "star" ? "#ffd84a" : "#dfe6f2"} emissive={status === "star" ? "#c98a00" : "#556070"} emissiveIntensity={0.35} />
							</mesh>
						)}
					</group>
					{status === "next" && !portrait && (
						<mesh position={[0, 0.75, 0]}>
							<cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
							<meshBasicMaterial color="#ffe58a" transparent opacity={0.7} />
						</mesh>
					)}
				</>
			)}
		</group>
	);
}

/* ---------- Sea and boat ---------- */

const waterVertex = /* glsl */ `
	#include <fog_pars_vertex>
	varying vec2 vWorld;
	void main() {
		vec4 world = modelMatrix * vec4(position, 1.0);
		vWorld = world.xz;
		vec4 mvPosition = viewMatrix * world;
		gl_Position = projectionMatrix * mvPosition;
		#include <fog_vertex>
	}
`;
const waterFragment = /* glsl */ `
	#include <fog_pars_fragment>
	uniform float uTime;
	varying vec2 vWorld;
	void main() {
		vec2 p = vWorld * 0.12;
		float waves = sin(p.x * 1.7 + p.y * 0.6 + uTime * 0.5) * 0.5 + sin(p.y * 2.3 - uTime * 0.4 + p.x * 0.8) * 0.5;
		float glint = smoothstep(0.93, 1.0, sin(vWorld.x * 1.9 + uTime * 0.9) * sin(vWorld.y * 2.6 - uTime * 0.7));
		vec3 deep = vec3(0.13, 0.55, 0.76);
		vec3 light = vec3(0.30, 0.76, 0.88);
		vec3 color = mix(deep, light, waves * 0.3 + 0.45) + glint * 0.12;
		gl_FragColor = vec4(color, 1.0);
		#include <fog_fragment>
	}
`;

function Sea({ width, centerX, clock }: { width: number; centerX: number; clock: React.RefObject<number> }) {
	const material = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
				vertexShader: waterVertex,
				fragmentShader: waterFragment,
				fog: true,
			}),
		[],
	);
	useEffect(() => () => material.dispose(), [material]);
	useFrame(() => {
		material.uniforms.uTime!.value = clock.current ?? 0;
	});
	return (
		<mesh material={material} position={[centerX, WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<planeGeometry args={[width, 220, 1, 1]} />
		</mesh>
	);
}

function Clouds({ kit, from, to }: { kit: Kit; from: number; to: number }) {
	const big = kit.geometries.get("cloud_big");
	const small = kit.geometries.get("cloud_small");
	const spots = useMemo(() => {
		const out: { x: number; y: number; z: number; big: boolean; s: number }[] = [];
		for (let x = from - 10, i = 0; x < to + 10; x += 13, i++) out.push({ x: x + ((i * 37) % 7), y: 7 + (i % 3), z: -14 - ((i * 13) % 9), big: i % 2 === 0, s: 1.3 + (i % 3) * 0.3 });
		return out;
	}, [from, to]);
	return (
		<group>
			{spots.map((spot, i) => {
				const geometry = spot.big ? big : small;
				return geometry ? (
					<mesh key={i} geometry={geometry} position={[spot.x, spot.y, spot.z]} scale={spot.s}>
						<meshLambertMaterial color="#ffffff" emissive="#e8f1fb" emissiveIntensity={0.5} />
					</mesh>
				) : null;
			})}
		</group>
	);
}

function Boat({ boat, onPick }: { boat: React.RefObject<THREE.Group | null>; onPick: () => void }) {
	const sail = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(0, 1.3);
		shape.lineTo(0.95, 0.05);
		shape.closePath();
		return new THREE.ShapeGeometry(shape);
	}, []);
	useEffect(() => () => sail.dispose(), [sail]);
	return (
		<group ref={boat}>
			{/* A generous invisible target: a tap on the boat sends the figure aboard. */}
			<mesh
				position={[0, 0.9, 0]}
				onClick={(event: ThreeEvent<MouseEvent>) => {
					event.stopPropagation();
					onPick();
				}}
			>
				<boxGeometry args={[1.5, 2.6, 2.4]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			<group position={[0, WATER_Y + 0.05, 0]}>
				<mesh position={[0, 0.18, 0]}>
					<boxGeometry args={[0.8, 0.36, 1.6]} />
					<meshLambertMaterial color="#9a6038" />
				</mesh>
				<mesh position={[0, 0.18, 0.95]} rotation={[0, Math.PI / 4, 0]}>
					<boxGeometry args={[0.57, 0.36, 0.57]} />
					<meshLambertMaterial color="#9a6038" />
				</mesh>
				<mesh position={[0, 0.37, 0.1]}>
					<boxGeometry args={[0.84, 0.05, 1.7]} />
					<meshLambertMaterial color="#f2e2c4" />
				</mesh>
				<mesh position={[0, 1.1, 0]}>
					<cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
					<meshLambertMaterial color="#6b4428" />
				</mesh>
				<mesh geometry={sail} position={[0.02, 0.45, 0.05]} rotation={[0, -Math.PI / 2, 0]}>
					<meshLambertMaterial color="#fffaf0" side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[0, 1.95, -0.16]}>
					<boxGeometry args={[0.03, 0.22, 0.32]} />
					<meshLambertMaterial color="#ffd84a" />
				</mesh>
			</group>
		</group>
	);
}

/* ---------- The game shop's sign ---------- */

/** A gold card with a star, turning above the shop's roof: no words. A tap on it, or on the house, goes to the shop. */
function ShopSign({ at, top, star, clock, onPick }: { at: Point; top: number; star: THREE.BufferGeometry; clock: React.RefObject<number>; onPick: () => void }) {
	const sign = useRef<THREE.Group>(null);
	useFrame(() => {
		const group = sign.current;
		if (!group) return;
		const t = clock.current ?? 0;
		group.position.y = top + 0.85 + Math.sin(t * 2.1) * 0.1;
		group.rotation.y = t * 0.9;
	});
	return (
		<group position={[at.x, 0, at.z]}>
			<mesh
				position={[0, top + 0.85, 0]}
				onClick={(event: ThreeEvent<MouseEvent>) => {
					event.stopPropagation();
					onPick();
				}}
			>
				<cylinderGeometry args={[0.8, 0.8, 1.6, 12]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			<group ref={sign} position={[0, top + 0.85, 0]}>
				<mesh>
					<boxGeometry args={[0.62, 0.9, 0.08]} />
					<meshLambertMaterial color="#ffd84a" emissive="#b97a00" emissiveIntensity={0.55} />
				</mesh>
				{[1, -1].map((side) => (
					<group key={side} position={[0, 0, side * 0.05]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
						<mesh scale={[0.5, 0.78, 1]}>
							<planeGeometry args={[1, 1]} />
							<meshLambertMaterial color="#7a3d12" emissive="#3a1c06" emissiveIntensity={0.4} />
						</mesh>
						<mesh geometry={star} position={[0, 0, 0.03]} scale={[0.44, 0.44, 0.2]}>
							<meshLambertMaterial color="#fff2a8" emissive="#ffc21a" emissiveIntensity={0.7} />
						</mesh>
					</group>
				))}
			</group>
		</group>
	);
}

/* ---------- Camera, boat travel, frames ---------- */

function routeBetween(world: World, from: number, to: number): Point[] {
	const points: Point[] = [];
	const step = to > from ? 1 : -1;
	for (let i = from; i !== to; i += step) {
		const leg = step > 0 ? world.routes[i]! : [...world.routes[i - 1]!].reverse();
		points.push(...(points.length ? leg.slice(1) : leg));
	}
	return points;
}

/** About 30° down: low enough to see the horizon and the next islands, high enough to see every stop on the road. */
const VIEW = new THREE.Vector3(0, 0.49, 0.87).normalize();

interface Framing {
	target: THREE.Vector3;
	offset: THREE.Vector3;
}

/** The whole island: where the camera looks and from how far, on a screen of this shape. */
function framing(island: Island, aspect: number): Framing {
	return { target: new THREE.Vector3(island.center.x, 0, island.center.z + 1.5), offset: VIEW.clone().multiplyScalar(farDistance(island.radius, aspect)) };
}

/** Close on the child's figure, standing at `at` (world position) on this island, and on its trainer when the figure is beside them. */
function closeFraming(island: Island, at: Point, aspect: number, trainer: Point | null): Framing {
	const view = closeView(at, island.center, island.radius, aspect, trainer);
	return { target: new THREE.Vector3(view.target.x, 0, view.target.z), offset: VIEW.clone().multiplyScalar(view.distance) };
}

/** On the boat while the child steers it: a bit further out than on land. */
function seaFraming(boat: Point, aspect: number): Framing {
	const view = seaView(boat, aspect);
	return { target: new THREE.Vector3(view.target.x, 0, view.target.z), offset: VIEW.clone().multiplyScalar(view.distance) };
}

/** Turn `from` towards `to` by the short way round. */
function turnTowards(from: number, to: number, k: number) {
	const diff = THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
	return Math.abs(diff) < 0.01 ? to : from + diff * k;
}

interface Trip {
	curve: THREE.CatmullRomCurve3;
	start: number;
	duration: number;
	to: Island;
	/** How far the camera stood when the trip began. */
	begin: number;
	/** A short way into a harbour the child steered to: the camera does not step back for it. */
	quick: boolean;
}

interface DirectorProps {
	world: World;
	focus: number;
	moving: boolean;
	/** The island in view is still asleep: the whole of it is shown. */
	locked: boolean;
	/** Where progress puts the figure: the camera looks there until the figure itself is on the island. */
	stand: number;
	/** The tile the trainer of the island in view stands on, when one is shown. */
	trainer: Hex | null;
	boat: React.RefObject<THREE.Group | null>;
	sailing: React.RefObject<boolean>;
	pilot: React.RefObject<Pilot>;
	input: React.RefObject<MapInput>;
	clock: React.RefObject<number>;
	onPickIsland: (index: number) => void;
}

/**
 * Moves the boat and the camera. The boat sails by itself along the routes when the island in view changes; while
 * the figure is in it and no such trip is on, the child steers it with the direction keys or pad, and a wish to
 * land (`pilot.wish`) takes it into a harbour. Landing at another island tells the page, which changes the island
 * in view: the director has then already claimed that change, so it does not sail the route a second time.
 */
function Director({ world, focus, moving, locked, stand, trainer, boat, sailing, pilot, input, clock, onPickIsland }: DirectorProps) {
	const { camera, invalidate, clock: timer, size, scene } = useThree();
	const aspect = size.width / Math.max(1, size.height);
	/* Read by the island-change effect without re-running it on resize: frames follow a resize by themselves. */
	const aspectNow = useRef(aspect);
	aspectNow.current = aspect;
	const trip = useRef<Trip | null>(null);
	const shown = useRef<number | null>(null);
	/* The island the child has just landed at: its coming into view starts no trip. */
	const claimed = useRef<number | null>(null);
	const look = useRef(new THREE.Vector3());
	/* Read by the island-change effect, which must not run again for them. */
	const lockedNow = useRef(locked);
	lockedNow.current = locked;
	const standNow = useRef(stand);
	standNow.current = stand;
	const trainerNow = useRef(trainer);
	trainerNow.current = trainer;
	const pick = useRef(onPickIsland);
	pick.current = onPickIsland;
	/** The view of an island at rest: close on the figure when there is one to follow, the whole island otherwise. */
	const resting = (island: Island, shape: number): Framing => {
		const shared = pilot.current;
		if (lockedNow.current || shared.state === "none" || shared.state === "failed") return framing(island, shape);
		/* Until the figure is on the island: where it is about to stand. */
		const spot = spotOf(island, shared.ashore === "dock" ? island.dock : (island.walk[standNow.current] ?? island.dock));
		const beside = trainerNow.current && trainerPoint(trainerNow.current);
		return closeFraming(island, shared.at ? { x: shared.at.x, z: shared.at.z } : { x: island.center.x + spot.x, z: island.center.z + spot.z }, shape, beside ? { x: island.center.x + beside.x, z: island.center.z + beside.z } : null);
	};
	/** The boat is at this island's harbour, side-on so the sail shows. */
	const moor = (to: Island) => {
		trip.current = null;
		sailing.current = false;
		pilot.current.adrift = false;
		boat.current?.position.set(to.harbour.x, 0, to.harbour.z);
		if (boat.current) boat.current.rotation.y = Math.PI / 2;
	};
	/** The boat sails by itself through these points to an island's harbour. */
	const sail = (points: readonly Point[], to: Island, quick: boolean) => {
		const spread = points.filter((point, i) => i === 0 || Math.hypot(point.x - points[i - 1]!.x, point.z - points[i - 1]!.z) > 0.05).map((point) => new THREE.Vector3(point.x, 0, point.z));
		if (spread.length < 2) return moor(to);
		const curve = new THREE.CatmullRomCurve3(spread, false, "centripetal");
		const length = curve.getLength();
		/* The renderer's own clock, read now: the shared clock only moves when a frame is drawn. */
		trip.current = { curve, start: timer.getElapsedTime(), duration: quick ? Math.min(5.5, 0.5 + length / 12) : Math.min(5.5, 1.4 + length / 14), to, begin: camera.position.distanceTo(look.current), quick };
		sailing.current = true;
		pilot.current.adrift = false;
		invalidate();
	};

	/* A new island: sail there (or jump there in calm mode). */
	useEffect(() => {
		const to = world.islands[focus]!;
		const previous = shown.current;
		shown.current = focus;
		const shared = pilot.current;
		if (claimed.current === focus) {
			/* The child steered here and landed: the boat is already on its way in. */
			claimed.current = null;
			return;
		}
		claimed.current = null;
		shared.wish = null;
		if (previous !== focus) {
			shared.aboard = false;
			shared.ashore = "road";
		}
		const node = boat.current;
		if (previous === null || previous === focus || !moving || !node) {
			moor(to);
			const { target, offset } = resting(to, aspectNow.current);
			camera.position.copy(target).add(offset);
			look.current.copy(target);
			camera.lookAt(look.current);
			invalidate();
			return;
		}
		/* From wherever the child left the boat, or along the routes from the harbour it was moored at. */
		sail(shared.adrift ? seaRoute(world, { x: node.position.x, z: node.position.z }, focus) : routeBetween(world, previous, focus), to, false);
	}, [world, focus, moving, boat, sailing, camera, invalidate, timer]);

	useFrame((state, delta) => {
		/* Hidden during a level, the canvas measures 0 × 0: nothing to frame, and no camera move to spoil. */
		if (state.size.width === 0 || state.size.height === 0) return;
		const t = clock.current ?? 0;
		const dt = Math.min(delta, 0.1);
		const boatNode = boat.current;
		const shared = pilot.current;
		const keys = input.current;
		const island = world.islands[focus]!;
		/* The figure is in the boat, and the boat is the child's to steer. */
		const inBoat = shared.state === "ready" && (locked || shared.aboard);
		let steering = false;
		const wish = shared.wish;
		shared.wish = null;
		if (boatNode && !trip.current && inBoat) {
			const here = { x: boatNode.position.x, z: boatNode.position.z };
			const direction = keys.once ?? keys.held;
			if (wish && world.islands[wish.index]) {
				/* Land: into the harbour, and the page hears of it when it is another island's. */
				const to = world.islands[wish.index]!;
				if (wish.index !== focus) {
					claimed.current = wish.index;
					shared.aboard = false;
					shared.ashore = "road";
					pick.current(wish.index);
				} else if (!locked) {
					shared.aboard = false;
					shared.ashore = "dock";
				}
				if (!moving || Math.hypot(here.x - to.harbour.x, here.z - to.harbour.z) < 0.05) moor(to);
				else sail(seaRoute(world, here, wish.index), to, true);
				steering = true;
			} else if (direction) {
				const fresh = !!keys.once;
				keys.once = null;
				if (shared.aboard && !locked && !shared.adrift && direction.z < -0.5) {
					/* Moored, and the child presses towards the island: back onto the dock. */
					shared.aboard = false;
					shared.ashore = "dock";
				} else {
					/* Reduced motion: the boat does not glide, each press moves it one step. */
					const next = steerBoat(world, here, direction, moving ? SAIL_SPEED * dt : fresh ? SAIL_STEP : 0);
					if (next !== here) {
						boatNode.position.x = next.x;
						boatNode.position.z = next.z;
						const heading = Math.atan2(next.x - here.x, next.z - here.z);
						boatNode.rotation.y = moving ? turnTowards(boatNode.rotation.y, heading, 1 - Math.exp(-dt * 8)) : heading;
						shared.adrift = true;
					}
				}
				steering = moving || fresh;
			} else if (moving && !shared.adrift && boatNode.rotation.y !== Math.PI / 2) {
				/* Moored after a trip: the boat swings side-on, so the sail shows. */
				boatNode.rotation.y = turnTowards(boatNode.rotation.y, Math.PI / 2, 1 - Math.exp(-dt * 4));
				steering = true;
			}
		}
		const active = trip.current;
		let target: THREE.Vector3;
		let offset: THREE.Vector3;
		if (active && boatNode) {
			const raw = Math.min(1, (state.clock.elapsedTime - active.start) / active.duration);
			const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
			const point = active.curve.getPointAt(eased);
			const ahead = active.curve.getPointAt(Math.min(1, eased + 0.01));
			boatNode.position.set(point.x, 0, point.z);
			if (ahead.distanceTo(point) > 0.001) boatNode.rotation.y = Math.atan2(ahead.x - point.x, ahead.z - point.z);
			/* The trip ends on the view the island will rest in; on the way the camera steps back to show the sea and the island coming. */
			const end = active.to === island ? resting(active.to, aspect) : framing(active.to, aspect);
			const blend = THREE.MathUtils.smoothstep(raw, 0.55, 1);
			target = new THREE.Vector3(point.x, 0, point.z - (active.quick ? 0 : 2)).lerp(end.target, blend);
			const straight = THREE.MathUtils.lerp(active.begin, end.offset.length(), eased);
			const wide = active.quick ? straight : Math.max(straight, farDistance(active.to.radius, aspect));
			offset = VIEW.clone().multiplyScalar(straight + (wide - straight) * Math.sin(Math.PI * raw));
			if (raw >= 1) {
				trip.current = null;
				sailing.current = false;
			}
		} else if (boatNode && shared.state === "ready" && (shared.adrift || (shared.aboard && !locked))) {
			({ target, offset } = seaFraming({ x: boatNode.position.x, z: boatNode.position.z }, aspect));
		} else {
			({ target, offset } = resting(island, aspect));
		}
		/* The haze starts behind the island being looked at, however far back the camera stands. */
		if (scene.fog instanceof THREE.Fog) {
			const distance = offset.length();
			scene.fog.near = distance * 1.35;
			scene.fog.far = distance * 3.6;
		}
		const wanted = target.clone().add(offset);
		/* Reduced motion: the camera cuts to its place, it never glides. */
		const k = moving ? 1 - Math.exp(-dt * 5) : 1;
		camera.position.lerp(wanted, k);
		look.current.lerp(target, k);
		camera.lookAt(look.current);
		if (boatNode) boatNode.position.y = Math.sin(t * 2) * 0.04;
		if (trip.current || steering || camera.position.distanceTo(wanted) >= 0.01) invalidate();
	});
	return null;
}

/** How long the sea and markers keep moving after the child last touched the world. Then the scene rests. */
const IDLE_MOTION_MS = 30_000;

/**
 * Advances the shared clock. While motion is allowed, it also asks for about 15 frames a second for the idle
 * motion, but only while the world is on screen and for a while after the child's last touch or trip.
 */
function Ticker({ moving, focus, clock }: { moving: boolean; focus: number; clock: React.RefObject<number> }) {
	const { invalidate, gl } = useThree();
	const awakeUntil = useRef(0);
	useFrame((state) => {
		clock.current = moving ? state.clock.elapsedTime : 0;
	});
	useEffect(() => {
		awakeUntil.current = Date.now() + IDLE_MOTION_MS;
	}, [focus]);
	useEffect(() => {
		if (!moving) {
			invalidate();
			return;
		}
		awakeUntil.current = Date.now() + IDLE_MOTION_MS;
		const wake = () => {
			awakeUntil.current = Date.now() + IDLE_MOTION_MS;
		};
		let visible = true;
		const observer = new IntersectionObserver(([entry]) => {
			visible = !!entry?.isIntersecting;
		});
		observer.observe(gl.domElement);
		gl.domElement.addEventListener("pointerdown", wake);
		/* The keyboard and the direction pad wake the world as a touch does. */
		window.addEventListener("keydown", wake);
		const timer = window.setInterval(() => {
			if (visible && document.visibilityState === "visible" && Date.now() < awakeUntil.current) invalidate();
		}, 66);
		return () => {
			observer.disconnect();
			gl.domElement.removeEventListener("pointerdown", wake);
			window.removeEventListener("keydown", wake);
			window.clearInterval(timer);
		};
	}, [moving, invalidate, gl]);
	return null;
}

/** A lost graphics context hides the world (the list stays). Only while the scene lives: closing it loses the context on purpose. */
function LossWatch({ onLost }: { onLost: () => void }) {
	const { gl } = useThree();
	useEffect(() => {
		const canvas = gl.domElement;
		const lost = (event: Event) => {
			event.preventDefault();
			onLost();
		};
		canvas.addEventListener("webglcontextlost", lost);
		return () => canvas.removeEventListener("webglcontextlost", lost);
	}, [gl, onLost]);
	return null;
}

interface ActionWatchProps {
	world: World;
	focus: number;
	locked: boolean;
	stopStatus: Readonly<Record<string, StopStatus>>;
	/** The game shop, when it is on the island in view. */
	shop: ShopSpot | null;
	boat: React.RefObject<THREE.Group | null>;
	sailing: React.RefObject<boolean>;
	pilot: React.RefObject<Pilot>;
	controls: MapControls | undefined;
	/** What the action is right now, for the scene's own use. */
	action: React.RefObject<MapAction>;
}

/**
 * Works out, on every frame drawn, what the action button does where the figure is, and tells the page's button:
 * in the boat near a harbour, land; on an open stop, enter; by the shop, the shop; on the dock or next to it, board.
 * It stands after the figure in the scene, so it reads where the figure is in the same frame.
 */
function ActionWatch({ world, focus, locked, stopStatus, shop, boat, sailing, pilot, controls, action }: ActionWatchProps) {
	useFrame((state) => {
		let next: MapAction = null;
		const shared = pilot.current;
		const node = boat.current;
		const island = world.islands[focus]!;
		if (state.size.width > 0 && state.size.height > 0 && shared.state === "ready" && node && !sailing.current) {
			if (locked || shared.aboard) {
				const near = landingAt(world, node.position);
				/* Moored at an island asleep there is nowhere to land: the figure stays in the boat. */
				if (near !== null && (near !== focus || shared.adrift || !locked)) next = "land";
			} else if (shared.tile) {
				const stop = stopOn(island, shared.tile);
				if (stop && (stopStatus[stop.levelId] ?? "locked") !== "locked") next = "enter";
				else if (shop && nearShop(island, shop, shared.tile)) next = "shop";
				else if (canBoard(island, shared.tile)) next = "board";
			}
		}
		action.current = next;
		controls?.setAction(next);
	});
	useEffect(() => () => controls?.setAction(null), [controls]);
	return null;
}

/** How high the deck of the boat is above the boat's own origin: where the figure's feet go. */
const DECK = WATER_Y + 0.05 + 0.395;
/** Two openings of a level closer together than this are one: a walk's end and a tap, or two taps. */
const OPEN_ONCE_MS = 500;

function Scene({ world, focus, islandStatus, stopStatus, moving, avatar, outfit, islandCards, trainerPictures, controls, shopIsland, onShop, onPickIsland, onPickStop, onLost }: WorldSceneProps) {
	const kit = useKit();
	const boat = useRef<THREE.Group>(null);
	/* True while the boat sails by itself: the figure rides it. */
	const sailing = useRef(false);
	/* What the scene and the figure tell each other: the child's taps one way, where the figure is the other. */
	const pilot = useRef<Pilot>(newPilot());
	const { invalidate } = useThree();
	const island = world.islands[focus]!;
	const stand = restIndex(island, stopStatus);
	const locked = islandStatus[focus] === "locked";
	/** True when a tap can send the figure walking: it is there, on this island, and not in the boat. */
	const canWalk = () => pilot.current.state === "ready" && !locked && !sailing.current && !pilot.current.aboard;
	const opened = useRef(0);
	/* The latest handlers, so a walk started earlier ends in the current ones. */
	const pickStop = useRef(onPickStop);
	pickStop.current = onPickStop;
	const toShop = useRef(onShop);
	toShop.current = onShop;
	/* Each island's trainer tile, where a trainer stands; and the shop, which is never that tile. */
	const trainerTiles = useMemo(() => world.islands.map((item, index) => (trainerPictures?.[index] ? trainerHex(item) : null)), [world, trainerPictures]);
	/* The faces of the trainers to duel, on the island in view and its two neighbours; once fetched, they stay. */
	const portraitUrls = useMemo(() => {
		const urls = new Set<string>();
		for (const index of [focus, focus + 1, focus - 1]) {
			const item = world.islands[index];
			if (!item || islandStatus[index] === "locked") continue;
			for (const stop of item.stops) {
				const master = masterOfLevel(stop.levelId);
				if (master) urls.add(masterPicture(master));
			}
		}
		return [...urls];
	}, [world, focus, islandStatus]);
	const portraits = useCardArt(portraitUrls);
	const portraitOf = (levelId: string) => {
		const master = masterOfLevel(levelId);
		return master ? portraits.get(masterPicture(master)) : undefined;
	};
	const shopOn = shopIsland !== undefined ? world.islands[shopIsland] : undefined;
	const shop = useMemo(() => (shopOn ? shopSpot(shopOn, trainerTiles[shopOn.index] ?? null) : null), [shopOn, trainerTiles]);
	/* Where a trainer stands, the card does not: the character is there in person. */
	const cards = useMemo(() => islandCards?.map((url, index) => (trainerTiles[index] ? null : url)), [islandCards, trainerTiles]);

	/** Opens a level, once: a second opening right after is ignored. */
	const open = (levelId: string) => {
		pilot.current.order = null;
		const now = performance.now();
		if (now - opened.current < OPEN_ONCE_MS) return;
		opened.current = now;
		pickStop.current(levelId);
	};
	/* A tap on the shop (its house or its sign): the figure walks to the door, then the shop opens. With no figure to walk, it opens at once. */
	const tapShop = () => {
		if (!shop || !shopOn) return;
		if (shopOn.index !== focus) return onPickIsland(shopOn.index);
		if (!canWalk() || !moving) return toShop.current?.();
		pilot.current.order = { hex: shop.door, then: () => toShop.current?.() };
		invalidate();
	};
	/* A tap on the boat: the figure walks to the dock and steps in. */
	const tapBoat = () => {
		if (!canWalk()) return;
		pilot.current.order = { hex: island.dock, board: true };
		invalidate();
	};
	/*
	 * A tap on the island in view: the figure walks to the nearest free tile; from the boat, it lands. On another
	 * island: the boat sails there.
	 */
	const tapIsland = (index: number, at: THREE.Vector3) => {
		const tapped = world.islands[index]!;
		const shared = pilot.current;
		if (index !== focus) return onPickIsland(index);
		if (shop && shopOn === tapped && at.y > 0.3 && Math.hypot(at.x - tapped.center.x - shop.building.x, at.z - tapped.center.z - shop.building.z) < 1.05) return tapShop();
		if (shared.state === "ready" && !sailing.current && (shared.aboard || (locked && shared.adrift))) {
			shared.wish = { index };
			return invalidate();
		}
		if (!canWalk()) return onPickIsland(index);
		const hex = nearestWalkable(tapped, { x: at.x - tapped.center.x, z: at.z - tapped.center.z });
		if (!hex) return;
		shared.order = { hex };
		invalidate();
	};
	/*
	 * A tap on a stop of the island in view: the figure walks there (a second and a half at most), open or locked.
	 * The level does not open by itself: on an open stop the action button plays it. Only with no figure to walk
	 * (it was not asked for, or its file failed) does the tap open the level, as there is then no action button.
	 */
	const tapStop = (index: number, levelId: string) => {
		if (index !== focus) return onPickIsland(index);
		const stop = world.islands[index]!.stops.find((item) => item.levelId === levelId);
		const shared = pilot.current;
		if (shared.state === "none" || shared.state === "failed") return (stopStatus[levelId] ?? "locked") !== "locked" ? open(levelId) : undefined;
		if (!stop || !canWalk()) return;
		shared.order = { hex: stop.hex, stop: levelId };
		invalidate();
	};
	/* What the action button does right now (`ActionWatch` keeps it), and doing it. */
	const action = useRef<MapAction>(null);
	const act = (): boolean => {
		const shared = pilot.current;
		if (action.current === "board") shared.order = { hex: island.dock, board: true };
		else if (action.current === "land") {
			const index = boat.current ? landingAt(world, boat.current.position) : null;
			if (index === null) return false;
			shared.wish = { index };
		} else if (action.current === "enter") {
			const stop = shared.tile && stopOn(island, shared.tile);
			if (!stop) return false;
			open(stop.levelId);
		} else if (action.current === "shop") toShop.current?.();
		else return false;
		invalidate();
		return true;
	};
	const input = useMapInput(controls, invalidate, act);

	/* The height of each island's landmark, the piece in its middle: the card panel floats above it. */
	const heightOf = (item: Placement) => {
		const geometry = kit.geometries.get(item.piece);
		if (!geometry) return 0;
		if (!geometry.boundingBox) geometry.computeBoundingBox();
		return (geometry.boundingBox?.max.y ?? 0) * item.scale;
	};
	const tops = useMemo(
		() => world.islands.map((item) => Math.max(0, ...item.props.filter((piece) => Math.hypot(piece.x, piece.z) <= 0.5).map(heightOf))),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[world, kit],
	);
	const done = islandStatus.filter((status) => status === "done").length;
	const clock = useRef(0);
	/* One star shape shared by every stop. */
	const star = useMemo(() => new THREE.ExtrudeGeometry(starShape(), { depth: 0.14, bevelEnabled: false }).center(), []);
	useEffect(() => () => star.dispose(), [star]);
	const first = world.islands[0]!;
	const last = world.islands.at(-1)!;
	const width = last.center.x - first.center.x + 160;
	return (
		<>
			<fog attach="fog" args={[SKY, 38, 95]} />
			<hemisphereLight args={["#e6f6ff", "#7aa35a", 1.5]} />
			<directionalLight position={[-12, 20, 14]} intensity={1.9} color="#fff3dc" />
			<LossWatch onLost={onLost} />
			<Ticker moving={moving} focus={focus} clock={clock} />
			<Director world={world} focus={focus} moving={moving} locked={locked} stand={stand} trainer={locked ? null : (trainerTiles[focus] ?? null)} boat={boat} sailing={sailing} pilot={pilot} input={input} clock={clock} onPickIsland={onPickIsland} />
			<Sea width={width} centerX={(first.center.x + last.center.x) / 2} clock={clock} />
			<Clouds kit={kit} from={first.center.x} to={last.center.x} />
			{world.islands.map((item, index) => (
				<group key={item.world}>
					<IslandMesh kit={kit} island={item} status={islandStatus[index]!} cleared={trainerTiles[index] ?? null} onPick={(at) => tapIsland(index, at)} />
					{islandStatus[index] === "locked" ? (
						<SleepCloud kit={kit} island={item} />
					) : (
						item.stops.map((stop) => (
							<StopMarker
								key={stop.levelId}
								at={{ x: item.center.x + stop.at.x, z: item.center.z + stop.at.z }}
								status={stopStatus[stop.levelId] ?? "locked"}
								color={COLORS[item.color]}
								star={star}
								portrait={portraitOf(stop.levelId)}
								pilot={pilot}
								clock={clock}
								onPick={() => tapStop(index, stop.levelId)}
							/>
						))
					)}
				</group>
			))}
			{shop && shopOn && islandStatus[shopOn.index] !== "locked" && <ShopSign at={{ x: shopOn.center.x + shop.building.x, z: shopOn.center.z + shop.building.z }} top={heightOf(shop.building)} star={star} clock={clock} onPick={tapShop} />}
			<Boat boat={boat} onPick={tapBoat} />
			{cards && <CardPanels world={world} focus={focus} islandStatus={islandStatus} cards={cards} tops={tops} clock={clock} />}
			{trainerPictures && <Trainers world={world} focus={focus} islandStatus={islandStatus} pictures={trainerPictures} tiles={trainerTiles} pilot={pilot} clock={clock} />}
			{avatar && <Hero avatar={avatar} outfit={outfit} world={world} focus={focus} locked={locked} stand={stand} input={input} done={done} moving={moving} boat={boat} sailing={sailing} deck={DECK} pilot={pilot} />}
			<ActionWatch world={world} focus={focus} locked={locked} stopStatus={stopStatus} shop={shopOn?.index === focus ? shop : null} boat={boat} sailing={sailing} pilot={pilot} controls={controls} action={action} />
		</>
	);
}

export default function WorldScene(props: WorldSceneProps) {
	return (
		<Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: FOV, near: 0.5, far: 400, position: [0, 20, 20] }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} aria-hidden>
			<Scene {...props} />
		</Canvas>
	);
}
