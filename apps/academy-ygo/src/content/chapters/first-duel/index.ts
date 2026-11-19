import type { Chapter } from "@/lib/lesson-types";
import { welcomeLesson } from "./welcome";
import { understandingCardsLesson } from "./understanding-cards";
import { duelFieldLesson } from "./duel-field";
import { preparingDuelLesson } from "./preparing-duel";
import { understandingTurnLesson } from "./understanding-turn";
import { normalSummoningLesson } from "./normal-summoning";
import { monsterPositionsLesson } from "./monster-positions";
import { battlePhaseLesson } from "./battle-phase";
import { firstCompleteDuelLesson } from "./first-complete-duel";

export const firstDuelChapter: Chapter = {
	id: "first-duel",
	number: 1,
	title: "The First Duel",
	description:
		"Everything a complete beginner needs for a first duel: cards, the field, turns, summoning, positions and battle.",
	audience: "Never played before",
	accent: "gold",
	lessons: [
		welcomeLesson,
		understandingCardsLesson,
		duelFieldLesson,
		preparingDuelLesson,
		understandingTurnLesson,
		normalSummoningLesson,
		monsterPositionsLesson,
		battlePhaseLesson,
		firstCompleteDuelLesson,
	],
};
