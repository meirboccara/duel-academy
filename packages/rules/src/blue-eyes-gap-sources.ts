import { konamiCardUrl, type SourceRecord } from "./sources";

/**
 * The mechanic gaps of the exact Blue-Eyes 746021 list (audit in docs/rules-core/blue-eyes-gaps.md): the Konami pages cited by
 * test/rules/{trigger-events,leave-field-banish}.test.ts and the other tests of that slice, read on 2026-11-24. The card texts are
 * Konami's TCG database (English); the notes and Q&A are Konami's Japanese database (OCG only: no formal authority over the TCG).
 * None of the cards named here is written yet: the tests use made-up cards with the same wording.
 */
const read = "2026-11-24";
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const text = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "card-text", cid, url: konamiCardUrl(cid, "en"), read, quote });
const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });
const notes = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "jp-notes", cid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=${cid}&request_locale=ja`, read, quote });
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });

const DEEP_EYES = 22717;
const PROSPERITY = 15756;

export const BLUE_EYES_GAP_SOURCES: readonly SourceRecord[] = [
	// Deep-Eyes White Dragon, the Blue Abyss: its trigger targets one of the monsters whose sending triggered it.
	text("trigger-targets-one-of-them", DEEP_EYES, "If a \"Blue-Eyes\" Ritual Monster or \"Blue-Eyes White Dragon\" is sent to your GY (except during the Damage Step): You can target 1 of them in the GY; Special Summon this card from your GY (if it was there when the monster was sent) or hand (even if not)"),
	// Its notes (page dated 2026-09-25): in the GY, the card must already be there when the monster is sent.
	notes("trigger-from-gy-needs-card-there-first", DEEP_EYES, "■この効果を墓地で発動する場合、このカードが墓地に存在する状態で、該当のモンスターが自分の墓地へ送られる必要があります。（該当のモンスターとこのカードが同時に墓地へ送られた場合には発動できません。）"),
	// "... also banish it when it leaves the field", and its notes on when that state and the ATK end.
	text("banish-when-it-leaves-text", DEEP_EYES, "and if you do, its ATK becomes that target's, also banish it when it leaves the field."),
	notes("banish-when-it-leaves-ends-face-down", DEEP_EYES, "■この効果で特殊召喚したこのカードがモンスターゾーンに表側表示で存在しなくなった場合、『フィールドから離れた場合に除外される』状態ではなくなります。"),
	notes("own-lasting-effect-stops-while-negated", DEEP_EYES, "■この効果で特殊召喚したこのカードがモンスターゾーンに表側表示で存在しなくなった場合、このカードの効果が無効化された場合に、『攻撃力が対象のモンスターと同じになり』の効果の適用はなくなります。"),
	// RB10, Glossary, "Leaves the Field": a monster that becomes an Xyz Material is no longer on the field, and its "leaves the field"
	// effects do not activate. That "banish it when it leaves the field" does not apply to it either is YGOProJudge's answer only.
	rb10("xyz-material-not-on-the-field", "When a monster on the field is shuffled into the Main Deck, or becomes an Xyz Material, it is no longer a card on the field, however its effects that activate when it \"leaves the field\" will not activate."),
	// Pot of Prosperity: "the turn you activate this card", its notes (page dated 2026-09-10) and its Q&A on a negated activation or effect.
	text("oath-text", PROSPERITY, "You cannot draw cards by card effects the turn you activate this card."),
	notes("oath-not-after-a-draw", PROSPERITY, "■効果として扱いません。このカードの発動の条件です。 ■既にカードの効果で自分がドローしたターンにはこのカードを発動できません。また、このカードを発動したターンにはカードの効果でドローできません。"),
	notes("oath-from-activation", PROSPERITY, "■このカードを発動した時点で、（実際に処理が行われたかどうかにかかわらず、）そのターン、自分はカードの効果でドローできなくなります。ただし、この効果の発動が無効になった場合、カードの効果でドローできる状態に戻ります。"),
	qa("oath-activation-negated-lifts", PROSPERITY, 23378, "「金満で謙虚な壺」の発動が無効になった場合、同じターン中に自分はカードの効果によってドローできます。"),
	qa("oath-effect-negated-stays", PROSPERITY, 23378, "ただし、「金満で謙虚な壺」の効果が無効になった場合、同じターン中に自分はカードの効果によってドローできません。"),
	// Setting a Spell or Trap by an effect: Primite Dragon Ether Beryl (cid 20754), Primite Drillbeam (cid 20536), and the rulebook on Set cards.
	text("set-from-deck-text", 20754, "If this card is Normal Summoned: You can Set 1 \"Primite\" Spell/Trap from your Deck."),
	text("set-from-gy-text", 20536, "During your Main Phase, if you control a \"Primite\" monster: You can Set this card from your GY."),
	rb10("set-trap-not-the-same-turn", "You cannot activate a Trap in the same turn that you Set it, but you can activate it at any time after that"),
	rb10("set-quick-play-not-the-same-turn", "Spell Cards can be activated during the Main Phases even in the same turn that you Set them (except for Quick-Play Spell Cards)."),
	rb10("set-field-spell-replaces", "Each player can have 1 Field Spell Card on their own side of the field. To use another Field Spell, send your previous one to the Graveyard."),
	// Roar of the Blue-Eyed Dragons (cid 20605): its GY effect.
	text("fusion-including-text", 20605, "You can banish this card from your GY; Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field, including a \"Blue-Eyes\" monster."),
	// Primite Drillbeam (cid 20536): its first effect, and its notes (page dated 2026-07-09).
	text("negate-face-up-card-text", 20536, "then target 1 face-up card on the field; negate its effects, and if you do, banish it."),
	notes("negate-then-banish-if-negated", 20536, "■処理時に、対象のカードの効果を無効にします。無効にすることに成功した場合、そのカードを除外します。"),
	// Pot of Prosperity: the halved damage, its notes and its Q&A on two halving effects.
	text("damage-halved-text", PROSPERITY, "for the rest of this turn after this card resolves, any damage your opponent takes is halved"),
	notes("damage-halved-at-resolution", PROSPERITY, "また、処理時に、『ターン終了時まで相手が受ける全てのダメージは半分になる』効果を適用します。"),
	qa("damage-halved-does-not-stack", PROSPERITY, 23511, "「金満で謙虚な壺」の『相手が受ける全てのダメージは半分になる』と、「M・HERO 闇鬼」の『その直接攻撃で相手に与える戦闘ダメージは半分になる』効果は重複しません。（ダメージが半分の半分になることはありません。）"),
	// Pot of Prosperity: its cost, and its notes on it.
	text("chosen-cost-text", PROSPERITY, "Banish 3 or 6 cards of your choice from your Extra Deck, face-down;"),
	notes("chosen-cost-is-a-cost", PROSPERITY, "■このカードを発動する際にコストとして、自分のエクストラデッキのカードを３枚または６枚、裏側で除外します（EXデッキの表側のカードも除外できます）。"),
	// Blue-Eyes Tyrant Dragon (cid 16842) and Neo Blue-Eyes Ultimate Dragon (cid 12484): the end of the Damage Step.
	text("end-of-damage-step-battled-text", 16842, "Once per turn, at the end of the Damage Step, if this card battled: You can target 1 Trap in your GY; Set it."),
	notes("end-of-damage-step-where", 16842, "■このカードが戦闘で破壊されなかった場合にはモンスターゾーンで、戦闘で破壊され墓地へ送られた場合には墓地で、戦闘で破壊され表側で除外された場合には除外状態で発動できます。"),
	text("end-of-damage-step-attacked-text", 12484, "At the end of the Damage Step, if this Fusion Summoned card attacked, and this is the only face-up card you control:"),
	// Extra Deck cards of the list: Lightstorm Dragon (cid 20780), Psychic End Punisher (cid 17154), Blue-Eyes Ultimate Spirit Dragon
	// (cid 20607), Stardust Sifr Divine Dragon (cid 11931), Crimson Dragon (cid 18825).
	text("target-count-from-the-board", 20780, "You can target Spells/Traps on the field up to the number of Normal Monsters in your GY +1; destroy them."),
	text("unaffected-by-activated-effects-text", 17154, "While your LP are less than or equal to your opponent's, this Synchro Summoned card is unaffected by your opponent's activated effects."),
	text("opponent-cannot-banish-text", 20607, "Your opponent cannot banish cards from your GY."),
	text("must-be-synchro-summoned-text", 11931, "Must be Synchro Summoned."),
	text("treated-as-a-synchro-summon-text", 18825, "Special Summon 1 Dragon Synchro Monster from your Extra Deck with the same Level as the targeted monster (this is treated as a Synchro Summon)."),
	// Super Starslayer TY-PHON - Sky Crisis (cid 19184): its other way of being Xyz Summoned.
	text("summons-of-the-turn-text", 19184, "During the turn, or turn after, your opponent Special Summoned 2 or more monsters from the Extra Deck, you can also Xyz Summon this card by using 1 monster you control with the highest ATK (your choice, if tied)."),
	text("xyz-alternative-if-you-do-text", 19184, "(Transfer its materials.) If you do, you cannot Normal or Special Summon for the rest of this turn."),
];
