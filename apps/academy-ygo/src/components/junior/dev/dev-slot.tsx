"use client";

import dynamic from "next/dynamic";

/**
 * The developer tools, loaded only under `next dev`. The test is written out here, not called through a function,
 * so a production build replaces it with `false` and leaves the tools' code out of what the browser downloads.
 */
export const DEV_TOOLS = process.env.NODE_ENV === "development";
export const DevPanelSlot = process.env.NODE_ENV === "development" ? dynamic(() => import("./dev-panel").then((module) => module.DevPanel), { ssr: false }) : null;
export const DevLevelBarSlot = process.env.NODE_ENV === "development" ? dynamic(() => import("./dev-panel").then((module) => module.DevLevelBar), { ssr: false }) : null;
