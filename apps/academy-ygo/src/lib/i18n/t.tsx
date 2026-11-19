"use client";

import { useLanguage } from "./provider";

/** Translates a plain English string rendered by a server page. Falls back to the English text. */
export function T({ children }: { children: string }) {
	return <>{useLanguage().t(children)}</>;
}
