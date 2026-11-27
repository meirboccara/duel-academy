import { describe, expect, it } from "vitest";
import { ask, moveCard, playIndex, revealCards } from "../src";
import { renderSeat, seatBoard } from "../src/agent-play";
import { play, position } from "./rules/fixtures";
import { battleCards } from "./rules/battle-fixtures";
import { blueEyesFixtures } from "./cards/blue-eyes-fixtures";
import { board as ssBoard, resolve as ssResolve, threeSpells } from "./cards/sky-striker-fixtures";
import { addModifier, askZone, CARD_DEFS, drawCards, negateCardEffects, watch, type CardDef, delay, describeChange, type Duel, legalActions, HIDDEN, type Match, type MatchRecord, type Side, matchRecord, moveCards, openMatch, playMove, raiseDispute, READINESS_DECKS, replayMatch, seatFor, settleDispute, startDuel, viewFor } from "../src";

const flat = (id: number) => {
	const deck = READINESS_DECKS.find((manifest) => manifest.id === id)!;
	const codes = (entries: typeof deck.main) => entries.flatMap((entry) => Array<string>(entry.count).fill(entry.code!));
	return { deck: codes(deck.main), extra: codes(deck.extra) };
};
/** Sky Striker 745443 ("you", first) against Blue-Eyes 746021. Seed 1: Sky Striker opens Raye; Blue-Eyes holds Infinite Impermanence. */
const SETUP = { seed: 1, you: flat(745443), rival: flat(746021) };

describe("a match: a seeded Duel two players play from their own seats", () => {
	it("Zero's real resolution choice does not reveal an opponent's Set card", () => {
		let duel = ssBoard({ extraZone: ["sky-striker-ace-zero"], deck: ["sky-striker-ace-raye"], graveyard: ["sky-striker-ace-roze"] }, { set: ["majesty-of-the-white-dragons"] });
		duel = ssResolve(play(duel, "activate sky-striker-ace-zero"));
		while (duel.asking?.zones) duel = play(duel, `place ${duel.asking.from[0]}`);
		duel = play(duel, "choose sky-striker-ace-zero");
		const match: Match = { setup: SETUP, duel, log: [], disputes: [] };
		const seat = seatFor(match, "you");
		expect(seat.moves).toContain("choose ?(rival spell 0)");
		expect(JSON.stringify(seat)).not.toContain("majesty-of-the-white-dragons");
		expect(seat.moves).toContain("choose sky-striker-ace-raye");
		expect(seatFor(match, "rival").view.players.rival.spells[0]!.code).toBe("majesty-of-the-white-dragons");
	});
	it("generic non-target choices keep hidden cards distinct by location, with indices selecting the actual card", () => {
		const duel = ssBoard({ hand: ["raigeki"] }, { set: ["majesty-of-the-white-dragons", "true-light"] });
		const ids = duel.piles.rival.spell;
		const match: Match = { setup: SETUP, duel: ask(duel, "you", ids, (board, id) => moveCard(board, id, { zone: "banished", face: "down" })), log: [], disputes: [] };
		const seat = seatFor(match, "you");
		expect(seat.moves).toEqual(["choose ?(rival spell 0)", "choose ?(rival spell 1)"]);
		expect(seat.details[1]).toContain("choose a card from the opponent's Spell & Trap Zone 1");
		for (const hidden of ["majesty-of-the-white-dragons", "true-light"]) {
			expect(JSON.stringify(seat)).not.toContain(hidden);
			expect(JSON.stringify(seatBoard(match, "you"))).not.toContain(hidden);
			expect(renderSeat(seatBoard(match, "you"))).not.toContain(hidden);
		}
		expect(seat.view.players.you.hand[0]!.code).toBe("raigeki");
		const done = playIndex(match, "you", 1, { expect: seat.moves[1] });
		expect(done.log.at(-1)!.action).toEqual({ type: "choose", card: ids[1] });
		expect(done.duel.cards[ids[0]!]!.zone).toBe("spell");
		expect(done.duel.cards[ids[1]!]!.zone).toBe("banished");
		expect(seatFor(done, "you").log.at(-1)!.name).toBe("choose ?(rival spell 1)");
		expect(JSON.stringify(seatFor(done, "you"))).not.toContain("true-light");
		expect(seatFor(done, "rival").log.at(-1)!.name).toBe("choose true-light");
	});

	it("a choice among cards of several places: own Deck, public and revealed cards stay named; the opponent's hidden hand, Deck, face-down banished and Set cards are not", () => {
		const base = ssBoard({ hand: ["raigeki"], deck: ["mystical-space-typhoon"], graveyard: ["pot-of-greed"] }, { hand: ["true-light"], deck: ["infinite-impermanence"], set: ["majesty-of-the-white-dragons"] });
		const mine = base.piles.you;
		const theirs = base.piles.rival;
		const banished = moveCards(base, [theirs.deck[0]!], { zone: "banished", face: "down" });
		const from = [...mine.hand, ...mine.deck, ...mine.graveyard, ...theirs.hand, ...banished.piles.rival.banished, ...theirs.spell];
		const asked = ask(banished, "you", from, (board) => board);
		const seat = seatFor({ setup: SETUP, duel: asked, log: [], disputes: [] }, "you");
		expect(seat.moves).toEqual(["choose raigeki", "choose mystical-space-typhoon", "choose pot-of-greed", "choose ?", "choose ?(rival banished 0)", "choose ?(rival spell 0)"]);
		for (const hidden of ["true-light", "infinite-impermanence", "majesty-of-the-white-dragons"]) expect(JSON.stringify(seat)).not.toContain(hidden);
		// The rival, not asked, learns nothing from the question either.
		const other = JSON.stringify(seatFor({ setup: SETUP, duel: asked, log: [], disputes: [] }, "rival"));
		for (const hidden of ["raigeki", "mystical-space-typhoon"]) expect(other).not.toContain(hidden);
		// A card revealed on purpose to both players stays named by the chooser.
		const shown = revealCards(asked, "rival", [theirs.hand[0]!]);
		expect(seatFor({ setup: SETUP, duel: shown, log: [], disputes: [] }, "you").moves).toContain("choose true-light");
	});

	it("a cost that reveals or discards names only what the seat sees before paying", () => {
		const spell = (code: string, cost: NonNullable<CardDef["effects"]>[number]["cost"]): CardDef => ({ code, kind: "spell", effects: [{ type: "activation", cost, operation: (duel) => duel }] });
		const reveal = spell("fixture-priv-reveal", { pick: (duel, { player }) => duel.piles[player].hand.map((id) => [id]), pay: (duel, { player }, picked) => revealCards(duel, player, picked) });
		const match = passTo(openMatch({ ...SETUP, you: { deck: Array<string>(6).fill("fixture-priv-reveal") }, rival: { deck: Array<string>(6).fill("true-light") } }, { ...CARD_DEFS, [reveal.code]: reveal }), "main1");
		const seat = seatFor(match, "you");
		expect(seat.details.some((text) => text.includes("revealed (it stays in the hand)"))).toBe(true);
		expect(JSON.stringify(seatFor(match, "you"))).not.toContain("true-light");
	});

	it("a proposed placement does not name a hidden card revealed only by its dry-run", () => {
		const duel = ssBoard({}, { deck: ["majesty-of-the-white-dragons"] });
		const id = duel.piles.rival.deck[0]!;
		const match: Match = { setup: SETUP, duel: askZone(duel, "you", [0, 1], (board, slot) => moveCard(board, id, { zone: "spell", slot, face: "up" })), log: [], disputes: [] };
		expect(seatFor(match, "you").details).toEqual(["Spell & Trap Zone 0: a card is placed here", "Spell & Trap Zone 1: a card is placed here"]);
		expect(JSON.stringify(seatFor(match, "you"))).not.toContain("majesty-of-the-white-dragons");
		const done = playMove(match, "you", "place 1");
		expect(JSON.stringify(seatFor(done, "you"))).toContain("majesty-of-the-white-dragons");
	});

	it("opens as startDuel does; only the player to act is offered moves, named from their own seat", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		expect(match.duel).toEqual(startDuel({ ...SETUP, defs: CARD_DEFS }));
		const you = seatFor(match, "you");
		const rival = seatFor(match, "rival");
		expect(you.toAct).toBe(true);
		// Turn 1's Draw Phase: Radiant Typhoon Vision (a Quick-Play Spell in the opening hand) may already be activated.
		expect(you.moves).toEqual(["pass", "activate radiant-typhoon-vision #1", "activate radiant-typhoon-vision #2"]);
		expect(rival.toAct).toBe(false);
		expect(rival.moves).toEqual([]);
		// Each seat sees its own hand and not the other's.
		const hand = (seat: typeof you, side: "you" | "rival") => seat.view.players[side].hand.map((card) => card.code);
		expect(hand(you, "you")).toContain("sky-striker-ace-raye");
		expect(hand(you, "rival")).toEqual(Array(5).fill(HIDDEN));
		expect(hand(rival, "rival")).toContain("infinite-impermanence");
		expect(hand(rival, "you")).toEqual(Array(5).fill(HIDDEN));
	});

	it("a move is played by name from the seat to act, and logged once with the name each seat gives it: a Set card stays hidden from the opponent", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		const before = match.log.length;
		match = playMove(match, "you", "set raigeki");
		expect(match.log.slice(before)).toEqual([{ turn: 1, phase: "main1", side: "you", action: expect.objectContaining({ type: "set" }), seen: { you: "set raigeki", rival: "set ?" } }]);
		expect(seatFor(match, "rival").log.at(-1)).toEqual({ turn: 1, phase: "main1", side: "you", name: "set ?" });
		expect(seatFor(match, "you").log.at(-1)).toEqual({ turn: 1, phase: "main1", side: "you", name: "set raigeki" });
	});

	it("what a move shows both players is named for both: a Summon, and a card activated from the hand", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		expect(match.log.at(-1)!.seen).toEqual({ you: "summon sky-striker-ace-raye", rival: "summon sky-striker-ace-raye" });
		match = playMove(match, "you", "activate sky-striker-ace-raye #1");
		match = playMove(match, "you", "pass");
		match = playMove(match, "you", "choose sky-striker-ace-kagari");
		match = playMove(match, "you", "place 5");
		match = playMove(match, "you", "pass");
		expect(seatFor(match, "rival").moves).toContain("activate infinite-impermanence > sky-striker-ace-kagari");
		match = playMove(match, "rival", "activate infinite-impermanence > sky-striker-ace-kagari");
		expect(match.log.at(-1)!.seen).toEqual({ you: "activate infinite-impermanence > sky-striker-ace-kagari", rival: "activate infinite-impermanence > sky-striker-ace-kagari" });
		// The Extra Deck card chosen is still face-down in the Extra Deck once chosen (its zone is asked next): the opponent reads it in the
		// board once it is placed, not in the name of the choice.
		expect(match.log.find((entry) => entry.action.type === "choose")!.seen).toEqual({ you: "choose sky-striker-ace-kagari", rival: "choose ?" });
	});

	it("while a Summon is being attempted, the opponent asked whether to answer it sees the monster being Summoned", () => {
		// Every window shown: the Duel stops in the Summon's own window ("would be Summoned"), the monster not yet on the field.
		let match = passTo(openMatch({ ...SETUP, options: { everyWindow: true } }, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		expect(match.duel.summoning?.cards).toHaveLength(1);
		const raye = match.duel.summoning!.cards[0]!;
		// The turn player is asked first; the Summon is still being attempted, Raye still in the hand.
		expect(seatFor(match, "you")).toMatchObject({ toAct: true, moves: ["pass"] });
		expect(match.duel.cards[raye]!.zone).toBe("hand");
		match = playMove(match, "you", "pass");
		expect(match.duel.summoning?.cards).toEqual([raye]);
		expect(match.duel.cards[raye]!.zone).toBe("hand");
		const rival = seatFor(match, "rival");
		expect(rival.toAct).toBe(true);
		expect(rival.view.players.you.hand.map((card) => card.code)).toContain("sky-striker-ace-raye");
		expect(rival.view.summoning).toEqual({ player: "you", cards: [`you hand ${match.duel.piles.you.hand.indexOf(raye)}`] });
	});

	it("two face-down cards a seat cannot see are told apart by where they are, so each move has its own name", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki @0");
		match = playMove(match, "rival", "set raigeki @3");
		expect(seatFor(match, "you").log.slice(-2).map((entry) => entry.name)).toEqual(["set ?", "set ?"]);
		for (let guard = 0; guard < 20 && match.duel.turn.number === 1; guard++) match = playMove(match, "rival", "pass");
		const you = seatFor(match, "you");
		expect(you.toAct).toBe(true);
		expect(you.moves).toEqual(expect.arrayContaining(["activate mystical-space-typhoon > ?(rival spell 0)", "activate mystical-space-typhoon > ?(rival spell 3)"]));
		match = playMove(match, "you", "activate mystical-space-typhoon > ?(rival spell 3)");
		match = passWhileChain(match);
		expect(match.duel.piles.rival.spell.map((id) => match.duel.cards[id]!.slot)).toEqual([0]);
	});

	it("two face-down banished cards a seat cannot see are told apart by their place in the banished pile, so each target has its own name", () => {
		// A made-up Quick-Play Spell (no real card): "Target 1 card your opponent has banished; [nothing]."
		const aim: CardDef = { code: "fixture-banished-aim", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player === "you" ? "rival" : "you"].banished, operation: (duel) => duel }] };
		const setup = { seed: 3, you: { deck: Array<string>(6).fill("fixture-banished-aim") }, rival: { deck: Array<string>(8).fill("raigeki") } };
		const opened = passTo(openMatch(setup, { ...CARD_DEFS, [aim.code]: aim }), "main1");
		// Two of the rival's cards banished face-down (as an effect would do).
		const [first, second] = opened.duel.piles.rival.deck;
		const match: Match = { ...opened, duel: moveCards(opened.duel, [first!, second!], { zone: "banished", face: "down" }) };
		const moves = seatFor(match, "you").moves;
		expect(moves).toEqual(expect.arrayContaining(["activate fixture-banished-aim > ?(rival banished 0)", "activate fixture-banished-aim > ?(rival banished 1)"]));
		expect(moves.some((name) => /> \?$/.test(name))).toBe(false);
		const played = playMove(match, "you", "activate fixture-banished-aim > ?(rival banished 1)");
		expect(played.duel.chain.at(-1)!.targets).toEqual([second]);
	});

	it("a name that still stands for several moves naming cards the seat cannot see is refused as ambiguous", () => {
		// A Duel object whose hidden cards cannot be told apart by place (a card in the rival's hand cannot be a target in a real Duel).
		const aim: CardDef = { code: "fixture-hand-aim", kind: "quick-play", effects: [{ type: "activation", target: (duel, { player }) => duel.piles[player === "you" ? "rival" : "you"].hand, operation: (duel) => duel }] };
		const setup = { seed: 3, you: { deck: Array<string>(6).fill("fixture-hand-aim") }, rival: { deck: Array<string>(8).fill("raigeki") } };
		const match = passTo(openMatch(setup, { ...CARD_DEFS, [aim.code]: aim }), "main1");
		expect(seatFor(match, "you").moves.filter((name) => name === "activate fixture-hand-aim > ?").length).toBeGreaterThan(1);
		expect(() => playMove(match, "you", "activate fixture-hand-aim > ?")).toThrow(/ambiguous/);
	});

	it("a seat shows the masked Duel only: not the pools the hidden cards are dealt from", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		for (const side of ["you", "rival"] as const) {
			const { view } = seatFor(match, side);
			expect(Object.keys(view).sort()).toEqual(["battle", "chain", "lasting", "players", "side", "summoning", "turn", "waiting", "winner"]);
			expect(view).not.toHaveProperty("unknown");
		}
		// The bot's own view keeps them.
		expect(viewFor(match.duel, "you").unknown.rival.main).toContain("infinite-impermanence");

		// Trigger Effects waiting for a card in each hand (as hand triggers would): each seat sees only the one of its own hand.
		const rivals = match.duel.cards[match.duel.piles.rival.hand[0]!]!;
		const yours = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		const waiting = [rivals, yours].map((card) => ({ card, effect: 0, event: { type: "phase" as const, phase: "draw" as const, player: "you" as const } }));
		const triggered: Match = { ...match, duel: { ...match.duel, waiting } };
		expect(seatFor(triggered, "you").view.waiting).toEqual([{ ref: "you hand 0", code: yours.code, effect: 0 }]);
		expect(seatFor(triggered, "rival").view.waiting).toEqual([{ ref: "rival hand 0", code: rivals.code, effect: 0 }]);
	});

	it("a seat shows no engine card id: two Duels that differ only in the ids of the cards a seat cannot see look the same from it", () => {
		// `createDuel` numbers the cards in the order of the Deck lists: with the list, an id names the card. A card of the rival's hand
		// and one of their Deck trade ids (each keeps its code and place): nothing either seat is shown may change.
		const match = openMatch(SETUP, CARD_DEFS);
		const relabelled: Match = { ...match, duel: swapIds(match.duel, match.duel.piles.rival.hand[0]!, match.duel.piles.rival.deck[0]!) };
		expect(relabelled.duel.cards[match.duel.piles.rival.deck[0]!]!.zone).toBe("hand");
		expect(seatFor(relabelled, "you")).toEqual(seatFor(match, "you"));
		expect(seatFor(relabelled, "rival")).toEqual(seatFor(match, "rival"));
		// Nor the pools the hidden cards are dealt from: no Blue-Eyes card the Sky Striker list lacks is named anywhere in the seat.
		const text = JSON.stringify(seatFor(match, "you"));
		for (const hidden of ["infinite-impermanence", "blue-eyes-white-dragon", "sage-with-eyes-of-blue"]) expect(text).not.toContain(hidden);
	});

	it("a seat names each card by where it is, and the chain's cards and targets by the same references as the board", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass", "choose sky-striker-ace-kagari", "place 5", "pass"]) match = playMove(match, "you", step);
		match = playMove(match, "rival", "activate infinite-impermanence > sky-striker-ace-kagari");
		for (const side of ["you", "rival"] as const) {
			const { view } = seatFor(match, side);
			const link = view.chain.find((each) => each.code === "infinite-impermanence")!;
			expect(link.player).toBe("rival");
			const kagari = view.players.you.monsters.find((card) => card.code === "sky-striker-ace-kagari")!;
			expect(kagari.ref).toBe("you monster 5");
			expect(link.targets).toEqual([kagari.ref]);
			expect(view.players.rival.spells.find((card) => card.code === "infinite-impermanence")!.ref).toBe(link.ref);
		}
	});

	it("the record (setup and log, plain JSON) replays to the same Duel, and a replay that no longer matches the log stops at that move", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass", "choose sky-striker-ace-kagari", "place 5", "pass"]) match = playMove(match, "you", step);
		match = playMove(match, "rival", "activate infinite-impermanence > sky-striker-ace-kagari");
		match = passWhileChain(match);
		const record: MatchRecord = JSON.parse(JSON.stringify(matchRecord(match)));
		const replayed = replayMatch(record, CARD_DEFS);
		expect(replayed.duel).toEqual(match.duel);
		expect(replayed.log).toEqual(match.log);

		// A log whose names no longer match what the moves are now (the rules or a card changed) stops where they part.
		const at = record.log.findIndex((entry) => entry.seen.rival.startsWith("activate infinite-impermanence"));
		const changed = { ...record, log: record.log.map((entry, i) => (i === at ? { ...entry, seen: { ...entry.seen, you: "activate something-else" } } : entry)) };
		expect(() => replayMatch(changed, CARD_DEFS)).toThrow(new RegExp(`move ${at + 1}.*activate infinite-impermanence > sky-striker-ace-kagari`));
		// A move that is not legal where it is replayed stops it too.
		const illegal = { ...record, log: [{ ...record.log[0]!, action: { type: "summon", card: 9999, how: "normal" } as const }] };
		expect(() => replayMatch(illegal, CARD_DEFS)).toThrow(/move 1/);
	});

	it("a pass made for a player who could only pass is logged with the move that led to it, and each seat reads it from its own side", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		const before = match.log.length;
		match = playMove(match, "you", seatFor(match, "you").moves.find((name) => name.startsWith("activate mystical-space-typhoon"))!);
		// The rival's only move was to pass: the Duel did it, and the log says so, naming no card.
		const entry = match.log[before]!;
		expect(entry.side).toBe("you");
		expect(entry.passes).toEqual(["rival"]);
		expect(seatFor(match, "you").log[before]).toMatchObject({ side: "you", auto: [{ side: "rival", name: "pass (no legal response)" }] });
		expect(seatFor(match, "rival").log[before]).toMatchObject({ side: "you", name: expect.stringMatching(/^activate mystical-space-typhoon/), auto: [{ side: "rival", name: "pass (no legal response)" }] });
		// With every window shown the Duel passes for nobody, so nothing is logged.
		const shown = playMove(openMatch({ ...setup, options: { everyWindow: true } }, CARD_DEFS), "rival", "pass");
		expect(shown.log[0]).not.toHaveProperty("passes");
		expect(seatFor(shown, "you").log[0]).not.toHaveProperty("auto");
		expect(JSON.stringify(seatFor(match, "you").log)).not.toContain("raigeki");
	});

	it("a record written before passes were logged still replays: the field is not required, and not compared", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass", "choose sky-striker-ace-kagari", "place 5", "pass"]) match = playMove(match, "you", step);
		match = playMove(match, "rival", "activate infinite-impermanence > sky-striker-ace-kagari");
		match = passWhileChain(match);
		const record: MatchRecord = JSON.parse(JSON.stringify(matchRecord(match)));
		expect(record.log.some((entry) => entry.passes !== undefined)).toBe(true);
		const old: MatchRecord = { ...record, log: record.log.map(({ passes: _passes, ...entry }) => entry) };
		expect(replayMatch(old, CARD_DEFS).duel).toEqual(match.duel);
		const wrong: MatchRecord = { ...record, log: record.log.map((entry) => ({ ...entry, passes: ["you", "you"] as const })) };
		expect(replayMatch(wrong, CARD_DEFS).duel).toEqual(match.duel);
	});

	it("a chain target that has left where it was is shown as gone, not as a live reference", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		match = playMove(match, "you", seatFor(match, "you").moves.find((name) => name.startsWith("activate mystical-space-typhoon"))!);
		const target = match.duel.chain.at(-1)!.targets[0]!;
		for (const side of ["you", "rival"] as const) expect(seatFor(match, side).view.chain.at(-1)!.targets[0]).toMatch(/spell \d$/);
		const gone: Match = { ...match, duel: moveCards(match.duel, [target], { zone: "graveyard" }) };
		for (const side of ["you", "rival"] as const) expect(seatFor(gone, side).view.chain.at(-1)!.targets).toEqual(["gone"]);
	});

	it("a seat can raise a dispute at any point; the raiser reads it whole, the other seat only that one was raised; settled once with its ruling and sources, and kept in the record", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		// Not this seat's decision: a dispute does not need priority.
		expect(seatFor(match, "rival").toAct).toBe(false);
		match = raiseDispute(match, "rival", "Can Infinite Impermanence be activated from the hand on a monster Special Summoned by Raye?");
		const open = { at: match.log.length, turn: 1, phase: "main1", by: "rival", claim: "Can Infinite Impermanence be activated from the hand on a monster Special Summoned by Raye?", ruling: null };
		expect(seatFor(match, "rival").disputes).toEqual([open]);
		expect(seatFor(match, "you").disputes).toEqual([{ at: open.at, turn: 1, phase: "main1", by: "rival", notice: "the opponent raised a dispute (open)" }]);

		// The harness stores what it is given: this ruling and its source are placeholders, not a ruling of the core.
		const ruling = { decision: "placeholder decision", via: "ygoprojudge" as const, sources: ["https://example.invalid/placeholder-source"], session: "placeholder-session" };
		match = settleDispute(match, 0, ruling);
		expect(match.disputes).toEqual([{ ...open, ruling }]);
		expect(seatFor(match, "rival").disputes).toEqual([{ ...open, ruling }]);
		expect(seatFor(match, "you").disputes).toEqual([{ at: open.at, turn: 1, phase: "main1", by: "rival", notice: "the opponent raised a dispute (settled)" }]);
		expect(() => settleDispute(match, 0, ruling)).toThrow(/already settled/);
		expect(() => settleDispute(match, 1, ruling)).toThrow(/no dispute 1/);

		const record: MatchRecord = JSON.parse(JSON.stringify(matchRecord(match)));
		expect(record.disputes).toEqual(match.disputes);
		expect(replayMatch(record, CARD_DEFS).disputes).toEqual(match.disputes);
	});

	it("a dispute that names a card of the raiser's hand is never read by the other seat: no claim, no ruling, no card name in its view or log", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		// The rival holds Infinite Impermanence in its hand (seed 1): "you" must not learn it from a dispute.
		expect(seatFor(match, "rival").view.players.rival.hand.map((card) => card.code)).toContain("infinite-impermanence");
		match = raiseDispute(match, "rival", "I hold infinite-impermanence in my hand: may it be activated now?");
		match = settleDispute(match, 0, { decision: "infinite-impermanence may be activated from the hand", via: "owner", sources: ["note about infinite-impermanence"] });
		const seen = JSON.stringify(seatFor(match, "you"));
		expect(seen).not.toContain("infinite-impermanence");
		expect(seen).not.toContain("I hold");
		expect(seatFor(match, "you").disputes).toEqual([{ at: match.disputes[0]!.at, turn: 1, phase: "main1", by: "rival", notice: "the opponent raised a dispute (settled)" }]);
		// What the rival said stays whole for the rival.
		expect(JSON.stringify(seatFor(match, "rival").disputes)).toContain("I hold infinite-impermanence");
		// A dispute raised by "you" is likewise only a notice for the rival.
		match = raiseDispute(match, "you", "May sky-striker-ace-raye attack?");
		expect(seatFor(match, "rival").disputes[1]).toEqual({ at: match.disputes[1]!.at, turn: 1, phase: "main1", by: "you", notice: "the opponent raised a dispute (open)" });
		expect(JSON.stringify(seatFor(match, "rival").disputes[1])).not.toContain("attack");
	});

	it("a player who cannot make the normal draw loses; then no seat is offered anything and the record still replays", () => {
		let match = openMatch({ seed: 5, you: { deck: Array<string>(6).fill("raigeki") }, rival: { deck: Array<string>(5).fill("raigeki") } }, CARD_DEFS);
		for (let guard = 0; guard < 60 && !match.duel.winner; guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		expect(match.duel.winner).toBe("you");
		expect(match.duel.turn).toMatchObject({ player: "rival", number: 2 });
		for (const side of ["you", "rival"] as const) expect(seatFor(match, side)).toMatchObject({ toAct: false, moves: [] });
		expect(() => playMove(match, "you", "pass")).toThrow(/does not hold the decision/);
		expect(replayMatch(matchRecord(match), CARD_DEFS).duel.winner).toBe("you");
	});

	it("refuses a move from the seat not to act, or a name not offered, saying what is offered", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		expect(() => playMove(match, "rival", "pass")).toThrow(/rival does not hold the decision/);
		expect(() => playMove(match, "you", "summon sky-striker-ace-raye")).toThrow(/not legal.*activate radiant-typhoon-vision #1/);
		expect(match.log).toEqual([]);
	});
});

describe("monsters on the board: Level, Rank or Link Rating, printed Attribute and Type; a Link Monster has no DEF", () => {
	const board = (match: Match) => seatFor(match, "you").view.players.you.monsters;

	it("a Link Monster shows its Link Rating and no DEF; a Level monster its Level, DEF, Attribute and Type", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass", "choose sky-striker-ace-kagari", "place 5"]) match = playMove(match, "you", step);
		const kagari = board(match).find((card) => card.code === "sky-striker-ace-kagari")!;
		expect(kagari).toMatchObject({ link: 1, attribute: "FIRE", monsterType: "Machine", atk: 1500 });
		expect(kagari).not.toHaveProperty("def");
		expect(kagari).not.toHaveProperty("level");
		let fresh = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		fresh = playMove(fresh, "you", "summon sky-striker-ace-raye");
		expect(board(fresh)[0]).toMatchObject({ level: 4, attribute: "DARK", monsterType: "Warrior", atk: 1500, def: 1500 });
		expect(board(fresh)[0]).not.toHaveProperty("rank");
		expect(board(fresh)[0]).not.toHaveProperty("link");
	});

	it("an Xyz Monster shows its Rank, not a Level; a face-down monster shows none of it to the opponent", () => {
		const xyz: CardDef = { code: "fixture-xyz", kind: "monster", facts: { name: "Fixture Xyz", attribute: "WATER", monsterType: "Aqua", frame: "xyz", rank: 4, atk: 2000, def: 1000 } };
		const setup = { seed: 3, you: { deck: Array<string>(8).fill("raigeki"), extra: ["fixture-xyz"] }, rival: { deck: Array<string>(8).fill("raigeki") } };
		const opened = passTo(openMatch(setup, { ...CARD_DEFS, [xyz.code]: xyz }), "main1");
		const id = opened.duel.piles.you.extra[0]!;
		const match: Match = { ...opened, duel: moveCards(opened.duel, [id], { zone: "monster", face: "up", slot: 5 }) };
		expect(board(match)[0]).toMatchObject({ rank: 4, attribute: "WATER", monsterType: "Aqua", atk: 2000, def: 1000 });
		expect(board(match)[0]).not.toHaveProperty("level");
		const down: Match = { ...opened, duel: moveCards(opened.duel, [id], { zone: "monster", face: "down", slot: 5 }) };
		const hidden = seatFor(down, "rival").view.players.you.monsters[0]!;
		expect(hidden).not.toHaveProperty("rank");
		expect(hidden).not.toHaveProperty("attribute");
		expect(hidden.code).toBe(HIDDEN);
	});
});

describe("effects in force: what a lock or a modifier left is on the board, for the seats that may see its source", () => {
	const opened = () => passTo(openMatch(SETUP, CARD_DEFS), "main1");

	it("a monster shows the modifiers on it with the card they come from, and its ATK as it is now", () => {
		let match = playMove(opened(), "you", "summon sky-striker-ace-raye");
		const raye = match.duel.piles.you.monster[0]!;
		const source = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		match = { ...match, duel: addModifier(match.duel, { affects: { card: raye, moves: match.duel.cards[raye]!.moves }, until: 1, by: { card: source, player: "you", effect: 0 }, layer: { kind: "add", stat: "atk", by: 500 } }) };
		for (const side of ["you", "rival"] as const) {
			const seen = seatFor(match, side).view.players.you.monsters[0]!;
			expect(seen.atk).toBe(2000);
			expect(seen.modifiers).toEqual([`ATK +500 (${side === "you" ? source.code : "a card"}), until the end of turn 1`]);
		}
	});

	it("a lock in force is listed for both seats, from each seat's point of view, with the turn it lasts until", () => {
		const duel = opened().duel;
		const source = duel.cards[duel.piles.you.hand[0]!]!;
		const locked = addModifier(duel, { affects: () => false, until: 1, by: { card: source, player: "you", effect: 0 }, layer: { kind: "lock", what: "draw", who: "rival" } });
		const match: Match = { ...opened(), duel: locked };
		expect(seatFor(match, "you").view.lasting).toEqual([`the opponent cannot draw cards by card effects (${source.code}), until the end of turn 1`]);
		expect(seatFor(match, "rival").view.lasting).toEqual(["you cannot draw cards by card effects (a card), until the end of turn 1"]);
		expect(seatFor(opened(), "you").view.lasting).toEqual([]);
	});

	it("a lock line carries its ways; a closure filter says to read the numbered moves; a describe string is used when the card gives one", () => {
		const duel = opened().duel;
		const source = duel.cards[duel.piles.you.hand[0]!]!;
		const by = { card: source, player: "you" as const, effect: 0 };
		const lasting = (layer: Parameters<typeof addModifier>[1]["layer"]) => seatFor({ ...opened(), duel: addModifier(duel, { affects: () => false, until: 1, by, layer }) }, "you").view.lasting;
		expect(lasting({ kind: "lock", what: "summon", who: "you", ways: ["special"] })).toEqual([`you cannot Special Summon monsters (${source.code}), until the end of turn 1`]);
		expect(lasting({ kind: "lock", what: "summon", who: "you", ways: ["normal", "special"] })).toEqual([`you cannot Normal Summon or Special Summon monsters (${source.code}), until the end of turn 1`]);
		expect(lasting({ kind: "lock", what: "summon", who: "you", ways: ["special"], only: () => true })).toEqual([`you cannot Special Summon some monsters: conditional lock, see the numbered moves, they list what the engine allows (${source.code}), until the end of turn 1`]);
		expect(lasting({ kind: "lock", what: "activate", who: "you", stops: () => true })).toEqual([`you cannot activate some cards or effects: conditional lock, see the numbered moves, they list what the engine allows (${source.code}), until the end of turn 1`]);
		expect(lasting({ kind: "lock", what: "attack-directly", who: "you", only: () => true })).toEqual([`you cannot attack directly with some monsters: conditional lock, see the numbered moves, they list what the engine allows (${source.code}), until the end of turn 1`]);
		expect(lasting({ kind: "lock", what: "activate", who: "you", stops: () => true, describe: "cards named Pot of Sloth" })).toEqual([`you cannot activate cards named Pot of Sloth (${source.code}), until the end of turn 1`]);
		expect(lasting({ kind: "lock", what: "draw", who: "both" })).toEqual([`both players cannot draw cards by card effects (${source.code}), until the end of turn 1`]);
	});

	it("a delayed effect about a card that has left is not listed any more (the core keeps the entry to the end of its phase but offers and owes nothing)", () => {
		const match = playMove(opened(), "you", "summon sky-striker-ace-raye");
		const raye = match.duel.cards[match.duel.piles.you.monster[0]!]!;
		const by = { card: raye, player: "you" as const, effect: 0 };
		const delayed = delay(match.duel, by, { due: { phase: "end", turn: 1 }, card: raye, mandatory: true, apply: (board) => board });
		expect(seatFor({ ...match, duel: delayed }, "you").view.lasting).toEqual([`${raye.code} effect 1: you will apply a mandatory delayed effect in the end phase of turn 1`]);
		const gone: Match = { ...match, duel: moveCards(delayed, [raye.id], { zone: "graveyard" }) };
		expect(gone.duel.delayed).toHaveLength(1);
		for (const side of ["you", "rival"] as const) expect(seatFor(gone, side).view.lasting).toEqual([]);
	});

	it("a negation of a card that has left the field is not listed any more (it reaches nothing: a card that moved is a new card)", () => {
		const match = playMove(opened(), "you", "summon sky-striker-ace-raye");
		const raye = match.duel.cards[match.duel.piles.you.monster[0]!]!;
		const source = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		const negated = addModifier(match.duel, { affects: { card: raye.id, moves: raye.moves }, until: 1, by: { card: source, player: "you", effect: 0 }, layer: { kind: "negate" } });
		expect(seatFor({ ...match, duel: negated }, "you").view.lasting).toEqual([`the effects of ${raye.code} are negated (${source.code}), until the end of turn 1`]);
		const gone: Match = { ...match, duel: moveCards(negated, [raye.id], { zone: "banished" }) };
		for (const side of ["you", "rival"] as const) expect(seatFor(gone, side).view.lasting).toEqual([]);
	});

	it("a watch (\"each time ..., until the end of the turn\") and a delayed effect are listed with the card they come from", () => {
		const match = opened();
		const source = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		const by = { card: source, player: "you" as const, effect: 0 };
		let duel = watch(match.duel, by, { until: 1, event: () => false, apply: (board) => board });
		duel = delay(duel, by, { due: { phase: "end", turn: 1 }, mandatory: true, apply: (board) => board });
		const built: Match = { ...match, duel };
		expect(seatFor(built, "you").view.lasting).toEqual([
			`${source.code} effect 1: lasting effect of you, applied each time its condition happens, until the end of turn 1`,
			`${source.code} effect 1: you will apply a mandatory delayed effect in the end phase of turn 1`,
		]);
		expect(seatFor(built, "rival").view.lasting).toEqual([
			"a card effect 1: lasting effect of the opponent, applied each time its condition happens, until the end of turn 1",
			"a card effect 1: the opponent will apply a mandatory delayed effect in the end phase of turn 1",
		]);
	});

	it("effects a card's effect negated for a while: the lasting negation is said when it begins, naming the monster and the card that did it", () => {
		const match = playMove(opened(), "you", "summon sky-striker-ace-raye");
		const raye = match.duel.piles.you.monster[0]!;
		const source = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		const after = negateCardEffects(match.duel, raye, 1, { card: source, player: "you", effect: 0 });
		expect(describeChange(match.duel, after, "you")).toEqual([`lasting effect begins: the effects of sky-striker-ace-raye are negated (${source.code}), until the end of turn 1`]);
		expect(describeChange(match.duel, after, "rival")).toEqual(["lasting effect begins: the effects of sky-striker-ace-raye are negated (a card), until the end of turn 1"]);
	});
});

describe("move details: what each move does, beside its label (labels and their order stay as they are)", () => {
	const fodder = (match: Match, slots: readonly number[]): Match => {
		let duel = match.duel;
		slots.forEach((slot, i) => (duel = moveCards(duel, [match.duel.piles.you.deck[i]!], { zone: "monster", face: "up", slot })));
		return { ...match, duel };
	};
	const BLUE_EYES = { seed: 3, you: { deck: Array<string>(12).fill("blue-eyes-white-dragon") }, rival: { deck: Array<string>(12).fill("raigeki") } };

	it("every move has a detail, in the order of the moves; a seat that does not act has none", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		const you = seatFor(match, "you");
		expect(you.details).toHaveLength(you.moves.length);
		expect(you.details.every((detail) => detail.length > 0)).toBe(true);
		expect(you.details[0]).toMatch(/pass/i);
		expect(seatFor(match, "rival").details).toEqual([]);
	});

	it("a zone prompt for a monster never says 'a Main Monster Zone or a Spell & Trap Zone': a monster that changes control is placed in a Main Monster Zone, an unknown kind is only 'zone N'", () => {
		const match = playMove(passTo(openMatch(SETUP, CARD_DEFS), "main1"), "you", "summon sky-striker-ace-raye");
		const raye = match.duel.piles.you.monster[0]!;
		const code = match.duel.cards[raye]!.code;
		const take = askZone(match.duel, "rival", [0, 1], (board, zone) => moveCards(board, [raye], { zone: "monster", face: "up", controller: "rival", slot: zone }));
		const taking = seatFor({ ...match, duel: take }, "rival");
		expect(taking.moves).toEqual(["place 0", "place 1"]);
		expect(taking.details).toEqual([`Main Monster Zone 0: control of ${code} changes to you`, `Main Monster Zone 1: control of ${code} changes to you`]);
		const unknown = seatFor({ ...match, duel: askZone(match.duel, "rival", [0, 1], (board) => board) }, "rival");
		for (const detail of unknown.details) expect(detail).not.toMatch(/Spell & Trap/);
		expect(unknown.details).toEqual(["zone 0", "zone 1"]);
	});

	it("an effect activation gives the effect's number, its kind, where it is used from and what it does (the categories: CardDef carries no printed text)", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		const seat = seatFor(match, "you");
		const raye = seat.details[seat.moves.indexOf("activate sky-striker-ace-raye #1")]!;
		expect(raye).toContain("effect 1 of 2");
		expect(raye).toContain("Quick Effect");
		expect(raye).toContain("from the field");
		expect(raye).toContain("special-summon");
		const vision = seat.details[seat.moves.indexOf("activate radiant-typhoon-vision #2")]!;
		expect(vision).toContain("effect 2 of");
		expect(vision).toContain("Quick-Play Spell");
	});

	it("a choice made while an effect resolves says which effect asks, and where each candidate is; a zone says its kind and what goes there", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass"]) match = playMove(match, "you", step);
		const choose = seatFor(match, "you");
		expect(choose.moves[0]).toMatch(/^choose /);
		for (const detail of choose.details) {
			expect(detail).toContain("sky-striker-ace-raye");
			expect(detail).toContain("chain link 1");
			expect(detail).toContain("your Extra Deck");
		}
		expect(new Set(choose.details).size).toBe(choose.details.length);
		match = playMove(match, "you", "choose sky-striker-ace-kagari");
		const zones = seatFor(match, "you");
		expect(zones.moves).toEqual(["place 5", "place 6"]);
		expect(zones.details[0]).toMatch(/Extra Monster Zone 5.*sky-striker-ace-kagari/);
		expect(zones.details[1]).toMatch(/Extra Monster Zone 6.*sky-striker-ace-kagari/);
	});

	it("a Tribute Summon says it needs Tributes and how many; its Tribute choices and its zones say what they are for", () => {
		let match = fodder(passTo(openMatch(BLUE_EYES, CARD_DEFS), "main1"), [0, 1, 2]);
		const seat = seatFor(match, "you");
		const at = seat.moves.indexOf("summon blue-eyes-white-dragon");
		expect(seat.details[at]).toContain("Tribute Summon");
		expect(seat.details[at]).toContain("2 Tributes");
		match = playMove(match, "you", "summon blue-eyes-white-dragon");
		const tribute = seatFor(match, "you");
		expect(tribute.moves[0]).toMatch(/^choose /);
		expect(tribute.details[0]).toContain("Tribute");
		expect(tribute.details[0]).toContain("blue-eyes-white-dragon");
		expect(tribute.details[0]).toContain("Main Monster Zone");
		match = playMove(match, "you", tribute.moves[0]!);
		match = playMove(match, "you", seatFor(match, "you").moves[0]!);
		const zone = seatFor(match, "you");
		expect(zone.moves[0]).toMatch(/^place /);
		expect(zone.details[0]).toMatch(/Main Monster Zone \d.*Tribute Summon.*blue-eyes-white-dragon/);
	});

	it("a card Set says what is Set and where; a Spell with one effect still gives it its number", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		const seat = seatFor(match, "rival");
		expect(seat.details[seat.moves.indexOf("set raigeki")]).toMatch(/Set raigeki face-down in a Spell & Trap Zone/);
		match = playMove(match, "rival", "set raigeki");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		const you = seatFor(match, "you");
		const typhoon = you.details[you.moves.findIndex((name) => name.startsWith("activate mystical-space-typhoon"))]!;
		expect(typhoon).toContain("effect 1 of 1");
		expect(typhoon).toContain("Quick-Play Spell");
		expect(typhoon).toMatch(/targets a card \(the opponent's Spell & Trap Zone \d\)/);
	});

	it("an apply move says whose delayed effect it applies and when it was due", () => {
		const opened = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		const source = opened.duel.cards[opened.duel.piles.you.hand[0]!]!;
		const duel = delay(opened.duel, { card: source, player: "you", effect: 0 }, { due: { phase: "main1", turn: 1 }, mandatory: true, apply: (board) => board });
		const seat = seatFor({ ...opened, duel }, "you");
		const at = seat.moves.findIndex((name) => name.startsWith("apply"));
		expect(at).toBeGreaterThanOrEqual(0);
		expect(seat.details[at]).toContain(source.code);
		expect(seat.details[at]).toContain("delayed effect");
		expect(seat.details[at]).toContain("mandatory");
	});

	it("labels and their order are exactly what they were: the same names in the same order as the legal actions", () => {
		const match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		const seat = seatFor(match, "you");
		expect(seat.moves).toHaveLength(legalActions(match.duel).length);
		expect(seat.moves.slice(0, 4)).toEqual(["pass", "summon sky-striker-ace-raye", "set sky-striker-ace-raye", "set sky-striker-mecha-widow-anchor"]);
	});
});

describe("the seat log tells what happened, from what the seat may see", () => {
	const actor = (match: Match) => (seatFor(match, "you").toAct ? ("you" as const) : ("rival" as const));
	const RAYES = { seed: 3, you: { deck: Array<string>(14).fill("sky-striker-ace-raye") }, rival: { deck: Array<string>(14).fill("raigeki") } };
	/** Turn 3, the Battle Step: the Raye Summoned on turn 1 can attack the empty field of the rival directly. */
	const attackReady = (): Match => {
		let match = passTo(openMatch(RAYES, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		for (let guard = 0; guard < 80 && !seatFor(match, actor(match)).moves.some((name) => name.startsWith("attack")); guard++) match = playMove(match, actor(match), "pass");
		return match;
	};

	it("a battle adds one summary line and LP lines for the damage, and its automatic passes collapse to one line per seat", () => {
		const match = playMove(attackReady(), "you", "attack sky-striker-ace-raye directly");
		const last = (side: Side) => seatFor(match, side).log.at(-1)!;
		expect(last("you")).toMatchObject({ name: "attack sky-striker-ace-raye directly", side: "you" });
		expect(last("you").notes).toContain("LP: the opponent 8000 -> 6500 (-1500, battle damage)");
		expect(last("you").notes).toContain("battle: sky-striker-ace-raye attacked directly; the opponent took 1500 damage");
		expect(last("rival").notes).toContain("LP: you 8000 -> 6500 (-1500, battle damage)");
		expect(last("rival").notes).toContain("battle: sky-striker-ace-raye attacked directly; you took 1500 damage");
		expect(last("you").auto).toEqual([
			{ side: "you", name: "pass (no legal response) x5" },
			{ side: "rival", name: "pass (no legal response) x5" },
		]);
	});

	it("a drawn card is named to the player who drew it and only counted for the opponent", () => {
		let match = openMatch(RAYES, CARD_DEFS);
		for (let guard = 0; guard < 30 && !match.log.some((entry) => entry.notes !== undefined); guard++) match = playMove(match, actor(match), "pass");
		const at = match.log.findIndex((entry) => entry.notes !== undefined);
		expect(at).toBeGreaterThanOrEqual(0);
		// Turn 2 is the rival's: its Draw Phase draws a card of its Deck of Raigeki.
		// The entry is the pass that ends turn 1; the draw belongs to turn 2's Draw Phase, and the note says so.
		expect(seatFor(match, "rival").log[at]!.notes).toContain("turn 2 Draw Phase: you draw raigeki");
		expect(seatFor(match, "you").log[at]!.notes).toContain("turn 2 Draw Phase: the opponent draws 1 card");
		expect(JSON.stringify(seatFor(match, "you").log[at])).not.toContain("raigeki");
	});

	it("a card Special Summoned by an effect is named with its zone, though its choice stays '?' for the opponent; the Tribute cost and the chain steps are logged", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass", "choose sky-striker-ace-kagari", "place 5"]) match = playMove(match, "you", step);
		const rival = seatFor(match, "rival").log;
		const placed = rival.at(-1)!;
		expect(rival.find((entry) => entry.name === "choose ?")).toBeDefined();
		expect(placed.notes).toContain("sky-striker-ace-kagari is Special Summoned to Extra Monster Zone 5 (shared) from the opponent's Extra Deck");
		// The link began to resolve with the pass that let the chain resolve; it then asked for the monster, which came after.
		expect(rival[rival.findIndex((entry) => entry.name === "choose ?") - 1]).toMatchObject({ name: "pass", notes: ["chain link 1 resolves: sky-striker-ace-raye"] });
		expect(placed.notes).not.toContain("chain link 1 resolves: sky-striker-ace-raye");
		const activation = rival.find((entry) => entry.name === "activate sky-striker-ace-raye #1")!;
		expect(activation.notes).toContain("sky-striker-ace-raye is Tributed (sent to the Graveyard) from the opponent's Main Monster Zone 0");
		expect(activation.notes).toContain("chain link 1: sky-striker-ace-raye activated by the opponent");
	});

	it("a face-down card an effect destroys is named once it lies in the Graveyard; the move that Set it did not name it", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		const setLog = seatFor(match, "you").log.find((entry) => entry.name === "set ?")!;
		expect(JSON.stringify(setLog)).not.toContain("raigeki");
		match = playMove(match, "you", seatFor(match, "you").moves.find((name) => name.startsWith("activate mystical-space-typhoon"))!);
		match = passWhileChain(match);
		const notes = seatFor(match, "you").log.flatMap((entry) => entry.notes ?? []);
		expect(notes).toContain("chain link 1 resolves: mystical-space-typhoon");
		expect(notes).toContain("raigeki is destroyed and sent to the Graveyard from the opponent's Spell & Trap Zone 0");
		expect(seatFor(match, "rival").log.flatMap((entry) => entry.notes ?? [])).toContain("raigeki is destroyed and sent to the Graveyard from your Spell & Trap Zone 0");
	});

	describe("one change of the Duel, as a seat reads it (describeChange)", () => {
		const base = () => passTo(openMatch(SETUP, CARD_DEFS), "main1").duel;

		it("LP paid, lost and gained, from either side", () => {
			const duel = base();
			expect(describeChange(duel, { ...duel, lp: { you: 7000, rival: 9000 } }, "you")).toEqual(["LP: you 8000 -> 7000 (-1000)", "LP: the opponent 8000 -> 9000 (+1000)"]);
			expect(describeChange(duel, { ...duel, lp: { you: 7000, rival: 9000 } }, "rival")).toEqual(["LP: the opponent 8000 -> 7000 (-1000)", "LP: you 8000 -> 9000 (+1000)"]);
		});

		it("a negated activation is said, naming the card that was activated", () => {
			const duel = base();
			const card = duel.cards[duel.piles.you.hand[0]!]!;
			const before = { ...duel, activations: [{ player: "you" as const, card, effect: 0 }] };
			const after = { ...before, activations: [{ ...before.activations[0]!, negated: true as const }] };
			expect(describeChange(before, after, "rival")).toEqual([`${card.code}'s activation is negated`]);
		});

		it("a card sent from the opponent's hand to the Graveyard is named (the Graveyard is open); a card it draws is not", () => {
			const duel = base();
			const first = duel.piles.rival.hand[0]!;
			const code = duel.cards[first]!.code;
			expect(describeChange(duel, moveCards(duel, [first], { zone: "graveyard" }), "you")).toEqual([`${code} is sent to the Graveyard from the opponent's hand`]);
			const top = duel.piles.rival.deck[0]!;
			const drawn = drawCards(duel, "rival", 1);
			expect(describeChange(duel, drawn, "you")).toEqual(["the opponent draws 1 card"]);
			expect(describeChange(duel, drawn, "rival")).toEqual([`you draw ${duel.cards[top]!.code}`]);
		});

		it("a card that is Special Summoned and destroyed in the same step is logged for both hops (not only as destroyed from the Extra Deck)", () => {
			const duel = base();
			const id = duel.piles.you.extra[0]!;
			const code = duel.cards[id]!.code;
			const summoned = moveCards(duel, [id], { zone: "monster", face: "up", position: "attack", slot: 0 });
			const destroyed = moveCards(summoned, [id], { zone: "graveyard", reason: "destroyed", destruction: { cause: "effect", player: "you", effect: 0, source: summoned.cards[id]! } });
			const notes = describeChange(duel, destroyed, "you");
			expect(notes.some((line) => line.includes("Special Summoned") && line.includes(code))).toBe(true);
			expect(notes.some((line) => line.includes("destroyed") && line.includes(code))).toBe(true);
			expect(notes.join("\n")).not.toMatch(new RegExp(`${code} is destroyed and sent to the Graveyard from your Extra Deck`));
		});
	});
});

/** The same Duel with cards `a` and `b` trading ids: each keeps its code and its place. */
function swapIds(duel: Duel, a: number, b: number): Duel {
	const swap = (id: number) => (id === a ? b : id === b ? a : id);
	const piles = Object.fromEntries(Object.entries(duel.piles).map(([side, zones]) => [side, Object.fromEntries(Object.entries(zones).map(([zone, ids]) => [zone, ids.map(swap)]))])) as unknown as Duel["piles"];
	return { ...duel, cards: { ...duel.cards, [b]: { ...duel.cards[a]!, id: b }, [a]: { ...duel.cards[b]!, id: a } }, piles };
}

/** Passes from whichever seat is to act while a chain is open. */
function passWhileChain(match: Match): Match {
	for (let guard = 0; guard < 20 && match.duel.chain.length > 0; guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
	expect(match.duel.chain).toEqual([]);
	return match;
}

/** Passes from whichever seat is to act until the phase is reached. */
function passTo(match: Match, phase: string): Match {
	for (let guard = 0; guard < 50 && match.duel.turn.phase !== phase; guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
	expect(match.duel.turn.phase).toBe(phase);
	return match;
}

describe("a random pick has its own log line, naming no card (duel 006 #6)", () => {
	it("Bingo Machine: the opponent's random pick of 1 of the 3 revealed cards is said before the card is added", () => {
		const defs = { ...CARD_DEFS, ...blueEyesFixtures };
		const four = position({ defs, you: { hand: ["bingo-machine-go"], deck: ["blue-eyes-white-dragon", "fixture-blue-eyes-normal", "fixture-roar", "fixture-ultimate-trap", "fixture-other-dragon"] } });
		const two = play(four, "activate bingo-machine-go", "choose blue-eyes-white-dragon", "choose fixture-roar");
		const done = play(two, "choose fixture-ultimate-trap");
		for (const seat of ["you", "rival"] as const) {
			const lines = describeChange(two, done, seat);
			const at = lines.indexOf("1 card is picked at random from 3");
			expect(at).toBeGreaterThanOrEqual(0);
			expect(lines.findIndex((line) => line.includes("add") && line.includes("from the Deck to the hand"))).toBeGreaterThan(at);
		}
	});
});

describe("the battle line of an attack whose target left", () => {
	it("a replay says the target left, there was no damage calculation and the attack may be redirected (duel 006 #9)", () => {
		const start = position({ defs: battleCards(), phase: "battle", you: { monsters: ["big", "small"] }, rival: { monsters: ["even"], set: ["vanish"] } });
		const declared = play(start, "attack big > even");
		const replayed = play(declared, "activate vanish");
		expect(replayed.battle).toBeNull();
		const battleLines = (seat: Side) => describeChange(declared, replayed, seat).filter((line) => line.startsWith("battle: "));
		expect(battleLines("you")).toEqual(["battle: big attacked even; the attack target left the field: no damage calculation, and the attack may be redirected (a replay)"]);
		expect(battleLines("rival")).toEqual(["battle: big attacked even; the attack target left the field: no damage calculation, and the attack may be redirected (a replay)"]);
	});
	it("a replay with the target still there (a new monster came to the opponent's side) does not say the target left", () => {
		const start = position({ defs: battleCards(), phase: "battle", you: { monsters: ["big"] }, rival: { monsters: ["small"], set: ["reinforce"], hand: ["even"] } });
		const declared = play(start, "attack big > small");
		const replayed = play(declared, "activate reinforce");
		expect(replayed.battle).toBeNull();
		expect(replayed.replay).not.toBeNull();
		for (const seat of ["you", "rival"] as const) {
			expect(describeChange(declared, replayed, seat).filter((line) => line.startsWith("battle: "))).toEqual(["battle: big attacked small; no damage calculation; the attack may be redirected (a replay)"]);
		}
	});
});

describe("move details say what a cost does and whether a choice is optional", () => {
	const base = () => openMatch({ seed: 1, you: { deck: Array<string>(5).fill("raigeki") }, rival: { deck: Array<string>(5).fill("raigeki") } }, CARD_DEFS);
	const spell = (code: string, cost: NonNullable<CardDef["effects"]>[number]["cost"]): CardDef => ({ code, kind: "spell", effects: [{ type: "activation", cost, operation: (duel) => duel }] });
	const defs: Record<string, CardDef> = {
		...CARD_DEFS,
		"fixture-discard-spell": spell("fixture-discard-spell", { pick: (duel, { player }) => duel.piles[player].hand.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard", reason: "discarded" }) }),
		"fixture-send-spell": spell("fixture-send-spell", { pick: (duel, { player }) => duel.piles[player].hand.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }) }),
		"fixture-banish-spell": spell("fixture-banish-spell", { pick: (duel, { player }) => duel.piles[player].graveyard.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "banished" }) }),
		"fixture-reveal-spell": spell("fixture-reveal-spell", { pick: (duel, { player }) => duel.piles[player].hand.map((id) => [id]), pay: (duel, { player }, picked) => revealCards(duel, player, picked) }),
		"fixture-tribute-spell": spell("fixture-tribute-spell", (duel, { player }) => (duel.piles[player].monster.length > 0 ? moveCard(duel, duel.piles[player].monster[0]!, { zone: "graveyard", reason: "tributed" }) : null)),
		"fixture-plain": { code: "fixture-plain", kind: "monster", facts: { level: 4, atk: 1000, def: 1000 } },
		// A cost with a free way (Drillbeam: "you can activate this effect without revealing a card"): paying it changes nothing.
		"fixture-free-spell": spell("fixture-free-spell", { pick: () => [[]], pay: (duel, { player }, picked) => revealCards(duel, player, picked) }),
	};
	const details = (code: string, you: Parameters<typeof position>[0]["you"]): string[] => {
		const duel = position({ defs, you });
		const seat = seatFor({ ...base(), duel }, "you");
		return seat.moves.flatMap((name, at) => (name.startsWith(`activate ${code}`) ? [seat.details[at]!] : []));
	};

	it("a cost paid the free way says nothing is paid, and an effect with no category says what that means (duel 006 #8)", () => {
		expect(details("fixture-free-spell", { hand: ["fixture-free-spell"] })).toEqual([
			"effect 1 of 1: Normal Spell from the hand; no effect category (a card that answers one, as Ash Blossom answers a search, cannot answer this effect); cost: nothing is paid this way (no card moved or revealed, no LP paid)",
		]);
	});
	it("a discard cost says the card is discarded", () => {
		expect(details("fixture-discard-spell", { hand: ["fixture-discard-spell", "fixture-plain"] }).join("|")).toContain("cost: fixture-plain is discarded");
	});
	it("a cost that sends to the Graveyard says it is sent, not discarded", () => {
		const text = details("fixture-send-spell", { hand: ["fixture-send-spell", "fixture-plain"] }).join("|");
		expect(text).toContain("cost: fixture-plain is sent to the Graveyard");
		expect(text).not.toContain("discarded");
	});
	it("a banishing cost, a revealing cost and a Tribute cost say so", () => {
		expect(details("fixture-banish-spell", { hand: ["fixture-banish-spell"], graveyard: ["fixture-plain"] }).join("|")).toContain("cost: fixture-plain is banished");
		expect(details("fixture-reveal-spell", { hand: ["fixture-reveal-spell", "fixture-plain"] }).join("|")).toContain("cost: fixture-plain is revealed (it stays in the hand)");
		expect(details("fixture-tribute-spell", { hand: ["fixture-tribute-spell"], monsters: ["fixture-plain"] }).join("|")).toContain("cost: fixture-plain is Tributed");
	});
	it("a real card: Raye's Quick Effect Tributes itself", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		const seat = seatFor(match, "you");
		const at = seat.moves.indexOf("activate sky-striker-ace-raye #1");
		expect(seat.details[at]).toContain("cost: sky-striker-ace-raye is Tributed");
	});
	it("a choice that may be declined says it is optional; one that must be made does not", () => {
		// Shark Cannon with 3 Spells in the Graveyard: summon the monster instead, or banish it (a "you can" choice: choosing accepts, pass declines).
		const start = ssBoard({ hand: ["sky-striker-mecha-shark-cannon"], graveyard: threeSpells, extraZone: ["fixture-filler"] }, { graveyard: ["fixture-filler"] });
		const asked = ssResolve(play(start, "activate sky-striker-mecha-shark-cannon > fixture-filler"));
		const seat = seatFor({ ...base(), duel: asked }, "you");
		expect(seat.moves).toContain("pass");
		const at = seat.moves.findIndex((name) => name.startsWith("choose "));
		expect(seat.details[at]).toContain("optional");
		// A question with no pass offered is not described as optional.
		const mandatory = seatFor({ ...base(), duel: play(start, "activate sky-striker-mecha-shark-cannon > fixture-filler", "pass") }, "you");
		for (const [i, name] of mandatory.moves.entries()) if (name.startsWith("choose ") && !mandatory.moves.includes("pass")) expect(mandatory.details[i]).not.toContain("optional");
	});
	it("two copies of one card on the field: each effect line says where its card is (duel 006 #7); the move labels stay", () => {
		const start = ssBoard({ monsters: ["sky-striker-ace-raye", "sky-striker-ace-raye"], extra: ["sky-striker-ace-hayate"] });
		const seat = seatFor({ ...base(), duel: start }, "you");
		const lines = seat.moves.flatMap((name, at) => (name.startsWith("activate sky-striker-ace-raye") ? [{ name, detail: seat.details[at]! }] : []));
		expect(lines.map((line) => line.name)).toEqual(["activate sky-striker-ace-raye #1", "activate sky-striker-ace-raye #1"]);
		expect(lines.map((line) => line.detail.split(";")[0])).toEqual(["effect 1 of 2: Quick Effect from the field (your Main Monster Zone 0)", "effect 1 of 2: Quick Effect from the field (your Main Monster Zone 1)"]);
	});
	it("a \"you can\" question reads as accept or decline, not as choosing the card (duel 003 #4); the move labels stay", () => {
		const start = ssBoard({ hand: ["sky-striker-mecha-shark-cannon"], graveyard: threeSpells, extraZone: ["fixture-filler"] }, { graveyard: ["fixture-filler"] });
		const asked = ssResolve(play(start, "activate sky-striker-mecha-shark-cannon > fixture-filler"));
		const seat = seatFor({ ...base(), duel: asked }, "you");
		expect(seat.moves).toEqual(["pass", "choose sky-striker-mecha-shark-cannon"]);
		expect(seat.details).toEqual([
			"pass: decline the optional part (\"you can\") of the effect of sky-striker-mecha-shark-cannon (chain link 1) that is resolving",
			"accept the optional part (\"you can\") of the effect of sky-striker-mecha-shark-cannon (chain link 1) that is resolving; pass declines it",
		]);
	});
});
