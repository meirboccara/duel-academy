import type { WorldId } from "../play/levels";
import type { PlayProgress } from "../play/progress";
import { islandStatus } from "./status";
import type { TrainerId } from "./trainers";

/**
 * The three dorms of Duel Academy (Yu-Gi-Oh! GX): Slifer Red, Ra Yellow and Obelisk Blue. The child chooses one once
 * the first island is finished. The dorm's leader then waits on the tower island (which had no trainer) and gives
 * the dorm's Egyptian God card when that island is finished. Only the choice is stored, per save, beside the play
 * record; the card is computed from the solved levels like every other reward.
 */
export const DORMS = ["slifer", "ra", "obelisk"] as const;
export type Dorm = (typeof DORMS)[number];
export const isDorm = (value: unknown): value is Dorm => (DORMS as readonly unknown[]).includes(value);

/** The dorm's Egyptian God card, its leader (a trainer of `trainers.ts`) and its colour. */
export const DORM_INFO: Readonly<Record<Dorm, { card: string; leader: TrainerId; colour: string }>> = {
	slifer: { card: "slifer-the-sky-dragon", leader: "jaden-yuki", colour: "#d23a3a" },
	ra: { card: "the-winged-dragon-of-ra", leader: "bastion-misawa", colour: "#e8b931" },
	obelisk: { card: "obelisk-the-tormentor", leader: "alexis-rhodes", colour: "#2f62c9" },
};

/** The cap given, and worn at once, when the dorm is chosen (an item of `wardrobe.ts`). */
export const dormCapId = (dorm: Dorm) => `hat-cap-${dorm}`;

/** The choice comes once this island is finished. */
export const DORM_CHOICE_AFTER: WorldId = "wake";
/** Where the dorm's leader waits, and the island whose end gives the dorm's card. */
export const DORM_ISLAND: WorldId = "tower";

/** Whether the map should ask the child for a dorm now. */
export const dormToChoose = (progress: PlayProgress, dorm: Dorm | null) => !dorm && islandStatus(progress, DORM_CHOICE_AFTER) === "done";

export const dormKeyFor = (playKey: string) => `${playKey}:dorm`;
/** Forgiving: nothing stored, a broken record or an unknown dorm all read as "not chosen yet". */
export function loadDorm(storage: Pick<Storage, "getItem"> | undefined, key: string): Dorm | null {
	try {
		const raw = storage?.getItem(key);
		const dorm = raw ? (JSON.parse(raw) as { dorm?: unknown }).dorm : null;
		return isDorm(dorm) ? dorm : null;
	} catch {
		return null;
	}
}
export function saveDorm(storage: Pick<Storage, "setItem">, key: string, dorm: Dorm): boolean {
	try {
		storage.setItem(key, JSON.stringify({ version: 1, dorm }));
		return true;
	} catch {
		return false;
	}
}
