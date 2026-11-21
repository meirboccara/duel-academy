import { describe, expect, it } from "vitest";
import { apply, atkOf, board, defOf, legalMoves, type Board, type Move, type Setup } from "./engine";

/** Set monsters (face-down Defense Position), Flip Summons, coin tosses, and the cards built on them. Texts in card-art.ts. */
function ok(state: Board, move: Move, forced?: { coin?: boolean }) {
	const result = apply(state, move, forced);
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
const attack = (attacker: number, target: number | "direct"): Move => ({ type: "attack", attacker, target });
const down = (card: string) => ({ card: card as never, position: "defense" as const, faceDown: true });

describe("a Set monster", () => {
	const hand = () => mat({ strict: true, you: { hand: ["pebble-crab", "river-otter", "storm-stag"], deck: ["mud-toad"], monsters: [null, "pocket-cub"] } });
	it("is Normal Set face-down in Defense Position, and uses the turn's Normal Summon", () => {
		const set = ok(hand(), { type: "place", card: "pebble-crab", row: "monsters", zone: 0, set: true });
		expect(set.board.you.monsters[0]).toMatchObject({ card: "pebble-crab", position: "defense", faceDown: true });
		expect(set.events).toEqual([{ type: "set-monster", side: "you", card: "pebble-crab", zone: 0 }]);
		expect(reason(set.board, { type: "place", card: "river-otter", row: "monsters", zone: 2 })).toBe("summon-used");
		const tributed = play(hand(), { type: "place", card: "storm-stag", row: "monsters", zone: 1, set: true, tributes: [1] });
		expect(tributed.you.monsters[1]).toMatchObject({ card: "storm-stag", faceDown: true });
	});
	it("can be Flip Summoned to face-up Attack Position, but not the turn it was Set", () => {
		const set = play(hand(), { type: "place", card: "pebble-crab", row: "monsters", zone: 0, set: true });
		expect(reason(set, { type: "position", zone: 0 })).toBe("just-summoned");
		const later = play(set, { type: "phase", to: "end" }, { type: "phase", to: "end" }, { type: "draw" }, { type: "phase", to: "main1" });
		const flipped = ok(later, { type: "position", zone: 0 });
		expect(flipped.board.you.monsters[0]).toMatchObject({ card: "pebble-crab", position: "attack" });
		expect(flipped.board.you.monsters[0]?.faceDown).toBeUndefined();
		expect(flipped.events).toEqual([{ type: "flipped", side: "you", card: "pebble-crab", how: "summon", zone: 0 }]);
	});
	it("is flipped face-up when attacked, before damage is calculated, and its controller takes no damage when it is destroyed", () => {
		const attacked = ok(mat({ turn: "rival", phase: "battle", you: { monsters: [down("pebble-crab")] }, rival: { monsters: ["shadow-wolf"] } }), attack(0, 0));
		expect(attacked.events.map((event) => event.type)).toEqual(["attack-declared", "flipped", "battle"]);
		expect(attacked.events[0]).toMatchObject({ target: null, hidden: true });
		expect(attacked.board.you.monsters[0]).toBeNull();
		expect(attacked.board.you.lp).toBe(4000);
		const wall = play(mat({ turn: "rival", phase: "battle", you: { monsters: [down("moss-beetle")] }, rival: { monsters: ["iron-boar"] } }), attack(0, 0));
		expect(wall.you.monsters[0]).toMatchObject({ card: "moss-beetle", position: "defense" });
		expect(wall.you.monsters[0]?.faceDown).toBeUndefined();
		expect(wall.rival.lp).toBe(4000 - 300);
	});
	it("cannot attack, has no effect while face-down, and cannot be targeted by a card that says face-up", () => {
		const state = mat({ you: { hand: ["thunder-clap", "spark-trade", "pocket-cub"], monsters: [down("jinzo")] }, rival: { monsters: [down("buster-blader")], backrow: ["mirror-force"] } });
		expect(reason({ ...state, phase: "battle" }, attack(0, 0))).toBe("defense-cannot-attack");
		expect(reason(state, cast("thunder-clap", { target: 0 }))).toBe("no-target");
		/* Tribute to the Doomed says "1 monster on the field": face-down too. */
		expect(play(state, cast("spark-trade", { target: 0, discard: "pocket-cub" })).rival.monsters[0]).toBeNull();
	});
	it("is offered when the moves are listed, and Extra Deck Summons do not use face-down monsters", () => {
		expect(legalMoves(hand())).toContainEqual({ type: "place", card: "pebble-crab", row: "monsters", zone: 0, tributes: [], set: true });
		const tuner = mat({ you: { monsters: ["tune-warrior", down("giant-soldier-of-stone")], extra: ["gaia-knight"] } });
		expect(reason(tuner, { type: "extra", card: "gaia-knight", materials: [0, 1] })).toBe("wrong-materials");
	});
	it("Swords of Revealing Light flips the opponent's face-down monsters face-up when it is activated", () => {
		const swords = play(mat({ you: { hand: ["swords-of-revealing-light"] }, rival: { monsters: [down("iron-boar")] } }), cast("swords-of-revealing-light"));
		expect(swords.rival.monsters[0]?.faceDown).toBeUndefined();
	});
});

describe("cards that turn monsters", () => {
	it("Book of Moon turns a face-up monster face-down; in answer to its attack, the attack ends", () => {
		const own = play(mat({ you: { hand: ["book-of-moon"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), cast("book-of-moon", { target: 0 }));
		expect(own.rival.monsters[0]).toMatchObject({ position: "defense", faceDown: true });
		const set = mat({ turn: "rival", phase: "battle", you: { backrow: ["book-of-moon"], monsters: ["pocket-cub"] }, rival: { monsters: ["blue-eyes-white-dragon"] } });
		const answered = play(set, attack(0, 0), { type: "spring", zone: 0, target: 0 });
		expect(answered.pending).toBeNull();
		expect(answered.you.monsters[0]?.card).toBe("pocket-cub");
		expect(answered.rival.monsters[0]).toMatchObject({ faceDown: true });
	});
	it("Enemy Controller changes the battle position of a face-up monster", () => {
		const turned = play(mat({ you: { hand: ["enemy-controller"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), cast("enemy-controller", { target: 0 }));
		expect(turned.rival.monsters[0]).toMatchObject({ position: "defense" });
		expect(turned.rival.monsters[0]?.faceDown).toBeUndefined();
	});
	it("Shrink halves the original ATK until the end of the turn; Forbidden Chalice gives 400 ATK and negates the effects", () => {
		const small = play(mat({ you: { hand: ["shrink"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), cast("shrink", { target: 0 }));
		expect(atkOf(small.rival.monsters[0]!, small)).toBe(1500);
		expect(atkOf(play(small, { type: "phase", to: "end" }).rival.monsters[0]!, small)).toBe(3000);
		const chalice = play(mat({ you: { hand: ["forbidden-chalice"] }, rival: { hand: ["pocket-cub", "river-otter"], monsters: ["muka-muka"] } }), cast("forbidden-chalice", { target: 0 }));
		expect(atkOf(chalice.rival.monsters[0]!, chalice)).toBe(600 + 400);
		expect(defOf(chalice.rival.monsters[0]!, chalice)).toBe(300);
	});
});

describe("coin tosses", () => {
	it("Time Wizard: called right, every monster of the opponent is destroyed; called wrong, its controller's, with half their ATK as damage", () => {
		const start = mat({ you: { monsters: ["time-wizard", "iron-boar"] }, rival: { monsters: ["blue-eyes-white-dragon", "shadow-wolf"] } });
		const right = ok(start, { type: "ability", zone: 0 }, { coin: true });
		expect(right.board.rival.monsters.some(Boolean)).toBe(false);
		expect(right.events[0]).toEqual({ type: "coin", side: "you", card: "time-wizard", right: true });
		const wrong = ok(start, { type: "ability", zone: 0 }, { coin: false });
		expect(wrong.board.you.monsters.some(Boolean)).toBe(false);
		expect(wrong.board.you.lp).toBe(4000 - (500 + 1700) / 2);
		expect(reason(right.board, { type: "ability", zone: 0 })).toBe("once-per-turn");
	});
	it("is tossed with the duel's own seed: the same board gives the same coin, and the seed moves on", () => {
		const start = mat({ seed: 7, you: { monsters: ["time-wizard"] }, rival: { monsters: ["iron-boar"] } });
		const first = ok(start, { type: "ability", zone: 0 });
		expect(ok(start, { type: "ability", zone: 0 }).events).toEqual(first.events);
		expect(first.board.rng).not.toBe(start.rng);
	});
	it("Dark Time Wizard: right, the opponent's monsters are destroyed and half their original ATK is inflicted; wrong, its controller's monsters are destroyed", () => {
		const start = mat({ you: { hand: ["dark-time-wizard"], monsters: ["iron-boar"] }, rival: { monsters: ["blue-eyes-white-dragon", "pocket-cub"] } });
		const right = ok(start, cast("dark-time-wizard"), { coin: true });
		expect(right.board.rival.monsters.some(Boolean)).toBe(false);
		expect(right.board.rival.lp).toBe(4000 - (3000 + 1200) / 2);
		const wrong = ok(start, cast("dark-time-wizard"), { coin: false });
		expect(wrong.board.you.monsters.some(Boolean)).toBe(false);
		expect(wrong.board.rival.monsters.filter(Boolean)).toHaveLength(2);
	});
});

describe("Dark Magician support", () => {
	it("Dark Magical Curtain: each player Special Summons a DARK Spellcaster from the hand or Deck, and Dark Magician brings a card that mentions it", () => {
		const start = mat({ you: { hand: ["dark-magical-curtain"], deck: ["pocket-cub", "dark-magician", "thousand-knives"] }, rival: { hand: ["pebble-crab"], deck: ["mountain-bison"] } });
		const done = ok(start, cast("dark-magical-curtain"));
		expect(done.board.you.monsters[0]?.card).toBe("dark-magician");
		expect(done.board.rival.monsters[0]?.card).toBe("mountain-bison");
		expect(done.board.you.hand).toEqual(["thousand-knives"]);
		expect(done.board.you.deck).toEqual(["pocket-cub"]);
		expect(reason(mat({ you: { hand: ["dark-magical-curtain"], deck: ["pocket-cub"] } }), cast("dark-magical-curtain"))).toBe("condition-not-met");
	});
	it("Dark Magic Curtain: half the Life Points for Dark Magician from the Deck, and no other Summon that turn, but a Set", () => {
		const start = mat({ strict: true, you: { hand: ["dark-magic-curtain", "pocket-cub"], deck: ["dark-magician"] } });
		const done = play(start, cast("dark-magic-curtain"));
		expect(done.you.lp).toBe(2000);
		expect(done.you.monsters[0]?.card).toBe("dark-magician");
		expect(reason(done, { type: "place", card: "pocket-cub", row: "monsters", zone: 1 })).toBe("summon-locked");
		expect(reason(done, { type: "place", card: "pocket-cub", row: "monsters", zone: 1, set: true })).toBe("accepted");
		const summoned = play(start, { type: "place", card: "pocket-cub", row: "monsters", zone: 1 });
		expect(reason(summoned, cast("dark-magic-curtain"))).toBe("summon-locked");
	});
	it("Sage's Stone needs Dark Magician Girl; Dark Magic Attack needs Dark Magician; Dark Burning Attack needs a Dark Magician Girl monster", () => {
		const stone = mat({ you: { hand: ["sages-stone"], deck: ["dark-magician"], monsters: ["dark-magician-girl"] } });
		expect(play(stone, cast("sages-stone")).you.monsters[1]?.card).toBe("dark-magician");
		expect(reason(mat({ you: { hand: ["sages-stone"], deck: ["dark-magician"] } }), cast("sages-stone"))).toBe("condition-not-met");
		const attackSpell = mat({ you: { hand: ["dark-magic-attack"], monsters: ["dark-magician"] }, rival: { backrow: ["mirror-force", "sticky-vine"] } });
		expect(play(attackSpell, cast("dark-magic-attack")).rival.backrow.some(Boolean)).toBe(false);
		const burning = mat({ you: { hand: ["dark-burning-attack"], monsters: ["dark-magician-girl-the-dragon-knight"] }, rival: { monsters: ["blue-eyes-white-dragon", down("iron-boar")] } });
		const burned = play(burning, cast("dark-burning-attack"));
		expect(burned.rival.monsters.map((slot) => slot?.card ?? null).slice(0, 2)).toEqual([null, "iron-boar"]);
	});
	it("Magician's Valkyria keeps the opponent's attacks away from other face-up Spellcasters", () => {
		const state = mat({ turn: "rival", phase: "battle", you: { monsters: ["magicians-valkyria", "dark-magician-girl", "pocket-cub"] }, rival: { monsters: ["blue-eyes-white-dragon"] } });
		expect(reason(state, attack(0, 1))).toBe("cannot-attack-that");
		expect(reason(state, attack(0, 0))).toBe("accepted");
		expect(reason(state, attack(0, 2))).toBe("accepted");
	});
});

describe("Blue-Eyes and Red-Eyes support", () => {
	it("Blue-Eyes Alternative White Dragon: Special Summoned by revealing Blue-Eyes White Dragon; destroys a monster instead of attacking", () => {
		const start = mat({ strict: true, you: { hand: ["blue-eyes-alternative-white-dragon", "blue-eyes-white-dragon"] }, rival: { monsters: ["iron-boar"] } });
		expect(reason(start, { type: "place", card: "blue-eyes-alternative-white-dragon", row: "monsters", zone: 0 })).toBe("special-only");
		expect(reason(mat({ you: { hand: ["blue-eyes-alternative-white-dragon"] } }), { type: "place", card: "blue-eyes-alternative-white-dragon", row: "monsters", zone: 0, special: true })).toBe("condition-not-met");
		const summoned = play(start, { type: "place", card: "blue-eyes-alternative-white-dragon", row: "monsters", zone: 0, special: true });
		const used = play(summoned, { type: "ability", zone: 0, target: 0 });
		expect(used.rival.monsters[0]).toBeNull();
		expect(reason(play(used, { type: "phase", to: "battle" }), attack(0, "direct"))).toBe("already-attacked");
	});
	it("Burst Stream of Destruction needs Blue-Eyes White Dragon, which then cannot attack; Trade-In discards a Level 8 monster to draw 2", () => {
		const start = mat({ strict: true, you: { hand: ["burst-stream-of-destruction"], monsters: ["blue-eyes-white-dragon"] }, rival: { monsters: ["iron-boar", "shadow-wolf"] } });
		const burst = play(start, cast("burst-stream-of-destruction"), { type: "phase", to: "battle" });
		expect(burst.rival.monsters.some(Boolean)).toBe(false);
		expect(reason(burst, attack(0, "direct"))).toBe("already-attacked");
		const trade = mat({ you: { hand: ["trade-in", "pocket-cub", "blue-eyes-white-dragon"], deck: ["river-otter", "iron-boar"] } });
		expect(reason(trade, cast("trade-in", { discard: "pocket-cub" }))).toBe("cost-needed");
		expect(play(trade, cast("trade-in", { discard: "blue-eyes-white-dragon" })).you.hand).toEqual(["pocket-cub", "river-otter", "iron-boar"]);
	});
	it("Ancient Rules Special Summons a Level 5 or higher Normal Monster from the hand; Silver's Cry a Dragon Normal Monster from its owner's Graveyard", () => {
		const rules = mat({ you: { hand: ["ancient-rules", "blue-eyes-white-dragon", "buster-blader"] } });
		expect(reason(rules, cast("ancient-rules", { pick: "buster-blader" }))).toBe("no-target");
		expect(play(rules, cast("ancient-rules", { pick: "blue-eyes-white-dragon" })).you.monsters[0]?.card).toBe("blue-eyes-white-dragon");
		const cry = mat({ you: { hand: ["silvers-cry"], graveyard: ["iron-boar", "blue-eyes-white-dragon"] } });
		expect(reason(cry, cast("silvers-cry", { grave: { side: "you", index: 0 } }))).toBe("no-target");
		expect(play(cry, cast("silvers-cry", { grave: { side: "you", index: 1 } })).you.monsters[0]?.card).toBe("blue-eyes-white-dragon");
	});
	it("Inferno Fire Blast inflicts Red-Eyes Black Dragon's original ATK, and it cannot attack that turn", () => {
		const blast = play(mat({ strict: true, you: { hand: ["inferno-fire-blast"], monsters: ["red-eyes-black-dragon"] } }), cast("inferno-fire-blast", { target: 0 }), { type: "phase", to: "battle" });
		expect(blast.rival.lp).toBe(4000 - 2400);
		expect(reason(blast, attack(0, "direct"))).toBe("already-attacked");
	});
});

describe("staples", () => {
	it("Smashing Ground destroys the opponent's face-up monster with the highest DEF", () => {
		const smashed = play(mat({ you: { hand: ["smashing-ground"] }, rival: { monsters: ["iron-boar", "moss-beetle", "pocket-cub"] } }), cast("smashing-ground"));
		expect(smashed.rival.monsters.map((slot) => slot?.card ?? null).slice(0, 3)).toEqual(["iron-boar", null, "pocket-cub"]);
	});
	it("Storming Mirror Force returns the attacker's Attack Position monsters to the hand; Widespread Ruin destroys the strongest one", () => {
		const start = (trap: string) => play(mat({ turn: "rival", phase: "battle", you: { backrow: [trap as never] }, rival: { monsters: ["iron-boar", "blue-eyes-white-dragon", { card: "pocket-cub", position: "defense" }] } }), attack(0, "direct"), { type: "spring", zone: 0 });
		const storm = start("storming-mirror-force");
		expect(storm.rival.monsters.filter(Boolean).map((slot) => slot?.card)).toEqual(["pocket-cub"]);
		expect(storm.rival.hand).toEqual(["iron-boar", "blue-eyes-white-dragon"]);
		expect(storm.you.lp).toBe(4000);
		const ruin = start("widespread-ruin");
		expect(ruin.rival.monsters[1]).toBeNull();
		expect(ruin.you.lp).toBe(4000 - 1700);
	});
	it("Rocket Warrior is safe in its controller's Battle Phase, and its target loses 500 ATK", () => {
		const fought = play(mat({ phase: "battle", you: { monsters: ["rocket-warrior"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), attack(0, 0));
		expect(fought.you.monsters[0]?.card).toBe("rocket-warrior");
		expect(fought.you.lp).toBe(4000);
		expect(atkOf(fought.rival.monsters[0]!, fought)).toBe(2500);
	});
});

describe("what the review found", () => {
	it("an attack on a face-down monster says which zone it is aimed at, without naming the monster", () => {
		const attacked = ok(mat({ turn: "rival", phase: "battle", you: { monsters: [null, down("pebble-crab")] }, rival: { monsters: ["shadow-wolf"] } }), attack(0, 1));
		expect(attacked.events[0]).toEqual({ type: "attack-declared", side: "rival", attacker: "shadow-wolf", target: null, hidden: true, zone: 1 });
	});
	it("Silver's Cry is not Set: flipped, it could not be given its Graveyard target", () => {
		expect(reason(mat({ you: { hand: ["silvers-cry"] } }), cast("silvers-cry", { set: true }))).toBe("cannot-set");
	});
	it("Storming Mirror Force does not stop an attacker it did not send back: Rampart Blaster in Defense Position", () => {
		const start = mat({ phase: "battle", you: { monsters: [{ card: "elemental-hero-rampart-blaster", position: "defense" }] }, rival: { backrow: ["storming-mirror-force"] } });
		const after = play(start, attack(0, "direct"), { type: "spring", zone: 0 });
		expect(after.you.monsters[0]?.card).toBe("elemental-hero-rampart-blaster");
		expect(after.rival.lp).toBe(4000 - 1000);
	});
	it("Reinforcements cannot target a face-down monster", () => {
		const start = mat({ turn: "rival", phase: "battle", you: { monsters: [down("pebble-crab")], backrow: ["fog-snare"] }, rival: { monsters: ["shadow-wolf"] } });
		expect(play(start, attack(0, 0)).pending).toBeNull();
	});
});
