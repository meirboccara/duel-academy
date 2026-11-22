import type { Locale } from "@/lib/i18n/locales";
import type { DeckProblem } from "./masters";
import type { StarterId } from "./starters";

/** The words of the masters' island Deck screens: choosing a starter deck, and changing the Deck. */
export interface DeckCopy {
	deckButton: string;
	deckTitle: string;
	chooseTitle: string;
	/** A newer edition of the child's starter Deck is offered. */
	updateTitle: string;
	updateText: (starter: string) => string;
	updateCards: string;
	updateMore: (count: number) => string;
	takeNew: string;
	keepMine: string;
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
	/** The Deck builder: its two sides, its filters, the search, the sort and the card panel. */
	yourDeck: string;
	binder: string;
	filters: Record<"all" | "monster" | "spell" | "trap" | "extra", string>;
	search: string;
	sort: string;
	sorts: Record<"level" | "atk" | "name", string>;
	counts: (monsters: number, spells: number, traps: number) => string;
	noCard: string;
	nothingFound: string;
	limits: Record<"Forbidden" | "Limited" | "Semi-Limited", string>;
	show: (card: string) => string;
}

const L = (text: string) => `⁦${text}⁩`;

export const DECK_COPY: Record<Locale, DeckCopy> = {
	fr: {
		deckButton: "Mon Deck",
		deckTitle: "Ton Deck pour les maîtres",
		chooseTitle: "Choisis ton Deck de départ",
		updateTitle: "Un nouveau Deck de départ !",
		updateText: (starter) => `Ton Deck ${starter} a une nouvelle version, comme les duellistes d’aujourd’hui : des hand traps, des cartes qui cherchent dans le Deck, et un Extra Deck de 15 cartes. Tu le prends, ou tu gardes le tien ? Ses nouvelles cartes vont dans ton classeur dans les deux cas.`,
		updateCards: "Les nouvelles cartes :",
		updateMore: (count) => `et ${count} de plus`,
		takeNew: "Prendre le nouveau Deck",
		keepMine: "Garder mon Deck",
		chooseText: "Chaque Deck a déjà son Extra Deck (Fusion, Synchro, Xyz et Lien). Ses cartes vont dans ton classeur. Ensuite, tu pourras changer ton Deck quand tu veux, avec toutes les cartes de ton classeur.",
		starters: {
			warrior: { name: "Magicien Sombre", text: "Magicien Sombre et ses amis. En Fusion : Paladin Sombre, les Chevaliers Dragons, Dragon Crâne Noir." },
			dragon: { name: "Yeux Bleus", text: "Trois Dragons Blancs aux Yeux Bleus. En Extra Deck : le Dragon Ultime, le Dragon à Double Éclat, le Dragon Esprit." },
			hero: { name: "Héros Élémentaires", text: "Des Héros qui fusionnent : Homme-Oiseau de Feu, Homme-Oiseau Éclatant, Géant du Tonnerre, Grande Tornade…" },
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
			banlist: "La liste des cartes Interdites et Limitées du TCG : 0 carte Interdite, 1 carte Limitée, 2 Semi-Limitées.",
		},
		ready: "Ton Deck est prêt !",
		save: "Garder ce Deck",
		reset: "Revenir au Deck de départ",
		close: "Fermer",
		needDeck: "Pour défier les maîtres, il te faut un Deck de 40 cartes.",
		editDeck: "Changer mon Deck",
		duelOn: "Chaque maître a son propre Deck de 40 cartes, mélangé. 8000 Points de Vie chacun.",
		yourDeck: "Ton Deck",
		binder: "Ton classeur",
		filters: { all: "Tout", monster: "Monstres", spell: "Magies", trap: "Pièges", extra: "Extra Deck" },
		search: "Chercher une carte",
		sort: "Trier par",
		sorts: { level: "Niveau", atk: "ATK", name: "Nom" },
		counts: (monsters, spells, traps) => `${monsters} Monstres · ${spells} Magies · ${traps} Pièges`,
		noCard: "Touche une carte pour la lire.",
		nothingFound: "Aucune carte ne correspond.",
		limits: { Forbidden: "Interdite : 0 exemplaire", Limited: "Limitée : 1 exemplaire", "Semi-Limited": "Semi-Limitée : 2 exemplaires" },
		show: (card) => `Lire ${card}`,
	},
	en: {
		deckButton: "My Deck",
		deckTitle: "Your Deck for the masters",
		chooseTitle: "Choose your starter Deck",
		updateTitle: "A new starter Deck!",
		updateText: (starter) => `Your ${starter} Deck has a new version, like today's duelists play: hand traps, cards that search the Deck, and a 15-card Extra Deck. Take it, or keep yours? Its new cards go into your binder either way.`,
		updateCards: "The new cards:",
		updateMore: (count) => `and ${count} more`,
		takeNew: "Take the new Deck",
		keepMine: "Keep my Deck",
		chooseText: "Each Deck comes with its Extra Deck (Fusion, Synchro, Xyz and Link). Its cards go into your binder. Then you can change your Deck any time, with every card in your binder.",
		starters: {
			warrior: { name: "Dark Magician", text: "Dark Magician and friends. Fusions: Dark Paladin, the Dragon Knights, Black Skull Dragon." },
			dragon: { name: "Blue-Eyes", text: "Three Blue-Eyes White Dragons. Extra Deck: Ultimate Dragon, Twin Burst Dragon, Spirit Dragon." },
			hero: { name: "Elemental HEROes", text: "HEROes that fuse: Flame Wingman, Shining Flare Wingman, Thunder Giant, Great Tornado…" },
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
			banlist: "The TCG Forbidden & Limited List: no Forbidden card, 1 copy of a Limited card, 2 of a Semi-Limited card.",
		},
		ready: "Your Deck is ready!",
		save: "Keep this Deck",
		reset: "Back to the starter Deck",
		close: "Close",
		needDeck: "To challenge the masters, you need a Deck of 40 cards.",
		editDeck: "Change my Deck",
		duelOn: "Each master has their own shuffled Deck of 40 cards. 8000 Life Points each.",
		yourDeck: "Your Deck",
		binder: "Your binder",
		filters: { all: "All", monster: "Monsters", spell: "Spells", trap: "Traps", extra: "Extra Deck" },
		search: "Search for a card",
		sort: "Sort by",
		sorts: { level: "Level", atk: "ATK", name: "Name" },
		counts: (monsters, spells, traps) => `${monsters} Monsters · ${spells} Spells · ${traps} Traps`,
		noCard: "Tap a card to read it.",
		nothingFound: "No card matches.",
		limits: { Forbidden: "Forbidden: 0 copies", Limited: "Limited: 1 copy", "Semi-Limited": "Semi-Limited: 2 copies" },
		show: (card) => `Read ${card}`,
	},
	he: {
		deckButton: `החפיסה שלי (${L("Deck")})`,
		deckTitle: "החפיסה שלכם מול המאסטרים",
		chooseTitle: "בחרו חפיסת התחלה",
		updateTitle: "חפיסת התחלה חדשה!",
		updateText: (starter) => `לחפיסת ה־${starter} שלכם יש גרסה חדשה, כמו שמשחקים היום: ⁦hand traps⁩, קלפים שמחפשים ב־⁦Deck⁩, ו־⁦Extra Deck⁩ של 15 קלפים. לוקחים אותה, או שומרים את שלכם? הקלפים החדשים נכנסים לאלבום בכל מקרה.`,
		updateCards: "הקלפים החדשים:",
		updateMore: (count) => `ועוד ${count}`,
		takeNew: "לקחת את החפיסה החדשה",
		keepMine: "לשמור את החפיסה שלי",
		chooseText: `לכל חפיסה כבר יש ${L("Extra Deck")} (${L("Fusion")}, ${L("Synchro")}, ${L("Xyz")}, ${L("Link")}). הקלפים שלה נכנסים לאלבום שלכם. אחר כך אפשר לשנות את החפיסה מתי שרוצים, עם כל הקלפים שבאלבום.`,
		starters: {
			warrior: { name: L("Dark Magician"), text: `${L("Dark Magician")} והחברים שלו. מיזוגים: ${L("Dark Paladin")}, אבירי הדרקון, ${L("Black Skull Dragon")}.` },
			dragon: { name: L("Blue-Eyes"), text: `שלושה ${L("Blue-Eyes White Dragon")}. ב־${L("Extra Deck")}: ${L("Ultimate")}, ${L("Twin Burst")}, ${L("Spirit Dragon")}.` },
			hero: { name: `${L("Elemental HERO")}`, text: `גיבורים שמתמזגים: ${L("Flame Wingman")}, ${L("Shining Flare Wingman")}, ${L("Thunder Giant")}, ${L("Great Tornado")}…` },
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
			banlist: `רשימת ${L("Forbidden & Limited")} של ה־${L("TCG")}: אף קלף אסור, עותק אחד של קלף מוגבל, 2 של קלף מוגבל־למחצה.`,
		},
		ready: "החפיסה שלכם מוכנה!",
		save: "לשמור את החפיסה",
		reset: "לחזור לחפיסת ההתחלה",
		close: "לסגור",
		needDeck: "כדי לאתגר את המאסטרים, צריך חפיסה של 40 קלפים.",
		editDeck: "לשנות את החפיסה",
		duelOn: `לכל מאסטר יש חפיסה משלו של 40 קלפים, מעורבבת. 8000 נקודות חיים לכל אחד.`,
		yourDeck: "החפיסה שלכם",
		binder: "האלבום שלכם",
		filters: { all: "הכול", monster: "מפלצות", spell: "לחשים", trap: "מלכודות", extra: L("Extra Deck") },
		search: "חיפוש קלף",
		sort: "מיון לפי",
		sorts: { level: "רמה", atk: "ATK", name: "שם" },
		counts: (monsters, spells, traps) => `${monsters} מפלצות · ${spells} לחשים · ${traps} מלכודות`,
		noCard: "געו בקלף כדי לקרוא אותו.",
		nothingFound: "אין קלף מתאים.",
		limits: { Forbidden: "אסור: 0 עותקים", Limited: "מוגבל: עותק אחד", "Semi-Limited": "מוגבל־למחצה: 2 עותקים" },
		show: (card) => `לקרוא את ${card}`,
	},
};
