import type { CardSources } from "../coverage";
import { destroyCard, effectDestruction, type Duel, isOnField, isStill, moveCard, type Side } from "../duel";
import { type CardDef, cardTypeOf, targetsOf } from "../effects";
import { breakEffect } from "../events";
import { belongsTo } from "../identity";
import { canBeBanished } from "../modifiers";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";
import { spellsInGraveyard } from "./sky-striker-helpers";

const NAME = "Sky Striker Ace - Azalea";

/** "1 card on the field": any card of either field, face-up or face-down, itself included (the text does not exclude it). */
const cardsOnField = (duel: Duel): number[] => (["you", "rival"] as const).flatMap((side) => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field]);

/** "1 Spell from your GY" that can be banished as the cost. */
const bannable = (duel: Duel, player: Side): number[] => duel.piles[player].graveyard.filter((id) => cardTypeOf(duel, duel.cards[id]!) === "spell" && canBeBanished(duel, id, player));

/** The opponent's monster this card battles in the Damage Step in progress, `null` when it battles none (a direct attack, or another card's battle). */
const opposingMonster = (duel: Duel, id: number): number | null => {
	const battle = duel.battle;
	if (battle === null || battle.target === null) return null;
	if (battle.attacker.id === id && isStill(duel, battle.attacker)) return isStill(duel, battle.target) ? battle.target.id : null;
	if (battle.target.id === id && isStill(duel, battle.target)) return isStill(duel, battle.attacker) ? battle.attacker.id : null;
	return null;
};

/**
 * DARK Machine Link 2 (arrows at the top left and the bottom right), 1500 ATK. "2 LIGHT and/or DARK monsters. Must be Link Summoned. You can only
 * Special Summon "Sky Striker Ace - Azalea(s)" once per turn. If this card is Special Summoned: You can target 1 card on the field; destroy it, then, if
 * you have 3 or less Spells in your GY, send this card to the GY. Once per turn, at the start of the Damage Step, if this card battles an opponent's
 * monster: You can banish 1 Spell from your GY; destroy that opponent's monster." Every "Sky Striker Ace" card is also a "Sky Striker" card (the name).
 *
 * - Procedure: 2 monsters that are each LIGHT or DARK, in any mix (notes: 1 LIGHT and 1 DARK, 2 LIGHT, or 2 DARK).
 * - "Must be Link Summoned" and the limit of one Special Summon per turn are card rules, not effects (notes): `summon.onlyByOwnProcedure` (no other
 *   effect Special Summons it, from anywhere) and `summon.oncePerTurn` (any way, even when its effects are negated).
 * - First effect: an optional "if" Trigger Effect of the Monster Zone, also in the Damage Step (notes), for any Special Summon of the card (it can
 *   only be a Link Summon, or a Summon by an effect that Link Summons it). It targets 1 card on the field of either player, face-up or face-down, this
 *   card included. It resolves only for a target that is still the card targeted; it is destroyed, and then (not simultaneously: notes) this card is sent
 *   to the Graveyard when the target's destruction succeeded (the target left the field) and the player has 3 or fewer Spells in the Graveyard, counted
 *   after the destruction. Nothing is sent if this card is no longer in the Monster Zone, or was the target.
 * - Second effect: an optional "if" Trigger Effect of the Monster Zone at the start of the Damage Step (notes), once per turn for each copy, activated
 *   when this card attacks an opponent's monster or is attacked by one (not for a direct attack). The cost banishes 1 Spell from the player's Graveyard
 *   (a card the player's Graveyard cannot banish is not a cost). When it resolves it destroys the opponent's monster this card battles, when it is still
 *   there; no target.
 */
export const SKY_STRIKER_ACE_AZALEA: CardDef = {
	code: "sky-striker-ace-azalea",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Machine", frame: "link", link: 2, arrows: ["top-left", "bottom-right"], atk: 1500, archetypes: ["Sky Striker Ace", "Sky Striker"], mentions: [NAME] },
	summon: { oncePerTurn: true, onlyByOwnProcedure: true },
	procedure: { kind: "link", materials: { min: 2, max: 2, filter: (duel, card) => ["LIGHT", "DARK"].includes(factsOf(duel, card.id)?.attribute ?? "") } },
	effects: [
		{
			type: "trigger",
			timing: "if",
			categories: ["destroy", "send-to-graveyard"],
			target: (duel) => cardsOnField(duel),
			event: (_duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.id === card.id,
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				if (!target || !isOnField(target.zone)) return duel;
				const destroyed = destroyCard(duel, target.id, { destruction: effectDestruction(link) });
				// "If you do ... then": the destruction took (the target left the field), then this card is sent when 3 or fewer Spells are in the GY now.
				if (destroyed === duel || isOnField(destroyed.cards[target.id]!.zone) || spellsInGraveyard(destroyed, link.player) > 3) return destroyed;
				const self = destroyed.cards[link.card.id]!;
				if (self.zone !== "monster" || self.moves !== link.card.moves) return destroyed;
				return moveCard(breakEffect(destroyed), self.id, { zone: "graveyard", effect: link });
			},
		},
		{
			type: "trigger",
			timing: "if",
			categories: ["destroy"],
			once: { scope: "instance" },
			cost: {
				pick: (duel, { player }) => bannable(duel, player).map((id) => [id]),
				pay: (duel, { player }, picked) => (picked.length === 1 && canBeBanished(duel, picked[0]!, player) ? moveCard(duel, picked[0]!, { zone: "banished", player }) : null),
			},
			event: (duel, event, { card }) => event.type === "damage-step" && event.step === "start" && opposingMonster(duel, card.id) !== null,
			operation: (duel, link) => {
				const enemy = opposingMonster(duel, link.card.id);
				return enemy === null ? duel : destroyCard(duel, enemy, { destruction: effectDestruction(link) });
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=18448&request_locale=ja";
const EN = konamiCardUrl(18448, "en");

export const SKY_STRIKER_ACE_AZALEA_SOURCES: CardSources = {
	code: "sky-striker-ace-azalea",
	cid: 18448,
	french: {
		text: "2 monstres LUMIÈRE et/ou TÉNÈBRES\nUniquement Invocable par Lien. Vous ne pouvez Invoquer Spécialement un ou plusieurs \"Assaut de l'Air - As - Azaléa\" qu'une fois par tour. Si cette carte est Invoquée Spécialement : vous pouvez cibler 1 carte sur le Terrain ; détruisez-la, puis, si vous avez max. 3 Magies dans votre Cimetière, envoyez cette carte au Cimetière. Une fois par tour, au début de la Damage Step, si cette carte combat un monstre de l'adversaire : vous pouvez bannir 1 Magie depuis votre Cimetière ; détruisez le monstre de l'adversaire.",
		url: konamiCardUrl(18448, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 18448, url: EN, read: "2026-11-26", quote: "DARK Link 2 ATK 1500 DEF - Machine ／ Link／Effect" },
		{ id: "procedure", kind: "card-text", cid: 18448, url: EN, read: "2026-11-26", quote: "2 LIGHT and/or DARK monsters" },
		{ id: "link-only", kind: "card-text", cid: 18448, url: EN, read: "2026-11-26", quote: "Must be Link Summoned." },
		{ id: "once-summon", kind: "card-text", cid: 18448, url: EN, read: "2026-11-26", quote: "You can only Special Summon \"Sky Striker Ace - Azalea(s)\" once per turn." },
		{ id: "destroy", kind: "card-text", cid: 18448, url: EN, read: "2026-11-26", quote: "If this card is Special Summoned: You can target 1 card on the field; destroy it, then, if you have 3 or less Spells in your GY, send this card to the GY." },
		{ id: "battle", kind: "card-text", cid: 18448, url: EN, read: "2026-11-26", quote: "Once per turn, at the start of the Damage Step, if this card battles an opponent's monster: You can banish 1 Spell from your GY; destroy that opponent's monster." },
		// OCG only. Konami's notes (補足情報, 2024-06-08), page read 2026-11-26. The card has no Q&A ("このカードに関連するＱ＆Ａはありません").
		{ id: "notes-materials", kind: "jp-notes", cid: 18448, url: NOTES, read: "2026-11-26", quote: "■光属性モンスター１体と闇属性モンスター１体、光属性モンスター２体、闇属性モンスター２体のいずれかをリンク素材としてリンク召喚できます。" },
		{ id: "notes-not-effect", kind: "jp-notes", cid: 18448, url: NOTES, read: "2026-11-26", quote: "■効果として扱いません。" },
		{ id: "notes-destroy-trigger", kind: "jp-notes", cid: 18448, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-battle-trigger", kind: "jp-notes", cid: 18448, url: NOTES, read: "2026-11-26", quote: "■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-damage-step", kind: "jp-notes", cid: 18448, url: NOTES, read: "2026-11-26", quote: "■ダメージステップでも発動できます。" },
		{ id: "notes-not-simultaneous", kind: "jp-notes", cid: 18448, url: NOTES, read: "2026-11-26", quote: "■処理時に、『そのカードを破壊する』処理を行います。対象のカードの破壊に成功したのち、自分の墓地の魔法カードの枚数が３枚以下の場合、その後、『このカードを墓地へ送る』処理を行います。これらの処理は同時に行われません。" },
	],
	effects: ["facts", "procedure", "link-only", "once-summon", "destroy", "battle"],
	rulings: [{ source: "notes-materials" }, { source: "notes-not-effect" }, { source: "notes-destroy-trigger" }, { source: "notes-battle-trigger" }, { source: "notes-damage-step" }, { source: "notes-not-simultaneous" }],
};
