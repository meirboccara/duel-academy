// Use the TypeScript runtime already installed with Vitest; no new runtime dependency.
const { createRequire } = require("node:module");
const { dirname, join } = require("node:path");
const { spawnSync } = require("node:child_process");
const vitestRequire = createRequire(require.resolve("vitest/package.json"));
const cli = join(dirname(vitestRequire.resolve("vite-node/package.json")), "vite-node.mjs");
const result = spawnSync(process.execPath, [cli, join(__dirname, "agent-play.ts"), ...process.argv.slice(2)], { stdio: "inherit" });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
