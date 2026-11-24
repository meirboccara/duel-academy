import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { revealCards } from "../deck";
import { type Duel, moveCard, type Side } from "../duel";
import { type CardDef, effectOf, targetsOf } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { isNegated, level, negateCardEffects } from "../modifiers";
import { canSetByEffect, askSetByEffect } from "../set";
import { konamiCardUrl } from "../sources";
import { factsOf, isEffectMonster } from "./helpers";

const NAME = "Primite Drillbeam";
const PRIMITE = "Primite";

const isNormalMonster = (duel: Duel, id: number): boolean => duel.defs[duel.cards[id]!.code]?.kind === "monster" && factsOf(duel, id)?.normal === true;

/** "1 "Primite" card, or 1 Normal Monster, in your hand, except "Primite Drillbeam"": the cards that can be shown. */
const toShow = (duel: Duel, player: Side): number[] => duel.piles[player].hand.filter((id) => (belongsTo(duel, id, PRIMITE) || isNormalMonster(duel, id)) && !hasPrintedName(duel, id, NAME));

/**
 * "If you control a Normal Monster or a Level 5 or higher "Primite" monster, except a Token, you can activate this effect without revealing a
 * card": face-up in the Monster Zone (Konami's notes). The core has no Token, so none is there to be left out.
 */
const showsNothing = (duel: Duel, player: Side): boolean =>
	duel.piles[player].monster.some((id) => {
		const card = duel.cards[id]!;
		return card.face === "up" && (isNormalMonster(duel, id) || (belongsTo(duel, id, PRIMITE) && duel.defs[card.code]?.kind === "monster" && level(duel, id) >= 5));
	});

/**
 * "1 face-up card on the field" whose effects can be negated (Konami's notes: not a card whose effects are already negated, nor a monster that has no
 * effect; a Normal Monster that is an Equip Card in a Spell & Trap Zone can be, Konami's Q&A fid 24386). Not the card being activated.
 */
const targets = (duel: Duel, self: number): number[] =>
	(["monster", "spell", "field"] as const)
		.flatMap((zone) => [...duel.piles.you[zone], ...duel.piles.rival[zone]].map((id) => [zone, id] as const))
		.filter(([zone, id]) => id !== self && duel.cards[id]!.face === "up" && !isNegated(duel, id) && (zone !== "monster" || isEffectMonster(duel, id)))
		.map(([, id]) => id);

/** "During your Main Phase, if you control a "Primite" monster": a face-up one in the Monster Zone (Konami's notes). */
const controlsPrimite = (duel: Duel, player: Side): boolean => duel.piles[player].monster.some((id) => duel.cards[id]!.face === "up" && duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, PRIMITE));

/**
 * "Reveal 1 "Primite" card, or 1 Normal Monster, in your hand, except "Primite Drillbeam" (or if you control a Normal Monster or a Level 5 or higher
 * "Primite" monster, except a Token, you can activate this effect without revealing a card), then target 1 face-up card on the field; negate its
 * effects, and if you do, banish it. During your Main Phase, if you control a "Primite" monster: You can Set this card from your GY. You can only
 * use each effect of "Primite Drillbeam" once per turn." A Quick-Play Spell.
 *
 * - The card shown is a cost of the activation (the way of the cost, one for each card; the way with no card when a monster is controlled that
 *   allows it), shown to both players. A card shown can be shown again in the same Chain for another cost (Konami's Q&A fid 24176, OCG only).
 * - The target: see `targets`. Not a card the activation could not negate (a face-up card unaffected by this effect is a target, and is neither
 *   negated nor banished). "Cannot be banished" cards (notes) are not modelled for the field: the core's only banishing lock is on the Graveyard.
 * - "Negate its effects, and if you do, banish it": `negateCardEffects` says when it did nothing. For a Spell or Trap Card whose own
 *   activation is the Chain Link it is chained to, the effect of that link is negated too although the card is banished: YGOProJudge's answer
 *   only (asked 2026-11-24, no source cited, and Konami's notes and Q&A on this card say nothing about it); in the core a lasting negation
 *   follows the card as it is, so the script negates that link. A monster's effect already activated is not: the monster has left, and its
 *   effect resolves (the core's reading, no page read).
 * - Second effect: an Ignition Effect of the Graveyard (notes: Spell Speed 1, a Chain Link), Setting the card face-down in the controller's
 *   Spell & Trap Zone (a Quick-Play Spell Set this turn cannot be activated this turn); only while a zone is free. Each effect once per turn, by name.
 * - Tokens: the core has none, so "except a Token" and the Tokens that cannot be targeted cannot arise (no test).
 */
export const PRIMITE_DRILLBEAM: CardDef = {
	code: "primite-drillbeam",
	kind: "quick-play",
	facts: { name: NAME, archetypes: [PRIMITE], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["negate", "banish"],
			once: { scope: "name", key: "primite-drillbeam-negate" },
			cost: {
				pick: (duel, { player }) => [...(showsNothing(duel, player) ? [[]] : []), ...toShow(duel, player).map((id) => [id])],
				pay: (duel, { player }, picked) => revealCards(duel, player, picked),
			},
			target: (duel, { card }) => targets(duel, card.id),
			operation: (duel, link, index) => {
				const target = targetsOf(duel, link)[0];
				if (!target) return duel;
				const negated = negateCardEffects(duel, target.id, duel.turn.number, link);
				// "And if you do": nothing more when it was not negated.
				if (negated === duel) return duel;
				// A Spell or Trap Card chained to: the effect of its own activation is negated as well (YGOProJudge's lead).
				const pending = duel.chain.findIndex((entry, at) => at < index && entry.card.id === target.id && entry.card.moves === target.moves && effectOf(duel, entry).type === "activation");
				return moveCard(pending < 0 ? negated : negateEffect(negated, pending), target.id, { zone: "banished", effect: link });
			},
		},
		{
			type: "ignition",
			range: "graveyard",
			categories: ["set"],
			once: { scope: "name", key: "primite-drillbeam-set" },
			condition: (duel, { player, card }) => controlsPrimite(duel, player) && canSetByEffect(duel, player, card.id),
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				return now.zone === "graveyard" && now.moves === link.card.moves ? askSetByEffect(duel, link.player, now.id, { effect: link }) : duel;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=20536&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(20536, "en");

export const PRIMITE_DRILLBEAM_SOURCES: CardSources = {
	code: "primite-drillbeam",
	cid: 20536,
	french: {
		text: "Révélez 1 carte \"Primite\" (\"Rayon de Forage Primite\" exclu) ou 1 Monstre Normal dans votre main (ou si vous contrôlez un Monstre Normal ou un monstre \"Primite\" de min. Niveau 5, Jetons exclus, vous pouvez activer cet effet sans révéler de carte), puis ciblez 1 carte face recto sur le Terrain ; annulez ses effets, et si vous le faites, bannissez-la. Durant votre Main Phase, si vous contrôlez un monstre \"Primite\" : vous pouvez Poser cette carte depuis votre Cimetière. Vous ne pouvez utiliser chaque effet de \"Rayon de Forage Primite\" qu'une fois par tour.",
		url: konamiCardUrl(20536, "fr"),
		read: "2026-11-24",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 20536, url: EN, read: "2026-11-24", quote: "Quick-Play Spell" },
		{ id: "reveal", kind: "card-text", cid: 20536, url: EN, read: "2026-11-24", quote: "Reveal 1 \"Primite\" card, or 1 Normal Monster, in your hand, except \"Primite Drillbeam\"" },
		{ id: "reveal-free", kind: "card-text", cid: 20536, url: EN, read: "2026-11-24", quote: "(or if you control a Normal Monster or a Level 5 or higher \"Primite\" monster, except a Token, you can activate this effect without revealing a card)" },
		{ id: "target", kind: "card-text", cid: 20536, url: EN, read: "2026-11-24", quote: "then target 1 face-up card on the field; negate its effects, and if you do, banish it." },
		{ id: "set", kind: "card-text", cid: 20536, url: EN, read: "2026-11-24", quote: "During your Main Phase, if you control a \"Primite\" monster: You can Set this card from your GY." },
		{ id: "once", kind: "card-text", cid: 20536, url: EN, read: "2026-11-24", quote: "You can only use each effect of \"Primite Drillbeam\" once per turn." },
		// OCG only. Konami's notes (補足情報, 2024-07-27), page read 2026-11-24.
		{ id: "notes-free", kind: "jp-notes", cid: 20536, url: NOTES, read: "2026-11-24", quote: "■自分のモンスターゾーンにトークン以外の通常モンスターが表側表示で存在する場合、または自分のモンスターゾーンにトークン以外のレベル５以上の「原石」モンスターが表側表示で存在する場合、手札のカードを見せずに発動することもできます。" },
		{ id: "notes-targets", kind: "jp-notes", cid: 20536, url: NOTES, read: "2026-11-24", quote: "■すでに効果が無効化されているカードやモンスタートークン、効果を持たないモンスターを対象に選択することはできません。" },
		{ id: "notes-negate-then-banish", kind: "jp-notes", cid: 20536, url: NOTES, read: "2026-11-24", quote: "■処理時に、対象のカードの効果を無効にします。無効にすることに成功した場合、そのカードを除外します。" },
		{ id: "notes-set-gy", kind: "jp-notes", cid: 20536, url: NOTES, read: "2026-11-24", quote: "■自分のモンスターゾーンに表側表示の「原石」モンスターが存在する場合に発動できます。" },
		// OCG only. Konami's Q&A on the card (2 entries, both opened, page read 2026-11-24).
		{ id: "qa-reveal-again", kind: "jp-qa", cid: 20536, fid: 24176, url: qa(24176), read: "2026-11-24", quote: "以下の効果を発動する際も同様に、他の効果を発動する際のコストとして手札から見せたカードや、手札で効果を発動する際に見せたカードを、その同一チェーン上で発動する効果の際のコストとして見せることができます。" },
		{ id: "qa-equip-normal", kind: "jp-qa", cid: 20536, fid: 24386, url: qa(24386), read: "2026-11-24", quote: "装備カード扱いで装備されている通常モンスターカードを選択し、その効果で除外できますか？" },
	],
	effects: ["facts", "reveal", "reveal-free", "target", "set", "once"],
	rulings: [{ source: "notes-free" }, { source: "notes-targets" }, { source: "notes-negate-then-banish" }, { source: "notes-set-gy" }, { source: "qa-reveal-again" }, { source: "qa-equip-normal" }],
};
