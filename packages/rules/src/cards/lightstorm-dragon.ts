import type { CardSources } from "../coverage";
import { type Duel, effectDestruction, moveCards, type Side } from "../duel";
import { type CardDef, type EffectRecord, targetsOf } from "../effects";
import { addModifier, FOREVER } from "../modifiers";
import { askSetByEffect, canSetByEffect } from "../set";
import { konamiCardUrl } from "../sources";
import { factsOf, spellsAndTraps } from "./helpers";

const NAME = "Lightstorm Dragon";

const isNormalMonster = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.normal === true;

/** "The number of Normal Monsters in your GY". */
const normalsInGraveyard = (duel: Duel, player: Side): number => duel.piles[player].graveyard.filter((id) => isNormalMonster(duel, id)).length;

/** "You control a Normal Monster": a face-up one in a Monster Zone (a face-down monster has no type). */
const controlsNormalMonster = (duel: Duel, player: Side): boolean => duel.piles[player].monster.some((id) => duel.cards[id]!.face === "up" && isNormalMonster(duel, id));

/** "1 Spell/Trap in your GY" that can be Set now. */
const toSet = (duel: Duel, player: Side): number[] => duel.piles[player].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind !== "monster" && canSetByEffect(duel, player, id));

/** "If this card is destroyed by battle or card effect": it was destroyed on the field and went to `zone` (face-up when banished), where Konami's notes say it triggers. */
const destroyedTo = (zone: "graveyard" | "banished"): EffectRecord["event"] => (_duel, event, { card }) =>
	event.type === "moved" && event.before.id === card.id && event.before.zone === "monster" && event.reason === "destroyed" && (event.by === "battle" || event.destruction?.cause === "battle" || event.destruction?.cause === "effect") && event.after.zone === zone && (zone === "graveyard" || event.after.face === "up");

/** "Target 1 Spell/Trap in your GY; Set it, but it cannot be activated unless you control a Normal Monster": one record per place the card triggers from. */
const setFromGraveyard = (zone: "graveyard" | "banished"): EffectRecord => ({
	type: "trigger",
	range: zone,
	timing: "if",
	categories: ["set-from-graveyard"],
	once: { scope: "name", key: "lightstorm-dragon-set" },
	condition: (duel, { player }) => toSet(duel, player).length > 0,
	target: (duel, { player }) => toSet(duel, player),
	event: destroyedTo(zone),
	operation: (duel, link) => {
		const target = targetsOf(duel, link)[0];
		if (!target || target.zone !== "graveyard") return duel;
		return askSetByEffect(duel, link.player, target.id, {
			effect: link,
			then: (board) => {
				const set = board.cards[target.id]!;
				// Not Set after all (the card is unaffected, or no zone was free): no restriction.
				if (set.zone !== "spell" && set.zone !== "field") return board;
				// A lasting restriction on that Set card only (a card that moves is another card), lifted while the player controls a Normal Monster.
				return addModifier(board, {
					affects: () => false,
					until: FOREVER,
					layer: { kind: "lock", what: "activate", who: link.player, stops: (now, attempt) => attempt.effect.type === "activation" && attempt.card.id === set.id && attempt.card.moves === set.moves && !controlsNormalMonster(now, link.player) },
				});
			},
		});
	},
});

/**
 * "1 Tuner + 1+ non-Tuners. If this card is Special Summoned: You can target Spells/Traps on the field up to the number of Normal Monsters in your
 * GY +1; destroy them. If this card is destroyed by battle or card effect: You can target 1 Spell/Trap in your GY; Set it, but it cannot be
 * activated unless you control a Normal Monster. You can only use each effect of "Lightstorm Dragon" once per turn." A LIGHT Dragon Synchro Effect
 * Monster of Level 9.
 *
 * - Procedure: the generic Synchro Summon (`procedure: { kind: "synchro" }`: 1 Tuner and 1 or more non-Tuners, whose Levels add up to 9).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone, also in the Damage Step (Konami's notes, OCG), for any Special Summon of the card.
 *   It targets 1 to (the Normal Monsters in the player's own GY, +1) Spells/Traps on the field, of either player, face-up or Set (`targetCount` read on
 *   the board the cost leaves); with no Normal Monster in the GY it still targets 1 (notes). Activated only while a Spell/Trap is on the field. The
 *   targets are destroyed together when it resolves.
 * - Second effect: an optional "if" Trigger Effect of the Graveyard, or of banishment when the card was destroyed and banished face-up (notes: where it
 *   first went), also in the Damage Step, for a destruction by battle or by a card effect (not for a card sent to the Graveyard otherwise, nor a
 *   destruction by a cost or a rule of the game). It targets 1 Spell/Trap of the player's own Graveyard that can be Set (a Field Spell goes to the Field Zone),
 *   and Sets it. The restriction is a lasting lock on that Set card: it cannot be activated while the player controls no face-up Normal Monster. It follows
 *   the card as it is: a card that leaves the field is another card and is free. Konami gives no page on its duration; that it follows the card, as long as it
 *   stays on the field, is YGOProJudge's answer (asked 2026-11-24, it cited no official source). It is "cannot be activated unless you control a Normal
 *   Monster": checked at each attempt to activate it (also when it is Set again or flipped, not only at the Set). It stops only the card's own activation
 *   (the `activation` effect, "it cannot be activated"), not the effects it has once it is face-up (a Continuous or Field Spell's ignition effect).
 * - Once per turn: each effect once per turn, by name, the two apart (the second sharing its limit between the Graveyard and the banished records).
 */
export const LIGHTSTORM_DRAGON: CardDef = {
	code: "lightstorm-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 9, atk: 2700, def: 3000, mentions: [NAME] },
	procedure: { kind: "synchro" },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["destroy"],
			once: { scope: "name", key: "lightstorm-dragon-destroy" },
			condition: (duel) => spellsAndTraps(duel).length > 0,
			target: (duel) => spellsAndTraps(duel),
			targetCount: (duel, { player }) => ({ min: 1, max: normalsInGraveyard(duel, player) + 1 }),
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.id === card.id,
			operation: (duel, link) => {
				const targets = targetsOf(duel, link).filter((target) => target.zone === "spell" || target.zone === "field");
				return moveCards(duel, targets.map((target) => target.id), { zone: "graveyard", reason: "destroyed", destruction: effectDestruction(link) });
			},
		},
		setFromGraveyard("graveyard"),
		setFromGraveyard("banished"),
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20780&request_locale=ja";
const EN = konamiCardUrl(20780, "en");

export const LIGHTSTORM_DRAGON_SOURCES: CardSources = {
	code: "lightstorm-dragon",
	cid: 20780,
	french: {
		text: "1 Syntoniseur + 1+ non-Syntoniseur\nSi cette carte est Invoquée Spécialement : vous pouvez cibler un nombre de Magies/Pièges sur le Terrain, inférieur ou égal au nombre de Monstres Normaux dans votre Cimetière +1 ; détruisez-les. Si cette carte est détruite au combat ou par un effet de carte : vous pouvez cibler 1 Magie/Piège dans votre Cimetière ; Posez-le, mais il ne peut pas être activé sauf si vous contrôlez un Monstre Normal. Vous ne pouvez utiliser chaque effet de \"Dragon Orage Lumineux\" qu'une fois par tour.",
		url: konamiCardUrl(20780, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20780, url: EN, read: "2026-11-24", quote: "Lightstorm Dragon LIGHT Level 9 ATK 2700 DEF 3000 Dragon ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 20780, url: EN, read: "2026-11-24", quote: "1 Tuner + 1+ non-Tuners" },
		{ id: "destroy", kind: "card-text", cid: 20780, url: EN, read: "2026-11-24", quote: "If this card is Special Summoned: You can target Spells/Traps on the field up to the number of Normal Monsters in your GY +1; destroy them." },
		{ id: "set", kind: "card-text", cid: 20780, url: EN, read: "2026-11-24", quote: "If this card is destroyed by battle or card effect: You can target 1 Spell/Trap in your GY; Set it, but it cannot be activated unless you control a Normal Monster." },
		{ id: "once", kind: "card-text", cid: 20780, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Lightstorm Dragon\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-10-26), page read 2026-11-24. The card has no Q&A entry.
		{ id: "notes-destroy-field", kind: "jp-notes", cid: 20780, url: NOTES, read: "2026-11-24", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-destroy-damage-step", kind: "jp-notes", cid: 20780, url: NOTES, read: "2026-11-24", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-destroy-no-normal", kind: "jp-notes", cid: 20780, url: NOTES, read: "2026-11-24", quote: "■自分の墓地に通常モンスターが存在しない場合でも発動できます。その場合、対象に選択できるカードの枚数は１枚です。" },
		{ id: "notes-set-graveyard", kind: "jp-notes", cid: 20780, url: NOTES, read: "2026-11-24", quote: "■このカードが戦闘・効果で破壊され、墓地へ送られた場合には墓地で、表側で除外された場合には除外状態で発動できます。（破壊され最初に送られたところで発動できます。）" },
		{ id: "notes-set-damage-step", kind: "jp-notes", cid: 20780, url: NOTES, read: "2026-11-24", quote: "■ダメージステップでも発動できます。" },
	],
	effects: ["facts", "procedure", "destroy", "set", "once"],
	rulings: [{ source: "notes-destroy-field" }, { source: "notes-destroy-damage-step" }, { source: "notes-destroy-no-normal" }, { source: "notes-set-graveyard" }, { source: "notes-set-damage-step" }],
};
