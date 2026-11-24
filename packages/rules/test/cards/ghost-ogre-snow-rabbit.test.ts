import { describe, expect, it } from "vitest";
import { type CardDef, CARD_DEFS, changeControl, cites, flipFaceDown, flipFaceUp, moveCard } from "../../src";
import { negationCards } from "../rules/negation-fixtures";
import { codes, offered, play, position } from "../rules/fixtures";

const options = { everyWindow: true };
const card = "ghost-ogre-snow-rabbit";
const answer = `activate ${card}`;

describe("Ghost Ogre & Snow Rabbit, written as effect records", () => {
	it(`${cites("ghost-ogre-snow-rabbit", "text")} is a Quick Effect that answers the effect a monster on the field activates: it sends itself to the GY, then destroys that monster`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		const start = position({ defs, options, you: { monsters: ["ignition"] }, rival: { hand: [card] } });
		expect(offered(start)).not.toContain(answer);
		const answered = play(start, "activate ignition", answer);
		// The cost is paid at once; the destruction comes when the Quick Effect resolves.
		expect(codes(answered, "rival", "graveyard")).toEqual([card]);
		expect(codes(answered, "you", "monster")).toEqual(["ignition"]);
		const done = play(answered, "pass", "pass");
		expect(codes(done, "you", "graveyard")).toEqual(["ignition"]);
		expect(codes(done, "you", "monster")).toEqual([]);
	});
	it(`${cites("ghost-ogre-snow-rabbit", "once")} can be used only once per turn by name: once a copy was sent, no other copy, in the hand or on the field, answers a later activation that turn`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const twice = (rival: { hand?: string[]; monsters?: string[] }) => {
			const start = position({ defs, you: { monsters: ["ignition", "ignition"] }, rival });
			// One whole chain: the first copy answers and the chain resolves; then the second ignition effect is activated.
			const resolved = play(start, "activate ignition", answer);
			expect(resolved.chain).toEqual([]);
			return play(resolved, "activate ignition");
		};
		expect(offered(twice({ hand: [card, card] }))).not.toContain(answer);
		expect(offered(twice({ hand: [card], monsters: [card] }))).not.toContain(answer);
		// Next turn the limit is lifted: the rival's own turn, a monster of theirs activates and the copy answers it.
		const fresh = position({ defs, turn: "rival", you: { hand: [card] }, rival: { monsters: ["ignition"] } });
		expect(offered(play(fresh, "activate ignition"))).toContain(answer);
	});
	it(`${cites("ghost-ogre-snow-rabbit", "notes-field")} can also be activated from the Monster Zone, and not from the Graveyard or from banishment`, () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const start = position({ defs, options, you: { monsters: ["ignition"] }, rival: { monsters: [card] } });
		const answered = play(start, "activate ignition", answer);
		expect(codes(answered, "rival", "graveyard")).toEqual([card]);
		expect(codes(answered, "rival", "monster")).toEqual([]);
		expect(codes(play(answered, "pass", "pass"), "you", "graveyard")).toEqual(["ignition"]);
		const elsewhere = position({ defs, options, you: { monsters: ["ignition"] }, rival: { graveyard: [card] } });
		expect(offered(play(elsewhere, "activate ignition"))).not.toContain(answer);
		const turned = position({ defs, options, you: { monsters: ["ignition"] }, rival: { facedown: [card] } });
		expect(offered(play(turned, "activate ignition"))).not.toContain(answer);
		const banished = position({ defs, options, you: { monsters: ["ignition"] }, rival: { graveyard: [card] } });
		const gone = moveCard(banished, banished.piles.rival.graveyard[0]!, { zone: "banished", face: "up" });
		expect(offered(play(gone, "activate ignition"))).not.toContain(answer);
	});
	it(`${cites("ghost-ogre-snow-rabbit", "notes-answers")} answers the effect of a Spell/Trap already face-up on the field, not the activation of a Spell/Trap Card, nor an effect activated from the hand`, () => {
		const log: string[] = [];
		const defs = { ...CARD_DEFS, ...negationCards(log) };
		// Lamp: a Continuous Spell on the field with an Ignition Effect.
		const lamp = position({ defs, options, you: { faceupSpells: ["lamp"] }, rival: { hand: [card] } });
		const lit = play(lamp, "activate lamp");
		expect(offered(lit)).toContain(answer);
		const destroyed = play(lit, answer, "pass", "pass");
		expect(codes(destroyed, "you", "graveyard")).toEqual(["lamp"]);
		expect(codes(destroyed, "you", "spell")).toEqual([]);
		// The activation of a Spell Card or an effect that starts in the hand are not answered.
		const spell = position({ defs, options, you: { hand: ["plain-spell"] }, rival: { hand: [card] } });
		expect(offered(play(spell, "activate plain-spell"))).not.toContain(answer);
		const hand = position({ defs, options, you: { hand: ["hand-monster"] }, rival: { hand: [card] } });
		expect(offered(play(hand, "activate hand-monster"))).not.toContain(answer);
		expect(offered(position({ defs, options, you: { monsters: ["ignition"] }, rival: { hand: [card] } }))).not.toContain(answer);
	});
	// Quick-Play Spells written for these tests: "Book of Moon" (turn 1 face-up monster you control face-down) and a card that returns it to the hand.
	const helpers = (log: string[]): Record<string, CardDef> => ({
		...CARD_DEFS,
		...negationCards(log),
		moon: { code: "moon", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => moveCard(duel, duel.piles.you.monster[0]!, { zone: "monster", face: "down", position: "defense" }) }] },
		bounce: { code: "bounce", kind: "quick-play", effects: [{ type: "activation", operation: (duel) => moveCard(duel, duel.piles.you.monster[0]!, { zone: "hand" }) }] },
	});
	it(`${cites("ghost-ogre-snow-rabbit", "notes-not-negation")} does not negate the effect it answers: that effect still applies although its card was destroyed`, () => {
		const log: string[] = [];
		const start = position({ defs: helpers(log), options, you: { monsters: ["ignition"] }, rival: { hand: [card] } });
		const done = play(start, "activate ignition", answer, "pass", "pass");
		expect(codes(done, "you", "graveyard")).toEqual(["ignition"]);
		expect(log).toEqual(["ignition"]);
	});
	it(`${cites("ghost-ogre-snow-rabbit", "qa-turned-face-down")} destroys the monster even if it was turned face-down in the chain, and its effect still applies`, () => {
		const log: string[] = [];
		const start = position({ defs: helpers(log), options, you: { monsters: ["ignition"], hand: ["moon"] }, rival: { hand: [card] } });
		const done = play(start, "activate ignition", answer, "activate moon", "pass", "pass", "pass");
		expect(codes(done, "you", "graveyard").sort()).toEqual(["ignition", "moon"]);
		expect(log).toEqual(["ignition"]);
	});
	it(`${cites("ghost-ogre-snow-rabbit", "notes-left-the-field")} does nothing when the card whose effect it answered has left the field by resolution: a monster returned to the hand is not destroyed`, () => {
		const log: string[] = [];
		const start = position({ defs: helpers(log), options, you: { monsters: ["ignition"], hand: ["bounce"] }, rival: { hand: [card] } });
		const done = play(start, "activate ignition", answer, "activate bounce", "pass", "pass", "pass");
		expect(codes(done, "you", "hand")).toEqual(["ignition"]);
		expect(codes(done, "you", "graveyard")).toEqual(["bounce"]);
		expect(log).toEqual(["ignition"]);
	});
	// Review: the card is "that card on the field" until it leaves the field (Konami's notes, `notes-left-the-field`): a control change
	// or several flips while it stays there do not stop the destruction; leaving and coming back does.
	describe("that card, while it stays on the field (review)", () => {
		const defs = { ...CARD_DEFS, ...negationCards() };
		const chained = () => {
			const start = position({ defs, options, you: { monsters: ["ignition"] }, rival: { hand: [card] } });
			return play(start, "activate ignition", answer);
		};
		const ignitionId = (duel: ReturnType<typeof chained>) => duel.piles.you.monster[0]!;
		it(`${cites("ghost-ogre-snow-rabbit", "notes-left-the-field")} destroys a monster whose control changed during the chain`, () => {
			const answered = chained();
			const taken = changeControl(answered, ignitionId(answered), "rival");
			const done = play(taken, "pass", "pass");
			expect(codes(done, "you", "graveyard")).toEqual(["ignition"]);
			expect(codes(done, "rival", "monster")).toEqual([]);
		});
		it(`${cites("ghost-ogre-snow-rabbit", "qa-turned-face-down")} destroys a monster turned face-down, face-up and face-down again during the chain`, () => {
			const answered = chained();
			const id = ignitionId(answered);
			const flipped = flipFaceDown(flipFaceUp(flipFaceDown(answered, id), id), id);
			const done = play(flipped, "pass", "pass");
			expect(codes(done, "you", "graveyard")).toEqual(["ignition"]);
		});
		it(`${cites("ghost-ogre-snow-rabbit", "notes-left-the-field")} destroys nothing when the monster left the field and came back to the same zone`, () => {
			const answered = chained();
			const id = ignitionId(answered);
			const slot = answered.cards[id]!.slot!;
			const back = moveCard(moveCard(answered, id, { zone: "banished", face: "up" }), id, { zone: "monster", face: "up", slot });
			const done = play(back, "pass", "pass");
			expect(codes(done, "you", "monster")).toEqual(["ignition"]);
		});
	});
});
