/**
 * The browser's full screen, also in its older Safari form (`webkit…`: iPads before iPadOS 16.4). An iPhone has no
 * full screen for a page at all: there the game only hides the site's own header and footer (see `useImmersive`),
 * and a Home Screen web app is the way to lose Safari's bars.
 */

type FullscreenDocument = Document & {
	webkitFullscreenElement?: Element | null;
	webkitFullscreenEnabled?: boolean;
	webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

/** The events that say the page went in or out of full screen. */
export const FULLSCREEN_EVENTS = ["fullscreenchange", "webkitfullscreenchange"] as const;

export const fullscreenElement = (doc: Document): Element | null => doc.fullscreenElement ?? (doc as FullscreenDocument).webkitFullscreenElement ?? null;

export const canFullscreen = (doc: Document): boolean => !!(doc.fullscreenEnabled || (doc as FullscreenDocument).webkitFullscreenEnabled);

/** Asks for full screen; true when the browser gave it. Never throws: refused, unsupported or not from a tap, it is false. */
export async function enterFullscreen(element: HTMLElement): Promise<boolean> {
	const target = element as FullscreenElement;
	try {
		if (typeof target.requestFullscreen === "function") await target.requestFullscreen({ navigationUI: "hide" });
		else if (typeof target.webkitRequestFullscreen === "function") await target.webkitRequestFullscreen();
		else return false;
		return true;
	} catch {
		return false;
	}
}

/** Leaves full screen if the page is in it. Never throws. */
export async function exitFullscreen(doc: Document): Promise<void> {
	if (!fullscreenElement(doc)) return;
	const fullDoc = doc as FullscreenDocument;
	try {
		if (typeof fullDoc.exitFullscreen === "function") await fullDoc.exitFullscreen();
		else await fullDoc.webkitExitFullscreen?.();
	} catch {
		/* Already out. */
	}
}
