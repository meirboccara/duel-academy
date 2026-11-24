import { describe, expect, it } from "vitest";
import { CARD_DEFS, type CardDef, cites, createRng, type Duel, revealedNow } from "../../src";
import { blueEyesFixtures } from "./blue-eyes-fixtures";
import { codes, offered, play, position, type SideSpec } from "../rules/fixtures";

const card = "bingo-machine-go";
const defs: Record<string, CardDef> = { ...CARD_DEFS, ...blueEyesFixtures };
const board = (you: SideSpec, rival: SideSpec = {}, options = {}) => position({ defs, options, you, rival });
const activations = (duel: Duel) => offered(duel).filter((label) => label.startsWith(`activate ${card}`));
/** The same position with another seed for the Duel's RNG (the random pick and the shuffle). */
const reseed = (duel: Duel, seed: number): Duel => ({ ...duel, rng: { seed, state: createRng(seed).state } });
/** Chooses the 3 cards to reveal, by code, one after another. */
const chosen = (duel: Duel, ...cards: string[]) => play(duel, ...cards.map((code) => `choose ${code}`));
const ids = (duel: Duel, code: string) => Object.values(duel.cards).filter((entry) => entry.code === code).map((entry) => entry.id);

describe("Bingo Machine, Go!!!, written as an effect record", () => {
	it(`${cites("bingo-machine-go", "reveal")} can be activated only with 3 cards in the Deck that meet a criterion, and the player chooses the 3 (YGOProJudge only for the minimum of 3)`, () => {
		const two = board({ hand: [card], deck: ["blue-eyes-white-dragon", "fixture-roar", "fixture-other-dragon"] });
		expect(activations(two)).toEqual([]);
		const four = board({ hand: [card], deck: ["blue-eyes-white-dragon", "fixture-blue-eyes-normal", "fixture-roar", "fixture-ultimate-trap", "fixture-other-dragon"] });
		expect(activations(four)).toEqual([`activate ${card}`]);
		// The first choice is among the 4 that meet a criterion; the Deck's other card is never offered.
		const asked = play(four, `activate ${card}`);
		expect(offered(asked)).toEqual(["choose blue-eyes-white-dragon", "choose fixture-blue-eyes-normal", "choose fixture-roar", "choose fixture-ultimate-trap"]);
		// The third choice ends the resolution (reveal, pick, add, shuffle): one card in the hand, the 2 others and the one never shown in the Deck.
		const revealed = chosen(asked, "blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap");
		expect(revealed.asking).toBeNull();
		expect(codes(revealed, "you", "hand")).toHaveLength(1);
	});
	it(`${cites("bingo-machine-go", "reveal")} lets the 3 cards be a mix of the two criteria and copies of one card (YGOProJudge only: the text asks for no different names)`, () => {
		const start = board({ hand: [card], deck: ["blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon", "fixture-roar"] });
		const asked = play(start, `activate ${card}`);
		const done = chosen(asked, "blue-eyes-white-dragon", "blue-eyes-white-dragon", "blue-eyes-white-dragon");
		expect(codes(done, "you", "hand")).toHaveLength(1);
		expect(codes(done, "you", "deck")).toHaveLength(3);
	});
	it(`${cites("bingo-machine-go", "criterion-monster")} counts a "Blue-Eyes" monster of any kind (the archetype), and no other monster, whatever it mentions`, () => {
		const start = board({ hand: [card], deck: ["blue-eyes-white-dragon", "fixture-blue-eyes-effect", "fixture-blue-eyes-small", "fixture-blue-eyes-normal", "fixture-other-dragon", "fixture-mentioning-monster", "fixture-light-tuner"] });
		const asked = play(start, `activate ${card}`);
		expect(offered(asked)).toEqual(["choose blue-eyes-white-dragon", "choose fixture-blue-eyes-effect", "choose fixture-blue-eyes-normal", "choose fixture-blue-eyes-small"]);
	});
	it(`${cites("bingo-machine-go", "criterion-spell-trap")} ${cites("bingo-machine-go", "notes-mentions")} counts a Spell/Trap whose text names "Blue-Eyes White Dragon" or "Blue-Eyes Ultimate Dragon" as a card, not one that names the archetype or another card, and never a copy of itself`, () => {
		const start = board({
			hand: [card],
			deck: [card, "fixture-roar", "fixture-ultimate-trap", "fixture-ultimate-quick", "fixture-archetype-spell", "fixture-other-spell", "fixture-burst-stream", "blue-eyes-white-dragon"],
		});
		const asked = play(start, `activate ${card}`);
		expect(offered(asked)).toEqual(["choose blue-eyes-white-dragon", "choose fixture-roar", "choose fixture-ultimate-quick", "choose fixture-ultimate-trap"]);
	});
	it(`${cites("bingo-machine-go", "random-pick")} lets the opponent pick 1 of the 3 at random, by the Duel's RNG: any of them, the same one for the same seed; it goes to the hand`, () => {
		const start = board({ hand: [card], deck: ["blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap", "fixture-other-dragon"] });
		const picks = new Set<string>();
		for (let seed = 1; seed <= 40; seed++) {
			// Exactly 3 cards meet a criterion: they are revealed without asking.
			const done = play(reseed(start, seed), `activate ${card}`);
			expect(codes(done, "you", "hand")).toHaveLength(1);
			picks.add(codes(done, "you", "hand")[0]!);
			// The same Duel gives the same pick.
			expect(codes(play(reseed(start, seed), `activate ${card}`), "you", "hand")).toEqual(codes(done, "you", "hand"));
		}
		expect([...picks].sort()).toEqual(["blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap"]);
	});
	it(`${cites("bingo-machine-go", "shuffle")} ${cites("bingo-machine-go", "notes-simultaneous")} shuffles the 2 cards left into the Deck in the same resolution: no window between adding the card and the shuffle, and the card that was not revealed stays in the Deck`, () => {
		const start = board({ hand: [card], deck: ["blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap", "fixture-other-dragon"] }, { hand: ["effect-veiler"] }, { everyWindow: true });
		// Both players pass, the opponent holding a Quick Effect it does not use; the 3 cards (the only ones) are taken at once.
		const done = play(start, `activate ${card}`, "pass", "pass");
		// Resolved in one go: nothing is waiting, the chain is empty, and the RNG has moved (pick and shuffle).
		expect(done.asking).toBeNull();
		expect(done.chain).toEqual([]);
		expect(done.rng.state).not.toBe(start.rng.state);
		expect(codes(done, "you", "deck")).toHaveLength(3);
		expect(codes(done, "you", "deck")).toContain("fixture-other-dragon");
		expect(codes(done, "you", "hand")).toHaveLength(1);
		// What was revealed is hidden again: the shuffle ended it for the two cards still in the Deck.
		const inDeck = done.piles.you.deck.filter((id) => done.cards[id]!.code !== "fixture-other-dragon");
		expect(revealedNow(done).filter((id) => inDeck.includes(id))).toEqual([]);
	});
	it(`${cites("bingo-machine-go", "once")} lets a player activate only 1 per turn, a copy included, and gives the use back when its activation is negated`, () => {
		const twoCopies = board({ hand: [card, card], deck: ["blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap", "fixture-blue-eyes-small", "fixture-blue-eyes-effect", "fixture-blue-eyes-normal"] });
		const used = chosen(play(twoCopies, `activate ${card}`), "blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap");
		expect(activations(used)).toEqual([]);
		// Negated by Solemn Judgment: "You can only activate 1 ... per turn" gives the use back (Konami's Japanese Q&A on once per turn, in step 4's records).
		const negated = play(board({ hand: [card, card], deck: ["blue-eyes-white-dragon", "fixture-roar", "fixture-ultimate-trap"] }, { set: ["solemn-judgment"] }), `activate ${card}`, "activate solemn-judgment");
		expect(negated.chain).toEqual([]);
		expect(activations(negated)).toEqual([`activate ${card}`]);
	});
});
