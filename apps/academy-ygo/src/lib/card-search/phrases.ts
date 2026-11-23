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
} as const satisfies Record<string, Record<Locale, string>>;

export type PhraseKey = keyof typeof PHRASES;

const TOKEN = /\{([a-z-]+)\}/g;

function isPhrase(key: string): key is PhraseKey {
	return Object.hasOwn(PHRASES, key);
}

/**
 * Words that give away a shared sentence written by hand: a draft that says it in its own words must use the token, or
 * the same idea would read differently from card to card.
 */
const HAND_WRITTEN: Record<PhraseKey, Record<Locale, RegExp>> = {
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
	const handWritten = (Object.keys(HAND_WRITTEN) as PhraseKey[])
		.filter((key) => HAND_WRITTEN[key][locale].test(ownWords))
		.map((key) => `write {${key}} instead of saying it in your own words`);
	/* On the text a child reads, shared sentences included. */
	const jargon = jargonIn(expandPhrases(text, locale), locale);
	return [...unknown, ...handWritten, ...(jargon.length ? [`game words to explain instead: ${jargon.join(", ")}`] : [])];
}

/** The text a child reads: each `{token}` becomes its shared sentence in `locale`. */
export function expandPhrases(text: string, locale: Locale): string {
	return text.replace(TOKEN, (token, key: string) => (isPhrase(key) ? PHRASES[key][locale] : token));
}
