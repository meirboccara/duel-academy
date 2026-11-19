import type { Locale } from "@/lib/i18n/locales";
import type { Direction, MapAction } from "./controls";
import type { Rarity } from "./shop";
import type { WardrobeSlot } from "./wardrobe";

const RARITY_EN: Record<Rarity, string> = { common: "Common", rare: "Rare", super: "Super Rare", ultra: "Ultra Rare", secret: "Secret Rare" };

/** Words of the map's on-screen controls, the stars and Grandpa's shop. */
export interface ControlsCopy {
	pad: string;
	directions: Record<Direction, string>;
	actions: Record<Exclude<MapAction, null>, string>;
	stars: (count: number) => string;
	shopButton: (stars: number) => string;
	shopName: string;
	shopWelcome: string;
	howStars: string;
	price: (stars: number) => string;
	buy: (stars: number) => string;
	owned: string;
	needMore: (stars: number) => string;
	bought: (name: string) => string;
	back: string;
	close: string;
	/** Rarity names. Hebrew keeps the English names, as printed on the cards. */
	rarity: Record<Rarity, string>;
	/** Said when a rare card (Super Rare and up) is bought: the bigger the rarity, the bigger the reward. */
	rareCheer: string;
	albumButton: (cards: number) => string;
	/** The shop's two tabs, the places on the figure, and putting things on. */
	cardsTab: string;
	heroTab: string;
	slots: Record<WardrobeSlot, string>;
	putOn: string;
	takeOff: string;
	wearing: string;
	boughtItem: (name: string) => string;
	/** "My hero": the character and everything it can wear; the outfit changes at any time, the character only before the first mission is done. */
	heroTitle: string;
	heroButton: string;
	character: string;
	ownLook: string;
	nothingYet: string;
	inShop: (stars: number) => string;
	/** The pause menu's pages, and how to turn them. */
	equipment: string;
	quest: string;
	nextPage: (title: string) => string;
	previousPage: (title: string) => string;
	turnHint: string;
	/** The keys on the pages with nothing to put on: only turning the page. */
	pageHint: string;
	/** The buttons that turn the hero on its stand (a finger dragged across it turns it too). */
	turnHeroLeft: string;
	turnHeroRight: string;
	/** The Quest page: the dorm, the stars, the islands and missions done. */
	noDorm: string;
	islandsDone: (done: number, total: number) => string;
	missionsDone: (done: number, total: number) => string;
	/** Said on the map after a solve: the stars won, and why there are more than one. */
	gained: (stars: number, island: boolean, duel: boolean) => string;
	/** Full screen: the button, and what to do where the browser cannot give it (an iPhone). */
	fullScreen: string;
	leaveFullScreen: string;
	fullScreenTip: string;
	/** Shown on a phone or a small tablet held upright: the game is played sideways. */
	turnTitle: string;
	turnBody: string;
}

export const CONTROLS_COPY: Record<Locale, ControlsCopy> = {
	en: {
		pad: "Move",
		directions: { up: "Up", down: "Down", left: "Left", right: "Right" },
		actions: { board: "Get on the boat", land: "Go ashore", enter: "Play this level", shop: "Open the shop" },
		stars: (count) => `${count} star${count === 1 ? "" : "s"}`,
		shopButton: (stars) => `Grandpa's shop: ${stars} star${stars === 1 ? "" : "s"} to spend`,
		shopName: "Grandpa's game shop",
		shopWelcome: "Welcome to my shop! The stars you win in your missions buy cards here, and clothes, hats and things to hold for your hero.",
		howStars: "Each mission gives a star, and one more when you get it right the first time. A real duel gives two, and a finished island two more.",
		price: (stars) => `${stars} ★`,
		buy: (stars) => `Buy for ${stars} ★`,
		owned: "In your binder",
		needMore: (stars) => `${stars} more ★ needed`,
		bought: (name) => `${name} is in your binder!`,
		back: "Back",
		close: "Close",
		rarity: RARITY_EN,
		rareCheer: "A rare card! Look how it shines!",
		albumButton: (cards) => `Your card album: ${cards} card${cards === 1 ? "" : "s"}`,
		cardsTab: "Cards",
		heroTab: "For your hero",
		slots: { shirt: "Shirts", cape: "Capes", hat: "Hats", held: "To hold" },
		putOn: "Put it on",
		takeOff: "Take it off",
		wearing: "Wearing it",
		boughtItem: (name) => `${name} is yours! Put it on.`,
		heroTitle: "My hero",
		heroButton: "My hero: character and outfit",
		character: "Character",
		ownLook: "Own look",
		nothingYet: "Nothing to wear yet: win stars in the missions and buy clothes, hats and things to hold in Grandpa's shop, on the first island.",
		inShop: (stars) => `in Grandpa's shop: ${stars} ★`,
		equipment: "Equipment",
		quest: "Quest",
		nextPage: (title) => `Next page: ${title}`,
		previousPage: (title) => `Previous page: ${title}`,
		turnHint: "Arrows: move · Enter: put on or take off · Q / E: turn the page",
		pageHint: "Q / E: turn the page · Escape: close",
		turnHeroLeft: "Turn the hero left",
		turnHeroRight: "Turn the hero right",
		noDorm: "No dorm yet: finish the first island to join one.",
		islandsDone: (done, total) => `Islands finished: ${done} of ${total}`,
		missionsDone: (done, total) => `Missions done: ${done} of ${total}`,
		gained: (stars, island, duel) => `+${stars} ★${island ? ": island finished!" : duel ? ": a real duel won!" : ""}`,
		fullScreen: "Full screen",
		leaveFullScreen: "Leave full screen",
		fullScreenTip: "To hide the browser's bars too: Share, then Add to Home Screen, and play from the new icon.",
		turnTitle: "Turn your screen sideways",
		turnBody: "The islands and the duels need a wide screen. Hold your phone or tablet sideways to play.",
	},
	fr: {
		pad: "Se déplacer",
		directions: { up: "Haut", down: "Bas", left: "Gauche", right: "Droite" },
		actions: { board: "Monter dans le bateau", land: "Débarquer", enter: "Jouer ce niveau", shop: "Ouvrir la boutique" },
		stars: (count) => `${count} étoile${count > 1 ? "s" : ""}`,
		shopButton: (stars) => `La boutique de Grand-père : ${stars} étoile${stars > 1 ? "s" : ""} à dépenser`,
		shopName: "La boutique de jeux de Grand-père",
		shopWelcome: "Bienvenue dans ma boutique ! Les étoiles gagnées dans tes missions achètent des cartes ici, et des habits, chapeaux et objets pour ton héros.",
		howStars: "Chaque mission donne une étoile, et une de plus si tu réussis du premier coup. Un vrai duel en donne deux, et une île terminée deux de plus.",
		price: (stars) => `${stars} ★`,
		buy: (stars) => `Acheter pour ${stars} ★`,
		owned: "Dans ton classeur",
		needMore: (stars) => `Encore ${stars} ★ à gagner`,
		bought: (name) => `${name} est dans ton classeur !`,
		back: "Retour",
		close: "Fermer",
		rarity: { common: "Commune", rare: "Rare", super: "Super Rare", ultra: "Ultra Rare", secret: "Rare Secrète" },
		rareCheer: "Une carte rare ! Regarde comme elle brille !",
		albumButton: (cards) => `Ton classeur : ${cards} carte${cards > 1 ? "s" : ""}`,
		cardsTab: "Cartes",
		heroTab: "Pour ton héros",
		slots: { shirt: "Chemises", cape: "Capes", hat: "Chapeaux", held: "À tenir" },
		putOn: "Le mettre",
		takeOff: "L’enlever",
		wearing: "Tu le portes",
		boughtItem: (name) => `${name} est à toi ! Mets-le.`,
		heroTitle: "Mon héros",
		heroButton: "Mon héros : personnage et tenue",
		character: "Personnage",
		ownLook: "Tenue d’origine",
		nothingYet: "Rien à porter pour l’instant : gagne des étoiles dans les missions et achète habits, chapeaux et objets dans la boutique de Grand-père, sur la première île.",
		inShop: (stars) => `dans la boutique de Grand-père : ${stars} ★`,
		equipment: "Équipement",
		quest: "Quête",
		nextPage: (title) => `Page suivante : ${title}`,
		previousPage: (title) => `Page précédente : ${title}`,
		turnHint: "Flèches : se déplacer · Entrée : mettre ou enlever · Q / E : tourner la page",
		pageHint: "Q / E : tourner la page · Échap : fermer",
		turnHeroLeft: "Tourner le héros vers la gauche",
		turnHeroRight: "Tourner le héros vers la droite",
		noDorm: "Pas encore de dortoir : termine la première île pour en rejoindre un.",
		islandsDone: (done, total) => `Îles terminées : ${done} sur ${total}`,
		missionsDone: (done, total) => `Missions réussies : ${done} sur ${total}`,
		gained: (stars, island, duel) => `+${stars} ★${island ? " : île terminée !" : duel ? " : vrai duel gagné !" : ""}`,
		fullScreen: "Plein écran",
		leaveFullScreen: "Quitter le plein écran",
		fullScreenTip: "Pour cacher aussi les barres du navigateur : Partager, puis Sur l’écran d’accueil, et joue depuis la nouvelle icône.",
		turnTitle: "Tourne ton écran",
		turnBody: "Les îles et les duels ont besoin d’un écran large. Tiens ton téléphone ou ta tablette à l’horizontale pour jouer.",
	},
	he: {
		pad: "תזוזה",
		directions: { up: "למעלה", down: "למטה", left: "שמאלה", right: "ימינה" },
		actions: { board: "לעלות לסירה", land: "לרדת לחוף", enter: "לשחק בשלב הזה", shop: "לפתוח את החנות" },
		stars: (count) => (count === 1 ? "כוכב אחד" : `${count} כוכבים`),
		shopButton: (stars) => `החנות של סבא: ${stars === 1 ? "כוכב אחד" : `${stars} כוכבים`} לבזבז`,
		shopName: "חנות המשחקים של סבא",
		shopWelcome: "ברוכים הבאים לחנות שלי! בכוכבים שאתם מרוויחים במשימות קונים כאן קלפים, וגם בגדים, כובעים וחפצים לגיבור שלכם.",
		howStars: "כל משימה נותנת כוכב, ועוד אחד כשמצליחים בניסיון הראשון. דו־קרב אמיתי נותן שניים, ואי שהושלם עוד שניים.",
		price: (stars) => `${stars} ★`,
		buy: (stars) => `לקנות ב־${stars} ★`,
		owned: "באלבום שלכם",
		needMore: (stars) => `חסרים עוד ${stars} ★`,
		bought: (name) => `${name} באלבום שלכם!`,
		back: "חזרה",
		close: "סגירה",
		rarity: RARITY_EN,
		rareCheer: "קלף נדיר! תראו איך הוא נוצץ!",
		albumButton: (cards) => `אלבום הקלפים שלכם: ${cards === 1 ? "קלף אחד" : `${cards} קלפים`}`,
		cardsTab: "קלפים",
		heroTab: "בשביל הגיבור שלכם",
		slots: { shirt: "חולצות", cape: "גלימות", hat: "כובעים", held: "להחזיק ביד" },
		putOn: "ללבוש",
		takeOff: "להוריד",
		wearing: "לובשים את זה",
		boughtItem: (name) => `${name} שלכם! לבשו אותו.`,
		heroTitle: "הגיבור שלי",
		heroButton: "הגיבור שלי: דמות ותלבושת",
		character: "דמות",
		ownLook: "המראה המקורי",
		nothingYet: "עדיין אין מה ללבוש: הרוויחו כוכבים במשימות וקנו בגדים, כובעים וחפצים בחנות של סבא, באי הראשון.",
		inShop: (stars) => `בחנות של סבא: ${stars} ★`,
		equipment: "ציוד",
		quest: "מסע",
		nextPage: (title) => `העמוד הבא: ${title}`,
		previousPage: (title) => `העמוד הקודם: ${title}`,
		turnHint: "חיצים: לזוז · ⁦Enter⁩: ללבוש או להוריד · ⁦Q / E⁩: להפוך עמוד",
		pageHint: "⁦Q / E⁩: להפוך עמוד · ⁦Escape⁩: לסגור",
		turnHeroLeft: "לסובב את הגיבור שמאלה",
		turnHeroRight: "לסובב את הגיבור ימינה",
		noDorm: "עדיין אין מעונות: סיימו את האי הראשון כדי להצטרף.",
		islandsDone: (done, total) => `איים שהושלמו: ${done} מתוך ${total}`,
		missionsDone: (done, total) => `משימות שהושלמו: ${done} מתוך ${total}`,
		gained: (stars, island, duel) => `+${stars} ★${island ? ": סיימתם את האי!" : duel ? ": ניצחתם בדו־קרב אמיתי!" : ""}`,
		fullScreen: "מסך מלא",
		leaveFullScreen: "יציאה ממסך מלא",
		fullScreenTip: "כדי להסתיר גם את הסרגלים של הדפדפן: שיתוף, ואז הוספה למסך הבית, ושחקו מהסמל החדש.",
		turnTitle: "סובבו את המסך",
		turnBody: "האיים והדו־קרבות צריכים מסך רחב. החזיקו את הטלפון או הטאבלט לרוחב כדי לשחק.",
	},
};
