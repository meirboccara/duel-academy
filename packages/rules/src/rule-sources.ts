import type { SourceRecord } from "./sources";

/**
 * The rules the core is built on, each with Konami's own words. A rule test cites one with cites("rules", "<id>") in
 * its title; the definition-of-done check wants every record well formed and cited by at least one running test.
 *
 * Every quote was checked against the page on the date read:
 * - RB10: the Official Rulebook v10 (PDF text; printed page numbers in the comments).
 * - FET: Konami's "Fast Effect Timing" page and its chart.
 * - One Japanese Q&A, where the TCG pages have no sentence for the rule (noted on the record).
 */
const RB10 = "https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf";
const FET = "https://www.yugioh-card.com/en/play/fast-effect-timing/";
const UCT6 = "https://www.yugioh-card.com/eu/play/understanding-card-text/part-6-finding-clues-in-turbo-pack-6-and-generation-force/";
const UCT7 = "https://www.yugioh-card.com/eu/play/understanding-card-text/part-7-conjunction-functions/";
const R2021 = "https://www.yugioh-card.com/en/play/2021_rules_update/";
const read = "2026-11-23";
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });
const fet = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: FET, read, quote });

const konamiPage = (id: string, url: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url, read, quote });

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
];
