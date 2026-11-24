import { describe, expect, it } from "vitest";
import { act, cardsIn, cites, type Duel, type GameEvent, moveCard, specialSummonTogether } from "../../src";
import { codes, offered, play, position, type SideSpec } from "./fixtures";
import { summonExtrasCards } from "./summon-extras-fixtures";

function board(you: SideSpec, rival: SideSpec = {}, options = {}): { duel: Duel; log: string[] } {
	const log: string[] = [];
	const duel = position({ defs: summonExtrasCards(log), options, you, rival: { ...rival, faceupSpells: [...(rival.faceupSpells ?? []), "spy"] } });
	log.length = 0;
	return { duel, log };
}
const activations = (duel: Duel) => offered(duel).filter((label) => label.startsWith("activate"));
const monster = (duel: Duel, code: string) => cardsIn(duel, "you", "monster").find((card) => card.code === code)!;

/**
 * Monsters Special Summoned at the same time by one effect (`specialSummonTogether`, `askSpecialSummonTogether`,
 * `canSpecialSummonTogether` in src/procedures.ts). Konami's Japanese notes on Sky Striker Ace = Zero and Q&A on Blue-Eyes Spirit
 * Dragon (OCG only), and Blue-Eyes Spirit Dragon's TCG text.
 */
describe("Special Summoning 2 monsters at the same time", () => {
	it(`${cites("rules", "summon-together-needs-both")} the effect is activated only when both can be Special Summoned: both available, no lock on either, and a zone for each once the cost is paid`, () => {
		const deck = ["fixture-ace-a", "fixture-ace-b"];
		expect(activations(board({ monsters: ["fixture-zero"], deck }).duel)).toEqual(["activate fixture-zero"]);
		// One of the two is missing.
		expect(activations(board({ monsters: ["fixture-zero"], deck: ["fixture-ace-a"] }).duel)).toEqual([]);
		// One of the two cannot be Special Summoned.
		expect(activations(board({ monsters: ["fixture-zero"], deck }, { faceupSpells: ["fixture-no-ace-b"] }).duel)).toEqual([]);
		// Zones: the Tributed monster frees its own. With three other monsters two zones are left, with four only one.
		expect(activations(board({ monsters: ["fixture-zero", "lv1", "lv2", "lv3"], deck }).duel)).toEqual(["activate fixture-zero"]);
		expect(activations(board({ monsters: ["fixture-zero", "lv1", "lv2", "lv3", "lv4"], deck }).duel)).toEqual([]);
	});
	it(`${cites("rules", "summon-together-then-destroy")} both arrive together, each in the zone and position its player chooses, as one batch of events; what comes "then" is done afterwards`, () => {
		const { duel, log } = board({ monsters: ["fixture-zero"], set: ["fixture-count-watch"], deck: ["fixture-ace-a", "fixture-ace-b"], graveyard: [] }, { monsters: ["lv8"] });
		const watching = play(duel, "activate fixture-count-watch", "pass");
		log.length = 0;
		const first = play(watching, "activate fixture-zero");
		// The first monster: any free Main Monster Zone, either position.
		expect(offered(first)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
		const second = act(first, { type: "place", zone: 2, position: "defense" });
		// The second: not the zone just given.
		expect(offered(second)).toEqual(["place 0", "place 1", "place 3", "place 4"]);
		const summoned = play(second, "place 4");
		expect(monster(summoned, "fixture-ace-a")).toMatchObject({ slot: 2, position: "defense", face: "up", specialSummoned: true });
		expect(monster(summoned, "fixture-ace-b")).toMatchObject({ slot: 4, position: "attack", face: "up", specialSummoned: true });
		// One group: the lingering operation counted them once, with both already on the field.
		expect(log.filter((line) => line.startsWith("summoned"))).toEqual(["summoned fixture-ace-a special by effect", "summoned with 2 on the field", "summoned fixture-ace-b special by effect"]);
		// (The events are no longer the last thing that happened: the "then" part broke them. The waiting triggers still hold them.)
		const events = summoned.waiting.map((waiting) => waiting.event).filter((event): event is Extract<GameEvent, { type: "summoned" }> => event.type === "summoned");
		expect([events.length, new Set(events.map((event) => event.batch)).size, events.map((event) => event.from)]).toEqual([2, 1, ["deck", "deck"]]);
		// "Then you can destroy 1 card on the field": asked after the Summon; here the opponent's monster.
		expect(offered(summoned)).toContain("choose lv8");
		const done = play(summoned, "choose lv8");
		expect(codes(done, "rival", "graveyard")).toEqual(["lv8"]);
		// Their "if Special Summoned" effects both wait for the same trigger point.
		expect(offered(done)).toEqual(["activate fixture-ace-a", "activate fixture-ace-b"]);
	});
	it(`${cites("rules", "summon-together-both-or-nothing")} when one of them can no longer be Special Summoned as the effect resolves, neither is`, () => {
		const { duel, log } = board({ monsters: ["fixture-zero"], deck: ["fixture-ace-a", "fixture-ace-b"] }, { set: ["fixture-no-ace-b"] }, { everyWindow: true });
		const done = play(duel, "activate fixture-zero", "activate fixture-no-ace-b", "pass", "pass");
		expect([codes(done, "you", "monster"), codes(done, "you", "deck").sort(), codes(done, "you", "graveyard")]).toEqual([[], ["fixture-ace-a", "fixture-ace-b"], ["fixture-zero"]]);
		expect(log.filter((line) => line.startsWith("summoned"))).toEqual([]);
		expect(done.asking).toBeNull();
	});
	it(`${cites("rules", "special-summon-monsters-need-proper")} a Summon of a kind ("Ritual Summon") made together: each monster is properly Summoned only if that is its own procedure, whatever the others are`, () => {
		const { duel } = board({ hand: ["ritual-8", "lv4"] });
		const [ritual, plain] = cardsIn(duel, "you", "hand").map((card) => card.id);
		const done = specialSummonTogether(duel, "you", [{ id: ritual! }, { id: plain! }], { kind: "ritual" });
		expect([monster(done, "ritual-8").proper, monster(done, "lv4").proper]).toEqual([true, false]);
		// Alone, or with another Ritual Monster, it was already so.
		const pair = board({ hand: ["ritual-8", "ritual-8"] }).duel;
		const both = specialSummonTogether(pair, "you", cardsIn(pair, "you", "hand").map((card) => ({ id: card.id })), { kind: "ritual" });
		expect(cardsIn(both, "you", "monster").map((card) => card.proper)).toEqual([true, true]);
	});
	it("with no choice asked: the first zones the monsters may go to, in Attack Position, in one batch", () => {
		const { duel, log } = board({ hand: ["fixture-twin-call", "fixture-ace-a", "fixture-ace-b"], monsters: ["lv1"] });
		const done = play(duel, "activate fixture-twin-call");
		expect([monster(done, "fixture-ace-a").slot, monster(done, "fixture-ace-b").slot]).toEqual([1, 2]);
		expect(log.filter((line) => line.startsWith("summoned") || line.includes("hand>monster"))).toEqual(["moved fixture-ace-a hand>monster", "summoned fixture-ace-a special by effect", "moved fixture-ace-b hand>monster", "summoned fixture-ace-b special by effect"]);
	});
});

describe("\"neither player can Special Summon 2 or more monsters at the same time\"", () => {
	it(`${cites("rules", "summon-together-lock-text")} ${cites("rules", "summon-together-lock")} an effect that must Special Summon 2 monsters at the same time cannot be activated while it applies`, () => {
		const you: SideSpec = { hand: ["fixture-twin-call", "fixture-ace-a", "fixture-ace-b"], monsters: ["fixture-zero"], deck: ["fixture-ace-a", "fixture-ace-b"] };
		expect(activations(board(you).duel)).toEqual(["activate fixture-twin-call", "activate fixture-zero"]);
		expect(activations(board(you, { monsters: ["fixture-one-at-a-time"] }).duel)).toEqual([]);
		// The lock is on both players.
		expect(activations(board({ ...you, monsters: ["fixture-zero", "fixture-one-at-a-time"] }).duel)).toEqual([]);
	});
	it(`${cites("rules", "summon-together-lock-at-resolution")} when it begins to apply in the same chain, the effect Special Summons neither monster`, () => {
		const { duel } = board({ hand: ["fixture-twin-call", "fixture-ace-a", "fixture-ace-b"] }, { hand: ["fixture-one-at-a-time"], set: ["fixture-bring-lock"] });
		const done = play(duel, "activate fixture-twin-call", "activate fixture-bring-lock");
		expect([codes(done, "rival", "monster"), codes(done, "you", "monster"), codes(done, "you", "hand").sort()]).toEqual([["fixture-one-at-a-time"], [], ["fixture-ace-a", "fixture-ace-b"]]);
	});
	it("a Pendulum Summon then Summons one monster only (YGOProJudge only; Konami's Q&A fid 24150 says so of \"as many as possible\" effects)", () => {
		const you: SideSpec = { hand: ["lv4", "lv3"], faceupSpells: ["scale-1", "scale-8"] };
		/** Scales 1 and 8 in your two Pendulum Zones (the leftmost and rightmost Spell & Trap Zones). */
		const scaled = (duel: Duel): Duel => ({ ...moveCard(duel, duel.piles.you.spell[1]!, { zone: "spell", slot: 4 }), live: [], waiting: [] });
		const free = play(scaled(board(you).duel), "pendulum-summon", "choose lv4", "place 0");
		expect(offered(free)).toContain("choose lv3");
		const locked = play(scaled(board(you, { monsters: ["fixture-one-at-a-time"] }).duel), "pendulum-summon", "choose lv4", "place 0");
		expect([locked.asking, codes(locked, "you", "monster"), codes(locked, "you", "hand")]).toEqual([null, ["lv4"], ["lv3"]]);
	});
});
