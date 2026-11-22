import { describe, expect, it } from "vitest";
import { apply, atkOf, board, defOf, legalMoves, type Board, type Move, type Setup } from "@duel-academy/engine";

/** The effects of the trainers' anime cards, each as printed (texts in card-art.ts). */
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
const cast = (card: Move & { type: "place" } extends infer M ? Partial<M> & { card: string } : never) => ({ type: "place", row: "backrow", zone: 0, ...card }) as Move;
const attack = (attacker: number, target: number | "direct"): Move => ({ type: "attack", attacker, target });

describe("Spells", () => {
	it("Dark Hole destroys every monster on the field; Raigeki only the opponent's", () => {
		const start = mat({ you: { hand: ["dark-hole", "raigeki"], monsters: ["river-otter"] }, rival: { monsters: ["iron-boar", "thorn-fox"] } });
		const hole = play(start, cast({ card: "dark-hole" }));
		expect([...hole.you.monsters, ...hole.rival.monsters].some(Boolean)).toBe(false);
		const bolt = play(start, cast({ card: "raigeki" }));
		expect(bolt.you.monsters[0]?.card).toBe("river-otter");
		expect(bolt.rival.monsters.some(Boolean)).toBe(false);
		expect(reason(mat({ you: { hand: ["dark-hole"] } }), cast({ card: "dark-hole" }))).toBe("nothing-to-hit");
	});
	it("Harpie's Feather Duster clears the opponent's Spells and Traps; Heavy Storm clears both, and Call of the Haunted takes its monster", () => {
		const start = mat({ you: { hand: ["harpies-feather-duster", "heavy-storm"], backrow: [null, "sakuretsu-armor"] }, rival: { backrow: ["sticky-vine", "negate-attack"], field: "mountain" } });
		const duster = play(start, cast({ card: "harpies-feather-duster" }));
		expect(duster.rival.backrow.some(Boolean)).toBe(false);
		expect(duster.rival.field).toBeNull();
		expect(duster.you.backrow[1]?.card).toBe("sakuretsu-armor");
		const haunted = play(mat({ strict: true, you: { hand: ["heavy-storm"], backrow: ["call-of-the-haunted"], graveyard: ["storm-stag"] } }), { type: "spring", zone: 0, grave: { side: "you", index: 0 } });
		const storm = play(haunted, cast({ card: "heavy-storm", zone: 1 }));
		expect(storm.you.monsters[0]).toBeNull();
		expect(storm.you.graveyard).toEqual(["heavy-storm", "call-of-the-haunted", "storm-stag"]);
	});
	it("Hinotama and Ookazi inflict damage", () => {
		const burned = play(mat({ you: { hand: ["hinotama", "ookazi"] } }), cast({ card: "hinotama" }), cast({ card: "ookazi" }));
		expect(burned.rival.lp).toBe(4000 - 500 - 800);
	});
	it("Thousand Knives needs Dark Magician; Soul Taker gives the opponent 1000 LP", () => {
		const knives = mat({ you: { hand: ["thousand-knives"], monsters: ["river-otter"] }, rival: { monsters: ["iron-boar"] } });
		expect(reason(knives, cast({ card: "thousand-knives", target: 0 }))).toBe("condition-not-met");
		const withMagician = mat({ you: { hand: ["thousand-knives"], monsters: ["dark-magician"] }, rival: { monsters: ["iron-boar"] } });
		expect(play(withMagician, cast({ card: "thousand-knives", target: 0 })).rival.monsters[0]).toBeNull();
		const taken = play(mat({ you: { hand: ["soul-taker"] }, rival: { monsters: ["iron-boar"] } }), cast({ card: "soul-taker", target: 0 }));
		expect(taken.rival.monsters[0]).toBeNull();
		expect(taken.rival.lp).toBe(5000);
	});
	it("Swords of Revealing Light stops the opponent's attacks, and is destroyed at the end of their 3rd turn", () => {
		let state = play(mat({ you: { hand: ["swords-of-revealing-light"] }, rival: { monsters: ["iron-boar"] } }), cast({ card: "swords-of-revealing-light" }));
		expect(state.you.backrow[0]).toMatchObject({ open: true, turns: 0 });
		for (let round = 1; round <= 3; round++) {
			state = play(state, { type: "phase", to: "end" });
			expect(reason(state, attack(0, "direct"))).toBe("swords-lock");
			state = play(state, { type: "phase", to: "end" });
		}
		expect(state.you.backrow[0]).toBeNull();
		expect(state.you.graveyard).toEqual(["swords-of-revealing-light"]);
	});
	it("Fusion Sage takes Polymerization from the Deck; The Warrior Returning Alive takes a Warrior from the Graveyard", () => {
		const sage = play(mat({ you: { hand: ["fusion-sage"], deck: ["pocket-cub", "polymerization"] } }), cast({ card: "fusion-sage" }));
		expect(sage.you.hand).toEqual(["polymerization"]);
		expect(reason(mat({ you: { hand: ["fusion-sage"] } }), cast({ card: "fusion-sage" }))).toBe("condition-not-met");
		const back = mat({ you: { hand: ["the-warrior-returning-alive"], graveyard: ["pocket-cub", "masaki"] } });
		expect(reason(back, cast({ card: "the-warrior-returning-alive", grave: { side: "you", index: 0 } }))).toBe("no-target");
		expect(play(back, cast({ card: "the-warrior-returning-alive", grave: { side: "you", index: 1 } })).you.hand).toEqual(["masaki"]);
	});
	it("Pot of Greed needs two cards in the Deck", () => {
		expect(reason(mat({ you: { hand: ["pot-of-greed"], deck: ["pocket-cub"] } }), cast({ card: "pot-of-greed" }))).toBe("deck-too-small");
	});
	it("Umi raises Fish and lowers Machines; Salamandra equips only a FIRE monster", () => {
		const sea = play(mat({ you: { hand: ["umi"], monsters: ["great-white", "x-head-cannon"] } }), { type: "place", card: "umi", row: "field", zone: 0 });
		expect(sea.you.monsters.slice(0, 2).map((slot) => atkOf(slot!, sea))).toEqual([1800, 1600]);
		const fire = mat({ you: { hand: ["salamandra"], monsters: ["river-otter", "flame-swordsman"] } });
		expect(reason(fire, cast({ card: "salamandra", target: 0 }))).toBe("equip-only");
		const equipped = play(fire, cast({ card: "salamandra", target: 1 }));
		expect(atkOf(equipped.you.monsters[1]!, equipped)).toBe(2500);
	});
});

describe("Traps answering an attack", () => {
	const attacked = (trap: string, rival: Setup["rival"] = { monsters: ["iron-boar", "thorn-fox", { card: "pocket-cub", position: "defense" }] }, you: Setup["you"] = {}) =>
		play(mat({ turn: "rival", phase: "battle", you: { backrow: [trap as never], ...you }, rival }), attack(0, "direct"));
	it("Mirror Force destroys every Attack Position monster of the attacker", () => {
		const after = play(attacked("mirror-force"), { type: "spring", zone: 0 });
		expect(after.rival.monsters.filter(Boolean).map((slot) => slot?.card)).toEqual(["pocket-cub"]);
		expect(after.pending).toBeNull();
	});
	it("Magic Cylinder negates the attack and inflicts its ATK", () => {
		const after = play(attacked("magic-cylinder"), { type: "spring", zone: 0 });
		expect([after.you.lp, after.rival.lp]).toEqual([4000, 2300]);
	});
	it("Just Desserts inflicts 500 per monster the opponent controls, and the attack goes on", () => {
		const after = play(attacked("just-desserts"), { type: "spring", zone: 0 });
		expect([after.rival.lp, after.you.lp]).toEqual([2500, 2300]);
	});
	it("Hero Barrier needs a face-up Elemental HERO; Elemental Recharge counts them", () => {
		expect(play(attacked("hero-barrier"), { type: "spring", zone: 0 }).you.lp).toBe(2300);
		const heroes = { monsters: ["elemental-hero-clayman", "elemental-hero-sparkman"] as never[] };
		const stopped = play(play(mat({ turn: "rival", phase: "battle", you: { backrow: ["hero-barrier"], ...heroes }, rival: { monsters: ["iron-boar"] } }), attack(0, 1)), { type: "spring", zone: 0 });
		expect(stopped.you.monsters[1]?.card).toBe("elemental-hero-sparkman");
		const recharged = play(play(mat({ turn: "rival", phase: "battle", you: { backrow: ["elemental-recharge"], ...heroes }, rival: { monsters: ["iron-boar"] } }), attack(0, 0)), { type: "spring", zone: 0 });
		/* 2000 LP for the two HEROes, then the attack goes on: Battle Ox (1700) beats Clayman (800 ATK). */
		expect(recharged.you.lp).toBe(4000 + 2000 - 900);
	});
	it("cannot be flipped while Jinzo is on the field", () => {
		const declared = play(mat({ turn: "rival", phase: "battle", you: { backrow: ["mirror-force"] }, rival: { monsters: ["jinzo"] } }), attack(0, "direct"));
		expect(declared.pending).toBeNull();
		expect(declared.you.lp).toBe(1600);
		expect(reason(mat({ strict: true, you: { backrow: ["call-of-the-haunted"], graveyard: ["pocket-cub"] }, rival: { monsters: ["jinzo"] } }), { type: "spring", zone: 0, grave: { side: "you", index: 0 } })).toBe("jinzo-lock");
	});
});

describe("Monsters", () => {
	it("Dark Magician Girl, Buster Blader, Muka Muka, the Battleguards and Blade Knight gain ATK by what they count", () => {
		const state = mat({ you: { hand: ["pocket-cub", "moss-beetle"], graveyard: ["dark-magician"], monsters: ["dark-magician-girl", "buster-blader", "muka-muka", "lava-battleguard", "swamp-battleguard"] }, rival: { graveyard: ["dark-magician", "blue-eyes-white-dragon"], monsters: ["baby-dragon"] } });
		expect(state.you.monsters.slice(0, 5).map((slot) => atkOf(slot!, state))).toEqual([2600, 3600, 1200, 2050, 2300]);
		expect(defOf(state.you.monsters[2]!, state)).toBe(900);
		const knight = mat({ you: { hand: ["pocket-cub"], monsters: ["blade-knight"] } });
		expect(atkOf(knight.you.monsters[0]!, knight)).toBe(2000);
	});
	it("Obnoxious Celtic Guard is not destroyed by a 1900+ ATK monster; Shield Wing survives two battles a turn; Fortress Warrior's controller takes no battle damage", () => {
		const guard = play(mat({ turn: "rival", phase: "battle", you: { monsters: ["obnoxious-celtic-guard"] }, rival: { monsters: ["vorse-raider"] } }), attack(0, 0));
		expect(guard.you.monsters[0]?.card).toBe("obnoxious-celtic-guard");
		expect(guard.you.lp).toBe(3500);
		const wing = play(mat({ turn: "rival", phase: "battle", you: { monsters: [{ card: "shield-wing", position: "defense" }] }, rival: { monsters: ["iron-boar", "river-otter", "thorn-fox"] } }), attack(0, 0), attack(1, 0), attack(2, 0));
		expect(wing.you.monsters[0]).toBeNull();
		const fortress = play(mat({ turn: "rival", phase: "battle", you: { monsters: ["fortress-warrior"] }, rival: { monsters: ["iron-boar"] } }), attack(0, 0));
		expect(fortress.you.monsters[0]?.card).toBe("fortress-warrior");
		expect(fortress.you.lp).toBe(4000);
	});
	it("Mad Sword Beast inflicts piercing damage; Leghul attacks directly; Hayabusa Knight attacks twice", () => {
		const pierce = play(mat({ phase: "battle", you: { monsters: ["mad-sword-beast"] }, rival: { monsters: [{ card: "pocket-cub", position: "defense" }] } }), attack(0, 0));
		expect(pierce.rival.lp).toBe(4000 - 600);
		const leghul = play(mat({ phase: "battle", you: { monsters: ["leghul"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), attack(0, "direct"));
		expect(leghul.rival.lp).toBe(3700);
		const twice = play(mat({ phase: "battle", you: { monsters: ["hayabusa-knight"] } }), attack(0, "direct"), attack(0, "direct"));
		expect(twice.rival.lp).toBe(2000);
		expect(reason(twice, attack(0, "direct"))).toBe("already-attacked");
	});
	it("Alligator's Sword Dragon attacks directly only past EARTH, WATER or FIRE monsters", () => {
		expect(reason(mat({ phase: "battle", you: { monsters: ["alligators-sword-dragon"] }, rival: { monsters: ["river-otter"] } }), attack(0, "direct"))).toBe("accepted");
		expect(reason(mat({ phase: "battle", you: { monsters: ["alligators-sword-dragon"] }, rival: { monsters: ["blue-eyes-white-dragon"] } }), attack(0, "direct"))).toBe("monster-in-the-way");
	});
	it("Dash Warrior gains 1200 when it attacks; Insect Soldiers of the Sky gains 1000 against a WIND monster", () => {
		expect(play(mat({ phase: "battle", you: { monsters: ["dash-warrior"] } }), attack(0, "direct")).rival.lp).toBe(4000 - 1800);
		const wind = play(mat({ phase: "battle", you: { monsters: ["insect-soldiers-of-the-sky"] }, rival: { monsters: ["lantern-owl"] } }), attack(0, 0));
		expect(wind.rival.monsters[0]).toBeNull();
	});
	it("Skull-Mark Ladybug always gives its 1000 LP, even when something happened after it", () => {
		const tribute = play(mat({ you: { hand: ["storm-stag"], monsters: ["skull-mark-ladybug"] } }), { type: "place", card: "storm-stag", row: "monsters", zone: 0, tributes: [0] });
		expect(tribute.you.lp).toBe(5000);
	});
	it("Bowganian and Legendary Fiend act once in their controller's Standby Phase", () => {
		const start = mat({ strict: true, phase: "draw", turnNumber: 3, you: { deck: ["pocket-cub"], monsters: ["bowganian", "legendary-fiend"] } });
		const standby = play(start, { type: "draw" }, { type: "phase", to: "standby" });
		expect(standby.rival.lp).toBe(3400);
		expect(atkOf(standby.you.monsters[1]!, standby)).toBe(2200);
		const main = play(standby, { type: "phase", to: "main1" });
		expect(main.rival.lp).toBe(3400);
		const skipped = play(start, { type: "draw" }, { type: "phase", to: "main1" });
		expect(skipped.rival.lp).toBe(3400);
	});
	it("Flame Wingman inflicts the ATK of the monster it destroyed", () => {
		const after = play(mat({ phase: "battle", you: { monsters: ["elemental-hero-flame-wingman"] }, rival: { monsters: ["iron-boar"] } }), attack(0, 0));
		expect(after.rival.lp).toBe(4000 - 400 - 1700);
	});
	it("Junk Synchron may revive a Level 2 or lower monster right after its Normal Summon, its effects negated; Junk Warrior gains their ATK", () => {
		const start = mat({ strict: true, you: { hand: ["junk-synchron"], graveyard: ["shield-wing", "storm-stag"], extra: ["junk-warrior", "gaia-knight"] } });
		const summoned = play(start, { type: "place", card: "junk-synchron", row: "monsters", zone: 0 });
		expect(legalMoves(summoned)).toContainEqual({ type: "ability", zone: 0, grave: { side: "you", index: 0 } });
		expect(reason(summoned, { type: "ability", zone: 0, grave: { side: "you", index: 1 } })).toBe("no-target");
		const revived = play(summoned, { type: "ability", zone: 0, grave: { side: "you", index: 0 } });
		expect(revived.you.monsters[1]).toMatchObject({ card: "shield-wing", position: "defense", negated: true });
		expect(reason(play(summoned, { type: "phase", to: "battle" }, { type: "phase", to: "main2" }), { type: "ability", zone: 0, grave: { side: "you", index: 0 } })).not.toBe("accepted");
		const warrior = play(revived, { type: "extra", card: "junk-warrior", materials: [0, 1] });
		expect(atkOf(warrior.you.monsters[0]!, warrior)).toBe(2300);
		const withSmall = mat({ you: { monsters: ["junk-synchron", "fortress-warrior", "unicycular"], extra: ["junk-warrior"] } });
		const gained = play(withSmall, { type: "extra", card: "junk-warrior", materials: [0, 1] });
		expect(atkOf(gained.you.monsters[0]!, gained)).toBe(2300 + 100);
		expect(reason(mat({ you: { monsters: ["tune-warrior", "fortress-warrior"], extra: ["junk-warrior"] } }), { type: "extra", card: "junk-warrior", materials: [0, 1] })).toBe("wrong-materials");
	});
});

describe("what the review found", () => {
	it("a negated monster has no Quick Effect to answer with", () => {
		const state = board({ turn: "rival", phase: "battle", you: { monsters: [{ card: "glint-lynx" }] }, rival: { monsters: ["iron-boar"] } });
		state.you.monsters[0]!.negated = true;
		const declared = play(state, attack(0, 0));
		expect(declared.pending).toBeNull();
	});
	it("a monster that attacked once cannot change its position, even when it may attack again", () => {
		const once = play(mat({ phase: "battle", you: { monsters: ["hayabusa-knight"] } }), attack(0, "direct"), { type: "phase", to: "main2" });
		expect(reason(once, { type: "position", zone: 0 })).toBe("already-attacked");
	});
	it("two copies of a monster each have their own \"once per turn\" battle shield", () => {
		const state = mat({ turn: "rival", phase: "battle", you: { monsters: [{ card: "fortress-warrior", position: "defense" }, { card: "fortress-warrior", position: "defense" }] }, rival: { monsters: ["iron-boar", "river-otter"] } });
		const after = play(state, attack(0, 0), attack(1, 1));
		expect(after.you.monsters.slice(0, 2).every(Boolean)).toBe(true);
	});
});

describe("what the child sees in a battle", () => {
	it("announces a Damage Step bonus before the monsters meet: Dash Warrior shows 600 ATK but fights at 1800", () => {
		const fought = ok(mat({ phase: "battle", you: { monsters: ["dash-warrior"] }, rival: { monsters: ["lesser-dragon"] } }), attack(0, 0));
		const types = fought.events.map((event) => event.type);
		expect(types.indexOf("boosted")).toBeGreaterThan(-1);
		expect(types.indexOf("boosted")).toBeLessThan(types.indexOf("battle"));
		expect(fought.events.find((event) => event.type === "boosted")).toMatchObject({ card: "dash-warrior", amount: 1200, atk: 1800 });
	});
});
