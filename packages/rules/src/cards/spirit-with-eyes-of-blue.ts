import { askMay } from "../choices";
import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { addModifier, FOREVER, level, locked } from "../modifiers";
import { askSpecialSummon, canSpecialSummon, tribute } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf, isEffectMonster } from "./helpers";

const NAME = "Spirit with Eyes of Blue";
const MAUSOLEUM = "Mausoleum of White";
const BLUE_EYES = "Blue-Eyes";

/** "1 "Mausoleum of White"" in the player's Deck. */
const mausoleums = (duel: Duel, player: Side): number[] => duel.piles[player].deck.filter((id) => hasPrintedName(duel, id, MAUSOLEUM));

/** The "Blue-Eyes" monsters of the player's hand and Graveyard that can be Special Summoned in the duel `duel` (a Summon lock, a zone, being properly Summoned first). */
const blueEyes = (duel: Duel, player: Side): number[] => [...duel.piles[player].hand, ...duel.piles[player].graveyard].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, BLUE_EYES) && canSpecialSummon(duel, player, id));

const isDragon = (duel: Duel, id: number): boolean => factsOf(duel, id)?.monsterType === "Dragon";

/**
 * "1 Level 4 or lower Dragon or Spellcaster monster. You cannot Special Summon, except Dragon monsters. You can only use each of the following
 * effects of "Spirit with Eyes of Blue" once per turn. If this card is Link Summoned: You can take 1 "Mausoleum of White" from your Deck and either
 * add it to your hand or send it to the GY. You can Tribute this card; Special Summon 1 "Blue-Eyes" monster from your hand or GY, but if you
 * Special Summoned an Effect Monster from your GY by this effect, it cannot attack and its effects are negated." A LIGHT Dragon Link Effect Monster,
 * Link 1 (its arrow at the bottom left, read from Konami's card page), 300 ATK.
 *
 * - Procedure: 1 Dragon or Spellcaster monster of Level 4 or lower (`procedure: { kind: "link" }`, the Level read now: a Link or Xyz Monster has none).
 * - Continuous Effect (Konami's notes, OCG): while this card is face-up in the Monster Zone and not negated, its controller cannot Special Summon a
 *   monster that is not a Dragon, by any means (`summon` lock on the printed Type); the opponent is not stopped.
 * - First effect: an optional "if" Trigger Effect of the Monster Zone (notes), for the card's own Link Summon, activated only while a "Mausoleum of
 *   White" is in the Deck (`search-needs-a-card`). The card is taken when it resolves (no target), then the player chooses where it goes: choosing the
 *   card adds it to the hand, passing sends it to the Graveyard (`askMay`: the core's question is "accept this card"); while cards cannot be added from
 *   the Deck to the hand only the Graveyard is possible. A card that is not added is sent.
 * - Second effect: an Ignition Effect of the Monster Zone (notes), the Tribute of itself being the cost; once per turn by name, apart from the first
 *   effect (the sentence says "each of the following effects"). The monster is chosen when it resolves, in the hand or the GY (not banished or
 *   in the Deck), then its zone and position. The restriction of the first Continuous Effect ends with the Tribute: the card is no longer on the field when
 *   the effect resolves, so a non-Dragon "Blue-Eyes" monster may be Summoned. The core reads "activated only while it can be done" with the restriction still
 *   applying at the activation: a Dragon "Blue-Eyes" monster that can be Special Summoned (once the card has left its zone) must be in the hand or the GY.
 *   That reading, and the Summon of a non-Dragon after the cost, rest on YGOProJudge only (asked 2026-11-24, it cited no official source; contested once:
 *   it kept the answer).
 * - "But if you Special Summoned an Effect Monster from your GY by this effect": an Effect Monster that came from the Graveyard cannot attack and has its
 *   effects negated for as long as it stays that monster in the Monster Zone: it stops applying when it leaves the Monster Zone or is turned face-down (notes:
 *   the monster is a new card then, `moves`). A Normal Monster, or a monster from the hand, is free.
 */
export const SPIRIT_WITH_EYES_OF_BLUE: CardDef = {
	code: "spirit-with-eyes-of-blue",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "link", link: 1, arrows: ["bottom-left"], atk: 300, archetypes: ["Eyes of Blue"], mentions: [MAUSOLEUM, NAME] },
	procedure: { kind: "link", materials: { min: 1, filter: (duel, card) => (factsOf(duel, card.id)?.monsterType === "Dragon" || factsOf(duel, card.id)?.monsterType === "Spellcaster") && factsOf(duel, card.id)?.level !== undefined && level(duel, card.id) <= 4 } },
	effects: [
		{
			type: "continuous",
			range: "field",
			affects: () => false,
			modifies: (_duel, source) => [{ kind: "lock", what: "summon", who: source.controller, ways: ["special"], only: (board, monster) => factsOf(board, monster.id)?.monsterType !== "Dragon", describe: "except Dragon monsters" }],
		},
		{
			type: "trigger",
			timing: "if",
			categories: ["search", "send-from-deck"],
			once: { scope: "name", key: "spirit-with-eyes-of-blue-mausoleum" },
			condition: (duel, { player }) => mausoleums(duel, player).length > 0,
			event: (_duel, event, { card }) => event.type === "summoned" && event.card.id === card.id && event.kind === "link",
			operation: (duel, link) =>
				ask(duel, link.player, mausoleums(duel, link.player), (board, picked) => {
					const toGraveyard = (next: Duel) => moveCard(next, picked, { zone: "graveyard", effect: link });
					return locked(board, "add-to-hand", link.player) ? toGraveyard(board) : askMay(board, link.player, picked, (next) => moveCard(next, picked, { zone: "hand", effect: link }), toGraveyard);
				}),
		},
		{
			type: "ignition",
			categories: ["special-summon"],
			once: { scope: "name", key: "spirit-with-eyes-of-blue-summon" },
			// The restriction applies at the activation (YGOProJudge only): a Dragon is needed; the zone is read once the card has left it.
			condition: (duel, { player, card }) => blueEyes(tribute(duel, [card.id]), player).some((id) => isDragon(duel, id)),
			cost: (duel, { card }) => tribute(duel, [card.id]),
			operation: (duel, link) =>
				ask(duel, link.player, blueEyes(duel, link.player), (board, picked) => {
					const fromGraveyard = board.cards[picked]!.zone === "graveyard" && isEffectMonster(board, picked);
					return askSpecialSummon(board, link.player, picked, {
						then: (done) => {
							if (!fromGraveyard) return done;
							const monster = done.cards[picked]!;
							const same = { card: monster.id, moves: monster.moves };
							const negated = addModifier(done, { affects: same, until: FOREVER, layer: { kind: "negate" }, by: link });
							return addModifier(negated, { affects: () => false, until: FOREVER, layer: { kind: "lock", what: "attack", who: "both", only: (_board, attacker) => attacker.id === same.card && attacker.moves === same.moves } });
						},
					});
				}),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20609&request_locale=ja";
const EN = konamiCardUrl(20609, "en");

export const SPIRIT_WITH_EYES_OF_BLUE_SOURCES: CardSources = {
	code: "spirit-with-eyes-of-blue",
	cid: 20609,
	french: {
		text: "1 monstre Dragon ou Magicien de max. Niveau 4\nVous ne pouvez pas Invoquer Spécialement (monstres Dragon exclus). Vous ne pouvez utiliser chacun des effets suivants de \"Esprit avec des Yeux de Bleu\" qu'une fois par tour. Si cette carte est Invoquée par Lien : vous pouvez prendre 1 \"Mausolée Blanc\" depuis votre Deck, et soit ajoutez-le à votre main soit envoyez-le au Cimetière. Vous pouvez Sacrifier cette carte ; Invoquez Spécialement 1 monstre \"Yeux Bleus\" depuis votre main ou Cimetière, mais si vous avez Invoqué Spécialement un Monstre à Effet depuis votre Cimetière par cet effet, il ne peut pas attaquer et ses effets sont annulés.",
		url: konamiCardUrl(20609, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "Spirit with Eyes of Blue LIGHT Link 1 ATK 300 DEF - Dragon ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "1 Level 4 or lower Dragon or Spellcaster monster" },
		{ id: "lock", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "You cannot Special Summon, except Dragon monsters." },
		{ id: "once", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "You can only use each of the following effects of \"Spirit with Eyes of Blue\" once per turn." },
		{ id: "search", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "If this card is Link Summoned: You can take 1 \"Mausoleum of White\" from your Deck and either add it to your hand or send it to the GY." },
		{ id: "summon", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "You can Tribute this card; Special Summon 1 \"Blue-Eyes\" monster from your hand or GY," },
		{ id: "negate", kind: "card-text", cid: 20609, url: EN, read: "2026-11-24", quote: "but if you Special Summoned an Effect Monster from your GY by this effect, it cannot attack and its effects are negated." },
		// OCG only. Konami's notes (補足情報, 2024-09-07), page read 2026-11-24. Its 2 Q&A entries (fids 23362, 23215) were opened and read in full: both are about "True Light" and cards the core does not have ("Blue-Eyes Alternative White Dragon", "Zashiki-Warashi").
		{ id: "notes-trigger", kind: "jp-notes", cid: 20609, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-lock-field", kind: "jp-notes", cid: 20609, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-summon-ignition", kind: "jp-notes", cid: 20609, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる起動効果です。" },
		{ id: "notes-negate-ends", kind: "jp-notes", cid: 20609, url: NOTES, read: "2026-11-24", quote: "■この効果で特殊召喚したモンスターがモンスターゾーンに存在しなくなった場合、表側表示から裏側守備表示になった場合に、『攻撃できず、効果は無効化される』効果の適用はなくなります。" },
	],
	effects: ["facts", "procedure", "lock", "once", "search", "summon", "negate"],
	rulings: [{ source: "notes-trigger" }, { source: "notes-lock-field" }, { source: "notes-summon-ignition" }, { source: "notes-negate-ends" }],
};
