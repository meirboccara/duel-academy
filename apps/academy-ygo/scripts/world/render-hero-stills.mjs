/**
 * Renders the six still pictures of the character choice: `public/world/hero-<id>.webp` for the knight, the mage,
 * the rogue, the star, the witch and the explorer, 512 pixels square on a transparent background, all from the
 * same camera.
 *
 * It opens a headless browser (Playwright's Chromium) on a small three.js page served from this machine only,
 * loads each `public/world/hero-*.glb` built by `build-heroes.mjs`, holds one frame of a clip, and saves the
 * canvas through sharp. Nothing is downloaded. Run `pnpm world:heroes` first.
 *
 *   node scripts/world/render-hero-stills.mjs [--clip Cheer] [--time 0.55] [--png]
 */
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(APP, "public", "world");
const HEROES = ["knight", "mage", "rogue", "star", "witch", "explorer"];
const SIZE = 512;
/** Drawn larger, then reduced: smoother edges than the browser's own antialiasing. */
const DRAWN = 1536;

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const clip = option("clip", "Cheer");
const time = Number(option("time", "0.9"));

/* Playwright is a tool of the monorepo, not of this app: look in the app first, then in pnpm's shared folder. */
const require = createRequire(import.meta.url);
function tool(name) {
	try {
		return require(name);
	} catch {
		return createRequire(join(APP, "..", "..", "node_modules", ".pnpm", "node_modules", "_.js"))(name);
	}
}
const { chromium } = tool("playwright");
const sharp = tool("sharp");
const THREE_DIR = dirname(dirname(require.resolve("three")));

const PAGE = /* html */ `<!doctype html>
<meta charset="utf-8">
<script type="importmap">{ "imports": { "three": "/three/build/three.module.js", "three/addons/": "/three/examples/jsm/" } }</script>
<body style="margin:0;background:transparent">
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(${DRAWN}, ${DRAWN}, false);
renderer.setClearColor(0x000000, 0);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

/* The same lights as the island world, and one camera for all three figures: a little above, a little to the side. */
window.shoot = async (url, clipName, at) => {
	const gltf = await loader.loadAsync(url);
	const scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight("#e6f6ff", "#b9a98a", 1.7));
	const sun = new THREE.DirectionalLight("#fff3dc", 1.9);
	sun.position.set(-3, 6, 5);
	scene.add(sun);
	const turn = new THREE.Group();
	turn.rotation.y = -0.38;
	turn.add(gltf.scene);
	scene.add(turn);
	const mixer = new THREE.AnimationMixer(gltf.scene);
	const found = THREE.AnimationClip.findByName(gltf.animations, clipName);
	if (!found) throw new Error("no clip " + clipName);
	mixer.clipAction(found).play();
	mixer.setTime(Math.min(at, found.duration));
	scene.updateMatrixWorld(true);
	const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
	camera.position.set(0, 1.7, 7.1);
	camera.lookAt(0, 1.27, 0);
	renderer.render(scene, camera);
	return { png: renderer.domElement.toDataURL("image/png"), duration: found.duration };
};
window.ready = true;
</script>`;

const TYPES = { ".js": "text/javascript", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
/** Serves this page, three.js from node_modules, and `public/world`; nothing else, and only to this machine. */
const server = createServer(async (request, response) => {
	try {
		const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
		if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end(PAGE);
		const [root, rest] = path.startsWith("/three/") ? [THREE_DIR, path.slice(7)] : path.startsWith("/world/") ? [OUT, path.slice(7)] : [null, ""];
		const file = root && normalize(join(root, rest));
		if (!file || !file.startsWith(root + sep)) return response.writeHead(404).end();
		response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
	} catch {
		response.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
try {
	const page = await browser.newPage();
	page.on("pageerror", (error) => console.error(String(error)));
	await page.goto(origin);
	await page.waitForFunction("window.ready === true");
	const report = {};
	for (const hero of HEROES) {
		const shot = await page.evaluate(([url, name, at]) => window.shoot(url, name, at), [`/world/hero-${hero}.glb`, clip, time]);
		const picture = sharp(Buffer.from(shot.png.split(",")[1], "base64")).resize(SIZE, SIZE, { kernel: "lanczos3" });
		const webp = await picture.clone().webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer();
		await writeFile(join(OUT, `hero-${hero}.webp`), webp);
		if (args.includes("--png")) await writeFile(join(APP, ".cache", `hero-${hero}.png`), await picture.png().toBuffer());
		report[hero] = { bytes: webp.length, clip, time, clipSeconds: Number(shot.duration.toFixed(2)) };
	}
	console.log(JSON.stringify(report));
} finally {
	await browser.close();
	server.close();
}
