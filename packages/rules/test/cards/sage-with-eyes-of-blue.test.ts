import { describe, expect, it } from "vitest";
import { addModifier, CARD_DEFS, type CardDef, cites, type Duel, specialSummon, summonByEffect } from "../../src";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "sage-with-eyes-of-blue";
const effectOnly = (duel: Duel) => duel;
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	// A monster unaffected by monster effects: "send it to the GY" is not applied to it.
	"fixture-unaffected-monster": { code: "fixture-unaffected-monster", kind: "monster", facts: { name: "Fixture Unaffected Monster", level: 4, effect: true }, effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects" }] }] },
	// A Normal Spell and a Quick-Play Spell: "Normal Summon 1 monster from your hand" (a Normal Summon an effect performs), and a plain Spell to chain to.
	"fixture-summoner": { code: "fixture-summoner", kind: "spell", effects: [{ type: "activation", operation: (duel, link, index) => { const id = duel.piles[link.player].hand.find((held) => duel.cards[held]!.code === card); return id === undefined ? duel : summonByEffect(duel, index, link.player, id); } }] },
	"fixture-quick-summoner": { code: "fixture-quick-summoner", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link, index) => { const id = duel.piles[link.player].hand.find((held) => duel.cards[held]!.code === card); return id === undefined ? duel : summonByEffect(duel, index, link.player, id); } }] },
	// "Special Summon 1 Sage with Eyes of Blue from your hand."
	"fixture-special-summoner": { code: "fixture-special-summoner", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => { const id = duel.piles[link.player].hand.find((held) => duel.cards[held]!.code === card); return id === undefined ? duel : specialSummon(duel, link.player, id); } }] },
	"fixture-noop-spell": { code: "fixture-noop-spell", kind: "spell", effects: [{ type: "activation", operation: effectOnly }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs, options, you, rival });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const triggers = (duel: Duel) => own(duel, `activate ${card}`);

describe("Sage with Eyes of Blue, written as effect records", () => {
 it(`${cites("ash-blossom-joyous-spring", "qa-discard-while-banished-instead")} its discard can be paid under a GY-to-banish replacement, but the target sent to the GY is banished and no Blue-Eyes is Summoned`, () => {
  const start = board({ hand: [card], monsters: ["fixture-effect-4"], deck: ["fixture-blue-eyes-small"] });
  const replaced = addModifier(start, { affects: () => false, until: Number.MAX_SAFE_INTEGER, layer: { kind: "redirect", from: "graveyard", to: "banished" } });
  const done = play(replaced, `activate ${card} > fixture-effect-4`);
  expect(codes(done, "you", "banished")).toEqual([card, "fixture-effect-4"]);
  expect(codes(done, "you", "monster")).toEqual([]);
  expect(codes(done, "you", "deck")).toEqual(["fixture-blue-eyes-small"]);
 });
	it(`${cites("sage-with-eyes-of-blue", "add-tuner")} ${cites("sage-with-eyes-of-blue", "notes-trigger-field")} when Normal Summoned, can add 1 Level 1 LIGHT Tuner from the Deck to the hand, never another Sage with Eyes of Blue`, () => {
		const start = board({ hand: [card], deck: ["effect-veiler", card, "fixture-light-1", "fixture-dark-tuner", "fixture-normal-4", "fixture-light-tuner"] });
		const summoned = play(start, `summon ${card}`);
		// A trigger effect, put on a chain after the Summon: it is offered, not forced.
		expect(offered(summoned)).toEqual([`activate ${card}`, "pass"]);
		const asked = play(summoned, `activate ${card}`);
		// The other copy of itself, a non-Tuner, a DARK Tuner and a Level 4 monster are not offered.
		expect(offered(asked)).toEqual(["choose effect-veiler", "choose fixture-light-tuner"]);
		const done = play(asked, "choose fixture-light-tuner");
		expect(codes(done, "you", "hand")).toEqual(["fixture-light-tuner"]);
		expect(codes(done, "you", "deck")).toHaveLength(5);
		// Not offered when nothing in the Deck qualifies: an effect that searches needs a card to add.
		const empty = play(board({ hand: [card], deck: [card] }), `summon ${card}`);
		expect(triggers(empty)).toEqual([]);
		// Declined, nothing is added.
		expect(codes(play(summoned, "pass"), "you", "hand")).toEqual([]);
	});
	it(`${cites("rules", "search-needs-a-card")} the Normal Summon trigger cannot be activated with no Level 1 LIGHT Tuner (other than Sage) in the Deck`, () => {
		expect(triggers(play(board({ hand: [card], deck: [card, "fixture-light-1", "fixture-dark-tuner", "fixture-normal-4"] }), `summon ${card}`))).toEqual([]);
		expect(triggers(play(board({ hand: [card], deck: ["fixture-light-tuner"] }), `summon ${card}`))).toEqual([`activate ${card}`]);
	});
	it(`${cites("sage-with-eyes-of-blue", "discard-send-summon")} the discard effect is not offered while no "Blue-Eyes" monster in the Deck can be Special Summoned, so Sage, the target and the use are not lost for nothing`, () => {
		expect(own(board({ hand: [card], monsters: ["fixture-effect-4"], deck: ["fixture-other-dragon", "effect-veiler"] }), `activate ${card}`)).toEqual([]);
		expect(own(board({ hand: [card], monsters: ["fixture-effect-4"], deck: ["fixture-blue-eyes-small"] }), `activate ${card}`)).toEqual([`activate ${card} > fixture-effect-4`]);
	});
	it(`${cites("sage-with-eyes-of-blue", "notes-trigger-field")} triggers only when this card is Normal Summoned: not when it is Special Summoned, and not when Set`, () => {
		const set = play(board({ hand: [card], deck: ["effect-veiler"] }), `set ${card}`);
		expect(triggers(set)).toEqual([]);
		// Special Summoned by a made-up effect: it is on the field, and the trigger does not come.
		const special = play(board({ hand: [card, "fixture-special-summoner"], deck: ["effect-veiler"] }), "activate fixture-special-summoner");
		expect(codes(special, "you", "monster")).toEqual([card]);
		expect(triggers(special)).toEqual([]);
	});
	it(`${cites("sage-with-eyes-of-blue", "notes-just-after-summon")} can be activated only right after the Summon succeeds: a Normal Summon performed at Chain Link 1 is followed by the trigger, one performed at Chain Link 2 or later is not`, () => {
		const options = { everyWindow: true };
		// Chain Link 1: the Summon's window opens when the chain has resolved, and the trigger comes after it.
		const first = board({ hand: ["fixture-summoner", card], deck: ["effect-veiler"] }, {}, options);
		// The Summon is made when the chain has resolved (zone chosen), then both players pass its window.
		const link1 = play(first, "activate fixture-summoner", "pass", "pass", "place 0", "pass", "pass");
		expect(codes(link1, "you", "monster")).toEqual([card]);
		expect(own(link1, `activate ${card}`)).toEqual([`activate ${card}`]);
		// Chain Link 2: the Summon succeeds while the chain resolves, then another link resolves: the timing is missed.
		const second = board({ hand: ["fixture-noop-spell", "fixture-quick-summoner", card], deck: ["effect-veiler"] }, {}, options);
		const resolved = play(second, "activate fixture-noop-spell", "pass", "activate fixture-quick-summoner", "pass", "pass", "place 0");
		expect(codes(resolved, "you", "monster")).toEqual([card]);
		expect(own(resolved, `activate ${card}`)).toEqual([]);
		expect(own(play(resolved, "pass"), `activate ${card}`)).toEqual([]);
	});
	it(`${cites("sage-with-eyes-of-blue", "discard-send-summon")} ${cites("sage-with-eyes-of-blue", "notes-hand-ignition")} ${cites("sage-with-eyes-of-blue", "notes-target-at-activation")} discards itself as its cost, targets 1 face-up Effect Monster you control, sends it to the GY, and if you do Special Summons 1 "Blue-Eyes" monster from the Deck, to the zone and position the player chooses`, () => {
		const start = board({
			hand: [card],
			monsters: ["fixture-effect-4", "fixture-normal-4", "effect-veiler"],
			facedown: ["fixture-effect-4"],
			deck: ["blue-eyes-white-dragon", "fixture-blue-eyes-effect", "fixture-other-dragon", "fixture-blue-eyes-small"],
		}, { monsters: ["fixture-effect-4"] });
		// Effect Monsters you control that are face-up: not the Normal Monster, not the face-down one, not the opponent's.
		expect(own(start, `activate ${card}`)).toEqual([`activate ${card} > effect-veiler`, `activate ${card} > fixture-effect-4`]);
		const asked = play(start, `activate ${card} > fixture-effect-4`);
		expect(codes(asked, "you", "graveyard").sort()).toEqual(["fixture-effect-4", card].sort());
		// Chosen when it resolves, among the "Blue-Eyes" monsters of the Deck.
		expect(offered(asked)).toEqual(["choose blue-eyes-white-dragon", "choose fixture-blue-eyes-effect", "choose fixture-blue-eyes-small"]);
		const placed = play(asked, "choose blue-eyes-white-dragon");
		// The zone the target left (0) and the one never used (4); the others are taken.
		expect(offered(placed)).toEqual(["place 0", "place 4"]);
		const done = play(placed, "place 4");
		expect(codes(done, "you", "graveyard").sort()).toEqual([card, "fixture-effect-4"].sort());
		const dragon = Object.values(done.cards).find((entry) => entry.code === "blue-eyes-white-dragon")!;
		expect(dragon).toMatchObject({ zone: "monster", face: "up", controller: "you", specialSummoned: true });
		// Only from the hand, in the Main Phase with nothing on the chain: not from the field, not in the opponent's turn.
		expect(own(board({ monsters: [card, "fixture-effect-4"], deck: ["blue-eyes-white-dragon"] }), `activate ${card}`)).toEqual([]);
		expect(own(board({ graveyard: [card], monsters: ["fixture-effect-4"], deck: ["blue-eyes-white-dragon"] }), `activate ${card}`)).toEqual([]);
		expect(own(position({ defs, turn: "rival", you: { hand: [card], monsters: ["fixture-effect-4"], deck: ["blue-eyes-white-dragon"] } }), `activate ${card}`)).toEqual([]);
		// Needs an Effect Monster of yours to target.
		expect(own(board({ hand: [card], monsters: ["fixture-normal-4"], deck: ["blue-eyes-white-dragon"] }), `activate ${card}`)).toEqual([]);
	});
	it(`${cites("sage-with-eyes-of-blue", "notes-send-then-summon")} Special Summons nothing when the target is not sent to the GY (a monster unaffected by monster effects), though the card was discarded and the effect was activated`, () => {
		const start = board({ hand: [card], monsters: ["fixture-unaffected-monster"], deck: ["blue-eyes-white-dragon"] });
		const done = play(start, `activate ${card} > fixture-unaffected-monster`);
		expect(done.asking).toBeNull();
		expect(codes(done, "you", "monster")).toEqual(["fixture-unaffected-monster"]);
		expect(codes(done, "you", "graveyard")).toEqual([card]);
		expect(codes(done, "you", "deck")).toEqual(["blue-eyes-white-dragon"]);
	});
	it(`${cites("sage-with-eyes-of-blue", "notes-simultaneous")} Summons into the zone the target left when the Monster Zones were full (the core reads the send and the Summon as one step of the effect) and is not activated when there is no "Blue-Eyes" monster in the Deck`, () => {
		const full = board({ hand: [card], monsters: ["fixture-effect-4", "fixture-normal-4", "fixture-normal-4", "fixture-normal-4", "fixture-normal-4"], deck: ["blue-eyes-white-dragon"] });
		const done = play(full, `activate ${card} > fixture-effect-4`, "place 0");
		expect(codes(done, "you", "monster")).toHaveLength(5);
		expect(codes(done, "you", "monster")).toContain("blue-eyes-white-dragon");
		expect(codes(done, "you", "graveyard")).toContain("fixture-effect-4");
		// With no "Blue-Eyes" monster in the Deck the effect is not activated at all (see the test above), so nothing is lost.
		expect(own(board({ hand: [card], monsters: ["fixture-effect-4"], deck: ["fixture-other-dragon"] }), `activate ${card}`)).toEqual([]);
	});
	it(`${cites("sage-with-eyes-of-blue", "once")} limits only the discard effect to once per turn, whichever copy uses it (YGOProJudge only: the text's "this effect" is read as the effect before it); the Normal Summon trigger can be used again by another copy`, () => {
		const start = board({ hand: [card, card], monsters: ["fixture-effect-4"], faceupSpells: ["mausoleum-of-white"], deck: ["blue-eyes-white-dragon", "effect-veiler", "effect-veiler"] });
		const used = play(start, `activate ${card} > fixture-effect-4`, "place 0");
		// The other copy cannot use its discard effect this turn, even with a target.
		expect(own(used, `activate ${card}`)).toEqual([]);
		// The Normal Summon trigger has no limit: the turn's Normal Summon and the additional one of Mausoleum of White each trigger it.
		const first = play(start, `summon ${card}`, `activate ${card}`, "choose effect-veiler");
		const second = play(first, `summon ${card} additional`);
		expect(triggers(second)).toEqual([`activate ${card}`]);
	});
});
