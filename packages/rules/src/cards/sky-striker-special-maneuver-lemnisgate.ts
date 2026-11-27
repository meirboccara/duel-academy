import { askUpTo } from "../choices";
import type { CardSources } from "../coverage";
import { shuffleDecksOf } from "../deck";
import { type Duel, moveCard, moveCards, type Side } from "../duel";
import { ask, type CardDef, cardTypeOf, targetGroupsOf } from "../effects";
import { breakEffect } from "../events";
import { belongsTo } from "../identity";
import { canBeBanished } from "../modifiers";
import { canSummonByEffect, summonByEffect } from "../procedures";
import { konamiCardUrl } from "../sources";

const NAME = "Sky Striker Special Maneuver - Lemnisgate!";
const ACE = "Sky Striker Ace";
const SKY_STRIKER = "Sky Striker";

/** "\"Sky Striker Ace\" monsters in your GY". */
const acesInGraveyard = (duel: Duel, player: Side): number[] => duel.piles[player].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, ACE));

/** "\"Sky Striker\" Spells in your GY": a Spell Card of any kind (Normal, Quick-Play) of the archetype. */
const spellsInGraveyard = (duel: Duel, player: Side): number[] => duel.piles[player].graveyard.filter((id) => cardTypeOf(duel, duel.cards[id]!) === "spell" && belongsTo(duel, id, SKY_STRIKER));

/**
 * "1 card on the field" that can be returned to the hand: any card of either field, face-up or face-down, except a Spell or Trap Card activated in
 * this Chain that is still to be sent to the Graveyard after it (this card itself, a Quick-Play Spell chained). Konami's Q&A fid 21580 (OCG only, page read 2026-11-26, listed on the page of "Hieratic Seal of the Heavenly
 * Spheres", not on this card's) says that a Quick-Play Spell chained to an effect that returns a card is "a card to be sent to the Graveyard after its
 * activation" and cannot be chosen; the same reading here for the card itself, with the core's rule `chained-card-after-chain` as its test source. Read from this turn's
 * activations with the rule `resolveChain` sweeps by (as for "Hieratic Seal of the Heavenly Spheres"): a Continuous card, a Field Spell or an Equip
 * Card equipping a monster stays and may be chosen.
 */
const returnable = (duel: Duel): number[] => {
	const leaving = new Set(
		duel.activations
			.filter(({ card, effect }) => {
				const now = duel.cards[card.id]!;
				const record = duel.defs[card.code]?.effects?.[effect];
				return now.moves === card.moves && now.zone === "spell" && now.face === "up" && now.equippedTo === null && record?.type === "activation" && record.stays !== true && duel.defs[card.code]?.kind !== "monster";
			})
			.map(({ card }) => card.id),
	);
	return (["you", "rival"] as const).flatMap((side) => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field]).filter((id) => !leaving.has(id));
};

/** The "Sky Striker Ace" Link Monsters of the Extra Deck that an effect of `player` can Link Summon now, with materials from the field. */
const acesToLinkSummon = (duel: Duel, player: Side): number[] => duel.piles[player].extra.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, ACE) && duel.defs[duel.cards[id]!.code]?.facts?.frame === "link" && canSummonByEffect(duel, player, id));

/** Is the duel in the Damage Step (an attack has gone past its declaration)? */
const inDamageStep = (duel: Duel): boolean => duel.battle !== null && duel.battle.step !== "declared";

/**
 * "Target an equal number of "Sky Striker Ace" monsters and "Sky Striker" Spells in your GY; shuffle them into the Deck, then, for every 3
 * shuffled cards, you can return up to 1 card on the field to the hand. If a "Sky Striker" monster(s) is Special Summoned to your field, while this
 * card is in your GY (except during the Damage Step): You can banish this card; immediately after this effect resolves, Link Summon 1 "Sky Striker
 * Ace" Link Monster. You can only use each effect of "Sky Striker Special Maneuver - Lemnisgate!" once per turn." A Quick-Play Spell, "Sky Striker"
 * by its name.
 *
 * - First effect (notes: the effect of the card's own activation; not in the Damage Step, a Quick-Play Spell that changes no ATK or DEF): the targets
 *   are two groups of the same size, one of "Sky Striker Ace" monsters and one of "Sky Striker" Spells of the player's Graveyard, at least one each
 *   (`targetGroups` with `sameCount`). When it resolves the targets that are gone are skipped and the others are processed (notes). They go back
 *   together to the Deck, the monsters of the Extra Deck to the Extra Deck, and the Deck is shuffled; the number counted is the number that went
 *   back (notes: 3 or more must be returned, "for every 3" is read on that number). "Then" is a break (notes: not simultaneous): the player picks
 *   0 up to that number / 3 (rounded down) cards on either field, face-up or face-down, and they go to their owners' hands (an Extra Deck monster to
 *   its Extra Deck). The card itself, being activated in the Chain, cannot be chosen (fid 21580).
 * - Second effect: a Trigger Effect of the Graveyard, optional, "if" (it does not miss the timing). It triggers off a "Sky Striker" monster
 *   Special Summoned to the player's field after this card was already in the Graveyard: not for one Summoned by an effect of the same Chain that
 *   sent this card there (Konami's Q&A fid 24167, OCG only), and not in the Damage Step (the text and notes). The cost banishes this card; when the
 *   effect resolves the player chooses an "Sky Striker Ace" Link Monster of the Extra Deck and Link Summons it with materials of the field, right
 *   after the Chain Link (`summonByEffect`: with Chain Link 1 a window to answer opens after the chain, from Chain Link 2 no: fids 24054, 16986).
 *   The effect is one that Special Summons (fid 23933): its categories say so. It is activated only while such a Link Summon is possible (the
 *   core's reading "cannot activate when it cannot be done", no Konami page found for this card).
 * - "Must be Link Summoned" monsters (Azalea) are candidates: this is a Link Summon.
 * - Each effect once per turn, by name, one use each (they do not share one).
 */
export const SKY_STRIKER_SPECIAL_MANEUVER_LEMNISGATE: CardDef = {
	code: "sky-striker-special-maneuver-lemnisgate",
	kind: "quick-play",
	facts: { name: NAME, archetypes: [SKY_STRIKER], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["return-to-deck", "return-to-hand"],
			once: { scope: "name", key: "sky-striker-special-maneuver-lemnisgate-1" },
			sameCount: true,
			targetGroups: (duel, { player }) => {
				const aces = acesInGraveyard(duel, player);
				const spells = spellsInGraveyard(duel, player);
				return [
					{ from: aces, min: 1, max: Math.min(aces.length, spells.length) },
					{ from: spells, min: 1, max: Math.min(aces.length, spells.length) },
				];
			},
			operation: (duel, link) => {
				// The targets that are still the cards targeted (a card that left the Graveyard and came back is another card).
				const targets = targetGroupsOf(duel, link)
					.flat()
					.map((card) => card.id);
				if (targets.length === 0) return duel;
				const back = moveCards(duel, targets, { zone: "deck", effect: link });
				const shuffled = shuffleDecksOf(back, targets);
				const count = targets.filter((id) => (back.cards[id]!.zone === "deck" || back.cards[id]!.zone === "extra") && back.cards[id]!.moves !== duel.cards[id]!.moves).length;
				const room = Math.floor(count / 3);
				if (room === 0) return shuffled;
				return askUpTo(breakEffect(shuffled), link.player, returnable(shuffled), { min: 0, max: room }, (board, picked) => moveCards(board, picked, { zone: "hand", effect: link }));
			},
		},
		{
			type: "trigger",
			range: "graveyard",
			timing: "if",
			categories: ["special-summon"],
			once: { scope: "name", key: "sky-striker-special-maneuver-lemnisgate-2" },
			condition: (duel, { player }) => acesToLinkSummon(duel, player).length > 0,
			cost: (duel, { player, card }) => (canBeBanished(duel, card.id, player) ? moveCard(duel, card.id, { zone: "banished", player }) : null),
			event: (duel, event, { card }) => event.type === "summoned" && event.how === "special" && event.card.controller === card.controller && belongsTo(duel, event.card.id, SKY_STRIKER) && !inDamageStep(duel),
			operation: (duel, link, index) => ask(duel, link.player, acesToLinkSummon(duel, link.player), (board, picked) => summonByEffect(board, index, link.player, picked)),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=21480&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(21480, "en");

export const SKY_STRIKER_SPECIAL_MANEUVER_LEMNISGATE_SOURCES: CardSources = {
	code: "sky-striker-special-maneuver-lemnisgate",
	cid: 21480,
	french: {
		text: "Ciblez un nombre égal de monstres \"Assaut de l'Air - As\" et Magies \"Assaut de l'Air\" dans votre Cimetière ; mélangez-les dans le Deck, puis, pour toutes les 3 cartes mélangées, vous pouvez renvoyer max. 1 carte sur le Terrain à la main. Si un ou plusieurs monstres \"Assaut de l'Air\" sont Invoqués Spécialement sur votre Terrain, tant que cette carte est dans votre Cimetière (sauf durant la Damage Step) : vous pouvez bannir cette carte ; immédiatement après la résolution de cet effet, Invoquez par Lien 1 Monstre Lien \"Assaut de l'Air - As\". Vous ne pouvez utiliser chaque effet de \"Assaut de l'Air - Manœuvre Spéciale - Portail Lemniscate !\" qu'une fois par tour.",
		url: konamiCardUrl(21480, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 21480, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "shuffle", kind: "card-text", cid: 21480, url: EN, read: "2026-11-26", quote: "Target an equal number of \"Sky Striker Ace\" monsters and \"Sky Striker\" Spells in your GY; shuffle them into the Deck," },
		{ id: "return", kind: "card-text", cid: 21480, url: EN, read: "2026-11-26", quote: "then, for every 3 shuffled cards, you can return up to 1 card on the field to the hand." },
		{ id: "link-summon", kind: "card-text", cid: 21480, url: EN, read: "2026-11-26", quote: "If a \"Sky Striker\" monster(s) is Special Summoned to your field, while this card is in your GY (except during the Damage Step): You can banish this card; immediately after this effect resolves, Link Summon 1 \"Sky Striker Ace\" Link Monster." },
		{ id: "once", kind: "card-text", cid: 21480, url: EN, read: "2026-11-26", quote: "You can only use each effect of \"Sky Striker Special Maneuver - Lemnisgate!\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2025-04-26), page read 2026-11-26. Its 3 Q&A: fids 24167 and 23933 are opened below; the third (the Sky Striker
		// Ace - Kaina's Continuous Effect when it is a Link Material of the second effect) is about a card of neither list and is not opened.
		{ id: "notes-chain-block", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■このカードの発動時の効果です。" },
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-shuffle-then-return", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■処理時に、『そのカードをデッキに戻す』処理を行います。デッキ・エクストラデッキに３枚以上戻すことに成功した場合、その後、『戻したカード３枚につき１枚まで、フィールドのカードを手札に戻す』処理を行うことができます。" },
		{ id: "notes-not-simultaneous", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■デッキ・エクストラデッキに戻す処理と手札に戻す処理を両方行う場合、それらは同時には行われません。" },
		{ id: "notes-partial-targets", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■処理時に、対象のカードの一部が対象から外れていた場合でも、残りの対象のカードについて処理を行います。" },
		{ id: "notes-gy-chain-block", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■墓地で発動できるチェーンブロックの作られる効果です。" },
		{ id: "notes-gy-no-damage-step", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-immediately-after", kind: "jp-notes", cid: 21480, url: NOTES, read: "2026-11-26", quote: "■この効果のチェーンブロックの処理後、ただちに「閃刀姫」リンクモンスター１体のリンク召喚を行います。" },
		// OCG only. Konami's Q&A fids 24167 (2025-04-26) and 23933 (2026-09-04), pages read 2026-11-26.
		{ id: "qa-summoned-before-in-graveyard", kind: "jp-qa", cid: 21480, fid: 24167, url: qa(24167), read: "2026-11-26", quote: "『このカードが墓地に存在する状態で、自分フィールドに「閃刀」モンスターが特殊召喚された』という条件を満たしていないことになります。" },
		{ id: "qa-link-summon-is-special-summon", kind: "jp-qa", cid: 21480, fid: 23933, url: qa(23933), read: "2026-11-26", quote: "以下のような、シンクロ召喚・エクシーズ召喚・リンク召喚・ペンデュラム召喚を行う効果も『モンスターを特殊召喚する効果』を含みます。" },
	],
	effects: ["facts", "shuffle", "return", "link-summon", "once"],
	rulings: [
		{ source: "notes-chain-block" },
		{ source: "notes-no-damage-step" },
		{ source: "notes-shuffle-then-return" },
		{ source: "notes-not-simultaneous" },
		{ source: "notes-partial-targets" },
		{ source: "notes-gy-chain-block" },
		{ source: "notes-gy-no-damage-step" },
		{ source: "notes-immediately-after" },
		{ source: "qa-summoned-before-in-graveyard" },
		{ source: "qa-link-summon-is-special-summon" },
	],
};
