import { describe, expect, it } from "vitest";
import { EXTRA_ZONE, apply, board, legalMoves, type Board, type Move } from "./engine";

function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`rejected: ${result.reason}`);
	return result;
}
function reason(state: Board, move: Move) {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
}
const play = (state: Board, ...moves: Move[]) => moves.reduce((current, move) => ok(current, move).board, state);
const cards = (state: Board, who: "you" | "rival") => state[who].monsters.map((slot) => slot?.card ?? null);

describe("a Ritual Summon", () => {
	const start = () => board({ full: true, you: { hand: ["black-luster-ritual", "black-luster-soldier", "river-otter"], monsters: ["storm-stag", "pebble-crab", "pocket-cub"] } });
	const ritual = (materials: Extract<Move, { type: "place" }>["materials"]): Move => ({ type: "place", card: "black-luster-ritual", row: "backrow", zone: 0, materials });
	it("needs the Ritual Spell, the Ritual Monster in the hand, and Tributes whose Levels reach the number on the Spell", () => {
		const { board: after, events } = ok(start(), ritual([{ from: "field", zone: 0 }, { from: "field", zone: 1 }]));
		expect(cards(after, "you").slice(0, 3)).toEqual(["black-luster-soldier", null, "pocket-cub"]);
		expect(after.you.graveyard).toEqual(["black-luster-ritual", "storm-stag", "pebble-crab"]);
		expect(after.you.hand).toEqual(["river-otter"]);
		expect(after.summonUsed).toBe(false);
		expect(events).toContainEqual({ type: "special", side: "you", card: "black-luster-soldier", zone: 0, how: "ritual", materials: ["storm-stag", "pebble-crab"] });
	});
	it('says "8 or more": more is fine, less is not', () => {
		expect(reason(start(), ritual([{ from: "field", zone: 0 }, { from: "field", zone: 2 }]))).toBe("accepted");
		expect(reason(start(), ritual([{ from: "field", zone: 1 }, { from: "field", zone: 2 }]))).toBe("levels-too-low");
	});
	it("takes Tributes from the hand as well as the field", () => {
		const after = play(start(), ritual([{ from: "hand", card: "river-otter" }, { from: "field", zone: 0 }]));
		expect(after.you.hand).toEqual([]);
		expect(cards(after, "you").slice(0, 3)).toEqual(["black-luster-soldier", "pebble-crab", "pocket-cub"]);
	});
	it("takes no Tribute it does not need", () => {
		expect(reason(start(), ritual([{ from: "field", zone: 0 }, { from: "field", zone: 1 }, { from: "field", zone: 2 }]))).toBe("too-many-tributes");
	});
	it("cannot use the Ritual Monster itself, and cannot start without it", () => {
		expect(reason(start(), ritual([{ from: "hand", card: "black-luster-soldier" }]))).toBe("wrong-materials");
		const without = board({ full: true, you: { hand: ["black-luster-ritual"], monsters: ["mountain-bison"] } });
		expect(reason(without, ritual([{ from: "field", zone: 0 }]))).toBe("no-ritual-monster");
	});
});

describe("a monster that is Summoned in its own way", () => {
	it("cannot be Normal Summoned: a Ritual Monster needs its Ritual Spell, even with two Tributes ready", () => {
		const state = board({ full: true, you: { hand: ["black-luster-soldier"], monsters: ["storm-stag", "pebble-crab"] } });
		expect(reason(state, { type: "place", card: "black-luster-soldier", row: "monsters", zone: 0, tributes: [0, 1] })).toBe("special-only");
		expect(legalMoves(state).filter((move) => move.type === "place")).toEqual([]);
	});
	it("cannot come back from the Graveyard unless it was first Summoned that way", () => {
		const never = board({ full: true, you: { hand: ["monster-reborn"], graveyard: ["black-luster-soldier", "gaia-knight"] } });
		expect(reason(never, { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 0 } })).toBe("not-properly-summoned");
		expect(reason(never, { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 1 } })).toBe("not-properly-summoned");
	});
	it("can come back once it was: a Synchro Monster destroyed in battle is revived by Monster Reborn", () => {
		const state = board({ full: true, you: { hand: ["monster-reborn"], monsters: ["tune-warrior", "giant-soldier-of-stone"], extra: ["gaia-knight"] }, rival: { monsters: ["mountain-bison"] } });
		const lost = play(state, { type: "extra", card: "gaia-knight", materials: [0, 1] }, { type: "attack", attacker: 0, target: 0 });
		expect(lost.you.graveyard).toEqual(["tune-warrior", "giant-soldier-of-stone", "gaia-knight"]);
		const after = play(lost, { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "you", index: 2 } });
		expect(cards(after, "you")[0]).toBe("gaia-knight");
	});
});

describe("a Fusion Summon", () => {
	const start = () => board({ full: true, you: { hand: ["polymerization", "masaki"], monsters: ["flame-manipulator", "river-otter"], extra: ["flame-swordsman"] } });
	const fuse = (materials: Extract<Move, { type: "place" }>["materials"]): Move => ({ type: "place", card: "polymerization", row: "backrow", zone: 0, summon: "flame-swordsman", materials });
	it("sends the named materials from the hand or field to the Graveyard and brings the Fusion Monster from the Extra Deck", () => {
		const { board: after, events } = ok(start(), fuse([{ from: "hand", card: "masaki" }, { from: "field", zone: 0 }]));
		expect(cards(after, "you").slice(0, 2)).toEqual(["flame-swordsman", "river-otter"]);
		expect(after.you.extra).toEqual([]);
		expect(after.you.graveyard).toEqual(["polymerization", "masaki", "flame-manipulator"]);
		expect(events.at(-1)).toEqual({ type: "special", side: "you", card: "flame-swordsman", zone: 0, how: "fusion", materials: ["masaki", "flame-manipulator"] });
	});
	it("names its materials: another monster will not do", () => {
		expect(reason(start(), fuse([{ from: "field", zone: 0 }, { from: "field", zone: 1 }]))).toBe("wrong-materials");
	});
	it("needs a card like Polymerization: the monsters do not fuse by themselves", () => {
		const both = board({ full: true, you: { monsters: ["flame-manipulator", "masaki"], extra: ["flame-swordsman"] } });
		expect(reason(both, { type: "extra", card: "flame-swordsman", materials: [0, 1] })).toBe("needs-spell");
	});
	it("is found by trying every move", () => {
		expect(legalMoves(start()).filter((move) => move.type === "place" && move.summon)).toHaveLength(1);
	});
});

describe("a Synchro Summon", () => {
	const start = () => board({ full: true, you: { monsters: ["tune-warrior", "giant-soldier-of-stone", "river-otter", "pocket-cub"], extra: ["gaia-knight"] } });
	const synchro = (...materials: number[]): Move => ({ type: "extra", card: "gaia-knight", materials });
	it("adds one Tuner and non-Tuners to exactly the Level, with no Spell, and sends them to the Graveyard", () => {
		const { board: after, events } = ok(start(), synchro(0, 1));
		expect(cards(after, "you").slice(0, 4)).toEqual(["gaia-knight", null, "river-otter", "pocket-cub"]);
		expect(after.you.graveyard).toEqual(["tune-warrior", "giant-soldier-of-stone"]);
		expect(events).toEqual([{ type: "special", side: "you", card: "gaia-knight", zone: 0, how: "synchro", materials: ["tune-warrior", "giant-soldier-of-stone"] }]);
	});
	it("needs the exact sum: 3 + 4 is not 6", () => {
		expect(reason(start(), synchro(0, 2))).toBe("levels-not-equal");
	});
	it("needs exactly one Tuner", () => {
		expect(reason(start(), synchro(1, 3))).toBe("needs-one-tuner");
	});
	it("does not use up the Normal Summon, and the new monster may go to the Extra Monster Zone", () => {
		const after = play(start(), { type: "extra", card: "gaia-knight", materials: [0, 1], zone: EXTRA_ZONE });
		expect(cards(after, "you")[EXTRA_ZONE]).toBe("gaia-knight");
		expect(after.summonUsed).toBe(false);
	});
});

describe("an Xyz Summon", () => {
	const start = () => board({ full: true, you: { monsters: ["river-otter", "thorn-fox", "pocket-cub"], extra: ["gem-knight-pearl"] }, rival: { monsters: ["shadow-wolf"] } });
	it("stacks monsters of the same Level under the Xyz Monster: they do not go to the Graveyard", () => {
		const { board: after } = ok(start(), { type: "extra", card: "gem-knight-pearl", materials: [0, 1] });
		expect(after.you.monsters[0]).toEqual(expect.objectContaining({ card: "gem-knight-pearl", materials: ["river-otter", "thorn-fox"] }));
		expect(after.you.graveyard).toEqual([]);
		expect(cards(after, "you").slice(0, 3)).toEqual(["gem-knight-pearl", null, "pocket-cub"]);
	});
	it("refuses a Level 3 with a Level 4", () => {
		expect(reason(start(), { type: "extra", card: "gem-knight-pearl", materials: [0, 2] })).toBe("wrong-levels");
	});
	it("sends the materials to the Graveyard when the Xyz Monster leaves the field", () => {
		const state = board({ full: true, you: { hand: ["thunder-clap"] }, rival: { monsters: [{ card: "gem-knight-pearl", materials: ["river-otter", "thorn-fox"] }] } });
		const after = play(state, { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 });
		expect(after.rival.graveyard).toEqual(["river-otter", "thorn-fox", "gem-knight-pearl"]);
	});
});

describe("an Xyz Material that belongs to the opponent", () => {
	it("goes back to its owner's Graveyard when the Xyz Monster leaves the field", () => {
		const state = board({ full: true, you: { hand: ["monster-reborn"], monsters: ["river-otter"], extra: ["gem-knight-pearl"] }, rival: { graveyard: ["iron-boar"], monsters: ["mountain-bison"] } });
		const after = play(state, { type: "place", card: "monster-reborn", row: "backrow", zone: 0, grave: { side: "rival", index: 0 } }, { type: "extra", card: "gem-knight-pearl", materials: [0, 1] }, { type: "attack", attacker: 0, target: 0 });
		expect(after.rival.graveyard).toEqual(["iron-boar"]);
		expect(after.you.graveyard).toEqual(["monster-reborn", "river-otter", "gem-knight-pearl"]);
	});
});

describe("detaching an Xyz Material", () => {
	const start = (materials: readonly ["river-otter"] | readonly []) => board({ full: true, turn: "rival", you: { monsters: [{ card: "utopia", materials }, "pocket-cub"] }, rival: { monsters: ["shadow-wolf"] } });
	it("is a cost: the material goes to the Graveyard and the attack is negated", () => {
		const attacked = ok(start(["river-otter"]), { type: "attack", attacker: 0, target: 1 });
		expect(attacked.board.pending).not.toBeNull();
		const { board: after, events } = ok(attacked.board, { type: "ability", zone: 0 });
		expect(after.you.graveyard).toEqual(["river-otter"]);
		expect(after.you.monsters[0]?.materials).toEqual([]);
		expect(cards(after, "you")[1]).toBe("pocket-cub");
		expect(events.map((event) => event.type)).toEqual(["detached", "attack-stopped"]);
	});
	it("cannot be paid with no material left", () => {
		const attacked = ok(start([]), { type: "attack", attacker: 0, target: 1 });
		expect(attacked.board.pending).toBeNull();
		expect(cards(attacked.board, "you")[1]).toBeNull();
	});
	it("destroys Utopia when it is attacked with no material", () => {
		const { board: after, events } = ok(start([]), { type: "attack", attacker: 0, target: 0 });
		expect(cards(after, "you")[0]).toBeNull();
		expect(after.you.graveyard).toEqual(["utopia"]);
		expect(events.map((event) => event.type)).toEqual(["attack-declared", "destroyed"]);
	});
});

describe("a Link Summon", () => {
	const start = () => board({ full: true, you: { monsters: ["pebble-crab", "mud-toad", "lantern-owl"], extra: ["lanphorhynchus"] } });
	it("sends as many monsters as the Link Rating to the Graveyard and lands in the Extra Monster Zone", () => {
		const { board: after } = ok(start(), { type: "extra", card: "lanphorhynchus", materials: [0, 1] });
		expect(cards(after, "you")[EXTRA_ZONE]).toBe("lanphorhynchus");
		expect(cards(after, "you").slice(0, 3)).toEqual([null, null, "lantern-owl"]);
		expect(after.you.graveyard).toEqual(["pebble-crab", "mud-toad"]);
	});
	it("needs exactly that many monsters", () => {
		expect(reason(start(), { type: "extra", card: "lanphorhynchus", materials: [0] })).toBe("link-count");
		expect(reason(start(), { type: "extra", card: "lanphorhynchus", materials: [0, 1, 2] })).toBe("link-count");
	});
	it("has no DEF: a Link Monster is never turned to Defense Position", () => {
		const state = board({ full: true, you: { emz: "lanphorhynchus" } });
		expect(reason(state, { type: "position", zone: EXTRA_ZONE })).toBe("link-no-defense");
	});
	it("still stands in the way of a direct attack from its Extra Monster Zone", () => {
		const state = board({ full: true, you: { monsters: ["lantern-owl"] }, rival: { emz: "lanphorhynchus" } });
		expect(reason(state, { type: "attack", attacker: 0, target: "direct" })).toBe("monster-in-the-way");
		expect(reason(state, { type: "attack", attacker: 0, target: EXTRA_ZONE })).toBe("accepted");
	});
});

describe("a Pendulum Summon", () => {
	const start = () => board({ full: true, you: { hand: ["mandragon", "flash-knight", "storm-stag", "river-otter", "mountain-bison", "mud-toad"] } });
	const scales: Move[] = [
		{ type: "place", card: "mandragon", row: "backrow", zone: 0 },
		{ type: "place", card: "flash-knight", row: "backrow", zone: 4 },
	];
	it("places a Pendulum Monster as a Scale in the leftmost or rightmost Spell & Trap Zone only", () => {
		expect(reason(start(), { type: "place", card: "mandragon", row: "backrow", zone: 2 })).toBe("pendulum-zone");
		const { board: after, events } = ok(start(), scales[0]!);
		expect(after.you.backrow[0]).toEqual({ card: "mandragon", setThisTurn: false, up: true });
		expect(events).toEqual([{ type: "scale", side: "you", card: "mandragon", zone: 0, scale: 2 }]);
		expect(after.summonUsed).toBe(false);
	});
	it("Special Summons several monsters from the hand at once, without Tributes, when their Levels are between the Scales", () => {
		const { board: after, events } = ok(play(start(), ...scales), { type: "pendulum", cards: ["storm-stag", "river-otter"] });
		expect(cards(after, "you").slice(0, 2)).toEqual(["storm-stag", "river-otter"]);
		expect(events).toEqual([{ type: "pendulum", side: "you", cards: ["storm-stag", "river-otter"], low: 2, high: 7 }]);
		expect(after.summonUsed).toBe(false);
	});
	it("means strictly between: Level 2 and Level 8 do not come with Scales 2 and 7", () => {
		const ready = play(start(), ...scales);
		expect(reason(ready, { type: "pendulum", cards: ["mud-toad"] })).toBe("level-not-between");
		expect(reason(ready, { type: "pendulum", cards: ["mountain-bison"] })).toBe("level-not-between");
	});
	it("needs both Scales, and happens once per turn", () => {
		expect(reason(play(start(), scales[0]!), { type: "pendulum", cards: ["river-otter"] })).toBe("no-scales");
		const once = play(start(), ...scales, { type: "pendulum", cards: ["river-otter"] });
		expect(reason(once, { type: "pendulum", cards: ["storm-stag"] })).toBe("pendulum-used");
	});
	it("puts a destroyed Pendulum Monster face-up on the Extra Deck, not in the Graveyard", () => {
		const state = board({ full: true, you: { monsters: ["shadow-wolf"] }, rival: { monsters: ["flash-knight"] } });
		const { board: after, events } = ok(state, { type: "attack", attacker: 0, target: 0 });
		expect(after.rival.extraUp).toEqual(["flash-knight"]);
		expect(after.rival.graveyard).toEqual([]);
		expect(events).toContainEqual({ type: "to-extra", side: "rival", card: "flash-knight" });
	});
});
