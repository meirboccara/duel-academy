import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { CARD_IDS, hasRulesText } from "./cards";
import { PLAY_COPY, VOICE_LOCALE, narrateAll, type PlayCopy } from "./copy";
import type { GameEvent, Move, Board } from "./engine";
import { DEMOS, LEVELS, RULE_IDS } from "./levels";
import { demoFrames, next, play, start } from "./session";

/** Every event of every level played along its solution (the rival included), and of every demonstration. */
function everything(): { events: GameEvent[]; moves: { move: Move; board: Board }[] } {
	const events: GameEvent[] = [];
	const moves: { move: Move; board: Board }[] = [];
	for (const level of LEVELS) {
		let session = start(level);
		const rival = () => {
			while (session.status === "rival") {
				session = next(session);
				events.push(...session.events);
			}
		};
		rival();
		for (const move of level.solution) {
			moves.push({ move, board: session.board });
			session = play(session, move);
			events.push(...session.events);
			rival();
		}
	}
	for (const rule of RULE_IDS) for (const frame of demoFrames(DEMOS[rule])) events.push(...frame.events);
	return { events, moves };
}
const PLAYED = everything();

describe.each(LOCALES.map((locale) => [locale] as const))("Junior play copy in %s", (locale) => {
	const copy = PLAY_COPY[locale];
	it("names every level and every card, and gives every card with an effect its text", () => {
		for (const level of LEVELS) {
			expect(copy.levels[level.id]?.title, level.id).toBeTruthy();
			expect(copy.levels[level.id]?.goal, level.id).toBeTruthy();
		}
		expect(Object.keys(copy.levels).sort()).toEqual(LEVELS.map((level) => level.id).sort());
		for (const card of CARD_IDS) {
			expect(copy.cards[card].name, card).toBeTruthy();
			expect(!!copy.cards[card].text, card).toBe(hasRulesText(card));
		}
	});
	it("has a sentence for everything that happens in every level and demonstration", () => {
		for (const event of PLAYED.events) expect(copy.narrate(event), event.type).toBeTruthy();
		expect(narrateAll(copy, PLAYED.events)).not.toMatch(/undefined|\[object/);
		for (const { move, board } of PLAYED.moves) expect(copy.describeMove(move, board), move.type).toBeTruthy();
	});
	it("keeps a goal short enough to be said in one breath", () => {
		for (const level of LEVELS) expect(copy.levels[level.id]?.goal.split(/\s+/).length ?? 0, level.id).toBeLessThanOrEqual(20);
	});
});

describe("a battle said aloud", () => {
	it("shows the subtraction the same way in every language", () => {
		const frame = demoFrames(DEMOS.battle)[1];
		for (const locale of LOCALES) expect(narrateAll(PLAY_COPY[locale], frame?.events ?? [])).toContain("1500 − 1100 = 400");
	});
});

/**
 * Real cards are printed in English (there is no Hebrew card), so a Hebrew line keeps each card word in English.
 * Where the English line uses one of these words, the Hebrew line must show the English word too.
 */
const CARD_WORDS: readonly (readonly [RegExp, RegExp])[] = [
	[/\bMonsters?\b/, /Monster/],
	[/\bSpells?\b/, /Spell/],
	[/\bTraps?\b/, /Trap/],
	[/\bSummon/, /Summon/],
	[/\bTribut/, /Tribute/],
	[/\bSet\b/, /\bSet\b/],
	[/\bGraveyard/, /Graveyard/],
	[/\bChain/, /Chain/],
	[/\b[Tt]arget/, /[Tt]arget/],
	[/\bcost\b/i, /cost/i],
	[/Quick Effect/, /Quick Effect/],
	[/once per turn/i, /once per turn/i],
	[/\bdestroy/i, /destroy/i],
	[/\bdiscard/i, /discard/i],
	[/\bactivat/i, /activat/i],
	[/Life Points|\bLP\b/, /\bLP\b|Life Points/],
	[/Attack Position/, /Attack Position/],
	[/Defense Position/, /Defense Position/],
	[/"When/, /When/],
	[/"If/, /If/],
	[/Extra Deck/, /Extra Deck/],
	[/Extra Monster Zone/, /Extra Monster Zone/],
	[/Field Zone/, /Field Zone/],
	[/Pendulum Zone/, /Pendulum Zone/],
	[/\bbanish/i, /banish/i],
	[/\bFusion/, /Fusion/],
	[/\bSynchro/, /Synchro/],
	[/\bXyz/, /Xyz/],
	[/\bLink\b/, /Link/],
	[/\bRitual/, /Ritual/],
	[/\bPendulum/, /Pendulum/],
	[/\bTuner/, /Tuner/],
	[/\bRank\b/, /Rank/],
	[/\bScales?\b/, /Scale/],
	[/\bmaterials?\b/, /material/],
	[/\bdetach/i, /detach/i],
	[/\bLevels?\b/, /Level/],
	[/face-down/, /face-down/],
	[/face-up/, /face-up/],
];
function pairs(en: PlayCopy, he: PlayCopy): [string, string, string][] {
	const out: [string, string, string][] = [];
	const add = (where: string, a: string, b: string) => out.push([where, a, b]);
	for (const key of Object.keys(en) as (keyof PlayCopy)[]) {
		const a = en[key];
		const b = he[key];
		if (typeof a === "string" && typeof b === "string") add(key, a, b);
	}
	const records = ["kinds", "rules", "reasons", "fails", "mastery", "types", "frames", "icons"] as const;
	for (const name of records) for (const [key, a] of Object.entries(en[name])) add(`${name}.${key}`, a as string, (he[name] as Record<string, string>)[key] ?? "");
	for (const [key, a] of Object.entries(en.worlds)) {
		add(`worlds.${key}.title`, a.title, he.worlds[key as keyof typeof he.worlds].title);
		add(`worlds.${key}.blurb`, a.blurb, he.worlds[key as keyof typeof he.worlds].blurb);
	}
	for (const [key, a] of Object.entries(en.levels)) {
		add(`levels.${key}.title`, a.title, he.levels[key]?.title ?? "");
		add(`levels.${key}.goal`, a.goal, he.levels[key]?.goal ?? "");
	}
	for (const side of ["you", "rival"] as const) {
		add("lifePoints", en.lifePoints(side, 4000), he.lifePoints(side, 4000));
		add("monsterZone", en.monsterZone(side, 1), he.monsterZone(side, 1));
		add("backZone", en.backZone(side, 1), he.backZone(side, 1));
		add("graveyard", en.graveyard(side, 2), he.graveyard(side, 2));
		add("mainZone", en.mainZone(side, 1), he.mainZone(side, 1));
		add("extraMonsterZone", en.extraMonsterZone(side), he.extraMonsterZone(side));
		add("fieldZone", en.fieldZone(side), he.fieldZone(side));
		add("pendulumZone", en.pendulumZone(side, 1), he.pendulumZone(side, 1));
		add("extraDeck", en.extraDeck(side, 2), he.extraDeck(side, 2));
		add("banished", en.banished(side, 2), he.banished(side, 2));
	}
	for (const left of [1, 2]) add("chooseTributes", en.chooseTributes(left), he.chooseTributes(left));
	for (const count of [1, 2]) add("materials", en.materials(count), he.materials(count));
	add("faceDownCards", en.faceDownCards(10), he.faceDownCards(10));
	add("chooseRitual", en.chooseRitual(4, 8), he.chooseRitual(4, 8));
	add("chooseSynchro", en.chooseSynchro(3, 6), he.chooseSynchro(3, 6));
	add("chooseXyz", en.chooseXyz(2, 4), he.chooseXyz(2, 4));
	add("chooseLink", en.chooseLink(2), he.chooseLink(2));
	add("choosePendulum", en.choosePendulum(2, 7), he.choosePendulum(2, 7));
	PLAYED.events.forEach((event) => add(`narrate ${event.type}`, en.narrate(event), he.narrate(event)));
	PLAYED.moves.forEach(({ move, board }) => add(`describeMove ${move.type}`, en.describeMove(move, board), he.describeMove(move, board)));
	return out;
}

describe("Hebrew keeps the English card words", () => {
	it("shows the English word wherever the English line uses it", () => {
		const missing: string[] = [];
		for (const [where, en, he] of pairs(PLAY_COPY.en, PLAY_COPY.he)) {
			for (const [inEnglish, inHebrew] of CARD_WORDS) if (inEnglish.test(en) && !inHebrew.test(he)) missing.push(`${where}: "${he}" lacks ${inHebrew}`);
		}
		expect(missing).toEqual([]);
	});
	it("prints card names and card text in English, as on real cards", () => {
		expect(PLAY_COPY.he.englishCards).toBe(true);
		expect(PLAY_COPY.en.englishCards).toBe(false);
		expect(PLAY_COPY.fr.englishCards).toBe(false);
		for (const card of CARD_IDS) expect(PLAY_COPY.he.cards[card].name).toContain(PLAY_COPY.en.cards[card].name);
	});
	it("speaks English when Hebrew is chosen, and each language's own words otherwise", () => {
		expect(VOICE_LOCALE).toEqual({ en: "en", fr: "fr", he: "en" });
	});
});

describe("card text in the words printed on real cards", () => {
	it("puts a cost before the semicolon, says Target only for targeting cards, and marks Quick Effects", () => {
		const text = (card: (typeof CARD_IDS)[number]) => PLAY_COPY.en.cards[card].text ?? "";
		expect(text("spark-trade")).toBe("Discard 1 card; destroy all monsters your opponent controls.");
		expect(text("thunder-clap")).toBe("Target 1 face-up monster your opponent controls; destroy it.");
		expect(text("spark-dash")).toBe("Target 1 face-up monster you control; it gains 500 ATK until the end of this turn.");
		expect(text("glint-lynx")).toMatch(/^\(Quick Effect\): You can target 1 face-up monster your opponent controls; .* once per turn\.$/);
		expect(text("cinder-hedgehog")).not.toMatch(/Quick Effect/);
		expect(text("dozy-moth")).toBe("When this card is sent to the GY: You can inflict 500 damage to your opponent.");
		expect(text("busy-bee")).toBe("If this card is sent to the GY: You can inflict 500 damage to your opponent.");
	});
});
