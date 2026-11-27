import type { Duel, Side } from "../duel";
import { cardTypeOf } from "../effects";
import { belongsTo } from "../identity";
import { canSpecialSummon } from "../procedures";
import { summonZones } from "../zones";

/** The Extra Monster Zones (slots 5 and 6): where "Sky Striker Ace - Raye" Special Summons from the Extra Deck. */
export const EXTRA_MONSTER_ZONES: readonly number[] = [5, 6];

/** The "Sky Striker Ace" monsters of the Extra Deck that can be Special Summoned to an Extra Monster Zone now (not a Link Summon: no procedure is read). */
export const acesForExtraZone = (duel: Duel, player: Side): number[] =>
	duel.piles[player].extra.filter((id) => belongsTo(duel, id, "Sky Striker Ace") && duel.defs[duel.cards[id]!.code]?.kind === "monster" && canSpecialSummon(duel, player, id) && summonZones(duel, player, id).some((zone) => EXTRA_MONSTER_ZONES.includes(zone)));

/** Main Monster Zones are slots 0–4; Extra Monster Zones do not count. Face-down monsters still occupy their zone. */
export const noMainMonsters = (duel: Duel, player: Side): boolean => !duel.piles[player].monster.some((id) => (duel.cards[id]!.slot ?? 0) < 5);

/** Spells in the Graveyard, Quick-Play/Field/Equip included, not monsters previously treated as Spells on the field. */
export const spellsInGraveyard = (duel: Duel, player: Side): number => duel.piles[player].graveyard.filter((id) => cardTypeOf(duel, duel.cards[id]!) === "spell").length;
