import type { Chapter } from "@/lib/lesson-types";
import { spellCardsLesson } from "./spell-cards";
import { trapCardsLesson } from "./trap-cards";
import { monsterEffectsLesson } from "./monster-effects";
import { understandingChainsLesson } from "./understanding-chains";
import { specialSummoningLesson } from "./special-summoning";
import { graveyardBanishedLesson } from "./graveyard-banished";

export const spellsAndTrapsChapter: Chapter = {
	id: "spells-and-traps",
	number: 2,
	title: "Spells, Traps & Monster Effects",
	description: "Master Spell and Trap Cards, monster effect types, chains and Spell Speeds, Special Summoning, and the Graveyard and Banished zones.",
	audience: "Beginners who know the basic turn structure and want to understand how card effects really work.",
	accent: "green",
	lessons: [spellCardsLesson, trapCardsLesson, monsterEffectsLesson, understandingChainsLesson, specialSummoningLesson, graveyardBanishedLesson],
};
