import type { Chapter } from "@/lib/lesson-types";
import { theExtraDeckLesson } from "./the-extra-deck";
import { fusionSummoningLesson } from "./fusion-summoning";
import { synchroSummoningLesson } from "./synchro-summoning";
import { xyzSummoningLesson } from "./xyz-summoning";
import { pendulumSummoningLesson } from "./pendulum-summoning";
import { linkSummoningLesson } from "./link-summoning";
import { ritualSummoningLesson } from "./ritual-summoning";

export const extraDeckChapter: Chapter = {
	id: "extra-deck",
	number: 3,
	title: "Extra Deck & Advanced Summoning",
	description: "Fusion, Synchro, Xyz, Pendulum, Link and Ritual Summons, one clear diagram at a time.",
	audience: "Players comfortable with Normal Summons, Spells, Traps and chains",
	accent: "purple",
	lessons: [
		theExtraDeckLesson,
		fusionSummoningLesson,
		synchroSummoningLesson,
		xyzSummoningLesson,
		pendulumSummoningLesson,
		linkSummoningLesson,
		ritualSummoningLesson,
	],
};
