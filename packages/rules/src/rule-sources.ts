import { BATTLE_SOURCES } from "./battle-sources";
import { CONTINUOUS_SOURCES } from "./continuous-sources";
import { ZONE_SOURCES } from "./zone-sources";
import { NEGATION_SOURCES } from "./negation-sources";
import { SUMMON_SOURCES } from "./summon-sources";
import { READINESS_SOURCES } from "./readiness-sources";
import { ATTACK_SOURCES } from "./attack-sources";
import { SECOND_READINESS_SOURCES } from "./second-readiness-sources";
import { EQUIP_SOURCES } from "./equip-sources";
import { konamiCardUrl, type SourceRecord } from "./sources";

/**
 * The rules the core is built on, each with Konami's own words. A rule test cites one with cites("rules", "<id>") in
 * its title; the definition-of-done check wants every record well formed and cited by at least one running test.
 *
 * Every quote was checked against the page on the date read:
 * - RB10: the Official Rulebook v10 (PDF text; printed page numbers in the comments).
 * - FET: Konami's "Fast Effect Timing" page and its chart.
 * - UCT3, UCT4, UCT6, UCT7: Konami's "Understanding Card Text" articles, parts 3, 4, 6 and 7.
 * - Card text: the printed wording of a card on Konami's card database, where it is the only Konami source for a rule
 *   (the once-per-turn wordings): it proves the wording, not what the core does with it (each record says which).
 * - Japanese Q&A, where the TCG pages have no sentence for the rule (noted on the record).
 */
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const FET = "https://www.yugioh-card.com/en/play/fast-effect-timing/";
const UCT6 = "https://www.yugioh-card.com/eu/play/understanding-card-text/part-6-finding-clues-in-turbo-pack-6-and-generation-force/";
const UCT3 = "https://www.yugioh-card.com/eu/play/understanding-card-text/part-3-conditions-activations-and-effects/";
const UCT4 = "https://www.yugioh-card.com/eu/play/understanding-card-text/part-4-the-clues-on-your-cards/";
const UCT7 = "https://www.yugioh-card.com/eu/play/understanding-card-text/part-7-conjunction-functions/";
const R2021 = "https://www.yugioh-card.com/en/play/2021_rules_update/";
const read = "2026-11-23";
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });
const fet = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: FET, read, quote });

const konamiPage = (id: string, url: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url, read, quote });

const qa = (id: string, cid: number, fid: number, quote: string): SourceRecord => ({ id, kind: "jp-qa", cid, fid, url: `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`, read, quote });

/** Konami's Japanese Q&A fid 14075, filed under Ash Blossom & Joyous Spring (cid 12950): the rule record, also a ruling of that card's sources. */
export const ICE_BELL_QA: SourceRecord = qa("effect-negated-still-activated", 12950, 14075, "その場合でも、手札の「 WW－アイス・ベル 」のモンスター効果の発動は行われていますので、このターンに自分は、レベル５以上の風属性モンスターしかエクストラデッキから特殊召喚する事はできなくなります。");

const cardText = (id: string, cid: number, quote: string): SourceRecord => ({ id, kind: "card-text", cid, url: konamiCardUrl(cid, "en"), read, quote });

export const RULE_SOURCES: readonly SourceRecord[] = [
	// RB10 p. 45, "Spell Speeds".
	rb10("response-speed", "You can only respond with an effect if it is Spell Speed 2 or higher, and has an equal or greater Spell Speed than the effect on the Chain Link before it."),
	// RB10 p. 45, "Spell Speed 1".
	rb10("speed-1-no-response", "This is the slowest of all Spell Speeds. These cards cannot be activated in response to any other effects."),
	// RB10 p. 45, "Spell Speed 3".
	rb10("speed-3-only-speed-3", "Only another Spell Speed 3 card may be used to respond to these cards."),
	// RB10 p. 44, "What is a Chain?".
	rb10("chain-own-link", "If your opponent does not respond, you may activate a second effect and create a Chain to your own card's activation."),
	rb10("chain-until-both-pass", "Both players continue to add effects to the Chain until they both wish to add nothing else, then you resolve the outcome in reverse order"),
	// RB10 p. 46, "How a Chain Works".
	rb10("chain-resolves-backwards", "Once the Chain is completed, the outcome is resolved starting with the most recent card to be activated at the top of the Chain and proceeding down to Chain Link 1."),
	// RB10 p. 45, "Spell Speed 1": the sentence this rule is read from ("simultaneously" is what a trigger chain is).
	rb10("ss1-chain-simultaneous", "Typically, these effects cannot be Chain Link 2 or higher, unless multiple Spell Speed 1 effects are activated simultaneously."),
	// RB10 p. 47, "Example of a Chain": a negated activation does nothing, and the links below still resolve.
	rb10("negated-activation", '"Threatening Roar" (Chain Link 2) would then be resolved, but the effect of "Seven Tools of the Bandit" stops its activation.'),
	// RB10 p. 48, "Turn Player's Priority".
	rb10("turn-player-priority", "The turn player starts with Priority to activate a card or effect first."),
	rb10("priority-passes", "After a card's activation, and at the end of each phase or step, Priority passes to the opponent."),
	// RB10 p. 28, "Spell Cards" and "Normal Spell Cards".
	rb10("spell-main-phase", "Spell Cards can normally be activated only during your Main Phase"),
	rb10("spell-to-graveyard", "After resolving the effect, send the card to the Graveyard."),
	// RB10 p. 29, "Quick-Play Spell Cards".
	rb10("quick-play", "These are special Spell Cards that can be activated during any Phase of your turn, not just your Main Phase. You can also activate them during your opponent's turn if you Set the card face-down first, but then you cannot activate the card in the same turn you Set it."),
	// RB10 p. 30, "Normal Trap Cards".
	rb10("trap-set-first", "Before you can activate a Trap Card, you must Set it on the field first. You cannot activate a Trap in the same turn that you Set it"),
	// RB10 p. 31, "The Difference between Set Spell Cards and Set Trap Cards".
	rb10("set-spell-same-turn", "Spell Cards can be activated during the Main Phases even in the same turn that you Set them (except for Quick-Play Spell Cards)."),
	// RB10 p. 52-53, glossary, "Pay a Cost".
	rb10("cost-no-refund", "You have to pay any costs before you declare the activation of the card. Even if the activation of the card is negated, you cannot get a refund of the cost that you have paid."),
	// RB10 p. 52-53, glossary, "Search your Deck".
	rb10("search-needs-a-card", "You cannot activate an effect to search your Deck for a card if there are no cards that meet the requirements in your Deck."),
	// RB10 p. 50, "When multiple cards are activated simultaneously".
	rb10("segoc-order", "Then the opponent continues the Chain with their mandatory effects in any order. Afterwards, the turn player adds their optional effects in any order, and finally the opponent adds their optional effects in any order."),
	// RB10 p. 10, "Trigger Effect".
	rb10("trigger-effects", "These effects are activated at specific times, such as “during the Standby Phase” or “when this monster is destroyed”."),
	// RB10 p. 51, "Actions which cannot be Chained to". No Konami page we could cite says in so many words that the
	// "when" triggers of a card sent as a cost miss the timing: it follows from this (a cost is not an activation, so the
	// activation that follows is the last thing that happened) and from the "last thing that happened" rule below.
	rb10("cost-not-chainable", "Summoning a monster, Tributing, changing a monster’s battle position and paying costs are not effect activations and therefore you cannot respond to those actions using a Chain."),
	// RB10 p. 55, glossary, "Send to the Graveyard".
	rb10("trigger-sent-to-graveyard", "Destroying a card, discarding, and Tributing a monster are all actions that send a card to the Graveyard, and will normally activate “When this card is sent to the Graveyard…” Trigger Effects."),
	// FET chart, rows "After a Chain resolves" and "After an action that does NOT start a Chain": with an effect
	// triggered, the chain rules apply and the player who did not activate the last effect goes next (box D). The
	// quote is the cell of the first row; the chart is a table, read across its cells.
	fet("trigger-after-chain", "If there is an effect that is triggered. Yes The player who did NOT activate the last effect on the Chain. (Follow the normal Chain rules.)"),
	// UCT7 (Understanding Card Text, part 7), "Timing".
	konamiPage("last-thing-that-happened", UCT7, "it might only be usable in response to a triggering event that was ‘the last thing that happened’."),
	// UCT7, "The Four Conjunctives": THEN.
	konamiPage("then-is-sequential", UCT7, "THEN: <Do A, then do B> Timeline: B happens after A, even though they’re part of one card effect. These things happen in sequence, not simultaneously."),
	// UCT7, "The Four Conjunctives": AND.
	konamiPage("and-is-simultaneous", UCT7, "AND: <Do A and B> Timeline: Considered simultaneous. Both happen at the same time."),
	// UCT7, the Heraldry Change example under THEN.
	konamiPage("then-hides-the-summon", UCT7, "The last thing was NOT a monster being Summoned. Which means neither player can activate cards like Torrential Tribute that activate “WHEN” a monster is Summoned."),
	// UCT6, on Quickdraw Synchron: "and Special Summon" instead of "then".
	konamiPage("and-keeps-the-timing", UCT6, "it also means that pitching a card and Summoning Quickdraw happen simultaneously. This means that you will not miss the timing for any “when… you can” optional effects of the card you sent to the Graveyard"),
	// R2021, on trigger effects "saved for later".
	konamiPage("saved-trigger-moved", R2021, "BUT its location* changes between the time its Trigger Effect activation is met, and the time it actually has a chance to activate, its effect does not activate."),
	/**
	 * Konami's Japanese Q&A on "Hieratic Seal of the Heavenly Spheres" (the answer lists Critter, cid 4054, among the cards it
	 * holds for): a trigger that goes on the chain only after the whole chain has resolved does not activate if
	 * its card left the place it was sent to before then. Same rule as R2021 above, and it states "after the whole chain".
	 * The record is filed under Critter because Konami's page lists the Q&A under that card.
	 */
	{
		id: "after-chain-moved",
		kind: "jp-qa",
		cid: 4054,
		fid: 24070,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=24070&request_locale=ja",
		read,
		quote: "②の効果は、リリースされた一連のチェーン処理後に最初に送られたところで発動する効果ですので、リリースされたのち②の効果を発動する前に最初に送られたところから離れている場合には発動しません。",
	},
	/**
	 * Konami's Japanese Q&A on an effect worded "each time" (度に): a trigger effect so worded counts how many times its
	 * condition was met and can activate that many times (a mandatory one does so every time). Filed under Kshatri-La
	 * Shangri-La (cid 17800), whose Q&A it is. Only for effects worded "each time"; the pages say nothing for others.
	 */
	{
		id: "each-time-counts-events",
		kind: "jp-qa",
		cid: 17800,
		fid: 24018,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=24018&request_locale=ja",
		read,
		quote: "『度に～発動できる』と記載されている誘発効果は、条件を満たした回数を数えてその回数まで発動できます。（必ず発動する効果の場合は条件を満たした回数だけ発動します。）",
	},
	/**
	 * Konami's Japanese Q&A, Yokai beast Q&A (cid 14469): the "each time" effect's condition was met by two separate
	 * links of one chain, and after that chain it activates twice, on one chain.
	 */
	{
		id: "each-time-across-chain",
		kind: "jp-qa",
		cid: 14469,
		fid: 22573,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=22573&request_locale=ja",
		read,
		quote: "②のモンスター効果は同一チェーン上で２回発動します。",
	},
	/**
	 * Konami's Japanese Q&A under Reload (cid 5849): Quick-Play Spell and Trap Cards activated in a chain are sent to
	 * the Graveyard after the whole chain has been processed, not after their own link. The Q&A is about a Quick-Play
	 * Spell and Normal Traps chained to a monster effect; the rulebook's "After resolving the effect, send the card to
	 * the Graveyard" (`spell-to-graveyard`) says nothing about when, and no page we found says it for a Normal Spell
	 * at Chain Link 1, so the core applies this to every Spell and Trap Card of a chain.
	 */
	{
		id: "chained-card-after-chain",
		kind: "jp-qa",
		cid: 5849,
		fid: 11919,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=11919&request_locale=ja",
		read,
		quote: "その発動した魔法・罠カードは一連のチェーン処理が完了した後に墓地へ送られる事になります",
	},
	/**
	 * Konami's Japanese Q&A under Torrential Tribute (cid 5114): a Trap such as Torrential Tribute or Bottomless Trap
	 * Hole, or a Quick-Play Spell, can be chained to a trigger effect that itself triggered on that Summon.
	 */
	{
		id: "answer-the-summon-in-the-chain",
		kind: "jp-qa",
		cid: 5114,
		fid: 6537,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=6537&request_locale=ja",
		read,
		quote: "「 激流葬 」や「 奈落の落とし穴 」等の罠カードや、速攻魔法カードを発動する事ができます。",
	},
	/**
	 * Konami's Japanese Q&A under Torrential Tribute (cid 5114): a monster is Summoned, its owner's trigger effect is
	 * Chain Link 1, the opponent's Torrential Tribute Chain Link 2, and a hand effect of the owner that also answers the
	 * Summon Chain Link 3: the Summon stays what chain links answer while the chain is built.
	 */
	{
		id: "answer-the-summon-again",
		kind: "jp-qa",
		cid: 5114,
		fid: 13782,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=13782&request_locale=ja",
		read,
		quote: "チェーン１：自分の「 ゴブリンドバーグ 」の効果の発動 チェーン２：相手の「 激流葬 」の発動 チェーン３：自分の「 カゲトカゲ 」の効果の発動",
	},
	/**
	 * Konami's Japanese Q&A under Zeta Reticulant (cid 6794), whose effect triggers "each time" a monster is banished:
	 * two monsters banished at the same time by one effect make it activate once. (Q&A fid 6888, Soul Absorption, says
	 * the same for five cards banished by one effect.) Two separate banishings are two occurrences (fid 24018 above).
	 */
	{
		id: "simultaneous-counts-once",
		kind: "jp-qa",
		cid: 6794,
		fid: 11558,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=11558&request_locale=ja",
		read,
		quote: "複数体の相手フィールドのモンスターが同時に除外された場合でも、「 ゼータ・レティキュラント 」の効果は1回のみ発動し",
	},
	// FET, introduction.
	fet("fast-effects-either-turn", "Fast effects can be activated by either player – even during their opponent’s turn, as long as the conditions are appropriate."),
	// FET, "Turn Player Actions": box A.
	fet("open-state", "Each Phase and Step starts with the turn player in box A of the chart listed below. This is when the game state is “open”, meaning the turn player has complete freedom of action."),
	// FET, "Turn Player Actions": the list under this sentence names "Set a card" and "Activate a Spell Speed 1 Spell Card".
	fet("open-state-only", "Many actions can ONLY be performed when the game state is open (when you’re in box A)."),
	// FET, "How Do I Make the Game State Open Again?".
	fet("open-again", "Basically, when nothing is going on, and neither player wishes to do anything, the game state goes back to being “open”."),
	// FET, "How Does the Turn Move to the Next Phase or Step?".
	fet("next-phase", "If the game state is open, and the turn player chooses not to do anything, and the opponent waives the chance to activate a fast effect, and both players agree to have the turn proceed, then you move to the next Phase or Step."),
	// FET chart, row "Turn player activates a card or card effect": who goes next (box D).
	fet("after-activation", "The player who did NOT activate the effect. (Follow the normal Chain rules.)"),
	// FET chart, rows "After an action that does NOT start a Chain" and "After a Chain resolves": with no effect
	// triggered, the turn player goes next (box B), then the opponent if the turn player passes (box C). The quote is
	// the first row's heading; the chart is a table, so the rule is read across its cells.
	fet("after-action-or-chain", "After an action that does NOT start a Chain"),
	/**
	 * A Spell or Trap destroyed while its activation is on the chain still resolves, unless its text needs the card on
	 * the field. No sentence of the TCG rulebook or rules pages says this outright (RB10 p. 30 only says that once
	 * activated, a Normal Spell's or Trap's effects "are not likely to be stopped"), so the record is a Q&A of
	 * Konami's Japanese database under Mystical Space Typhoon (cid 4909): Xyz Reborn, a Normal Trap, is destroyed by a
	 * chained Mystical Space Typhoon, and its Special Summon is still applied; only the part that needs the card
	 * itself (attaching it as material) is lost. The Q&A is about a Normal Trap; the same holds for a Quick-Play Spell.
	 */
	{
		id: "destroyed-still-resolves",
		kind: "jp-qa",
		cid: 4909,
		fid: 12367,
		url: "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=12367&request_locale=ja",
		read,
		quote: "この場合、「エクシーズ・リボーン」の『そのモンスターを特殊召喚し』の処理は適用され、対象の「ジェムナイト・パール」は特殊召喚されますが、『このカードを下に重ねてX素材とする』処理は適用されません。",
	},
	// UCT4, "Costs": a cost is paid when the effect is activated.
	konamiPage("costs-at-activation", UCT4, "Costs are always paid at activation."),
	// UCT4, New Zombie Master: the cost comes first and the target is picked after it. Konami says nothing about an effect
	// whose cost cannot be paid or whose cost removes its only target: that such an effect is not offered follows from this.
	konamiPage("cost-then-target", UCT4, "Clues: You send a card to the Graveyard first, ‘then’ pick a target after that."),
	// UCT3, a card that targets "2 Level 2 monsters": how many cards a card targets is what its text says. That the core lists
	// each legal combination, with the exact count needed, is its reading of such wording; Konami's page gives the wording.
	konamiPage("target-count-from-text", UCT3, "You can target 2 Level 2 monsters in your Graveyard; Special Summon them, but their effects are negated."),
	// UCT3, Creature Swap: what an effect does, and the choices it makes, happen when it resolves.
	konamiPage("choice-at-resolution", UCT3, "In fact, its text is exactly the same as before because everything on Creature Swap happens when the effect resolves: Each player chooses 1 monster they control and switches control of those monsters with each other."),
	/**
	 * Ash Blossom & Joyous Spring (cid 12950) negates a card or effect "that includes any of these effects": what the
	 * effect includes is what it says, read when it is activated. Konami says nothing of the board changing in between;
	 * that the categories are frozen on the link is derived from the wording (it speaks of what is activated).
	 */
	cardText("frozen-categories", 12950, "When a card or effect is activated that includes any of these effects (Quick Effect): You can discard this card; negate that effect."),
	// The five printed once-per-turn wordings (card text). What each does is the core's reading; see EffectRecord.once.
	// "Once per turn:" (Link Spider, cid 13034). That each copy has its own use, and that a card that moved is a new card
	// with a new use, is not worded on a Konami page we found; YGOProJudge (no source cited) says so. Nor is what a negated
	// activation does to a "Once per turn:" use.
	cardText("once-instance-wording", 13034, "Once per turn: You can Special Summon 1 Level 4 or lower Normal Monster from your hand to your zone this card points to."),
	// "You can only use this effect of [name] once per turn" (Ash Blossom & Joyous Spring, cid 12950). By name and by
	// player, spent at activation even if negated: see once-name-second-copy and use-negated-activation-spent below.
	cardText("once-name-wording", 12950, 'You can only use this effect of "Ash Blossom & Joyous Spring" once per turn.'),
	// "You can only activate 1 [name] per turn" (Pot of Desires, cid 12465). That a negated activation gives the use back
	// and a negated effect does not: see activate-one-unless-negated, activate-negated-can-again and effect-negated-still-activated.
	cardText("once-activation-wording", 12465, 'You can only activate 1 "Pot of Desires" per turn.'),
	// "once per Duel" (Revolution Synchron, cid 18789). Spent even if negated, and per player: see duel-use-spent-even-if-negated,
	// duel-per-player-control and duel-per-player-effect-used.
	cardText("once-duel-wording", 18789, 'You can only use this effect of "Revolution Synchron" once per Duel.'),
	// "Once per Chain" (Argostars - Home Stadium, cid 20795). Lifted when the chain has resolved, per player: YGOProJudge (no source cited).
	cardText("once-chain-wording", 20795, 'Once per Chain, if a Continuous Trap activates its effect in your Monster Zone'),
	/**
	 * Konami's Japanese Q&A under Ash Blossom & Joyous Spring (cid 12950): the effect of WW-Ice Bell is negated by Ash, but
	 * the activation of its effect was made, so what applies at activation (its restriction on Extra Deck Summons) does.
	 * Used for: a negated effect is still an activation that happened, so no "activate 1 per turn" use is given back.
	 */
	ICE_BELL_QA,
	// Konami's Japanese Q&A on the once-per-turn family. Each is filed under the card Konami lists it with; the quote is the
	// answer's own sentence (page read 2026-11-23). Each says what its title says and no more.
	// "You can only use this effect of [name] once per turn" (Lovely Labrynth, cid 17360): a second copy, Special Summoned
	// the same turn and renamed, cannot use the effect again: "I have already used it". By player and effect, not by copy.
	qa("once-name-second-copy", 17360, 24139, "そのターン、すでに自分は『②：自分の墓地の通常罠カード１枚を対象として発動できる。そのカードを自分フィールドにセットする。この効果でセットしたカードは、自分フィールドに悪魔族モンスターが存在しない場合には発動できない』効果を使用していますので、そのターン中２回目の発動を行うことはできません。"),
	// "You can only activate 1 [name] per turn" (Metaverse's Q&A, cid 13292, about Field Spells with that wording): a card
	// activated this turn whose activation was not negated blocks a same-name activation. That a negated activation does not
	// block is the implication of "was not negated"; the page does not say it outright. (Konami's Q&A fid 11730, on Great
	// Shogun Shien's "can only activate 1 Spell/Trap each turn", says a negated activation does not count against that
	// other limit: an analogy only, not a record.)
	qa("activate-one-unless-negated", 13292, 21245, "そのターンにすでにそのフィールド魔法カードを発動を行い、そのカードの発動が無効になっていない場合、そのターンに発動した「 メタバース 」「 終焉の地 」「 ポップルアップ 」「 ゴーストリック・リフォーム 」の『①』の効果「 フェイバリット・ヒーロー 」の②の効果によって、同名となるフィールド魔法カードをデッキから選んで発動することはできません。"),
	// "once per Duel" (the question is about Heavenly Sword's own once-per-Duel effect; Revolution Synchron, cid 18789, is on
	// the answer's list): in each case (A) the activation or the effect negated, (B) the effect changed, (C) its processing not
	// done, the effect counts as used and cannot be activated again in the Duel.
	qa("duel-use-spent-even-if-negated", 18789, 23336, "（A）「 天羽々斬之巳剣 」の①の効果の発動や、発動した効果が無効になった場合 （B）発動した「 天羽々斬之巳剣 」の①の効果が、チェーンして発動した「 No.75 惑乱のゴシップ・シャドー 」の①の効果により『お互いのプレイヤーは、それぞれデッキから１枚ドローする』に変更され、処理が行われた場合 （C）「 天羽々斬之巳剣 」の①の発動や効果が無効にならず、その処理時に他の効果が適用されたことによって、『デッキから「巳剣」モンスター１体を特殊召喚する』処理が行われなかった場合 Answer いずれの場合でも、「 天羽々斬之巳剣 」の①の効果を使用したことになりますので、そのデュエル中に再び発動することはできなくなります。"),
	// "once per Duel" (Armored Kappa, cid 10466): the opponent who took control of it may use the effect if they have not
	// activated it themselves this Duel: the limit is per player.
	qa("duel-per-player-control", 10466, 12798, "「 アーマー・カッパー 」のコントロールを得た相手プレイヤーが、そのデュエル中に「 アーマー・カッパー 」の『このターン、自分フィールド上のモンスターは戦闘では破壊されず、戦闘によって発生する自分への戦闘ダメージは0になる』効果を発動していないのであれば、相手プレイヤーはその効果を発動する事ができます。"),
	// "once per Duel" (Destiny HERO - Disk Commander, Japanese name D-HERO ディスクガイ, cid 7095; the card text there is "once
	// per Duel"): that I used a copy's effect does not stop the other player from activating it in that Duel.
	qa("duel-per-player-effect-used", 7095, 8114, "相手プレイヤーがそのデュエル中に「 D-HERO ディスクガイ 」のモンスター効果が発動できなくなる事はありません。"),
	...NEGATION_SOURCES,
	...CONTINUOUS_SOURCES,
	...BATTLE_SOURCES,
	...ZONE_SOURCES,
	...SUMMON_SOURCES,
	...READINESS_SOURCES,
	...ATTACK_SOURCES,
	...SECOND_READINESS_SOURCES,
	...EQUIP_SOURCES,
];
