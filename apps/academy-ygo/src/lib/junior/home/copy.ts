import type { Locale } from "@/lib/i18n/locales";
import type { Avatar } from "../profiles";

/** Words of the title screen, the save slots, the character choice and the "manage a save" view. */
export interface HomeCopy {
	title: string;
	tagline: string;
	continue: string;
	newGame: string;
	savesTitle: string;
	defaultName: (slot: number) => string;
	emptySlot: string;
	islands: (done: number, total: number) => string;
	cards: (count: number) => string;
	playedOn: (days: number) => string;
	open: (name: string) => string;
	manage: (name: string) => string;
	allTaken: string;
	replaceThis: (name: string) => string;
	cancel: string;
	noStorage: string;
	play: string;
	chooseTitle: string;
	avatars: Record<Avatar, string>;
	ok: string;
	back: string;
	nameTitle: string;
	nameLabel: string;
	nameHint: string;
	skip: string;
	/** Confirmations, for "replace" and "delete": Keep is first and has the focus. */
	confirmReplace: (name: string) => string;
	confirmDelete: (name: string) => string;
	loses: (levels: number, cards: number) => string;
	keep: string;
	replace: string;
	delete: string;
	saveCopyFirst: string;
	/** The game's button back to the title screen (Continue, New game), out of full screen: its short words and its full name. */
	titleScreen: string;
	backToTitle: (name: string | null) => string;
	/** A save's own language, which may differ from the site's: the choice, and "the site's", whichever it is. */
	language: string;
	siteLanguage: string;
	/* The manage view. */
	manageTitle: (name: string) => string;
	rename: string;
	changeCharacter: string;
	/** Said instead of "Change character" once the first mission is done. */
	characterLocked: string;
	saveCopy: string;
	saveCopyHint: string;
	saveFile: string;
	share: string;
	copy: string;
	copied: string;
	loadCopy: string;
	loadHint: string;
	pasteLabel: string;
	pickFile: string;
	load: string;
	loadedPreview: (name: string, levels: number) => string;
	notACode: string;
	damaged: string;
	persisted: string;
	mayDelete: string;
	homeScreenTitle: string;
	homeScreenSteps: string;
	close: string;
	staleSave: string;
	newCards: (count: number) => string;
	gotIt: string;
	binderHint: string;
}

export const HOME_COPY: Record<Locale, HomeCopy> = {
	en: {
		title: "Duel Academy",
		tagline: "Learn Yu-Gi-Oh! by playing.",
		continue: "Continue",
		newGame: "New game",
		savesTitle: "Saves",
		defaultName: (slot) => `Duelist ${slot}`,
		emptySlot: "Empty: new game",
		islands: (done, total) => `${done} of ${total} islands`,
		cards: (count) => `${count} card${count === 1 ? "" : "s"}`,
		playedOn: (days) => (days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`),
		open: (name) => `Play as ${name}`,
		manage: (name) => `Manage ${name}'s save`,
		allTaken: "All three places are taken. Choose a save to replace.",
		replaceThis: (name) => `Replace ${name}`,
		cancel: "Cancel",
		noStorage: "This browser will not keep your progress.",
		play: "Play",
		chooseTitle: "Who are you?",
		avatars: { knight: "Knight", mage: "Mage", rogue: "Rogue", star: "Star", witch: "Witch", explorer: "Explorer" },
		ok: "OK",
		back: "Back",
		nameTitle: "Your nickname",
		nameLabel: "Nickname",
		nameHint: "A nickname, not your full name.",
		skip: "Skip",
		confirmReplace: (name) => `Replace ${name}'s save?`,
		confirmDelete: (name) => `Delete ${name}'s save?`,
		loses: (levels, cards) => `This loses ${levels} level${levels === 1 ? "" : "s"} and ${cards} card${cards === 1 ? "" : "s"}.`,
		keep: "Keep",
		replace: "Replace",
		delete: "Delete",
		saveCopyFirst: "Save a copy first",
		titleScreen: "Title screen",
		language: "Language of this save",
		siteLanguage: "Same as the site",
		backToTitle: (name) => `Back to the title screen: Continue or New game${name === null ? "" : ` (now ${name})`}`,
		manageTitle: (name) => `${name}'s save`,
		rename: "Change nickname",
		changeCharacter: "Change character",
		characterLocked: "Your character stays the same once the first mission is done: it is part of your story now.",
		saveCopy: "Save a copy",
		saveCopyHint: "For grown-ups: the copy is a text code with the nickname and the progress. Keep it in Notes, Mail or a file, and load it in another browser.",
		saveFile: "Save as a file",
		share: "Share",
		copy: "Copy",
		copied: "Copied",
		loadCopy: "Load a copy",
		loadHint: "Paste a code, or pick the file. Solved levels are added; nothing is lost.",
		pasteLabel: "Save code",
		pickFile: "Pick a file",
		load: "Load",
		loadedPreview: (name, levels) => `${name}: ${levels} level${levels === 1 ? "" : "s"}`,
		notACode: "This is not a Duel Academy save code.",
		damaged: "This code is damaged: part of it is missing. Copy it again.",
		persisted: "This browser has agreed to keep the saves.",
		mayDelete: "This browser may delete the saves: keep a copy.",
		homeScreenTitle: "Keep the saves on an iPad or iPhone",
		homeScreenSteps: "Save a copy first. Then tap Share, then Add to Home Screen. Open the game from the new icon and load the copy. The game then keeps its saves better.",
		close: "Close",
		staleSave: "This save was changed in another window.",
		newCards: (count) => (count === 1 ? "A new card for your binder!" : ` new cards for your binder!`),
		gotIt: "Great!",
		binderHint: "Gold cards are gifts from the trainers.",
	},
	fr: {
		title: "Duel Academy",
		tagline: "Apprends Yu-Gi-Oh! en jouant.",
		continue: "Continuer",
		newGame: "Nouvelle partie",
		savesTitle: "Sauvegardes",
		defaultName: (slot) => `Duelliste ${slot}`,
		emptySlot: "Vide : nouvelle partie",
		islands: (done, total) => `${done} île${done > 1 ? "s" : ""} sur ${total}`,
		cards: (count) => `${count} carte${count > 1 ? "s" : ""}`,
		playedOn: (days) => (days <= 0 ? "aujourd’hui" : days === 1 ? "hier" : `il y a ${days} jours`),
		open: (name) => `Jouer avec ${name}`,
		manage: (name) => `Gérer la sauvegarde de ${name}`,
		allTaken: "Les trois places sont prises. Choisis une sauvegarde à remplacer.",
		replaceThis: (name) => `Remplacer ${name}`,
		cancel: "Annuler",
		noStorage: "Ce navigateur ne gardera pas ta progression.",
		play: "Jouer",
		chooseTitle: "Qui es-tu ?",
		avatars: { knight: "Chevalier", mage: "Mage", rogue: "Voleur", star: "Étoile", witch: "Sorcière", explorer: "Exploratrice" },
		ok: "OK",
		back: "Retour",
		nameTitle: "Ton surnom",
		nameLabel: "Surnom",
		nameHint: "Un surnom, pas ton nom complet.",
		skip: "Passer",
		confirmReplace: (name) => `Remplacer la sauvegarde de ${name} ?`,
		confirmDelete: (name) => `Supprimer la sauvegarde de ${name} ?`,
		loses: (levels, cards) => `Cela fait perdre ${levels} niveau${levels > 1 ? "x" : ""} et ${cards} carte${cards > 1 ? "s" : ""}.`,
		keep: "Garder",
		replace: "Remplacer",
		delete: "Supprimer",
		saveCopyFirst: "D’abord faire une copie",
		titleScreen: "Écran titre",
		language: "Langue de cette partie",
		siteLanguage: "Comme le site",
		backToTitle: (name) => `Retour à l’écran titre : Continuer ou Nouvelle partie${name === null ? "" : ` (maintenant ${name})`}`,
		manageTitle: (name) => `La sauvegarde de ${name}`,
		rename: "Changer le surnom",
		changeCharacter: "Changer de personnage",
		characterLocked: "Ton personnage ne change plus une fois la première mission terminée : il fait partie de ton histoire.",
		saveCopy: "Faire une copie",
		saveCopyHint: "Pour les adultes : la copie est un code texte avec le surnom et la progression. Gardez-la dans Notes, Mail ou un fichier, et chargez-la dans un autre navigateur.",
		saveFile: "Enregistrer un fichier",
		share: "Partager",
		copy: "Copier",
		copied: "Copié",
		loadCopy: "Charger une copie",
		loadHint: "Collez un code, ou choisissez le fichier. Les niveaux réussis s’ajoutent ; rien n’est perdu.",
		pasteLabel: "Code de sauvegarde",
		pickFile: "Choisir un fichier",
		load: "Charger",
		loadedPreview: (name, levels) => `${name} : ${levels} niveau${levels > 1 ? "x" : ""}`,
		notACode: "Ce n’est pas un code de sauvegarde de Duel Academy.",
		damaged: "Ce code est abîmé : il en manque une partie. Copiez-le à nouveau.",
		persisted: "Ce navigateur a accepté de garder les sauvegardes.",
		mayDelete: "Ce navigateur peut effacer les sauvegardes : gardez une copie.",
		homeScreenTitle: "Garder les sauvegardes sur iPad ou iPhone",
		homeScreenSteps: "Faites d’abord une copie. Touchez Partager, puis Sur l’écran d’accueil. Ouvrez le jeu depuis la nouvelle icône et chargez la copie. Le jeu garde alors mieux ses sauvegardes.",
		close: "Fermer",
		staleSave: "Cette sauvegarde a été changée dans une autre fenêtre.",
		newCards: (count) => (count === 1 ? "Une nouvelle carte pour ton classeur !" : ` nouvelles cartes pour ton classeur !`),
		gotIt: "Super !",
		binderHint: "Les cartes dorées sont des cadeaux des entraîneurs.",
	},
	he: {
		title: "Duel Academy",
		tagline: "לומדים יו-גי-הו! תוך כדי משחק.",
		continue: "להמשיך",
		newGame: "משחק חדש",
		savesTitle: "שמירות",
		defaultName: (slot) => `דואליסט ${slot}`,
		emptySlot: "ריק: משחק חדש",
		islands: (done, total) => `${done} מתוך ${total} איים`,
		cards: (count) => `${count} קלפים`,
		playedOn: (days) => (days <= 0 ? "היום" : days === 1 ? "אתמול" : `לפני ${days} ימים`),
		open: (name) => `לשחק בתור ${name}`,
		manage: (name) => `לנהל את השמירה של ${name}`,
		allTaken: "שלושת המקומות תפוסים. בחרו שמירה להחליף.",
		replaceThis: (name) => `להחליף את ${name}`,
		cancel: "ביטול",
		noStorage: "הדפדפן הזה לא ישמור את ההתקדמות שלכם.",
		play: "לשחק",
		chooseTitle: "מי אתם?",
		avatars: { knight: "אביר", mage: "קוסם", rogue: "נווד", star: "כוכבת", witch: "מכשפה", explorer: "מטיילת" },
		ok: "אישור",
		back: "חזרה",
		nameTitle: "הכינוי שלכם",
		nameLabel: "כינוי",
		nameHint: "כינוי, לא השם המלא שלכם.",
		skip: "לדלג",
		confirmReplace: (name) => `להחליף את השמירה של ${name}?`,
		confirmDelete: (name) => `למחוק את השמירה של ${name}?`,
		loses: (levels, cards) => `כך יאבדו ${levels} שלבים ו־${cards} קלפים.`,
		keep: "לשמור",
		replace: "להחליף",
		delete: "למחוק",
		saveCopyFirst: "קודם לשמור עותק",
		titleScreen: "מסך הפתיחה",
		language: "השפה של השמירה הזאת",
		siteLanguage: "כמו באתר",
		backToTitle: (name) => `חזרה למסך הפתיחה: להמשיך או משחק חדש${name === null ? "" : ` (עכשיו ${name})`}`,
		manageTitle: (name) => `השמירה של ${name}`,
		rename: "לשנות כינוי",
		changeCharacter: "להחליף דמות",
		characterLocked: "הדמות שלכם לא משתנה אחרי שהמשימה הראשונה הושלמה: היא חלק מהסיפור שלכם.",
		saveCopy: "לשמור עותק",
		saveCopyHint: "למבוגרים: העותק הוא קוד טקסט עם הכינוי וההתקדמות. שמרו אותו בפתקים, בדואר או בקובץ, וטענו אותו בדפדפן אחר.",
		saveFile: "לשמור כקובץ",
		share: "לשתף",
		copy: "להעתיק",
		copied: "הועתק",
		loadCopy: "לטעון עותק",
		loadHint: "הדביקו קוד, או בחרו את הקובץ. שלבים שנפתרו מתווספים; שום דבר לא הולך לאיבוד.",
		pasteLabel: "קוד שמירה",
		pickFile: "לבחור קובץ",
		load: "לטעון",
		loadedPreview: (name, levels) => `${name}: ${levels} שלבים`,
		notACode: "זה לא קוד שמירה של Duel Academy.",
		damaged: "הקוד הזה פגום: חסר בו חלק. העתיקו אותו שוב.",
		persisted: "הדפדפן הזה הסכים לשמור את השמירות.",
		mayDelete: "הדפדפן הזה עלול למחוק את השמירות: שמרו עותק.",
		homeScreenTitle: "לשמור את השמירות באייפד או באייפון",
		homeScreenSteps: "קודם שמרו עותק. אחר כך געו ב״שיתוף״ ואז ב״הוספה למסך הבית״. פתחו את המשחק מהסמל החדש וטענו את העותק. כך המשחק שומר טוב יותר.",
		close: "סגירה",
		staleSave: "השמירה הזאת שונתה בחלון אחר.",
		newCards: (count) => (count === 1 ? "קלף חדש לאלבום שלכם!" : ` קלפים חדשים לאלבום שלכם!`),
		gotIt: "מעולה!",
		binderHint: "הקלפים המוזהבים הם מתנות מהמאמנים.",
	},
};
