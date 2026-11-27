import { describe, expect, it } from "vitest";
import { breakEffect, CARD_DEFS, type CardDef, cites, type Duel, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { nextTurn as passUntil } from "../rules/continuous-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";
import { blueEyesFixtures } from "./blue-eyes-fixtures";

const card = "maiden-of-white";
const BEWD = "blue-eyes-white-dragon";
const TL = "true-light";

/** Special Summons the first "Blue-Eyes White Dragon" of the hand. */
const summonDragon = (duel: Duel, player: "you" | "rival") => {
	const id = duel.piles[player].hand.find((held) => duel.cards[held]!.code === BEWD);
	return id === undefined ? duel : specialSummon(duel, player, id);
};
const fixtures: Record<string, CardDef> = {
	...blueEyesFixtures,
	// "Target 1 monster on the field" (the opponent's effect that targets), as a Quick-Play Spell.
	"fixture-targeter": { code: "fixture-targeter", kind: "quick-play", effects: [{ type: "activation", target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster], operation: (duel) => duel }] },
	// Normal Spells: "Special Summon 1 Blue-Eyes White Dragon from your hand", and the same followed by "then" something else.
	"fixture-dragon-summoner": { code: "fixture-dragon-summoner", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => summonDragon(duel, link.player) }] },
	// "Special Summon 1 "Blue-Eyes" monster from your hand" that is not Blue-Eyes White Dragon.
	"fixture-other-summoner": { code: "fixture-other-summoner", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => { const id = duel.piles[link.player].hand.find((held) => duel.cards[held]!.code === "fixture-blue-eyes-normal"); return id === undefined ? duel : specialSummon(duel, link.player, id); } }] },
	"fixture-dragon-summoner-then": { code: "fixture-dragon-summoner-then", kind: "spell", effects: [{ type: "activation", operation: (duel, link) => breakEffect(summonDragon(duel, link.player)) }] },
	// A Quick-Play Spell that directly changes ATK (so it can be activated in the Damage Step) and Special Summons the Dragon from the hand: made up.
	"fixture-damage-step-summoner": { code: "fixture-damage-step-summoner", kind: "quick-play", effects: [{ type: "activation", categories: ["change-atk"], operation: (duel, link) => summonDragon(duel, link.player) }] },
	// A Continuous Spell: "neither player can activate Spell/Trap Cards" (card activations only: effects are not stopped).
	"fixture-seal": { code: "fixture-seal", kind: "spell", effects: [{ type: "continuous", range: "field", modifies: () => [{ kind: "lock", what: "activate", who: "both", stops: (_duel, attempt) => attempt.effect.type === "activation" && attempt.def.kind !== "monster" }] }] },
};
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...fixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}, turn: "you" | "rival" = "you") => position({ defs, options, you, rival, turn });
const own = (duel: Duel, label: string) => offered(duel).filter((entry) => entry.startsWith(label));
const find = (duel: Duel, code: string) => Object.values(duel.cards).find((entry) => entry.code === code)!;
const toMain = (duel: Duel, by: number): Duel => {
	let next = passUntil(duel, duel.turn.number + by);
	for (let guard = 0; guard < 20 && next.turn.phase !== "main1"; guard++) next = play(next, "pass");
	return next;
};
const every = { everyWindow: true };

describe("Maiden of White, written as effect records", () => {
	describe("sending itself to place True Light", () => {
		it(`${cites("maiden-of-white", "place")} ${cites("maiden-of-white", "notes-place-hand-or-field")} sends itself from the hand or the field to the GY as its cost, then places 1 "True Light" from the hand, Deck or GY face-up in a Spell & Trap Zone of the player's choice: it is not activated`, () => {
			for (const spec of [{ hand: [card] }, { monsters: [card] }]) {
				const start = board({ ...spec, deck: [TL, "fixture-roar"] });
				expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
				const asked = play(start, `activate ${card}`);
				expect(codes(asked, "you", "graveyard")).toEqual([card]);
				// The zone is the player's choice; the card is placed face-up and not activated: no Chain Link, no activation of it.
				expect(offered(asked)).toEqual(["place 0", "place 1", "place 2", "place 3", "place 4"]);
				const done = play(asked, "place 3");
				expect(find(done, TL)).toMatchObject({ zone: "spell", slot: 3, face: "up", controller: "you" });
				expect(done.activations.map((entry) => entry.card.code)).toEqual([card]);
			}
			// From the hand or the Graveyard as well as the Deck: the player picks which.
			const three = play(board({ hand: [card, TL], graveyard: [TL], deck: [TL] }), `activate ${card}`);
			expect(offered(three)).toEqual(["choose true-light", "choose true-light", "choose true-light"]);
			const choice = play(three, "choose true-light", "place 0");
			expect(codes(choice, "you", "spell")).toEqual([TL]);
		});
		it(`${cites("maiden-of-white", "place")} ${cites("true-light", "notes-effect-in-zone")} the True Light it places face-up then works: its effect Special Summons "Blue-Eyes White Dragon" from the hand, and Maiden in the GY answers that Summon`, () => {
			const start = board({ hand: [card, BEWD], deck: [TL] });
			const placed = play(start, `activate ${card}`, "place 2");
			expect(find(placed, TL)).toMatchObject({ zone: "spell", slot: 2, face: "up" });
			expect(own(placed, `activate ${TL}`)).toEqual([`activate ${TL} :0`]);
			const summoned = play(placed, `activate ${TL} :0`, "place 0");
			expect(codes(summoned, "you", "monster")).toEqual([BEWD]);
			expect(find(summoned, TL)).toMatchObject({ zone: "spell", face: "up" });
			expect(own(summoned, `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("maiden-of-white", "place")} needs a "True Light" in the hand, Deck or GY and a free Spell & Trap Zone to be activated, and not from the Graveyard (a free zone: YGOProJudge only, no source cited)`, () => {
			expect(own(board({ hand: [card] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ graveyard: [card], deck: [TL] }), `activate ${card}`)).toEqual([]);
			expect(own(board({ hand: [card], deck: ["fixture-roar"] }), `activate ${card}`)).toEqual([]);
			const full = ["fixture-other-spell", "fixture-other-spell", "fixture-other-spell", "fixture-other-spell", "fixture-other-spell"];
			expect(own(board({ hand: [card], deck: [TL], set: full }), `activate ${card}`)).toEqual([]);
			expect(own(board({ hand: [card], deck: [TL], set: full.slice(1) }), `activate ${card}`)).toEqual([`activate ${card}`]);
			// Only in the Main Phase with nothing else going on, as an Ignition Effect.
			expect(own(board({ hand: [card], deck: [TL] }, {}, {}, "rival"), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "qa-place-not-activation")} can be used while Spell/Trap Cards cannot be activated: placing a card is not activating it (Konami's Japanese Q&A, OCG only)`, () => {
			const start = board({ hand: [card], deck: [TL], faceupSpells: ["fixture-seal"] });
			// The seal stops activating the Spell/Trap Card True Light, but not this monster's effect.
			expect(own(start, `activate ${card}`)).toEqual([`activate ${card}`]);
			const done = play(start, `activate ${card}`, "place 1");
			expect(find(done, TL)).toMatchObject({ zone: "spell", face: "up" });
			// Set normally, it could not be activated now.
			expect(own(board({ set: [TL], faceupSpells: ["fixture-seal"] }), `activate ${TL}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "once")} can be used once per turn, whichever copy and whether from the hand or the field; the other effects have their own use`, () => {
			const start = board({ hand: [card, card], deck: [TL, TL] });
			const used = play(start, `activate ${card}`, "choose true-light", "place 0");
			expect(own(used, `activate ${card}`)).toEqual([]);
			expect(own(toMain(used, 2), `activate ${card}`)).toEqual([`activate ${card}`]);
		});
	});

	describe("Special Summoning itself from the Graveyard", () => {
		it(`${cites("maiden-of-white", "revive")} ${cites("maiden-of-white", "notes-revive-gy")} can Special Summon itself when you Special Summon "Blue-Eyes White Dragon" while it is in your GY: an optional trigger`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-dragon-summoner", BEWD] });
			const done = play(start, "activate fixture-dragon-summoner");
			expect(offered(done)).toEqual([`activate ${card}`, "pass"]);
			const summoned = play(done, `activate ${card}`, "place 2");
			expect(codes(summoned, "you", "monster").sort()).toEqual([BEWD, card].sort());
			expect(find(summoned, card)).toMatchObject({ zone: "monster", face: "up", slot: 2 });
			// Declined with "pass".
			expect(codes(play(done, "pass"), "you", "graveyard").sort()).toEqual([card, "fixture-dragon-summoner"].sort());
		});
		it(`${cites("maiden-of-white", "revive")} is not offered when it cannot be Special Summoned, e.g. the Dragon's Summon took the last Monster Zone`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-dragon-summoner", BEWD], monsters: ["fixture-normal-4", "fixture-normal-4", "fixture-normal-4", "fixture-normal-4"] });
			const done = play(start, "activate fixture-dragon-summoner");
			expect(codes(done, "you", "monster")).toHaveLength(5);
			expect(own(done, `activate ${card}`)).toEqual([]);
			expect(codes(done, "you", "graveyard")).toContain(card);
		});
		it(`${cites("maiden-of-white", "revive")} triggers on a Special Summon by you of "Blue-Eyes White Dragon" only: not another "Blue-Eyes" monster, not a Normal Summon, not one the opponent makes, and not with it in the hand`, () => {
			const summoner = "fixture-dragon-summoner";
			// Another "Blue-Eyes" monster Special Summoned: no trigger.
			const other = board({ graveyard: [card], hand: ["fixture-other-summoner", "fixture-blue-eyes-normal"] });
			expect(own(play(other, "activate fixture-other-summoner"), `activate ${card}`)).toEqual([]);
			// The opponent Special Summons their own "Blue-Eyes White Dragon": it is not you who Summons it.
			const theirs = board({ graveyard: [card] }, { hand: [summoner, BEWD] }, {}, "rival");
			expect(own(play(theirs, `activate ${summoner}`), `activate ${card}`)).toEqual([]);
			// A Normal (Tribute) Summon: not a Special Summon.
			const normal = board({ graveyard: [card], hand: [BEWD], monsters: ["fixture-normal-4", "fixture-normal-4"] });
			// Both Tributes are the only ones that can be paid: taken without asking.
			expect(own(play(normal, `summon ${BEWD}`, "place 2"), `activate ${card}`)).toEqual([]);
			// Maiden of White in the hand, not the Graveyard.
			expect(own(play(board({ hand: [card, summoner, BEWD] }, {}, {}), `activate ${summoner}`), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "revive")} still triggers when another effect resolves after the Summon ("if" is not "when": it does not miss the timing)`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-dragon-summoner-then", BEWD] });
			expect(offered(play(start, "activate fixture-dragon-summoner-then"))).toEqual([`activate ${card}`, "pass"]);
		});
		it(`${cites("maiden-of-white", "notes-damage-step")} cannot be used when "Blue-Eyes White Dragon" is Special Summoned in the Damage Step, nor afterwards for that Summon`, () => {
			const start = position({ defs, turn: "rival", phase: "battle", options: every, you: { graveyard: [card], monsters: ["fixture-effect-4"], set: ["fixture-damage-step-summoner"], hand: [BEWD] }, rival: { monsters: ["fixture-other-dragon"] } });
			const inStep = toStep(play(start, "attack fixture-other-dragon > fixture-effect-4"), "start");
			const holder = inStep.priority.holder === "you" ? inStep : play(inStep, "pass");
			expect(offered(holder)).toContain("activate fixture-damage-step-summoner");
			const done = play(holder, "activate fixture-damage-step-summoner", "pass", "pass");
			expect(codes(done, "you", "monster")).toContain(BEWD);
			expect(own(done, `activate ${card}`)).toEqual([]);
			// The Damage Step ends: nothing has been kept for it.
			const after = toStep(done, null);
			expect(own(after, `activate ${card}`)).toEqual([]);
			expect(after.waiting).toEqual([]);
		});
		it(`${cites("maiden-of-white", "once")} can Special Summon itself once per turn even if another "Blue-Eyes White Dragon" is Summoned, and its other effects are unaffected`, () => {
			const start = board({ graveyard: [card], hand: ["fixture-dragon-summoner", "fixture-dragon-summoner", BEWD, BEWD] });
			const first = play(start, "activate fixture-dragon-summoner", `activate ${card}`, "place 1");
			const second = play(first, "activate fixture-dragon-summoner");
			expect(own(second, `activate ${card}`)).toEqual([]);
			expect(codes(second, "you", "monster")).toHaveLength(3);
		});
	});

	describe("Special Summoning from the GY in response to being targeted or attacked", () => {
		const graveyard = [BEWD, "fixture-light-tuner", "fixture-light-1", "fixture-dark-tuner", "fixture-blue-eyes-normal"];
		it(`${cites("maiden-of-white", "protect")} ${cites("maiden-of-white", "notes-protect-field")} ${cites("maiden-of-white", "notes-protect-chain")} when a card or effect that targets it on the field is activated, Special Summons 1 "Blue-Eyes White Dragon" or 1 Level 1 LIGHT Tuner from the GY, chained directly to it (Quick Effect)`, () => {
			const start = board({ monsters: [card, "fixture-effect-4"], graveyard }, { hand: ["fixture-targeter"] }, every, "rival");
			const chained = play(start, "activate fixture-targeter > maiden-of-white");
			// Offered as a response; the choice is made when it resolves, among the Dragon and the Level 1 LIGHT Tuners only.
			expect(own(chained, `activate ${card}`)).toEqual([`activate ${card}`]);
			const asked = play(chained, `activate ${card}`);
			// The effect is Chain Link 2: it resolves first, in answer to the targeting one.
			expect(asked.chain.map((link) => link.card.code)).toEqual(["fixture-targeter", card]);
			const resolving = play(asked, "pass", "pass");
			expect(offered(resolving)).toEqual(["choose blue-eyes-white-dragon", "choose fixture-light-tuner"]);
			const done = play(resolving, "choose fixture-light-tuner", "place 4");
			expect(find(done, "fixture-light-tuner")).toMatchObject({ zone: "monster", face: "up", slot: 4 });
			// Not when it is another monster that is targeted.
			const other = play(board({ monsters: [card, "fixture-effect-4"], graveyard }, { hand: ["fixture-targeter"] }, every, "rival"), "activate fixture-targeter > fixture-effect-4");
			expect(own(other, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "notes-protect-own")} can answer an effect of its own player that targets it, once the opponent has not responded`, () => {
			const start = board({ monsters: [card], graveyard, hand: ["fixture-targeter"] }, {}, every);
			const chained = play(start, "activate fixture-targeter > maiden-of-white", "pass");
			expect(own(chained, `activate ${card}`)).toEqual([`activate ${card}`]);
		});
		it(`${cites("maiden-of-white", "notes-protect-chain")} must be chained directly to the targeting activation: not once another card is on top of it, and not when the Maiden is not face-up in the Monster Zone`, () => {
			const start = board({ monsters: [card, "fixture-effect-4"], graveyard, set: ["fixture-targeter"] }, { hand: ["fixture-targeter"] }, every, "rival");
			const first = play(start, "activate fixture-targeter > maiden-of-white");
			expect(own(first, `activate ${card}`)).toEqual([`activate ${card}`]);
			// The player answers with another effect that does not target the Maiden: it is now the link on top, and this effect can no longer be chained directly to the targeting one.
			const second = play(first, "activate fixture-targeter > fixture-effect-4", "pass");
			expect(second.chain).toHaveLength(2);
			expect(own(second, `activate ${card}`)).toEqual([]);
			// Face-down in the Monster Zone, or in the hand: not it.
			expect(own(play(board({ facedown: [card], graveyard }, { hand: ["fixture-targeter"] }, every, "rival"), "activate fixture-targeter > maiden-of-white"), `activate ${card}`)).toEqual([]);
			expect(own(board({ hand: [card], graveyard, monsters: ["fixture-effect-4"] }, { hand: ["fixture-targeter"] }, every, "rival"), `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "notes-protect-attacked")} when it is targeted for an attack, Special Summons from the GY the same way: only for an attack on this card, face-up in the Monster Zone`, () => {
			const start = position({ defs, options: every, turn: "rival", phase: "battle", you: { monsters: [card, "fixture-effect-4"], graveyard }, rival: { monsters: ["fixture-other-dragon"] } });
			const attacked = play(start, "attack fixture-other-dragon > maiden-of-white", "pass");
			expect(own(attacked, `activate ${card}`)).toEqual([`activate ${card}`]);
			const done = play(attacked, `activate ${card}`, "pass", "pass", "choose blue-eyes-white-dragon", "place 2");
			expect(codes(done, "you", "monster")).toContain(BEWD);
			// Another monster attacked, or a direct attack: not this effect.
			const elsewhere = play(position({ defs, options: every, turn: "rival", phase: "battle", you: { monsters: [card, "fixture-effect-4"], graveyard }, rival: { monsters: ["fixture-other-dragon"] } }), "attack fixture-other-dragon > fixture-effect-4", "pass");
			expect(own(elsewhere, `activate ${card}`)).toEqual([]);
			const direct = play(position({ defs, options: every, turn: "rival", phase: "battle", you: { graveyard }, rival: { monsters: ["fixture-other-dragon"] } }), "attack fixture-other-dragon directly", "pass");
			expect(own(direct, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "notes-damage-step")} cannot be used in the Damage Step, even for the attack that targeted it`, () => {
			const start = position({ defs, options: every, turn: "rival", phase: "battle", you: { monsters: [card], graveyard }, rival: { monsters: ["fixture-other-dragon"] } });
			const attacked = play(start, "attack fixture-other-dragon > maiden-of-white", "pass", "pass");
			expect(attacked.battle?.step).toBe("start");
			expect(own(attacked, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "protect")} ${cites("maiden-of-white", "once")} can be used once per turn, whether in answer to a targeting effect or an attack`, () => {
			const start = board({ monsters: [card], graveyard: [BEWD, BEWD, "fixture-light-tuner"] }, { hand: ["fixture-targeter", "fixture-targeter"] }, every, "rival");
			const first = play(start, "activate fixture-targeter > maiden-of-white", `activate ${card}`, "pass", "pass", "choose fixture-light-tuner", "place 1");
			expect(codes(first, "you", "monster").sort()).toEqual([card, "fixture-light-tuner"].sort());
			const second = play(first, "pass");
			expect(own(second, `activate ${card}`)).toEqual([]);
		});
		it(`${cites("maiden-of-white", "protect")} cannot be used when there is nothing in the Graveyard to Special Summon, or no free Monster Zone`, () => {
			const targeted = (you: SideSpec) => play(board(you, { hand: ["fixture-targeter"] }, every, "rival"), "activate fixture-targeter > maiden-of-white");
			expect(own(targeted({ monsters: [card], graveyard: ["fixture-dark-tuner", "fixture-light-1"] }), `activate ${card}`)).toEqual([]);
			expect(own(targeted({ monsters: [card, "fixture-normal-4", "fixture-normal-4", "fixture-normal-4", "fixture-normal-4"], graveyard: [BEWD] }), `activate ${card}`)).toEqual([]);
		});
	});
});
