import { negateActivation } from "../chain";
import type { CardSources } from "../coverage";
import { delay, delayedDestruction } from "../delayed";
import { destroyCard, type Duel, type Side } from "../duel";
import { ask, type CardDef } from "../effects";
import { belongsTo, hasPrintedName } from "../identity";
import { canSpecialSummon, tribute } from "../procedures";
import { konamiCardUrl } from "../sources";
import { askSpecialSummonIn, factsOf } from "./helpers";

const NAME = "Blue-Eyes Spirit Dragon";
const BLUE_EYES = "Blue-Eyes";

/** "1 LIGHT Dragon Synchro Monster from your Extra Deck ... except "Blue-Eyes Spirit Dragon"" that can be Special Summoned in the duel `duel` (a zone, no lock on it, properly Summoned first). */
const candidates = (duel: Duel, player: Side): number[] =>
	duel.piles[player].extra.filter((id) => {
		const facts = factsOf(duel, id);
		return facts?.frame === "synchro" && facts.attribute === "LIGHT" && facts.monsterType === "Dragon" && !hasPrintedName(duel, id, NAME) && canSpecialSummon(duel, player, id);
	});

/**
 * "1 Tuner + 1+ non-Tuner "Blue-Eyes" monsters. Neither player can Special Summon 2 or more monsters at the same time. Once per turn, when an
 * effect of a card in the GY is activated (Quick Effect): You can negate the activation. (Quick Effect): You can Tribute this Synchro Summoned
 * card; Special Summon 1 LIGHT Dragon Synchro Monster from your Extra Deck in Defense Position, except "Blue-Eyes Spirit Dragon", but destroy it
 * during the End Phase of this turn." A LIGHT Dragon Synchro Effect Monster of Level 9, and a "Blue-Eyes" monster (Konami's notes).
 *
 * - Procedure: the generic Synchro Summon with non-Tuners that are "Blue-Eyes" monsters (`facts.archetypes`), Levels adding up to 9.
 * - First effect: a Continuous Effect of the Monster Zone (notes): neither player can Special Summon 2 or more monsters at the same time
 *   (`summon-together` lock on both players), while the card is face-up in the Monster Zone and not negated.
 * - Second effect: a Quick Effect of the Monster Zone chained directly to the activation of an effect of a card in the GY (notes): the link on
 *   top of the chain, activated from the Graveyard (`Link.card.zone`, the card as it was when activated), of either player, whatever the card
 *   (a monster, or a Spell or Trap Card with an effect there). Once per turn for each copy. It can also be activated in the Damage Step (notes,
 *   OCG only): `damageStep: true`, every timing of the Damage Step the core has (limit L1 of docs/rules-core/blue-eyes-gaps.md).
 * - Third effect: a Quick Effect of the Monster Zone (notes), not in the Damage Step. It can be activated only by a card that was Synchro
 *   Summoned (`summonedBy`): still so after it was turned face-down and face-up again, or temporarily banished and returned (notes), and not when
 *   it was Special Summoned from the GY or banishment (a Special Summon that is not the procedure forgets it). The Tribute is the cost; the
 *   monster is chosen when the effect resolves, and the effect is activated only while one can be Special Summoned once the Tribute has freed
 *   the zone (the core's reading of "cannot activate when it cannot be done"). It is Special Summoned in Defense Position (not a Synchro Summon:
 *   a monster that "must be Synchro Summoned" is not a candidate), and destroyed by this card's effect during the End Phase of this turn: a delayed
 *   effect of the monster as it was, applied with no Chain Link; nothing happens to a monster that has left the field since.
 */
export const BLUE_EYES_SPIRIT_DRAGON: CardDef = {
	code: "blue-eyes-spirit-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 9, atk: 2500, def: 3000, archetypes: [BLUE_EYES], mentions: [NAME] },
	procedure: { kind: "synchro", nonTuner: (duel, card) => belongsTo(duel, card.id, BLUE_EYES) },
	effects: [
		{ type: "continuous", range: "field", affects: () => false, modifies: () => [{ kind: "lock", what: "summon-together", who: "both" }] },
		{
			type: "quick",
			damageStep: true,
			categories: ["negate"],
			once: { scope: "instance" },
			condition: (duel) => duel.chain.at(-1)?.card.zone === "graveyard",
			operation: (duel, link) => (link.answers === null ? duel : negateActivation(duel, link.answers)),
		},
		{
			type: "quick",
			categories: ["special-summon"],
			condition: (duel, { player, card }) => card.summonedBy === "synchro" && candidates(tribute(duel, [card.id]), player).length > 0,
			cost: (duel, { card }) => tribute(duel, [card.id]),
			operation: (duel, link) =>
				ask(duel, link.player, candidates(duel, link.player), (board, picked) =>
					askSpecialSummonIn(board, link.player, picked, "defense", {
						then: (done) =>
							delay(done, link, {
								due: { phase: "end", turn: done.turn.number },
								card: done.cards[picked]!,
								mandatory: true,
								apply: (next, self) => destroyCard(next, self.card!.id, { destruction: delayedDestruction(self) }),
							}),
					}),
				),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12324&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(12324, "en");

export const BLUE_EYES_SPIRIT_DRAGON_SOURCES: CardSources = {
	code: "blue-eyes-spirit-dragon",
	cid: 12324,
	french: {
		text: "1 Syntoniseur + 1+ monstre non-Syntoniseur \"Yeux Bleus\"\nAucun joueur ne peut Invoquer Spécialement min. 2 monstres en même temps. Une fois par tour, lorsque l'effet d'une carte dans le Cimetière est activé (Effet Rapide) : vous pouvez annuler l'activation. (Effet Rapide) : vous pouvez Sacrifier cette carte Invoquée par Synchronisation ; Invoquez Spécialement 1 Monstre Synchro LUMIÈRE Dragon (\"Dragon Esprit aux Yeux Bleus\" exclu) depuis votre Extra Deck en Position de Défense, mais détruisez-le durant la End Phase de ce tour.",
		url: konamiCardUrl(12324, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 12324, url: EN, read: "2026-11-25", quote: "Blue-Eyes Spirit Dragon LIGHT Level 9 ATK 2500 DEF 3000 Dragon ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 12324, url: EN, read: "2026-11-25", quote: "1 Tuner + 1+ non-Tuner \"Blue-Eyes\" monsters" },
		{ id: "lock", kind: "card-text", cid: 12324, url: EN, read: "2026-11-25", quote: "Neither player can Special Summon 2 or more monsters at the same time." },
		{ id: "negate", kind: "card-text", cid: 12324, url: EN, read: "2026-11-25", quote: "Once per turn, when an effect of a card in the GY is activated (Quick Effect): You can negate the activation." },
		{ id: "tribute", kind: "card-text", cid: 12324, url: EN, read: "2026-11-25", quote: "(Quick Effect): You can Tribute this Synchro Summoned card; Special Summon 1 LIGHT Dragon Synchro Monster from your Extra Deck in Defense Position, except \"Blue-Eyes Spirit Dragon\", but destroy it during the End Phase of this turn." },
		// OCG only. Konami's notes (補足情報, 2024-03-23), page read 2026-11-25. Its 18 Q&A entries: the titles were read and 11 opened (fids 14641, 18172, 18175, 24155, 18150 and the pending ones below; fids 18176, 24150 and 21460, on Special Summoning 2 monsters at the same time, are cited and tested by the rules records); 7 were not opened (fids 18179, 18122, 18180, 20037, 19893, 18181, 18177: Soul Charge, Light's Guidance, Peacock, Gigantic Kaiju Sleep, Synchro Cancel and Too Shallow Grave, cards the core does not have).
		{ id: "notes-archetype", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■「ブルーアイズ」モンスターです。" },
		{ id: "notes-lock-field", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-negate-quick", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-negate-direct-chain", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■墓地で効果が発動した時、その発動に直接チェーンして発動できます。" },
		{ id: "notes-negate-damage-step", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■ダメージステップ中でも発動できます。" },
		{ id: "notes-tribute-quick", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "【③の効果について】■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-tribute-no-damage-step", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■ダメージステップ中には発動できません。" },
		{ id: "notes-tribute-after-face-down", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■シンクロ召喚されたのち裏側守備表示になったこのカードが再び表側表示になっている場合でも発動できます。" },
		{ id: "notes-tribute-after-banish", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■シンクロ召喚されたのち一時的に除外されフィールドに戻っている場合でも発動できます。" },
		{ id: "notes-tribute-not-from-graveyard", kind: "jp-notes", cid: 12324, url: NOTES, read: "2026-11-25", quote: "■このカードが墓地や除外状態から特殊召喚されている場合、この効果は発動できません。" },
		{ id: "qa-synchro-flipped", kind: "jp-qa", cid: 12324, fid: 14641, url: qa(14641), read: "2026-11-25", quote: "（B）発動できます。" },
		{ id: "qa-gy-cost", kind: "jp-qa", cid: 12324, fid: 18175, url: qa(18175), read: "2026-11-25", quote: "墓地にて効果を発動していますので、チェーンして「青眼の精霊龍」のモンスター効果を発動し、その発動を無効にする事ができます。" },
		{ id: "qa-negation-still-applies", kind: "jp-qa", cid: 12324, fid: 18172, url: qa(18172), read: "2026-11-25", quote: "「青眼の精霊龍」の発動を無効にする処理は通常通り適用されます。" },
		{ id: "qa-true-light", kind: "jp-qa", cid: 12324, fid: 24155, url: qa(24155), read: "2026-11-25", quote: "相手が何も効果を発動しなかったのであれば、自分は「青眼の精霊龍」の②の効果をチェーン２で発動することができ、「真の光」の効果の発動を無効にできます。" },
		{ id: "qa-black-magic-curtain", kind: "jp-qa", cid: 12324, fid: 24313, url: qa(24313), read: "2026-11-25", quote: "「黒魔導のカーテン」の効果で２体特殊召喚される場合、特殊召喚するプレイヤーは別々ですので" },
		{ id: "qa-silver-dragon", kind: "jp-qa", cid: 12324, fid: 18171, url: qa(18171), read: "2026-11-25", quote: "「青眼の精霊龍」のモンスター効果によって特殊召喚された「蒼眼の銀龍」は、『このカードが特殊召喚に成功した時に発動する。自分フィールド上のドラゴン族モンスターは次のターンの終了時まで、カードの効果の対象にならず、カードの効果では破壊されない』モンスター効果を発動し、その効果が適用される事になります。" },
		{ id: "qa-sifr", kind: "jp-qa", cid: 12324, fid: 18150, url: qa(18150), read: "2026-11-25", quote: "「聖珖神竜 スターダスト・シフル」はシンクロ召喚でしか特殊召喚できないモンスターとなりますので、「青眼の精霊龍」のモンスター効果によって特殊召喚する事はできません。" },
	],
	effects: ["facts", "procedure", "lock", "negate", "tribute"],
	rulings: [
		{ source: "notes-archetype" },
		{ source: "notes-lock-field" },
		{ source: "notes-negate-quick" },
		{ source: "notes-negate-direct-chain" },
		{ source: "notes-negate-damage-step" },
		{ source: "notes-tribute-quick" },
		{ source: "notes-tribute-no-damage-step" },
		{ source: "notes-tribute-after-face-down" },
		{ source: "notes-tribute-after-banish" },
		{ source: "notes-tribute-not-from-graveyard" },
		{ source: "qa-synchro-flipped" },
		{ source: "qa-gy-cost" },
		{ source: "qa-negation-still-applies" },
		{ source: "qa-true-light" },
		{ source: "qa-black-magic-curtain", pending: "Fid 24313 is about \"Black Magic Curtain\" (a Special Summon of one monster for each player), which the core does not have" },
		{ source: "qa-silver-dragon", pending: "Fid 18171 is about \"Blue-Eyes Silver Dragon\" (a Dragon protection when it is Special Summoned), which the core does not have; the End Phase destruction is the one tested for the card's own Tribute effect" },
		{ source: "qa-sifr", pending: "Fid 18150 is tested with the card that has the clause, \"Stardust Sifr Divine Dragon\" (test/cards/stardust-sifr-divine-dragon.test.ts, record qa-spirit-dragon)" },
	],
};
