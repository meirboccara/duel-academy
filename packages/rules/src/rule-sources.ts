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
const read = "2026-11-23";
const rb10 = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: RB10, read, quote });
const fet = (id: string, quote: string): SourceRecord => ({ id, kind: "tcg-rule", url: FET, read, quote });

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
