/**
 * Builds the six figures a child picks from at New game: `public/world/hero-knight.glb`, `hero-mage.glb`,
 * `hero-rogue.glb`, and the three girls `hero-star.glb`, `hero-witch.glb`, `hero-explorer.glb`.
 *
 * The first three are characters of KayKit's Adventurers pack (CC0, by Kay Lousberg), downloaded at a fixed commit
 * into `.cache/kaykit` (not in git). From each it keeps the body, the hat or helmet and the cape, and the four
 * clips the map plays; every weapon, shield, book and wand goes.
 *
 * The three girls are later KayKit characters by the same author, also CC0: the Magical Girl, the Witch and one of
 * the two Protagonists. KayKit's own GitHub account only publishes the first Adventurers pack, so these come from
 * a mirror of "The Complete KayKit Collection" at a fixed commit, into `.cache/kaykit-collection`; the licence
 * text that came with them is copied beside the figures. Their files carry no clips, but their skeleton is the
 * Adventurers' own (the same bones in the same places, without the extra helper bones), so each girl is given the
 * Knight's four clips: all six figures then move alike and wear the same things.
 *
 * It also builds `public/world/hero-wardrobe.glb`: the hats, a cape and the things to hold that Grandpa's shop
 * sells (`src/lib/junior/world/wardrobe.ts`). They are not in the figures' files, so a child who buys nothing
 * downloads nothing more; the map fetches this one file the first time a figure wears something from it. Each
 * mesh sits at the top of the file, placed as it was under its bone, and says in its `extras.bone` which bone
 * of the shared skeleton it hangs from (the head, the chest, or a hand). One piece is not from a pack: the dorm cap,
 * a plain peaked cap whose shape is worked out here (`dormCap`), light grey so the app can lay a dorm's colour on it.
 * The Explorer's pack came with nothing to hold, so her lantern, compass and spyglass are worked out here too
 * (`BUILT`), from turned shapes in plain colours.
 *
 * Everything is compressed with Meshopt. The packs are never edited by hand: run `pnpm world:heroes` again after
 * changing the lists below, then `node scripts/world/render-hero-stills.mjs` for the still pictures of the choice
 * screen.
 */
import { mkdir, readFile, writeFile, access, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, getBounds, mergeDocuments, meshopt, prune, resample, unpartition } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const COMMIT = "672074b73ba276876a19e8816ecdc5241817ab47";
const BASE = `https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/${COMMIT}`;
const CHARACTERS = `${BASE}/addons/kaykit_character_pack_adventures/Characters/gltf`;
const CACHE = join(APP, ".cache", "kaykit", COMMIT);
const OUT = join(APP, "public", "world");

/* The mirror of the whole KayKit collection, where the girls and their things come from. Paths are relative to `assets/kaykit`. */
const COLLECTION_COMMIT = "af08a62d3669370ec4636ae6314b38cdcd5dd759";
const COLLECTION_REPO = `https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/${COLLECTION_COMMIT}`;
const COLLECTION_CACHE = join(APP, ".cache", "kaykit-collection", COLLECTION_COMMIT);
const WITCH = "mystery-monthly-series-5/5 - November 2024 - Witch";
const MAGICAL_GIRL = "mystery-monthly-series-6/11 - May 2026 - Magical Girl";
const PROTAGONISTS = "mystery-monthly-series-5/10 - April 2025 - Protagonists";
const CLOWN = "mystery-monthly-series-4/11 - May 2024 - Clown";

const HEROES = { knight: "Knight", mage: "Mage", rogue: "Rogue" };
/** The girls: the avatar id, the name its mesh nodes start with, and its file in the collection. */
const GIRLS = {
	star: { name: "MagicalGirl", path: `${MAGICAL_GIRL}/characters/MagicalGirl.glb` },
	witch: { name: "Witch", path: `${WITCH}/characters/Witch.glb` },
	explorer: { name: "Protagonist_A", path: `${PROTAGONISTS}/characters/Protagonist_A.glb` },
};
/** Mesh nodes kept, after the character's name: the six body parts, and what is worn. Everything else is held in a hand. */
const KEEP = ["Body", "Head", "ArmLeft", "ArmRight", "LegLeft", "LegRight", "Helmet", "Hat", "Cape"];
const CLIPS = ["Idle", "Walking_A", "Cheer", "Interact"];
/** The character whose clips the girls borrow. */
const CLIP_DONOR = "Knight";
const LIMIT = 500_000;
/** The shop's hats, capes and held things that are parts of a character's file. Keep in step with HAT_MESH, HELD_MESH and CAPE_MESH in `wardrobe.ts`. */
const WARDROBE = {
	Knight: ["Knight_Helmet", "Knight_Cape", "1H_Sword", "2H_Sword", "Round_Shield", "Badge_Shield"],
	Mage: ["Mage_Hat", "1H_Wand", "2H_Staff", "Spellbook_open"],
	Rogue: ["1H_Crossbow", "2H_Crossbow", "Knife", "Knife_Offhand", "Throwable"],
};
/** Things that are files of their own in the collection (a .gltf with its .bin and its picture): the node to take, and the hand it goes in. */
const PROPS = [
	{ path: `${MAGICAL_GIRL}/assets/gltf/MagicalGirl_Wand.gltf`, bone: "handslot.r" },
	{ path: `${WITCH}/assets/gltf/Broom.gltf`, bone: "handslot.r" },
	{ path: `${WITCH}/assets/gltf/Basket_Mushrooms.gltf`, bone: "handslot.l" },
	{ path: `${WITCH}/assets/gltf/Mushroom.gltf`, bone: "handslot.l" },
	{ path: `${WITCH}/assets/gltf/Cauldron.gltf`, bone: "handslot.l" },
	{ path: `${CLOWN}/assets/gltf/balloon_dog_blue.gltf`, bone: "handslot.l" },
];
const WARDROBE_LIMIT = 300_000;
/**
 * The dorm cap, in the head bone's own space (the head is about 1.1 across, its middle about 0.5 above the bone):
 * a crown that is the top of an egg shape, a peak in front, and a button on top. `tilt` leans it back a little, as
 * a child wears a cap. Keep the name in step with HAT_MESH in `wardrobe.ts`.
 */
const CAP = { name: "Dorm_Cap", centre: [0, 0.7, 0.04], radii: [0.56, 0.46, 0.6], peak: { halfWidth: 0.4, length: 0.46, thick: 0.06, droop: 0.3 }, tilt: -0.1 };

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
async function fetchTo(url, path) {
	if (await exists(path)) return false;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, Buffer.from(await response.arrayBuffer()));
	return true;
}
const collectionUrl = (path) => `${COLLECTION_REPO}/${`assets/kaykit/${path}`.split("/").map(encodeURIComponent).join("/")}`;
const collectionFile = (path) => join(COLLECTION_CACHE, ...path.split("/"));

/* 1. Fetch: each character is one .glb with its texture inside; a prop is a .gltf that names its other files. */
let downloaded = 0;
if (await fetchTo(`${BASE}/LICENSE.txt`, join(CACHE, "LICENSE.txt"))) downloaded++;
for (const name of Object.values(HEROES)) if (await fetchTo(`${CHARACTERS}/${name}.glb`, join(CACHE, `${name}.glb`))) downloaded++;
if (await fetchTo(`${COLLECTION_REPO}/LICENSES/KayKit-CC0-License.txt`, join(COLLECTION_CACHE, "LICENSE.txt"))) downloaded++;
for (const girl of Object.values(GIRLS)) if (await fetchTo(collectionUrl(girl.path), collectionFile(girl.path))) downloaded++;
for (const prop of PROPS) {
	if (await fetchTo(collectionUrl(prop.path), collectionFile(prop.path))) downloaded++;
	const folder = prop.path.slice(0, prop.path.lastIndexOf("/"));
	const json = JSON.parse(await readFile(collectionFile(prop.path), "utf8"));
	for (const part of [...(json.buffers ?? []), ...(json.images ?? [])]) {
		if (!part.uri || part.uri.startsWith("data:")) continue;
		const path = `${folder}/${decodeURIComponent(part.uri)}`;
		if (await fetchTo(collectionUrl(path), collectionFile(path))) downloaded++;
	}
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
await mkdir(OUT, { recursive: true });

function dropAnimation(animation) {
	for (const channel of animation.listChannels()) channel.dispose();
	for (const sampler of animation.listSamplers()) sampler.dispose();
	animation.dispose();
}

/** Drops what is unused (the bones stay: the clips move them), thins the keyframes, compresses, writes, and reads the file back, as the app will, to say what is really in it. */
async function finish(hero, id, name, removed) {
	const root = hero.getRoot();
	const missing = CLIPS.filter((clip) => !root.listAnimations().some((animation) => animation.getName() === clip));
	if (missing.length) throw new Error(`${name}: missing clips ${missing.join(", ")}`);
	/* A girl's file now holds two buffers (hers and the clips'): one file takes one. */
	await hero.transform(unpartition(), resample(), dedup(), prune({ keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: "high" }));
	const bytes = await io.writeBinary(hero);
	if (bytes.length >= LIMIT) throw new Error(`${name}: ${bytes.length} bytes, over the ${LIMIT} limit`);
	await writeFile(join(OUT, `hero-${id}.glb`), bytes);
	const written = await io.read(join(OUT, `hero-${id}.glb`));
	const bounds = getBounds(written.getRoot().listScenes()[0]);
	return {
		bytes: bytes.length,
		clips: written.getRoot().listAnimations().map((animation) => animation.getName()),
		meshes: written.getRoot().listNodes().filter((node) => node.getMesh()).map((node) => node.getName()),
		removed,
		joints: written.getRoot().listSkins()[0]?.listJoints().length ?? 0,
		height: Number((bounds.max[1] - bounds.min[1]).toFixed(3)),
	};
}

const report = { downloaded, heroes: {} };
for (const [id, name] of Object.entries(HEROES)) {
	const hero = await io.read(join(CACHE, `${name}.glb`));
	const root = hero.getRoot();

	/* 2. Trim: only the worn meshes stay, and only the clips the map plays. */
	const keep = new Set(KEEP.map((part) => `${name}_${part}`));
	const removed = [];
	for (const node of root.listNodes()) {
		if (!node.getMesh() || keep.has(node.getName())) continue;
		removed.push(node.getName());
		node.dispose();
	}
	for (const animation of root.listAnimations()) if (!CLIPS.includes(animation.getName())) dropAnimation(animation);
	report.heroes[id] = await finish(hero, id, name, removed);
}

/* 3. The girls: the whole figure stays (nothing is held in their files), and the donor's clips are moved onto their bones. */
for (const [id, girl] of Object.entries(GIRLS)) {
	const hero = await io.read(collectionFile(girl.path));
	const root = hero.getRoot();
	const own = { nodes: new Set(root.listNodes()), skins: new Set(root.listSkins()), scenes: new Set(root.listScenes()) };
	const bones = new Map(root.listNodes().filter((node) => !node.getMesh()).map((node) => [node.getName(), node]));

	const donor = await io.read(join(CACHE, `${CLIP_DONOR}.glb`));
	for (const node of donor.getRoot().listNodes()) if (node.getMesh()) node.dispose();
	for (const animation of donor.getRoot().listAnimations()) if (!CLIPS.includes(animation.getName())) dropAnimation(animation);
	mergeDocuments(hero, donor);
	/* A clip moves bones by name. The donor's helper bones have no twin here: what moved them is dropped. */
	let moved = 0;
	const dropped = new Set();
	for (const animation of root.listAnimations()) {
		for (const channel of animation.listChannels()) {
			const bone = bones.get(channel.getTargetNode()?.getName());
			if (bone) {
				channel.setTargetNode(bone);
				moved++;
			} else {
				dropped.add(channel.getTargetNode()?.getName());
				const sampler = channel.getSampler();
				channel.dispose();
				sampler?.dispose();
			}
		}
	}
	for (const skin of root.listSkins()) if (!own.skins.has(skin)) skin.dispose();
	for (const node of root.listNodes()) if (!own.nodes.has(node)) node.dispose();
	for (const scene of root.listScenes()) if (!own.scenes.has(scene)) scene.dispose();
	report.heroes[id] = { ...(await finish(hero, id, girl.name, [])), channels: moved, droppedBones: dropped.size };
}

/* 4. The wardrobe: from each character only the sold meshes, lifted out of the skeleton, then all in one file. */
let wardrobe = null;
/** Adds a document, of which only the `kept` nodes stay (with what hangs under them), at the top of its scene. */
function intoWardrobe(source, kept) {
	const root = source.getRoot();
	const scene = root.listScenes()[0];
	for (const animation of root.listAnimations()) dropAnimation(animation);
	for (const skin of root.listSkins()) skin.dispose();
	const under = (node) => kept.includes(node) || (!!node.getParentNode() && under(node.getParentNode()));
	for (const node of root.listNodes()) if (!under(node)) node.dispose();
	for (const node of kept) scene.addChild(node);
	if (!wardrobe) {
		wardrobe = source;
		return;
	}
	const map = mergeDocuments(wardrobe, source);
	const into = wardrobe.getRoot().listScenes()[0];
	for (const node of kept) into.addChild(map.get(node));
	for (const extra of wardrobe.getRoot().listScenes().slice(1)) extra.dispose();
}
for (const [name, wanted] of Object.entries(WARDROBE)) {
	const source = await io.read(join(CACHE, `${name}.glb`));
	const kept = [];
	for (const mesh of wanted) {
		const node = source.getRoot().listNodes().find((candidate) => candidate.getName() === mesh && candidate.getMesh());
		const bone = node?.getParentNode();
		if (!node || !bone) throw new Error(`${name}: no mesh ${mesh} under a bone`);
		/* Its place under the bone is kept as it is: the app hangs it under the same bone of whichever figure wears it. */
		node.setExtras({ bone: bone.getName() });
		bone.removeChild(node);
		kept.push(node);
	}
	intoWardrobe(source, kept);
}
for (const prop of PROPS) {
	const source = await io.read(collectionFile(prop.path));
	/* One thing, sometimes in two parts (the basket and its handle): the part at the top carries the other. */
	const nodes = source.getRoot().listNodes().filter((candidate) => candidate.getMesh() && !candidate.getParentNode());
	if (nodes.length !== 1) throw new Error(`${prop.path}: ${nodes.length} top meshes, one expected`);
	nodes[0].setExtras({ bone: prop.bone });
	intoWardrobe(source, nodes);
}

/** The dorm cap's two parts as plain triangle lists: the cloth of the crown, and the darker peak and button. */
function dormCap() {
	const part = () => ({ positions: [], normals: [], indices: [] });
	const cloth = part();
	const trim = part();
	const unit = (x, y, z) => {
		const length = Math.hypot(x, y, z) || 1;
		return [x / length, y / length, z / length];
	};
	/* The top of an egg shape, from its pole down to `down` radians. Seen from outside, the triangles turn anticlockwise. */
	const dome = (into, centre, radii, down, around = 16, rings = 5) => {
		const base = into.positions.length / 3;
		for (let ring = 0; ring <= rings; ring++) {
			const theta = (ring / rings) * down;
			for (let step = 0; step < around; step++) {
				const phi = (step / around) * Math.PI * 2;
				const dir = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
				into.positions.push(centre[0] + dir[0] * radii[0], centre[1] + dir[1] * radii[1], centre[2] + dir[2] * radii[2]);
				into.normals.push(...unit(dir[0] / radii[0], dir[1] / radii[1], dir[2] / radii[2]));
			}
		}
		for (let ring = 0; ring < rings; ring++) {
			for (let step = 0; step < around; step++) {
				const a = base + ring * around + step;
				const b = base + ring * around + ((step + 1) % around);
				into.indices.push(a, b, a + around, b, b + around, a + around);
			}
		}
	};
	dome(cloth, CAP.centre, CAP.radii, Math.PI / 2);
	dome(trim, [CAP.centre[0], CAP.centre[1] + CAP.radii[1] - 0.02, CAP.centre[2]], [0.09, 0.05, 0.09], Math.PI / 2, 8, 2);

	/* The peak: half a flat disc sticking out in front (+z), a little thick, drooping towards its tip. It starts inside the crown. */
	const { halfWidth, length, thick, droop } = CAP.peak;
	const start = CAP.centre[2] + CAP.radii[2] * 0.72;
	const steps = 10;
	const rim = [];
	for (let step = 0; step <= steps; step++) {
		const angle = (step / steps) * Math.PI;
		const z = Math.sin(angle) * length;
		rim.push([Math.cos(angle) * halfWidth, CAP.centre[1] + 0.02 - z * droop, start + z, angle]);
	}
	const face = (dy, normal, flip) => {
		const base = trim.positions.length / 3;
		trim.positions.push(0, CAP.centre[1] + 0.02 + dy, start);
		trim.normals.push(...normal);
		for (const [x, y, z] of rim) {
			trim.positions.push(x, y + dy, z);
			trim.normals.push(...normal);
		}
		for (let step = 0; step < steps; step++) trim.indices.push(base, base + 1 + (flip ? step : step + 1), base + 1 + (flip ? step + 1 : step));
	};
	face(0, unit(0, 1, droop), false);
	face(-thick, unit(0, -1, -droop), true);
	const edge = trim.positions.length / 3;
	for (const [x, y, z, angle] of rim) {
		const normal = unit(Math.cos(angle) / halfWidth, 0, Math.sin(angle) / length);
		trim.positions.push(x, y, z, x, y - thick, z);
		trim.normals.push(...normal, ...normal);
	}
	for (let step = 0; step < steps; step++) {
		const a = edge + step * 2;
		trim.indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
	}
	return { cloth, trim };
}

/**
 * A turned shape, as on a lathe: `profile` is a line of [radius, height] points, spun about the y axis. Drawn from
 * the bottom up along the outside, its faces look outwards; each stretch of the line is flat-shaded, as the packs'
 * own low-poly pieces are. With `lying`, the shape is laid down so its axis points forwards (+z). `at` moves it.
 */
function lathe(into, profile, { around = 10, lying = false, at = [0, 0, 0] } = {}) {
	const put = (list, x, y, z, moved) => (lying ? list.push(x + (moved ? at[0] : 0), -z + (moved ? at[1] : 0), y + (moved ? at[2] : 0)) : list.push(x + (moved ? at[0] : 0), y + (moved ? at[1] : 0), z + (moved ? at[2] : 0)));
	for (let stretch = 0; stretch < profile.length - 1; stretch++) {
		const [r0, y0] = profile[stretch];
		const [r1, y1] = profile[stretch + 1];
		const length = Math.hypot(r1 - r0, y1 - y0) || 1;
		const out = (y1 - y0) / length;
		const up = -(r1 - r0) / length;
		const base = into.positions.length / 3;
		for (const [radius, height] of [[r0, y0], [r1, y1]]) {
			for (let step = 0; step < around; step++) {
				const phi = (step / around) * Math.PI * 2;
				put(into.positions, radius * Math.cos(phi), height, radius * Math.sin(phi), true);
				put(into.normals, out * Math.cos(phi), up, out * Math.sin(phi), false);
			}
		}
		for (let step = 0; step < around; step++) {
			const a = base + step;
			const b = base + ((step + 1) % around);
			into.indices.push(a, a + around, b, b, a + around, b + around);
		}
	}
}
/** A ring (the lantern's handle), as a turned shape: a small circle spun about the axis. */
const hoop = (radius, thick, sides = 6) => Array.from({ length: sides + 1 }, (_, index) => [radius + thick * Math.cos((index / sides) * Math.PI * 2), thick * Math.sin((index / sides) * Math.PI * 2)]);
/**
 * The things worked out here instead of taken from a pack: each a few turned shapes in plain colours (sRGB hex).
 * They are sized for a hand of the figures (a hand is about 0.3 across) and stand on the bone's origin. Keep the
 * names in step with HELD_MESH in `wardrobe.ts`.
 */
const IRON = "#3b3d4a";
const BRASS = "#c9973a";
const BUILT = [
	{
		name: "Explorer_Lantern",
		bone: "handslot.l",
		parts: [
			{ colour: IRON, shapes: [{ profile: [[0, 0], [0.17, 0], [0.17, 0.06], [0.13, 0.06]] }, { profile: [[0.13, 0.36], [0.18, 0.36], [0.06, 0.48], [0, 0.48]] }, { profile: hoop(0.09, 0.02), around: 12, lying: true, at: [0, 0.56, 0] }] },
			{ colour: "#ffd66b", shapes: [{ profile: [[0.12, 0.06], [0.12, 0.36]], around: 8 }] },
		],
	},
	{
		name: "Explorer_Compass",
		bone: "handslot.l",
		parts: [
			{ colour: BRASS, shapes: [{ profile: [[0, 0], [0.21, 0], [0.21, 0.07], [0.17, 0.07]], around: 14 }] },
			{ colour: "#f4ecd6", shapes: [{ profile: [[0.17, 0.05], [0, 0.05]], around: 14 }] },
			{ colour: "#d83a3a", shapes: [{ profile: [[0, -0.15], [0.035, 0], [0, 0.15]], around: 4, lying: true, at: [0, 0.07, 0] }] },
		],
	},
	{
		name: "Explorer_Spyglass",
		bone: "handslot.r",
		parts: [
			{ colour: "#7a4a2a", shapes: [{ profile: [[0, -0.2], [0.075, -0.2], [0.075, 0.12]] }, { profile: [[0.058, 0.12], [0.058, 0.38]] }] },
			{ colour: BRASS, shapes: [{ profile: [[0.085, 0.1], [0.085, 0.15], [0.058, 0.15]] }, { profile: [[0.068, 0.36], [0.068, 0.41], [0.045, 0.41]] }, { profile: [[0.045, 0.41], [0.045, 0.6], [0.06, 0.6], [0.06, 0.64], [0, 0.64]] }] },
		],
	},
];
const linear = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255).map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
{
	const buffer = wardrobe.getRoot().listBuffers()[0];
	const accessor = (array, type) => wardrobe.createAccessor().setArray(array).setType(type).setBuffer(buffer);
	const primitive = (part, material) =>
		wardrobe.createPrimitive().setAttribute("POSITION", accessor(new Float32Array(part.positions), "VEC3")).setAttribute("NORMAL", accessor(new Float32Array(part.normals), "VEC3")).setIndices(accessor(new Uint16Array(part.indices), "SCALAR")).setMaterial(material);
	const plain = (name, rgb) => wardrobe.createMaterial(name).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(1).setMetallicFactor(0);
	const scene = wardrobe.getRoot().listScenes()[0];
	/* Greys: the app replaces them by the dorm's colour, lighter on the cloth than on the peak. */
	const { cloth, trim } = dormCap();
	const mesh = wardrobe.createMesh(CAP.name).addPrimitive(primitive(cloth, plain("cap_cloth", [0.33, 0.33, 0.33]))).addPrimitive(primitive(trim, plain("cap_peak", [0.17, 0.17, 0.17])));
	scene.addChild(wardrobe.createNode(CAP.name).setMesh(mesh).setExtras({ bone: "head" }).setRotation([Math.sin(CAP.tilt / 2), 0, 0, Math.cos(CAP.tilt / 2)]));
	const colours = new Map();
	for (const thing of BUILT) {
		const made = wardrobe.createMesh(thing.name);
		for (const part of thing.parts) {
			const into = { positions: [], normals: [], indices: [] };
			for (const shape of part.shapes) lathe(into, shape.profile, shape);
			if (!colours.has(part.colour)) colours.set(part.colour, plain(`plain_${part.colour.slice(1)}`, linear(part.colour)));
			made.addPrimitive(primitive(into, colours.get(part.colour)));
		}
		scene.addChild(wardrobe.createNode(thing.name).setMesh(made).setExtras({ bone: thing.bone }));
	}
}
await wardrobe.transform(unpartition(), dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
const wardrobeBytes = await io.writeBinary(wardrobe);
if (wardrobeBytes.length >= WARDROBE_LIMIT) throw new Error(`wardrobe: ${wardrobeBytes.length} bytes, over the ${WARDROBE_LIMIT} limit`);
await writeFile(join(OUT, "hero-wardrobe.glb"), wardrobeBytes);
const wardrobeWritten = await io.read(join(OUT, "hero-wardrobe.glb"));
report.wardrobe = {
	bytes: wardrobeBytes.length,
	meshes: Object.fromEntries(wardrobeWritten.getRoot().listNodes().filter((node) => node.getExtras().bone).map((node) => [node.getName(), node.getExtras().bone])),
	textures: wardrobeWritten.getRoot().listTextures().map((texture) => [texture.getName(), texture.getImage()?.length]),
};

await copyFile(join(CACHE, "LICENSE.txt"), join(OUT, "KAYKIT-ADVENTURERS-LICENSE.txt"));
await copyFile(join(COLLECTION_CACHE, "LICENSE.txt"), join(OUT, "KAYKIT-COLLECTION-LICENSE.txt"));
console.log(JSON.stringify(report, null, "\t"));
