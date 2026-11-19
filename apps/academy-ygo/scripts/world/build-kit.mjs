/**
 * Builds `public/world/kit.glb`, the one model file of the Junior island world.
 *
 * It downloads the pieces listed in `src/lib/junior/world/kit-pieces.json` from KayKit's Medieval Hexagon pack
 * (CC0, by Kay Lousberg) at a fixed commit, into `.cache/kaykit` (not in git). Then it puts every piece in one
 * scene, one node per piece named after it, shares the single colour texture, and compresses the geometry with
 * Meshopt. The pack is never edited by hand: run `pnpm world:kit` again after changing the piece list.
 */
import { mkdir, readFile, writeFile, access, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, mergeDocuments, meshopt, prune, unpartition } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const COMMIT = "84fa4e91af6a88989be7c99e0891cede11f2ca38";
const BASE = `https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0/${COMMIT}`;
const ASSETS = `${BASE}/addons/kaykit_medieval_hexagon_pack/Assets/gltf`;
const CACHE = join(APP, ".cache", "kaykit", COMMIT);
const OUT = join(APP, "public", "world");

const pieces = JSON.parse(await readFile(join(APP, "src", "lib", "junior", "world", "kit-pieces.json"), "utf8"));

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
async function fetchTo(url, path) {
	if (await exists(path)) return;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

/* 1. Fetch: each piece is a .gltf with its .bin, and all share one PNG texture. */
await fetchTo(`${BASE}/LICENSE.txt`, join(CACHE, "LICENSE.txt"));
for (const relative of Object.values(pieces)) {
	const folder = dirname(relative);
	await fetchTo(`${ASSETS}/${relative}`, join(CACHE, relative));
	await fetchTo(`${ASSETS}/${relative.replace(/\.gltf$/, ".bin")}`, join(CACHE, relative.replace(/\.gltf$/, ".bin")));
	await fetchTo(`${ASSETS}/${folder}/hexagons_medieval.png`, join(CACHE, folder, "hexagons_medieval.png"));
}

/* 2. Merge: one scene, one node per piece, named after the piece. */
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const kit = new Document();
kit.createBuffer();
const scene = kit.createScene("kit");
kit.getRoot().setDefaultScene(scene);
for (const [name, relative] of Object.entries(pieces)) {
	const source = await io.read(join(CACHE, relative));
	/* A piece is one root node; some (towers) carry child nodes. The app merges everything under the root. */
	const roots = source.getRoot().listScenes()[0].listChildren();
	const map = mergeDocuments(kit, source);
	const node = kit.createNode(name);
	for (const root of roots) node.addChild(map.get(root));
	scene.addChild(node);
}
for (const extra of kit.getRoot().listScenes()) if (extra !== scene) extra.dispose();

/* 3. Share the texture and material, drop what is unused, compress. */
await kit.transform(unpartition(), dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, "kit.glb"), await io.writeBinary(kit));
await copyFile(join(CACHE, "LICENSE.txt"), join(OUT, "KAYKIT-LICENSE.txt"));

const report = {
	pieces: scene.listChildren().length,
	materials: kit.getRoot().listMaterials().length,
	textures: kit.getRoot().listTextures().length,
	bytes: (await readFile(join(OUT, "kit.glb"))).length,
};
console.log(JSON.stringify(report));
