import type { SourceRecord } from "./sources";

/**
 * Step 6b (battle): the rules cited by test/rules/battle.test.ts. Quotes copied from the pages read on 2026-11-23 (see
 * docs/rules-core/battle/sources.md). RB10 and Konami's TCG Damage Step and Fast Effect Timing pages are TCG sources; the two
 * Japanese notes are OCG only.
 */
const read = "2026-11-23";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const DAMAGE_STEP = "https://www.yugioh-card.com/eu/play/damage-step-rules/";
const FET = "https://www.yugioh-card.com/eu/play/fast-effect-timing/";
const notesUrl = (cid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`;
const rule = (id: string, url: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url, read, quote });

export const BATTLE_SOURCES: readonly SourceRecord[] = [
	// RB10, Battle Phase (printed pp. 37-43).
	rule("battle-phase-four-steps", RB10, "The Battle Step and Damage Step are repeated each time you attack with a monster."),
	rule("no-battle-first-turn", RB10, "The player who goes first cannot conduct their Battle Phase on their first turn."),
	rule("attack-declaration", RB10, "Select 1 monster on your side of the field to attack with, and 1 of your opponent's monsters as your attack target, and then declare the attack. If your opponent does not have any monsters on the field, you can attack directly."),
	rule("one-attack-per-monster", RB10, "Each face-up Attack Position monster you control is allowed 1 attack per turn."),
	rule("replay-causes", RB10, "the attack target might be removed from the field, or a new monster may be played onto the opponent's side of the field before the Damage Step, due to a card's effect. This causes a \"Replay.\""),
	rule("replay", RB10, "Note that if you attack with a different monster, the first monster is still considered to have declared an attack, and it cannot attack again this turn."),
	rule("damage-step-activation-limit", RB10, "During the Damage Step, you can only activate Counter Trap Cards, or cards with effects that directly change a monster's ATK or DEF. Also, these cards can only be activated up until the start of damage calculation."),
	rule("damage-atk-vs-atk", RB10, "When your attacking monster's ATK is equal to the ATK of the opponent's monster, the result is considered a tie, and both monsters are destroyed. Neither player takes any battle damage."),
	rule("damage-atk-vs-def", RB10, "When your attacking monster's ATK is lower than the DEF of the opponent's monster, neither monster is destroyed. The amount that the opponent's monster's DEF exceeds the ATK of your attacking monster is subtracted from your LP as battle damage."),
	rule("zero-atk-destroys-nothing", RB10, "Monsters with 0 ATK cannot destroy anything by battle. If two Attack Position monsters with 0 ATK battle each other, neither monster is destroyed."),
	rule("damage-direct", RB10, "The full amount of your attacking monster's ATK is subtracted from the opponent's LP as battle damage."),
	rule("battled-needs-calc", RB10, "the attack had to have reached the damage calculation portion of the Damage Step in order for the monster to have \"battled\"."),
	rule("lp-zero-wins-both-draw", RB10, "If you and your opponent both reach 0 LP at the same time, the Duel is declared a draw."),
	rule("flip-face-up-before-calc", RB10, "If you attack a face-down Defense Position monster, flip the card to face-up Defense Position in the Damage Step."),
	// Konami's TCG Damage Step Rules page.
	rule("damage-step-timings", DAMAGE_STEP, "Determine whether either monster will be destroyed by battle or not, but do not send it to the Graveyard yet."),
	rule("destruction-sent-at-end", DAMAGE_STEP, "If a monster was determined to be destroyed by the battle during damage calculation, send it to the Graveyard first."),
	rule("flip-trigger-after-calc", DAMAGE_STEP, "If the monster has a Trigger Effect that activates by being flipped face-up, it does not activate yet."),
	// Konami's TCG Fast Effect Timing page: "Declare an attack" is among the open game state actions that do not start a Chain.
	rule("attack-is-no-chain-action", FET, "Declare an attack"),
	// OCG only: Konami's Japanese notes for Infinite Impermanence (cid 13631, dated 2021-05-15) and Solemn Strike (cid 12187, dated 2025-02-21).
	{ id: "impermanence-not-in-damage-step", kind: "jp-notes", cid: 13631, url: notesUrl(13631), read, quote: "■ダメージステップ中には発動できません。" },
	// OCG only. Konami's Japanese Q&A (fid 23968, 2025-01-25, listed under Superheavy Samurai Big Benkei, cid 11222): a monster attacking in
	// Defense Position whose permission to do so is negated in the Damage Step, before damage calculation, can no longer attack: no damage
	// calculation, the Damage Step ends. Applied by analogy to an attacker changed to Defense Position.
	{
		id: "defense-attacker-stops",
		kind: "jp-qa",
		cid: 11222,
		fid: 23968,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=23968&request_locale=ja",
		read,
		quote: "ダメージステップに入ってからダメージ計算までの間に無効化された場合、その「 スケアクロー・クシャトリラ 」は攻撃を行えなくなり、ダメージ計算は行われずに、ダメージステップが終了します。",
	},
	{ id: "solemn-strike-in-damage-step", kind: "jp-notes", cid: 12187, url: notesUrl(12187), read, quote: "■ダメージステップでも発動できます。" },
];
