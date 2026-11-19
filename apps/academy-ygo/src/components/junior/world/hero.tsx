"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Avatar } from "@/lib/junior/profiles";
import { pathLength, walkSeconds } from "@/lib/junior/world/hero-path";
import { lookKey, outfitLook, OWN_HAT, type EffectKind, type OutfitEffect } from "@/lib/junior/world/outfit-look";
import { type Outfit, suits, wardrobeItem } from "@/lib/junior/world/wardrobe";
import type { Hex, Point } from "@/lib/junior/world/hex";
import { towardsSea } from "@/lib/junior/world/map-places";
import { nearestWalkable, pathBetween, spotOf, stepTowards } from "@/lib/junior/world/walk-graph";
import type { World } from "@/lib/junior/world/world";
import type { MapInput } from "./map-input";

/**
 * The child's figure on the map: one of six KayKit characters (knight, mage, rogue; star, witch, explorer), with empty hands.
 *
 * It is fetched after the islands are on screen, by its own loader, so it never holds the map back and a failed
 * download only means no figure. Where it first stands is derived from progress: beside the stop of the last
 * solved level of the island in view, or on the dock. While the boat sails, it rides the boat; on arrival it walks
 * up the road to its stop. It cheers once when a level or an island is finished.
 *
 * The child moves it: a tap on the island sends it to the nearest free tile (the scene passes the wish through
 * the `pilot`), and the arrow keys, W A S D or the on-screen direction pad step it from tile to tile. It only ever
 * stands on walkable tiles (`walk-graph.ts`). Where the child leaves it is not saved. With reduced motion it is
 * placed, in a still pose, and jumps instead of walking.
 *
 * Standing on a stop opens nothing: the scene's action button does. From the dock the figure can step back into
 * the boat: by pressing towards the sea, or when the scene orders it to board.
 *
 * What the child bought for it in Grandpa's shop is its `outfit`: a colour over the body, a colour over the cape,
 * another hat, something in the hand. Changing it never reloads the figure: colours are two numbers given to the
 * figure's own materials, and hats and held things are small meshes hung on the bones, from one extra file
 * (`hero-wardrobe.glb`) fetched the first time any of them is worn. A special held thing also carries a little
 * magic (a flame, sparks, bubbles): a handful of unlit shapes drawn here, with no light and no texture.
 */
export interface HeroProps {
	avatar: Avatar;
	world: World;
	focus: number;
	/** The island in view is still under mist: the figure waits in the boat. */
	locked: boolean;
	/** The step of the island's walk the figure waits at (`restIndex`). */
	stand: number;
	/** What the keyboard and the direction pad are asking for. */
	input: React.RefObject<MapInput>;
	/** How many islands are finished: when it grows, the figure cheers. */
	done: number;
	moving: boolean;
	boat: React.RefObject<THREE.Group | null>;
	/** True while the boat is at sea. */
	sailing: React.RefObject<boolean>;
	/** Height of the boat's deck above the boat's own origin. */
	deck: number;
	pilot: React.RefObject<Pilot>;
	/** What the figure wears from the shop. Nothing: its own look. */
	outfit?: Outfit;
}

/** What the scene and the figure tell each other, outside React: it changes many times a second. */
export interface Pilot {
	/** "none": no figure was asked for. "failed": its file did not load, so the map behaves as if there were none. */
	state: "none" | "loading" | "ready" | "failed";
	/** The child's wish, from a tap: go to this tile, and then maybe do something there (open the shop), or step into the boat. */
	order: { hex: Hex; stop?: string; then?: () => void; board?: boolean } | null;
	/** The stop the figure is walking to because it was tapped. */
	walkingTo: string | null;
	/** Where the figure is while it is on the island in view (world position); null in the boat. The camera follows it. */
	at: THREE.Vector3 | null;
	/** The tile the figure stands on, when it stands still on the island in view. */
	tile: Hex | null;
	/** The child put the figure in the boat (on an island that is awake; on one asleep it is always in the boat). */
	aboard: boolean;
	/** The child has steered the boat away from the harbour of the island in view. */
	adrift: boolean;
	/** Where the figure goes when it leaves the boat: just onto the dock, or up the road to where it waits. */
	ashore: "dock" | "road";
	/** The child's wish for the boat: moor at this island's harbour. */
	wish: { index: number } | null;
}
export const newPilot = (): Pilot => ({ state: "none", order: null, walkingTo: null, at: null, tile: null, aboard: false, adrift: false, ashore: "road", wish: null });

/** The pack's figures are about 2.5 units tall; a tile is 2 across. At this size a child finds it at once among the buildings. */
const HERO_SCALE = 0.68;
const FADE = 0.2;
/** Standing still, the figure looks at the camera, turned a little. */
const FACING = 0.3;
/** Where the figure stands in the boat: behind the mast. */
const SEAT = -0.45;
/** One tile by key takes this long; a held key walks on at this pace. */
const STEP_SECONDS = 0.34;
/** A tapped walk covers this many units a second, and never lasts longer than the caps below. */
const TAP_SPEED = 3.8;
const TAP_SECONDS = 2.2;
/** To a tapped stop the walk is short: the level is waiting. */
const STOP_SECONDS = 1.5;
/** The hop from the dock into the boat. */
const BOARD_SECONDS = 0.45;
/** The walking clip matches about this many units a second at the figure's size. */
const STRIDE = 2.2;
type ClipName = "Idle" | "Walking_A" | "Cheer";

/** Loads the figure's file once the scene is up. Null while loading, and for good after a failure, which `onFail` hears of. */
export function useHeroFile(avatar: Avatar, onFail: () => void): GLTF | null {
	const [file, setFile] = useState<{ avatar: Avatar; gltf: GLTF } | null>(null);
	const failed = useRef(onFail);
	failed.current = onFail;
	useEffect(() => {
		let alive = true;
		const release = (gltf: GLTF) => {
			const seen = new Set<THREE.Material>();
			gltf.scene.traverse((object) => {
				/* A worn hat or held thing shares its shape and material with the page's wardrobe, kept for the next figure. */
				if (!(object instanceof THREE.Mesh) || isWorn(object)) return;
				object.geometry.dispose();
				for (const material of [object.material].flat() as THREE.MeshLambertMaterial[]) seen.add(material);
			});
			for (const material of seen) {
				(material as THREE.MeshLambertMaterial).map?.dispose();
				material.dispose();
			}
		};
		let loaded: GLTF | null = null;
		try {
			new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
				`/world/hero-${avatar}.glb`,
				(gltf) => {
					try {
						dress(gltf);
					} catch (error) {
						console.warn("Island world: the figure could not be prepared and is left out.", error);
						release(gltf);
						if (alive) failed.current();
						return;
					}
					if (!alive) return release(gltf);
					loaded = gltf;
					setFile({ avatar, gltf });
				},
				undefined,
				(error) => {
					console.warn("Island world: the figure could not be loaded and is left out.", error);
					if (alive) failed.current();
				},
			);
		} catch (error) {
			console.warn("Island world: the figure could not be loaded and is left out.", error);
			failed.current();
		}
		return () => {
			alive = false;
			if (loaded) release(loaded);
		};
	}, [avatar]);
	return file?.avatar === avatar ? file.gltf : null;
}

/** The same matt look as the islands: one Lambert material carrying the figure's own small texture. */
function dress(gltf: GLTF) {
	const made = new Map<THREE.Material, THREE.MeshLambertMaterial>();
	gltf.scene.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		const old = object.material as THREE.MeshStandardMaterial;
		let material = made.get(old);
		if (!material) {
			/* A piece without a texture (the glasses) is given none: three.js warns about a `map` that is set but undefined. */
			material = new THREE.MeshLambertMaterial(old.map ? { map: old.map, color: "#ffffff" } : { color: old.color });
			/* The Witch's glasses: the lenses stay see-through. */
			if (old.transparent && old.opacity < 1) {
				material.transparent = true;
				material.opacity = old.opacity;
				material.depthWrite = false;
			}
			made.set(old, material);
			old.dispose();
		}
		/* The body and the cape can be given a colour: each gets a material of its own, so nothing else changes colour with it. */
		object.material = TINTED.test(object.name) ? tintable(material) : material;
		/* Bones move the mesh away from the box it was measured in: never cull it by mistake. */
		object.frustumCulled = false;
	});
}

/** The parts of a figure a shop colour goes over: the shirt is the body, and the cape. */
const TINTED = /_(Body|Cape)$/;
/** How much of the colour shows: a little of the figure's own colours stays, so the body does not turn into one flat patch. */
const TINT_AMOUNT = 0.82;
interface Tint {
	colour: { value: THREE.Color };
	amount: { value: number };
}

/**
 * A copy of the material that can be recoloured without being rebuilt. Multiplying the colour over the figure's
 * painted texture would turn it muddy (red over blue is nearly black), so the texture is replaced by the colour,
 * made lighter or darker as the texture was: folds, belts and trims stay readable.
 */
function tintable(base: THREE.MeshLambertMaterial): THREE.MeshLambertMaterial {
	const material = base.clone();
	const tint: Tint = { colour: { value: new THREE.Color("#ffffff") }, amount: { value: 0 } };
	material.userData.tint = tint;
	material.onBeforeCompile = (shader) => {
		shader.uniforms.outfitColour = tint.colour;
		shader.uniforms.outfitAmount = tint.amount;
		shader.fragmentShader = shader.fragmentShader
			.replace("#include <common>", "#include <common>\nuniform vec3 outfitColour;\nuniform float outfitAmount;")
			.replace(
				"#include <map_fragment>",
				"#include <map_fragment>\n\tfloat outfitLight = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );\n\tdiffuseColor.rgb = mix( diffuseColor.rgb, outfitColour * mix( 0.5, 1.3, smoothstep( 0.0, 0.6, outfitLight ) ), outfitAmount );",
			);
	};
	/* Not the same program as the plain material's. */
	material.customProgramCacheKey = () => "outfit-tint";
	return material;
}

/** Whether an object sits in a worn thing's holder (see `useOutfit`). */
function isWorn(object: THREE.Object3D): boolean {
	for (let at: THREE.Object3D | null = object; at; at = at.parent) if (at.userData.worn) return true;
	return false;
}

const WARDROBE_URL = "/world/hero-wardrobe.glb";
/** The shop's hats and held things, by mesh name, each placed as it sits under its bone. Fetched once for the whole page, and kept. */
let wardrobe: Promise<Map<string, THREE.Object3D>> | null = null;
function loadWardrobe(): Promise<Map<string, THREE.Object3D>> {
	if (wardrobe) return wardrobe;
	const loading = new GLTFLoader()
		.setMeshoptDecoder(MeshoptDecoder)
		.loadAsync(WARDROBE_URL)
		.then((gltf) => {
			dress(gltf);
			return new Map(gltf.scene.children.map((child) => [child.name, child]));
		});
	wardrobe = loading;
	/* A failed download is tried again the next time something is worn. */
	loading.catch(() => {
		if (wardrobe === loading) wardrobe = null;
	});
	return loading;
}

/** How each kind of magic is drawn: how many moving pieces, their shape, and whether a glowing heart sits at its place. */
const EFFECT_LOOK: Readonly<Record<EffectKind, { count: number; shape: "orb" | "shard" | "heart"; heart: boolean; glow: boolean }>> = {
	flame: { count: 9, shape: "shard", heart: true, glow: true },
	sparks: { count: 7, shape: "shard", heart: true, glow: true },
	orbit: { count: 5, shape: "shard", heart: true, glow: true },
	twinkle: { count: 7, shape: "shard", heart: false, glow: false },
	hearts: { count: 5, shape: "heart", heart: false, glow: false },
	rainbow: { count: 7, shape: "orb", heart: true, glow: true },
	bubbles: { count: 6, shape: "orb", heart: false, glow: false },
	smoke: { count: 6, shape: "orb", heart: false, glow: false },
	lamp: { count: 0, shape: "orb", heart: true, glow: true },
};
const RAINBOW = ["#ff4d4d", "#ff9f3a", "#ffe14a", "#5fd65a", "#45c8ff", "#5a6cff", "#b566ff"];
/** The pose shown when nothing may move: a moment of the effect that reads well as a still. */
const STILL_TIME = 0.37;
/** The effects' few shapes, made once for the page and kept: they are tiny, and every effect shares them. */
let effectShapes: Record<"orb" | "shard" | "heart", THREE.BufferGeometry> | null = null;
function shapesOfEffects() {
	if (effectShapes) return effectShapes;
	const heart = new THREE.Shape();
	heart.moveTo(0, -0.9);
	heart.bezierCurveTo(-1.5, 0.1, -0.6, 1.2, 0, 0.4);
	heart.bezierCurveTo(0.6, 1.2, 1.5, 0.1, 0, -0.9);
	effectShapes = { orb: new THREE.IcosahedronGeometry(1, 2), shard: new THREE.OctahedronGeometry(1, 0), heart: new THREE.ShapeGeometry(heart, 5) };
	return effectShapes;
}
/** A number between 0 and 1 that looks random and is always the same for the same `n`: the effects need no real chance. */
const chance = (n: number) => {
	const x = Math.sin(n * 127.1) * 43758.5453;
	return x - Math.floor(x);
};

/**
 * One effect, as a group to put beside the piece that carries it. Its pieces are unlit, so they glow against the
 * lit figure, and they are moved in `onBeforeRender`: only when the scene draws, at no cost otherwise. With
 * `still` they are placed once and left there. `materials` collects what must be thrown away with it.
 */
function makeEffect(effect: OutfitEffect, still: boolean, materials: THREE.Material[]): THREE.Group {
	const look = EFFECT_LOOK[effect.kind];
	const shapes = shapesOfEffects();
	const size = effect.size ?? 0.08;
	const group = new THREE.Group();
	const at = new THREE.Vector3(...effect.at);
	const to = new THREE.Vector3(...(effect.to ?? effect.at));
	const along = !!effect.to;
	const paint = (colour: string, opacity = 1, additive = false) => {
		const see = opacity < 1 || additive;
		const material = new THREE.MeshBasicMaterial({ color: colour, transparent: see, opacity, depthWrite: !see, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide });
		materials.push(material);
		return material;
	};
	const piece = (shape: THREE.BufferGeometry, material: THREE.Material) => {
		const mesh = new THREE.Mesh(shape, material);
		/* Small and always near the figure: never worth a culling test, and `onBeforeRender` must run. */
		mesh.frustumCulled = false;
		group.add(mesh);
		return mesh;
	};
	const soft = effect.kind === "smoke" ? 0.55 : effect.kind === "bubbles" ? 0.75 : 1;
	const shared = effect.kind === "rainbow" ? null : paint(effect.colour, soft);
	const parts = Array.from({ length: look.count }, (_, index) => piece(shapes[look.shape], shared ?? paint(RAINBOW[index % RAINBOW.length] ?? effect.colour)));
	/* A line of fire has no single heart: the glow would sit at one end of the blade. */
	const heart = look.heart && !along ? piece(shapes.orb, paint(effect.second ?? effect.colour)) : null;
	const glow = look.glow && !along ? piece(shapes.orb, paint(effect.second ?? effect.colour, 0.28, true)) : null;
	heart?.position.copy(at);
	glow?.position.copy(at);

	const turned = new THREE.Quaternion();
	const up = new THREE.Vector3();
	const base = new THREE.Vector3();
	const pose = (time: number, camera?: THREE.Camera) => {
		/* "Up" for a flame is the world's up, whichever way the hand holds the piece. */
		group.getWorldQuaternion(turned).invert();
		up.set(0, 1, 0).applyQuaternion(turned);
		parts.forEach((part, index) => {
			const share = index / look.count;
			const seed = chance(index + 1);
			/* Along a blade the pieces are spread evenly: left to chance, they bunch at one end. */
			base.lerpVectors(at, to, along ? (index + 0.5) / look.count : seed);
			let scale = size;
			switch (effect.kind) {
				case "flame": {
					const life = (time * 1.5 + share) % 1;
					part.position.copy(base).addScaledVector(up, life * size * (along ? 3 : 5));
					part.position.x += Math.sin(time * 9 + index * 2.3) * size * 0.45;
					part.position.z += Math.cos(time * 7 + index * 1.7) * size * 0.45;
					part.rotation.set(0, time * 3 + index, 0);
					part.scale.set(size * (1 - life) * 0.9, size * (1 - life) * 1.7, size * (1 - life) * 0.9);
					return;
				}
				case "sparks": {
					/* A new crackle twelve times a second: each flash jumps to a new place, or goes out. */
					const beat = Math.floor(time * 12);
					const reach = chance(index * 13.7 + beat * 3.1);
					part.position.set(chance(index + beat * 1.3) - 0.5, chance(index * 2.7 + beat) - 0.5, chance(index * 5.1 + beat * 0.7) - 0.5).normalize().multiplyScalar(size * (1.2 + 2.4 * reach)).add(at);
					part.rotation.set(reach * 6, chance(index + beat) * 6, reach * 3);
					scale = chance(index * 3.3 + beat * 1.9) > 0.4 ? size * (0.3 + 0.5 * reach) : 0;
					part.scale.set(scale * 0.3, scale * 2.2, scale * 0.3);
					return;
				}
				case "orbit": {
					const angle = time * 1.6 + share * Math.PI * 2;
					part.position.set(Math.cos(angle), Math.sin(angle * 2 + index) * 0.4, Math.sin(angle)).multiplyScalar(size * 2.7).add(at);
					part.rotation.set(time * 2 + index, time * 3, 0);
					scale = size * 0.45;
					break;
				}
				case "rainbow": {
					const angle = time * 2 + share * Math.PI * 2;
					part.position.set(Math.cos(angle), Math.sin(angle), 0).multiplyScalar(size * 3).add(at);
					scale = size * 0.6;
					break;
				}
				case "twinkle": {
					part.position.set(chance(index + 3) - 0.5, chance(index + 5) - 0.5, chance(index + 9) - 0.5).multiplyScalar(size * 4).add(base);
					part.rotation.set(0, time * 2 + index, Math.PI / 4);
					scale = size * 1.4 * Math.max(0, Math.sin(time * 3.2 + index * 2.1));
					part.scale.set(scale * 0.55, scale, scale * 0.55);
					return;
				}
				case "hearts": {
					const life = (time * 0.45 + share) % 1;
					part.position.set(Math.cos(share * Math.PI * 2), 0, Math.sin(share * Math.PI * 2)).multiplyScalar(size * 2.4).add(at).addScaledVector(up, life * size * 8);
					/* A heart is flat: it always faces the child. */
					if (camera) part.quaternion.copy(turned).multiply(camera.quaternion);
					scale = size * Math.sin(Math.PI * life);
					break;
				}
				case "bubbles":
				case "smoke": {
					const smoke = effect.kind === "smoke";
					const life = (time * (smoke ? 0.5 : 0.65) + share) % 1;
					part.position.set(chance(index + 7) - 0.5, 0, chance(index + 11) - 0.5).multiplyScalar(size * (smoke ? 2 : 3)).add(base).addScaledVector(up, life * size * (smoke ? 5 : 7));
					part.position.x += Math.sin(time * 2 + index) * size * 0.5;
					/* Smoke swells and thins out; a bubble grows a little and pops near the top. */
					scale = smoke ? size * 1.3 * Math.sin(Math.PI * life) : life > 0.92 ? 0 : size * (0.4 + 0.5 * seed) * (0.6 + 0.4 * life);
					break;
				}
				default:
					return;
			}
			part.scale.setScalar(scale);
		});
		const flicker = effect.kind === "flame" || effect.kind === "lamp" || effect.kind === "sparks" ? 1 + 0.14 * Math.sin(time * 11) + 0.09 * Math.sin(time * 17.3) : 1 + 0.08 * Math.sin(time * 3);
		heart?.scale.setScalar(size * (effect.kind === "rainbow" || effect.kind === "flame" ? 0.7 : 1) * flicker);
		glow?.scale.setScalar(size * 1.9 * flicker);
	};
	pose(STILL_TIME);
	/* Any one piece drives all of them. Under reduced motion it only turns the hearts to the camera, on the first drawing. */
	const driver = parts[0] ?? heart;
	let seen = false;
	if (driver) {
		driver.onBeforeRender = (_renderer, _scene, camera) => {
			if (still && seen) return;
			seen = true;
			pose(still ? STILL_TIME : performance.now() / 1000, camera);
		};
	}
	return group;
}

/**
 * Makes the figure wear `outfit`. Colours and the figure's own hat change at once. A hat or a held thing from the
 * wardrobe file appears when that file has come; until then, and if it never comes, the figure keeps its own hat
 * and an empty hand. `redraw` asks for a frame (the map draws on demand). The magic of a special held thing moves
 * only while `moving` is true and the device does not ask for reduced motion; otherwise it is a still picture.
 */
export function useOutfit(gltf: GLTF | null, avatar: Avatar, outfit: Outfit | undefined, redraw: () => void, moving = true) {
	const key = lookKey(outfitLook(avatar, outfit));
	const draw = useRef(redraw);
	draw.current = redraw;
	useEffect(() => {
		if (!gltf) return;
		const look = outfitLook(avatar, outfit);
		const ownHat = OWN_HAT[avatar] ? gltf.scene.getObjectByName(OWN_HAT[avatar]) : undefined;
		gltf.scene.traverse((object) => {
			const part = TINTED.exec(object.name)?.[1];
			const tint = object instanceof THREE.Mesh ? ((object.material as THREE.Material).userData.tint as Tint | undefined) : undefined;
			if (!part || !tint) return;
			const hex = part === "Body" ? look.shirt : look.cape;
			if (hex) tint.colour.value.set(hex);
			tint.amount.value = hex ? TINT_AMOUNT : 0;
		});
		const newHat = look.attach.some((item) => item.bone === "head");
		/* Its own hat stays on until the new one is there to take its place. */
		if (ownHat && !newHat) ownHat.visible = look.ownHat;
		draw.current();
		if (!look.attach.length) return;
		let alive = true;
		let still = !moving;
		try {
			still ||= window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		} catch {
			/* No such question on this device: the caller's word stands. */
		}
		const worn: THREE.Object3D[] = [];
		const coloured: THREE.Material[] = [];
		loadWardrobe().then(
			(meshes) => {
				if (!alive) return;
				for (const item of look.attach) {
					const bone = gltf.scene.getObjectByName(item.bone);
					const mesh = meshes.get(item.mesh);
					if (!bone || !mesh) {
						console.warn(`Island world: ${item.mesh} cannot be worn and is left out.`);
						continue;
					}
					/* The copy shares the shape and the material of the one kept for the page. It sits in a holder, which carries the fit. */
					const holder = new THREE.Group();
					holder.userData.worn = true;
					const copy = mesh.clone();
					holder.add(copy);
					if (item.fit?.scale) holder.scale.setScalar(item.fit.scale);
					if (item.fit?.turn) holder.rotation.set(...item.fit.turn, "ZYX");
					if (item.fit?.move) holder.position.set(...item.fit.move);
					/* A lent cape takes the colour bought: it gets a material of its own, thrown away with it. */
					if (item.tint) {
						const hex = item.tint;
						copy.traverse((part) => {
							if (!(part instanceof THREE.Mesh)) return;
							const material = tintable(part.material as THREE.MeshLambertMaterial);
							const tint = material.userData.tint as Tint;
							tint.colour.value.set(hex);
							tint.amount.value = TINT_AMOUNT;
							part.material = material;
							coloured.push(material);
						});
					}
					bone.add(holder);
					worn.push(holder);
					/* Its magic rides in the holder, so it turns and moves with the piece. */
					for (const effect of item.effects ?? []) holder.add(makeEffect(effect, still, coloured));
					if (item.bone === "head" && ownHat) ownHat.visible = false;
				}
				draw.current();
			},
			(error) => console.warn("Island world: the figure's hat and held things could not be loaded and are left out.", error),
		);
		return () => {
			alive = false;
			for (const copy of worn) copy.removeFromParent();
			for (const material of coloured) material.dispose();
		};
		/* `key` stands for `outfit`: a new object saying the same thing changes nothing. */
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gltf, avatar, key, moving]);
}

interface Walk {
	curve: THREE.CatmullRomCurve3;
	elapsed: number;
	duration: number;
	/** The tile the figure is on once the walk ends. */
	to: Hex;
	/** A step by key moves at a steady pace; other walks start and end gently. */
	byKey: boolean;
	cheer: boolean;
	/** The stop tapped, and what to do on arrival. */
	stop?: string;
	then?: () => void;
	/** The hop into the boat: at its end the figure is aboard. */
	board?: boolean;
}

/** Turn `from` towards `to` by the short way round. */
function turnTowards(from: number, to: number, k: number) {
	const diff = THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
	return Math.abs(diff) < 0.01 ? to : from + diff * k;
}

function Figure({ gltf, avatar, outfit, world, focus, locked, stand, input: keys, done, moving, boat, sailing, deck, pilot }: HeroProps & { gltf: GLTF }) {
	const { invalidate } = useThree();
	useOutfit(gltf, avatar, outfit, invalidate, moving);
	const held = outfit?.held ? wardrobeItem(outfit.held) : undefined;
	const sparkling = !!held?.special && suits(held, avatar);
	const root = useRef<THREE.Group>(null);
	const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf]);
	const actions = useMemo(() => {
		const find = (name: ClipName) => {
			const clip = THREE.AnimationClip.findByName(gltf.animations, name);
			return clip ? mixer.clipAction(clip) : null;
		};
		const cheer = find("Cheer");
		if (cheer) {
			cheer.setLoop(THREE.LoopOnce, 1);
			cheer.clampWhenFinished = true;
		}
		return { Idle: find("Idle"), Walking_A: find("Walking_A"), Cheer: cheer };
	}, [gltf, mixer]);
	/** What is playing, where the figure is, and what it still has to do. Kept out of React: it changes every frame. */
	const live = useRef({
		playing: null as ClipName | null,
		cheering: false,
		cheerDue: false,
		first: true,
		/** The tile the figure is on (or last left), when it is on an island. */
		land: null as { island: number; hex: Hex } | null,
		walk: null as Walk | null,
		done,
		/** The standing place progress asked for, the last time it was looked at: a change means a level was solved. */
		asked: null as { island: number; stand: number } | null,
		at: new THREE.Vector3(),
	});
	const play = (name: ClipName, speed = 1) => {
		const state = live.current;
		const next = actions[name];
		if (!next) return;
		next.timeScale = speed;
		if (state.playing === name) return;
		const before = state.playing ? actions[state.playing] : null;
		next.reset().setEffectiveWeight(1).play();
		if (before) {
			next.fadeIn(FADE);
			before.fadeOut(FADE);
		}
		state.playing = name;
	};

	/* The cheer plays once, then the figure breathes again. */
	useEffect(() => {
		const finished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== actions.Cheer) return;
			live.current.cheering = false;
			invalidate();
		};
		mixer.addEventListener("finished", finished);
		return () => mixer.removeEventListener("finished", finished);
	}, [mixer, actions, invalidate]);

	/* Reduced motion: one still frame of the idle pose (never the file's arms-out rest pose), and no clip runs. */
	useEffect(() => {
		const state = live.current;
		if (!moving) {
			mixer.stopAllAction();
			state.playing = null;
			state.cheering = false;
			state.cheerDue = false;
			actions.Idle?.reset().setEffectiveWeight(1).play();
			mixer.setTime(0);
			state.playing = "Idle";
		}
		invalidate();
	}, [moving, mixer, actions, invalidate]);

	/* An island was finished: cheer, once the child is looking at the map again. */
	useEffect(() => {
		const state = live.current;
		if (done > state.done && moving) state.cheerDue = true;
		state.done = done;
		invalidate();
	}, [done, moving, invalidate]);

	/* A new place to stand, or the file has just arrived: draw. */
	useEffect(() => {
		invalidate();
	}, [focus, stand, locked, gltf, invalidate]);

	/* Gone (another figure, or the map closed): the camera has nothing to follow. */
	useEffect(() => {
		const shared = pilot.current;
		return () => {
			shared.at = null;
			shared.tile = null;
			shared.walkingTo = null;
		};
	}, [pilot]);

	useFrame((frame, delta) => {
		const node = root.current;
		if (!node) return;
		/* Hidden during a level, the canvas measures 0 × 0: the walk and the cheer wait for the child to come back. */
		if (frame.size.width === 0 || frame.size.height === 0) {
			/* A level opened (the canvas is hidden): what a tapped walk was to open is forgotten, so it never opens a second time on the way back. */
			if (live.current.walk) live.current.walk.then = undefined;
			pilot.current.order = null;
			return;
		}
		const state = live.current;
		const shared = pilot.current;
		const dt = Math.min(delta, 0.1);
		const island = world.islands[focus]!;
		const boatNode = boat.current;
		const k = 1 - Math.exp(-dt * 12);
		const standHex = island.walk[stand] ?? island.dock;
		let busy = false;

		const onMap = (point: Point) => new THREE.Vector3(island.center.x + point.x, 0, island.center.z + point.z);
		const ride = () => {
			if (!boatNode) return;
			const turn = boatNode.rotation.y;
			node.position.set(boatNode.position.x + Math.sin(turn) * SEAT, boatNode.position.y + deck, boatNode.position.z + Math.cos(turn) * SEAT);
			/* At sea the figure looks where the boat goes; moored, at the child. */
			node.rotation.y = sailing.current || shared.adrift ? turn : turnTowards(node.rotation.y, FACING, k);
			state.land = null;
			state.walk = null;
			/* A wish made before the boat left is forgotten. */
			shared.order = null;
		};
		const place = (hex: Hex) => {
			node.position.copy(onMap(spotOf(island, hex)));
			node.rotation.y = FACING;
			state.land = { island: focus, hex };
			state.walk = null;
		};
		/** The tile under the figure's feet, also in the middle of a walk. */
		const here = (): Hex => (state.walk ? nearestWalkable(island, { x: node.position.x - island.center.x, z: node.position.z - island.center.z }) : null) ?? state.land?.hex ?? island.dock;
		const start = (points: THREE.Vector3[], to: Hex, seconds: (length: number) => number, extra: Partial<Walk> = {}) => {
			/* A curve cannot pass twice through the same point. */
			const spread = points.filter((point, i) => i === 0 || point.distanceTo(points[i - 1]!) > 0.02);
			const length = pathLength(spread);
			if (spread.length < 2 || length < 0.05) {
				place(to);
				state.cheerDue ||= !!extra.cheer;
				extra.then?.();
				return;
			}
			state.walk = { curve: new THREE.CatmullRomCurve3(spread, false, "centripetal"), elapsed: 0, duration: seconds(length), to, byKey: false, cheer: false, ...extra };
		};
		/** Walk from where the figure is to a tile, over free tiles. With no way there (it cannot happen on these islands), what was to follow still does. */
		const go = (to: Hex, seconds: (length: number) => number, extra: Partial<Walk> = {}) => {
			const path = pathBetween(island, here(), to);
			if (!path) return extra.then?.();
			start([node.position.clone(), ...path.slice(1).map((hex) => onMap(spotOf(island, hex))), ...(path.length === 1 ? [onMap(spotOf(island, to))] : [])], to, seconds, extra);
		};
		/** From the dock into the boat: a hop, or at once with reduced motion. */
		const embark = () => {
			if (!boatNode || !state.land || state.land.hex.q !== island.dock.q || state.land.hex.r !== island.dock.r) return;
			keys.current.once = null;
			if (!moving) {
				shared.aboard = true;
				return;
			}
			const turn = boatNode.rotation.y;
			const seat = new THREE.Vector3(boatNode.position.x + Math.sin(turn) * SEAT, deck, boatNode.position.z + Math.cos(turn) * SEAT);
			const from = node.position.clone();
			start([from, from.clone().lerp(seat, 0.5).setY(0.85), seat], island.dock, () => BOARD_SECONDS, { board: true });
		};
		const byKey = () => {
			const direction = keys.current.once ?? keys.current.held;
			keys.current.once = null;
			if (!direction) return;
			const from = here();
			const next = stepTowards(island, from, direction);
			if (next) go(next, () => STEP_SECONDS, { byKey: true });
			else if (!state.walk && from.q === island.dock.q && from.r === island.dock.r && towardsSea(island, direction)) embark();
		};

		const order = shared.order;
		/* Leaving the boat on the island it is moored at puts the figure on the dock; after a trip it goes up the road to where it waits. */
		const landing = !state.land && !state.first && shared.ashore === "dock" ? island.dock : standHex;
		if (!moving) {
			/* Reduced motion: the figure is placed, and a tap or a key makes it jump. */
			if (locked || shared.aboard) ride();
			else {
				const asked = state.asked;
				if (!state.land || state.land.island !== focus || state.walk) place(landing);
				else if (asked && asked.island === focus && asked.stand !== stand) place(standHex);
				shared.ashore = "road";
				if (order) {
					shared.order = null;
					if (pathBetween(island, state.land!.hex, order.hex)) place(order.hex);
					if (order.board) embark();
					else order.then?.();
				} else if (keys.current.once) {
					const next = stepTowards(island, state.land!.hex, keys.current.once);
					if (next) place(next);
					else if (towardsSea(island, keys.current.once)) embark();
				}
			}
		} else if (sailing.current || locked || shared.aboard) ride();
		else if (!state.land || state.land.island !== focus) {
			/* The map has just opened (or the island changed with no trip): the figure is simply there. Off the boat: a small jump ashore, then the road. */
			if (state.first || state.land) place(standHex);
			else {
				const road = (pathBetween(island, island.dock, landing) ?? [island.dock]).map((hex) => onMap(spotOf(island, hex)));
				const from = node.position.clone();
				state.land = { island: focus, hex: island.dock };
				start([from, from.clone().lerp(road[0]!, 0.5).setY(0.7), ...road], landing, walkSeconds);
			}
			shared.ashore = "road";
		} else if (state.walk?.board) {
			/* Half way into the boat: nothing else until the figure is aboard. */
			shared.order = null;
		} else if (state.asked && state.asked.island === focus && state.asked.stand !== stand) {
			/* A level was solved: on to the next stop, and a cheer when that is further along. */
			go(standHex, walkSeconds, { cheer: stand > state.asked.stand });
		} else if (order) {
			shared.order = null;
			if (order.board) go(order.hex, (length) => Math.min(STOP_SECONDS, Math.max(0.3, length / TAP_SPEED)), { then: embark });
			else go(order.hex, (length) => Math.min(order.stop ? STOP_SECONDS : TAP_SECONDS, Math.max(0.3, length / TAP_SPEED)), { stop: order.stop, then: order.then });
		} else if (keys.current.once || (keys.current.held && !state.walk)) {
			/* A key takes over from a tapped walk, but lets its own step finish. */
			if (!state.walk?.byKey) byKey();
		}
		state.first = false;
		state.asked = locked ? null : { island: focus, stand };
		/* A key pressed in the middle of a step waits for the step to end; any other is used up now. */
		if (!state.walk?.byKey) keys.current.once = null;

		const walk = state.walk;
		if (walk) {
			walk.elapsed += dt;
			const raw = Math.min(1, walk.elapsed / walk.duration);
			const eased = walk.byKey ? raw : raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
			const point = walk.curve.getPointAt(eased);
			const ahead = walk.curve.getPointAt(Math.min(1, eased + 0.02));
			node.position.copy(point);
			if (ahead.distanceTo(point) > 0.001) node.rotation.y = turnTowards(node.rotation.y, Math.atan2(ahead.x - point.x, ahead.z - point.z), k);
			if (raw >= 1) {
				state.land = { island: focus, hex: walk.to };
				state.cheerDue ||= walk.cheer;
				state.walk = null;
				if (walk.board) {
					/* Aboard: from the next frame on the figure rides the boat. */
					shared.aboard = true;
					shared.adrift = false;
				} else walk.then?.();
				/* A key still held: straight on to the next tile, with no pause between steps. */
				if (walk.byKey && !state.walk && (keys.current.once || keys.current.held) && !shared.order) byKey();
			}
			busy = true;
		} else if (state.land) {
			const turned = turnTowards(node.rotation.y, FACING, k);
			if (turned !== node.rotation.y) busy = true;
			node.rotation.y = turned;
		}
		shared.walkingTo = state.walk?.stop ?? null;
		/* The figure moved (a jump, with reduced motion, moves it without a walk): one more frame, so the camera, which looks first, sees it. */
		if (state.land && (!shared.at || !state.at.equals(node.position))) busy = true;
		shared.at = state.land ? state.at.copy(node.position) : null;
		shared.tile = state.land && !state.walk ? state.land.hex : null;

		if (moving) {
			/* Without a Cheer clip the cheer is simply skipped, or frames would be asked for forever. */
			if (state.cheerDue && !actions.Cheer) state.cheerDue = false;
			if (state.cheerDue && !state.walk && actions.Cheer) {
				state.cheerDue = false;
				state.cheering = true;
				state.playing = null;
				mixer.stopAllAction();
				actions.Cheer.reset().setEffectiveWeight(1).play();
				state.playing = "Cheer";
			}
			if (state.walk) {
				state.cheering = false;
				/* Steps keep up with the ground covered. */
				play("Walking_A", THREE.MathUtils.clamp(state.walk.curve.getLength() / state.walk.duration / STRIDE, 1, 2.4));
			} else if (!state.cheering) play("Idle");
			mixer.update(dt);
			if (state.cheering || state.cheerDue) busy = true;
		}
		/* The map draws only when something moves: a held thing's flames or sparks keep it drawing, unless motion is off. */
		if (busy || shared.order || (moving && sparkling)) invalidate();
	});

	return (
		<group ref={root} scale={HERO_SCALE}>
			<primitive object={gltf.scene} />
		</group>
	);
}

export function Hero({ avatar, ...rest }: HeroProps) {
	const { invalidate } = useThree();
	const { pilot } = rest;
	const [failed, setFailed] = useState<Avatar | null>(null);
	const gltf = useHeroFile(avatar, () => setFailed(avatar));
	/* The scene learns that a figure is on its way, has come, could not come, or is gone. */
	useEffect(() => {
		const shared = pilot.current;
		shared.state = gltf ? "ready" : failed === avatar ? "failed" : "loading";
		invalidate();
		return () => {
			shared.state = "none";
			shared.order = null;
		};
	}, [pilot, gltf, failed, avatar, invalidate]);
	if (!gltf) return null;
	return <Figure key={avatar} gltf={gltf} avatar={avatar} {...rest} />;
}
