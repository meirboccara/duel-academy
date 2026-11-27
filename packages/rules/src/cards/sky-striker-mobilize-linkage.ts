import type { CardSources } from "../coverage";
import { type Duel, moveCard, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo } from "../identity";
import { addModifier, FOREVER } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { summonZones } from "../zones";
import { factsOf } from "./helpers";
import { noMainMonsters } from "./sky-striker-helpers";

const NAME = "Sky Striker Mobilize - Linkage!";
const ACE = "Sky Striker Ace";
/** The Extra Monster Zones (slots 5 and 6): where the Ace is Special Summoned. */
const EXTRA_MONSTER_ZONES = [5, 6];

/** "1 other card you control": a monster, a Spell or Trap, the Field Spell, other than this card (which is on the field while it resolves). */
const otherCards = (duel: Duel, player: Side, self: number): number[] => [...duel.piles[player].monster, ...duel.piles[player].spell, ...duel.piles[player].field].filter((id) => id !== self);

/** The "Sky Striker Ace" monsters of the Extra Deck that can be Special Summoned to an Extra Monster Zone now. */
const acesToSummon = (duel: Duel, player: Side): number[] =>
	duel.piles[player].extra.filter((id) => belongsTo(duel, id, ACE) && duel.defs[duel.cards[id]!.code]?.kind === "monster" && canSpecialSummon(duel, player, id) && summonZones(duel, player, id).some((zone) => EXTRA_MONSTER_ZONES.includes(zone)));

/** The other cards whose sending leaves room for an Ace ("send 1 other card you control to the GY, and if you do, Special Summon ..."), read on the board as it is. */
const sendable = (duel: Duel, player: Side, self: number): number[] => otherCards(duel, player, self).filter((id) => acesToSummon(moveCard(duel, id, { zone: "graveyard" }), player).length > 0);

/** "At least 1 LIGHT and 1 DARK "Sky Striker Ace" monsters on your field and/or in your GY": the face-up monsters of the field and the Graveyard, as printed. */
const hasLightAndDarkAces = (duel: Duel, player: Side): boolean => {
	const attributes = new Set([...duel.piles[player].monster.filter((id) => duel.cards[id]!.face === "up"), ...duel.piles[player].graveyard].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, ACE)).map((id) => factsOf(duel, id)?.attribute));
	return attributes.has("LIGHT") && attributes.has("DARK");
};

/**
 * "If you control no monsters in your Main Monster Zone: You cannot Special Summon from the Extra Deck for the rest of this turn after this card
 * resolves, except "Sky Striker Ace" monsters, also send 1 other card you control to the GY, and if you do, Special Summon 1 "Sky Striker Ace"
 * monster from your Extra Deck to the Extra Monster Zone, and if you have at least 1 LIGHT and 1 DARK "Sky Striker Ace" monsters on your field and/or
 * in your GY, the Summoned monster gains 1000 ATK." A Quick-Play Spell, "Sky Striker" by its name.
 *
 * - Condition: no monster of the player in a Main Monster Zone; a monster in an Extra Monster Zone does not stop it (notes). A Quick-Play Spell that
 *   changes no ATK or DEF, so it is not activated in the Damage Step (notes). YGOProJudge only (chat of 2026-11-26, it cited no Konami page for the
 *   activation): it cannot be activated unless another card can be sent and an Ace can then be Special Summoned to an Extra Monster Zone; the notes'
 *   "whether or not the send or the Summon succeeded" is read as the case where things change between the activation and the resolution.
 * - The restriction ("you cannot Special Summon from the Extra Deck ... except "Sky Striker Ace" monsters") is a `summon` lock on cards of the Extra
 *   Deck that are not "Sky Striker Ace" cards, set first when the effect resolves, and applied whether or not the send or the Summon succeeded, unless
 *   the activation or effect is negated (notes, Konami's Q&A fid 24181). It stays if this card has left the field.
 * - "Send 1 other card you control to the GY, and if you do": the card is chosen when the effect resolves among the other cards of the field. The
 *   notes' rule: when the player has a monster in an Extra Monster Zone and an Ace of the Extra Deck can be Special Summoned, only that monster can be
 *   sent. The core reads it as: only the cards whose sending leaves room for an Ace are offered while there is one; with none, any other card may be
 *   sent and nothing is Summoned. A card that goes elsewhere than the GY (the `redirect` layer: Q&A fid 24181, banished instead) is not "sent": no
 *   Summon.
 * - The Summon goes to an Extra Monster Zone (any of those it may take), the player choosing the Ace and the zone. The send and the Summon are
 *   simultaneous in the notes: the core does the send, then the Summon, as for Crimson Dragon (no card of the lists reads the difference).
 * - The 1000 ATK is read when the Summon is done (notes): the Summoned monster counts if it is itself the LIGHT or DARK Ace needed, and so do the
 *   cards sent. It lasts as long as the card stays on the field.
 */
export const SKY_STRIKER_MOBILIZE_LINKAGE: CardDef = {
	code: "sky-striker-mobilize-linkage",
	kind: "quick-play",
	facts: { name: NAME, archetypes: ["Sky Striker"], mentions: [NAME] },
	effects: [
		{
			type: "activation",
			categories: ["special-summon", "send-to-graveyard"],
			condition: (duel, { player, card }) => noMainMonsters(duel, player) && sendable(duel, player, card.id).length > 0,
			operation: (duel, link) => {
				const locked = addModifier(duel, {
					affects: () => false,
					until: duel.turn.number,
					layer: { kind: "lock", what: "summon", who: link.player, ways: ["special"], only: (board, card) => card.zone === "extra" && !belongsTo(board, card.id, ACE), describe: 'from the Extra Deck, except "Sky Striker Ace" monsters' },
				});
				const candidates = otherCards(locked, link.player, link.card.id);
				// Only the cards whose sending leaves room for an Ace, while one can be found (notes).
				const leavingRoom = candidates.filter((id) => acesToSummon(moveCard(locked, id, { zone: "graveyard", effect: link }), link.player).length > 0);
				return ask(locked, link.player, leavingRoom.length > 0 ? leavingRoom : candidates, (board, picked) => {
					const sent = moveCard(board, picked, { zone: "graveyard", effect: link });
					// "If you do": the card must really be in the Graveyard (not banished instead).
					if (sent.cards[picked]!.zone !== "graveyard") return sent;
					return ask(sent, link.player, acesToSummon(sent, link.player), (next, ace) =>
						askSpecialSummon(next, link.player, ace, {
							zones: EXTRA_MONSTER_ZONES,
							then: (done) => {
								if (!hasLightAndDarkAces(done, link.player)) return done;
								const monster = done.cards[ace]!;
								return addModifier(done, { affects: { card: monster.id, moves: monster.moves }, until: FOREVER, layer: { kind: "add", stat: "atk", by: 1000 }, by: link });
							},
						}),
					);
				});
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=17034&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(17034, "en");

export const SKY_STRIKER_MOBILIZE_LINKAGE_SOURCES: CardSources = {
	code: "sky-striker-mobilize-linkage",
	cid: 17034,
	french: {
		text: "Si vous ne contrôlez aucun monstre dans votre Zone Monstre Main : vous ne pouvez pas Invoquer Spécialement (monstres \"Assaut de l'Air - As\" exclus) depuis l'Extra Deck le reste de ce tour après la résolution de cette carte, et aussi, envoyez 1 autre carte que vous contrôlez au Cimetière, et si vous le faites, Invoquez Spécialement 1 monstre \"Assaut de l'Air - As\" depuis votre Extra Deck dans la Zone Monstre Extra, et si vous avez min. 1 monstre \"Assaut de l'Air - As\" LUMIÈRE et min. 1 monstre \"Assaut de l'Air - As\" TÉNÈBRES sur votre Terrain et/ou dans votre Cimetière, le monstre Invoqué gagne 1000 ATK.",
		url: konamiCardUrl(17034, "fr"),
		read: "2026-11-26",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 17034, url: EN, read: "2026-11-26", quote: "Quick-Play Spell" },
		{ id: "condition", kind: "card-text", cid: 17034, url: EN, read: "2026-11-26", quote: "If you control no monsters in your Main Monster Zone:" },
		{ id: "lock", kind: "card-text", cid: 17034, url: EN, read: "2026-11-26", quote: "You cannot Special Summon from the Extra Deck for the rest of this turn after this card resolves, except \"Sky Striker Ace\" monsters," },
		{ id: "send-summon", kind: "card-text", cid: 17034, url: EN, read: "2026-11-26", quote: "also send 1 other card you control to the GY, and if you do, Special Summon 1 \"Sky Striker Ace\" monster from your Extra Deck to the Extra Monster Zone," },
		{ id: "atk", kind: "card-text", cid: 17034, url: EN, read: "2026-11-26", quote: "and if you have at least 1 LIGHT and 1 DARK \"Sky Striker Ace\" monsters on your field and/or in your GY, the Summoned monster gains 1000 ATK." },
		// OCG only. Konami's notes (補足情報), page read 2026-11-26. Its single Q&A (fid 24181) below.
		{ id: "notes-no-damage-step", kind: "jp-notes", cid: 17034, url: NOTES, read: "2026-11-26", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-emz-monster", kind: "jp-notes", cid: 17034, url: NOTES, read: "2026-11-26", quote: "■自分のメインモンスターゾーンにモンスターが存在しないのであれば、エクストラモンスターゾーンに自分のモンスターが存在する状況でも発動できます。" },
		{ id: "notes-only-emz-monster", kind: "jp-notes", cid: 17034, url: NOTES, read: "2026-11-26", quote: "■処理時に、エクストラモンスターゾーンに自分のモンスターが存在し、エクストラデッキに特殊召喚可能な「閃刀姫」モンスターが存在する場合、『墓地へ送り』の処理を適用するカードとして、そのエクストラモンスターゾーンの自分のモンスターしか選べません。" },
		{ id: "notes-atk-at-summon", kind: "jp-notes", cid: 17034, url: NOTES, read: "2026-11-26", quote: "特殊召喚した時点で、自分のフィールドおよび自分の墓地のカードの中に、光属性と闇属性の「閃刀姫」モンスターがそれぞれ存在する場合、特殊召喚したモンスターの攻撃力はただちに１０００アップします。" },
		{ id: "notes-lock-regardless", kind: "jp-notes", cid: 17034, url: NOTES, read: "2026-11-26", quote: "■墓地へ送る処理やエクストラデッキから「閃刀姫」モンスターを特殊召喚する処理に成功したかどうかにかかわらず、この効果の発動や効果が無効にならなかったのであれば、『ターン終了時まで自分は「閃刀姫」モンスターしかEXデッキから特殊召喚できない』状態になります。" },
		// OCG only. Konami's Q&A fid 24181 (2025-06-05), page read 2026-11-26.
		{ id: "qa-redirect", kind: "jp-qa", cid: 17034, fid: 24181, url: qa(24181), read: "2026-11-26", quote: "結果的に『自分フィールドの他のカード１枚を墓地へ送り』の処理に成功していませんので、『EXデッキから「閃刀姫」モンスター１体を特殊召喚する』処理は行われません。" },
	],
	effects: ["facts", "condition", "lock", "send-summon", "atk"],
	rulings: [{ source: "notes-no-damage-step" }, { source: "notes-emz-monster" }, { source: "notes-only-emz-monster" }, { source: "notes-atk-at-summon" }, { source: "notes-lock-regardless" }, { source: "qa-redirect" }],
};
