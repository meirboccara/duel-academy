import type { Chapter } from "@/lib/lesson-types";
import { cardTextLesson } from "./card-text";
import { advancedChainsLesson } from "./advanced-chains";
import { battleRulesLesson } from "./battle-rules";
import { commonMechanicsLesson } from "./common-mechanics";
import { deckBuildingLesson } from "./deck-building";
import { matchesTournamentsLesson } from "./matches-tournaments";

export const advancedRulesChapter: Chapter = {
	id: "advanced-rules",
	number: 4,
	title: "Advanced Duel Rules",
	description:
		"Read card text precisely, master chains and battle, learn the common mechanics, then build a Deck and prepare for Matches and events.",
	audience: "Players who know the basic turn and want to understand exact rulings",
	accent: "blue",
	lessons: [
		cardTextLesson,
		advancedChainsLesson,
		battleRulesLesson,
		commonMechanicsLesson,
		deckBuildingLesson,
		matchesTournamentsLesson,
	],
};
