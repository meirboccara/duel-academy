import { askMay } from "../choices";
import type { CardSources } from "../coverage";
import { type Duel, moveCard, other, type Side } from "../duel";
import { type CardDef, targetsOf } from "../effects";
import { addModifier, canBeBanished, FOREVER } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { spellsInGraveyard, noMainMonsters } from "./sky-striker-helpers";

const NAME = "Sky Striker Mecha - Shark Cannon";

/** "1 monster in your opponent's GY". */
const monstersToTarget = (duel: Duel, player: Side): number[] => duel.piles[other(player)].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster");

/**
 * "If you control no monsters in your Main Monster Zone: Target 1 monster in your opponent's GY; banish that monster, or, if you have 3 or more
 * Spells in your GY, you can Special Summon that monster to your field instead, but it cannot attack." A Quick-Play Spell, "Sky Striker" by its name.
 *
 * - Condition: no monster of the player in a Main Monster Zone (the Extra Monster Zones do not count). A Quick-Play Spell that changes no ATK or DEF,
 *   so it is not activated in the Damage Step (Konami's notes, OCG; the core's rule for Quick-Play Spells).
 * - Targets 1 monster in the opponent's Graveyard. It resolves only for that target still in the Graveyard (`targetsOf`): banished, face-up. A
 *   banishment a lock stops (`canBeBanished`) is not done. Konami's Q&A fid 8227 (Imperial Iron Wall): with fewer than 3 Spells it cannot be activated
 *   while banishing is impossible; with 3 or more, only a monster that can be Special Summoned is a legal target, and at resolution the Summon is done
 *   (no banishing choice).
 * - "Instead": with 3 or more Spells in the player's Graveyard when it resolves (the card itself is on the field then, so it is not counted), the
 *   player may Special Summon the monster to their field instead, a choice (`askMay`): accepted, it is Summoned (the zone and position chosen by the
 *   player, properly if the rules allow it: a monster that cannot be Special Summoned is banished, with no question); declined, it is banished. When
 *   banishing is impossible the choice is skipped and the Summon is done (Q&A fid 8227).
 * - "It cannot attack": as long as it stays face-up in the Monster Zone (notes): a lock on the attack of that card, as it is when Summoned (a card that
 *   left and came back is another card), for the Summon by this effect only.
 */
export const SKY_STRIKER_MECHA_SHARK_CANNON: CardDef = {
	code: "sky-striker-mecha-shark-cannon",
	kind: "quick-play",
	facts: { name: NAME, archetypes: ["Sky Striker"], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["banish", "special-summon"],
			condition: (duel, { player }) => noMainMonsters(duel, player),
			// With banishing locked (Q&A fid 8227): fewer than 3 Spells, no target; 3 or more, only a monster that can be Special Summoned.
			target: (duel, { player }) => monstersToTarget(duel, player).filter((id) => canBeBanished(duel, id, player) || (spellsInGraveyard(duel, player) >= 3 && canSpecialSummon(duel, player, id))),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target || target.zone !== "graveyard" || target.owner === link.player) return duel;
				const banish = (board: Duel): Duel => (canBeBanished(board, target.id, link.player) ? moveCard(board, target.id, { zone: "banished", effect: link }) : board);
				const summon = (board: Duel): Duel =>
					askSpecialSummon(board, link.player, target.id, {
						then: (done) => {
							const monster = done.cards[target.id]!;
							return addModifier(done, { affects: () => false, until: FOREVER, by: link, about: { card: monster.id, moves: monster.moves }, layer: { kind: "lock", what: "attack", who: "both", only: (_board, attacker) => attacker.id === monster.id && attacker.moves === monster.moves, describe: "with that monster" } });
						},
					});
				if (spellsInGraveyard(duel, link.player) < 3 || !canSpecialSummon(duel, link.player, target.id)) return banish(duel);
				// Banishing locked: the Summon is the only resolution (Q&A fid 8227), no choice.
				if (!canBeBanished(duel, target.id, link.player)) return summon(duel);
				return askMay(duel, link.player, link.card.id, summon, banish);
			},
		},
	],
};

const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13677&request_locale=ja";
const EN = konamiCardUrl(13677, "en");

export const SKY_STRIKER_MECHA_SHARK_CANNON_SOURCES: CardSources = {
	code: "sky-striker-mecha-shark-cannon",
	cid: 13677,
	french: {
		text: "Si vous ne contrôlez aucun monstre dans votre Zone Monstre Main : ciblez 1 monstre dans le Cimetière de votre adversaire ; bannissez le monstre, ou, si vous avez min. 3 Magies dans votre Cimetière, vous pouvez Invoquer Spécialement le monstre sur votre Terrain à la place, mais il ne peut pas attaquer.",
		url: konamiCardUrl(13677, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 13677, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "condition", kind: "card-text", cid: 13677, url: EN, read: "2026-11-26", quote: "If you control no monsters in your Main Monster Zone: Target 1 monster in your opponent's GY;" },
		{ id: "banish", kind: "card-text", cid: 13677, url: EN, read: "2026-11-26", quote: "banish that monster," },
		{ id: "summon-instead", kind: "card-text", cid: 13677, url: EN, read: "2026-11-26", quote: "or, if you have 3 or more Spells in your GY, you can Special Summon that monster to your field instead," },
		{ id: "cannot-attack", kind: "card-text", cid: 13677, url: EN, read: "2026-11-26", quote: "but it cannot attack." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-26. Fid 24159 (Ketsuto Seishin, Ghost Mourner's Side) concerns that card, not this one.
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 13677, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-cannot-attack", kind: "jp-notes", cid: 13677, url: NOTES, read: "2026-11-26", quote: "■この効果で特殊召喚したモンスターは、モンスターゾーンに表側表示で存在する限り、『攻撃できない』状態になります。" },
		// OCG only. Konami's Q&A fid 8227 (2018-03-01, Imperial Iron Wall), page read 2026-11-26.
		{ id: "qa-iron-wall", kind: "jp-qa", cid: 13677, fid: 8227, url: qa(8227), read: "2026-11-26", quote: "自分の墓地に存在する魔法カードが2枚以下の場合、自分は「閃刀機－シャークキャノン」を発動する事はできません。" },
		// OCG only. Konami's Q&A fid 21761 (2018-02-24, Solemn Warning, a Side card): the Spell counts as an effect that Special Summons even with fewer than 3 Spells.
		{ id: "qa-warning", kind: "jp-qa", cid: 13677, fid: 21761, url: qa(21761), read: "2026-11-26", quote: "「閃刀機－シャークキャノン」の発動にチェーンして「神の警告」を発動する事はできます。" },
	],
	effects: ["facts", "condition", "banish", "summon-instead", "cannot-attack"],
	rulings: [{ source: "notes-no-damage-step" }, { source: "notes-cannot-attack" }, { source: "qa-iron-wall" }, { source: "qa-warning" }],
};
