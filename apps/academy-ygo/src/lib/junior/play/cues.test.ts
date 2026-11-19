import { describe, expect, it } from "vitest";
import { arrivals, beatLength, effectCues, lpCounts, statHolds, timeline, type Beat, type Cue } from "./cues";
import { apply, board, type Board, type GameEvent, type Move, type Setup } from "./engine";
import { DEMOS, LEVELS } from "./levels";
import { demoFrames, next, play, start } from "./session";

/** Plays moves from a setup and gives the cues of the last one. */
function cuesOf(setup: Setup, ...moves: Move[]): Beat[] {
	let state: Board = board(setup);
	let beats: Beat[] = [];
	for (const move of moves) {
		const result = apply(state, move);
		if (!result.ok) throw new Error(`refused: ${result.reason}`);
		beats = effectCues(state, result.events, result.board);
		state = result.board;
	}
	return beats;
}
const flat = (beats: readonly Beat[]) => beats.flat();
const kinds = (beats: readonly Beat[]) => beats.map((beat) => beat.map((cue) => cue.kind));
const find = <K extends Cue["kind"]>(beats: readonly Beat[], kind: K) => flat(beats).filter((cue): cue is Extract<Cue, { kind: K }> => cue.kind === kind);

describe("effect cues", () => {
	it("Glow Charm: the card is shown, then Life Points count up from the old number to the new one", () => {
		const beats = cuesOf({ you: { hand: ["glow-charm"] } }, { type: "place", card: "glow-charm", row: "backrow", zone: 0 });
		expect(kinds(beats)).toEqual([["cast"], ["lp"]]);
		expect(find(beats, "cast")[0]).toMatchObject({ side: "you", card: "glow-charm" });
		expect(find(beats, "lp")[0]).toMatchObject({ side: "you", from: 4000, to: 4500, source: { at: "center" } });
		expect(lpCounts(beats)).toEqual({ you: { from: 4000, at: 1 } });
	});

	it("Thunder Clap: the target is marked, then lightning strikes its zone and the monster leaves for the Graveyard", () => {
		const beats = cuesOf({ you: { hand: ["thunder-clap"] }, rival: { monsters: [null, "thorn-fox"] } }, { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 1 });
		expect(kinds(beats)).toEqual([
			["cast", "aim"],
			["strike", "leave"],
		]);
		const zone = { at: "zone", side: "rival", row: "monsters", zone: 1 };
		expect(find(beats, "aim")[0]?.spot).toEqual(zone);
		expect(find(beats, "strike")[0]).toMatchObject({ style: "bolt", spot: zone });
		expect(find(beats, "leave")[0]).toMatchObject({ how: "destroyed", card: "thorn-fox", from: zone, to: { at: "pile", side: "rival", pile: "graveyard" } });
	});

	it("Lightning Vortex: every monster is struck in the same beat, so the board flashes once", () => {
		const beats = cuesOf({ you: { hand: ["lightning-vortex", "pocket-cub"] }, rival: { monsters: ["thorn-fox", "iron-boar", "thorn-fox"] } }, { type: "place", card: "lightning-vortex", row: "backrow", zone: 0, discard: "pocket-cub" });
		expect(beats).toHaveLength(2);
		expect(find(beats, "leave").filter((cue) => cue.how === "discard")).toHaveLength(1);
		const strikes = find(beats, "strike");
		expect(strikes.map((cue) => cue.style)).toEqual(["bolt", "bolt", "bolt"]);
		/* Two copies of one card leave from two different zones. */
		expect(new Set(strikes.map((cue) => (cue.spot.at === "zone" ? cue.spot.zone : -1)))).toEqual(new Set([0, 1, 2]));
	});

	it("Fissure opens the ground instead of striking with lightning", () => {
		const beats = cuesOf({ you: { hand: ["fissure"] }, rival: { monsters: ["iron-boar", "mud-toad"] } }, { type: "place", card: "fissure", row: "backrow", zone: 0 });
		expect(find(beats, "strike")[0]).toMatchObject({ style: "quake", spot: { zone: 1 } });
	});

	it("Spark Dash: the ATK gained rises from the monster", () => {
		const beats = cuesOf({ you: { hand: ["spark-dash"], monsters: ["pocket-cub"] } }, { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 });
		expect(find(beats, "stat")[0]).toMatchObject({ amount: 500, spot: { at: "zone", side: "you", zone: 0 } });
	});

	it("a monster keeps showing its old ATK and DEF until the beat where the change is shown", () => {
		const before = board({ you: { hand: ["spark-dash"], monsters: ["pocket-cub"] } });
		const result = apply(before, { type: "place", card: "spark-dash", row: "backrow", zone: 0, target: 0 });
		if (!result.ok) throw new Error(result.reason);
		const beats = effectCues(before, result.events, result.board);
		expect(statHolds(before, beats)).toEqual(new Map([["you-monsters-0", { atk: 1200, def: 800, at: 1 }]]));
		/* Mountain: the card, then its light over the field, then ATK and DEF change on both sides at the same moment. */
		const field = board({ full: true, you: { hand: ["mountain"], monsters: ["lantern-owl"] }, rival: { monsters: ["lantern-owl"] } });
		const raised = apply(field, { type: "place", card: "mountain", row: "field", zone: 0 });
		if (!raised.ok) throw new Error(raised.reason);
		const holds = statHolds(field, effectCues(field, raised.events, raised.board));
		expect(holds.get("you-monsters-0")).toEqual({ atk: 1800, def: 600, at: 2 });
		expect(holds.get("rival-monsters-0")).toEqual({ atk: 1800, def: 600, at: 2 });
	});

	it("a battle: the attack flies to the defender, they clash, the loser leaves and Life Points drop", () => {
		const beats = cuesOf({ you: { monsters: ["lantern-owl"] }, rival: { monsters: ["thorn-fox"] }, phase: "battle" }, { type: "attack", attacker: 0, target: 0 });
		expect(kinds(beats)).toEqual([["beam"], ["strike", "leave"], ["lp"]]);
		expect(find(beats, "strike")[0]?.style).toBe("clash");
		expect(find(beats, "lp")[0]).toMatchObject({ side: "rival", from: 4000, to: 3600 });
	});

	it("Traps answering an attack: a vine stops it, an explosion destroys the attacker, a swirl banishes it", () => {
		const attack = (trap: "sticky-vine" | "sakuretsu-armor" | "dimensional-prison" | "fog-snare") =>
			cuesOf({ you: { monsters: ["lantern-owl"] }, rival: { monsters: ["thorn-fox"], backrow: [trap] }, phase: "battle" }, { type: "attack", attacker: 0, target: 0 }, { type: "spring", zone: 0 });
		expect(find(attack("sticky-vine"), "block")[0]).toMatchObject({ art: "🌿", spot: { side: "you", zone: 0 } });
		expect(find(attack("sakuretsu-armor"), "strike")[0]).toMatchObject({ style: "burst", spot: { side: "you", zone: 0 } });
		expect(find(attack("dimensional-prison"), "leave")[0]).toMatchObject({ how: "banished", card: "lantern-owl", to: { at: "pile", side: "you", pile: "banished" } });
		expect(find(attack("fog-snare"), "stat")[0]).toMatchObject({ amount: -500, spot: { side: "you", zone: 0 } });
	});

	it("a Tribute Summon: the Tribute leaves first, and the board waits for it before the new monster lands", () => {
		const beats = cuesOf({ you: { hand: ["storm-stag"], monsters: [null, "pocket-cub"] } }, { type: "place", card: "storm-stag", row: "monsters", zone: 1, tributes: [1] });
		expect(kinds(beats)).toEqual([["leave"], ["arrive"]]);
		expect(find(beats, "leave")[0]).toMatchObject({ how: "tribute", card: "pocket-cub" });
		expect(arrivals(beats)).toEqual(new Map([["you-monsters-1", 1]]));
	});

	it("Monster Reborn: the monster rises from the Graveyard to its zone", () => {
		const beats = cuesOf({ you: { hand: ["monster-reborn"], graveyard: ["storm-stag"] } }, { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 0 } });
		expect(find(beats, "aim")[0]?.spot).toEqual({ at: "pile", side: "you", pile: "graveyard" });
		expect(find(beats, "leave")[0]).toMatchObject({ how: "revive", card: "storm-stag", from: { at: "pile", pile: "graveyard" }, to: { at: "zone", zone: 0 } });
		expect(find(beats, "arrive")[0]?.way).toBe("revive");
	});

	it("Polymerization: the materials come together, from the hand and the field, where the Fusion Monster appears", () => {
		const beats = cuesOf(
			{ you: { hand: ["polymerization", "masaki"], monsters: ["flame-manipulator"], extra: ["flame-swordsman"] } },
			{ type: "place", card: "polymerization", row: "backrow", zone: 0, summon: "flame-swordsman", materials: [{ from: "hand", card: "masaki" }, { from: "field", zone: 0 }] },
		);
		const used = find(beats, "leave");
		expect(used.map((cue) => [cue.card, cue.from.at])).toEqual([
			["masaki", "pile"],
			["flame-manipulator", "zone"],
		]);
		expect(find(beats, "summon")[0]).toMatchObject({ way: "fusion", cards: ["flame-swordsman"], spots: [{ at: "zone", side: "you", zone: 0 }] });
		/* The materials go to the middle of the board, where the Fusion happens. */
		expect(used.every((cue) => cue.to.at === "center")).toBe(true);
	});

	it("a Synchro Summon shows the Tuner's Level as rings and the other Levels as stars: 3 + 3 = 6", () => {
		const beats = cuesOf({ full: true, you: { monsters: ["tune-warrior", "giant-soldier-of-stone"], extra: ["gaia-knight"] } }, { type: "extra", card: "gaia-knight", materials: [0, 1] });
		expect(kinds(beats)).toEqual([["leave", "leave"], ["summon"]]);
		expect(find(beats, "summon")[0]).toMatchObject({
			way: "synchro",
			value: 6,
			materials: [
				{ card: "tune-warrior", level: 3, tuner: true },
				{ card: "giant-soldier-of-stone", level: 3, tuner: false },
			],
		});
	});

	it("an Xyz Summon shows its Rank, a Link Summon its Link Rating, a Ritual Summon the Levels of its Tributes", () => {
		const xyz = cuesOf({ full: true, you: { monsters: ["river-otter", "thorn-fox"], extra: ["gem-knight-pearl"] } }, { type: "extra", card: "gem-knight-pearl", materials: [0, 1] });
		expect(find(xyz, "summon")[0]).toMatchObject({ way: "xyz", value: 4, materials: [{ level: 4 }, { level: 4 }] });
		const link = cuesOf({ full: true, you: { monsters: ["stone-golem", "pebble-crab"], extra: ["lanphorhynchus"] } }, { type: "extra", card: "lanphorhynchus", materials: [0, 1] });
		expect(find(link, "summon")[0]).toMatchObject({ way: "link", value: 2, spots: [{ zone: 5 }] });
		const ritual = cuesOf(
			{ full: true, you: { hand: ["black-luster-ritual", "black-luster-soldier"], monsters: ["storm-stag", "pebble-crab"] } },
			{ type: "place", card: "black-luster-ritual", row: "backrow", zone: 0, materials: [{ from: "field", zone: 0 }, { from: "field", zone: 1 }] },
		);
		expect(find(ritual, "summon")[0]).toMatchObject({ way: "ritual", value: 8, cards: ["black-luster-soldier"], materials: [{ level: 6 }, { level: 3 }] });
	});

	it("a Pendulum Summon swings between the two Scales and brings every monster down at once", () => {
		const state = cuesOf({ full: true, you: { hand: ["mandragon", "flash-knight", "storm-stag", "river-otter"] } }, { type: "place", card: "mandragon", row: "backrow", zone: 0 }, { type: "place", card: "flash-knight", row: "backrow", zone: 4 }, { type: "pendulum", cards: ["storm-stag", "river-otter"] });
		expect(find(state, "summon")[0]).toMatchObject({ way: "pendulum", cards: ["storm-stag", "river-otter"], numbers: [2, 7], spots: [{ zone: 0 }, { zone: 1 }] });
	});

	it("a legendary monster gets its own scene once it has landed", () => {
		const beats = cuesOf({ you: { hand: ["dark-magician"], monsters: ["pocket-cub", "pebble-crab"] } }, { type: "place", card: "dark-magician", row: "monsters", zone: 0, tributes: [0, 1] });
		expect(kinds(beats)).toEqual([["leave", "leave"], ["arrive"], ["legend"]]);
		expect(find(beats, "legend")[0]).toMatchObject({ style: "dark-magic", card: "dark-magician", spot: { at: "zone", side: "you", zone: 0 } });
		const starts = timeline(beats);
		expect(starts).toEqual([0, 1, 2]);
		expect(arrivals(beats).get("you-monsters-0")).toBe(1);
		expect(beatLength(beats[2] ?? [])).toBeGreaterThan(1);
	});

	it("three Blue-Eyes become the Ultimate Dragon: a Fusion scene, then its legend", () => {
		const beats = cuesOf(
			{ full: true, you: { hand: ["polymerization", "blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon"], extra: ["blue-eyes-ultimate-dragon"] } },
			{ type: "place", card: "polymerization", row: "backrow", zone: 0, summon: "blue-eyes-ultimate-dragon", materials: [0, 1, 2].map(() => ({ from: "hand", card: "blue-eyes-white-dragon" }) as const) },
		);
		expect(kinds(beats).slice(-2)).toEqual([["summon"], ["legend"]]);
		expect(find(beats, "legend")[0]?.style).toBe("ultimate");
		expect(beatLength(beats.at(-2) ?? [])).toBeGreaterThan(1);
	});

	it("the fifth piece of the Forbidden One: the pieces come together, then the win", () => {
		const limbs = ["right-arm-of-the-forbidden-one", "left-arm-of-the-forbidden-one", "right-leg-of-the-forbidden-one", "left-leg-of-the-forbidden-one"] as const;
		const beats = cuesOf({ strict: true, phase: "draw", you: { hand: [...limbs], deck: ["exodia-the-forbidden-one"] } }, { type: "draw" });
		expect(kinds(beats)).toEqual([["leave"], ["legend"], ["cheer"]]);
		/* The pieces win from the hand: the scene does not end on the rival's Life Points. */
		expect(find(beats, "legend")[0]).toMatchObject({ style: "forbidden", side: "you", spot: { at: "center" } });
	});

	it("Mountain: the field is covered, and each monster it reaches shows what it gains", () => {
		const beats = cuesOf({ full: true, you: { hand: ["mountain"], monsters: ["lantern-owl", "pocket-cub"] }, rival: { monsters: ["lantern-owl"] } }, { type: "place", card: "mountain", row: "field", zone: 0 });
		expect(find(beats, "wave")).toHaveLength(1);
		expect(find(beats, "stat").map((cue) => [cue.spot.at === "zone" ? cue.spot.side : "", cue.amount])).toEqual([
			["you", 200],
			["rival", 200],
		]);
	});

	it("Pot of Desires: cards go from the Deck to the banished cards, then two are drawn together", () => {
		const deck = Array.from({ length: 12 }, () => "pocket-cub" as const);
		const beats = cuesOf({ full: true, you: { hand: ["pot-of-desires"], deck } }, { type: "place", card: "pot-of-desires", row: "backrow", zone: 0 });
		const leaves = find(beats, "leave");
		expect(leaves.filter((cue) => cue.how === "banished").every((cue) => cue.card === null && cue.to.at === "pile" && cue.to.pile === "banished")).toBe(true);
		expect(beats.at(-1)?.map((cue) => (cue.kind === "leave" ? cue.how : ""))).toEqual(["draw", "draw"]);
	});

	it("Busy Bee: its effect flies from the Graveyard to the opponent's Life Points", () => {
		const beats = cuesOf({ you: { monsters: ["busy-bee"] }, rival: { monsters: ["thorn-fox"] }, turn: "rival", phase: "battle" }, { type: "attack", attacker: 0, target: 0 });
		expect(find(beats, "beam").at(-1)).toMatchObject({ art: "🐝", from: { at: "pile", side: "you", pile: "graveyard" }, to: { at: "lantern", side: "rival" } });
	});

	it("an effect that does nothing shows that nothing happened", () => {
		const setup: Setup = { you: { hand: ["thunder-clap"] }, rival: { monsters: ["thorn-fox"], backrow: ["quick-burrow"] } };
		const beats = cuesOf(setup, { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 }, { type: "spring", zone: 0, target: 0 });
		expect(find(beats, "leave")[0]).toMatchObject({ how: "returned", card: "thorn-fox", to: { at: "pile", side: "rival", pile: "hand" } });
		expect(find(beats, "fizzle")).toHaveLength(1);
		expect(find(beats, "strike")).toHaveLength(0);
	});

	/** What each kind of event must at least show. */
	const SHOWN: Partial<Record<GameEvent["type"], Cue["kind"]>> = { activated: "cast", sprung: "cast", "hand-effect": "shield", gained: "lp", lp: "lp", boosted: "stat", destroyed: "strike", banished: "leave", returned: "leave", summoned: "arrive", battle: "strike", direct: "strike", "attack-stopped": "block", field: "wave", "no-effect": "fizzle", missed: "fizzle", trigger: "beam", ability: "beam", scale: "arrive", pendulum: "summon", detached: "leave", won: "cheer", drew: "leave", exodia: "legend" };
	function check(label: string, before: Board, events: readonly GameEvent[], after: Board): void {
		const beats = effectCues(before, events, after);
		const shown = new Set(flat(beats).map((cue) => cue.kind));
		for (const event of events) {
			const wanted = event.type === "special" ? (event.how === "revive" || event.how === "own" ? "arrive" : "summon") : SHOWN[event.type];
			if (wanted && !shown.has(wanted)) throw new Error(`${label}: "${event.type}" shows no "${wanted}" cue`);
		}
	}

	it("every level's solution shows a cue for everything that happens, the rival's steps included", () => {
		for (const level of LEVELS) {
			let session = start(level);
			const drain = () => {
				while (session.status === "rival") {
					const before = session.board;
					session = next(session);
					check(level.id, before, session.events, session.board);
				}
			};
			drain();
			for (const move of level.solution) {
				const before = session.board;
				session = play(session, move);
				expect(session.rejected, level.id).toBeNull();
				check(level.id, before, session.events, session.board);
				drain();
			}
		}
	});

	it("every demonstration shows a cue for everything that happens", () => {
		for (const [rule, demo] of Object.entries(DEMOS)) {
			const frames = demoFrames(demo);
			frames.forEach((frame, index) => {
				const before = frames[index - 1];
				if (before) check(rule, before.board, frame.events, frame.board);
			});
		}
	});
});
