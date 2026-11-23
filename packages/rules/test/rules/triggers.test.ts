import { describe, expect, it } from "vitest";
import { cites } from "../../src";
import { codes, offered, play, position, triggerCards } from "./fixtures";

/** Every chance to respond is shown, so a test can look at each step. */
const options = { everyWindow: true };
const chainOf = (duel: Parameters<typeof codes>[0]) => duel.chain.map((link) => link.card.code);

describe("a trigger effect after a chain", () => {
	it(`${cites("rules", "trigger-sent-to-graveyard")} ${cites("rules", "trigger-after-chain")} puts a mandatory trigger on a new chain once the chain that sent its card to the Graveyard has resolved, and the other player may respond to it`, () => {
		const log: string[] = [];
		const start = position({ defs: triggerCards(log), options, you: { hand: ["sweep"], monsters: ["forced-a"] } });
		const swept = play(start, "activate sweep", "pass", "pass");
		expect(log).toEqual(["sweep"]);
		expect(codes(swept, "you", "graveyard")).toEqual(["forced-a", "sweep"]);
		expect(chainOf(swept)).toEqual(["forced-a"]);
		expect(swept.priority).toMatchObject({ holder: "rival", open: false });
		expect(offered(swept)).toEqual(["pass"]);
		const resolved = play(swept, "pass", "pass");
		expect(log).toEqual(["sweep", "forced-a"]);
		expect(resolved.chain).toEqual([]);
	});
});

describe("simultaneous trigger effects", () => {
	it(`${cites("rules", "segoc-order")} chains the turn player's mandatory effects before the opponent's, whatever the cards' order`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["sweep"], monsters: ["forced-a"] }, rival: { monsters: ["forced-b"] } });
		const swept = play(start, "activate sweep", "pass", "pass");
		expect(chainOf(swept)).toEqual(["forced-a", "forced-b"]);
		expect(swept.chain.map((link) => link.player)).toEqual(["you", "rival"]);
		expect(swept.priority).toMatchObject({ holder: "you", open: false });
	});
	it(`${cites("rules", "segoc-order")} lets the player order their own mandatory effects, and only theirs`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["sweep"], monsters: ["forced-a", "forced-c"] }, rival: { monsters: ["forced-b"] } });
		const asking = play(start, "activate sweep", "pass", "pass");
		expect(asking.priority.holder).toBe("you");
		expect(chainOf(asking)).toEqual([]);
		expect(offered(asking)).toEqual(["activate forced-a", "activate forced-c"]);
		const ordered = play(asking, "activate forced-c");
		expect(chainOf(ordered)).toEqual(["forced-c", "forced-a", "forced-b"]);
	});
});

describe("optional trigger effects", () => {
	const swept = (spec: Omit<Parameters<typeof position>[0], "defs">) => play(position({ defs: triggerCards(), options, ...spec }), "activate sweep", "pass", "pass");

	it(`${cites("rules", "segoc-order")} asks the turn player first, then lets the non-turn player choose their own optional effects, which go on top of the chain`, () => {
		const asking = swept({ you: { hand: ["sweep"], monsters: ["if-a"] }, rival: { monsters: ["if-b"] } });
		expect(asking.priority.holder).toBe("you");
		expect(offered(asking)).toEqual(["activate if-a", "pass"]);
		const rival = play(asking, "activate if-a");
		expect(rival.priority.holder).toBe("rival");
		expect(offered(rival)).toEqual(["activate if-b", "pass"]);
		const chained = play(rival, "activate if-b");
		expect(chainOf(chained)).toEqual(["if-a", "if-b"]);
		expect(chained.priority).toMatchObject({ holder: "you", open: false });
	});
	it(`${cites("rules", "segoc-order")} lets each player decline their optional effects: nothing is activated for them`, () => {
		const asking = swept({ you: { hand: ["sweep"], monsters: ["if-a", "if-b"] }, rival: { monsters: ["forced-a"] } });
		expect(chainOf(asking)).toEqual(["forced-a"]);
		expect(offered(asking)).toEqual(["activate if-a", "activate if-b", "pass"]);
		const declined = play(asking, "pass");
		expect(chainOf(declined)).toEqual(["forced-a"]);
		expect(declined.priority).toMatchObject({ holder: "you", open: false });
		const log: string[] = [];
		const alone = play(position({ defs: triggerCards(log), options, you: { hand: ["sweep"], monsters: ["if-a"] } }), "activate sweep", "pass", "pass", "pass");
		expect(chainOf(alone)).toEqual([]);
		expect(log).toEqual(["sweep"]);
	});
});

describe("when and if: missing the timing", () => {
	const start = (sweeper: string) => position({ defs: triggerCards(), options, you: { hand: [sweeper], monsters: ["when-a", "if-a", "forced-a"] }, rival: { monsters: ["when-b"] } });
	const ask = (duel: ReturnType<typeof start>) => play(duel, "activate " + duel.cards[duel.piles.you.hand[0]!]!.code, "pass", "pass");

	it(`${cites("rules", "and-is-simultaneous")} ${cites("rules", "and-keeps-the-timing")} when everything is sent at once, every optional effect can be activated, "when" ones included`, () => {
		const asking = ask(start("sweep"));
		expect(chainOf(asking)).toEqual(["forced-a"]);
		expect(offered(asking)).toEqual(["activate if-a", "activate when-a", "pass"]);
		const rival = play(asking, "pass");
		expect(offered(rival)).toEqual(["activate when-b", "pass"]);
	});
	it(`${cites("rules", "then-is-sequential")} ${cites("rules", "last-thing-that-happened")} a "when" optional effect misses the timing when something else happens after its event; "if" and mandatory effects do not, and the later event's effect does not miss`, () => {
		const asking = ask(start("then-sweep"));
		expect(chainOf(asking)).toEqual(["forced-a"]);
		expect(offered(asking)).toEqual(["activate if-a", "pass"]);
		const rival = play(asking, "pass");
		expect(offered(rival)).toEqual(["activate when-b", "pass"]);
	});
});

describe("triggers and a whole chain", () => {
	it(`${cites("rules", "trigger-after-chain")} ${cites("rules", "last-thing-that-happened")} waits for the whole chain to resolve before anything triggered by it is chained, and only the last link's "when" optional effects are still on time`, () => {
		const log: string[] = [];
		const side = (letter: string) => [`when-${letter}`, `if-${letter}`, `forced-${letter}`];
		const start = position({ defs: triggerCards(log), options, you: { hand: ["purge-spell"], monsters: side("a") }, rival: { set: ["purge-quick"], monsters: side("b") } });
		const answered = play(start, "activate purge-spell", "activate purge-quick", "pass", "pass");
		// Link 2 sent the rival's monsters, link 1 yours; nothing was chained while the chain was still resolving.
		expect(log).toEqual(["purge-quick", "purge-spell"]);
		expect(chainOf(answered)).toEqual(["forced-a", "forced-b"]);
		expect(offered(answered)).toEqual(["activate if-a", "activate when-a", "pass"]);
		const rival = play(answered, "pass");
		expect(offered(rival)).toEqual(["activate if-b", "pass"]);
	});
});

describe("events raised by an activation cost", () => {
	const pitched = (code: string) => play(position({ defs: triggerCards(), options, you: { hand: [code] } }), `activate ${code}`, "pass", "pass");

	it(`${cites("rules", "cost-not-chainable")} ${cites("rules", "last-thing-that-happened")} lets an "if" effect of a card paid as a cost activate after the chain, and an optional "when" effect misses the timing`, () => {
		const asking = pitched("pitcher-if");
		expect(asking.chain).toEqual([]);
		expect(asking.priority.holder).toBe("you");
		expect(offered(asking)).toEqual(["activate pitcher-if", "pass"]);
		expect(offered(pitched("pitcher-when"))).toEqual(["pass"]);
	});
});

describe("a trigger effect whose card has moved", () => {
	it(`${cites("rules", "saved-trigger-moved")} ${cites("rules", "after-chain-moved")} does not activate, even when mandatory, if its card left the place it triggered in while the chain was still resolving`, () => {
		const side = (letter: string) => [`if-${letter}`, `forced-${letter}`];
		const start = position({ defs: triggerCards(), options, you: { hand: ["vacuum"], monsters: side("a") }, rival: { set: ["purge-quick"], monsters: side("b") } });
		const resolved = play(start, "activate vacuum", "activate purge-quick", "pass", "pass");
		// Your monsters were never sent anywhere; the rival's were sent, then banished by the first link.
		expect(codes(resolved, "rival", "banished").sort()).toEqual(["forced-b", "if-b"]);
		expect(resolved.chain).toEqual([]);
		expect(resolved.building).toBeNull();
		expect(resolved.priority).toMatchObject({ holder: "you", open: false });
	});
	it(`${cites("rules", "saved-trigger-moved")} drops an effect still to be chosen when the cost of an earlier choice moves its card`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["sweep"], monsters: ["forced-vacuum"] }, rival: { monsters: ["if-b"] } });
		const chained = play(start, "activate sweep", "pass", "pass");
		expect(chainOf(chained)).toEqual(["forced-vacuum"]);
		expect(codes(chained, "rival", "banished")).toEqual(["if-b"]);
		expect(chained.priority).toMatchObject({ holder: "rival", open: false });
		expect(offered(chained)).toEqual(["pass"]);
	});
});

describe("answering an event: the last thing that happened", () => {
	const defs = () => triggerCards();
	const summoned = (code: string) => play(position({ defs: defs(), options, you: { hand: [code, "monster"] }, rival: { set: ["tribute"] } }), `activate ${code}`, "pass", "pass");

	it(`${cites("rules", "last-thing-that-happened")} offers a "when a monster is Summoned" Trap only once the Summon has happened, not before`, () => {
		const start = position({ defs: defs(), options, you: { hand: ["summon-and", "monster"] }, rival: { set: ["tribute"] } });
		expect(offered(play(start, "activate summon-and"))).toEqual(["pass"]);
		const after = summoned("summon-and");
		expect(after.priority.holder).toBe("you");
		const rival = play(after, "pass");
		expect(offered(rival)).toEqual(["activate tribute", "pass"]);
	});
	it(`${cites("rules", "then-hides-the-summon")} no longer offers it when the effect did something else after the Summon, as Heraldry Change does by ending the Battle Phase`, () => {
		const after = play(summoned("summon-then"), "pass");
		expect(offered(after)).not.toContain("activate tribute");
		expect(after.priority).toMatchObject({ holder: "rival", open: false });
		expect(offered(after)).toEqual(["pass"]);
	});
});

describe("the trigger chain itself", () => {
	it(`${cites("rules", "chain-resolves-backwards")} ${cites("rules", "ss1-chain-simultaneous")} resolves the trigger chain from the last link to the first, so the turn player's effects resolve last`, () => {
		const log: string[] = [];
		const start = position({ defs: triggerCards(log), options, you: { hand: ["sweep"], monsters: ["forced-a"] }, rival: { monsters: ["forced-b"] } });
		const chained = play(start, "activate sweep", "pass", "pass");
		expect(chained.priority).toMatchObject({ holder: "you", open: false });
		const resolved = play(chained, "pass", "pass");
		expect(log).toEqual(["sweep", "forced-b", "forced-a"]);
		expect(resolved.chain).toEqual([]);
	});
	it(`${cites("rules", "trigger-effects")} ${cites("rules", "trigger-after-chain")} puts the effects that trigger at the start of a phase on a chain before anyone may act in it`, () => {
		const start = position({ defs: triggerCards(), options, phase: "draw", you: { monsters: ["standby-forced"] }, rival: { monsters: ["standby-optional"] } });
		const standby = play(start, "pass", "pass");
		expect(standby.turn.phase).toBe("standby");
		expect(chainOf(standby)).toEqual(["standby-forced"]);
		// The rival, who holds the optional effect, is asked next.
		expect(standby.priority).toMatchObject({ holder: "rival", open: false, passed: [] });
		expect(offered(standby)).toEqual(["activate standby-optional", "pass"]);
		const chained = play(standby, "activate standby-optional");
		expect(chainOf(chained)).toEqual(["standby-forced", "standby-optional"]);
		expect(chained.priority).toMatchObject({ holder: "you", open: false });
	});
});

describe("triggers after an action that starts no chain", () => {
	it(`${cites("rules", "trigger-after-chain")} chains a trigger effect before the turn player may use a fast effect, after a Set`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["spell"], monsters: ["set-watcher"] } });
		const set = play(start, "set spell");
		expect(set.priority).toMatchObject({ holder: "you", open: false });
		expect(offered(set)).toEqual(["activate set-watcher", "pass"]);
		const chained = play(set, "activate set-watcher");
		expect(chainOf(chained)).toEqual(["set-watcher"]);
		expect(chained.priority.holder).toBe("rival");
		const declined = play(set, "pass");
		expect(declined.chain).toEqual([]);
		expect(declined.priority).toMatchObject({ holder: "you", open: false });
	});
});

describe("a mandatory trigger that targets", () => {
	const start = (rival: string[]) => position({ defs: triggerCards(), options, you: { hand: ["purge-spell"], monsters: ["forced-aim"] }, rival: { monsters: rival } });

	it(`${cites("rules", "segoc-order")} asks the player to choose the target when there are several, with no way to decline`, () => {
		const asking = play(start(["monster", "monster"]), "activate purge-spell", "pass", "pass");
		expect(asking.priority.holder).toBe("you");
		expect(offered(asking)).toEqual(["activate forced-aim > monster", "activate forced-aim > monster"]);
		expect(chainOf(play(asking, "activate forced-aim > monster"))).toEqual(["forced-aim"]);
	});
	// No Konami sentence in the registry covers a trigger with no legal target yet; the step 2 rule that an effect
	// with targets needs one applies here too.
	it("does not activate it at all when it has no target", () => {
		const done = play(start([]), "activate purge-spell", "pass", "pass");
		expect(done.chain).toEqual([]);
		expect(done.building).toBeNull();
	});
});

describe("trigger effects without the every-window teaching option", () => {
	it(`${cites("rules", "trigger-after-chain")} resolves a mandatory trigger by itself when nobody can respond, but always asks for an optional one`, () => {
		const log: string[] = [];
		const forced = play(position({ defs: triggerCards(log), you: { hand: ["sweep"], monsters: ["forced-a"] } }), "activate sweep");
		expect(log).toEqual(["sweep", "forced-a"]);
		expect(forced.priority).toMatchObject({ holder: "you", open: true });
		const optional = play(position({ defs: triggerCards(log), you: { hand: ["sweep"], monsters: ["if-a"] } }), "activate sweep");
		expect(offered(optional)).toEqual(["activate if-a", "pass"]);
		const declined = play(optional, "pass");
		expect(declined.priority).toMatchObject({ holder: "you", open: true });
	});
});

describe("review regressions", () => {
	it(`${cites("rules", "saved-trigger-moved")} keeps a card's later trigger when an earlier occurrence of the same effect is stale because the card moved on`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["churn"], monsters: ["forced-a"] } });
		const chained = play(start, "activate churn", "pass", "pass");
		expect(chainOf(chained)).toEqual(["forced-a"]);
	});
	it(`${cites("rules", "cost-no-refund")} freezes a trigger's card as it was when activated, before its cost moved it`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["sweep"], monsters: ["forced-exile"] } });
		const chained = play(start, "activate sweep", "pass", "pass");
		expect(chained.chain[0]!.card).toMatchObject({ code: "forced-exile", zone: "graveyard" });
		expect(codes(chained, "you", "banished")).toEqual(["forced-exile"]);
	});
	it(`${cites("rules", "open-again")} does not let a fast effect answer an old event once the window closes and the game state is open again`, () => {
		const after = play(position({ defs: triggerCards(), options, you: { hand: ["summon-and", "monster"] }, rival: { set: ["tribute"] } }), "activate summon-and", "pass", "pass");
		const open = play(after, "pass", "pass");
		expect(open.priority).toMatchObject({ holder: "you", open: true });
		expect(offered(play(open, "pass"))).toEqual(["pass"]);
	});
	it(`${cites("rules", "response-speed")} offers no optional trigger beyond the teaching chain limit, but still chains mandatory ones`, () => {
		const limited = { everyWindow: true, chainLimit: 1 };
		const optional = play(position({ defs: triggerCards(), options: limited, you: { hand: ["sweep"], monsters: ["if-a", "if-b"] } }), "activate sweep", "pass", "pass");
		expect(offered(optional)).toEqual(["activate if-a", "activate if-b", "pass"]);
		const full = play(optional, "activate if-a");
		expect(chainOf(full)).toEqual(["if-a"]);
		expect(full.building).toBeNull();
		const mandatory = play(position({ defs: triggerCards(), options: limited, you: { hand: ["sweep"], monsters: ["forced-a", "forced-c"] } }), "activate sweep", "pass", "pass");
		expect(offered(mandatory)).toEqual(["activate forced-a", "activate forced-c"]);
		expect(chainOf(play(mandatory, "activate forced-a"))).toEqual(["forced-a", "forced-c"]);
	});
});

describe("one effect, two events at the same point", () => {
	const twice = (counter: string) => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["hit-rival"], set: ["hit-rival-quick"], monsters: [counter] }, rival: { monsters: ["monster", "monster"] } });
		return play(start, "activate hit-rival", "pass", "activate hit-rival-quick", "pass", "pass");
	};

	it(`${cites("rules", "each-time-counts-events")} ${cites("rules", "each-time-across-chain")} activates an "each time" trigger once for every time its condition was met, on one chain after the chain that met it twice`, () => {
		expect(chainOf(twice("each-counter"))).toEqual(["each-counter", "each-counter"]);
	});
	// A choice, not a ruling: no Konami page we found says how often an effect not worded "each time" activates here.
	it(`still puts an effect not worded "each time" on the chain once per trigger point`, () => {
		expect(chainOf(twice("once-counter"))).toEqual(["once-counter"]);
	});
});

describe("Spell Cards of a chain and the Graveyard", () => {
	it(`${cites("rules", "chained-card-after-chain")} keeps the Spell and Trap Cards of a chain on the field until the whole chain has resolved, those whose links already resolved included`, () => {
		const log: string[] = [];
		const start = position({ defs: triggerCards(log), options, you: { hand: ["peek"], set: ["quick-play"] } });
		const done = play(start, "activate peek", "pass", "activate quick-play", "pass", "pass");
		// Link 2 (the Quick-Play Spell) resolved first, and was still on the field when link 1 looked.
		expect(log).toEqual(["quick-play", "peek sees peek,quick-play"]);
		expect(codes(done, "you", "graveyard").sort()).toEqual(["peek", "quick-play"]);
		expect(codes(done, "you", "spell")).toEqual([]);
	});
});

describe("answering a Summon whose trigger is on the chain", () => {
	const start = () => position({ defs: triggerCards(), options, you: { hand: ["summon-and", "monster"], set: ["tribute-b"], monsters: ["summon-watcher"] }, rival: { set: ["tribute"] } });
	const triggered = () => play(start(), "activate summon-and", "pass", "pass");

	it(`${cites("rules", "answer-the-summon-in-the-chain")} ${cites("rules", "answer-the-summon-again")} lets a "when a monster is Summoned" Trap be chained to the trigger effect of that Summon, and lets another be chained after it`, () => {
		const chained = triggered();
		expect(chainOf(chained)).toEqual(["summon-watcher"]);
		expect(offered(chained)).toEqual(["activate tribute", "pass"]);
		const answered = play(chained, "activate tribute");
		expect(chainOf(answered)).toEqual(["summon-watcher", "tribute"]);
		expect(answered.priority.holder).toBe("you");
		expect(offered(answered)).toEqual(["activate tribute-b", "pass"]);
	});
	// No Konami page we found says this case in words; it follows from "the last thing that happened".
	it(`${cites("rules", "last-thing-that-happened")} no longer lets it be activated once the trigger chain has resolved`, () => {
		const resolved = play(triggered(), "pass", "pass");
		expect(resolved.chain).toEqual([]);
		expect(offered(resolved)).toEqual(["pass"]);
		expect(offered(play(resolved, "pass"))).toEqual(["pass"]);
	});
});

describe("cards moved at the same time", () => {
	it(`${cites("rules", "simultaneous-counts-once")} counts cards sent by one effect at once as a single occurrence for an "each time" trigger, while two separate links still count twice`, () => {
		const start = position({ defs: triggerCards(), options, you: { hand: ["sweep-rival"], monsters: ["each-counter"] }, rival: { monsters: ["monster", "monster"] } });
		const swept = play(start, "activate sweep-rival", "pass", "pass");
		expect(codes(swept, "rival", "graveyard")).toEqual(["monster", "monster"]);
		expect(chainOf(swept)).toEqual(["each-counter"]);
	});
});
