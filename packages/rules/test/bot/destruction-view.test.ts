import { expect, it } from "vitest";
import { createDuel, destroyCard, moveCard, viewFor, redeal, type CardDef, type GameEvent } from "../../src";

// An activated card was shown to both players: the source of an effect's destruction stays visible in a view even once the card is
// hidden again, so a re-dealt world never gives it a code that could not have done it (review finding).
it("keeps an activated destruction source visible in the view and in every re-dealt world", () => {
	// Synthetic trigger listener retains events, even without a real card being scripted.
	const defs: Record<string, CardDef> = {
		secret: { code: "secret", kind: "monster", effects: [{ type: "quick", range: "hand", event: () => false, operation: (duel) => duel }] },
		victim: { code: "victim", kind: "monster" },
	};
	let duel = createDuel({ seed: 1, you: { deck: ["victim"] }, rival: { deck: ["secret"] }, defs });
	duel = moveCard(moveCard(duel, 1, { zone: "monster" }), 2, { zone: "hand" });
	const destroyed = destroyCard(duel, 1, { destruction: { cause: "effect", source: duel.cards[2]!, player: "rival", effect: 0 } });
	const destructionOf = (events: readonly GameEvent[]) => events.find((e) => e.type === "moved" && e.reason === "destroyed");
	const full = destructionOf(destroyed.live);
	const view = viewFor(destroyed, "you");
	expect(destructionOf(view.duel.live)).toMatchObject({ destruction: { source: { code: "secret" }, player: "rival" } });
	expect(full).toMatchObject({ destruction: { source: { code: "secret" } } });
	expect(destructionOf(redeal(view, 9).live)).toMatchObject({ destruction: { source: { code: "secret" } } });
});
