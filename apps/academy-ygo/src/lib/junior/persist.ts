/**
 * Asks the browser to keep this site's storage (MDN: StorageManager.persist). Safari and Chrome answer without a
 * prompt, from how the site is used; a Home Screen web app is more likely to get a yes. The answer changes nothing in
 * the game: it is only shown to grown-ups in the "manage a save" view. Never throws.
 */
export async function requestPersist(): Promise<boolean | null> {
	try {
		if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
		if (navigator.storage.persisted && (await navigator.storage.persisted())) return true;
		return await navigator.storage.persist();
	} catch {
		return null;
	}
}
export async function isPersisted(): Promise<boolean | null> {
	try {
		if (typeof navigator === "undefined" || !navigator.storage?.persisted) return null;
		return await navigator.storage.persisted();
	} catch {
		return null;
	}
}
