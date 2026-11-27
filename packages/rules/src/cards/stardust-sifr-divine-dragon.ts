import { negateEffect } from "../chain";
import type { CardSources } from "../coverage";
import { destroyCard, type Duel, effectDestruction, moveCard, type Side } from "../duel";
import { ask, type CardDef, cardTypeOf, effectOf, targetsOf } from "../effects";
import { belongsTo } from "../identity";
import { canBeBanished, level } from "../modifiers";
import { askSpecialSummon, canSpecialSummon } from "../procedures";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";

const NAME = "Stardust Sifr Divine Dragon";
const STARDUST = "Stardust";

const isSynchro = (duel: Duel, id: number): boolean => factsOf(duel, id)?.frame === "synchro";

/** Every card on the field of either player, face-up or face-down: a monster, a Spell or Trap Card, a Field Spell. */
const cardsOnField = (duel: Duel): number[] => (["you", "rival"] as const).flatMap((side) => [...duel.piles[side].monster, ...duel.piles[side].spell, ...duel.piles[side].field]);

/** "1 Level 8 or lower "Stardust" monster in your GY" that can be Special Summoned (a Synchro Monster only if it was Synchro Summoned before: `canSpecialSummon`). */
const candidates = (duel: Duel, player: Side): number[] =>
	duel.piles[player].graveyard.filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster" && belongsTo(duel, id, STARDUST) && level(duel, id) <= 8 && canSpecialSummon(duel, player, id));

/**
 * "1 Tuner Synchro Monster + 2+ non-Tuner Synchro Monsters. Must be Synchro Summoned. The first time each card you control would be destroyed each turn,
 * by battle or card effect, it is not destroyed. Once per turn, when your opponent activates a monster effect (Quick Effect): You can negate that effect,
 * and if you do, destroy 1 card on the field. You can banish this card from your GY, then target 1 Level 8 or lower "Stardust" monster in your GY;
 * Special Summon it." A LIGHT Dragon Synchro Effect Monster of Level 12, and a "Stardust" card by its name (no Konami page read lists the archetype).
 *
 * - Procedure: the Synchro Summon whose Tuner and 2 or more non-Tuners are all Synchro Monsters, Levels adding up to 12.
 * - "Must be Synchro Summoned" is not an effect (notes): `summon.onlyByOwnProcedure`: only its own procedure, or an effect that says the Special Summon is
 *   treated as a Synchro Summon, Summons it (Konami's Q&A fid 18150: "Blue-Eyes Spirit Dragon"'s Tribute effect cannot).
 * - First effect: a Continuous Effect of the Monster Zone (notes): every card its controller controls, itself included, Spell and Trap Cards and face-down
 *   cards too (Q&A fid 16070), is spared the first time each turn it would be destroyed by battle or by a card effect (`firstEachTurn`; a use is a card's,
 *   kept when it is turned face-down on the field: Q&A fid 16068; two of these dragons protect once, not twice: fid 16069). The effect applies anew when this
 *   card comes face-up again (fid 16067), and is negated with the card (Skill Drain: fid 16066). It does not stop a Spell or Trap Card whose activation was
 *   negated and which is destroyed by that effect (fid 23488: not a destruction of a card on the field).
 * - Second effect: a Quick Effect of the Monster Zone (notes), chained directly to a monster effect the opponent activated, wherever its card was (hand,
 *   field, Graveyard: Q&A fid 16064), not in the Damage Step (notes, so no `damageStep`). It negates that Chain Link's effect only (Q&A fid 16063) and, if it
 *   did, destroys 1 card on the field chosen when it resolves (not a target), possibly this card itself when it is alone. "If you do" is read as the effect
 *   being negated after the negation (also one that was already negated, notes). Once per turn for each copy.
 * - Third effect: an Ignition Effect of the Graveyard (notes): banishing itself is the cost, then the target is chosen; the target must still be in the Graveyard
 *   when it resolves (Q&A fid 16060), and a Synchro Monster must have been Synchro Summoned before (`proper`, notes).
 */
export const STARDUST_SIFR_DIVINE_DRAGON: CardDef = {
	code: "stardust-sifr-divine-dragon",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Dragon", frame: "synchro", level: 12, atk: 4000, def: 4000, archetypes: [STARDUST] },
	summon: { onlyByOwnProcedure: true },
	procedure: { kind: "synchro", tuner: (duel, card) => isSynchro(duel, card.id), nonTuner: (duel, card) => isSynchro(duel, card.id), nonTuners: { min: 2 } },
	effects: [
		{
			type: "continuous",
			affects: (_duel, target, source) => target.controller === source.controller && (target.zone === "monster" || target.zone === "spell" || target.zone === "field"),
			modifies: () => [{ kind: "protect", against: ["effect-destruction", "battle-destruction"], firstEachTurn: true }],
		},
		{
			type: "quick",
			categories: ["negate", "destroy"],
			once: { scope: "instance" },
			condition: (duel, { player }) => {
				const top = duel.chain.at(-1);
				return top !== undefined && top.player !== player && cardTypeOf(duel, top.card) === "monster" && effectOf(duel, top).type !== "activation";
			},
			operation: (duel, link) => {
				if (link.answers === null) return duel;
				const negated = negateEffect(duel, link.answers);
				// "And if you do": the effect is negated now (it may already have been).
				if (!negated.chain[link.answers]!.effectNegated) return negated;
				return ask(negated, link.player, cardsOnField(negated), (board, picked) => destroyCard(board, picked, { destruction: effectDestruction(link) }));
			},
		},
		{
			type: "ignition",
			range: "graveyard",
			categories: ["special-summon"],
			condition: (duel, { player }) => candidates(duel, player).length > 0,
			cost: (duel, { card, player }) => (canBeBanished(duel, card.id, player) ? moveCard(duel, card.id, { zone: "banished", player }) : null),
			target: (duel, { player }) => candidates(duel, player),
			operation: (duel, link) => {
				const target = targetsOf(duel, link)[0];
				return target && target.zone === "graveyard" ? askSpecialSummon(duel, link.player, target.id) : duel;
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=11931&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(11931, "en");

export const STARDUST_SIFR_DIVINE_DRAGON_SOURCES: CardSources = {
	code: "stardust-sifr-divine-dragon",
	cid: 11931,
	french: {
		text: "1 Monstre Synchro Syntoniseur + 2+ Monstres Synchro non-Syntoniseur\nUniquement Invocable par Synchronisation. La première fois que chaque carte que vous contrôlez va être détruite chaque tour au combat ou par un effet de carte, elle n'est pas détruite. Une fois par tour, lorsque votre adversaire active un effet de monstre (Effet Rapide) : vous pouvez annuler l'effet, et si vous le faites, détruisez 1 carte sur le Terrain. Vous pouvez bannir cette carte depuis votre Cimetière, puis ciblez 1 monstre \"Poussière d'Étoile\" de max. Niveau 8 dans votre Cimetière ; Invoquez-le Spécialement.",
		url: konamiCardUrl(11931, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "Stardust Sifr Divine Dragon LIGHT Level 12 ATK 4000 DEF 4000 Dragon ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "1 Tuner Synchro Monster + 2+ non-Tuner Synchro Monsters" },
		{ id: "must-synchro", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "Must be Synchro Summoned." },
		{ id: "protect", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "The first time each card you control would be destroyed each turn, by battle or card effect, it is not destroyed." },
		{ id: "negate", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "Once per turn, when your opponent activates a monster effect (Quick Effect): You can negate that effect, and if you do, destroy 1 card on the field." },
		{ id: "revive", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "You can banish this card from your GY, then target 1 Level 8 or lower \"Stardust\" monster in your GY; Special Summon it." },
		{ id: "once", kind: "card-text", cid: 11931, url: EN, read: "2026-11-25", quote: "Once per turn, when your opponent activates a monster effect (Quick Effect):" },
		// OCG only. Konami's notes (補足情報, 2015-05-25), page read 2026-11-25. Its 15 Q&A entries: the titles were read, and 13 opened (fids 18150, 16060, 16063, 16064, 16066, 16067, 16068, 16069, 16070, 23488, 24106 and 16062); the others (fids 20948, 23963, 16065) are about other cards or about cards the core does not have.
		{ id: "notes-must-synchro", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "■効果として扱いません。" },
		{ id: "notes-protect-field", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "【①の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-negate-quick", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "【②の効果について】■モンスターゾーンで発動できる誘発即時効果です。" },
		{ id: "notes-negate-direct-chain", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "■相手が発動したモンスター効果に直接チェーンして発動できます。" },
		{ id: "notes-negate-no-damage-step", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "■ダメージステップには発動できません。" },
		{ id: "notes-negate-resolution", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "■処理時に、『その効果を無効にし』の処理を行い、無効にすることに成功した場合、『フィールドのカード１枚を破壊する』処理を行います。" },
		{ id: "notes-negate-already-negated", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "■すでに効果が無効化されている相手モンスターが効果を発動した時でも、この効果を発動できます。" },
		{ id: "notes-revive-ignition", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "【③の効果について】■墓地で発動できる起動効果です。" },
		{ id: "notes-revive-synchro", kind: "jp-notes", cid: 11931, url: NOTES, read: "2026-11-25", quote: "■この効果でシンクロモンスターを対象とする場合、そのモンスターは一度シンクロ召喚によって特殊召喚されている必要があります。" },
		{ id: "qa-spirit-dragon", kind: "jp-qa", cid: 11931, fid: 18150, url: qa(18150), read: "2026-11-25", quote: "「聖珖神竜 スターダスト・シフル」はシンクロ召喚でしか特殊召喚できないモンスターとなりますので、「青眼の精霊龍」のモンスター効果によって特殊召喚する事はできません。" },
		{ id: "qa-protect-everything", kind: "jp-qa", cid: 11931, fid: 16070, url: qa(16070), read: "2026-11-25", quote: "なお、「聖珖神竜 スターダスト・シフル」のコントローラーのフィールドに存在するカードであれば、裏側表示のカードも戦闘もしくは効果によって破壊されなくなります。" },
		{ id: "qa-skill-drain", kind: "jp-qa", cid: 11931, fid: 16066, url: qa(16066), read: "2026-11-25", quote: "「スキルドレイン」が適用されているのであれば、「聖珖神竜 スターダスト・シフル」の効果は無効になり、破壊されない効果を適用する事はできません。" },
		{ id: "qa-flipped-dragon", kind: "jp-qa", cid: 11931, fid: 16067, url: qa(16067), read: "2026-11-25", quote: "自分フィールドのカードはそれぞれもう1度戦闘または効果によって破壊されなくなります。" },
		{ id: "qa-flipped-card", kind: "jp-qa", cid: 11931, fid: 16068, url: qa(16068), read: "2026-11-25", quote: "裏側守備表示になったとしても、もう1度破壊されなくなる事はありません。" },
		{ id: "qa-two-dragons", kind: "jp-qa", cid: 11931, fid: 16069, url: qa(16069), read: "2026-11-25", quote: "そのカードが2度目に戦闘や効果で破壊される際には通常通り破壊される事になります。" },
		{ id: "qa-negate-and-destroy", kind: "jp-qa", cid: 11931, fid: 23488, url: qa(23488), read: "2026-11-25", quote: "カードの発動を無効にし破壊する処理はフィールドのカードを破壊する処理ではないためです。" },
		{ id: "qa-jet-dragon", kind: "jp-qa", cid: 11931, fid: 24106, url: qa(24106), read: "2026-11-25", quote: "結果的に、相手が発動した３枚目の「サンダー・ボルト」の効果が適用される際に「聖珖神竜 スターダスト・シフル」の①の効果が自身に適用されることになります。" },
		{ id: "qa-hand-graveyard", kind: "jp-qa", cid: 11931, fid: 16064, url: qa(16064), read: "2026-11-25", quote: "手札や墓地にて発動したモンスターの効果も無効にする事ができます。" },
		{ id: "qa-negate-one-link", kind: "jp-qa", cid: 11931, fid: 16063, url: qa(16063), read: "2026-11-25", quote: "その相手が発動した効果のチェーンブロックにて行われる処理のみを無効にします。" },
		{ id: "qa-target-gone", kind: "jp-qa", cid: 11931, fid: 16060, url: qa(16060), read: "2026-11-25", quote: "そのモンスターは特殊召喚されません。" },
		{ id: "qa-chalice", kind: "jp-qa", cid: 11931, fid: 16062, url: qa(16062), read: "2026-11-25", quote: "「聖珖神竜 スターダスト・シフル」の『その効果を無効にし、フィールドのカード１枚を選んで破壊する』処理が適用されます。" },
	],
	effects: ["facts", "procedure", "must-synchro", "protect", "negate", "once", "revive"],
	rulings: [
		{ source: "notes-must-synchro" },
		{ source: "notes-protect-field" },
		{ source: "notes-negate-quick" },
		{ source: "notes-negate-direct-chain" },
		{ source: "notes-negate-no-damage-step" },
		{ source: "notes-negate-resolution" },
		{ source: "notes-revive-ignition" },
		{ source: "notes-revive-synchro" },
		{ source: "qa-spirit-dragon" },
		{ source: "qa-protect-everything" },
		{ source: "qa-skill-drain" },
		{ source: "qa-flipped-dragon" },
		{ source: "qa-flipped-card" },
		{ source: "qa-two-dragons" },
		{ source: "qa-negate-and-destroy" },
		{ source: "qa-hand-graveyard" },
		{ source: "qa-negate-one-link" },
		{ source: "qa-target-gone" },
		{ source: "notes-negate-already-negated", pending: "Needs an opponent monster effect that is already negated when this card chains to it, which no card the core has can produce (the core's `negateEffect` on an already negated Chain Link keeps it negated, so the destruction follows)" },
		{ source: "qa-jet-dragon", pending: "Fid 24106 is about \"Blue-Eyes Jet Dragon\", which the core does not have (the core already lets a protection that is not \"the first time\" take precedence and spends no first time)" },
		{ source: "qa-chalice", pending: "Fid 16062 is about \"Forbidden Chalice\" (negating the targeted monster's effects), which the core does not have; it is the already-negated case above" },
	],
};
