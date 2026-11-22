import { describe, expect, it } from "vitest";
import { apply, atkOf, board, legalMoves, type Board, type Move, type Setup } from "@duel-academy/engine";

/** Cards whose effects are written as data, from the shared vocabulary (effects.ts). Texts in card-art.ts. */
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
const summon = (card: string, zone = 0) => ({ type: "place", card, row: "monsters", zone, tributes: [] }) as Move;
const use = (card: string, effect: number, extra: Record<string, unknown> = {}) => ({ type: "effect", card, effect, ...extra }) as Move;

describe("Spells written as data", () => {
	it("Terraforming adds the Field Spell chosen, and only a Field Spell", () => {
		const start = mat({ you: { hand: ["terraforming"], deck: ["umi", "pot-of-greed", "forest"] } });
		expect(reason(start, cast("terraforming", { pick: "pot-of-greed" }))).toBe("no-target");
		expect(play(start, cast("terraforming", { pick: "forest" })).you.hand).toEqual(["forest"]);
		const picks = legalMoves(start).flatMap((move) => (move.type === "place" && move.pick ? [move.pick] : []));
		expect(picks.sort()).toEqual(["forest", "umi"]);
	});
	it("Foolish Burial sends the monster chosen from the Deck to the Graveyard", () => {
		const done = play(mat({ you: { hand: ["foolish-burial"], deck: ["iron-boar", "pot-of-greed"] } }), cast("foolish-burial", { pick: "iron-boar" }));
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["iron-boar", "foolish-burial"]));
		expect(done.you.deck).toEqual(["pot-of-greed"]);
	});
	it("One for One: send a monster from the hand to the GY; Special Summon a Level 1 monster from the hand or Deck", () => {
		const start = mat({ you: { hand: ["one-for-one", "iron-boar", "pot-of-greed"], deck: ["sage-with-eyes-of-blue", "celtic-guardian"] } });
		expect(reason(start, cast("one-for-one", { discard: "pot-of-greed", pick: "sage-with-eyes-of-blue" }))).toBe("cost-needed");
		expect(reason(start, cast("one-for-one", { discard: "iron-boar", pick: "celtic-guardian" }))).toBe("no-target");
		const done = play(start, cast("one-for-one", { discard: "iron-boar", pick: "sage-with-eyes-of-blue" }));
		expect(done.you.monsters[0]?.card).toBe("sage-with-eyes-of-blue");
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["iron-boar", "one-for-one"]));
	});
	it("Toon Table of Contents adds a card whose name says Toon", () => {
		const start = mat({ you: { hand: ["toon-table-of-contents"], deck: ["toon-alligator", "iron-boar"] } });
		expect(reason(start, cast("toon-table-of-contents", { pick: "iron-boar" }))).toBe("no-target");
		expect(play(start, cast("toon-table-of-contents", { pick: "toon-alligator" })).you.hand).toEqual(["toon-alligator"]);
	});
	it("Ash Blossom judges a data Spell by what it does: it negates Terraforming, not One for One from the hand", () => {
		const start = mat({ you: { hand: ["terraforming"], deck: ["umi"] }, rival: { hand: ["ash-blossom-joyous-spring"] } });
		const negated = play(start, cast("terraforming", { pick: "umi" }), { type: "hand", card: "ash-blossom-joyous-spring" });
		expect(negated.you.hand).toEqual([]);
	});
});

describe("monsters written as data", () => {
	const blue = (you: Setup["you"] = {}, rival: Setup["rival"] = {}) =>
		mat({ you: { hand: ["sage-with-eyes-of-blue"], deck: ["the-white-stone-of-legend", "blue-eyes-white-dragon", "effect-veiler", "iron-boar"], ...you }, rival });
	it("Sage with Eyes of Blue: when Normal Summoned, you can add a Level 1 LIGHT Tuner, now and only now", () => {
		const summoned = play(blue(), summon("sage-with-eyes-of-blue"));
		expect(summoned.triggered).toEqual([{ side: "you", card: "sage-with-eyes-of-blue", effect: 0, zone: 0 }]);
		const picks = legalMoves(summoned).flatMap((move) => (move.type === "effect" && move.pick ? [move.pick] : []));
		expect(picks.sort()).toEqual(["effect-veiler", "the-white-stone-of-legend"]);
		expect(play(summoned, use("sage-with-eyes-of-blue", 0, { zone: 0, pick: "the-white-stone-of-legend" })).you.hand).toEqual(["the-white-stone-of-legend"]);
		/* Something else first: the moment is gone. */
		const later = play(summoned, { type: "phase", to: "battle" });
		expect(reason(later, use("sage-with-eyes-of-blue", 0, { zone: 0, pick: "the-white-stone-of-legend" }))).toBe("nothing-to-answer");
	});
	it("Sage's other effect: discard it, send an Effect Monster you control to the GY, then Special Summon a Blue-Eyes from the Deck; once per turn", () => {
		const start = blue({ hand: ["sage-with-eyes-of-blue", "sage-with-eyes-of-blue"], monsters: ["elemental-hero-blazeman"] });
		expect(reason(start, use("sage-with-eyes-of-blue", 1, { target: 0, pick: "iron-boar" }))).toBe("no-target");
		const done = play(start, use("sage-with-eyes-of-blue", 1, { target: 0, pick: "blue-eyes-white-dragon" }));
		expect(done.you.monsters.some((slot) => slot?.card === "blue-eyes-white-dragon")).toBe(true);
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["sage-with-eyes-of-blue", "elemental-hero-blazeman"]));
		expect(reason(done, use("sage-with-eyes-of-blue", 1, { target: 0, pick: "blue-eyes-white-dragon" }))).toBe("once-per-turn");
	});
	it("The White Stone of Legend: sent to the GY, it adds Blue-Eyes White Dragon by itself", () => {
		const done = play(mat({ you: { hand: ["foolish-burial"], deck: ["the-white-stone-of-legend", "blue-eyes-white-dragon"] } }), cast("foolish-burial", { pick: "the-white-stone-of-legend" }));
		expect(done.you.hand).toEqual(["blue-eyes-white-dragon"]);
		expect(done.you.graveyard).toEqual(expect.arrayContaining(["the-white-stone-of-legend"]));
	});
	it("Destiny HERO - Malicious: banished from the GY to Special Summon another copy from the Deck", () => {
		const start = mat({ you: { graveyard: ["destiny-hero-malicious"], deck: ["destiny-hero-malicious", "iron-boar"] } });
		const done = play(start, use("destiny-hero-malicious", 0, { pick: "destiny-hero-malicious" }));
		expect(done.you.monsters[0]?.card).toBe("destiny-hero-malicious");
		expect(done.you.banished).toEqual([{ card: "destiny-hero-malicious", faceDown: false }]);
		expect(done.you.graveyard).toEqual([]);
		expect(reason(mat({ strict: true, phase: "battle", you: { graveyard: ["destiny-hero-malicious"], deck: ["destiny-hero-malicious"] } }), use("destiny-hero-malicious", 0, { pick: "destiny-hero-malicious" }))).not.toBe("accepted");
	});
	it("Elemental HERO Shadow Mist: sent to the GY, you can add a HERO monster; only 1 of its effects per turn", () => {
		const start = mat({ you: { hand: ["foolish-burial", "foolish-burial"], deck: ["elemental-hero-shadow-mist", "elemental-hero-sparkman", "iron-boar"] } });
		const milled = play(start, cast("foolish-burial", { pick: "elemental-hero-shadow-mist" }));
		expect(milled.triggered).toEqual([{ side: "you", card: "elemental-hero-shadow-mist", effect: 1 }]);
		expect(reason(milled, use("elemental-hero-shadow-mist", 1, { pick: "iron-boar" }))).toBe("no-target");
		expect(play(milled, use("elemental-hero-shadow-mist", 1, { pick: "elemental-hero-sparkman" })).you.hand).toContain("elemental-hero-sparkman");
	});
	it("Ash Blossom negates a monster's data effect that adds from the Deck; Ghost Ogre destroys the monster on the field", () => {
		const summoned = play(blue({}, { hand: ["ash-blossom-joyous-spring", "ghost-ogre-snow-rabbit"] }), summon("sage-with-eyes-of-blue"));
		const used = ok(summoned, use("sage-with-eyes-of-blue", 0, { zone: 0, pick: "the-white-stone-of-legend" }));
		expect(used.board.pending).toMatchObject({ kind: "effect", card: "sage-with-eyes-of-blue" });
		const negated = play(used.board, { type: "hand", card: "ash-blossom-joyous-spring" });
		expect(negated.you.hand).toEqual([]);
		const ogred = play(used.board, { type: "hand", card: "ghost-ogre-snow-rabbit" });
		expect(ogred.you.monsters[0]).toBeNull();
		expect(ogred.you.hand).toEqual(["the-white-stone-of-legend"]);
	});
});

describe("filters by Type and Level, Flip Summons, and sending the card itself", () => {
	it("Fossil Dig adds a Level 6 or lower Dinosaur monster, nothing else", () => {
		const start = mat({ you: { hand: ["fossil-dig"], deck: ["two-headed-king-rex", "iron-boar", "bracchio-raidus"] } });
		expect(reason(start, cast("fossil-dig", { pick: "iron-boar" }))).toBe("no-target");
		expect(play(start, cast("fossil-dig", { pick: "two-headed-king-rex" })).you.hand).toEqual(["two-headed-king-rex"]);
	});
	it("Summoner's Art adds a Level 5 or higher Normal Monster", () => {
		const start = mat({ you: { hand: ["summoners-art"], deck: ["iron-boar", "blue-eyes-white-dragon"] } });
		expect(reason(start, cast("summoners-art", { pick: "iron-boar" }))).toBe("no-target");
		expect(play(start, cast("summoners-art", { pick: "blue-eyes-white-dragon" })).you.hand).toEqual(["blue-eyes-white-dragon"]);
	});
	it("Armageddon Knight: when Summoned, a Flip Summon too, you can send a DARK monster from the Deck to the GY", () => {
		const normal = play(mat({ you: { hand: ["armageddon-knight"], deck: ["dark-magician", "iron-boar"] } }), summon("armageddon-knight"));
		expect(play(normal, use("armageddon-knight", 0, { zone: 0, pick: "dark-magician" })).you.graveyard).toEqual(["dark-magician"]);
		const flipped = play(mat({ you: { monsters: [{ card: "armageddon-knight", faceDown: true }], deck: ["dark-magician"] } }), { type: "position", zone: 0 });
		expect(flipped.triggered).toEqual([{ side: "you", card: "armageddon-knight", effect: 0, zone: 0 }]);
		expect(reason(normal, use("armageddon-knight", 0, { zone: 0, pick: "iron-boar" }))).toBe("no-target");
	});
	it("Black Dragon's Chick: send it from the field to the GY; Special Summon Red-Eyes B. Dragon from the hand", () => {
		const start = mat({ you: { hand: ["red-eyes-black-dragon"], monsters: ["black-dragons-chick"] } });
		const done = play(start, use("black-dragons-chick", 0, { zone: 0, pick: "red-eyes-black-dragon" }));
		expect(done.you.monsters.some((slot) => slot?.card === "red-eyes-black-dragon")).toBe(true);
		expect(done.you.graveyard).toEqual(["black-dragons-chick"]);
	});
});

describe("conditions, a second Summon of the same name, locks for the rest of the turn, and a Spell's effect from the GY", () => {
	const flute = (you: Setup["you"] = {}, rival: Setup["rival"] = {}) =>
		mat({ you: { hand: ["the-guiding-flute-of-summoning-dragons", "monster-reborn"], deck: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "iron-boar"], graveyard: ["celtic-guardian"], ...you }, rival });
	it("The Guiding Flute of Summoning Dragons needs a Spellcaster on the field", () => {
		expect(reason(flute(), cast("the-guiding-flute-of-summoning-dragons", { pick: "blue-eyes-white-dragon" }))).toBe("condition-not-met");
		expect(reason(flute({ monsters: ["dark-magician"] }), cast("the-guiding-flute-of-summoning-dragons", { pick: "iron-boar" }))).toBe("no-target");
	});
	it("Special Summons a Level 5 or higher Dragon, a second one of the same name when the opponent has 2 monsters, then only Dragons and Spellcasters", () => {
		const one = play(flute({ monsters: ["dark-magician"] }, { monsters: ["mud-toad"] }), cast("the-guiding-flute-of-summoning-dragons", { pick: "blue-eyes-white-dragon" }));
		expect(one.you.monsters.filter((slot) => slot?.card === "blue-eyes-white-dragon")).toHaveLength(1);
		const two = play(flute({ monsters: ["dark-magician"] }, { monsters: ["mud-toad", "iron-boar"] }), cast("the-guiding-flute-of-summoning-dragons", { pick: "blue-eyes-white-dragon" }));
		expect(two.you.monsters.filter((slot) => slot?.card === "blue-eyes-white-dragon")).toHaveLength(2);
		expect(reason(two, cast("monster-reborn", { zone: 1, grave: { side: "you", index: 0 } }))).toBe("card-locked");
	});
	it("from the GY in Main Phase 2, the turn it was sent there: banish it to draw 1 card", () => {
		const used = play(flute({ monsters: ["dark-magician"] }), cast("the-guiding-flute-of-summoning-dragons", { pick: "blue-eyes-white-dragon" }));
		const draw = use("the-guiding-flute-of-summoning-dragons", 0);
		expect(reason(used, draw)).toBe("condition-not-met");
		const later = play(used, { type: "phase", to: "battle" }, { type: "phase", to: "main2" });
		const drawn = play(later, draw);
		expect(drawn.you.banished).toEqual([{ card: "the-guiding-flute-of-summoning-dragons", faceDown: false }]);
		expect(drawn.you.hand).toHaveLength(2);
	});
});

describe("effects that watch other cards", () => {
	it("Kaibaman the Legend: when Summoned, show 3 Blue-Eyes White Dragon to Special Summon one", () => {
		const shown = play(mat({ you: { hand: ["kaibaman-the-legend", "blue-eyes-white-dragon"], deck: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"] } }), summon("kaibaman-the-legend"));
		const called = play(shown, use("kaibaman-the-legend", 0, { zone: 0, pick: "blue-eyes-white-dragon" }));
		expect(called.you.monsters.filter((slot) => slot?.card === "blue-eyes-white-dragon")).toHaveLength(1);
		const two = play(mat({ you: { hand: ["kaibaman-the-legend"], deck: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"] } }), summon("kaibaman-the-legend"));
		expect(reason(two, use("kaibaman-the-legend", 0, { zone: 0, pick: "blue-eyes-white-dragon" }))).toBe("condition-not-met");
	});
	it("Kaibaman the Legend: in the GY when you Special Summon Blue-Eyes White Dragon, banish it to add a Blue-Eyes monster", () => {
		const start = mat({ you: { hand: ["monster-reborn"], graveyard: ["kaibaman-the-legend", "blue-eyes-white-dragon"], deck: ["sage-with-eyes-of-blue", "blue-eyes-alternative-white-dragon"] } });
		const reborn = play(start, cast("monster-reborn", { grave: { side: "you", index: 1 } }));
		expect(reborn.triggered).toEqual([{ side: "you", card: "kaibaman-the-legend", effect: 1, about: "blue-eyes-white-dragon" }]);
		/* "Sage with Eyes of Blue" is not a "Blue-Eyes" card: its name does not say so. */
		expect(reason(reborn, use("kaibaman-the-legend", 1, { pick: "sage-with-eyes-of-blue" }))).toBe("no-target");
		const done = play(reborn, use("kaibaman-the-legend", 1, { pick: "blue-eyes-alternative-white-dragon" }));
		expect(done.you.hand).toEqual(["blue-eyes-alternative-white-dragon"]);
		expect(done.you.banished).toEqual([{ card: "kaibaman-the-legend", faceDown: false }]);
	});
	it("Deep-Eyes White Dragon, the Blue Abyss: discard it to add a Level 1 LIGHT Tuner", () => {
		const done = play(mat({ you: { hand: ["deep-eyes-white-dragon-the-blue-abyss"], deck: ["effect-veiler", "iron-boar"] } }), use("deep-eyes-white-dragon-the-blue-abyss", 0, { pick: "effect-veiler" }));
		expect(done.you.hand).toEqual(["effect-veiler"]);
		expect(done.you.graveyard).toEqual(["deep-eyes-white-dragon-the-blue-abyss"]);
	});
	it("Deep-Eyes: when Blue-Eyes White Dragon is sent to the GY, it comes from the hand with that ATK, and is banished when it leaves", () => {
		const sent = play(mat({ you: { hand: ["foolish-burial", "deep-eyes-white-dragon-the-blue-abyss"], deck: ["blue-eyes-white-dragon"] } }), cast("foolish-burial", { pick: "blue-eyes-white-dragon" }));
		expect(sent.triggered).toEqual([{ side: "you", card: "deep-eyes-white-dragon-the-blue-abyss", effect: 1, about: "blue-eyes-white-dragon" }]);
		const done = ok(sent, use("deep-eyes-white-dragon-the-blue-abyss", 1));
		const slot = done.board.you.monsters.find((held) => held?.card === "deep-eyes-white-dragon-the-blue-abyss");
		expect(slot && atkOf(slot, done.board)).toBe(3000);
		expect(slot?.banishOnLeave).toBe(true);
	});
	it("Deep-Eyes: from the GY too, but not when Blue-Eyes is destroyed in the Damage Step", () => {
		const fromGy = play(mat({ you: { hand: ["foolish-burial"], graveyard: ["deep-eyes-white-dragon-the-blue-abyss"], deck: ["blue-eyes-white-dragon"] } }), cast("foolish-burial", { pick: "blue-eyes-white-dragon" }));
		expect(fromGy.triggered).toHaveLength(1);
		const battle = mat({ phase: "battle", you: { hand: ["deep-eyes-white-dragon-the-blue-abyss"], monsters: ["blue-eyes-white-dragon"] }, rival: { monsters: ["blue-eyes-ultimate-dragon"] } });
		expect(play(battle, { type: "attack", attacker: 0, target: 0 }).triggered).toEqual([]);
	});
});

describe("Blue-Eyes White Dragon, the White Phantom Beast", () => {
	const PHANTOM = "blue-eyes-white-dragon-the-white-phantom-beast";
	it("added from the Deck, it Special Summons itself; then it destroys the opponent's monsters, and only Blue-Eyes attack directly", () => {
		const start = mat({ you: { hand: ["monster-reborn"], graveyard: ["kaibaman-the-legend", "blue-eyes-white-dragon"], deck: [PHANTOM], monsters: [null, null, "iron-boar"] }, rival: { monsters: ["mud-toad", "celtic-guardian"] } });
		const reborn = play(start, cast("monster-reborn", { grave: { side: "you", index: 1 } }));
		const added = play(reborn, use("kaibaman-the-legend", 1, { pick: PHANTOM }));
		expect(added.triggered).toEqual([{ side: "you", card: PHANTOM, effect: 0, about: PHANTOM }]);
		const called = play(added, use(PHANTOM, 0));
		const at = called.you.monsters.findIndex((slot) => slot?.card === PHANTOM);
		expect(called.triggered).toEqual([{ side: "you", card: PHANTOM, effect: 1, zone: at }]);
		const cleared = play(called, use(PHANTOM, 1, { zone: at }));
		expect(cleared.rival.monsters.some(Boolean)).toBe(false);
		const battle = play(cleared, { type: "phase", to: "battle" });
		expect(reason(battle, { type: "attack", attacker: 2, target: "direct" })).toBe("card-locked");
		expect(reason(battle, { type: "attack", attacker: at, target: "direct" })).toBe("accepted");
	});
	it("when a monster its owner controls is destroyed by battle, it comes from the hand", () => {
		const start = mat({ turn: "rival", phase: "battle", you: { hand: [PHANTOM], monsters: ["iron-boar"] }, rival: { monsters: ["blue-eyes-ultimate-dragon"] } });
		const done = play(start, { type: "attack", attacker: 0, target: 0 });
		expect(done.you.monsters.some((slot) => slot?.card === PHANTOM)).toBe(true);
	});
	it("Quick Effect: when a Spell targets it, discard 1 card to negate that effect", () => {
		const start = mat({ turn: "rival", you: { hand: ["mud-toad"], monsters: [PHANTOM] }, rival: { hand: ["thunder-clap"] } });
		const aimed = ok(start, cast("thunder-clap", { target: 0 }));
		expect(aimed.board.pending).toMatchObject({ kind: "spell", card: "thunder-clap" });
		expect(reason(aimed.board, use(PHANTOM, 2, { zone: 0 }))).toBe("cost-needed");
		const saved = play(aimed.board, use(PHANTOM, 2, { zone: 0, discard: "mud-toad" }));
		expect(saved.you.monsters[0]?.card).toBe(PHANTOM);
		expect(saved.you.graveyard).toEqual(["mud-toad"]);
	});
});

