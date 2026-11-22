import { defineConfig } from "vitest/config";

/* Every test plays with this catalogue: importing the package gives its cards to the engine. */
export default defineConfig({ test: { environment: "node", globals: true, include: ["test/**/*.test.ts"], setupFiles: ["./src/index.ts"] } });
