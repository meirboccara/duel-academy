import type { Locale } from "@/lib/i18n/locales";
import { jargonIn } from "./jargon";

/**
 * Sentences that explanations for children share. An explanation writes the token (`{answer}`), and every card shows
 * the same sentence in the reader's language. Changing a sentence here changes it on every card, since tokens are
 * stored and only turned into words when shown (docs/kid-explanations-guide.md).
 */
export const PHRASES = {
	/** Someone can answer before the card works; the last card played happens first. */
	answer: {
		en: "Your friend can still answer with a card first, and the last card played happens first.",
		fr: "Ton adversaire peut encore répondre avec une carte avant, et la dernière carte jouée passe en premier.",
		he: "היריב עוד יכול לענות קודם עם קלף, והקלף האחרון ששוחק קורה ראשון.",
	},
	/** After the sentence saying what you must give up first: that stays given up even if the card is stopped. */
	cost: {
		en: "This happens even if your friend stops the card afterwards.",
		fr: "Ça reste fait, même si ton adversaire arrête la carte ensuite.",
		he: "זה נשאר כך, גם אם היריב עוצר את הקלף אחר כך.",
	},
	/** The picked card left before the card worked. */
	"if-gone": {
		en: "If the card you picked is gone by then, nothing happens to it.",
		fr: "Si la carte que tu as choisie a disparu, il ne lui arrive rien.",
		he: "אם הקלף שבחרתם כבר נעלם, לא קורה לו כלום.",
	},
	/** A Trap must be Set first, and cannot be used the turn it is Set; from the next turn on it can, either player's. */
	"set-trap": {
		en: "Place this Trap face-down first: you can use it from the next turn on, even your friend's.",
		fr: "Pose d’abord ce Piège face cachée : tu peux t’en servir dès le tour suivant, même celui de ton adversaire.",
		he: "קודם הניחו את המלכודת הזו עם הפנים למטה: אפשר להשתמש בה מהתור הבא, גם בתור של היריב.",
	},
	/** When a Quick-Play Spell can be used. */
	"quick-play": {
		en: "You can play it on your turn, or place it face-down and surprise your friend on a later turn, even theirs.",
		fr: "Tu peux la jouer pendant ton tour, ou la poser face cachée pour surprendre ton adversaire à un tour suivant, même le sien.",
		he: "אפשר לשחק אותו בתור שלכם, או להניח אותו עם הפנים למטה ולהפתיע את היריב בתור מאוחר יותר, גם בתור שלו.",
	},

	/*
	 * How an effect works. Sources: Konami, Fast Effect Timing (Quick Effects: "even during their opponent's turn");
	 * the When/If and the two once-per-turn rules are backed only by YGOProJudge (2026-11-23): Konami's PSCT pages do
	 * not cover them, and the rulebook PDF could not be read here. `mandatory` and `optional` follow from the words "You can".
	 */
	/** No "You can": the effect must happen ("Add…", "Destroy…"). */
	mandatory: {
		en: "This always happens, even if you don't want it to.",
		fr: "Ça arrive toujours, même si tu ne le veux pas.",
		he: "זה תמיד קורה, גם אם אתם לא רוצים.",
	},
	/** "You can": the player chooses. */
	optional: {
		en: "You choose if you want to use it.",
		fr: "Tu choisis si tu veux l’utiliser.",
		he: "אתם בוחרים אם להשתמש בזה.",
	},
	/** Only for an optional "When … : You can" (it can miss its moment); a mandatory "When" never does. YGOProJudge only. */
	when: {
		en: "It only works if that was the very last thing that happened. If something else happened just after, the moment is lost.",
		fr: "Ça marche seulement si c’était la toute dernière chose qui s’est passée. Si autre chose s’est passé juste après, le moment est raté.",
		he: "זה עובד רק אם זה היה הדבר האחרון שקרה. אם משהו אחר קרה מיד אחרי, הרגע הוחמץ.",
	},
	/** An optional "If … : You can": it does not miss its moment. YGOProJudge only. */
	if: {
		en: "It still works even if other things happened just after.",
		fr: "Ça marche quand même, même si d’autres choses se sont passées juste après.",
		he: "זה עובד גם אם דברים אחרים קרו מיד אחרי.",
	},
	/** "Once per turn:": this copy only, and a card that leaves the field or is turned face-down is a new card. */
	"once-per-turn": {
		en: "You can use this once each turn. If this card leaves the field or is turned face-down and comes back, it is like a new card and can use it again this turn.",
		fr: "Tu peux t’en servir une fois par tour. Si cette carte quitte le Terrain ou est retournée face cachée puis revient, c’est comme une nouvelle carte : elle peut s’en servir encore ce tour-ci.",
		he: "אפשר להשתמש בזה פעם אחת בכל תור. אם הקלף עוזב את השדה או מתהפך עם הפנים למטה וחוזר, הוא כמו קלף חדש ויכול להשתמש בזה שוב באותו תור.",
	},
	/** "You can only use this effect of [name] once per turn": all copies together, even after leaving the field. */
	"once-per-turn-name": {
		en: "You can use this only once each turn, even with several copies of this card, and even if it leaves the field and comes back.",
		fr: "Tu ne peux t’en servir qu’une fois par tour, même avec plusieurs exemplaires de cette carte, et même si elle quitte le Terrain et revient.",
		he: "אפשר להשתמש בזה רק פעם אחת בכל תור, גם עם כמה עותקים של הקלף הזה, וגם אם הוא עוזב את השדה וחוזר.",
	},
	/** "(Quick Effect)". */
	"quick-effect": {
		en: "This monster can use its power even on your friend's turn, even right after they play a card.",
		fr: "Ce monstre peut utiliser son pouvoir même pendant le tour de ton adversaire, même juste après qu’il a joué une carte.",
		he: "המפלצת הזו יכולה להשתמש בכוח שלה גם בתור של היריב, גם מיד אחרי שהוא שיחק קלף.",
	},

	/* The words that join two parts of an effect. Source: Konami, PSCT Part 7 "Conjunction Functions". */
	/** "Do A, then do B": in order; no A, no B. */
	then: {
		en: "First the first part happens, then the second. If the first part doesn't happen, the second doesn't either.",
		fr: "D’abord la première partie arrive, puis la seconde. Si la première n’arrive pas, la seconde non plus.",
		he: "קודם קורה החלק הראשון, ואחר כך השני. אם החלק הראשון לא קורה, גם השני לא.",
	},
	/** "Do A, also do B": at the same time; neither needs the other. */
	also: {
		en: "Both parts happen at the same time, and each one happens even if the other can't.",
		fr: "Les deux parties arrivent en même temps, et chacune arrive même si l’autre ne peut pas.",
		he: "שני החלקים קורים באותו זמן, וכל אחד קורה גם אם השני לא יכול.",
	},
	/** "Do A, and if you do, do B": at the same time; B needs A. */
	"if-you-do": {
		en: "Both parts happen at the same time, but the second part only happens if the first one did.",
		fr: "Les deux parties arrivent en même temps, mais la seconde arrive seulement si la première a eu lieu.",
		he: "שני החלקים קורים באותו זמן, אבל החלק השני קורה רק אם הראשון קרה.",
	},

	/* What happens to a card. The card's own words may say "destroyed", "banished"…: these sentences explain them. */
	/** "destroy": broken; usually to the Graveyard (a Token disappears, a Pendulum Monster goes to the Extra Deck). */
	destroy: {
		en: "Destroyed means broken: usually, the card goes to the Graveyard.",
		fr: "Détruite veut dire cassée : en général, la carte va au Cimetière.",
		he: "השמדה פירושה שהקלף נשבר: בדרך כלל הוא הולך לבית הקברות.",
	},
	/** The card's own words say how ("by battle", "by card effects"); this says what it does not stop. */
	"cannot-be-destroyed": {
		en: "Breaking it doesn't work, but it can still be sent away in other ways, like being banished.",
		fr: "On ne peut pas la casser, mais elle peut quand même partir autrement, par exemple en étant bannie.",
		he: "אי אפשר לשבור אותו, אבל הוא עדיין יכול לעזוב בדרכים אחרות, למשל בגירוש.",
	},
	/** "send to the GY": not a destruction, so "cannot be destroyed" does not stop it. */
	"send-to-gy": {
		en: "The card goes to the Graveyard without being broken, so a card that can't be broken can still be sent there.",
		fr: "La carte va au Cimetière sans être cassée : même une carte qu’on ne peut pas casser peut y être envoyée.",
		he: "הקלף הולך לבית הקברות בלי להישבר, כך שגם קלף שאי אפשר לשבור יכול להישלח לשם.",
	},
	/** "banish": put aside, not to the Graveyard; it is still in play and some cards bring it back. */
	banish: {
		en: "Banished means put aside, away from the Graveyard. Some cards can bring it back.",
		fr: "Bannie veut dire mise de côté, à part du Cimetière. Certaines cartes peuvent la faire revenir.",
		he: "גירוש פירושו שהקלף מונח בצד, לא בבית הקברות. יש קלפים שיכולים להחזיר אותו.",
	},
	/** "discard": from the hand to the Graveyard. */
	discard: {
		en: "Discarding means putting a card from your hand into the Graveyard.",
		fr: "Défausser veut dire mettre une carte de ta main au Cimetière.",
		he: "זריקה פירושה להעביר קלף מהיד לבית הקברות.",
	},
	/** "Tribute": a monster from the field to the Graveyard; often for a Tribute Summon, but effects can ask for it too. */
	tribute: {
		en: "A Tribute means sending a monster from the field to the Graveyard, often to summon a stronger one.",
		fr: "Un Sacrifice, c’est envoyer un monstre du Terrain au Cimetière, souvent pour invoquer un monstre plus fort.",
		he: "הקרבה פירושה לשלוח מפלצת מהשדה לבית הקברות, הרבה פעמים כדי לזמן מפלצת חזקה יותר.",
	},
	/** "Special Summon": does not use the normal summon of the turn. */
	"special-summon": {
		en: "A Special Summon brings a monster onto the field in a special way, and it doesn't use up your normal summon for the turn.",
		fr: "Une Invocation Spéciale amène un monstre sur le Terrain d’une façon spéciale, sans utiliser ton Invocation normale du tour.",
		he: "זימון מיוחד מביא מפלצת לשדה בדרך מיוחדת, בלי לבזבז את הזימון הרגיל שלכם בתור.",
	},
	/** "return to the hand": to its owner's hand; Extra Deck monsters go back to the Extra Deck. */
	"return-to-hand": {
		en: "The card goes back to its owner's hand. A Fusion, Synchro, Xyz or Link monster goes back to the Extra Deck instead.",
		fr: "La carte retourne dans la main de son propriétaire. Un monstre Fusion, Synchro, Xyz ou Lien retourne plutôt dans l’Extra Deck.",
		he: "הקלף חוזר ליד של הבעלים שלו. מפלצת מיזוג, סינכרו, Xyz או קישור חוזרת במקום זה לחפיסה הנוספת.",
	},
	/** "negate": it does nothing; a monster with negated effects still stays and can attack. */
	negate: {
		en: "Negated means stopped: that card or effect does nothing, but a monster whose effects are negated can still attack.",
		fr: "Annulé veut dire arrêté : cette carte ou cet effet ne fait rien, mais un monstre dont les effets sont annulés peut quand même attaquer.",
		he: "ביטול פירושו עצירה: הקלף או הכוח הזה לא עושה כלום, אבל מפלצת שהכוחות שלה בוטלו עדיין יכולה לתקוף.",
	},
	/** "Set": face-down, hidden from the other player. */
	set: {
		en: "Setting a card means placing it face-down so your friend can't see it.",
		fr: "Poser une carte veut dire la placer face cachée pour que ton adversaire ne la voie pas.",
		he: "להניח קלף פירושו לשים אותו עם הפנים למטה כדי שהיריב לא יראה אותו.",
	},
	/** "Equip": stuck to a monster; destroyed when that monster leaves the field or is turned face-down. */
	equip: {
		en: "An Equip card sticks to a monster and changes it. If the monster leaves the field or is turned face-down, the Equip card is destroyed.",
		fr: "Une carte Équipement s’accroche à un monstre et le change. Si le monstre quitte le Terrain ou est retourné face cachée, la carte Équipement est détruite.",
		he: "קלף ציוד נדבק למפלצת ומשנה אותה. אם המפלצת עוזבת את השדה או מתהפכת עם הפנים למטה, קלף הציוד מושמד.",
	},
} as const satisfies Record<string, Record<Locale, string>>;

export type PhraseKey = keyof typeof PHRASES;

const TOKEN = /\{([a-z-]+)\}/g;

function isPhrase(key: string): key is PhraseKey {
	return Object.hasOwn(PHRASES, key);
}

/**
 * Words that give away a shared sentence written by hand: a draft that says it in its own words must use the token, or
 * the same idea would read differently from card to card. Only ideas with tell-tale wording are here: a card's own
 * words may well say "destroyed", "banished" or "then".
 */
const HAND_WRITTEN: Partial<Record<PhraseKey, Record<Locale, RegExp>>> = {
	mandatory: { en: /\beven if you don.t want/i, fr: /même si tu ne le veux pas/i, he: /גם אם אתם לא רוצים/ },
	when: { en: /\bvery last thing\b/i, fr: /toute dernière chose/i, he: /הדבר האחרון שקרה/ },
	"once-per-turn-name": { en: /\bseveral copies\b/i, fr: /plusieurs exemplaires/i, he: /כמה עותקים/ },
	"once-per-turn": { en: /\bonce (?:each|per|a) turn\b/i, fr: /une fois par tour/i, he: /פעם אחת בכל תור/ },
	"quick-effect": { en: /\beven on your friend.s turn\b/i, fr: /même pendant le tour de ton adversaire/i, he: /גם בתור של היריב, גם מיד/ },
	answer: { en: /\b(?:can still )?answer with\b|\bcard to answer\b/i, fr: /répondre avec|pour répondre/i, he: /לענות/ },
	cost: { en: /\beven if\b.*\bstops?\b/i, fr: /\bmême si\b.*\barrête/i, he: /גם אם.*עוצר/ },
	"if-gone": { en: /\bstill there\b|\bis gone\b/i, fr: /toujours là|a disparu/i, he: /עדיין שם|נעלמ/ },
	"set-trap": { en: /\bface-down first\b/i, fr: /d’abord ce Piège|face cachée d’abord/i, he: /קודם הניחו/ },
	"quick-play": { en: /\bsurprise\b/i, fr: /surprendre/i, he: /להפתיע/ },
};

/** Why `explanations:save` refuses a drafted explanation; empty when it can be saved. */
export function checkExplanation(text: string, locale: Locale): string[] {
	const unknown = [...text.matchAll(TOKEN)].filter(([, key]) => !isPhrase(key!)).map(([token]) => `unknown shared phrase ${token}`);
	const ownWords = text.replace(TOKEN, " ");
	const matched = (Object.keys(HAND_WRITTEN) as PhraseKey[]).filter((key) => HAND_WRITTEN[key]?.[locale].test(ownWords));
	/* "Once per turn, even with several copies" is the named limit: point to that token only. */
	const handWritten = (matched.includes("once-per-turn-name") ? matched.filter((key) => key !== "once-per-turn") : matched)
		.map((key) => `write {${key}} instead of saying it in your own words`);
	/* On the text a child reads, shared sentences included. */
	const jargon = jargonIn(expandPhrases(text, locale), locale);
	return [...unknown, ...handWritten, ...(jargon.length ? [`game words to explain instead: ${jargon.join(", ")}`] : [])];
}

/** The text a child reads: each `{token}` becomes its shared sentence in `locale`. */
export function expandPhrases(text: string, locale: Locale): string {
	return text.replace(TOKEN, (token, key: string) => (isPhrase(key) ? PHRASES[key][locale] : token));
}
