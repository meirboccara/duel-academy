"use client";

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { View } from "@/lib/junior/play/board3d-camera";
import { CARD, HAND_TILT, TILE, handSlots, rivalHandSlots, spotPoint, type MatLayout, type Point3 } from "@/lib/junior/play/board3d-layout";
import { LUNGE_HIT_SHARE, PIECES, flightAt, knockAt, lungeAt, pieceThrow, type Flight, type Lunge } from "@/lib/junior/play/board3d-moves";
import { shakeAt, type Impact } from "@/lib/junior/play/board3d-show";
import type { CardView, FaceSpec, PlaceView } from "@/lib/junior/play/board3d-view";
import { placeKey } from "@/lib/junior/play/board3d-layout";
import { BACK_COLOR, CardTextures, frameColor, type ZoneSign } from "./card-textures";

/**
 * The duel mat in 3D: a table on the grass of the islands with the real playmat on it (every zone and pile of both
 * players, each printed with its sign and its name, the rival's half turned around as across a real table), and the
 * cards as small slabs with their official art and their numbers. It only draws what it is given (`places`, `hand`) and reports
 * taps; the rules, the choices and the words all stay on the page, whose HTML board remains the real control for a
 * keyboard or a screen reader (this canvas is hidden from them).
 *
 * While a move plays, the cards themselves act it out: a new monster drops into its zone, a monster turned to
 * Defense Position rotates, an attacker rises and charges at its target, the table flashes, bursts and shakes where
 * it hits, a destroyed card breaks into pieces that fly to the Graveyard, and a player's half of the mat flashes red
 * when Life Points are lost. Frames are drawn on demand: while something moves, and a few times a second while a
 * zone glows.
 */

/** One card of the child's hand. */
export interface HandCardView {
	face: FaceSpec;
	state: "plain" | "picked" | "hint";
	/** Cannot be played now: shown darker. */
	dim: boolean;
	/** The keyboard is on its HTML twin. */
	focused: boolean;
	tap?: () => void;
}
/** One move being played: its cards in flight and its attackers, timed from `at` (a `performance.now()`). */
export interface Play {
	id: number;
	at: number;
	flights: readonly Flight[];
	lunges: readonly Lunge[];
	/** The hits of the move: where the table flashes and bursts, and when the camera shakes. */
	impacts: readonly Impact[];
	/** Seconds the scene keeps drawing frames for. */
	length: number;
}
export interface BoardSceneProps {
	view: View;
	layout: MatLayout;
	places: readonly PlaceView[];
	hand: readonly HandCardView[];
	/** How many cards the rival holds: drawn face-down beyond its edge of the mat. */
	rivalHand: number;
	play: Play;
	moving: boolean;
	/** The place the keyboard is on, in the HTML board. */
	focusKey: string | null;
	/** What each flying card shows, by the flight's id. Missing for a face-down card. */
	flightFaces: ReadonlyMap<string, FaceSpec>;
	/** The names printed in the zones of the mat. */
	labels: Readonly<Record<ZoneSign, string>>;
	onLost: () => void;
}

const COLORS = { grass: "#7fca6a", wood: "#a9703f", woodDark: "#8a5830", felt: "#2f8f7c", tile: "#1f5f58", quiet: "#2a7a6c", edge: "#bfe9dc", gold: "#ffd84a", chosen: "#4aa3ff", focus: "#ffffff" } as const;
/** The colour of each kind of hit. */
const HIT = { clash: "#fff3b0", strike: "#ffd84a", hurt: "#ff4d3d", heal: "#5be37a" } as const;
/** How high a card lies above the mat, to its middle. */
const REST = CARD.t / 2 + 0.012;

interface Shared {
	box: THREE.BoxGeometry;
	plane: THREE.PlaneGeometry;
	/** A flat ring, for the light of a hit. */
	ring: THREE.RingGeometry;
	/** The six parts of a card's picture, for a card that breaks. */
	pieces: THREE.PlaneGeometry[];
	textures: CardTextures;
	/** The gold of a zone that would accept what the child holds: it breathes, all zones together. */
	glow: THREE.MeshBasicMaterial;
	back: THREE.MeshLambertMaterial;
}

const stop = (tap: (() => void) | undefined) =>
	tap
		? {
				onClick: (event: ThreeEvent<MouseEvent>) => {
					event.stopPropagation();
					tap();
				},
				onPointerOver: () => {
					document.body.style.cursor = "pointer";
				},
				onPointerOut: () => {
					document.body.style.cursor = "";
				},
			}
		: {};
/** Things that are only looked at let a tap through to the tile under them. */
const noHit = () => null;

/* ---------- One card ---------- */

/** A card lying at the origin, its top away from the player: a slab in its frame's colour and its picture on top. */
function CardBody({ shared, face, backName, dim }: { shared: Shared; face: FaceSpec | null; backName?: string | undefined; dim?: boolean }) {
	const texture = face ? shared.textures.face(face) : shared.textures.back(backName);
	return (
		<>
			<mesh geometry={shared.box} scale={[CARD.w, CARD.t, CARD.h]} raycast={noHit}>
				<meshLambertMaterial color={face ? frameColor(face.card) : BACK_COLOR} />
			</mesh>
			<mesh geometry={shared.plane} position={[0, CARD.t / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[CARD.w * 0.985, CARD.h * 0.985, 1]} raycast={noHit}>
				<meshBasicMaterial map={texture} color={dim ? "#8d93a3" : "#ffffff"} toneMapped={false} />
			</mesh>
		</>
	);
}

const lungeOf = (play: Play, key: string) => play.lunges.filter((item) => item.key === key);
/** The attacks that hit the monster standing in this zone. */
const hitsOn = (play: Play, key: string) => play.lunges.filter((item) => placeKey(item.to) === key);

/**
 * Moves `node` for the attacks its zone makes or takes at time `t`: an attacker rises, grows, charges at its target
 * and comes back; a monster that is hit is knocked back and springs forward again.
 */
function applyBattle(node: THREE.Object3D, base: Point3, layout: MatLayout, lunges: readonly Lunge[], hits: readonly Lunge[], t: number) {
	for (const lunge of lunges) {
		const { reach, lift, grow, lean } = lungeAt((t - lunge.start) / lunge.length);
		if (reach === 0 && lift === 0) continue;
		const to = spotPoint(layout, lunge.to);
		node.position.x += (to.x - base.x) * reach;
		node.position.z += (to.z - base.z) * reach;
		node.position.y += lift * 1.5;
		node.scale.multiplyScalar(1 + grow);
		/* It lifts its far edge, showing its picture to the child as it rises. */
		node.rotation.x = lean * 0.55;
	}
	for (const hit of hits) {
		const knock = knockAt(t - (hit.start + hit.length * LUNGE_HIT_SHARE));
		if (knock === 0) continue;
		const from = spotPoint(layout, hit.from);
		const away = Math.hypot(base.x - from.x, base.z - from.z) || 1;
		node.position.x += ((base.x - from.x) / away) * knock;
		node.position.z += ((base.z - from.z) / away) * knock;
		node.position.y += knock * 0.5;
		node.rotation.z = knock * 0.9;
	}
}

/** A card standing in a zone. It arrives with a small drop, turns when its battle position changes, and charges when it attacks. The rival's cards are turned around, as across a table. */
function ZoneCard({ shared, card, at, zoneKey, flipped, layout, play, moving }: { shared: Shared; card: CardView; at: Point3; zoneKey: string; flipped: boolean; layout: MatLayout; play: Play; moving: boolean }) {
	const group = useRef<THREE.Group>(null);
	const turn = useRef(card.turned ? Math.PI / 2 : 0);
	/* When the card may appear: now, or when the effect that brings it has played. Fixed when the card arrives. */
	const [arrive] = useState(() => (moving ? Math.max(performance.now(), play.at + card.delay * 1000) : 0));
	/* The numbers before an effect, kept until the effect shows the change. */
	const [released, setReleased] = useState<number | null>(null);
	const hold = card.hold;
	useEffect(() => {
		if (!hold) return;
		const timer = setTimeout(() => setReleased(play.id), hold.delay * 1000);
		return () => clearTimeout(timer);
	}, [hold, play.id]);
	const face = hold && released !== play.id ? hold.face : card.face;
	const base = useMemo(() => ({ x: at.x, y: REST + card.under * 0.05, z: at.z }), [at, card.under]);
	const lunges = useMemo(() => lungeOf(play, zoneKey), [play, zoneKey]);
	const hits = useMemo(() => hitsOn(play, zoneKey), [play, zoneKey]);
	const pose = (delta: number) => {
		const node = group.current;
		if (!node) return;
		const now = performance.now();
		const wanted = card.turned ? Math.PI / 2 : 0;
		turn.current = moving ? THREE.MathUtils.damp(turn.current, wanted, 9, delta) : wanted;
		if (Math.abs(turn.current - wanted) < 0.002) turn.current = wanted;
		const landed = moving ? THREE.MathUtils.clamp((now - arrive) / 320, 0, 1) : 1;
		const eased = 1 - (1 - landed) ** 3;
		node.visible = !moving || now >= arrive;
		node.position.set(base.x, base.y + (1 - eased) * 0.9, base.z);
		node.rotation.set(0, turn.current + (flipped ? Math.PI : 0), 0);
		node.scale.setScalar(0.6 + 0.4 * eased);
		if (moving) applyBattle(node, base, layout, lunges, hits, (now - play.at) / 1000);
	};
	useFrame((_, delta) => pose(delta));
	/* Placed before the first picture too, so a card never flashes in the middle of the mat. */
	useLayoutEffect(() => pose(0));
	return (
		<group ref={group}>
			{/* Xyz Materials lie under the monster, a little askew. */}
			{Array.from({ length: card.under }, (_, index) => (
				<mesh key={index} geometry={shared.box} material={shared.back} position={[0.07 * (index + 1), -0.05 * (index + 1), 0.07 * (index + 1)]} scale={[CARD.w, CARD.t, CARD.h]} raycast={noHit} />
			))}
			<CardBody shared={shared} face={face} backName={card.backName} />
		</group>
	);
}

const PIECE_COUNT = PIECES.across * PIECES.down;
const PIECE = { w: CARD.w / PIECES.across, h: CARD.h / PIECES.down };
/** Where piece `index` sits in the whole card. */
const pieceRest = (index: number) => ({ x: ((index % PIECES.across) - (PIECES.across - 1) / 2) * PIECE.w, z: (Math.floor(index / PIECES.across) - (PIECES.down - 1) / 2) * PIECE.h });

/**
 * A card on its way from one place to another: a Tribute, a destroyed monster, a card drawn. A destroyed card is
 * made of six pieces, each with its part of the picture: they jump apart when it breaks, then fly to the Graveyard.
 */
function FlyingCard({ shared, flight, layout, play, face }: { shared: Shared; flight: Flight; layout: MatLayout; play: Play; face: FaceSpec | null }) {
	const group = useRef<THREE.Group>(null);
	const pieces = useRef<(THREE.Group | null)[]>([]);
	const breaks = flight.how === "destroyed";
	const flipped = flight.from.at === "zone" && flight.from.side === "rival";
	const from = useMemo(() => spotPoint(layout, flight.from), [layout, flight]);
	const to = useMemo(() => {
		const point = spotPoint(layout, flight.to);
		/* The middle of the mat is where a Summon scene plays, above the cards. */
		return flight.to.at === "center" ? { ...point, y: 0.9 } : point;
	}, [layout, flight]);
	const key = flight.from.at === "zone" ? placeKey(flight.from) : "";
	const lunges = useMemo(() => (key ? lungeOf(play, key) : []), [play, key]);
	const hits = useMemo(() => (key ? hitsOn(play, key) : []), [play, key]);
	const pose = () => {
		const node = group.current;
		if (!node) return;
		const t = (performance.now() - play.at) / 1000;
		const u = (t - flight.start) / flight.length;
		const step = flightAt(flight.how, u);
		node.visible = step.shown && (flight.stands || u >= 0);
		if (!node.visible) return;
		const base = { x: from.x, y: from.y + REST, z: from.z };
		node.position.set(base.x + (to.x - from.x) * step.along + step.shake, base.y + (to.y - from.y) * step.along + step.arc * 1.3, base.z + (to.z - from.z) * step.along);
		node.rotation.set(0, (flight.turned ? Math.PI / 2 : 0) + (flipped ? Math.PI : 0) + step.spin * Math.PI * 2, step.shake * 1.5);
		node.scale.setScalar(Math.max(0.01, step.scale));
		if (u < 0) applyBattle(node, base, layout, lunges, hits, t);
		if (!breaks) return;
		pieces.current.forEach((piece, index) => {
			if (!piece) return;
			const rest = pieceRest(index);
			const thrown = pieceThrow(index);
			piece.position.set(rest.x + thrown.x * step.burst, thrown.y * step.burst, rest.z + thrown.z * step.burst);
			piece.rotation.set(thrown.turn * step.burst, 0, thrown.turn * 0.7 * step.burst);
		});
	};
	useFrame(pose);
	useLayoutEffect(pose);
	const texture = face ? shared.textures.face(face) : shared.textures.back();
	return (
		<group ref={group}>
			{breaks ? (
				Array.from({ length: PIECE_COUNT }, (_, index) => (
					<group
						key={index}
						ref={(node) => {
							pieces.current[index] = node;
						}}
					>
						<mesh geometry={shared.box} scale={[PIECE.w, CARD.t, PIECE.h]} raycast={noHit}>
							<meshLambertMaterial color={face ? frameColor(face.card) : BACK_COLOR} />
						</mesh>
						<mesh geometry={shared.pieces[index]!} position={[0, CARD.t / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[PIECE.w, PIECE.h, 1]} raycast={noHit}>
							<meshBasicMaterial map={texture} toneMapped={false} />
						</mesh>
					</group>
				))
			) : (
				<CardBody shared={shared} face={face} />
			)}
		</group>
	);
}

/* ---------- Hits ---------- */

const SPARKS = 12;
/**
 * A hit on the table: a ring of light opens where it lands and sparks fly out. When a player loses Life Points,
 * that player's whole half of the mat also flashes red; when they gain some, it glows green.
 */
function Burst({ shared, impact, layout, play }: { shared: Shared; impact: Impact; layout: MatLayout; play: Play }) {
	const root = useRef<THREE.Group>(null);
	const ring = useRef<THREE.Mesh>(null);
	const wash = useRef<THREE.Mesh>(null);
	const sparks = useRef<(THREE.Mesh | null)[]>([]);
	const color = HIT[impact.kind];
	const light = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }), [color]);
	const flood = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false }), [color]);
	useEffect(
		() => () => {
			light.dispose();
			flood.dispose();
		},
		[light, flood],
	);
	const at = useMemo(() => spotPoint(layout, impact.at), [layout, impact]);
	const side = impact.at.at === "lantern" ? impact.at.side : null;
	const life = impact.kind === "heal" ? 0.9 : 0.6;
	const pose = () => {
		const node = root.current;
		if (!node) return;
		const u = ((performance.now() - play.at) / 1000 - impact.time) / life;
		node.visible = u >= 0 && u < 1;
		if (!node.visible) return;
		const fade = (1 - u) * (1 - u);
		light.opacity = fade;
		if (ring.current) ring.current.scale.setScalar(0.4 + (1.6 + impact.power * 1.6) * (1 - (1 - u) ** 3));
		flood.opacity = (impact.kind === "heal" ? 0.32 : 0.55) * Math.sin(Math.min(1, u * 1.4) * Math.PI);
		sparks.current.forEach((spark, index) => {
			if (!spark) return;
			const angle = (index / SPARKS) * Math.PI * 2 + index * 0.7;
			const far = (0.9 + (index % 3) * 0.45) * (0.6 + impact.power) * (1 - (1 - u) ** 2);
			/* Sparks of a hit jump up and fall back; the light of a gain rises. */
			const high = impact.kind === "heal" ? 1.6 * u : 1.5 * Math.sin(u * Math.PI) * (0.5 + (index % 2) * 0.5);
			spark.position.set(Math.cos(angle) * far, 0.25 + high, Math.sin(angle) * far * 0.8);
			spark.rotation.set(u * 9 + index, u * 7, 0);
			spark.scale.setScalar((0.14 + (index % 3) * 0.05) * (1 - u * 0.6));
		});
	};
	useFrame(pose);
	useLayoutEffect(pose);
	const width = layout.maxX - layout.minX;
	const depth = (layout.maxZ - layout.minZ) / 2;
	return (
		<group ref={root} visible={false}>
			{side && (
				<mesh ref={wash} geometry={shared.plane} material={flood} position={[(layout.minX + layout.maxX) / 2, 0.2, side === "you" ? layout.maxZ - depth / 2 : layout.minZ + depth / 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[width + 0.4, depth + 0.2, 1]} raycast={noHit} renderOrder={5} />
			)}
			<group position={[at.x, 0.3, impact.at.at === "lantern" ? at.z + (side === "you" ? -1.2 : 1.2) : at.z]}>
				<mesh ref={ring} geometry={shared.ring} material={light} rotation={[-Math.PI / 2, 0, 0]} raycast={noHit} renderOrder={6} />
				{Array.from({ length: SPARKS }, (_, index) => (
					<mesh
						key={index}
						ref={(node) => {
							sparks.current[index] = node;
						}}
						geometry={shared.box}
						material={light}
						raycast={noHit}
						renderOrder={6}
					/>
				))}
			</group>
		</group>
	);
}

/* ---------- Zones and piles ---------- */

const signOf = (item: PlaceView): ZoneSign => (item.place.extraZone ? "emz" : item.place.pendulum ? "pendulum" : item.place.kind);

function Tile({ shared, item, focused, layout, play, moving, labels }: { shared: Shared; item: PlaceView; focused: boolean; layout: MatLayout; play: Play; moving: boolean; labels: BoardSceneProps["labels"] }) {
	const { place, state, card, quiet } = item;
	const flipped = place.side === "rival";
	const at = useMemo(() => ({ x: place.x, y: 0, z: place.z }), [place]);
	/* A pile a card is flying to shows what it held before, until the card lands. */
	const hold = item.pileHold;
	const [released, setReleased] = useState<number | null>(null);
	useEffect(() => {
		if (!hold) return;
		const timer = setTimeout(() => setReleased(play.id), hold.delay * 1000);
		return () => clearTimeout(timer);
	}, [hold, play.id]);
	const waiting = !!hold && moving && released !== play.id;
	const pile = waiting ? hold : item.pile;
	const stack = pile ? Math.min(pile.count, 20) * 0.022 : 0;
	const sign = signOf(item);
	return (
		<group>
			<group position={[place.x, 0, place.z]}>
				{/* The edge: gold when the zone would accept what is held, blue when it is chosen, white under the keyboard. */}
				{state === "glow" ? (
					<mesh key="glow" geometry={shared.box} material={shared.glow} position={[0, -0.045, 0]} scale={[TILE.w + 0.1, 0.08, TILE.d + 0.1]} raycast={noHit} />
				) : (
					/* Its own key: a mesh that changes between a shared material and one of its own is made anew, not patched. */
					<mesh key={`${state}-${quiet}`} geometry={shared.box} position={[0, -0.05, 0]} scale={[TILE.w, 0.08, TILE.d]} raycast={noHit}>
						<meshBasicMaterial color={state === "chosen" ? COLORS.chosen : COLORS.edge} transparent opacity={state === "chosen" ? 1 : quiet ? 0.22 : 0.55} />
					</mesh>
				)}
				{focused && (
					<mesh geometry={shared.box} position={[0, -0.056, 0]} scale={[TILE.w + 0.24, 0.08, TILE.d + 0.24]} raycast={noHit}>
						<meshBasicMaterial color={COLORS.focus} />
					</mesh>
				)}
				{/* The tile itself takes the tap, for the whole zone: the card on it lets the tap through. A place the level does not use is paler, close to the mat's own colour. */}
				<mesh geometry={shared.box} position={[0, -0.04, 0]} scale={[TILE.w - 0.14, 0.08, TILE.d - 0.14]} {...(item.tap ? stop(item.tap) : { raycast: noHit })}>
					<meshLambertMaterial color={state === "chosen" ? "#2b5f9e" : state === "glow" ? "#7a6a2a" : quiet ? COLORS.quiet : COLORS.tile} />
				</mesh>
				{/* What a real mat prints in the zone: the outline of a card, the sign of the place and its name. Turned around on the rival's half. */}
				<mesh key={`print-${quiet}`} geometry={shared.plane} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, flipped ? Math.PI : 0]} scale={[TILE.w - 0.2, TILE.d - 0.2, 1]} raycast={noHit}>
					<meshBasicMaterial map={shared.textures.zone(sign, labels[sign])} transparent opacity={quiet ? 0.32 : 0.62} depthWrite={false} toneMapped={false} />
				</mesh>
				{pile && pile.count > 0 && (
					<group position={[0, stack / 2, 0]} rotation={[0, flipped ? Math.PI : 0, 0]}>
						<mesh geometry={shared.box} material={shared.back} scale={[CARD.w, stack, CARD.h]} raycast={noHit} />
						<group position={[0, stack / 2 + REST, 0]}>
							<CardBody shared={shared} face={pile.top} />
						</group>
					</group>
				)}
				{/* How many cards the pile holds: a badge standing at its corner, facing the child on both halves. */}
				{pile && (pile.count > 0 || !quiet) && (
					<mesh geometry={shared.plane} position={[TILE.w / 2 - 0.3, stack + 0.34, TILE.d / 2 - 0.2]} rotation={[-0.5, 0, 0]} scale={[0.62, 0.62, 1]} raycast={noHit}>
						<meshBasicMaterial map={shared.textures.count(pile.count)} transparent depthWrite={false} toneMapped={false} />
					</mesh>
				)}
			</group>
			{card && <ZoneCard key={card.id} shared={shared} card={card} at={at} zoneKey={place.key} flipped={flipped} layout={layout} play={play} moving={moving} />}
		</group>
	);
}

/* ---------- The hand ---------- */

function HandCard({ shared, item, at, size, moving }: { shared: Shared; item: HandCardView; at: Point3; size: number; moving: boolean }) {
	const group = useRef<THREE.Group>(null);
	const lift = useRef(0);
	const pose = (delta: number) => {
		const node = group.current;
		if (!node) return;
		const wanted = item.state === "picked" ? 1 : 0;
		lift.current = moving ? THREE.MathUtils.damp(lift.current, wanted, 12, delta) : wanted;
		/* A picked card rises towards the mat, out of the row. */
		node.position.set(at.x, at.y + lift.current * 0.35, at.z - lift.current * 0.3);
	};
	useFrame((_, delta) => pose(delta));
	useLayoutEffect(() => pose(0));
	const rim = item.focused ? COLORS.focus : item.state === "picked" ? COLORS.chosen : null;
	return (
		<group ref={group} rotation={[HAND_TILT, 0, 0]} scale={size}>
			{/* A rim behind the card says it is picked (blue) or the one to play (gold, breathing). */}
			{item.state === "hint" && !item.focused ? (
				<mesh key="glow" geometry={shared.box} material={shared.glow} position={[0, -0.02, 0]} scale={[CARD.w + 0.14, CARD.t, CARD.h + 0.14]} raycast={noHit} />
			) : rim ? (
				<mesh key="rim" geometry={shared.box} position={[0, -0.02, 0]} scale={[CARD.w + 0.14, CARD.t, CARD.h + 0.14]} raycast={noHit}>
					<meshBasicMaterial color={rim} />
				</mesh>
			) : null}
			{/* The card's own slab is the target of the tap. */}
			<mesh geometry={shared.box} scale={[CARD.w, CARD.t * 1.2, CARD.h]} {...(item.tap ? stop(item.tap) : { raycast: noHit })}>
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>
			<CardBody shared={shared} face={item.face} dim={item.dim} />
		</group>
	);
}

/** One card of the rival's hand: face-down, turned towards the rival, as an opponent holds it. */
function RivalHandCard({ shared, at, size }: { shared: Shared; at: Point3; size: number }) {
	return (
		<group position={[at.x, at.y, at.z]} rotation={[0, Math.PI, 0]} scale={size} raycast={noHit}>
			<CardBody shared={shared} face={null} />
		</group>
	);
}

/* ---------- Table and scenery ---------- */

function Table({ shared, layout }: { shared: Shared; layout: MatLayout }) {
	const width = layout.maxX - layout.minX;
	const depth = layout.maxZ - layout.minZ;
	const x = (layout.minX + layout.maxX) / 2;
	const z = (layout.minZ + layout.maxZ) / 2;
	return (
		<group raycast={noHit}>
			<mesh position={[x, -0.62, z + 1]} rotation={[-Math.PI / 2, 0, 0]} raycast={noHit}>
				<planeGeometry args={[240, 240]} />
				<meshLambertMaterial color={COLORS.grass} />
			</mesh>
			<mesh geometry={shared.box} position={[x, -0.36, z]} scale={[width + 1.1, 0.5, depth + 1.1]} raycast={noHit}>
				<meshLambertMaterial color={COLORS.wood} flatShading />
			</mesh>
			<mesh geometry={shared.box} position={[x, -0.13, z]} scale={[width + 0.5, 0.1, depth + 0.5]} raycast={noHit}>
				<meshLambertMaterial color={COLORS.felt} />
			</mesh>
			{/* The child's side of the table reaches under the hand. */}
			<mesh geometry={shared.box} position={[x, -0.5, layout.maxZ + 1.2]} scale={[width + 1.1, 0.22, 2.2]} raycast={noHit}>
				<meshLambertMaterial color={COLORS.woodDark} flatShading />
			</mesh>
		</group>
	);
}

/** Trees, rocks and hills of the island kit around the table. Decoration only: if the kit does not load, the mat is simply bare. */
const SCENERY: readonly { piece: string; x: number; z: number; turn: number; size: number }[] = [
	{ piece: "trees_A_large", x: -1.25, z: -0.95, turn: 0.4, size: 1.7 },
	{ piece: "trees_B_large", x: 1.25, z: -1.0, turn: 2.1, size: 1.7 },
	{ piece: "mountain_A_grass_trees", x: 0, z: -1.5, turn: 0, size: 1.9 },
	{ piece: "hills_A_trees", x: -0.6, z: -1.25, turn: 1.2, size: 1.6 },
	{ piece: "hills_B", x: 0.65, z: -1.3, turn: 4, size: 1.6 },
	{ piece: "trees_A_medium", x: -1.35, z: 0, turn: 3, size: 1.5 },
	{ piece: "trees_B_medium", x: 1.35, z: 0.1, turn: 5, size: 1.5 },
	{ piece: "rock_single_A", x: -1.3, z: 0.75, turn: 1, size: 1.6 },
	{ piece: "tree_single_A", x: 1.32, z: 0.8, turn: 2, size: 1.6 },
];
function Scenery({ layout }: { layout: MatLayout }) {
	const gltf = useLoader(GLTFLoader, "/world/kit.glb", (loader) => {
		loader.setMeshoptDecoder(MeshoptDecoder);
	});
	const { invalidate } = useThree();
	/* Places are given in half-widths and half-depths of the mat, measured from its middle, so they suit both boards. */
	const halfX = (layout.maxX - layout.minX) / 2 + 1.6;
	const halfZ = (layout.maxZ - layout.minZ) / 2 + 1.8;
	const pieces = useMemo(
		() =>
			SCENERY.flatMap((item) => {
				const found = gltf.scene.children.find((child) => child.name === item.piece);
				if (!found) return [];
				const copy = found.clone();
				copy.position.set((layout.minX + layout.maxX) / 2 + item.x * halfX, -0.62, (layout.minZ + layout.maxZ) / 2 + item.z * halfZ);
				copy.rotation.set(0, item.turn, 0);
				copy.scale.setScalar(item.size);
				copy.traverse((object) => {
					object.raycast = noHit;
				});
				return [copy];
			}),
		[gltf, layout, halfX, halfZ],
	);
	useEffect(() => invalidate(), [pieces, invalidate]);
	return (
		<>
			{pieces.map((piece) => (
				<primitive key={piece.uuid} object={piece} />
			))}
		</>
	);
}
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

/* ---------- Camera, frames, loss ---------- */

/**
 * The camera stands where the page worked out, so the HTML effects land on the zones. A hit shakes it for a moment:
 * pushed aside without turning, and back exactly where it stood.
 */
function Camera({ view, play, moving }: { view: View; play: Play; moving: boolean }) {
	const { camera, invalidate } = useThree();
	useLayoutEffect(() => {
		const lens = camera as THREE.PerspectiveCamera;
		lens.fov = view.fov;
		lens.position.set(view.position.x, view.position.y, view.position.z);
		lens.lookAt(view.target.x, view.target.y, view.target.z);
		lens.updateProjectionMatrix();
		invalidate();
	}, [camera, view, invalidate]);
	useFrame(() => {
		const t = (performance.now() - play.at) / 1000;
		const shake = moving ? shakeAt(play.impacts, t) : 0;
		/* The farther the camera, the bigger the push, so the shake looks the same on every screen. */
		const push = shake * view.distance * 0.012;
		camera.position.set(view.position.x + Math.sin(t * 83) * push, view.position.y + Math.sin(t * 67 + 2) * push * 0.6, view.position.z);
	});
	return null;
}

/** Asks for frames while a move plays or a card settles, and a few a second while a zone glows. Otherwise the scene rests. */
function Ticker({ play, moving, glowing, shared, stamp }: { play: Play; moving: boolean; glowing: boolean; shared: Shared; stamp: unknown }) {
	const { invalidate } = useThree();
	const until = useRef(0);
	/* Any change of what is shown may start a small motion (a card picked in the hand, a monster turning). */
	useEffect(() => {
		until.current = Math.max(until.current, performance.now() + 700, moving ? play.at + play.length * 1000 : 0);
		invalidate();
	}, [play, moving, stamp, invalidate]);
	useFrame(() => {
		const now = performance.now();
		shared.glow.color.set(COLORS.gold).multiplyScalar(moving ? 0.8 + 0.2 * Math.sin(now / 260) : 1);
		if (moving && now < until.current) invalidate();
	});
	useEffect(() => {
		if (!moving || !glowing) return;
		const timer = window.setInterval(() => {
			if (document.visibilityState === "visible") invalidate();
		}, 80);
		return () => window.clearInterval(timer);
	}, [moving, glowing, invalidate]);
	return null;
}

/** A lost graphics context puts the HTML board back. Only while the scene lives: closing it loses the context on purpose. */
function LossWatch({ onLost }: { onLost: () => void }) {
	const { gl } = useThree();
	useEffect(() => {
		const canvas = gl.domElement;
		const lost = (event: Event) => {
			event.preventDefault();
			onLost();
		};
		canvas.addEventListener("webglcontextlost", lost);
		return () => {
			canvas.removeEventListener("webglcontextlost", lost);
			document.body.style.cursor = "";
		};
	}, [gl, onLost]);
	return null;
}

function Scene({ view, layout, places, hand, rivalHand, play, moving, focusKey, flightFaces, labels, onLost }: BoardSceneProps) {
	const { invalidate } = useThree();
	/*
	 * Made and disposed by the same effect, not kept in a memo: React's development double mount disposes once and
	 * mounts again, and a memo would hand back the disposed set (its textures would never load again).
	 */
	const [shared, setShared] = useState<Shared | null>(null);
	useEffect(() => {
		const made: Shared = {
			box: new THREE.BoxGeometry(1, 1, 1),
			plane: new THREE.PlaneGeometry(1, 1),
			ring: new THREE.RingGeometry(0.62, 1, 28),
			pieces: Array.from({ length: PIECE_COUNT }, (_, index) => {
				/* Each piece shows its own part of the card's picture: its corner of the texture. */
				const geometry = new THREE.PlaneGeometry(1, 1);
				const uv = geometry.getAttribute("uv");
				const column = index % PIECES.across;
				const row = Math.floor(index / PIECES.across);
				for (let i = 0; i < uv.count; i++) uv.setXY(i, (column + uv.getX(i)) / PIECES.across, 1 - (row + 1 - uv.getY(i)) / PIECES.down);
				return geometry;
			}),
			/* The whole mat's zones are small on the screen: the small pictures are enough for them. */
			textures: new CardTextures(layout.full ? 160 : 480, () => invalidate()),
			glow: new THREE.MeshBasicMaterial({ color: COLORS.gold }),
			back: new THREE.MeshLambertMaterial({ color: BACK_COLOR }),
		};
		setShared(made);
		return () => {
			made.box.dispose();
			made.plane.dispose();
			made.ring.dispose();
			made.pieces.forEach((piece) => piece.dispose());
			made.textures.dispose();
			made.glow.dispose();
			made.back.dispose();
		};
	}, [layout.full, invalidate]);
	const slots = useMemo(() => handSlots(layout, hand.length), [layout, hand.length]);
	const rivalSlots = useMemo(() => rivalHandSlots(layout, rivalHand), [layout, rivalHand]);
	const glowing = places.some((item) => item.state === "glow") || hand.some((item) => item.state === "hint");
	if (!shared) return null;
	return (
		<>
			<hemisphereLight args={["#e6f6ff", "#7aa35a", 1.5]} />
			<directionalLight position={[-12, 20, 14]} intensity={1.9} color="#fff3dc" />
			<Camera view={view} play={play} moving={moving} />
			<LossWatch onLost={onLost} />
			<Ticker play={play} moving={moving} glowing={glowing} shared={shared} stamp={places} />
			<Table shared={shared} layout={layout} />
			<Quiet>
				<Suspense fallback={null}>
					<Scenery layout={layout} />
				</Suspense>
			</Quiet>
			{places.map((item) => (
				<Tile key={item.place.key} shared={shared} item={item} focused={focusKey === item.place.key} layout={layout} play={play} moving={moving} labels={labels} />
			))}
			{rivalSlots.map((at, index) => (
				<RivalHandCard key={`rival-hand-${index}`} shared={shared} at={at} size={layout.rivalHandScale} />
			))}
			{hand.map((item, index) => (
				<HandCard key={`${item.face.card}-${index}`} shared={shared} item={item} at={slots[index]!} size={layout.handScale} moving={moving} />
			))}
			{moving && play.impacts.map((impact) => <Burst key={`${play.id}-${impact.id}`} shared={shared} impact={impact} layout={layout} play={play} />)}
			{moving && play.flights.map((flight) => <FlyingCard key={`${play.id}-${flight.id}`} shared={shared} flight={flight} layout={layout} play={play} face={flightFaces.get(flight.id) ?? null} />)}
		</>
	);
}

export default function BoardScene(props: BoardSceneProps) {
	return (
		<Canvas frameloop="demand" dpr={[1, 2]} camera={{ fov: props.view.fov, near: 0.5, far: 300, position: [props.view.position.x, props.view.position.y, props.view.position.z] }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} aria-hidden>
			<Scene {...props} />
		</Canvas>
	);
}
