import { describe, expect, it } from "vitest";
import { atk, canBeBanished, type CardDef, canSpecialSummon, cites, type Duel, moveCard, moveCards, other, specialSummon } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { gapCards } from "./blue-eyes-gap-fixtures";

const board = (you: SideSpec, rival: SideSpec = {}, turn: "you" | "rival" = "you"): Duel => position({ defs: gapCards(), turn, you, rival });
const idOf = (duel: Duel, code: string): number => Object.values(duel.cards).find((card) => card.code === code)!.id;

/** Small mechanics the Extra Deck cards of the exact Blue-Eyes list need; made-up cards with the printed wording of each. */
describe("a number of targets read from the board", () => {
	it(`${cites("rules", "target-count-from-the-board")} "up to the number of Normal Monsters in your GY +1": the combinations offered follow the count at activation`, () => {
		const set = ["fixture-trap", "fixture-spell", "fixture-trap"];
		const none = board({ hand: ["fixture-storm"] }, { set });
		expect(offered(none).filter((name) => name.startsWith("activate"))).toHaveLength(3);
		const one = board({ hand: ["fixture-storm"], graveyard: ["fixture-plain"] }, { set });
		// One Normal Monster in the GY: up to 2 targets (3 single targets and 3 pairs).
		expect(offered(one).filter((name) => name.startsWith("activate"))).toHaveLength(6);
		const done = play(one, "activate fixture-storm > fixture-trap > fixture-spell", "pass");
		expect(codes(done, "rival", "graveyard").sort()).toEqual(["fixture-spell", "fixture-trap"]);
		const two = board({ hand: ["fixture-storm"], graveyard: ["fixture-plain", "fixture-white", "fixture-abyss"] }, { set });
		expect(offered(two).filter((name) => name.startsWith("activate"))).toHaveLength(7);
	});
});

describe('"unaffected by your opponent\'s activated effects"', () => {
	it(`${cites("rules", "unaffected-by-activated-effects-text")} an effect the opponent activated is not applied to it; an effect it activated itself, or its controller's, is`, () => {
		const duel = board({ monsters: ["fixture-punisher"], hand: ["fixture-weaken"] }, { hand: ["fixture-smite", "fixture-weaken"] }, "rival");
		const punisher = idOf(duel, "fixture-punisher");
		expect(codes(play(duel, "activate fixture-smite > fixture-punisher", "pass"), "you", "monster")).toEqual(["fixture-punisher"]);
		expect(atk(play(duel, "activate fixture-weaken > fixture-punisher", "pass"), punisher)).toBe(3500);
		const mine = board({ monsters: ["fixture-punisher"], hand: ["fixture-weaken"] });
		expect(atk(play(mine, "activate fixture-weaken > fixture-punisher"), idOf(mine, "fixture-punisher"))).toBe(2500);
	});
	it(`${cites("rules", "unaffected-by-activated-effects-text")} an effect of the opponent that is not activated (a Continuous Effect) still applies to it`, () => {
		const duel = board({ monsters: ["fixture-punisher"] }, { faceupSpells: ["fixture-curse"] });
		expect(atk(duel, idOf(duel, "fixture-punisher"))).toBe(3000);
	});
});

describe('"your opponent cannot banish cards from your GY"', () => {
	it(`${cites("rules", "opponent-cannot-banish-text")} the opponent's effect cannot target a card of that GY to banish it, and banishes none; its controller still can`, () => {
		const duel = board({ monsters: ["fixture-guardian"], graveyard: ["fixture-plain"], hand: ["fixture-crow"] }, { hand: ["fixture-crow"], graveyard: ["fixture-white"] });
		const mine = idOf(duel, "fixture-plain");
		expect([canBeBanished(duel, mine, "rival"), canBeBanished(duel, mine, "you"), canBeBanished(duel, idOf(duel, "fixture-white"), "you")]).toEqual([false, true, true]);
		expect(offered(duel).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-crow > fixture-plain", "activate fixture-crow > fixture-white"]);
		const theirs = { ...duel, turn: { ...duel.turn, player: "rival" as const }, priority: { holder: "rival" as const, passed: [], open: true } };
		expect(offered(theirs).filter((name) => name.startsWith("activate"))).toEqual(["activate fixture-crow > fixture-white"]);
		// A move the opponent's effect would do anyway is not done; the controller's own effect banishes.
		const by = { card: duel.cards[duel.piles.rival.hand[0]!]!, player: "rival" as const, effect: 0 };
		expect(moveCard(duel, mine, { zone: "banished", effect: by }).cards[mine]!.zone).toBe("graveyard");
		expect(moveCard(duel, mine, { zone: "banished", effect: { ...by, player: "you" } }).cards[mine]!.zone).toBe("banished");
	});
	it(`${cites("rules", "opponent-cannot-banish-text")} a cost is the banishment of the player who pays it: the opponent cannot pay with a card of that GY, its controller can`, () => {
		const log: string[] = [];
		const defs: Record<string, CardDef> = {
			...gapCards(),
			// A Quick-Play Spell: "Banish 1 card from either GY; [log]." The cost asks first (`canBeBanished`), and names who pays.
			"fixture-grave-tax": { code: "fixture-grave-tax", kind: "quick-play", effects: [{ type: "activation", cost: { pick: (duel, { player }) => [...duel.piles[player].graveyard, ...duel.piles[other(player)].graveyard].filter((id) => canBeBanished(duel, id, player)).map((id) => [id]), pay: (duel, { player }, picked) => moveCards(duel, picked, { zone: "banished", player }) }, operation: (duel) => (log.push("fixture-grave-tax"), duel) }] },
		};
		const duel = position({ defs, you: { monsters: ["fixture-guardian"], graveyard: ["fixture-plain"], hand: ["fixture-grave-tax"] }, rival: { hand: ["fixture-grave-tax"], graveyard: ["fixture-white"] } });
		const taxes = (seen: Duel) => offered(seen).filter((name) => name.startsWith("activate"));
		expect(taxes(duel)).toEqual(["activate fixture-grave-tax ~ fixture-plain", "activate fixture-grave-tax ~ fixture-white"]);
		expect(codes(play(duel, "activate fixture-grave-tax ~ fixture-plain"), "you", "banished")).toEqual(["fixture-plain"]);
		const theirs = { ...duel, turn: { ...duel.turn, player: "rival" as const }, priority: { holder: "rival" as const, passed: [], open: true } };
		expect(taxes(theirs)).toEqual(["activate fixture-grave-tax ~ fixture-white"]);
		// A cost that did not ask is not paid with that card either: the move names its player and is not done.
		const mine = idOf(duel, "fixture-plain");
		expect([moveCards(duel, [mine], { zone: "banished", player: "rival" }).cards[mine]!.zone, moveCards(duel, [mine], { zone: "banished", player: "you" }).cards[mine]!.zone]).toEqual(["graveyard", "banished"]);
	});
	it(`${cites("rules", "opponent-cannot-banish-text")} a banishment that names nobody is stopped while the lock applies: who banishes must be said to be allowed`, () => {
		const duel = board({ monsters: ["fixture-guardian"], graveyard: ["fixture-plain"] }, { graveyard: ["fixture-white"] });
		const [mine, theirs] = [idOf(duel, "fixture-plain"), idOf(duel, "fixture-white")];
		expect([canBeBanished(duel, mine), canBeBanished(duel, theirs)]).toEqual([false, true]);
		expect([moveCard(duel, mine, { zone: "banished" }).cards[mine]!.zone, moveCard(duel, theirs, { zone: "banished" }).cards[theirs]!.zone]).toEqual(["graveyard", "banished"]);
		// With no such lock, nobody needs to be named.
		const free = board({ graveyard: ["fixture-plain"] });
		expect(moveCard(free, idOf(free, "fixture-plain"), { zone: "banished" }).cards[idOf(free, "fixture-plain")]!.zone).toBe("banished");
	});
	it(`${cites("rules", "opponent-cannot-banish-text")} once the monster is gone the opponent can banish from that GY again`, () => {
		const duel = board({ graveyard: ["fixture-plain"] }, { hand: ["fixture-crow"] }, "rival");
		expect(offered(duel)).toContain("activate fixture-crow > fixture-plain");
	});
});

describe('"Must be Synchro Summoned"', () => {
	it(`${cites("rules", "must-be-synchro-summoned-text")} even after a proper Synchro Summon, no other effect Special Summons it from the GY; a Synchro Monster without that sentence can be`, () => {
		const duel = board({ extra: ["fixture-must-synchro", "fixture-synchro"] });
		const must = idOf(duel, "fixture-must-synchro");
		const plain = idOf(duel, "fixture-synchro");
		const buried = [must, plain].reduce((next, id) => moveCard(specialSummon(next, "you", id, { kind: "synchro" }), id, { zone: "graveyard" }), duel);
		expect([buried.cards[must]!.proper, buried.cards[plain]!.proper]).toEqual([true, true]);
		expect([canSpecialSummon(buried, "you", must), canSpecialSummon(buried, "you", plain)]).toEqual([false, true]);
		expect(specialSummon(buried, "you", must).cards[must]!.zone).toBe("graveyard");
	});
	it(`${cites("rules", "treated-as-a-synchro-summon-text")} a Special Summon from the Extra Deck that "is treated as a Synchro Summon" Summons it, properly; a plain Special Summon from there does not`, () => {
		const duel = board({ extra: ["fixture-must-synchro"] });
		const must = idOf(duel, "fixture-must-synchro");
		expect([canSpecialSummon(duel, "you", must), canSpecialSummon(duel, "you", must, "synchro")]).toEqual([false, true]);
		const summoned = specialSummon(duel, "you", must, { kind: "synchro" });
		expect(summoned.cards[must]).toMatchObject({ zone: "monster", proper: true, summonedBy: "synchro" });
	});
});
