import { CARD_ART } from "./card-art";
import { type Action, type CardFilter, type CardId, cardOf, type DataEffect, hasRulesText, isEffectMonster, monsterOf } from "./cards";

/**
 * The shared vocabulary of effects written as data: which cards a filter accepts, what an effect has to choose, and
 * what kind of thing it does (its categories), so that a card that answers "an effect that adds from the Deck"
 * (Ash Blossom & Joyous Spring) judges any card written this way.
 */

/** What an effect does, as the cards that answer effects read it (Ash Blossom & Joyous Spring's list, and drawing). */
export type Category = "search" | "deck-summon" | "mill" | "draw";

/** Does this card fit what the effect looks for? */
export function fits(card: CardId, filter: CardFilter): boolean {
	if (filter.card !== undefined && card !== filter.card) return false;
	if (filter.except !== undefined && card === filter.except) return false;
	const info = cardOf(card);
	if (filter.kind !== undefined && info.kind !== filter.kind) return false;
	if (filter.archetype !== undefined && !CARD_ART[card]?.name.includes(filter.archetype)) return false;
	if (filter.icon !== undefined && (info.kind === "monster" || info.icon !== filter.icon)) return false;
	if (filter.level !== undefined || filter.maxLevel !== undefined || filter.attribute !== undefined || filter.tuner || filter.effect || filter.normal) {
		if (info.kind !== "monster") return false;
		if (filter.level !== undefined && info.level !== filter.level) return false;
		/* A Rank or a Link Rating is not a Level. */
		if (filter.maxLevel !== undefined && (info.level <= 0 || info.level > filter.maxLevel)) return false;
		if (filter.normal && (hasRulesText(card) || !!info.frame)) return false;
		if (filter.attribute !== undefined && CARD_ART[card]?.attribute !== filter.attribute) return false;
		if (filter.tuner && !monsterOf(card).tuner) return false;
		if (filter.effect && !isEffectMonster(card)) return false;
	}
	return true;
}

/** Where the one card an effect chooses comes from, and what it must be: the first step that picks a card. */
export function choiceOf(actions: readonly Action[]): { from: readonly ("hand" | "deck" | "graveyard")[]; filter: CardFilter } | null {
	for (const action of actions) {
		if (action.do === "search" || action.do === "mill") return { from: ["deck"], filter: action.filter };
		if (action.do === "special") return { from: action.from, filter: action.filter };
	}
	return null;
}

/** The monster an effect targets on its owner's field, if it targets one. */
export function targetOf(actions: readonly Action[]): CardFilter | null {
	const action = actions.find((step) => step.do === "send-target");
	return action?.do === "send-target" ? action.filter : null;
}

/** What these steps do, for the cards that answer effects. */
export function categoriesOf(actions: readonly Action[]): Set<Category> {
	const out = new Set<Category>();
	for (const action of actions) {
		if (action.do === "search") out.add("search");
		if (action.do === "mill") out.add("mill");
		if (action.do === "draw") out.add("draw");
		if (action.do === "special" && action.from.includes("deck")) out.add("deck-summon");
	}
	return out;
}

/** What a card's activation does: a Spell or Trap's effect, written as data or as one of the older tags. */
export function cardCategories(card: CardId): Set<Category> {
	const info = cardOf(card);
	if (info.kind === "monster") return new Set();
	const effect = info.effect;
	if (effect.type === "data") return categoriesOf(effect.actions);
	const out = new Set<Category>();
	if (effect.type === "search" || effect.type === "search-pick" || effect.type === "curtain") out.add("search");
	if (effect.type === "deck-summon" || effect.type === "curtain" || (effect.type === "call" && effect.from.includes("deck"))) out.add("deck-summon");
	if (effect.type === "draw" || effect.type === "draw-then-gift") out.add("draw");
	return out;
}

/** The effects a monster has, written as data. */
export const effectsOf = (card: CardId): readonly DataEffect[] => {
	const info = cardOf(card);
	return info.kind === "monster" ? (info.effects ?? []) : [];
};

/** What Ash Blossom & Joyous Spring negates: an effect that adds from the Deck, Special Summons from it, sends from it, or draws. */
export const ashCategories: readonly Category[] = ["search", "deck-summon", "mill", "draw"];
