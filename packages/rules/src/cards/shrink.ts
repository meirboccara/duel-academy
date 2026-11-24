import type { CardSources } from "../coverage";
import { type CardDef, targetsOf } from "../effects";
import { addModifier, unaffectedBy } from "../modifiers";
import { konamiCardUrl } from "../sources";

/** "Target 1 face-up monster on the field; its original ATK becomes halved until the end of this turn." A Quick-Play Spell. */
export const SHRINK: CardDef = {
	code: "shrink",
	kind: "quick-play",
	effects: [
		{
			type: "activation",
			// It directly changes ATK, so it can be activated in the Damage Step up to damage calculation (RB10, step 6b).
			categories: ["change-atk"],
			target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].filter((id) => duel.cards[id]!.face === "up"),
			operation: (duel, link) => {
				// "that target": still face-up on the field when this resolves.
				const target = targetsOf(duel, link)[0];
				if (!target || target.zone !== "monster" || target.face !== "up") return duel;
				// ATK is a multiple of 50 on the cards: no Konami page read on how an odd half would round.
				// A monster unaffected by this effect stays its target, and nothing is applied to it (record `unaffected-targeted-not-applied`).
				if (unaffectedBy(duel, target.id, link)) return duel;
				return addModifier(duel, { affects: { card: target.id, moves: target.moves }, until: duel.turn.number, by: link, layer: { kind: "base", stat: "atk", to: (original) => original / 2 } });
			},
		},
	],
};

export const SHRINK_SOURCES: CardSources = {
	code: "shrink",
	cid: 5355,
	french: { text: "Ciblez 1 monstre face recto sur le Terrain ; jusqu'à la fin de ce tour, son ATK d'origine sera divisée par deux.", url: konamiCardUrl(5355, "fr"), read: "2026-11-23" },
	sources: [{ id: "text", kind: "card-text", cid: 5355, url: konamiCardUrl(5355, "en"), read: "2026-11-23", quote: "Target 1 face-up monster on the field; its original ATK becomes halved until the end of this turn." }],
	effects: ["text"],
	rulings: [],
};
