import { targetsOf, type CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { other } from "../duel";
import { isNegated, negateCardEffects } from "../modifiers";
import { controlsNoCards } from "../negation";
import { konamiCardUrl } from "../sources";

/**
 * "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn), then if this card was
 * Set before activation and is on the field at resolution, for the rest of this turn all other Spell/Trap effects in this
 * column are negated. If you control no cards, you can activate this card from your hand."
 *
 * PARTIAL (`unmodelled`): the column clause needs columns (step 7) and turn-long modifiers (step 6). A Set Infinite
 * Impermanence negates the monster only.
 */
export const INFINITE_IMPERMANENCE: CardDef = {
	code: "infinite-impermanence",
	kind: "trap",
	unmodelled: ["column"],
	effects: [
		{
			type: "activation",
			handIf: (duel, { player }) => controlsNoCards(duel, player),
			// A face-up monster the opponent controls whose effects are not negated already (Konami's note: not a legal target;
			// the TCG text has no such sentence), and not a Normal Monster, which has no effects to negate (same note).
			target: (duel, { player }) => duel.piles[other(player)].monster.filter((id) => duel.cards[id]!.face === "up" && !isNegated(duel, id) && duel.defs[duel.cards[id]!.code]?.facts?.normal !== true),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				// "that target": still face-up in the Monster Zone when this resolves.
				return target && target.zone === "monster" && target.face === "up" ? negateCardEffects(duel, target.id, duel.turn.number) : duel;
			},
		},
	],
};

export const INFINITE_IMPERMANENCE_SOURCES: CardSources = {
	code: "infinite-impermanence",
	cid: 13631,
	french: {
		text: "Ciblez 1 monstre face recto contrôlé par votre adversaire ; annulez ses effets (jusqu'à la fin de ce tour), puis si cette carte a été Posée avant l'activation et est sur le Terrain à la résolution, tous les autres effets de Magie/Piège dans cette colonne sont annulés le reste de ce tour. Si vous ne contrôlez aucune carte, vous pouvez activer cette carte depuis votre main.",
		url: konamiCardUrl(13631, "fr"),
		read: "2026-11-23",
	},
	sources: [
		{ id: "negate", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-23", quote: "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn)" },
		{ id: "column", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-23", quote: "then if this card was Set before activation and is on the field at resolution, for the rest of this turn all other Spell/Trap effects in this column are negated." },
		{ id: "hand", kind: "card-text", cid: 13631, url: konamiCardUrl(13631, "en"), read: "2026-11-23", quote: "If you control no cards, you can activate this card from your hand." },
	],
	// The negation and the hand clause are applied and tested; the column clause is not, and is not listed here.
	effects: ["negate", "hand"],
	// The column clause is printed on the card and not applied: pending until step 7 (columns), with step 6's turn-long modifiers.
	deferred: [{ source: "column", step: 7, reason: "for the rest of this turn, the effects of the other Spell/Trap Cards in this column are negated (needs columns and turn-long modifiers; a Set Infinite Impermanence negates the monster only)" }],
	rulings: [],
};
