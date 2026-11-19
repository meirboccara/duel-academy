import type { Locale } from "@/lib/i18n/locales";
import type { Dorm } from "./dorm";

/** Words of the dorm choice. Dorm names are proper names: Hebrew keeps them in Latin letters, as in the anime. */
export interface DormCopy {
	title: string;
	intro: string;
	names: Record<Dorm, string>;
	/** One line per dorm: what kind of duelist lives there. */
	about: Record<Dorm, string>;
	choose: (name: string) => string;
	yours: (name: string) => string;
}

export const DORM_COPY: Record<Locale, DormCopy> = {
	en: {
		title: "Choose your dorm",
		intro: "Welcome to Duel Academy! Every student lives in one of three dorms. Pick yours: its leader will wait for you on the Tower island with a very special card.",
		names: { slifer: "Slifer Red", ra: "Ra Yellow", obelisk: "Obelisk Blue" },
		about: { slifer: "Bold and full of fun, like Jaden Yuki.", ra: "Clever and careful, like Bastion Misawa.", obelisk: "Strong and stylish, like Alexis Rhodes." },
		choose: (name) => `Join ${name}`,
		yours: (name) => `Your dorm: ${name}`,
	},
	fr: {
		title: "Choisis ton dortoir",
		intro: "Bienvenue à la Duel Academy ! Chaque élève vit dans l’un des trois dortoirs. Choisis le tien : son chef t’attendra sur l’île de la Tour avec une carte très spéciale.",
		names: { slifer: "Slifer Rouge", ra: "Ra Jaune", obelisk: "Obelisk Bleu" },
		about: { slifer: "Audacieux et plein d’entrain, comme Jaden Yuki.", ra: "Malin et réfléchi, comme Bastion Misawa.", obelisk: "Fort et élégant, comme Alexis Rhodes." },
		choose: (name) => `Rejoindre ${name}`,
		yours: (name) => `Ton dortoir : ${name}`,
	},
	he: {
		title: "בחרו את המעונות שלכם",
		intro: "ברוכים הבאים ל־⁦Duel Academy⁩! כל תלמיד גר באחד משלושה מעונות. בחרו את שלכם: הראש שלהם יחכה לכם באי המגדל עם קלף מיוחד מאוד.",
		names: { slifer: "Slifer Red", ra: "Ra Yellow", obelisk: "Obelisk Blue" },
		about: { slifer: "אמיצים ומלאי שמחה, כמו ⁦Jaden Yuki⁩.", ra: "חכמים וזהירים, כמו ⁦Bastion Misawa⁩.", obelisk: "חזקים ומלאי סטייל, כמו ⁦Alexis Rhodes⁩." },
		choose: (name) => `להצטרף ל־⁦${name}⁩`,
		yours: (name) => `המעונות שלכם: ⁦${name}⁩`,
	},
};
