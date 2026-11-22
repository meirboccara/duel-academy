import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: { jsx: "automatic" },
	test: { environment: "node", globals: true, include: ["src/**/*.test.{ts,tsx}"], setupFiles: ["./src/test-setup.ts"] },
	resolve: { alias: { "@": resolve(__dirname, "./src") } },
});
