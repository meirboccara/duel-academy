import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { addModifier, CARD_DEFS, legalActions, type Match, type MatchRecord, moveCards, openMatch, playMove, raiseDispute, READINESS_DECKS, replayMatch, seatFor, settleDispute } from "../src";
import { play, position } from "./rules/fixtures";
import { playIndex, renderSeat, runCli, seatBoard } from "../src/agent-play";

const flat = (id: number) => {
	const deck = READINESS_DECKS.find((manifest) => manifest.id === id)!;
	const codes = (entries: typeof deck.main) => entries.flatMap((entry) => Array<string>(entry.count).fill(entry.code!));
	return { deck: codes(deck.main), extra: codes(deck.extra) };
};
/** Sky Striker 745443 ("you", first) against Blue-Eyes 746021. Seed 1: Blue-Eyes holds Infinite Impermanence. */
const SETUP = { seed: 1, you: flat(745443), rival: flat(746021) };

const passTo = (match: Match, phase: string): Match => {
	for (let guard = 0; guard < 50 && match.duel.turn.phase !== phase; guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
	return match;
};

describe("the seat board: what one seat may be shown, as plain data", () => {
	it("shows the own hand and the moves by index, and nothing of the opponent's hidden cards", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		const board = seatBoard(match, "you");
		expect(board.toAct).toBe(true);
		expect(board.hand).toContain("sky-striker-ace-raye");
		expect(board.opponent.hand).toEqual(Array(5).fill("?"));
		expect(board.moves).toEqual([
			{ index: 0, name: "pass", detail: expect.stringContaining("pass") },
			{ index: 1, name: "activate radiant-typhoon-vision #1", detail: expect.stringContaining("effect 1 of 4: Quick-Play Spell from the hand") },
			{ index: 2, name: "activate radiant-typhoon-vision #2", detail: expect.stringContaining("effect 2 of 4: Quick-Play Spell from the hand") },
		]);
		const text = JSON.stringify(board) + renderSeat(board);
		// Blue-Eyes cards that the Sky Striker deck does not contain: seeing one would be seeing the opponent's hand, deck or Extra Deck.
		for (const hidden of ["infinite-impermanence", "blue-eyes-white-dragon", "sage-with-eyes-of-blue", "unknown", "seed", "rng"]) expect(text).not.toContain(hidden);
		// The rival's seat is told nothing it cannot do.
		expect(seatBoard(match, "rival")).toMatchObject({ toAct: false, moves: [], hand: expect.arrayContaining(["infinite-impermanence"]) });
	});

	it("uses the viewer's perspective for turn, log, disputes and every winner", () => {
		let match = openMatch(SETUP, CARD_DEFS);
		expect(seatBoard(match, "rival").turn.player).toBe("opponent");
		expect(seatBoard(match, "you").turn.player).toBe("you");
		for (let guard = 0; guard < 10 && !seatFor(match, "rival").toAct; guard++) match = playMove(match, "you", "pass");
		match = playMove(match, "rival", "pass");
		match = { ...match, disputes: [
			{ at: match.log.length, turn: 1, phase: "draw", by: "rival", claim: "Check", ruling: null },
			{ at: match.log.length, turn: 1, phase: "draw", by: "you", claim: "Check too", ruling: null },
		] };
		const absolute = match.log.map((entry) => entry.side);
		expect(seatBoard(match, "rival").log.map((entry) => entry.side)).toEqual(absolute.map((who) => who === "rival" ? "you" : "opponent"));
		expect(seatBoard(match, "you").log.map((entry) => entry.side)).toEqual(absolute.map((who) => who === "you" ? "you" : "opponent"));
		expect(seatBoard(match, "rival").log.at(-1)!.side).toBe("you");
		expect(seatBoard(match, "rival").disputes.map((entry) => entry.by)).toEqual(["you", "opponent"]);
		expect(seatBoard(match, "you").disputes.map((entry) => entry.by)).toEqual(["opponent", "you"]);
		for (const winner of ["you", "rival", "draw", null] as const) {
			const ended = { ...match, duel: { ...match.duel, winner } };
			expect(seatBoard(ended, "rival").winner).toBe(winner === "you" ? "opponent" : winner === "rival" ? "you" : winner);
			expect(seatBoard(ended, "you").winner).toBe(winner === "rival" ? "opponent" : winner);
		}
	});

	it("a dispute is whole only for its raiser; the other seat's board and text carry a notice and no claim, no ruling, no hidden card name", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = raiseDispute(match, "rival", "My hand holds infinite-impermanence: can it answer Raye?");
		const open = seatBoard(match, "you").disputes;
		expect(open).toEqual([{ at: match.disputes[0]!.at, turn: 1, phase: "main1", by: "opponent", notice: "the opponent raised a dispute (open)" }]);
		match = settleDispute(match, 0, { decision: "infinite-impermanence: yes", via: "konami", sources: ["Q&A about infinite-impermanence"] });
		const mine = seatBoard(match, "you");
		const text = JSON.stringify(mine) + renderSeat(mine);
		expect(text).not.toContain("infinite-impermanence");
		expect(text).not.toContain("My hand holds");
		expect(mine.disputes).toEqual([{ at: match.disputes[0]!.at, turn: 1, phase: "main1", by: "opponent", notice: "the opponent raised a dispute (settled)" }]);
		expect(renderSeat(mine)).toContain("Disputes:\n  the opponent raised a dispute (settled)");
		// The raiser reads its claim and the ruling in full.
		const theirs = seatBoard(match, "rival");
		expect(theirs.disputes).toEqual([{ ...match.disputes[0]!, by: "you" }]);
		expect(renderSeat(theirs)).toContain("you: My hand holds infinite-impermanence: can it answer Raye? => infinite-impermanence: yes");
	});

	it("a chain reads from each seat: you is the viewer, refs agree with the zone entries, hidden identity stays hidden", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		const name = seatFor(match, "you").moves.find((each) => each.startsWith("activate mystical-space-typhoon"))!;
		match = playMove(match, "you", name);
		const mine = seatBoard(match, "you");
		const theirs = seatBoard(match, "rival");
		expect(mine.chain).toHaveLength(1);
		expect(mine.chain[0]!.player).toBe("you");
		expect(mine.chain[0]!.ref).toMatch(/^you /);
		expect(mine.chain[0]!.targets).toHaveLength(1);
		expect(mine.chain[0]!.targets[0]).toMatch(/^opponent spell \d$/);
		expect(mine.opponent.spells.map((card) => card.ref)).toContain(mine.chain[0]!.targets[0]);
		expect(theirs.chain[0]).toMatchObject({ player: "opponent", ref: expect.stringMatching(/^opponent /), code: "mystical-space-typhoon" });
		expect(theirs.chain[0]!.targets[0]).toMatch(/^you spell \d$/);
		expect(theirs.spells.map((card) => card.ref)).toContain(theirs.chain[0]!.targets[0]);
		expect(JSON.stringify(mine)).not.toContain("raigeki");
		expect(JSON.stringify(match.duel.chain)).not.toBe("[]");
		const text = renderSeat(theirs);
		expect(text).toContain("Chain");
		expect(text).toContain(`opponent: mystical-space-typhoon [${theirs.chain[0]!.ref}]; targets: raigeki [${theirs.chain[0]!.targets[0]}]`);
		// A target the viewer cannot see is said as "a card", never named.
		expect(renderSeat(mine)).toContain(`targets: a card [${mine.chain[0]!.targets[0]}]`);
		expect(text.match(/^Chain \(last link last\):$/gm)).toHaveLength(1);
	});

	it("the passes made for a player are shown in the log from the viewer's side, in the board and in the text; a gone target reads gone", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		match = playMove(match, "you", seatFor(match, "you").moves.find((name) => name.startsWith("activate mystical-space-typhoon"))!);
		expect(seatBoard(match, "you").log.at(-1)).toMatchObject({ side: "you", auto: [{ side: "opponent", name: "pass (no legal response)" }] });
		expect(seatBoard(match, "rival").log.at(-1)).toMatchObject({ side: "opponent", auto: [{ side: "you", name: "pass (no legal response)" }] });
		expect(renderSeat(seatBoard(match, "you"))).toContain("    opponent: pass (no legal response)");
		expect(renderSeat(seatBoard(match, "rival"))).toContain("    you: pass (no legal response)");
		const target = match.duel.chain.at(-1)!.targets[0]!;
		const gone: Match = { ...match, duel: moveCards(match.duel, [target], { zone: "graveyard" }) };
		expect(seatBoard(gone, "you").chain.at(-1)!.targets).toEqual(["gone"]);
		expect(renderSeat(seatBoard(gone, "you"))).toContain("targets: raigeki [gone]");
	});

	it("a chain of three links (Lordly Lode, The Fallen & The Virtuous, Drillbeam) prints one Chain header and each link once, with its target named", () => {
		const duel = position({ defs: CARD_DEFS, options: { everyWindow: true }, turn: "rival", rival: { hand: ["primite-lordly-lode", "primite-drillbeam", "primite-dragon-ether-beryl"], deck: Array<string>(5).fill("primite-drillbeam") }, you: { set: ["the-fallen-and-the-virtuous"], extra: ["the-dragon-that-devours-the-dogma"] } });
		const chained = play(duel, "activate primite-lordly-lode", "activate the-fallen-and-the-virtuous ~ the-dragon-that-devours-the-dogma > primite-lordly-lode", "activate primite-drillbeam ~ primite-dragon-ether-beryl > the-fallen-and-the-virtuous");
		const match: Match = { ...openMatch({ seed: 1, you: { deck: Array<string>(5).fill("raigeki") }, rival: { deck: Array<string>(5).fill("raigeki") } }, CARD_DEFS), duel: chained };
		const text = renderSeat(seatBoard(match, "you"));
		expect(text.match(/^Chain \(last link last\):$/gm)).toHaveLength(1);
		expect(text.match(/^ {2}1\. /gm)).toHaveLength(1);
		expect(text).toContain("  3. opponent: primite-drillbeam [opponent spell 1]; targets: the-fallen-and-the-virtuous [you spell 0]");
		expect(text).toContain("  2. you: the-fallen-and-the-virtuous [you spell 0]; targets: a card [opponent spell 0]".replace("a card", "primite-lordly-lode"));
	});

	it("a face-up monster shows its stats read from the masked state; a card Set shows only to its owner", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		expect(seatBoard(match, "rival").opponent.monsters).toEqual([{ ref: expect.stringMatching(/^opponent monster \d$/), slot: expect.any(Number), code: "sky-striker-ace-raye", face: "up", position: "attack", atk: 1500, def: 1500, level: 4, attribute: "DARK", monsterType: "Warrior" }]);
		for (let guard = 0; guard < 8 && !seatFor(match, "you").moves.includes("set raigeki"); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		match = playMove(match, "you", "set raigeki");
		const rival = seatBoard(match, "rival");
		expect(rival.opponent.spells).toEqual([{ ref: expect.stringMatching(/^opponent spell \d$/), slot: expect.any(Number), code: "?", face: "down" }]);
		expect(JSON.stringify(rival)).not.toContain("raigeki");
		expect(seatBoard(match, "you").spells).toEqual([{ ref: expect.stringMatching(/^you spell \d$/), slot: expect.any(Number), code: "raigeki", face: "down" }]);
	});
});

describe("the board and its text: details, Link Monsters, notes, collapsed passes, effects in force", () => {
	const RAYES = { seed: 3, you: { deck: Array<string>(14).fill("sky-striker-ace-raye") }, rival: { deck: Array<string>(14).fill("raigeki") } };
	const actor = (match: Match) => (seatFor(match, "you").toAct ? ("you" as const) : ("rival" as const));

	it("a Link Monster is shown with its Link Rating and no DEF, in the board and in the text", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		for (const step of ["summon sky-striker-ace-raye", "activate sky-striker-ace-raye #1", "pass", "choose sky-striker-ace-kagari", "place 5"]) match = playMove(match, "you", step);
		const kagari = seatBoard(match, "rival").opponent.monsters.find((card) => card.code === "sky-striker-ace-kagari")!;
		expect(kagari).toMatchObject({ link: 1, attribute: "FIRE", monsterType: "Machine", atk: 1500 });
		expect(kagari).not.toHaveProperty("def");
		const text = renderSeat(seatBoard(match, "rival"));
		expect(text).toContain("sky-striker-ace-kagari LINK-1 FIRE Machine attack 1500 [opponent monster 5]");
		expect(text).not.toContain("1500/0");
	});

	it("a Level monster reads Level, Attribute, Type and ATK/DEF in the text", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		expect(renderSeat(seatBoard(match, "you"))).toContain("sky-striker-ace-raye Level 4 DARK Warrior attack 1500/1500 [you monster 0]");
	});

	it("each numbered move reads 'label -- detail' in the text", () => {
		const match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		const text = renderSeat(seatBoard(match, "you"));
		expect(text).toContain("[1] summon sky-striker-ace-raye -- Normal Summon sky-striker-ace-raye face-up in Attack Position");
		expect(text).toContain("[0] pass -- pass priority");
	});

	it("a battle shows its notes under the move, and its automatic passes as one line per seat", () => {
		let match = passTo(openMatch(RAYES, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		for (let guard = 0; guard < 80 && !seatFor(match, actor(match)).moves.some((name) => name.startsWith("attack")); guard++) match = playMove(match, actor(match), "pass");
		match = playMove(match, "you", "attack sky-striker-ace-raye directly");
		const board = seatBoard(match, "rival");
		expect(board.log.at(-1)).toMatchObject({ side: "opponent", notes: expect.arrayContaining(["battle: sky-striker-ace-raye attacked directly; you took 1500 damage"]), auto: [{ side: "opponent", name: "pass (no legal response) x5" }, { side: "you", name: "pass (no legal response) x5" }] });
		const text = renderSeat(board);
		expect(text).toContain("    > LP: you 8000 -> 6500 (-1500, battle damage)");
		expect(text).toContain("    opponent: pass (no legal response) x5");
		const attack = text.slice(text.lastIndexOf("attack sky-striker-ace-raye directly"), text.indexOf("Moves ("));
		expect((attack.match(/pass \(no legal response\)/g) ?? []).length).toBe(2);
	});

	it("effects in force and the modifiers on a monster are in the board and in the text", () => {
		let match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		match = playMove(match, "you", "summon sky-striker-ace-raye");
		const raye = match.duel.piles.you.monster[0]!;
		const source = match.duel.cards[match.duel.piles.you.hand[0]!]!;
		const base = { until: 1, by: { card: source, player: "you" as const, effect: 0 } };
		let duel = addModifier(match.duel, { ...base, affects: { card: raye, moves: match.duel.cards[raye]!.moves }, layer: { kind: "add", stat: "atk", by: 500 } });
		duel = addModifier(duel, { ...base, affects: () => false, layer: { kind: "lock", what: "draw", who: "rival" } });
		match = { ...match, duel };
		const board = seatBoard(match, "you");
		expect(board.lasting).toEqual([`ATK +500 on sky-striker-ace-raye (${source.code}), until the end of turn 1`, `the opponent cannot draw cards by card effects (${source.code}), until the end of turn 1`]);
		expect(board.monsters[0]).toMatchObject({ atk: 2000, modifiers: [`ATK +500 (${source.code}), until the end of turn 1`] });
		const text = renderSeat(board);
		expect(text).toContain("Effects in force:");
		expect(text).toContain(`  the opponent cannot draw cards by card effects (${source.code}), until the end of turn 1`);
		expect(text).toContain(`sky-striker-ace-raye Level 4 DARK Warrior attack 2000/1500 [you monster 0] {ATK +500 (${source.code}), until the end of turn 1}`);
		expect(renderSeat(seatBoard(match, "rival"))).not.toContain(source.code);
	});
});

describe("the window line: what pass does here, from the priority state alone", () => {
	const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
	const priority = (match: Match, next: Match["duel"]["priority"]): Match => ({ ...match, duel: { ...match.duel, priority: next } });

	it("the turn player in an open state with an empty chain: passing asks to end the phase", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		expect(match.duel.priority).toMatchObject({ open: true, passed: [] });
		const board = seatBoard(match, "you");
		expect(board.window).toBe("open: passing asks to end Draw Phase; the opponent may still respond");
		expect(renderSeat(board)).toContain("Window: open: passing asks to end Draw Phase; the opponent may still respond");
		expect(seatBoard(match, "rival").window).toBe("you wait: the opponent decides");
	});

	it("the other player after the turn player passed: your pass moves on to the next phase", () => {
		// The opponent is only offered priority when it has a real response, so the state is the real one with the turn player's pass made.
		const match = priority(openMatch(SETUP, CARD_DEFS), { holder: "rival", passed: ["you"], open: true });
		const board = seatBoard(match, "rival");
		expect(board.window).toBe("the turn player wants to end Draw Phase: your pass moves on to Standby Phase");
		expect(renderSeat(board)).toContain("Window: the turn player wants to end Draw Phase");
	});

	it("on the first player's first turn, the window line says Main Phase 1 moves on to the End Phase (no Battle Phase on turn 1)", () => {
		const match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		expect(match.duel.turn.number).toBe(1);
		const answering = priority(match, { holder: "rival", passed: ["you"], open: true });
		expect(seatBoard(answering, "rival").window).toBe("the turn player wants to end Main Phase 1: your pass moves on to End Phase");
	});

	it("a chain: passing lets it resolve; an empty chain in a state that is not open: passing keeps the phase", () => {
		let match = passTo(openMatch(setup, CARD_DEFS), "main1");
		match = playMove(match, "rival", "set raigeki");
		// After a Set the game state is not open for the turn player (box B); the Set was answered by passes made for both seats, so it is shown as it stands before them.
		expect(seatBoard(priority(match, { holder: "rival", passed: [], open: false }), "rival").window).toBe("response window: passing keeps Main Phase 1 (the game state reopens)");
		for (let guard = 0; guard < 20 && !seatFor(match, "you").moves.some((name) => name.startsWith("activate mystical-space-typhoon")); guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		match = playMove(match, "you", seatFor(match, "you").moves.find((name) => name.startsWith("activate mystical-space-typhoon"))!);
		expect(match.duel.chain).toHaveLength(1);
		const mine = seatBoard(match, "you");
		expect(mine.toAct).toBe(true);
		expect(mine.window).toBe("response window: passing lets the chain resolve");
		expect(renderSeat(mine)).toContain("Window: response window: passing lets the chain resolve");
	});

	it("the Battle Phase names its step: the turn player ends it, the other player moves to the next step", () => {
		// The first Battle Phase is the second player's, on turn 2 (RB10, record `no-battle-first-turn`); every window is shown so the
		// Duel stops in its Start Step even when the turn player has nothing to do there.
		const match = passTo(openMatch({ ...SETUP, options: { everyWindow: true } }, CARD_DEFS), "battle");
		expect(match.duel.turn.number).toBe(2);
		expect(match.duel.battleStep).toBe("start");
		const mine = seatFor(match, "you").toAct ? "you" : "rival";
		const theirs = mine === "you" ? "rival" : "you";
		expect(match.duel.turn.player).toBe(mine);
		expect(seatBoard(match, mine).window).toBe("open: passing asks to end Battle Phase Start Step; the opponent may still respond");
		const answering = priority(match, { holder: theirs, passed: [mine], open: true });
		expect(seatBoard(answering, theirs).window).toBe("the turn player wants to end Battle Phase Start Step: your pass moves on to the Battle Step");
		const inBattle = { ...answering, duel: { ...answering.duel, battleStep: "battle" as const } };
		expect(seatBoard(inBattle, theirs).window).toBe("the turn player wants to end Battle Phase Battle Step: your pass moves on to the End Step");
		const inEnd = { ...answering, duel: { ...answering.duel, battleStep: "end" as const } };
		expect(seatBoard(inEnd, theirs).window).toBe("the turn player wants to end Battle Phase End Step: your pass moves on to Main Phase 2");
	});

	it("a pending choice has no pass meaning", () => {
		// Hand over 6 at the End Phase: the turn player chooses the cards to discard.
		let match = openMatch({ seed: 3, you: { deck: Array<string>(20).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(20).fill("raigeki") } }, CARD_DEFS);
		for (let guard = 0; guard < 80 && !match.duel.asking; guard++) match = playMove(match, seatFor(match, "you").toAct ? "you" : "rival", "pass");
		expect(match.duel.asking).not.toBeNull();
		const chooser = match.duel.asking!.player;
		expect(seatBoard(match, chooser).window).toBe("a choice is pending");
		expect(seatBoard(match, chooser === "you" ? "rival" : "you").window).toBe("you wait: the opponent decides");
	});

	it("trigger effects being chained: passing declines the optional ones left", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		const building = { ...match, duel: { ...match.duel, building: { stage: 0, remaining: [] } as never } };
		expect(seatBoard(building, "you").window).toBe("trigger effects are being chained: passing declines the optional ones left");
	});
});

describe("moves by index", () => {
	it("an index chooses between moves that carry the same name, and the card it chose is the one played and logged", () => {
		const setup = { seed: 3, first: "rival" as const, you: { deck: Array<string>(6).fill("mystical-space-typhoon") }, rival: { deck: Array<string>(6).fill("raigeki") } };
		const match = passTo(openMatch(setup, CARD_DEFS), "main1");
		const names = seatBoard(match, "rival").moves.map((move) => move.name);
		const second = names.indexOf("set raigeki", names.indexOf("set raigeki") + 1);
		expect(second).toBeGreaterThan(0);
		const listed = legalActions(match.duel);
		expect(listed[second]!.type === "set" && listed[second]).not.toEqual(listed[names.indexOf("set raigeki")]);
		const next = playIndex(match, "rival", second, { expect: "set raigeki" });
		expect(next.log.at(-1)!.action).toMatchObject({ type: "set", card: (listed[second] as { card: number }).card });
		expect(replayMatch(JSON.parse(JSON.stringify({ setup: next.setup, log: next.log, disputes: next.disputes })), CARD_DEFS).duel).toEqual(next.duel);
	});

	it("refuses a seat not to act, an index not offered, and a stale index whose name is not the one expected", () => {
		const match = openMatch(SETUP, CARD_DEFS);
		expect(() => playIndex(match, "rival", 0)).toThrow(/does not hold the decision/);
		expect(() => playIndex(match, "you", 9)).toThrow(/no move 9/);
		expect(() => playIndex(match, "you", 1, { expect: "pass" })).toThrow(/move 1 is "activate radiant-typhoon-vision #1", expected "pass"/);
		expect(match.log).toEqual([]);
	});
});

describe("the local driver: new / show / move / dispute / replay over a saved record", () => {
	const dir = mkdtempSync(join(tmpdir(), "agent-play-"));
	afterAll(() => rmSync(dir, { recursive: true, force: true }));
	const file = join(dir, "match.json");

	it("starts a match from the exact manifest lists, and the record keeps them whole", () => {
		runCli(["new", file, "--you", "745443", "--rival", "746021", "--seed", "1"], CARD_DEFS);
		const record: MatchRecord = JSON.parse(readFileSync(file, "utf8"));
		expect(record.setup).toEqual(SETUP);
		expect(record.setup.you.deck).toHaveLength(40);
		expect(record.setup.rival.extra).toHaveLength(15);
		expect(record.log).toEqual([]);
	});

	it("shows a seat as JSON or text; saves a chosen move and a dispute; resumes by replay", () => {
		const shown = JSON.parse(runCli(["show", file, "you"], CARD_DEFS));
		expect(shown.moves[1]).toEqual({ index: 1, name: "activate radiant-typhoon-vision #1", detail: expect.stringContaining("effect 1 of 4") });
		const text = runCli(["show", file, "you", "--text"], CARD_DEFS);
		expect(text).toContain("[1] activate radiant-typhoon-vision #1 -- effect 1 of 4: Quick-Play Spell from the hand");
		expect(text.startsWith("Turn 1, draw phase, your turn; you act")).toBe(true);
		expect(text).not.toContain("{");
		expect(text.indexOf("Opponent")).toBeLessThan(text.indexOf("Chain"));
		expect(text.indexOf("Log")).toBeLessThan(text.indexOf("Moves"));
		expect(runCli(["show", file, "rival", "--text"], CARD_DEFS)).toContain("opponent's turn; you wait");
		// The saved record is the referee's: seats are shown boards only.
		expect(JSON.stringify(shown)).not.toContain("infinite-impermanence");

		runCli(["move", file, "you", "0", "--expect", "pass"], CARD_DEFS);
		const said = runCli(["dispute", file, "rival", "Can", "this", "be", "answered?"], CARD_DEFS);
		expect(said.split(/\r?\n/)).toHaveLength(1);
		expect(said).toBe("Dispute 0 recorded (open): raised by you after move 1, turn 1 standby phase.");
		const record: MatchRecord = JSON.parse(readFileSync(file, "utf8"));
		expect(record.log).toHaveLength(1);
		expect(record.log[0]).toMatchObject({ side: "you", phase: "draw", action: { type: "pass" } });
		expect(record.disputes).toEqual([{ at: 1, turn: 1, phase: expect.any(String), by: "rival", claim: "Can this be answered?", ruling: null }]);

		const resumed = replayMatch(record, CARD_DEFS);
		const summary = JSON.parse(runCli(["replay", file], CARD_DEFS));
		expect(summary).toEqual({ moves: 1, disputes: 1, turn: resumed.duel.turn.number, phase: resumed.duel.turn.phase, toAct: seatFor(resumed, "you").toAct ? "you" : "rival", winner: null });
		expect(JSON.parse(runCli(["show", file, "you"], CARD_DEFS)).log).toEqual(seatFor(resumed, "you").log.map(({ auto, ...entry }) => ({ ...entry, side: entry.side === "you" ? "you" : "opponent", ...(auto ? { auto: auto.map((pass) => ({ ...pass, side: pass.side === "you" ? "you" : "opponent" })) } : {}) })));
	});

	it("a move naming a stale index writes nothing", () => {
		const before = readFileSync(file, "utf8");
		expect(() => runCli(["move", file, "you", "0", "--expect", "no-such-move"], CARD_DEFS)).toThrow(/expected "no-such-move"/);
		expect(readFileSync(file, "utf8")).toBe(before);
	});

	it("refuses a deck whose list has an unsupported card (no substitution)", () => {
		expect(() => runCli(["new", join(dir, "x.json"), "--you", "746021", "--rival", "745443", "--seed", "1"], { ...CARD_DEFS, "ash-blossom-joyous-spring": undefined as never })).toThrow(/ash-blossom-joyous-spring/);
	});
});
describe("the driver's move output and its refusals", () => {
	const dir = mkdtempSync(join(tmpdir(), "agent-play-move-"));
	afterAll(() => rmSync(dir, { recursive: true, force: true }));
	const file = join(dir, "match.json");

	it("a move prints a compact result (the move, the log since, who acts, the window, the moves), not the full board; --json gives the board", () => {
		runCli(["new", file, "--you", "745443", "--rival", "746021", "--seed", "1"], CARD_DEFS);
		const out = runCli(["move", file, "you", "0", "--expect", "pass"], CARD_DEFS);
		expect(out.startsWith('Played [0] "pass"')).toBe(true);
		expect(out).toContain("Log since your move:");
		expect(out).toContain("T1 draw you: pass");
		expect(out).toMatch(/Turn 1, standby phase, your turn; you act/);
		expect(out).toContain("Window: ");
		expect(out).toContain("Moves (zero-based, for this board only):");
		expect(out).not.toContain("{");
		expect(out).not.toContain("graveyard:");
		expect(out.split(/\r?\n/).length).toBeLessThan(20);
		const board = JSON.parse(runCli(["move", file, "you", "0", "--json"], CARD_DEFS));
		expect(board.moves[0]).toMatchObject({ index: 0, name: "pass" });
		expect(board.log.length).toBe(2);
	});

	it("a move for a seat that is not to act says who is", () => {
		expect(() => runCli(["move", file, "rival", "0"], CARD_DEFS)).toThrow(/rival does not hold the decision; you act now/);
	});

	it("a stale index names what the board has at that index, and where the expected label is now", () => {
		const before = readFileSync(file, "utf8");
		expect(() => runCli(["move", file, "you", "1", "--expect", "pass"], CARD_DEFS)).toThrow(/move 1 is "[^"]+", expected "pass"; the board changed since you read it: "pass" is now move 0/);
		expect(() => runCli(["move", file, "you", "0", "--expect", "no-such-move"], CARD_DEFS)).toThrow(/expected "no-such-move"; no move of this board has that label \(moves: 0 pass/);
		expect(readFileSync(file, "utf8")).toBe(before);
	});

	it("an index that is not on the board says how many moves there are", () => {
		expect(() => runCli(["move", file, "you", "99"], CARD_DEFS)).toThrow(/no move 99: this board has \d+ moves \(0 to \d+\)/);
	});

	it("a zone or a battle position the move does not offer says what it offers", () => {
		const match = passTo(openMatch(SETUP, CARD_DEFS), "main1");
		const summon = seatBoard(match, "you").moves.find((move) => move.name === "summon sky-striker-ace-raye")!.index;
		expect(() => playIndex(match, "you", summon, { zone: 9 })).toThrow(/zone 9 is not open for "summon sky-striker-ace-raye" \(open: 0, 1, 2, 3, 4\)/);
		expect(() => playIndex(match, "you", summon, { position: "defense" })).toThrow(/position defense is not offered for "summon sky-striker-ace-raye" \(a Normal Summon is face-up Attack Position\)/);
		expect(() => playIndex(match, "you", 0, { zone: 2 })).toThrow(/"pass" takes no zone or position/);
	});
});
