import type { Locale } from "@/lib/i18n/locales";
import { cardArtUrl } from "../play/card-art";
import { WORLD_IDS, type WorldId } from "../play/levels";
import { album, type PlayProgress } from "../play/progress";
import { DORM_INFO, DORM_ISLAND, type Dorm } from "./dorm";
import { islandStatus } from "./status";

/**
 * The island trainers: named characters of the Yu-Gi-Oh! anime, each with a signature card (the owner's decision;
 * table and sources in docs/research/junior-save-slots-character-choice-official-art.md §7.4). They are drawn with
 * their official character art (the owner's choice). A finished island gives its signature card to the child's
 * binder; nothing new is stored, the binder is computed from the solved levels.
 */
export const TRAINERS = ["solomon-muto", "yugi-muto", "yami-yugi", "mai-valentine", "seto-kaiba", "joey-wheeler", "jaden-yuki", "yusei-fudo", "yuma-tsukumo", "playmaker", "yuya-sakaki", "zane-truesdale", "bastion-misawa", "alexis-rhodes"] as const;
export type TrainerId = (typeof TRAINERS)[number];
/** As spelled on the official anime site, in Latin letters in every language. */
export const TRAINER_NAMES: Record<TrainerId, string> = {
	"solomon-muto": "Solomon Muto",
	"yugi-muto": "Yugi Muto",
	"yami-yugi": "Yami Yugi",
	"mai-valentine": "Mai Valentine",
	"seto-kaiba": "Seto Kaiba",
	"joey-wheeler": "Joey Wheeler",
	"jaden-yuki": "Jaden Yuki",
	"yusei-fudo": "Yusei Fudo",
	"yuma-tsukumo": "Yuma Tsukumo",
	playmaker: "Playmaker",
	"yuya-sakaki": "Yuya Sakaki",
	"zane-truesdale": "Zane Truesdale",
	"bastion-misawa": "Bastion Misawa",
	"alexis-rhodes": "Alexis Rhodes",
};

export interface IslandTrainer {
	/** Who greets the child; empty on an island without a trainer. */
	trainers: TrainerId[];
	/** Signature cards: shown by the trainer, given when the island is finished. Card ids of `CARDS` or `DISPLAY_CARDS`. */
	cards: string[];
}
/** The official character art of a trainer, our own copy (`scripts/trainers/build-portraits.mjs`): the height in pixels. */
export const trainerPicture = (trainer: TrainerId, height: 256 | 512 = 256) => `/trainers/${trainer}-${height}.webp`;
/** An island's trainer and cards for this child: on the tower island, the leader of the dorm chosen, with its card. */
export function islandTrainer(world: WorldId, dorm: Dorm | null): IslandTrainer {
	if (world === DORM_ISLAND && dorm) return { trainers: [DORM_INFO[dorm].leader], cards: [DORM_INFO[dorm].card] };
	return ISLAND_TRAINERS[world];
}
/** Per island, in `WORLD_IDS` order: the picture of the trainer who stands on it, or null on an island without one. */
export const islandTrainerPictures = (dorm: Dorm | null = null): (string | null)[] =>
	WORLD_IDS.map((world) => {
		const trainer = islandTrainer(world, dorm).trainers[0];
		return trainer ? trainerPicture(trainer, 512) : null;
	});
export const ISLAND_TRAINERS: Record<WorldId, IslandTrainer> = {
	/* Grandpa's treasure is Exodia (Blue-Eyes White Dragon is Kaiba's card, given on his island). */
	wake: { trainers: ["solomon-muto"], cards: ["exodia-the-forbidden-one"] },
	shield: { trainers: ["yugi-muto"], cards: ["giant-soldier-of-stone"] },
	friend: { trainers: ["yami-yugi"], cards: ["dark-magician"] },
	magic: { trainers: ["mai-valentine"], cards: ["harpies-feather-duster"] },
	puzzles: { trainers: ["solomon-muto"], cards: [] },
	tower: { trainers: [], cards: [] },
	rival: { trainers: ["seto-kaiba"], cards: ["blue-eyes-white-dragon"] },
	reading: { trainers: ["joey-wheeler"], cards: ["time-wizard"] },
	mat: { trainers: [], cards: ["monster-reborn"] },
	icons: { trainers: ["mai-valentine"], cards: ["negate-attack"] },
	ritual: { trainers: ["yami-yugi"], cards: ["black-luster-soldier"] },
	fusion: { trainers: ["jaden-yuki"], cards: ["elemental-hero-flame-wingman"] },
	synchro: { trainers: ["yusei-fudo"], cards: ["stardust-dragon"] },
	xyz: { trainers: ["yuma-tsukumo"], cards: ["utopia"] },
	link: { trainers: ["playmaker"], cards: ["decode-talker"] },
	pendulum: { trainers: ["yuya-sakaki"], cards: ["odd-eyes-pendulum-dragon"] },
	words: { trainers: ["zane-truesdale"], cards: ["cyber-dragon"] },
	legends: { trainers: ["yami-yugi", "seto-kaiba"], cards: ["exodia-the-forbidden-one", "blue-eyes-ultimate-dragon"] },
	steps: { trainers: ["yugi-muto"], cards: ["kuriboh"] },
	final: { trainers: ["yami-yugi", "seto-kaiba"], cards: [] },
	masters: { trainers: ["yami-yugi", "seto-kaiba"], cards: [] },
};

/**
 * Signature cards the levels do not play: shown and given, never played, so the rules engine does not know them.
 * Name and text as printed (English from YGOPRODeck, French from Konami's French database via YGOPRODeck).
 */
export interface DisplayCard {
	kind: "monster" | "spell";
	frame?: "effect" | "fusion" | "synchro" | "link" | "pendulum";
	level?: number;
	link?: number;
	atk?: number;
	def?: number;
	text: Record<"en" | "fr", { name: string; type: string; text: string }>;
}
export const DISPLAY_CARDS: Record<string, DisplayCard> = {
	"time-wizard": {
		kind: "monster",
		frame: "effect",
		level: 2,
		atk: 500,
		def: 400,
		text: {
			en: { name: "Time Wizard", type: "Spellcaster / Effect", text: "Once per turn: You can toss a coin and call it. If you call it right, destroy all monsters your opponent controls. If you call it wrong, destroy as many monsters you control as possible, and if you do, take damage equal to half the total ATK those destroyed monsters had while face-up on the field." },
			fr: { name: "Magicien du Temps", type: "Magicien / Effet", text: "Une fois par tour : vous pouvez jouer à pile ou face. Si vous gagnez, détruisez tous les monstres contrôlés par votre adversaire. Si vous perdez, détruisez autant de monstres que vous contrôlez que possible, et si vous le faites, recevez des dommages égaux à la moitié de la somme des ATK que ces monstres détruits avaient tant qu'ils étaient face recto sur le Terrain." },
		},
	},
	"harpies-feather-duster": {
		kind: "spell",
		text: {
			en: { name: "Harpie's Feather Duster", type: "Normal Spell", text: "Destroy all Spell and Trap Cards your opponent controls." },
			fr: { name: "Le Plumeau de Dame Harpie", type: "Magie Normale", text: "Détruisez toutes les Magies et tous les Pièges contrôlés par votre adversaire." },
		},
	},
	"elemental-hero-flame-wingman": {
		kind: "monster",
		frame: "fusion",
		level: 6,
		atk: 2100,
		def: 1200,
		text: {
			en: { name: "Elemental HERO Flame Wingman", type: "Warrior / Fusion / Effect", text: '"Elemental HERO Avian" + "Elemental HERO Burstinatrix"\nMust be Fusion Summoned and cannot be Special Summoned by other ways. When this card destroys a monster by battle and sends it to the Graveyard: Inflict damage to your opponent equal to the ATK of the destroyed monster in the Graveyard.' },
			fr: { name: "Homme-Oiseau de Feu, HÉROS Élémentaire", type: "Guerrier / Fusion / Effet", text: '"Avian, HÉROS Élémentaire" + "Burstinatrix, HÉROS Élémentaire"\nUniquement Invocable par Fusion. Lorsque cette carte détruit un monstre au combat et l\'envoie au Cimetière : infligez des dommages à votre adversaire égaux à l\'ATK du monstre détruit dans le Cimetière.' },
		},
	},
	"stardust-dragon": {
		kind: "monster",
		frame: "synchro",
		level: 8,
		atk: 2500,
		def: 2000,
		text: {
			en: { name: "Stardust Dragon", type: "Dragon / Synchro / Effect", text: "1 Tuner + 1+ non-Tuner monsters\nWhen a card or effect is activated that would destroy a card(s) on the field (Quick Effect): You can Tribute this card; negate the activation, and if you do, destroy it. During the End Phase, if this effect was activated this turn (and was not negated): You can Special Summon this card from your GY." },
			fr: { name: "Dragon Poussière d'Étoile", type: "Dragon / Synchro / Effet", text: "1 Syntoniseur + 1+ monstre non-Syntoniseur\nLorsqu'une carte ou un effet qui va détruire une ou plusieurs cartes sur le Terrain est activé (Effet Rapide) : vous pouvez Sacrifier cette carte ; annulez l'activation, et si vous le faites, détruisez-la. Durant la End Phase, si cet effet a été activé ce tour (et n'a pas été annulé) : vous pouvez Invoquer Spécialement cette carte depuis votre Cimetière." },
		},
	},
	"decode-talker": {
		kind: "monster",
		frame: "link",
		link: 3,
		atk: 2300,
		text: {
			en: { name: "Decode Talker", type: "Cyberse / Link / Effect", text: "2+ Effect Monsters\nGains 500 ATK for each monster it points to. When your opponent activates a card or effect that targets a card(s) you control (Quick Effect): You can Tribute 1 monster this card points to; negate the activation, and if you do, destroy that card." },
			fr: { name: "Décodeur Bavard", type: "Cyberse / Lien / Effet", text: "2+ Monstres à Effet\nGagne 500 ATK pour chaque monstre pointé par cette carte. Lorsque votre adversaire active une carte ou un effet qui cible une ou plusieurs cartes que vous contrôlez (Effet Rapide) : vous pouvez Sacrifier 1 monstre pointé par cette carte ; annulez l'activation, et si vous le faites, détruisez la carte." },
		},
	},
	"odd-eyes-pendulum-dragon": {
		kind: "monster",
		frame: "pendulum",
		level: 7,
		atk: 2500,
		def: 2000,
		text: {
			en: { name: "Odd-Eyes Pendulum Dragon", type: "Dragon / Pendulum / Effect, Scale 4", text: "If this card battles an opponent's monster, any battle damage this card inflicts to your opponent is doubled." },
			fr: { name: "Dragon Pendule aux Yeux Impairs", type: "Dragon / Pendule / Effet, Échelle 4", text: "Si cette carte combat un monstre de l'adversaire, les dommages de combat que cette carte inflige à votre adversaire sont doublés." },
		},
	},
};

/** The signature cards of every finished island, in island order, without doubles (with the dorm's card, if chosen). */
export function rewardCards(progress: PlayProgress, dorm: Dorm | null = null): string[] {
	const cards = WORLD_IDS.filter((world) => islandStatus(progress, world) === "done").flatMap((world) => islandTrainer(world, dorm).cards);
	return [...new Set(cards)];
}
/** Everything in the child's binder: the cards played with, then the trainers' reward cards, then the cards bought in the shop. */
export function binder(progress: PlayProgress, bought: readonly string[] = [], dorm: Dorm | null = null): string[] {
	return [...new Set<string>([...album(progress), ...rewardCards(progress, dorm), ...bought])];
}
/** Per island, the art shown on its card panel in the 3D scene: none while the island sleeps. */
export function islandCardUrls(progress: PlayProgress, dorm: Dorm | null = null): (string | null)[] {
	return WORLD_IDS.map((world) => {
		const card = islandTrainer(world, dorm).cards[0];
		return card && islandStatus(progress, world) !== "locked" ? cardArtUrl(card, 480) : null;
	});
}

/** What each trainer says: on arriving, and once the island is finished. Card names stay as printed. */
export type TrainerLines = Partial<Record<WorldId, { hello: string; done: string }>>;
/** Keeps a Latin name left-to-right inside a Hebrew sentence. */
const L = (text: string) => `⁦${text}⁩`;
export const TRAINER_LINES: Record<Locale, TrainerLines> = {
	en: {
		wake: {
			hello: "Welcome, young duelist! I'm Yugi's grandfather. My treasure is Exodia the Forbidden One. Each mission wins you stars: spend them in my game shop, right here, on cards and on clothes, hats and things to hold for your hero. Now let's wake up your Deck!",
			done: "Well done! Your Deck is awake. Exodia the Forbidden One goes in your binder. Come and see my shop!",
		},
		shield: { hello: "Hi, I'm Yugi! My Giant Soldier of Stone has 2000 DEF and only 1300 ATK: a real wall. Let's learn to defend.", done: "Great defending! Giant Soldier of Stone is yours." },
		friend: { hello: "I am Yami Yugi. Dark Magician is Level 7, so he needs two Tributes. Let's call a friend!", done: "You Summon like a true duelist. Dark Magician joins your binder." },
		magic: { hello: "I'm Mai Valentine. Harpie's Feather Duster clears every Spell and Trap of my opponent at once. Your turn to learn magic!", done: "Not bad at all! Here, take my Harpie's Feather Duster." },
		puzzles: { hello: "Puzzle time! Every board here can be won this turn. Look at everything before you tap.", done: "All ten puzzles solved! Even Yugi would be proud." },
		rival: { hello: "I am Seto Kaiba. Today Nox duels with my monsters. Beat them, if you can.", done: "Hmph. You won. Blue-Eyes White Dragon is in your binder. Don't get used to it." },
		reading: { hello: "Hey, I'm Joey! My Time Wizard says “Once per turn”. Reading every word is how you win!", done: "You read like a pro! Time Wizard is yours now." },
		icons: { hello: "Mai again! One small icon beside SPELL or TRAP changes how a card works. Negate Attack is my favourite Counter Trap.", done: "Now you read every icon. Negate Attack is yours." },
		ritual: { hello: "A Ritual needs a Ritual Spell and Tributes. Black Luster Soldier is waiting.", done: "The Ritual is complete. Black Luster Soldier joins you." },
		fusion: { hello: "I'm Jaden Yuki! Two heroes become one: Elemental HERO Flame Wingman. Get your game on!", done: "Sweet! Flame Wingman is in your binder." },
		synchro: { hello: "I'm Yusei Fudo. A Tuner and its friends add up their Levels. That is how Stardust Dragon comes.", done: "Clear mind, clean Summon. Stardust Dragon is yours." },
		xyz: { hello: "I'm Yuma! Two monsters of the same Level make an Xyz Monster, like Number 39: Utopia!", done: "Awesome! Utopia joins your binder." },
		link: { hello: "I am Playmaker. Link Monsters have arrows, not Levels. Decode Talker was my first ace.", done: "Well played. Decode Talker is yours." },
		pendulum: { hello: "I'm Yuya Sakaki! Set two Scales and Summon everything between them. Here comes Odd-Eyes Pendulum Dragon!", done: "What a show! Odd-Eyes Pendulum Dragon is in your binder." },
		words: { hello: "I am Zane Truesdale. Every word on a card counts. Cyber Dragon says “If only your opponent controls a monster”.", done: "Respect. Cyber Dragon is yours." },
		legends: { hello: "Yugi and Kaiba are here. Meet the legends: Exodia the Forbidden One and Blue-Eyes Ultimate Dragon.", done: "You met the legends! Both cards join your binder." },
		steps: { hello: "Yugi again! An attack has steps. My Kuriboh waits for the Damage Step, just as its card says.", done: "You know every step now. Kuriboh is yours!" },
		final: { hello: "The final duel, with your own Extra Deck. We are watching!", done: "You are a real duelist now!" },
		masters: { hello: "Every master of the anime is here, each with their own Deck. Choose your Deck, and beat them all!", done: "You beat every master. You are the champion of the Academy!" },
	},
	fr: {
		wake: {
			hello: "Bienvenue, jeune duelliste ! Je suis le grand-père de Yugi. Mon trésor, c’est Éxodia l’Interdit. Chaque mission te fait gagner des étoiles : dépense-les dans ma boutique de jeux, ici même, en cartes, et en habits, chapeaux et objets pour ton héros. Maintenant, réveillons ton Deck !",
			done: "Bravo ! Ton Deck est réveillé. Éxodia l’Interdit va dans ton classeur. Viens voir ma boutique !",
		},
		shield: { hello: "Salut, je suis Yugi ! Mon Soldat Géant de Pierre a 2000 DEF et seulement 1300 ATK : un vrai mur. Apprenons à défendre.", done: "Belle défense ! Soldat Géant de Pierre est à toi." },
		friend: { hello: "Je suis Yami Yugi. Magicien Sombre est de Niveau 7 : il lui faut deux Sacrifices. Appelons un ami !", done: "Tu Invoques comme un vrai duelliste. Magicien Sombre rejoint ton classeur." },
		magic: { hello: "Je suis Mai Valentine. Le Plumeau de Dame Harpie détruit d’un coup toutes les Magies et tous les Pièges de l’adversaire. À toi d’apprendre la magie !", done: "Pas mal du tout ! Tiens, voici mon Plumeau de Dame Harpie." },
		puzzles: { hello: "C’est l’heure des énigmes ! Chaque plateau peut être gagné ce tour-ci. Regarde tout avant de toucher.", done: "Les dix énigmes sont résolues ! Même Yugi serait fier de toi." },
		rival: { hello: "Je suis Seto Kaiba. Aujourd’hui, Nox joue avec mes monstres. Bats-les, si tu peux.", done: "Hum. Tu as gagné. Dragon Blanc aux Yeux Bleus est dans ton classeur. Ne t’y habitue pas." },
		reading: { hello: "Salut, moi c’est Joey ! Mon Magicien du Temps dit « Une fois par tour ». Lire chaque mot, c’est comme ça qu’on gagne !", done: "Tu lis comme un pro ! Magicien du Temps est à toi." },
		icons: { hello: "Encore moi, Mai ! Une petite icône à côté de MAGIE ou PIÈGE change tout. Annulation d’Attaque est mon Contre-Piège préféré.", done: "Tu lis toutes les icônes maintenant. Annulation d’Attaque est à toi." },
		ritual: { hello: "Un Rituel demande une Magie Rituelle et des Sacrifices. Soldat du Lustre Noir t’attend.", done: "Le Rituel est accompli. Soldat du Lustre Noir te rejoint." },
		fusion: { hello: "Je suis Jaden Yuki ! Deux héros n’en font qu’un : Homme-Oiseau de Feu, HÉROS Élémentaire. C’est parti !", done: "Génial ! Homme-Oiseau de Feu est dans ton classeur." },
		synchro: { hello: "Je suis Yusei Fudo. Un Syntoniseur et ses amis additionnent leurs Niveaux. C’est ainsi que vient Dragon Poussière d’Étoile.", done: "Esprit clair, Invocation nette. Dragon Poussière d’Étoile est à toi." },
		xyz: { hello: "Je suis Yuma ! Deux monstres du même Niveau font un Monstre Xyz, comme Numéro 39 : Utopie !", done: "Super ! Utopie rejoint ton classeur." },
		link: { hello: "Je suis Playmaker. Les Monstres Lien ont des flèches, pas de Niveau. Décodeur Bavard était mon premier as.", done: "Bien joué. Décodeur Bavard est à toi." },
		pendulum: { hello: "Je suis Yuya Sakaki ! Place deux Échelles et Invoque tout ce qui est entre elles. Voici Dragon Pendule aux Yeux Impairs !", done: "Quel spectacle ! Dragon Pendule aux Yeux Impairs est dans ton classeur." },
		words: { hello: "Je suis Zane Truesdale. Chaque mot d’une carte compte. Cyber Dragon dit « Si seul votre adversaire contrôle un monstre ».", done: "Respect. Cyber Dragon est à toi." },
		legends: { hello: "Yugi et Kaiba sont là. Voici les légendes : Éxodia l’Interdit et Dragon Ultime aux Yeux Bleus.", done: "Tu as rencontré les légendes ! Les deux cartes rejoignent ton classeur." },
		steps: { hello: "Encore moi, Yugi ! Une attaque a des étapes. Mon Kuriboh attend la Damage Step, comme le dit sa carte.", done: "Tu connais chaque étape maintenant. Kuriboh est à toi !" },
		final: { hello: "Le duel final, avec ton propre Extra Deck. Nous te regardons !", done: "Tu es maintenant un vrai duelliste !" },
		masters: { hello: "Tous les maîtres sont là, chacun avec son propre Deck. Choisis ton Deck, et bats-les tous !", done: "Tu as battu tous les maîtres. Tu es le champion de l’Académie !" },
	},
	he: {
		wake: {
			hello: `ברוכים הבאים, דואליסטים צעירים! אני הסבא של ${L("Yugi")}. האוצר שלי הוא ${L("Exodia the Forbidden One")}. כל משימה נותנת לכם כוכבים: תוכלו לקנות בהם בחנות המשחקים שלי, ממש כאן, קלפים, וגם בגדים, כובעים וחפצים לגיבור שלכם. עכשיו בואו נעיר את החפיסה שלכם!`,
			done: `כל הכבוד! החפיסה שלכם ערה. ${L("Exodia the Forbidden One")} נכנס לאלבום שלכם. בואו לראות את החנות שלי!`,
		},
		shield: { hello: `היי, אני ${L("Yugi")}! ל־${L("Giant Soldier of Stone")} שלי יש 2000 DEF ורק 1300 ATK: חומה אמיתית. בואו נלמד להתגונן.`, done: `הגנה מצוינת! ${L("Giant Soldier of Stone")} שלכם.` },
		friend: { hello: `אני ${L("Yami Yugi")}. ${L("Dark Magician")} הוא רמה 7 (${L("Level 7")}), אז צריך שתי הקרבות (${L("Tributes")}). בואו נקרא לחבר!`, done: `אתם מזמנים (${L("Summon")}) כמו דואליסטים אמיתיים. ${L("Dark Magician")} מצטרף לאלבום שלכם.` },
		magic: { hello: `אני ${L("Mai Valentine")}. ${L("Harpie's Feather Duster")} משמיד בבת אחת את כל הלחשים (${L("Spells")}) והמלכודות (${L("Traps")}) של היריב. תורכם ללמוד קסמים!`, done: `לא רע בכלל! קחו את ה־${L("Harpie's Feather Duster")} שלי.` },
		puzzles: { hello: "זמן חידות! בכל לוח כאן אפשר לנצח בתור הזה. הסתכלו על הכול לפני שנוגעים.", done: `פתרתם את כל עשר החידות! אפילו ${L("Yugi")} היה גאה.` },
		rival: { hello: `אני ${L("Seto Kaiba")}. היום ${L("Nox")} משחק עם המפלצות שלי. נצחו אותן, אם אתם יכולים.`, done: `הממ. ניצחתם. ${L("Blue-Eyes White Dragon")} באלבום שלכם. אל תתרגלו לזה.` },
		reading: { hello: `היי, אני ${L("Joey")}! על ה־${L("Time Wizard")} שלי כתוב ${L("“Once per turn”")}. לקרוא כל מילה, ככה מנצחים!`, done: `אתם קוראים כמו מקצוענים! ${L("Time Wizard")} עכשיו שלכם.` },
		icons: { hello: `שוב אני, ${L("Mai")}! סמל קטן ליד ${L("SPELL")} או ${L("TRAP")} משנה איך קלף עובד. ${L("Negate Attack")} היא ${L("Counter Trap")} האהובה עליי.`, done: `עכשיו אתם קוראים כל סמל. ${L("Negate Attack")} שלכם.` },
		ritual: { hello: `טקס (${L("Ritual")}) צריך לחש טקס (${L("Ritual Spell")}) והקרבות (${L("Tributes")}). ${L("Black Luster Soldier")} מחכה.`, done: `הטקס (${L("Ritual")}) הושלם. ${L("Black Luster Soldier")} מצטרף אליכם.` },
		fusion: { hello: `אני ${L("Jaden Yuki")}! שני גיבורים הופכים לאחד: ${L("Elemental HERO Flame Wingman")}. יאללה, משחקים!`, done: `מעולה! ${L("Flame Wingman")} באלבום שלכם.` },
		synchro: { hello: `אני ${L("Yusei Fudo")}. ${L("Tuner")} והחברים שלו מחברים את הרמות (${L("Levels")}) שלהם. ככה מגיע ${L("Stardust Dragon")}.`, done: `ראש צלול, זימון (${L("Summon")}) נקי. ${L("Stardust Dragon")} שלכם.` },
		xyz: { hello: `אני ${L("Yuma")}! שתי מפלצות באותה רמה (${L("Level")}) יוצרות מפלצת ${L("Xyz")}, כמו ${L("Number 39: Utopia")}!`, done: `מדהים! ${L("Utopia")} מצטרף לאלבום שלכם.` },
		link: { hello: `אני ${L("Playmaker")}. למפלצות ${L("Link")} יש חצים, לא רמות (${L("Levels")}). ${L("Decode Talker")} היה האס הראשון שלי.`, done: `שיחקתם יפה. ${L("Decode Talker")} שלכם.` },
		pendulum: { hello: `אני ${L("Yuya Sakaki")}! מציבים שני סולמות (${L("Scales")}) ומזמנים את כל מה שביניהם. הנה מגיע ${L("Odd-Eyes Pendulum Dragon")}!`, done: `איזו הופעה! ${L("Odd-Eyes Pendulum Dragon")} באלבום שלכם.` },
		words: { hello: `אני ${L("Zane Truesdale")}. כל מילה על קלף חשובה. על ${L("Cyber Dragon")} כתוב ${L("“If only your opponent controls a monster”")}.`, done: `כבוד. ${L("Cyber Dragon")} שלכם.` },
		legends: { hello: `${L("Yugi")} ו־${L("Kaiba")} כאן. הכירו את האגדות: ${L("Exodia the Forbidden One")} ו־${L("Blue-Eyes Ultimate Dragon")}.`, done: "פגשתם את האגדות! שני הקלפים מצטרפים לאלבום שלכם." },
		steps: { hello: `שוב אני, ${L("Yugi")}! להתקפה יש שלבים. ה־${L("Kuriboh")} שלי מחכה ל־${L("Damage Step")}, בדיוק כמו שכתוב על הקלף.`, done: `עכשיו אתם מכירים כל שלב. ${L("Kuriboh")} שלכם!` },
		final: { hello: `הדו־קרב האחרון, עם ה־${L("Extra Deck")} שלכם. אנחנו צופים!`, done: "עכשיו אתם דואליסטים אמיתיים!" },
		masters: { hello: "כל המאסטרים כאן, כל אחד עם החפיסה שלו. בחרו חפיסה, ונצחו את כולם!", done: "ניצחתם את כל המאסטרים. אתם האלופים של האקדמיה!" },
	},
};

/** What the leader of the child's dorm says on the tower island: a welcome, then the dorm's card given. */
const DORM_LINES: Record<Locale, Record<Dorm, { hello: string; done: string }>> = {
	en: {
		slifer: { hello: "Hey, I'm Jaden Yuki, Slifer Red like you! Finish this tower and I'll give you our dorm's card. Get your game on!", done: "Sweet! Here's Slifer the Sky Dragon, the card of Slifer Red. It's in your binder!" },
		ra: { hello: "I am Bastion Misawa, of Ra Yellow, your dorm. Finish this tower with care, and our dorm's card is yours.", done: "Perfectly calculated. The Winged Dragon of Ra, the card of Ra Yellow, is in your binder." },
		obelisk: { hello: "I'm Alexis Rhodes, of Obelisk Blue, your dorm. Show me what you can do on this tower, and I'll give you our dorm's card.", done: "Well played! Obelisk the Tormentor, the card of Obelisk Blue, is in your binder." },
	},
	fr: {
		slifer: { hello: "Salut, je suis Jaden Yuki, Slifer Rouge comme toi ! Termine cette tour et je te donne la carte de notre dortoir. C’est parti !", done: "Génial ! Voici Slifer, le Dragon Céleste, la carte des Slifer Rouge. Elle est dans ton classeur !" },
		ra: { hello: "Je suis Bastion Misawa, des Ra Jaune, ton dortoir. Termine cette tour avec soin, et la carte de notre dortoir est à toi.", done: "Parfaitement calculé. Le Dragon Ailé de Râ, la carte des Ra Jaune, est dans ton classeur." },
		obelisk: { hello: "Je suis Alexis Rhodes, des Obelisk Bleu, ton dortoir. Montre-moi ce que tu sais faire sur cette tour, et je te donnerai la carte de notre dortoir.", done: "Bien joué ! Obelisk, le Tourmenteur, la carte des Obelisk Bleu, est dans ton classeur." },
	},
	he: {
		slifer: { hello: `היי, אני ${L("Jaden Yuki")}, ${L("Slifer Red")} כמוכם! סיימו את המגדל הזה ואתן לכם את הקלף של המעונות שלנו. יאללה, משחקים!`, done: `מעולה! הנה ${L("Slifer the Sky Dragon")}, הקלף של ${L("Slifer Red")}. הוא באלבום שלכם!` },
		ra: { hello: `אני ${L("Bastion Misawa")}, מ־${L("Ra Yellow")}, המעונות שלכם. סיימו את המגדל הזה בזהירות, והקלף של המעונות שלנו שלכם.`, done: `מחושב בדיוק. ${L("The Winged Dragon of Ra")}, הקלף של ${L("Ra Yellow")}, באלבום שלכם.` },
		obelisk: { hello: `אני ${L("Alexis Rhodes")}, מ־${L("Obelisk Blue")}, המעונות שלכם. הראו לי מה אתם יודעים במגדל הזה, ואתן לכם את הקלף של המעונות שלנו.`, done: `כל הכבוד! ${L("Obelisk the Tormentor")}, הקלף של ${L("Obelisk Blue")}, באלבום שלכם.` },
	},
};
export const dormLines = (locale: Locale, dorm: Dorm) => DORM_LINES[locale][dorm];
/** What an island's trainer says to this child: on the tower island, the dorm's leader. */
export const islandLines = (locale: Locale, world: WorldId, dorm: Dorm | null) => (world === DORM_ISLAND && dorm ? dormLines(locale, dorm) : TRAINER_LINES[locale][world]);
