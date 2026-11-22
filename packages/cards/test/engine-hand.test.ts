import { describe, expect, it } from "vitest";
import { apply, atkOf, board, legalMoves, type Board, type Move, type Setup } from "@duel-academy/engine";

/** Hand traps, Traps that answer a Summon, and cards that search the Deck with a choice. Texts in card-art.ts. */
function ok(state: Board, move: Move) {
	const result = apply(state, move);
	if (!result.ok) throw new Error(`refused: ${result.reason}`);
	return result;
}
const play = (state: Board, ...moves: Move[]) => moves.reduce((current, move) => ok(current, move).board, state);
const reason = (state: Board, move: Move) => {
	const result = apply(state, move);
	return result.ok ? "accepted" : result.reason;
};
const mat = (setup: Setup) => board({ full: true, ...setup });
const cast = (card: string, extra: Record<string, unknown> = {}) => ({ type: "place", card, row: "backrow", zone: 0, ...extra }) as Move;
const summon = (card: string, zone = 0, extra: Record<string, unknown> = {}) => ({ type: "place", card, row: "monsters", zone, ...extra }) as Move;
const attack = (attacker: number, target: number | "direct"): Move => ({ type: "attack", attacker, target });
const pass: Move = { type: "pass" };

describe("answering a Summon", () => {
	it("opens a moment for the other player only when a Set Trap or a hand trap can answer it", () => {
		expect(play(mat({ you: { hand: ["iron-boar"] } }), summon("iron-boar")).pending).toBeNull();
		const set = ok(mat({ you: { hand: ["iron-boar"] }, rival: { backrow: ["trap-hole"] } }), summon("iron-boar"));
		expect(set.board.pending).toEqual({ kind: "summon", zones: [0], how: "normal" });
		expect(set.events.at(-1)).toEqual({ type: "window", side: "rival", kind: "summon" });
		expect(play(set.board, pass).you.monsters[0]?.card).toBe("iron-boar");
	});
	it("Trap Hole destroys a Normal Summoned monster with 1000 or more ATK, not a weaker one, not a Special Summon", () => {
		const trapped = play(mat({ you: { hand: ["iron-boar"] }, rival: { backrow: ["trap-hole"] } }), summon("iron-boar"), { type: "spring", zone: 0 });
		expect(trapped.you.monsters[0]).toBeNull();
		expect(trapped.you.graveyard).toEqual(["iron-boar"]);
		expect(play(mat({ you: { hand: ["mud-toad"] }, rival: { backrow: ["trap-hole"] } }), summon("mud-toad")).pending).toBeNull();
		const reborn = play(mat({ you: { hand: ["monster-reborn"], graveyard: ["iron-boar"] }, rival: { backrow: ["trap-hole"] } }), cast("monster-reborn", { grave: { side: "you", index: 0 } }));
		expect(reborn.pending).toBeNull();
	});
	it("Bottomless Trap Hole destroys and banishes any Summoned monster with 1500 or more ATK", () => {
		const start = mat({ you: { hand: ["monster-reborn"], graveyard: ["blue-eyes-white-dragon"] }, rival: { backrow: ["bottomless-trap-hole"] } });
		const fallen = play(start, cast("monster-reborn", { grave: { side: "you", index: 0 } }), { type: "spring", zone: 0 });
		expect(fallen.you.monsters[0]).toBeNull();
		expect(fallen.you.banished).toEqual([{ card: "blue-eyes-white-dragon", faceDown: false }]);
	});
	it("Torrential Tribute destroys every monster on the field", () => {
		const start = mat({ you: { hand: ["iron-boar"], monsters: [null, "river-otter"] }, rival: { monsters: ["shadow-wolf"], backrow: ["torrential-tribute"] } });
		const washed = play(start, summon("iron-boar"), { type: "spring", zone: 0 });
		expect([...washed.you.monsters, ...washed.rival.monsters].some(Boolean)).toBe(false);
	});
	it("a Set monster is not a Summon; a Flip Summon is", () => {
		const start = mat({ strict: true, you: { hand: ["iron-boar"], deck: ["mud-toad"] }, rival: { backrow: ["trap-hole"] } });
		const set = play(start, summon("iron-boar", 0, { set: true }));
		expect(set.pending).toBeNull();
		const flipped = play(set, { type: "phase", to: "end" }, { type: "phase", to: "end" }, { type: "draw" }, { type: "phase", to: "main1" }, { type: "position", zone: 0 });
		expect(flipped.pending).toMatchObject({ kind: "summon", how: "flip" });
	});
});

describe("hand traps", () => {
	it("Effect Veiler: in the opponent's Main Phase, sent from the hand to negate an Effect Monster until the end of the turn", () => {
		const start = mat({ you: { hand: ["iron-boar"], monsters: [null, "jinzo"] }, rival: { hand: ["effect-veiler"], backrow: ["mirror-force"] } });
		const window = play(start, summon("iron-boar"));
		expect(window.pending).toMatchObject({ kind: "summon" });
		expect(reason(window, { type: "hand", card: "effect-veiler", target: 0 })).toBe("no-target");
		const veiled = ok(window, { type: "hand", card: "effect-veiler", target: 1 });
		expect(veiled.board.you.monsters[1]).toMatchObject({ card: "jinzo", negatedTurn: true });
		expect(veiled.board.rival.graveyard).toEqual(["effect-veiler"]);
		/* Jinzo's effect is negated: the Trap can be flipped this turn. */
		const attacked = play(veiled.board, attack(1, "direct"), { type: "spring", zone: 0 });
		expect(attacked.you.monsters.some(Boolean)).toBe(false);
	});
	it("Ash Blossom & Joyous Spring: discarded to negate an effect that adds from the Deck, draws, or Special Summons from the Deck; once per turn", () => {
		const start = mat({ you: { hand: ["pot-of-greed", "fusion-sage", "raigeki"], deck: ["polymerization", "pocket-cub", "mud-toad"] }, rival: { hand: ["ash-blossom-joyous-spring", "ash-blossom-joyous-spring"], monsters: ["iron-boar"] } });
		const drawn = play(start, cast("pot-of-greed"));
		expect(drawn.pending).toMatchObject({ kind: "spell", card: "pot-of-greed" });
		const negated = ok(drawn, { type: "hand", card: "ash-blossom-joyous-spring" });
		expect(negated.board.you.hand).toEqual(["fusion-sage", "raigeki"]);
		expect(negated.board.you.graveyard).toEqual(["pot-of-greed"]);
		expect(negated.events.some((event) => event.type === "negated")).toBe(true);
		/* The second copy cannot be used the same turn, so the next search is not stopped. */
		expect(play(negated.board, cast("fusion-sage")).you.hand).toContain("polymerization");
		/* Raigeki touches no Deck: no moment to answer it with Ash Blossom. */
		expect(play(start, cast("raigeki")).pending).toBeNull();
	});
	it("Swift Scarecrow: discarded when a monster attacks directly, to negate the attack and end the Battle Phase", () => {
		const start = mat({ turn: "rival", phase: "battle", you: { hand: ["swift-scarecrow"] }, rival: { monsters: ["blue-eyes-white-dragon", "iron-boar"] } });
		const declared = play(start, attack(0, "direct"));
		const stopped = ok(declared, { type: "hand", card: "swift-scarecrow" });
		expect(stopped.board.you.lp).toBe(4000);
		expect(stopped.board.phase).toBe("main2");
		expect(reason(stopped.board, attack(1, "direct"))).toBe("not-battle-phase");
		const guarded = mat({ turn: "rival", phase: "battle", you: { hand: ["swift-scarecrow"], monsters: ["pocket-cub"] }, rival: { monsters: ["blue-eyes-white-dragon"] } });
		expect(play(guarded, attack(0, 0)).pending).toBeNull();
	});
	it("Battle Fader: Special Summoned from the hand on a direct attack, the Battle Phase ends, and it is banished when it leaves the field", () => {
		const start = mat({ turn: "rival", phase: "battle", you: { hand: ["battle-fader"] }, rival: { hand: ["raigeki"], monsters: ["blue-eyes-white-dragon"] } });
		const faded = play(start, attack(0, "direct"), { type: "hand", card: "battle-fader" });
		expect(faded.you.lp).toBe(4000);
		expect(faded.you.monsters[0]).toMatchObject({ card: "battle-fader" });
		expect(faded.phase).toBe("main2");
		const gone = play(faded, cast("raigeki"));
		expect(gone.you.graveyard).toEqual([]);
		expect(gone.you.banished).toEqual([{ card: "battle-fader", faceDown: false }]);
	});
	it("D.D. Crow: discarded to banish the monster a Spell targets in its user's Graveyard", () => {
		const start = mat({ you: { hand: ["monster-reborn"], graveyard: ["pocket-cub", "blue-eyes-white-dragon"] }, rival: { hand: ["dd-crow"] } });
		const cast1 = play(start, cast("monster-reborn", { grave: { side: "you", index: 1 } }));
		expect(cast1.pending).toMatchObject({ kind: "spell" });
		const crowed = play(cast1, { type: "hand", card: "dd-crow" });
		expect(crowed.you.banished).toEqual([{ card: "blue-eyes-white-dragon", faceDown: false }]);
		expect(crowed.you.monsters.some(Boolean)).toBe(false);
		expect(crowed.you.graveyard).toEqual(["pocket-cub", "monster-reborn"]);
	});
});

describe("searching the Deck with a choice", () => {
	it("Reinforcement of the Army adds the Level 4 or lower Warrior that is chosen", () => {
		const start = mat({ you: { hand: ["reinforcement-of-the-army"], deck: ["celtic-guardian", "iron-boar", "elemental-hero-sparkman", "buster-blader"] } });
		expect(reason(start, cast("reinforcement-of-the-army"))).toBe("no-target");
		expect(reason(start, cast("reinforcement-of-the-army", { pick: "buster-blader" }))).toBe("no-target");
		expect(reason(start, cast("reinforcement-of-the-army", { pick: "iron-boar" }))).toBe("no-target");
		const found = play(start, cast("reinforcement-of-the-army", { pick: "elemental-hero-sparkman" }));
		expect(found.you.hand).toEqual(["elemental-hero-sparkman"]);
		expect(found.you.deck).toHaveLength(3);
		expect(legalMoves(start).filter((move) => move.type === "place" && move.pick).map((move) => (move as { pick: string }).pick).sort()).toEqual(["celtic-guardian", "elemental-hero-sparkman"]);
	});
	it("E - Emergency Call adds an Elemental HERO; A Hero Lives pays half the Life Points to Special Summon a low one from the Deck", () => {
		const call = mat({ you: { hand: ["e-emergency-call"], deck: ["elemental-hero-neos", "pocket-cub"] } });
		expect(play(call, cast("e-emergency-call", { pick: "elemental-hero-neos" })).you.hand).toEqual(["elemental-hero-neos"]);
		const lives = mat({ you: { hand: ["a-hero-lives"], deck: ["elemental-hero-neos", "elemental-hero-sparkman"] } });
		expect(reason(lives, cast("a-hero-lives", { pick: "elemental-hero-neos" }))).toBe("no-target");
		const summoned = play(lives, cast("a-hero-lives", { pick: "elemental-hero-sparkman" }));
		expect(summoned.you.lp).toBe(2000);
		expect(summoned.you.monsters[0]?.card).toBe("elemental-hero-sparkman");
		expect(reason(mat({ you: { hand: ["a-hero-lives"], deck: ["elemental-hero-sparkman"], monsters: ["pocket-cub"] } }), cast("a-hero-lives", { pick: "elemental-hero-sparkman" }))).toBe("condition-not-met");
	});
	it("Magician's Rod, when Normal Summoned, adds a chosen Spell or Trap that mentions Dark Magician", () => {
		const start = mat({ strict: true, you: { hand: ["magicians-rod"], deck: ["thousand-knives", "raigeki", "dark-magic-attack"] } });
		const summoned = play(start, summon("magicians-rod"));
		expect(reason(summoned, { type: "ability", zone: 0, pick: "raigeki" })).toBe("no-target");
		const searched = play(summoned, { type: "ability", zone: 0, pick: "dark-magic-attack" });
		expect(searched.you.hand).toEqual(["dark-magic-attack"]);
		expect(reason(searched, { type: "ability", zone: 0, pick: "thousand-knives" })).not.toBe("accepted");
	});
	it("Elemental HERO Blazeman adds Polymerization when it is Summoned; Elemental HERO Gaia halves the strongest monster and takes that ATK", () => {
		const blaze = play(mat({ you: { hand: ["elemental-hero-blazeman"], deck: ["pocket-cub", "polymerization"] } }), summon("elemental-hero-blazeman"));
		expect(blaze.you.hand).toEqual(["polymerization"]);
		const gaia = play(mat({ you: { hand: ["polymerization"], monsters: ["elemental-hero-sparkman", "elemental-hero-clayman"], extra: ["elemental-hero-gaia"] }, rival: { monsters: ["blue-eyes-white-dragon", "iron-boar"] } }), {
			type: "place",
			card: "polymerization",
			row: "backrow",
			zone: 0,
			summon: "elemental-hero-gaia",
			materials: [
				{ from: "field", zone: 0 },
				{ from: "field", zone: 1 },
			],
		});
		expect(atkOf(gaia.rival.monsters[0]!, gaia)).toBe(1500);
		expect(atkOf(gaia.you.monsters[0]!, gaia)).toBe(2200 + 1500);
		expect(atkOf(play(gaia, { type: "phase", to: "end" }).rival.monsters[0]!, gaia)).toBe(3000);
	});
	it("Magician's Rod destroyed by Trap Hole in answer to its Summon still adds its card; negated by Effect Veiler, it does not", () => {
		const hole = mat({ strict: true, you: { hand: ["magicians-rod"], deck: ["thousand-knives", "raigeki"] }, rival: { backrow: ["trap-hole"] } });
		const destroyed = play(hole, summon("magicians-rod"), { type: "spring", zone: 0 });
		expect(destroyed.you.monsters[0]).toBeNull();
		expect(play(destroyed, { type: "ability", zone: 0, pick: "thousand-knives" }).you.hand).toEqual(["thousand-knives"]);
		const veiler = mat({ strict: true, you: { hand: ["magicians-rod"], deck: ["thousand-knives", "raigeki"] }, rival: { hand: ["effect-veiler"] } });
		const negated = play(veiler, summon("magicians-rod"), { type: "hand", card: "effect-veiler", target: 0 });
		expect(reason(negated, { type: "ability", zone: 0, pick: "thousand-knives" })).not.toBe("accepted");
	});
	it("Elemental HERO Gaia must be Fusion Summoned: Monster Reborn cannot bring it back, even after a Fusion Summon", () => {
		const fused = play(mat({ you: { hand: ["polymerization", "monster-reborn"], monsters: ["elemental-hero-sparkman", "elemental-hero-clayman"], extra: ["elemental-hero-gaia"] }, rival: { hand: ["raigeki"] } }), {
			type: "place",
			card: "polymerization",
			row: "backrow",
			zone: 0,
			summon: "elemental-hero-gaia",
			materials: [
				{ from: "field", zone: 0 },
				{ from: "field", zone: 1 },
			],
		});
		const zone = fused.you.monsters.findIndex((slot) => slot?.card === "elemental-hero-gaia");
		const buried: Board = { ...fused, you: { ...fused.you, monsters: fused.you.monsters.map((slot, at) => (at === zone ? null : slot)), graveyard: [...fused.you.graveyard, "elemental-hero-gaia"] } };
		expect(reason(buried, cast("monster-reborn", { grave: { side: "you", index: buried.you.graveyard.length - 1 } }))).toBe("not-properly-summoned");
	});
	it("A Hero Lives has no limit per turn on its card: a second one works once the field is empty again", () => {
		const lives = mat({ you: { hand: ["a-hero-lives", "a-hero-lives"], deck: ["elemental-hero-sparkman", "elemental-hero-avian"] } });
		const first = play(lives, cast("a-hero-lives", { pick: "elemental-hero-sparkman" }));
		const emptied: Board = { ...first, you: { ...first.you, monsters: first.you.monsters.map(() => null) } };
		expect(play(emptied, cast("a-hero-lives", { pick: "elemental-hero-avian" })).you.lp).toBe(1000);
	});
});
