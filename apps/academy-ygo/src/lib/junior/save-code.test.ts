import { describe, expect, it } from "vitest";
import { LEVELS } from "./play/levels";
import { emptyPlayProgress, recordSolve } from "./play/progress";
import { decodeSave, encodeSave } from "./save-code";

const twoSolved = LEVELS.slice(0, 2).reduce((p, level, i) => recordSolve(p, level.id, { tries: 1, firstTry: i === 0, clean: true, hints: 0, slips: i ? ["monster-in-the-way"] : [] }), emptyPlayProgress());

describe("a save code", () => {
	it("carries a whole save from one browser to another, Hebrew nickname and stars included", () => {
		const code = encodeSave({ name: "נועה", avatar: "mage", play: { ...twoSolved, sound: true }, shop: ["watapon"], items: ["shirt-red", "hat-wizard"], wear: { hat: "hat-wizard" } });
		expect(code).toMatch(/^DA1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
		const back = decodeSave(code);
		expect(back).toEqual({ ok: true, save: { name: "נועה", avatar: "mage", play: { ...twoSolved, sound: true }, shop: ["watapon"], items: ["shirt-red", "hat-wizard"], wear: { hat: "hat-wizard" }, dorm: null, locale: null } });
	});
	it("carries the save's own language, and reads none (older codes, or an unknown one) as the site's", () => {
		expect(decodeSave(encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved, locale: "he" }))).toMatchObject({ ok: true, save: { locale: "he" } });
		expect(decodeSave(encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved }))).toMatchObject({ ok: true, save: { locale: null } });
		expect(decodeSave(encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved, locale: "de" } as never))).toMatchObject({ ok: true, save: { locale: null } });
	});
	it("carries the dorm chosen, and reads an unknown one as none", () => {
		expect(decodeSave(encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved, dorm: "obelisk" }))).toMatchObject({ ok: true, save: { dorm: "obelisk" } });
		expect(decodeSave(encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved, dorm: "pink" } as never))).toMatchObject({ ok: true, save: { dorm: null } });
	});
	it("survives spaces and line breaks added by a mail or notes app", () => {
		const code = encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved });
		const wrapped = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
		expect(decodeSave(wrapped).ok).toBe(true);
	});
	it("refuses a code with one character missing or changed", () => {
		const code = encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved });
		expect(decodeSave(code.slice(0, 30) + code.slice(31))).toEqual({ ok: false, reason: "damaged" });
		const flipped = code.slice(0, 10) + (code[10] === "A" ? "B" : "A") + code.slice(11);
		expect(decodeSave(flipped)).toEqual({ ok: false, reason: "damaged" });
	});
	it("still reads a code made before the shop existed, as nothing bought", () => {
		const old = encodeSave({ name: "Zoé", avatar: "rogue", play: twoSolved } as never);
		expect(decodeSave(old)).toMatchObject({ ok: true, save: { shop: [], items: [], wear: {} } });
	});
	it("refuses something that is not a save code", () => {
		expect(decodeSave("hello")).toEqual({ ok: false, reason: "not-a-code" });
		expect(decodeSave("")).toEqual({ ok: false, reason: "not-a-code" });
	});
	it("cleans what it loads: unknown levels and bad counts go, the nickname is cleaned, an unknown character becomes the knight", () => {
		const raw = { v: 1, name: "Léo 🐉", avatar: "dragon", play: { version: 1, levels: { [LEVELS[0]!.id]: { clean: true, firstTry: false }, "level-from-the-future": { clean: true, firstTry: true }, [LEVELS[1]!.id]: { clean: "yes" } }, slips: { a: 2, b: -1, c: 1.5 }, calm: false, sound: "on" }, shop: ["watapon", "a-card-from-the-future", 7], items: ["shirt-red", "a-crown"], wear: { shirt: "shirt-red", hat: "hat-wizard" } };
		const back = decodeSave(encodeSave(raw as never));
		expect(back).toEqual({ ok: true, save: { name: "Léo", avatar: "knight", play: { version: 1, levels: { [LEVELS[0]!.id]: { clean: true, firstTry: false } }, slips: { a: 2 }, calm: false, sound: false }, shop: ["watapon"], items: ["shirt-red"], wear: { shirt: "shirt-red" }, dorm: null, locale: null } });
	});
});
