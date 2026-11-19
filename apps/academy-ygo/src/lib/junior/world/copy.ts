import type { Locale } from "@/lib/i18n/locales";

/** Words of the island world around the 3D scene. Nothing is written inside the scene itself. */
export interface WorldCopy {
	region: string;
	loading: string;
	hint: string;
	previous: string;
	next: string;
	islandOf: (number: number, total: number) => string;
	solvedOf: (solved: number, total: number) => string;
	play: (title: string) => string;
	replay: string;
	lockedIsland: (before: string) => string;
	doneIsland: string;
	stopsLabel: string;
	stop: (number: number, title: string, state: string) => string;
	next_: string;
	sailTo: (title: string) => string;
}

export const WORLD_COPY: Record<Locale, WorldCopy> = {
	en: {
		region: "Island map",
		loading: "The islands are coming…",
		hint: "Walk with the arrows or a tap. On a glowing stop, press the gold button to play.",
		previous: "Previous island",
		next: "Next island",
		islandOf: (number, total) => `Island ${number} of ${total}`,
		solvedOf: (solved, total) => `${solved} of ${total} levels solved`,
		play: (title) => `Play: ${title}`,
		replay: "Island finished! Tap a level to play it again.",
		lockedIsland: (before) => `This island is still asleep. Finish “${before}” to wake it up.`,
		doneIsland: "finished",
		stopsLabel: "Levels on this island",
		stop: (number, title, state) => (state ? `${number}. ${title}: ${state}` : `${number}. ${title}`),
		next_: "your next level",
		sailTo: (title) => `Sail to ${title}`,
	},
	fr: {
		region: "Carte des îles",
		loading: "Les îles arrivent…",
		hint: "Marche avec les flèches ou en touchant l’île. Sur une étape qui brille, appuie sur le bouton doré pour jouer.",
		previous: "Île précédente",
		next: "Île suivante",
		islandOf: (number, total) => `Île ${number} sur ${total}`,
		solvedOf: (solved, total) => `${solved} niveau${solved > 1 ? "x" : ""} réussi${solved > 1 ? "s" : ""} sur ${total}`,
		play: (title) => `Jouer : ${title}`,
		replay: "Île terminée ! Touche un niveau pour le rejouer.",
		lockedIsland: (before) => `Cette île dort encore. Termine « ${before} » pour la réveiller.`,
		doneIsland: "terminée",
		stopsLabel: "Les niveaux de cette île",
		stop: (number, title, state) => (state ? `${number}. ${title} : ${state}` : `${number}. ${title}`),
		next_: "ton prochain niveau",
		sailTo: (title) => `Naviguer vers ${title}`,
	},
	he: {
		region: "מפת האיים",
		loading: "האיים בדרך…",
		hint: "לך עם החיצים או בנגיעה באי. בתחנה הזוהרת, לחץ על הכפתור הזהוב כדי לשחק.",
		previous: "האי הקודם",
		next: "האי הבא",
		islandOf: (number, total) => `אי ${number} מתוך ${total}`,
		solvedOf: (solved, total) => `${solved} מתוך ${total} שלבים הושלמו`,
		play: (title) => `לשחק: ${title}`,
		replay: "סיימת את האי! גע בשלב כדי לשחק בו שוב.",
		lockedIsland: (before) => `האי הזה עוד ישן. סיים את „${before}” כדי להעיר אותו.`,
		doneIsland: "הושלם",
		stopsLabel: "השלבים באי הזה",
		stop: (number, title, state) => (state ? `${number}. ${title}: ${state}` : `${number}. ${title}`),
		next_: "השלב הבא שלך",
		sailTo: (title) => `להפליג אל ${title}`,
	},
};
