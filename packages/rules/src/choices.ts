import type { Duel, Side } from "./duel";
import { ask, type Declaration } from "./effects";

/**
 * Real-deck readiness (step 4 work): the choices a player makes while an effect resolves, beyond "pick 1 card" (`ask`). All of them go
 * through the actions the core already has: `choose` a card, `pass` to stop or decline, and `declare` for a declaration. Like `ask`,
 * each returns the duel with the question in `duel.asking`, and its continuation is a pure function.
 */

/**
 * "Declare 1 card name / Attribute / Type / Level" while the effect resolves: `legalActions` lists one `declare` action per value of
 * `options`, and `then` goes on with the one declared. With one option it is taken at once; with none the effect does nothing more.
 * (A declaration made at activation is `EffectRecord.declare` instead.)
 */
export const askDeclare = (duel: Duel, player: Side, options: readonly Declaration[], then: (duel: Duel, declared: Declaration) => Duel): Duel => ({
	...duel,
	asking: { links: [], player, from: options.map((_, index) => index), then: (board, index) => then(board, options[index]!), declarations: options },
});

/**
 * Every printed card name of the cards the duel knows (`duel.defs`), sorted, without repeats: what "declare 1 card name" offers in
 * the core. A real game allows any card name that exists; a name no card of the duel has cannot change what happens in it, except
 * as a bluff, which the core does not model.
 */
export function cardNames(duel: Duel): string[] {
	const names = new Set<string>();
	for (const def of Object.values(duel.defs)) if (def.facts?.name) names.add(def.facts.name);
	return [...names].sort();
}

/**
 * "Up to N" / "1 or 2" / "any number of" cards chosen while the effect resolves, one after another through `choose`: a card picked is not
 * offered again, and once `min` cards are picked the player may stop with `pass` (with `min` 0, decline from the start). `then` goes on
 * with the cards picked, in the order picked. Nothing is asked when there is nothing to decide: with `max` reached or no candidate left
 * it goes on, and when the cards left are no more than those still needed, they are all taken.
 */
export function askUpTo(duel: Duel, player: Side, from: readonly number[], { min, max }: { readonly min: number; readonly max: number }, then: (duel: Duel, picked: readonly number[]) => Duel): Duel {
	const candidates = [...new Set(from)];
	const step = (board: Duel, chosen: readonly number[]): Duel => {
		const left = candidates.filter((id) => !chosen.includes(id));
		if (chosen.length >= max || left.length === 0) return then(board, chosen);
		if (chosen.length + left.length <= min) return then(board, [...chosen, ...left]);
		const asked = ask(board, player, left, (next, picked) => step(next, [...chosen, picked]));
		return chosen.length >= min ? { ...asked, asking: { ...asked.asking!, done: (next) => then(next, chosen) } } : asked;
	};
	return step(duel, []);
}

/**
 * "You can ..." while the effect resolves: the player accepts by choosing `card` (the card whose effect it is) or declines with `pass`.
 * `yes` applies the optional part; `no` (default: nothing more) is what happens when it is declined.
 */
export const askMay = (duel: Duel, player: Side, card: number, yes: (duel: Duel) => Duel, no: (duel: Duel) => Duel = (board) => board): Duel => {
	const asked = ask(duel, player, [card], (board) => yes(board));
	return { ...asked, asking: { ...asked.asking!, done: no } };
};
