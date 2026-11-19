"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { Avatar } from "@/lib/junior/profiles";
import type { Outfit } from "@/lib/junior/world/wardrobe";
import { useHeroFile, useOutfit } from "./hero";

/**
 * The shop's "try it on" view: the child's figure wearing `outfit`, breathing and slowly turning in a small canvas
 * of its own. It is the same figure, dressed by the same code, as on the map, so what the child sees here is what
 * walks about afterwards.
 *
 * It has no size of its own: give it one through `className`. When the device cannot draw 3D (no WebGL, the
 * context is lost, the figure's file does not come), it renders nothing and tells `onFail`, so the shop can show
 * a still picture instead. With reduced motion the figure stands still, a little turned, in its idle pose.
 */
export interface OutfitPreviewProps {
	avatar: Avatar;
	/** What to show on the figure: usually what the child wears, with the item being looked at put on top. */
	outfit?: Outfit;
	className?: string;
	/** False: no turning and no breathing. Left out, the device's reduced-motion setting decides. */
	moving?: boolean;
	/** The figure cannot be shown; nothing is rendered from then on. */
	onFail?: () => void;
	/** Turned by the child (radians from its usual angle): it then stops turning by itself and swings to this angle. */
	heading?: number;
}

/** Turned a little towards the child, as on the map, so the hand and the cape both show. */
const FACING = 0.35;
/** One full turn takes about 14 seconds: slow enough to look at a hat. */
const TURN_SPEED = (Math.PI * 2) / 14;
/** The camera takes in the tallest figure (the Mage under its hat, 3.7 units) holding the longest thing (the staff). */
const CAMERA = { fov: 24, position: [0, 1.9, 8.8] as [number, number, number], target: [0, 1.45, 0] as [number, number, number] };

function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		if (!query) return;
		const read = () => setReduced(query.matches);
		read();
		query.addEventListener("change", read);
		return () => query.removeEventListener("change", read);
	}, []);
	return reduced;
}

function canDraw(): boolean {
	try {
		const canvas = document.createElement("canvas");
		return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
	} catch {
		return false;
	}
}

/** Anything thrown while the canvas is set up or drawn ends the preview, not the shop. */
class Guard extends Component<{ onError: () => void; children: ReactNode }, { broken: boolean }> {
	state = { broken: false };
	static getDerivedStateFromError() {
		return { broken: true };
	}
	componentDidCatch() {
		this.props.onError();
	}
	render() {
		return this.state.broken ? null : this.props.children;
	}
}

/** How fast the figure swings to the angle the child turned it to: most of the way in a quarter of a second. */
const SWING = 10;

function Model({ avatar, outfit, moving, onFail, heading }: { avatar: Avatar; outfit?: Outfit; moving: boolean; onFail: () => void; heading?: number | undefined }) {
	const { invalidate, gl, camera } = useThree();
	const turn = useRef<THREE.Group>(null);
	const gltf = useHeroFile(avatar, onFail);
	useOutfit(gltf, avatar, outfit, invalidate, moving);
	const mixer = useMemo(() => (gltf ? new THREE.AnimationMixer(gltf.scene) : null), [gltf]);

	useEffect(() => {
		camera.lookAt(...CAMERA.target);
		invalidate();
	}, [camera, invalidate]);

	/* The idle clip, from its first frame: never the file's arms-out rest pose, also when nothing moves. */
	useEffect(() => {
		if (!gltf || !mixer) return;
		const clip = THREE.AnimationClip.findByName(gltf.animations, "Idle");
		if (clip) mixer.clipAction(clip).reset().play();
		mixer.setTime(0);
		invalidate();
		return () => {
			mixer.stopAllAction();
		};
	}, [gltf, mixer, invalidate]);

	/* Standing still (reduced motion): the first pose, at the first angle or straight at the one the child chose. */
	useEffect(() => {
		if (moving) return;
		mixer?.setTime(0);
		if (turn.current) turn.current.rotation.y = FACING + (heading ?? 0);
		invalidate();
	}, [moving, mixer, invalidate, heading]);

	/* The context is gone (the tab slept, the device ran out of memory): the shop shows its still picture. */
	useEffect(() => {
		const canvas = gl.domElement;
		const lost = (event: Event) => {
			event.preventDefault();
			onFail();
		};
		canvas.addEventListener("webglcontextlost", lost);
		return () => canvas.removeEventListener("webglcontextlost", lost);
	}, [gl, onFail]);

	useFrame((_, delta) => {
		if (!moving || !mixer) return;
		const dt = Math.min(delta, 0.1);
		mixer.update(dt);
		if (!turn.current) return;
		if (heading === undefined) turn.current.rotation.y += dt * TURN_SPEED;
		else turn.current.rotation.y += (FACING + heading - turn.current.rotation.y) * Math.min(1, dt * SWING);
	});

	if (!gltf) return null;
	return (
		<group ref={turn} rotation-y={FACING}>
			<primitive object={gltf.scene} />
		</group>
	);
}

export function OutfitPreview({ avatar, outfit, className, moving, onFail, heading }: OutfitPreviewProps) {
	const reduced = useReducedMotion();
	const animated = moving ?? !reduced;
	/* Null until the browser has been asked whether it can draw 3D at all. */
	const [able, setAble] = useState<boolean | null>(null);
	const failed = useRef(onFail);
	failed.current = onFail;
	const fail = useMemo(
		() => () => {
			setAble(false);
			failed.current?.();
		},
		[],
	);
	useEffect(() => {
		if (canDraw()) setAble(true);
		else fail();
	}, [fail]);
	if (!able) return null;
	return (
		<div className={className} aria-hidden>
			<Guard onError={fail}>
				{/* The same lights as the map, so a colour looks the same here and there. */}
				<Canvas frameloop={animated ? "always" : "demand"} dpr={[1, 2]} camera={{ fov: CAMERA.fov, near: 0.5, far: 60, position: CAMERA.position }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}>
					<hemisphereLight args={["#e6f6ff", "#7aa35a", 1.5]} />
					<directionalLight position={[-12, 20, 14]} intensity={1.9} color="#fff3dc" />
					<Model avatar={avatar} outfit={outfit} moving={animated} onFail={fail} heading={heading} />
				</Canvas>
			</Guard>
		</div>
	);
}

export default OutfitPreview;
