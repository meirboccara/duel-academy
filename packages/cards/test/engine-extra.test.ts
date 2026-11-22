import { describe, expect, it } from "vitest";
import { apply, atkOf, board, defOf, type Board, type Material, type Move, type Setup } from "@duel-academy/engine";

/** The Extra Deck monsters of the starter Decks, each as printed (texts in card-art.ts). */
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
const field = (zone: number): Material => ({ from: "field", zone });
const fuse = (summon: string, ...materials: Material[]): Move => ({ type: "place", card: "polymerization", row: "backrow", zone: 0, summon: summon as never, materials });
const attack = (attacker: number, target: number | "direct"): Move => ({ type: "attack", attacker, target });

describe("the Dark Magician Extra Deck", () => {
	it("Dark Magician the Dragon Knight: Dark Magician + 1 Dragon; its name becomes Dark Magician; the opponent cannot destroy its owner's Spells and Traps", () => {
		const fused = play(mat({ you: { hand: ["polymerization", "thousand-knives"], monsters: ["dark-magician", "curse-of-dragon"], extra: ["dark-magician-the-dragon-knight"] }, rival: { monsters: ["iron-boar"] } }), fuse("dark-magician-the-dragon-knight", field(0), field(1)));
		expect(fused.you.monsters[0]?.card).toBe("dark-magician-the-dragon-knight");
		expect(reason(mat({ you: { hand: ["polymerization"], monsters: ["dark-magician", "river-otter"], extra: ["dark-magician-the-dragon-knight"] } }), fuse("dark-magician-the-dragon-knight", field(0), field(1)))).toBe("wrong-materials");
		/* "Thousand Knives: If you control 'Dark Magician'". */
		expect(play(fused, { type: "place", card: "thousand-knives", row: "backrow", zone: 1, target: 0 }).rival.monsters[0]).toBeNull();
		const guarded = mat({ turn: "rival", you: { monsters: ["dark-magician-the-dragon-knight"], backrow: ["sakuretsu-armor"] }, rival: { hand: ["harpies-feather-duster"] } });
		expect(reason(guarded, { type: "place", card: "harpies-feather-duster", row: "backrow", zone: 0 })).toBe("nothing-to-hit");
	});
	it("Dark Magician Girl the Dragon Knight: once per turn, send 1 card from the hand to the GY to destroy a face-up monster, also in answer", () => {
		const knight = mat({ you: { hand: ["pocket-cub", "river-otter"], monsters: ["dark-magician-girl-the-dragon-knight"] }, rival: { monsters: ["shadow-wolf"] } });
		expect(reason(knight, { type: "ability", zone: 0, target: 0 })).toBe("cost-needed");
		const used = ok(knight, { type: "ability", zone: 0, target: 0, discard: "pocket-cub" });
		expect(used.board.rival.monsters[0]).toBeNull();
		expect(used.board.you.graveyard).toEqual(["pocket-cub"]);
		const again = mat({ you: { hand: ["pocket-cub", "river-otter"], monsters: ["dark-magician-girl-the-dragon-knight"] }, rival: { monsters: ["shadow-wolf", "iron-boar"] } });
		expect(reason(play(again, { type: "ability", zone: 0, target: 0, discard: "pocket-cub" }), { type: "ability", zone: 0, target: 1, discard: "river-otter" })).toBe("once-per-turn");
		const answered = play(mat({ turn: "rival", phase: "battle", you: { hand: ["pocket-cub"], monsters: ["dark-magician-girl-the-dragon-knight"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), attack(0, 0));
		expect(answered.pending).toMatchObject({ kind: "attack" });
		expect(play(answered, { type: "ability", zone: 0, target: 0, discard: "pocket-cub" }).rival.monsters[0]).toBeNull();
	});
	it("Dark Paladin: gains 500 ATK per Dragon on the field and in the GYs, and negates a Spell by discarding a card", () => {
		const state = mat({ you: { graveyard: ["blue-eyes-white-dragon"], monsters: ["dark-paladin"] }, rival: { monsters: ["baby-dragon"] } });
		expect(atkOf(state.you.monsters[0]!, state)).toBe(2900 + 1000);
		const cast = play(mat({ turn: "rival", you: { hand: ["pocket-cub"], monsters: ["dark-paladin"] }, rival: { hand: ["raigeki"], monsters: ["iron-boar"] } }), { type: "place", card: "raigeki", row: "backrow", zone: 0 });
		expect(cast.pending).toMatchObject({ kind: "spell", card: "raigeki" });
		const negated = ok(cast, { type: "ability", zone: 0, discard: "pocket-cub" });
		expect(negated.board.you.monsters[0]?.card).toBe("dark-paladin");
		expect(negated.board.rival.graveyard).toEqual(["raigeki"]);
		expect(negated.events.some((event) => event.type === "negated")).toBe(true);
	});
	it("Black Skull Dragon and Gaia Dragon, the Thunder Charger: a Fusion and a Rank 7 Xyz that pierces", () => {
		const skull = play(mat({ you: { hand: ["polymerization"], monsters: ["summoned-skull", "red-eyes-black-dragon"], extra: ["black-skull-dragon"] } }), fuse("black-skull-dragon", field(0), field(1)));
		expect(skull.you.monsters[0]?.card).toBe("black-skull-dragon");
		const gaia = play(mat({ phase: "main1", you: { monsters: ["dark-magician", "red-eyes-black-dragon"], extra: ["gaia-dragon-the-thunder-charger"] }, rival: { monsters: [{ card: "pocket-cub", position: "defense" }] } }), { type: "extra", card: "gaia-dragon-the-thunder-charger", materials: [0, 1] }, { type: "phase", to: "battle" }, attack(0, 0));
		expect(gaia.rival.lp).toBe(4000 - (2600 - 800));
	});
});

describe("the Blue-Eyes Extra Deck", () => {
	it("Blue-Eyes Twin Burst Dragon: is not destroyed by battle, attacks two monsters, and banishes a monster it did not destroy", () => {
		const twin = play(mat({ you: { hand: ["polymerization"], monsters: ["blue-eyes-white-dragon", "blue-eyes-white-dragon"], extra: ["blue-eyes-twin-burst-dragon"] } }), fuse("blue-eyes-twin-burst-dragon", field(0), field(1)));
		expect(twin.you.monsters[0]?.card).toBe("blue-eyes-twin-burst-dragon");
		const battle = mat({ phase: "battle", you: { monsters: ["blue-eyes-twin-burst-dragon"] }, rival: { monsters: ["iron-boar", { card: "pocket-cub", position: "defense" }, "blue-eyes-ultimate-dragon"] } });
		const two = play(battle, attack(0, 0), attack(0, 1));
		expect(two.rival.monsters.slice(0, 2).every((slot) => slot === null)).toBe(true);
		expect(reason(two, attack(0, 2))).toBe("already-attacked");
		const strong = play(battle, attack(0, 2));
		expect(strong.you.monsters[0]?.card).toBe("blue-eyes-twin-burst-dragon");
		expect(strong.rival.monsters[2]).toBeNull();
		expect(strong.rival.banished.map((item) => item.card)).toEqual(["blue-eyes-ultimate-dragon"]);
		expect(reason(play(mat({ phase: "battle", you: { monsters: ["blue-eyes-twin-burst-dragon"] }, rival: { monsters: ["iron-boar"] } }), attack(0, 0)), attack(0, "direct"))).toBe("already-attacked");
	});
	it("Blue-Eyes Spirit Dragon: 1 Tuner + Blue-Eyes non-Tuners; no Summon of 2 monsters at once; negates an opponent's Graveyard effect once per turn", () => {
		expect(reason(mat({ you: { monsters: ["flamvell-guard", "tri-horned-dragon"], extra: ["blue-eyes-spirit-dragon"] } }), { type: "extra", card: "blue-eyes-spirit-dragon", materials: [0, 1] })).toBe("wrong-materials");
		const spirit = play(mat({ you: { monsters: ["flamvell-guard", "blue-eyes-white-dragon"], extra: ["blue-eyes-spirit-dragon"] } }), { type: "extra", card: "blue-eyes-spirit-dragon", materials: [0, 1] });
		expect(spirit.you.monsters[0]?.card).toBe("blue-eyes-spirit-dragon");
		const scales = mat({ turn: "rival", you: { monsters: ["blue-eyes-spirit-dragon"] }, rival: { hand: ["storm-stag", "river-otter"], backrow: [null, null, null, null, null] } });
		scales.rival.backrow[0] = { card: "mandragon", setThisTurn: false, up: true };
		scales.rival.backrow[4] = { card: "flash-knight", setThisTurn: false, up: true };
		expect(reason(scales, { type: "pendulum", cards: ["storm-stag", "river-otter"] })).toBe("one-at-a-time");
		expect(reason(scales, { type: "pendulum", cards: ["storm-stag"] })).toBe("accepted");
		const bee = play(mat({ turn: "rival", phase: "battle", you: { monsters: ["blue-eyes-spirit-dragon"] }, rival: { monsters: ["busy-bee"] } }), attack(0, 0));
		expect(bee.you.lp).toBe(4000);
	});
});

describe("the Elemental HERO Extra Deck", () => {
	it("Shining Flare Wingman: Flame Wingman + Sparkman; 300 ATK per Elemental HERO in its owner's GY; burns like Flame Wingman", () => {
		const fused = play(mat({ you: { hand: ["polymerization"], graveyard: ["elemental-hero-avian"], monsters: ["elemental-hero-flame-wingman", "elemental-hero-sparkman"], extra: ["elemental-hero-shining-flare-wingman"] } }), fuse("elemental-hero-shining-flare-wingman", field(0), field(1)));
		const wingman = fused.you.monsters[0]!;
		expect(atkOf(wingman, fused)).toBe(2500 + 300 * 3);
		const burned = play({ ...fused, phase: "battle", rival: { ...fused.rival, monsters: [{ card: "iron-boar", position: "attack", attacked: false, summoned: false, moved: false, boost: 0 }, null, null, null, null, null] } }, attack(0, 0));
		expect(burned.rival.lp).toBe(4000 - (3400 - 1700) - 1700);
	});
	it("Thunder Giant: once per turn, discard 1 to destroy a face-up monster with less original ATK", () => {
		const giant = mat({ you: { hand: ["pocket-cub", "river-otter"], monsters: ["elemental-hero-thunder-giant"] }, rival: { monsters: ["blue-eyes-white-dragon", "iron-boar"] } });
		expect(reason(giant, { type: "ability", zone: 0, target: 0, discard: "pocket-cub" })).toBe("condition-not-met");
		expect(play(giant, { type: "ability", zone: 0, target: 1, discard: "pocket-cub" }).rival.monsters[1]).toBeNull();
	});
	it("Great Tornado halves the opponent's monsters when Fusion Summoned; Nova Master draws when it destroys a monster", () => {
		const tornado = play(mat({ you: { hand: ["polymerization"], monsters: ["elemental-hero-clayman", "elemental-hero-avian"], extra: ["elemental-hero-great-tornado"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), fuse("elemental-hero-great-tornado", field(0), field(1)));
		const dragon = tornado.rival.monsters[0]!;
		expect([atkOf(dragon, tornado), defOf(dragon, tornado)]).toEqual([1500, 1250]);
		const nova = play(mat({ phase: "battle", you: { deck: ["pocket-cub"], monsters: ["elemental-hero-nova-master"] }, rival: { monsters: ["iron-boar"] } }), attack(0, 0));
		expect(nova.you.hand).toEqual(["pocket-cub"]);
	});
	it("Rampart Blaster attacks from Defense Position when the opponent has no monster, its ATK halved", () => {
		const wall = mat({ phase: "battle", you: { monsters: [{ card: "elemental-hero-rampart-blaster", position: "defense" }] } });
		expect(play(wall, attack(0, "direct")).rival.lp).toBe(4000 - 1000);
		expect(reason(mat({ phase: "battle", you: { monsters: [{ card: "elemental-hero-rampart-blaster", position: "defense" }] }, rival: { monsters: ["pocket-cub"] } }), attack(0, 0))).toBe("defense-cannot-attack");
	});
});

describe("what the review found", () => {
	it("Spirit Dragon's Tribute needs a LIGHT Dragon Synchro Monster in the Extra Deck, other than itself", () => {
		const state = mat({ turn: "rival", phase: "battle", you: { monsters: [{ card: "blue-eyes-spirit-dragon", position: "defense" }], backrow: ["sakuretsu-armor"], extra: ["blue-eyes-spirit-dragon", "gaia-knight"] }, rival: { monsters: ["blue-eyes-ultimate-dragon"] } });
		state.proper.push("you:blue-eyes-spirit-dragon");
		const declared = play(state, attack(0, 0));
		expect(declared.pending).toMatchObject({ kind: "attack" });
		expect(reason(declared, { type: "ability", zone: 0 })).toBe("condition-not-met");
	});
	it("Nova Master's draw from an empty Deck loses the Duel", () => {
		const after = play(mat({ phase: "battle", you: { monsters: ["elemental-hero-nova-master"] }, rival: { monsters: ["iron-boar"] } }), attack(0, 0));
		expect(after.winner).toBe("rival");
	});
});

