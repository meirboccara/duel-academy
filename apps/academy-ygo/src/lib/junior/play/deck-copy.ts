import type { Locale } from "@/lib/i18n/locales";
import type { DeckProblem } from "./masters";
import type { StarterId } from "./starters";

/** The words of the masters' island Deck screens: choosing a starter deck, and changing the Deck. */
export interface DeckCopy {
	deckButton: string;
	deckTitle: string;
	chooseTitle: string;
	chooseText: string;
	starters: Record<StarterId, { name: string; text: string }>;
	choose: (name: string) => string;
	main: (count: number, size: number) => string;
	extra: (count: number, size: number) => string;
	inDeck: (count: number) => string;
	add: (card: string) => string;
	remove: (card: string) => string;
	problems: Record<DeckProblem, string>;
	ready: string;
	save: string;
	reset: string;
	close: string;
	needDeck: string;
	editDeck: string;
	duelOn: string;
}

const L = (text: string) => `⁦${text}⁩`;

export const DECK_COPY: Record<Locale, DeckCopy> = {
	fr: {
		deckButton: "Mon Deck",
		deckTitle: "Ton Deck pour les maîtres",
		chooseTitle: "Choisis ton Deck de départ",
		chooseText: "Ses cartes vont dans ton classeur. Ensuite, tu pourras changer ton Deck quand tu veux, avec toutes les cartes de ton classeur.",
		starters: {
			warrior: { name: "Magiciens et guerriers", text: "Des Monstres solides, Magicien Sombre, et des Pièges pour se défendre." },
			dragon: { name: "Dragons", text: "Des Dragons puissants, et la Montagne pour les renforcer." },
			hero: { name: "Héros Élémentaires", text: "Des Héros qui fusionnent en Homme-Oiseau de Feu, HÉROS Élémentaire." },
		},
		choose: (name) => `Choisir : ${name}`,
		main: (count, size) => `Main Deck : ${count} sur ${size}`,
		extra: (count, size) => `Extra Deck : ${count} sur ${size} au plus`,
		inDeck: (count) => (count === 0 ? "pas dans le Deck" : `${count} dans le Deck`),
		add: (card) => `Ajouter ${card}`,
		remove: (card) => `Retirer ${card}`,
		problems: {
			"main-size": "Le Main Deck doit avoir exactement 40 cartes.",
			"extra-size": "L’Extra Deck a 15 cartes au plus.",
			"too-many-copies": "3 exemplaires d’une même carte, au plus.",
			"extra-in-main": "Les Monstres Fusion, Synchro, Xyz et Lien vont dans l’Extra Deck.",
			"main-in-extra": "Seuls les Monstres Fusion, Synchro, Xyz et Lien vont dans l’Extra Deck.",
			"not-owned": "Une carte du Deck n’est pas dans ton classeur.",
		},
		ready: "Ton Deck est prêt !",
		save: "Garder ce Deck",
		reset: "Revenir au Deck de départ",
		close: "Fermer",
		needDeck: "Pour défier les maîtres, il te faut un Deck de 40 cartes.",
		editDeck: "Changer mon Deck",
		duelOn: "Chaque maître a son propre Deck de 40 cartes, mélangé. 8000 Points de Vie chacun.",
	},
	en: {
		deckButton: "My Deck",
		deckTitle: "Your Deck for the masters",
		chooseTitle: "Choose your starter Deck",
		chooseText: "Its cards go into your binder. Then you can change your Deck any time, with every card in your binder.",
		starters: {
			warrior: { name: "Magicians and warriors", text: "Sturdy Monsters, Dark Magician, and Traps to defend with." },
			dragon: { name: "Dragons", text: "Mighty Dragons, and Mountain to make them stronger." },
			hero: { name: "Elemental HEROes", text: "HEROes that fuse into Elemental HERO Flame Wingman." },
		},
		choose: (name) => `Choose: ${name}`,
		main: (count, size) => `Main Deck: ${count} of ${size}`,
		extra: (count, size) => `Extra Deck: ${count} of ${size} at most`,
		inDeck: (count) => (count === 0 ? "not in the Deck" : `${count} in the Deck`),
		add: (card) => `Add ${card}`,
		remove: (card) => `Take out ${card}`,
		problems: {
			"main-size": "The Main Deck must have exactly 40 cards.",
			"extra-size": "The Extra Deck has 15 cards at most.",
			"too-many-copies": "3 copies of the same card, at most.",
			"extra-in-main": "Fusion, Synchro, Xyz and Link Monsters go in the Extra Deck.",
			"main-in-extra": "Only Fusion, Synchro, Xyz and Link Monsters go in the Extra Deck.",
			"not-owned": "A card of the Deck is not in your binder.",
		},
		ready: "Your Deck is ready!",
		save: "Keep this Deck",
		reset: "Back to the starter Deck",
		close: "Close",
		needDeck: "To challenge the masters, you need a Deck of 40 cards.",
		editDeck: "Change my Deck",
		duelOn: "Each master has their own shuffled Deck of 40 cards. 8000 Life Points each.",
	},
	he: {
		deckButton: `החפיסה שלי (${L("Deck")})`,
		deckTitle: "החפיסה שלכם מול המאסטרים",
		chooseTitle: "בחרו חפיסת התחלה",
		chooseText: "הקלפים שלה נכנסים לאלבום שלכם. אחר כך אפשר לשנות את החפיסה מתי שרוצים, עם כל הקלפים שבאלבום.",
		starters: {
			warrior: { name: "קוסמים ולוחמים", text: `מפלצות חזקות, ${L("Dark Magician")}, ומלכודות להגנה.` },
			dragon: { name: "דרקונים", text: `דרקונים עוצמתיים, ו־${L("Mountain")} שמחזק אותם.` },
			hero: { name: `${L("Elemental HERO")}`, text: `גיבורים שמתמזגים ל־${L("Elemental HERO Flame Wingman")}.` },
		},
		choose: (name) => `לבחור: ${name}`,
		main: (count, size) => `${L("Main Deck")}: ${count} מתוך ${size}`,
		extra: (count, size) => `${L("Extra Deck")}: ${count} מתוך ${size} לכל היותר`,
		inDeck: (count) => (count === 0 ? "לא בחפיסה" : `${count} בחפיסה`),
		add: (card) => `להוסיף את ${card}`,
		remove: (card) => `להוציא את ${card}`,
		problems: {
			"main-size": `ב־${L("Main Deck")} צריכים להיות בדיוק 40 קלפים.`,
			"extra-size": `ב־${L("Extra Deck")} יש 15 קלפים לכל היותר.`,
			"too-many-copies": "3 עותקים של אותו קלף, לכל היותר.",
			"extra-in-main": `מפלצות ${L("Fusion")}, ${L("Synchro")}, ${L("Xyz")} ו־${L("Link")} הולכות ל־${L("Extra Deck")}.`,
			"main-in-extra": `רק מפלצות ${L("Fusion")}, ${L("Synchro")}, ${L("Xyz")} ו־${L("Link")} הולכות ל־${L("Extra Deck")}.`,
			"not-owned": "קלף בחפיסה לא נמצא באלבום שלכם.",
		},
		ready: "החפיסה שלכם מוכנה!",
		save: "לשמור את החפיסה",
		reset: "לחזור לחפיסת ההתחלה",
		close: "לסגור",
		needDeck: "כדי לאתגר את המאסטרים, צריך חפיסה של 40 קלפים.",
		editDeck: "לשנות את החפיסה",
		duelOn: `לכל מאסטר יש חפיסה משלו של 40 קלפים, מעורבבת. 8000 נקודות חיים לכל אחד.`,
	},
};
