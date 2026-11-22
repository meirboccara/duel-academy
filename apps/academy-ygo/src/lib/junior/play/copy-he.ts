import { cardOf, monsterOf, type CardId } from "@duel-academy/engine";
import { atkOf } from "@duel-academy/engine";
import { MASTERS, MASTER_NAMES, MASTER_TIER, masterLevelId, type Tier } from "./masters";
import type { PlayCopy } from "./copy";
import { en } from "./copy-en";

/** The level of a trainer of the masters' island, after its name. */
const TIER_WORDS: Record<Tier, string> = { basic: "מתחילים", medium: "בינוני", strong: "חזק", expert: "מומחה" };

/*
 * Hebrew is an unofficial educational translation in the plural address used by the pilot. Real cards do not exist in
 * Hebrew, so every card word is also shown in English, as it is printed on cards: "זימון (Summon)". Card names and
 * card text stay in English; the Hebrew text of a card is its meaning. Phase names, ATK and DEF stay in English.
 * Written by the model: a native review is still needed.
 */
/** Keeps English left-to-right inside a Hebrew sentence. */
const L = (text: string) => `⁦${text}⁩`;
/** A Hebrew word followed by the English card word. */
const w = (hebrew: string, english: string) => `${hebrew} (${L(english)})`;
const name = (card: CardId) => L(en.cards[card].name);

const meaning: Partial<Record<CardId, string>> = {
	"glint-lynx": `${L("(Quick Effect)")}: אפשר לבחור כמטרה מפלצת גלויה של היריב. היא מאבדת 800 ATK עד סוף התור. משתמשים באפקט הזה רק פעם אחת בתור.`,
	"cinder-hedgehog": "אפשר לבחור כמטרה מפלצת גלויה של היריב. היא מאבדת 800 ATK עד סוף התור. משתמשים באפקט הזה רק פעם אחת בתור, וזה לא אפקט מהיר.",
	"dozy-moth": "כשהקלף הזה נשלח לבית הקברות: אפשר לגרום ליריב 500 נזק.",
	"busy-bee": "אם הקלף הזה נשלח לבית הקברות: אפשר לגרום ליריב 500 נזק.",
	"glow-charm": "אתם מקבלים 500 נקודות חיים.",
	"spark-dash": "בוחרים כמטרה מפלצת גלויה בשדה. היא מקבלת 700 ATK עד סוף התור.",
	"thunder-clap": `בוחרים כמטרה מפלצת גלויה בשדה, ומשמידים אותה. בנוסף, מדלגים על ה־${L("Draw Phase")} הבא שלכם.`,
	"spark-trade": "המחיר: משליכים קלף אחד מהיד. ואז בוחרים כמטרה מפלצת בשדה, ומשמידים אותה.",
	"fog-snare": "בוחרים כמטרה מפלצת גלויה בשדה. היא מקבלת 500 ATK עד סוף התור.",
	"sticky-vine": "כשמפלצת של היריב מכריזה על התקפה: בוחרים כמטרה את המפלצת התוקפת, ומבטלים את ההתקפה. אם עשיתם את זה, מקבלים נקודות חיים כמו ה־ATK שלה.",
	"quick-burrow": "בוחרים כמטרה מפלצת בשדה, ומחזירים אותה ליד.",
	"monster-reborn": `בוחרים כמטרה מפלצת אחת בבית הקברות, שלכם או של היריב, ומזמנים אותה בזימון מיוחד (${L("Special Summon")}).`,
	mountain: `כל המפלצות מסוג ${L("Dragon")}, ${L("Winged Beast")} ו־${L("Thunder")} שבשדה, של שני השחקנים, מקבלות 200 ATK ו־200 DEF.`,
	"sakuretsu-armor": "כשמפלצת של היריב מכריזה על התקפה: בוחרים כמטרה את המפלצת התוקפת, ומשמידים אותה.",
	"dimensional-prison": `כשמפלצת של היריב מכריזה על התקפה: בוחרים כמטרה את המפלצת התוקפת, ומגלים אותה (${L("banish")}).`,
	"pot-of-desires": `המחיר: מגלים (${L("banish")}) 10 קלפים מראש החפיסה שלכם, עם הפנים למטה. האפקט: שולפים 2 קלפים. אפשר להפעיל רק ${name("pot-of-desires")} אחד בתור.`,
	"black-luster-ritual": `הקלף הזה משמש לזימון טקס (${L("Ritual Summon")}) של ${name("black-luster-soldier")}. צריך גם להקריב מפלצות מהיד או מהשדה, שסכום הרמות שלהן 8 או יותר.`,
	"black-luster-soldier": `אפשר לזמן את הקלף הזה בזימון טקס (${L("Ritual Summon")}) עם ${name("black-luster-ritual")}.`,
	polymerization: `מזמנים בזימון מיזוג (${L("Fusion Summon")}) מפלצת מיזוג אחת מחפיסת האקסטרה (${L("Extra Deck")}), בעזרת מפלצות מהיד או מהשדה שלכם.`,
	"flame-swordsman": `החומרים: ${name("flame-manipulator")} ועוד ${name("masaki")}.`,
	"gaia-knight": `החומרים: מפלצת ${L("Tuner")} אחת, ועוד מפלצת אחת או יותר שאינן ${L("Tuner")}.`,
	"gem-knight-pearl": `החומרים: 2 מפלצות ברמה (${L("Level")}) 4.`,
	utopia: `החומרים: 2 מפלצות ברמה (${L("Level")}) 4.\nכשמפלצת מכריזה על התקפה: אפשר לנתק (${L("detach")}) חומר אחד מהקלף הזה, וזה המחיר. האפקט: ההתקפה מבוטלת. אם תוקפים את הקלף הזה כשאין לו חומרים: משמידים את הקלף הזה.`,
	lanphorhynchus: "החומרים: 2 מפלצות.",
	"lightning-vortex": "המחיר: משליכים קלף אחד מהיד. האפקט: משמידים את כל המפלצות הגלויות של היריב.",
	fissure: "משמידים את המפלצת הגלויה של היריב שיש לה ה־ATK הנמוך ביותר. אם יש תיקו, אתם בוחרים.",
	"upstart-goblin": `שולפים קלף אחד, ואז (${L("then")}) היריב מקבל 1000 נקודות חיים.`,
	"cyber-dragon": `אם רק ליריב יש מפלצת בשדה, אפשר לזמן את הקלף הזה מהיד בזימון מיוחד (${L("Special Summon")}).`,
	"blue-eyes-ultimate-dragon": `החומרים: שלושה ${name("blue-eyes-white-dragon")}.`,
	"exodia-the-forbidden-one": `אם ביד שלכם יש את ${name("right-leg-of-the-forbidden-one")}, ${name("left-leg-of-the-forbidden-one")}, ${name("right-arm-of-the-forbidden-one")} ו־${name("left-arm-of-the-forbidden-one")}, וגם את הקלף הזה, אתם מנצחים בדו־קרב.`,
	kuriboh: `בזמן חישוב הנזק, אם מפלצת של היריב תוקפת ${L("(Quick Effect)")}: אפשר להשליך את הקלף הזה מהיד, וזה המחיר. האפקט: לא מקבלים נזק מהקרב הזה.`,
	"banner-of-courage": `רק במהלך ה־${L("Battle Phase")} שלכם, כל המפלצות שלכם מקבלות 200 ATK.`,
	"legendary-sword": `מצמידים רק למפלצת מסוג ${L("Warrior")}. היא מקבלת 300 ATK ו־300 DEF.`,
	"call-of-the-haunted": `מפעילים את הקלף הזה כשבוחרים כמטרה מפלצת אחת בבית הקברות שלכם, ומזמנים אותה בזימון מיוחד (${L("Special Summon")}) במצב התקפה. כשהקלף הזה עוזב את השדה, משמידים את המפלצת. כשהמפלצת מושמדת, משמידים את הקלף הזה.`,
	"negate-attack": `כשמפלצת של היריב מכריזה על התקפה: בוחרים כמטרה את המפלצת התוקפת, מבטלים את ההתקפה, ואז מסיימים את ה־${L("Battle Phase")}.`,
};
/* A real card with no Hebrew meaning written yet keeps its English text: it is shown once, as printed. */
const cards = Object.fromEntries(Object.entries(en.cards).map(([id, card]) => [id, { name: card.name, ...(meaning[id as CardId] ? { text: meaning[id as CardId] } : card.text ? { text: card.text } : {}) }])) as PlayCopy["cards"];
const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ו${names.at(-1)}`);
const phases: PlayCopy["phases"] = { draw: "Draw Phase", standby: "Standby Phase", main1: "Main Phase 1", battle: "Battle Phase", main2: "Main Phase 2", end: "End Phase" };
const LP = w("נקודות חיים", "LP");
const GY = w("בית הקברות", "Graveyard");
const EXTRA = w("חפיסת האקסטרה", "Extra Deck");
const DOWN = w("עם הפנים למטה", "face-down");
const UP = w("עם הפנים למעלה", "face-up");
const MONSTER = w("מפלצת", "Monster");
const MONSTERS = w("מפלצות", "Monsters");
const COST = w("מחיר", "cost");

/** The words of Junior play for a duel against this rival: Nox in the course, a trainer on the masters' island. */
export function hebrewCopy(RIVAL: string): PlayCopy {
	return {
		pageTitle: "ג׳וניור: לומדים תוך כדי משחק",
		intro: "דו־קרבות קטנים על לוח קטן. כל אחד מלמד כלל אחד. געו בקלף, געו באזור, וראו מה קורה. אם משהו לא מצליח, לא מפסידים כלום: תמיד אפשר לחזור צעד אחורה.",
		rivalName: RIVAL,
		englishCards: true,
		worlds: {
			wake: { title: "החפיסה מתעוררת", blurb: "שלושה סוגי קלפים, והקרבות הראשונים שלכם." },
			shield: { title: "מגן או חרב", blurb: `${w("מצב הגנה", "Defense Position")}, ${LP} והתקפות ישירות.` },
			friend: { title: "קוראים לחבר", blurb: `${w("זימונים", "Summons")}, ${w("הקרבות", "Tributes")} ושלבי התור.` },
			magic: { title: w("לחשים ומלכודות", "Spells & Traps"), blurb: `${w("לחש", "Spell")} עכשיו, ${w("מלכודת", "Trap")} לאחר כך.` },
			puzzles: { title: "לנצח בתור הזה", blurb: "עשרה לוחות. כל מה שאתם יודעים, בלי עזרה." },
			tower: { title: "מגדל הצבים", blurb: `${w("שרשראות", "Chains")}: הקלף האחרון ששוחק פועל ראשון.` },
			rival: { title: "האתגר של היריב", blurb: "דו־קרב שלם נגד נוקס." },
			reading: { title: "קוראים את הקלף", blurb: `${w("מחיר", "cost")}, ${w("מטרה", "Target")}, ${L("Quick Effect")} ו־${L("once per turn")}, במילים שכתובות על קלפים אמיתיים.` },
			mat: { title: "המשטח כולו", blurb: `כל האזורים: ${GY}, ${w("אזור השדה", "Field Zone")}, קלפים ${w("מוגלים", "banished")} ו${EXTRA}.` },
			icons: { title: "שישה סמלים", blurb: `${w("משחק מהיר", "Quick-Play")}, ${w("נגד", "Counter")}, ${w("מתמשך", "Continuous")}, ${w("ציוד", "Equip")}: סמל קטן משנה הכול.` },
			ritual: { title: w("הטקס", "Ritual"), blurb: `${w("לחש", "Spell")}, ${MONSTER} ביד, ו${w("הקרבות", "Tributes")} שמגיעות לסכום הנכון.` },
			fusion: { title: w("מיזוג", "Fusion"), blurb: `שתי ${MONSTERS} הופכות לאחת מ${EXTRA}.` },
			synchro: { title: w("סינכרו", "Synchro"), blurb: `${L("Tuner")} אחד, ו${w("רמות", "Levels")} שהסכום שלהן מדויק.` },
			xyz: { title: w("אקסיז", "Xyz"), blurb: `אותה ${w("רמה", "Level")}, בערימה. ה${w("חומרים", "materials")} מחכים מתחת ל${MONSTER}.` },
			link: { title: w("לינק", "Link"), blurb: `סופרים את ה${MONSTERS}. אין DEF, ואין ${w("מצב הגנה", "Defense Position")}.` },
			pendulum: { title: w("מטוטלת", "Pendulum"), blurb: `שתי ${w("סקאלות", "Scales")}, והרבה ${MONSTERS} בבת אחת.` },
			words: { title: "כל מילה חשובה", blurb: "קלפים אמיתיים. מילה אחת קובעת מי מנצח." },
			legends: { title: "אגדות", blurb: `הקלפים המפורסמים ביותר של הדו־קרבים הראשונים: שלושה דרקונים באחד, ו${name("exodia-the-forbidden-one")}.` },
			steps: { title: "אי השלבים", blurb: `התקפה בשני שלבים: ה־${L("Battle Step")}, ואז ה־${L("Damage Step")}.` },
			today: { title: "אי הדו־קרבות של היום", blurb: `${L("Hand traps")}, ${w("מלכודות נגד", "Counter Traps")}, חיפושים ו${w("חיצי קישור", "Link Arrows")}: ככה משחקים היום.` },
			final: { title: `הדו־קרב של ${EXTRA}`, blurb: `דו־קרב שלם על המשטח כולו. גם לנוקס יש ${L("Extra Deck")}.` },
			masters: { title: "טורניר המאסטרים", blurb: "כל המאסטרים מחכים, כל אחד עם החפיסה שלו. נצחו את כולם!" },
		},
		levels: {
			"w1-field": { title: "ממלאים את השדה", goal: "געו בקלף, ואז באזור זוהר. שימו את שלושת הקלפים במשחק." },
			"w1-field-2": { title: "עוד שלושה", goal: `שחקו את שלושת הקלפים. ${name("thunder-clap")} צריך ${w("מטרה", "target")}: ה${w("מפלצת", "Monster")} של היריב.` },
			"w1-clash": { title: "התנגשות!", goal: `${w("השמידו", "destroy")} את ${name("thorn-fox")}. געו ב${w("מפלצת", "Monster")} שלכם, ואז בזו של היריב.` },
			"w1-clash-2": { title: "התנגשות כפולה", goal: `${w("השמידו", "destroy")} את שתי ${w("המפלצות", "Monsters")} של היריב. שמרו על שתיים שלכם.` },
			"w1-tie": { title: "אותו כוח", goal: `ל־${name("bramble-ram")} יש 1500 ATK. ${w("השמידו", "destroy")} אותו ושמרו על שתי ${w("המפלצות", "Monsters")} שלכם.` },
			"w2-crouch": { title: "מרימים מגן", goal: `${name("iron-boar")} עומד לתקוף. געו ב־${name("moss-beetle")} כדי לסובב אותה, ואז סיימו את התור.` },
			"w2-stand": { title: "שולפים חרב", goal: `${name("lantern-owl")} ב${w("מצב הגנה", "Defense Position")}. ${w("השמידו", "destroy")} את ${name("thorn-fox")}.` },
			"w2-wall": { title: "השריון הגדול", goal: `שתי התקפות בדרך. אל תאבדו אף ${w("נקודת חיים", "LP")}.` },
			"w2-lantern": { title: "מכבים את הפנס", goal: `הורידו את ${LP} של היריב ל־0.` },
			"w2-boss": { title: "שוברים את השריון", goal: `הורידו את ${LP} של היריב ל־0. מי יכול לנצח 1500 DEF?` },
			"w3-gem": { title: "קוראים לחבר", goal: `${w("זמנו", "Summon")} ${w("מפלצת", "Monster")} אחת, ואז ${w("השמידו", "destroy")} את ${name("thorn-fox")}. רק ${L("Normal Summon")} אחד בתור!` },
			"w3-tribute": { title: "חבר גדול יותר", goal: `${name("storm-stag")} הוא ${L("Level 6")}:${w("הקריבו", "Tribute")} ${w("מפלצת", "Monster")} אחת כדי ${w("לזמן", "Summon")} אותו. ${w("השמידו", "destroy")} את ${name("iron-boar")}.` },
			"w3-two": { title: "הענק", goal: `${name("mountain-bison")} הוא ${L("Level 8")}:צריך שתי ${w("הקרבות", "Tributes")}. ${w("השמידו", "destroy")} את ${name("shadow-wolf")}.` },
			"w3-keep": { title: "מי הולך?", goal: `הורידו את ${LP} של היריב ל־0. ${w("הקריבו", "Tribute")} את ה${w("מפלצת", "Monster")} הנכונה.` },
			"w3-magician": { title: name("dark-magician"), goal: `${name("dark-magician")} הוא ${L("Level 7")}: צריך שתי ${w("הקרבות", "Tributes")}. ${w("זמנו", "Summon")} אותו ונצחו.` },
			"w3-blue-eyes": { title: "הדרקון הלבן", goal: `${name("blue-eyes-white-dragon")} צריך שתי ${w("הקרבות", "Tributes")}. בחרו אילו ${MONSTERS} להשאיר. נצחו בתור הזה.` },
			"w3-chimes": { title: "ארבעה פעמונים", goal: "שחקו תור שלם: Draw, Main, Battle. נצחו בדו־קרב." },
			"w3-two-turns": { title: "שני תורות", goal: `${w("השמידו", "destroy")} את ${name("stone-golem")}. צריך שני תורות.` },
			"w4-spell": { title: w("לחש, עכשיו!", "Spell"), goal: `נצחו בתור הזה. ${name("iron-boar")} חוסם את הדרך.` },
			"w4-boost": { title: "ניצוץ קטן", goal: `נצחו בתור הזה. ל־${name("thorn-fox")} יש 1400 ATK.` },
			"w4-ambush": { title: "מארב", goal: `${w("הניחו", "Set")} את ה${w("מלכודת", "Trap")}, סיימו את התור, ושמרו על ${name("pocket-cub")}.` },
			"w4-counter": { title: w("מלכודת, ואז מכה", "Trap"), goal: "נצחו בדו־קרב בשני תורות." },
			p1: { title: "חידה 1", goal: `כאן הקלף של התור כבר נשלף: מתחילים ב־${L("Main Phase 1")}. נצחו בתור הזה.` },
			p2: { title: "חידה 2", goal: "נצחו בתור הזה." },
			p3: { title: "חידה 3", goal: "נצחו בתור הזה." },
			p4: { title: "חידה 4", goal: "נצחו בתור הזה." },
			p5: { title: "חידה 5", goal: "נצחו בתור הזה." },
			p6: { title: "חידה 6", goal: `עברו את התור של היריב. אל תאבדו אף ${w("נקודת חיים", "LP")} ושמרו על ${name("lantern-owl")}.` },
			p7: { title: "חידה 7", goal: "נצחו בתור הזה." },
			p8: { title: "חידה 8", goal: "נצחו בתור הזה." },
			p9: { title: "חידה 9", goal: `אחרי התור של היריב, שיהיו לכם 800 ${LP} או יותר, ושמרו על ${name("moss-beetle")}.` },
			p10: { title: "חידה 10", goal: "נצחו בתור הזה." },
			"w6-tower": { title: "מגדל הצבים", goal: `נוקס משחק ${w("לחש", "Spell")} על ${name("pocket-cub")}. ענו עם ה${w("מלכודת", "Trap")}: הקלף האחרון פועל ראשון.` },
			"w6-double": { title: "שתי הפתעות", goal: `שלפו, עברו ב־${L("Standby Phase")}, ${w("הניחו", "Set")} שתי ${w("מלכודות", "Traps")}. שמרו על ${name("river-otter")} ועל כל ${LP}.` },
			"w6-main2": { title: "אחרי הקרב", goal: `שלושת ${w("אזורי המפלצות", "Monster Zones")} שלכם מלאים. פנו אזור בקרב, ואז ${w("זמנו", "Summon")} את ${name("lantern-owl")} ב־${L("Main Phase 2")}.` },
			"w7-duel": { title: "האתגר של היריב", goal: `דו־קרב שלם. הורידו את ${LP} של נוקס מ־4000 ל־0!` },
			"r-cost": { title: "קודם משלמים", goal: `קראו את ${name("spark-trade")}: להשליך (${L("discard")}) קלף אחד, לפני ה־;, זה ה${w("מחיר", "cost")}. נצחו בתור הזה.` },
			"r-paid": { title: "מה ששולם, שולם", goal: `לנוקס יש ${w("מלכודת", "Trap")} ששומרת על ${w("מפלצות", "Monsters")} מפני ${w("לחשים", "Spells")}. נצחו בכל זאת.` },
			"r-target": { title: w("בוחרים מטרה", "Target"), goal: `על ${name("thunder-clap")} כתוב ${L("Target")}: בוחרים כש${w("מפעילים", "activate")}. נצחו בתור הזה.` },
			"r-quick": { title: w("אפקט מהיר", "Quick Effect"), goal: `${name("iron-boar")} תוקף את ${name("river-otter")}. בתור של נוקס אפקט של ${w("מפלצת", "Monster")} צריך ${L("(Quick Effect)")}. הצילו את ${name("river-otter")}.` },
			"r-main": { title: "רק בתור שלי", goal: `ל־${name("cinder-hedgehog")} אין ${L("Quick Effect")}: השתמשו בו ב־Main Phase. נצחו בתור הזה.` },
			"r-once": { title: w("פעם בתור", "Once per turn"), goal: `שתי התקפות בדרך, ו־${name("glint-lynx")} עובד ${w("פעם בתור", "once per turn")}. שמרו על ${name("river-otter")}.` },
			"r-when": { title: `${L('"When"')} או ${L('"If"')}?`, goal: `${L('"If…"')} תמיד מקבל הזדמנות. ${L('"When…"')} רק אם ההליכה ל${w("בית הקברות", "Graveyard")} קורית אחרונה. איזה קלף ${w("להשליך", "discard")}?` },
			"r-last": { title: "בדיוק בזמן", goal: `על ${name("dozy-moth")} כתוב ${L('"When…"')}. תנו לקרב לשלוח אותו ל${w("בית הקברות", "Graveyard")}, בלי שום דבר אחרי. נצחו!` },
			"r-boss": { title: "קוראים כל מילה", goal: "נצחו בתור הזה. קראו כל קלף לפני שמשחקים אותו." },
			"m-reborn": { title: `חוזרים מ${GY}`, goal: `קראו את ${name("monster-reborn")}. געו ב${GY} שלכם, בחרו ${MONSTER}, ונצחו בתור הזה.` },
			"m-either": { title: `שני ${w("בתי הקברות", "Graveyards")}`, goal: `על ${name("monster-reborn")} כתוב ${L('"either GY"')}: חפשו בשני ${w("בתי הקברות", "Graveyards")}, שלכם ושל נוקס. נצחו בתור הזה.` },
			"m-field": { title: w("אזור השדה", "Field Zone"), goal: `${name("mountain")} הוא ${L("Field Spell")}: הוא הולך ל${w("אזור השדה", "Field Zone")} ונשאר שם. נצחו בתור הזה.` },
			"m-both": { title: `שני ${L("Mountain")}`, goal: `${L('"On the field"')} פירושו שני הצדדים. לנוקס יש ${name("mountain")}. שחקו גם את שלכם, ונצחו.` },
			"m-banish": { title: w("מוגלה", "Banished"), goal: `${name("busy-bee")} תוקפת. ${w("מלכודת", "Trap")} אחת ${w("משמידה", "destroy")}, אחת ${w("מגלה", "banish")}. קלף מוגלה לא הולך ל${GY}.` },
			"m-desires": { title: DOWN, goal: `קראו את ${name("pot-of-desires")}. ה${COST}: ${w("להגלות", "banish")} 10 קלפים ${DOWN}. ואז נצחו בתור הזה.` },
			"m-mat": { title: "לאן זה הולך?", goal: "שימו כל קלף במקום שלו על המשטח כולו." },
			"ic-quick": { title: w("משחק מהיר", "Quick-Play"), goal: `${w("הניחו", "Set")} את ${name("spark-dash")} ${DOWN}. בתור של ${RIVAL}, ${w("הפעילו", "activate")} אותו כש־${name("iron-boar")} תוקף.` },
			"ic-quick-2": { title: "חכו לרגע שלכם", goal: `${RIVAL} ${w("יזמן", "Summon")} ואז יתקוף. ${w("הניחו", "Set")} את ${name("thunder-clap")} וענו להתקפה. שמרו על ${name("pocket-cub")}.` },
			"ic-counter": { title: w("מלכודת נגד", "Counter Trap"), goal: `שתי התקפות מגיעות, ויש לכם ${w("מלכודת", "Trap")} אחת. קראו אותה: היא עוצרת את כל ה־${L("Battle Phase")}.` },
			"ic-banner": { title: w("לחש שנשאר", "Spell"), goal: `${name("banner-of-courage")} הוא ${w("לחש מתמשך", "Continuous Spell")}: הוא נשאר ${UP}. נצחו בתור הזה.` },
			"ic-equip": { title: "מצטיידים", goal: `${name("legendary-sword")} הוא ${w("לחש ציוד", "Equip Spell")}. הצמידו אותו ל${MONSTER} הנכונה, ונצחו בתור הזה.` },
			"ic-haunted": { title: w("מלכודת שנשארת", "Trap"), goal: `${name("call-of-the-haunted")} היא ${w("מלכודת מתמשכת", "Continuous Trap")}. הפכו אותה ב־${L("Main Phase")} ונצחו בתור הזה.` },
			"ri-first": { title: w("הטקס הראשון", "Ritual"), goal: `שחקו את ${name("black-luster-ritual")}. ${w("הקריבו", "Tribute")} ${MONSTERS} שסכום ה${w("רמות", "Levels")} שלהן 8 או יותר. נצחו בתור הזה.` },
			"ri-hand": { title: "מהיד", goal: `ה${w("הקרבות", "Tributes")} ל${w("זימון טקס", "Ritual Summon")} יכולות לבוא גם מהיד. נצחו בתור הזה.` },
			"ri-more": { title: "8 או יותר", goal: `על הקלף כתוב ${L('"8 or more"')}: 8 או יותר. אילו ${MONSTERS} ${w("להקריב", "Tribute")}? נצחו בתור הזה.` },
			"fu-first": { title: "שתיים הופכות לאחת", goal: `שחקו את ${name("polymerization")}. על ${name("flame-swordsman")} כתובים השמות של שתי ה${MONSTERS} שלו. נצחו בתור הזה.` },
			"fu-hand": { title: "מהיד או מהשדה", goal: `על ${name("polymerization")} כתוב ${L('"from your hand or field"')}: מהיד או מהשדה. נצחו בתור הזה.` },
			"fu-grave": { title: "לאן הן הלכו?", goal: `ה${MONSTERS} של ${w("זימון מיזוג", "Fusion Summon")} הולכות ל${GY}. אחת יכולה לחזור? נצחו בתור הזה.` },
			"sy-first": { title: "מכוונים", goal: `געו ב${EXTRA}. ${L("Tuner")} אחד ועוד ${MONSTER}: ${L("Level 3 + Level 3 = 6")}. נצחו!` },
			"sy-pick": { title: "בדיוק 6", goal: `ב${w("זימון סינכרו", "Synchro Summon")} סכום ה${w("רמות", "Levels")} חייב להיות מדויק. בחרו את השתיים הנכונות, ונצחו.` },
			"sy-tuner": { title: `בלי ${L("Tuner")}, אין ${L("Synchro")}`, goal: `${w("זימון סינכרו", "Synchro Summon")} צריך ${L("Tuner")} אחד בדיוק. נצחו בתור הזה.` },
			"xy-first": { title: "עורמים אותן", goal: `שתי ${MONSTERS} ב${w("רמה", "Level")} 4 הולכות מתחת ל־${name("gem-knight-pearl")}. געו ב${EXTRA}, ונצחו בתור הזה.` },
			"xy-level": { title: `אותה ${w("רמה", "Level")}`, goal: `${w("זימון אקסיז", "Xyz Summon")} צריך ${MONSTERS} באותה ${w("רמה", "Level")}. נצחו בתור הזה.` },
			"xy-detach": { title: w("מנתקים", "Detach"), goal: `שתי התקפות בדרך. ${L("Utopia")} יכול ${w("לנתק", "detach")} ${w("חומר", "material")}, בתור ${COST}, ולבטל התקפה. שמרו על ${name("pocket-cub")}.` },
			"xy-empty": { title: `ה${w("חומר", "material")} האחרון`, goal: `קראו את כל ${L("Utopia")}. בלי ${w("חומר", "material")}, התקפה ${w("תשמיד", "destroy")} אותו. שמרו על ${L("Utopia")}.` },
			"li-first": { title: w("מתחברים", "Link"), goal: `${name("lanphorhynchus")} הוא ${L("Link 2")}: ${w("זימון לינק", "Link Summon")} עם 2 ${MONSTERS}. הוא הולך ל־${L("Extra Monster Zone")}. נצחו!` },
			"li-keep": { title: "מי נשאר?", goal: `${w("זימון לינק", "Link Summon")} עם שתי ${MONSTERS}, ושמרו על הנכונה. נצחו בתור הזה.` },
			"li-nodef": { title: "בלי מגן", goal: `${name("shadow-wolf")} עומד לתקוף. ל־${L("Link Monster")} אין DEF ואין ${w("מצב הגנה", "Defense Position")}. שמרו על ${name("lanphorhynchus")} בדרך אחרת.` },
			"pe-first": { title: `שתי ${w("סקאלות", "Scales")}`, goal: `שימו את שתי ה־${L("Pendulum Scales")}. ואז ${w("זימון מטוטלת", "Pendulum Summon")} ל${MONSTERS} שה${w("רמה", "Level")} שלהן ביניהן. נצחו!` },
			"pe-between": { title: `בין ה${w("סקאלות", "Scales")}`, goal: `עם ${w("סקאלות", "Scales")} 2 ו־7, רק ${w("רמות", "Levels")} 3 עד 6 באות ב${w("זימון מטוטלת", "Pendulum Summon")}. נצחו בתור הזה.` },
			"pe-extra": { title: `לא ל${GY}`, goal: `שימו לב לאן ${name("flash-knight")} הולך כשהוא ${w("מושמד", "destroyed")}. אחר כך נצחו בתור שלכם.` },
			"rd-vortex": { title: "משלמים, ואז מחזירים", goal: `קראו את שני הקלפים. ${COST} יכול גם לעזור לכם. נצחו בתור הזה.` },
			"rd-fissure": { title: `בלי ${L("Target")}`, goal: `על ${name("fissure")} לא כתוב ${L("Target")}: הקלף בוחר. ${w("השמידו", "destroy")} את שתי ה${MONSTERS} ושמרו על ${name("river-otter")}.` },
			"rd-then": { title: w("ואז", "Then"), goal: `${name("upstart-goblin")}: אתם שולפים, ואז (${L('"then"')}) נוקס מקבל 1000 ${LP}. זה משתלם? נצחו בתור הזה.` },
			"rd-colon": { title: "רק היריב", goal: `קראו את ${name("cyber-dragon")} לפני שאתם ${w("מזמנים", "Summon")} משהו. נצחו בתור הזה.` },
			"rd-kuriboh": { title: "הפתעה ביד", goal: `שתי התקפות בדרך. ל־${name("kuriboh")} יש ${L("Quick Effect")} מהיד שלכם. אל תאבדו אף ${w("נקודת חיים", "LP")}.` },
			"lg-ultimate": { title: "שלושה הופכים לאחד", goal: `שלושה ${name("blue-eyes-white-dragon")} ביד. קראו את ${w("מפלצת ההיתוך", "Fusion Monster")} ב${EXTRA}. נצחו.` },
			"lg-exodia": { title: name("exodia-the-forbidden-one"), goal: `ארבעה חלקים ביד. שלפו את החמישי ונצחו, לא משנה כמה ${LP} יש.` },
			"lg-exodia-2": { title: "קלף אחד מהניצחון", goal: `חלק אחד עדיין ב${w("חפיסה", "Deck")}. איזה קלף יכול לשלוף אותו? נצחו בתור הזה.` },
			"st-battle": { title: L("Battle Step"), goal: `${name("iron-boar")} תוקף את ${name("pocket-cub")}. שמרו על ${name("pocket-cub")}: איזה קלף פועל ברגע הנכון?` },
			"st-damage": { title: L("Damage Step"), goal: `שתי התקפות מגיעות. תנו ל־${L("Battle Step")} לעבור, ופעלו ב־${L("Damage Step")}. שמרו על 1000 ${LP}.` },
			"st-set": { title: w("עם הפנים למטה", "face-down"), goal: `${name("shadow-wolf")} יתקוף. ${w("הניחו", "Set")} את ה${MONSTER} ${DOWN}: לא תאבדו ${LP}.` },
			"st-flip": { title: L("Flip Summon"), goal: `ה${MONSTER} שהנחתם (${L("Set")}) חיכתה תור. הפכו אותה ל${w("מצב התקפה", "Attack Position")}, ונצחו.` },
			"td-ash": { title: "אפר ביד", goal: `${name("elemental-hero-blazeman")} מחפש ${name("polymerization")}. ${w("השליכו", "Discard")} את ${name("ash-blossom-joyous-spring")} מהיד כדי לבטל.` },
			"td-ogre": { title: name("ghost-ogre-snow-rabbit"), goal: `${MONSTER} ${w("מפעילה", "activates")} אפקט. שלחו את ${name("ghost-ogre-snow-rabbit")}: ${w("השמידו", "destroy")} אותה. החיפוש שלה קורה בכל זאת!` },
			"td-solemn": { title: "עונים לתשובה", goal: `נוקס יענה לחיפוש עם ${name("ash-blossom-joyous-spring")}. ענו עם ה${w("מלכודת נגד", "Counter Trap")}, ונצחו.` },
			"td-jammer": { title: name("magic-jammer"), goal: `נוקס ${w("מפעיל", "activates")} ${w("לחש", "Spell")} על ה${MONSTER}. ${w("השליכו", "Discard")} קלף ובטלו עם ה${w("מלכודת נגד", "Counter Trap")}.` },
			"td-droll": { title: `נועלים את ה־${L("Deck")}`, goal: `נוקס מחפש פעמיים. אחרי החיפוש הראשון, ${name("droll-lock-bird")} עוצר את השני.` },
			"td-sage": { title: "עיניים כחולות", goal: `${w("זמנו", "Summon")} את ה־${L("Sage")} וחפשו את ה־${L("White Stone")}. ${name("one-for-one")} שולח אותה, והיא מביאה ${L("Blue-Eyes")}. נצחו!` },
			"td-stone": { title: "האבן הלבנה", goal: `שלחו את ${name("the-white-stone-of-legend")} ל${w("בית הקברות", "Graveyard")}: היא מביאה ${L("Blue-Eyes")}. ${w("זמנו", "Summon")} ונצחו.` },
			"td-arrows": { title: "בעקבות החץ", goal: `${name("link-spider")} מצביע למטה. ${w("זימון לינק", "Link Summon")} ל־${name("gaia-saber-the-lightning-shadow")} שם, ותקפו עם שניהם.` },
			"td-spider": { title: "קורי העכביש", goal: `${w("זמנו", "Summon")} ${MONSTER}, ואז ${name("link-spider")} מביא ${w("מפלצת רגילה", "Normal Monster")} מהיד מתחת לחץ. נצחו!` },
			"td-pendulum": { title: `חזרה מה־${L("Extra Deck")}`, goal: `${name("flash-knight")} מחכה ${UP} ב־${L("Extra Deck")}. ${w("זימון מטוטלת", "Pendulum Summon")} ל־${L("Extra Monster Zone")}. נצחו!` },
			"x-duel": { title: `הדו־קרב של ${EXTRA}`, goal: `דו־קרב שלם על המשטח כולו. השתמשו ב${EXTRA}. הורידו את ${LP} של נוקס ל־0!` },
			...Object.fromEntries(MASTERS.map((master) => [masterLevelId(master), { title: `דו־קרב: ${L(MASTER_NAMES[master])} · ${TIER_WORDS[MASTER_TIER[master]]}`, goal: `דו־קרב שלם מול ${L(MASTER_NAMES[master])}: 40 קלפים מעורבבים ו־8000 ${LP}. הורידו אותו ל־0!` }])),
		},
		cards,
		kinds: { monster: w("מפלצת", "Monster"), spell: w("לחש", "Spell"), trap: w("מלכודת", "Trap") },
		types: { aqua: w("מים", "Aqua"), beast: w("חיה", "Beast"), "beast-warrior": w("לוחם־חיה", "Beast-Warrior"), cyberse: w("סייברס", "Cyberse"), dinosaur: w("דינוזאור", "Dinosaur"), "divine-beast": w("חיה אלוהית", "Divine-Beast"), dragon: w("דרקון", "Dragon"), fairy: w("פיה", "Fairy"), fiend: w("שד", "Fiend"), fish: w("דג", "Fish"), insect: w("חרק", "Insect"), machine: w("מכונה", "Machine"), plant: w("צמח", "Plant"), psychic: w("מדיום", "Psychic"), pyro: w("אש", "Pyro"), reptile: w("זוחל", "Reptile"), rock: w("סלע", "Rock"), "sea-serpent": w("נחש ים", "Sea Serpent"), spellcaster: w("מכשף", "Spellcaster"), thunder: w("רעם", "Thunder"), warrior: w("לוחם", "Warrior"), "winged-beast": w("חיה מכונפת", "Winged Beast"), wyrm: w("וירם", "Wyrm"), zombie: w("זומבי", "Zombie") },
		frames: { ritual: w("טקס", "Ritual"), fusion: w("מיזוג", "Fusion"), synchro: w("סינכרו", "Synchro"), xyz: w("אקסיז", "Xyz"), link: w("לינק", "Link") },
		spellTypes: { normal: w("לחש רגיל", "Normal Spell"), "quick-play": w("לחש משחק מהיר", "Quick-Play Spell"), continuous: w("לחש מתמשך", "Continuous Spell"), equip: w("לחש ציוד", "Equip Spell"), field: w("לחש שדה", "Field Spell"), ritual: w("לחש טקס", "Ritual Spell") },
		trapTypes: { normal: w("מלכודת רגילה", "Normal Trap"), continuous: w("מלכודת מתמשכת", "Continuous Trap"), counter: w("מלכודת נגד", "Counter Trap") },
		tuner: w("מכוון", "Tuner"),
		rank: w("דרגה", "Rank"),
		linkRating: L("Link"),
		scale: w("סקאלת מטוטלת", "Pendulum Scale"),
		materials: (count) => (count === 1 ? `${w("חומר", "material")} אחד מתחתיה` : `${count} ${w("חומרים", "materials")} מתחתיה`),
		rules: {
			zones: "סוגי קלפים ואזורים",
			battle: "קרב: ATK מול ATK",
			defense: w("מצב הגנה", "Defense Position"),
			direct: `${LP} והתקפות ישירות`,
			summon: w("זימון רגיל", "Normal Summon"),
			tribute: w("הקרבות", "Tributes"),
			phases: "שלבי התור",
			spell: w("לחשים", "Spells"),
			trap: w("מלכודות", "Traps"),
			chain: w("שרשראות", "Chains"),
			cost: `${w("המחיר", "cost")}: מה שלפני ה־;`,
			target: w("מטרה", "Target"),
			quick: w("אפקט מהיר", "Quick Effect"),
			once: w("פעם בתור", "Once per turn"),
			timing: `${L('"When… you can"')} או ${L('"If… you can"')}`,
			graveyard: GY,
			field: w("אזור השדה", "Field Zone"),
			banish: w("קלפים מוגלים", "banished"),
			quickplay: `${w("לחש משחק מהיר", "Quick-Play Spell")}: ${w("מניחים", "Set")}, ואז ${w("מפעילים", "activate")} בתור של היריב`,
			counter: `${w("מלכודת נגד", "Counter Trap")}: עונה, ועוצרת הכול`,
			continuous: `${w("מתמשך", "Continuous")}: הקלף נשאר ${UP}`,
			equip: `${w("לחש ציוד", "Equip Spell")}: קשור ל${MONSTER} אחת`,
			ritual: w("זימון טקס", "Ritual Summon"),
			fusion: w("זימון מיזוג", "Fusion Summon"),
			synchro: w("זימון סינכרו", "Synchro Summon"),
			xyz: w("זימון אקסיז", "Xyz Summon"),
			detach: `${w("ניתוק", "Detach")}: ${w("חומר", "material")} בתור ${COST}`,
			link: w("זימון לינק", "Link Summon"),
			pendulum: w("זימון מטוטלת", "Pendulum Summon"),
			notarget: `בלי ${L('"Target"')}: הקלף בוחר`,
			then: `${L('"Then"')}: דבר אחד, ואז השני`,
			condition: "תנאי בלי נקודתיים",
			exodia: `${name("exodia-the-forbidden-one")}: חמישה חלקים ביד מנצחים`,
			steps: `${L("Battle Step")}, ואז ${L("Damage Step")}`,
			set: `${w("להניח", "Set")} ${MONSTER} ${DOWN}, ואז ${L("Flip Summon")}`,
			handtrap: `${L("Hand traps")}: ${MONSTER} ביד שעונה`,
			speed: `${w("מהירות", "Spell Speed")}: רק ${w("מלכודת נגד", "Counter Trap")} עונה ל${w("מלכודת נגד", "Counter Trap")}`,
			lock: `"עד סוף התור": נעילה`,
			search: `חיפוש ב־${L("Deck")}: אפקט מביא את הקלף`,
			arrows: `${w("חיצי קישור", "Link Arrows")}: האזורים ש${MONSTER} ${L("Link")} מצביעה עליהם`,
		},
		mastery: { new: "עוד לא פגשתם", met: "פגשתם", mastered: "השתמשתם שוב בלי עזרה" },
		phases,
		steps: { battle: L("Battle Step"), damage: L("Damage Step") },
		stepHelp: {
			battle: `${L("Battle Step")}: בוחרים מי תוקף ואת מי. זה הרגע של ${w("מלכודות", "Traps")} שאומרות "כשמפלצת מכריזה על התקפה".`,
			damage: `${L("Damage Step")}: שתי ה${MONSTERS} נפגשות. רק קלפים שמשנים ATK, או שכתוב עליהם כמו ${L("Kuriboh")}, עוד אפשר להפעיל. המפסידה הולכת ל${GY} ממש בסוף.`,
		},
		phaseHelp: {
			draw: `${L("Draw Phase")}: שולפים קלף אחד. לא נשאר קלף לשלוף? מפסידים בדו־קרב.`,
			standby: `${L("Standby Phase")}: הפסקה קטנה. יש קלפים שפועלים כאן. לרוב לא קורה כלום, וממשיכים.`,
			main1: `${L("Main Phase 1")}: בונים. ${w("זימון רגיל", "Normal Summon")} אחד, ${w("לחשים", "Spells")}, ${w("מלכודות", "Traps")} להנחה, בכל סדר שרוצים.`,
			battle: `${L("Battle Phase")}: כל אחת מהמפלצות שלכם ב${w("מצב התקפה", "Attack Position")} יכולה לתקוף פעם אחת.`,
			main2: `${L("Main Phase 2")}: אחרי הקרב, עוד ${L("Main Phase")} כדי להתכונן לתור של היריב.`,
			end: `${L("End Phase")}: אפקטים ש"עד סוף התור" נגמרים. ואז תור היריב.`,
		},
		level: w("רמה", "Level"),
		atk: "ATK",
		def: "DEF",
		lifePoints: (side, lp) => (side === "you" ? `${LP} שלכם: ${lp}` : `${LP} של ${RIVAL}: ${lp}`),
		handCount: (side, count) => `${side === "you" ? "היד שלכם" : `היד של ${RIVAL}`}: ${count} קלפים`,
		monsterZone: (side, number) => (side === "you" ? `${w("אזור מפלצות", "Monster Zone")} ${number} שלכם` : `${w("אזור מפלצות", "Monster Zone")} ${number} של ${RIVAL}`),
		backZone: (side, number) => (side === "you" ? `${w("אזור לחשים ומלכודות", "Spell & Trap Zone")} ${number} שלכם` : `${w("אזור לחשים ומלכודות", "Spell & Trap Zone")} ${number} של ${RIVAL}`),
		mainZone: (side, number) => `${w("אזור מפלצות ראשי", "Main Monster Zone")} ${number} ${side === "you" ? "שלכם" : `של ${RIVAL}`}`,
		extraMonsterZone: (side) => `${w("אזור המפלצות הנוסף", "Extra Monster Zone")} ${side === "you" ? "שלכם" : `של ${RIVAL}`}`,
		fieldZone: (side) => `${w("אזור השדה", "Field Zone")} ${side === "you" ? "שלכם" : `של ${RIVAL}`}`,
		pendulumZone: (side, number) => `${w("אזור מטוטלת", "Pendulum Zone")} ${number} ${side === "you" ? "שלכם" : `של ${RIVAL}`}`,
		extraDeck: (side, count) => `${EXTRA} ${side === "you" ? "שלכם" : `של ${RIVAL}`}: ${count}`,
		banished: (side, count) => `הקלפים ה${w("מוגלים", "banished")} ${side === "you" ? "שלכם" : `של ${RIVAL}`}: ${count}`,
		faceDownCards: (count) => (count === 1 ? `קלף אחד ${DOWN}` : `${count} קלפים ${DOWN}`),
		faceUp: UP,
		pileEmpty: "אין כאן קלף.",
		closePile: "לסגור",
		empty: "ריק",
		faceDown: DOWN,
		inDefense: w("מצב הגנה", "Defense Position"),
		hasEffect: "יש לה אפקט",
		quickMark: L("Quick Effect"),
		hand: "היד שלכם",
		deck: (count) => `החפיסה שלכם: ${count === 1 ? "קלף אחד" : `${count} קלפים`}`,
		graveyard: (side, count) => (side === "you" ? `${w("בית הקברות", "Graveyard")} שלכם: ${count}` : `${w("בית הקברות", "Graveyard")} של ${RIVAL}: ${count}`),
		board: "לוח הדו־קרב",
		phaseBar: "שלבי התור",
		play: "לשחק",
		replay: "לשחק שוב",
		continueWith: (title) => `לשחק: ${title}`,
		locked: "פתרו את השלב הקודם כדי לפתוח את זה",
		solvedMark: "נפתר",
		starMark: "נפתר בלי רמז",
		allDone: "סיימתם את כל השלבים. אפשר לשחק שוב בכל אחד מהם.",
		levelOf: (number, total) => `שלב ${number} מתוך ${total}`,
		draw: "לשלוף",
		endTurn: "לסיים את התור",
		rivalNext: `התור של ${RIVAL}: הלאה`,
		pass: "לתת לזה לקרות",
		attackDirectly: "לתקוף ישירות",
		turnCard: (card) => `לסובב את ${L(card)}`,
		useEffect: "להשתמש באפקט שלה",
		cancel: "להחזיר את הקלף",
		undo: "צעד אחד אחורה",
		restart: "להתחיל מחדש",
		hint: "רמז",
		noHint: "מכאן כבר אי אפשר להגיע למטרה. חזרו צעד אחורה, או התחילו מחדש.",
		showMe: "הראו לי",
		watchFirst: "קודם מסתכלים",
		demoStep: (number, total) => `צעד ${number} מתוך ${total}`,
		demoNext: "הלאה",
		demoAgain: "שוב",
		demoDone: "עכשיו אני!",
		backToMap: "חזרה למפה",
		backHome: "חזרה לדף הבית",
		nextLevel: "השלב הבא",
		quizLink: "תוספת: החידון של משימה 1",
		calm: "מצב רגוע",
		calmHint: "מכבה כל תנועה.",
		calmDevice: "המכשיר שלכם גם מבקש פחות תנועה, ולכן התנועה נשארת כבויה.",
		sound: "קול וצלילים",
		soundHint: "הקול מדבר באנגלית, כמו המילים שעל הקלפים, ומשמיע צלילים קטנים. כבוי עד שתדליקו.",
		onTheCard: "על הקלף (באנגלית):",
		meaning: "הפירוש:",
		yourTurn: "התור שלכם.",
		rivalTurn: `התור של ${RIVAL}. געו ב״הלאה״ כדי לראות כל צעד.`,
		answerNow: `עצור! געו ב${w("מלכודת המונחת", "Set Trap")} שלכם, או בקלף שאפשר להשתמש באפקט שלו עכשיו, או תנו לזה לקרות.`,
		selected: (card) => `בחרתם את ${L(card)}.`,
		chooseZone: "געו באזור זוהר.",
		chooseTarget: `עכשיו געו ב${w("מפלצת", "Monster")} בשביל הקלף הזה.`,
		chooseTributes: (left) => (left === 1 ? `געו ב${w("מפלצת", "Monster")} אחת שלכם כדי ${w("להקריב", "Tribute")} אותה.` : `געו ב־${left} ${w("מפלצות", "Monsters")} שלכם כדי ${w("להקריב", "Tribute")} אותן.`),
		chooseAttackTarget: "געו במה שהיא צריכה לתקוף.",
		chooseDiscard: `שלמו את ה${w("מחיר", "cost")}: געו בקלף אחר ביד כדי ${w("להשליך", "discard")} אותו.`,
		chooseGrave: `געו ב${w("בית קברות", "Graveyard")}, ואז ב${MONSTER} שתהיה ה${w("מטרה", "target")}.`,
		chooseFromDeck: "בחרו את הקלף שלוקחים מהחפיסה.",
		chooseRitual: (sum, need) => `געו ב${MONSTERS} שאתם ${w("מקריבים", "Tribute")}, ביד או בשדה. ${w("רמות", "Levels")}: ${sum} מתוך ${need}.`,
		chooseFusion: `געו ב${MONSTERS} שכתובות על ${w("מפלצת המיזוג", "Fusion Monster")}, ביד או בשדה.`,
		chooseExtra: `געו ב${MONSTER} ב${EXTRA}.`,
		chooseSynchro: (sum, level) => `געו ב־${L("Tuner")} אחד וב${MONSTERS} האחרות. ${w("רמות", "Levels")}: ${sum} מתוך ${level}.`,
		chooseXyz: (count, level) => `געו ב־${count} ${MONSTERS} ב${w("רמה", "Level")} ${level}.`,
		chooseLink: (count) => `געו ב־${count} ${MONSTERS}.`,
		choosePendulum: (low, high) => `${w("סקאלות", "Scales")} ${low} ו־${high}: געו ב${MONSTERS} ביד שה${w("רמה", "Level")} שלהן ביניהן.`,
		confirmSummon: `${w("לזמן", "Summon")}!`,
		specialSummon: w("זימון מיוחד", "Special Summon"),
		setFaceDown: `${w("להניח", "Set")} ${DOWN}`,
		setMonster: `${w("להניח", "Set")} ${DOWN} (${w("הגנה", "Defense")})`,
		pendulumSummon: w("זימון מטוטלת", "Pendulum Summon"),
		detach: `${w("לנתק", "detach")} ${w("חומר", "material")}`,
		useFromHand: "להשתמש באפקט שלו מהיד",
		solved: "הצלחתם!",
		solvedFirstTry: "בניסיון הראשון, בלי עזרה. הכלל הזה שלכם!",
		solvedWithHint: "נפתר עם רמז. שחקו שוב כדי לזכות בכוכב.",
		notYet: "לא הפעם.",
		fails: {
			lost: `${LP} שלכם ירדו ל־0.`,
			"monster-lost": `איבדתם ${w("מפלצת", "Monster")} שהייתם צריכים.`,
			"lp-lost": `איבדתם יותר מדי ${LP}.`,
			"out-of-moves": "לא נשאר מה לעשות, והמטרה לא הושגה.",
			"out-of-turns": "התור נגמר, והמטרה לא הושגה.",
		},
		reasons: {
			"duel-over": "הדו־קרב נגמר.",
			"deck-locked": `עד סוף התור אי אפשר להוסיף קלפים מה־${L("Deck")} ליד.`,
			"card-locked": "קלף שהשתמשתם בו אוסר את זה עד סוף התור.",
			"answer-first": "קודם בחרו: לענות, או לתת לזה לקרות.",
			"not-in-hand": "הקלף הזה לא ביד שלכם.",
			"wrong-zone": `שורה לא נכונה! ${w("מפלצות", "Monsters")} הולכות לאזורי המפלצות. ${w("לחשים", "Spells")} ו${w("מלכודות", "Traps")} הולכים לשורה שמאחור.`,
			"zone-taken": "האזור הזה תפוס. בחרו אזור ריק.",
			"summon-used": `רק ${w("זימון רגיל", "Normal Summon")} אחד בתור, וכבר השתמשתם בו.`,
			"wrong-tributes": `ה${w("מפלצת", "Monster")} הזאת צריכה ${w("הקרבות", "Tributes")}: אחת ל${w("רמה", "Level")} 5 או 6, שתיים לרמה 7 ומעלה.`,
			"not-main-phase": `את זה עושים ב־Main Phase שלכם: ${w("זימון", "Summon")}, ${w("לחש", "Spell")}, הנחת ${w("מלכודת", "Trap")}, סיבוב ${w("מפלצת", "Monster")}, ואפקטים בלי ${L("Quick Effect")}.`,
			"no-target": `הקלף הזה צריך ${w("מפלצת", "Monster")} לבחור בה כ${w("מטרה", "target")}.`,
			"draw-first": "קודם שלפו את הקלף שלכם.",
			"already-drew": "שולפים קלף אחד, ב־Draw Phase.",
			"first-turn-no-draw": "מי שמתחיל לא שולף קלף בתור הראשון.",
			"cannot-go-back": "השלבים רק מתקדמים קדימה.",
			"first-turn-no-battle": "אף אחד לא תוקף בתור הראשון של הדו־קרב.",
			"not-battle-phase": "תוקפים ב־Battle Phase.",
			"no-monster": `אין כאן ${w("מפלצת", "Monster")}.`,
			"defense-cannot-attack": `${w("מפלצת", "Monster")} ב${w("מצב הגנה", "Defense Position")} לא יכולה לתקוף. קודם סובבו אותה.`,
			"already-attacked": `ה${w("מפלצת", "Monster")} הזאת כבר תקפה בתור הזה.`,
			"monster-in-the-way": `${w("מפלצת", "Monster")} חוסמת את הדרך. התקפה ישירה צריכה שדה ריק.`,
			"trap-just-set": `עוד לא! אי אפשר ${w("להפעיל", "activate")} ${w("מלכודת", "Trap")} בתור שבו ${w("הנחתם", "Set")} אותה.`,
			"nothing-to-answer": `ה${w("מלכודת", "Trap")} שלכם מחכה שהיריב יעשה משהו.`,
			"cannot-answer-that": `ה${w("מלכודת", "Trap")} הזאת לא עונה על זה.`,
			"just-summoned": `${w("מפלצת", "Monster")} לא יכולה לשנות מצב בתור שבו ${w("זומנה", "Summoned")}.`,
			"position-used": `ה${w("מפלצת", "Monster")} הזאת כבר שינתה מצב בתור הזה.`,
			"cost-needed": `קודם משלמים את ה${w("מחיר", "cost")}: ${w("משליכים", "discard")} קלף אחר מהיד. אין קלף להשליך, אין ${w("הפעלה", "activation")}.`,
			"nothing-to-hit": `לקלף הזה אין מה ${w("להשמיד", "destroy")}, ולכן אי אפשר ${w("להפעיל", "activate")} אותו.`,
			"no-ability": `ל${w("מפלצת", "Monster")} הזאת אין אפקט.`,
			"not-quick": `לאפקט של ה${w("מפלצת", "Monster")} הזאת אין ${L("(Quick Effect)")}, ולכן הוא עובד רק ב־Main Phase שלכם.`,
			"once-per-turn": `משתמשים באפקט הזה רק ${w("פעם בתור", "once per turn")}, וכבר השתמשתם בו.`,
			"extra-zone": `זה ה${w("אזור המפלצות הנוסף", "Extra Monster Zone")}. רק ${MONSTER} מ${EXTRA} הולכת לשם. ${L("Link Monster")} הולכת לשם, או לאזור ש־${L("Link Monster")} אחרת מצביעה עליו.`,
			"field-zone": `${w("לחש שדה", "Field Spell")} הולך ל${w("אזור השדה", "Field Zone")}, ושום קלף אחר לא הולך לשם.`,
			"no-free-zone": `אין ${w("אזור מפלצות ראשי", "Main Monster Zone")} ריק בשביל המפלצת.`,
			"one-per-turn": `כתוב על הקלף: אפשר ${w("להפעיל", "activate")} רק קלף אחד בשם הזה בכל תור.`,
			"deck-too-small": `אין בחפיסה שלכם מספיק קלפים בשביל מה שהקלף אומר, ולכן אי אפשר ${w("להפעיל", "activate")} את הקלף הזה.`,
			"no-ritual-monster": `ה${MONSTER} שכתובה על ${w("לחש הטקס", "Ritual Spell")} חייבת להיות ביד שלכם.`,
			"wrong-materials": `אלה לא ה${MONSTERS} הנכונות. קראו שוב את השורה הראשונה של הקלף.`,
			"levels-too-low": `ה${w("רמות", "Levels")} של ה${MONSTERS} שאתם ${w("מקריבים", "Tribute")} לא מגיעות למספר שעל ${w("לחש הטקס", "Ritual Spell")}.`,
			"too-many-tributes": `${w("הקרבה", "Tribute")} אחת יותר מדי. הקריבו רק מה ש${w("לחש הטקס", "Ritual Spell")} צריך.`,
			"not-in-extra": `ה${MONSTER} הזאת לא ב${EXTRA} שלכם.`,
			"needs-spell": `${w("זימון מיזוג", "Fusion Summon")} צריך קלף כמו ${name("polymerization")}. ה${MONSTERS} לא מתמזגות לבד.`,
			"needs-one-tuner": `${w("זימון סינכרו", "Synchro Summon")} צריך ${L("Tuner")} אחד בדיוק, ועוד ${MONSTER} אחת או יותר שאינן ${L("Tuner")}.`,
			"levels-not-equal": `ב${w("זימון סינכרו", "Synchro Summon")} סכום ה${w("רמות", "Levels")} חייב להיות בדיוק ה${w("רמה", "Level")} של ה${MONSTER}.`,
			"wrong-levels": `קראו את השורה הראשונה: ${w("זימון אקסיז", "Xyz Summon")} צריך מספר כזה של ${MONSTERS}, כולן ב${w("רמה", "Level")} הזאת.`,
			"link-count": `${w("זימון לינק", "Link Summon")} צריך מספר ${MONSTERS} כמו ה־${L("Link Rating")}.`,
			"link-no-defense": `ל־${L("Link Monster")} אין DEF. היא אף פעם לא יכולה להיות ב${w("מצב הגנה", "Defense Position")}.`,
			"no-material": `לא נשאר ${w("חומר", "material")} ${w("לנתק", "detach")}, ולכן אי אפשר לשלם את ה${COST}.`,
			"pendulum-zone": `${L("Pendulum Monster")} הופכת ל${w("סקאלה", "Scale")} ב${w("אזור לחשים ומלכודות", "Spell & Trap Zone")} השמאלי ביותר או הימני ביותר: אלה ${w("אזורי המטוטלת", "Pendulum Zones")}.`,
			"no-scales": `${w("זימון מטוטלת", "Pendulum Summon")} צריך ${w("סקאלה", "Scale")} בכל אחד משני ${w("אזורי המטוטלת", "Pendulum Zones")} שלכם.`,
			"pendulum-used": `רק ${w("זימון מטוטלת", "Pendulum Summon")} אחד בתור.`,
			"level-not-between": `ה${w("רמה", "Level")} שלה לא בין שתי ה${w("סקאלות", "Scales")} שלכם. המספרים של הסקאלות עצמן לא נחשבים.`,
			"special-only": `אי אפשר לעשות ל${w("מפלצת", "Monster")} הזאת ${L("Normal Summon")}. קראו את הקלף: יש לה ${w("זימון", "Summon")} משלה.`,
			"not-properly-summoned": `ה${w("מפלצת", "Monster")} הזאת אף פעם לא קיבלה את ה${w("זימון", "Summon")} שלה, ולכן היא לא יכולה לחזור מ${w("בית הקברות", "Graveyard")}.`,
			"condition-not-met": "קראו שוב את הקלף: מה שהוא מבקש לא מתקיים עכשיו.",
			"equip-only": `קראו את הקלף: את ${w("לחש הציוד", "Equip Spell")} הזה מצמידים רק למפלצת מסוג אחד.`,
			"cannot-set": `כאן רק ${w("לחש משחק מהיר", "Quick-Play Spell")} ${w("מניחים", "Set")} ${w("עם הפנים למטה", "face-down")}. ${w("לחשים", "Spells")} אחרים ${w("מפעילים", "activate")} מיד.`,
			"not-damage-step": `עוד לא: הקלף אומר "בזמן חישוב הנזק". חכו ל־${L("Damage Step")}.`,
			"damage-step-closed": `זה ה־${L("Damage Step")}: רק קלפים שמשנים ATK, או שכתוב עליהם, אפשר עוד להפעיל.`,
			"swords-lock": `${L("Swords of Revealing Light")} ${UP}: ה${MONSTERS} שלכם לא יכולות להכריז על התקפה.`,
			"jinzo-lock": `${L("Jinzo")} בשדה: אי אפשר ${w("להפעיל", "activate")} אף ${w("קלף מלכודת", "Trap Card")}.`,
			"one-at-a-time": `${L("Blue-Eyes Spirit Dragon")} בשדה: אף אחד לא יכול ${w("לזמן בזימון מיוחד", "Special Summon")} 2 מפלצות או יותר בבת אחת.`,
			"summon-locked": `בתור הזה קלף מונע מכם ${w("לזמן", "Summon")} מפלצות אחרות. אפשר עדיין ${w("להניח", "Set")} אחת ${DOWN}.`,
			"cannot-attack-that": `${L("Magician's Valkyria")} כאן: אי אפשר לתקוף את שאר ה${w("מכשפים", "Spellcasters")} שעם הפנים למעלה (${L("face-up")}).`,
		},
		rulesTitle: "הכללים שפגשתם",
		albumTitle: "אלבום הקלפים שלכם",
		albumEmpty: "הקלפים שתשחקו איתם יופיעו כאן.",
		certificateTitle: "דו־קרבן ג׳וניור",
		certificateText: `ניצחתם בדו־קרב שלם: ${w("זימונים", "Summons")}, קרבות, ${w("לחש", "Spell")} ו${w("מלכודת", "Trap")}. אתם יודעים איך דו־קרב עובד!`,
		certificateFinalText: `ניצחתם בדו־קרב על המשטח כולו, עם ${EXTRA} שלכם. אתם יודעים לקרוא קלף ולשחק מה שכתוב בו!`,
		print: "להדפיס את התעודה שלי",
		narrate(event) {
			const mine = "side" in event && event.side === "you";
			switch (event.type) {
				case "special": {
					const used = list(event.materials.map(name));
					const go = event.materials.length === 1 ? "הולך" : "הולכים";
					const summon = mine ? "זימנתם" : `${RIVAL} מזמן`;
					const card = name(event.card);
					switch (event.how) {
						case "revive":
							return `${summon} את ${card} ב${w("זימון מיוחד", "Special Summon")} מ${GY} ${event.from === "you" ? "שלכם" : `של ${RIVAL}`}.`;
						case "ritual":
							return `${mine ? w("הקרבתם", "Tribute") : `${RIVAL} ${w("מקריב", "Tributes")}`} את ${used}, ו־${card} מגיע מהיד ב${w("זימון טקס", "Ritual Summon")}.`;
						case "fusion":
							return `${used} ${go} ל${GY}. ${summon} את ${card} מ${EXTRA} ב${w("זימון מיזוג", "Fusion Summon")}.`;
						case "synchro":
							return `${used} ${go} ל${GY}: ${L(`Level ${event.materials.map((item) => monsterOf(item).level).join(" + ")} = ${monsterOf(event.card).level}`)}. ${summon} את ${card} ב${w("זימון סינכרו", "Synchro Summon")}.`;
						case "xyz":
							return `${used} ${go} מתחת ל־${card} בתור ${w("חומרים", "materials")}, ולא ל${GY}. ${summon} את ${card} ב${w("זימון אקסיז", "Xyz Summon")}.`;
						case "link":
							return `${used} ${go} ל${GY}. ${summon} את ${card} ב${w("זימון לינק", "Link Summon")}, ב${w("אזור המפלצות הנוסף", "Extra Monster Zone")}.`;
						case "own":
							return `${summon} את ${card} מהיד ב${w("זימון מיוחד", "Special Summon")}, כמו שכתוב על הקלף. ה־${L("Normal Summon")} עדיין פנוי.`;
					}
				}
				case "field":
					return `${name(event.card)} נשאר ${UP} ב${w("אזור השדה", "Field Zone")}. הוא משפיע על ה${MONSTERS} של שני השחקנים.`;
				case "banished":
					if (event.faceDown) return `${mine ? w("הגליתם", "banish") : `${RIVAL} ${w("מגלה", "banishes")}`} ${event.cards.length} קלפים ${DOWN}. הם לא ב${GY}.`;
					return event.cards.length === 1 ? `${list(event.cards.map(name))} ${w("הוגלה", "banished")}: הוא לא הולך ל${GY}.` : `${list(event.cards.map(name))} ${w("הוגלו", "banished")}: הם לא הולכים ל${GY}.`;
				case "to-extra":
					return `${name(event.card)} הוא ${L("Pendulum Monster")}: הוא הולך ${UP} ל${EXTRA}, ולא ל${GY}.`;
				case "detached":
					return `${mine ? w("ניתקתם", "detach") : `${RIVAL} ${w("מנתק", "detaches")}`} את ${name(event.material)} מ־${name(event.card)} כדי לשלם את ה${COST}. הוא הולך ל${GY}.`;
				case "scale":
					return `${name(event.card)} מונח ב${w("אזור מטוטלת", "Pendulum Zone")}, כמו ${w("לחש", "Spell")}: ${L(`Pendulum Scale ${event.scale}`)}.`;
				case "pendulum":
					return `${w("זימון מטוטלת", "Pendulum Summon")}! ${w("סקאלות", "Scales")} ${event.low} ו־${event.high}: ${list(event.cards.map(name))} ${event.cards.length === 1 ? "מגיע" : "מגיעים"} מהיד.`;
				case "hand-effect": {
					const effect = monsterOf(event.card).hand;
					const discards = mine ? w("השלכתם", "discard") : `${RIVAL} ${w("משליך", "discards")}`;
					if (effect === "ash") return `${discards} את ${name(event.card)} מהיד: ה־${L("Quick Effect")} שלו מבטל קלף שלוקח מהחפיסה.`;
					if (effect === "veiler") return `${mine ? "שלחתם" : `${RIVAL} שולח`} את ${name(event.card)} מהיד ל${GY}: ה־${L("Quick Effect")} שלו מבטל את האפקטים של ${MONSTER} עד סוף התור הזה.`;
					if (effect === "scarecrow") return `${discards} את ${name(event.card)} מהיד: ההתקפה הישירה מבוטלת, ואז ה־${L("Battle Phase")} נגמר.`;
					if (effect === "fader") return `${name(event.card)} מגיע מהיד ב${w("זימון מיוחד", "Special Summon")}: ה־${L("Battle Phase")} נגמר.`;
					if (effect === "crow") return `${discards} את ${name(event.card)} מהיד: ה־${L("Quick Effect")} שלו ${w("מגלה", "banishes")} את הקלף שנבחר ב${GY}.`;
					return `${discards} את ${name(event.card)} מהיד כדי לשלם את ה${COST} של ה־${L("Quick Effect")} שלו: אין נזק מהקרב הזה.`;
				}
				case "skip-draw":
					return mine ? `מדלגים על ה־${L("Draw Phase")} שלכם, כמו שהקלף אמר: אין שליפה בתור הזה.` : `${RIVAL} מדלג על ה־${L("Draw Phase")}: אין שליפה בתור הזה.`;
				case "drew":
					return mine ? `שלפתם את ${name(event.card)}.` : `${RIVAL} שולף קלף.`;
				case "phase":
					return event.phase === "end" ? `End Phase. ${mine ? "התור שלכם נגמר" : `התור של ${RIVAL} נגמר`}.` : `${phases[event.phase]}.`;
				case "turn":
					return mine ? "התור שלכם!" : `התור של ${RIVAL}.`;
				case "summoned":
					if (event.tributes.length > 0) return `${mine ? w("הקרבתם", "Tribute") : `${RIVAL} ${w("מקריב", "Tributes")}`} את ${list(event.tributes.map(name))} כדי ${w("לזמן", "Summon")} את ${name(event.card)}.`;
					return `${mine ? w("זימנתם", "Summon") : `${RIVAL} ${w("מזמן", "Summons")}`} את ${name(event.card)} ב${w("מצב התקפה", "Attack Position")}.`;
				case "activated":
					return `${mine ? w("הפעלתם", "activate") : `${RIVAL} ${w("מפעיל", "activates")}`} את ה${w("לחש", "Spell")} ${name(event.card)}${event.target ? ` ${w(mine ? "ובחרתם כמטרה" : "ובוחר כמטרה", "target")} את ${name(event.target)}` : ""}.`;
				case "discarded":
					return `${mine ? w("השלכתם", "discard") : `${RIVAL} ${w("משליך", "discards")}`} את ${name(event.card)} כדי לשלם את ה${w("מחיר", "cost")}.`;
				case "effect-used":
					return `${mine ? "השתמשתם" : `${RIVAL} משתמש`} באפקט של ${name(event.card)}.`;
				case "sent":
					return `${name(event.card)} נשלח ${event.from === "deck" ? `מה־${L("Deck")}` : "מהשדה"} ל${GY}.`;
				case "ability":
					return `${mine ? "השתמשתם באפקט של" : `${RIVAL} משתמש באפקט של`} ${name(event.card)} ${w(mine ? "ובחרתם כמטרה" : "ובוחר כמטרה", "target")} את ${name(event.target)}.`;
				case "trigger":
					return `על ${name(event.card)} כתוב ${L(event.word === "when" ? '"When…"' : '"If…"')}: הוא מקבל את ההזדמנות! ${mine ? "גרמתם" : `${RIVAL} גורם`} ${event.amount} נזק.`;
				case "missed":
					return `${name(event.card)} פספס את ההזדמנות! על הקלף כתוב ${L('"When…"')}, והוא מקבל הזדמנות רק אם ההליכה ל${w("בית הקברות", "Graveyard")} קורית אחרונה. כאן ${event.last === "activation" ? `${w("הפעלת", "activation")} ה${w("לחש", "Spell")}` : w("הזימון", "Summon")} קרה אחרון.`;
				case "negated":
					return `${name(event.by)} מבטל את ${name(event.card)}: האפקט שלו לא קורה.`;
				case "burned":
					return `${name(event.card)}: ${mine ? "אתם גורמים" : `${RIVAL} גורם`} ${event.amount} נזק.`;
				case "added":
					return `${name(event.card)} עובר ל${mine ? "יד שלכם" : `יד של ${RIVAL}`}, מ${event.from === "deck" ? "החפיסה" : GY}.`;
				case "stays":
					return cardOf(event.card).kind !== "monster" && (cardOf(event.card) as { icon?: string }).icon === "continuous" ? `${name(event.card)} נשאר ${UP} בשדה: זה ${w("לחש מתמשך", "Continuous Spell")}. האפקט שלו נמשך כל עוד הוא שם.` : `${name(event.card)} נשאר ${UP} בשדה. האפקט שלו נמשך כל עוד הוא שם.`;
				case "equipped":
					return `${name(event.card)} מוצמד ל־${name(event.target)}. אם ${name(event.target)} עוזב את השדה, גם הוא הולך.`;
				case "battle-ended":
					return mine ? `ה־${L("Battle Phase")} שלכם נגמר.` : `ה־${L("Battle Phase")} של ${RIVAL} נגמר.`;
				case "set-monster":
					return mine ? `${w("הנחתם", "Set")} את ${name(event.card)} ${DOWN}, ב${w("מצב הגנה", "Defense Position")}.` : `${RIVAL} ${w("מניח", "Sets")} ${MONSTER} ${DOWN}, ב${w("מצב הגנה", "Defense Position")}.`;
				case "flipped":
					return event.how === "summon" ? `${L("Flip Summon")}: ${name(event.card)} מתהפך ${UP}, ב${w("מצב התקפה", "Attack Position")}.` : `${name(event.card)} מתהפך ${UP}.`;
				case "turned-down":
					return `${name(event.card)} מתהפך ${DOWN}, ב${w("מצב הגנה", "Defense Position")}.`;
				case "coin":
					return `${name(event.card)}: ${mine ? "אתם מטילים" : `${RIVAL} מטיל`} מטבע… ${event.right ? "ניחוש נכון!" : "ניחוש שגוי!"}`;
				case "set":
					return `${w("הנחתם", "Set")} את ${name(event.card)} ${DOWN}. היא צריכה לחכות לתור הבא.`;
				case "gained":
					return `${mine ? "קיבלתם" : `${RIVAL} מקבל`} ${event.amount} ${LP}: עכשיו ${event.lp}.`;
				case "boosted":
					return `${name(event.card)}: ${event.amount > 0 ? "עוד" : "פחות"} ${Math.abs(event.amount)} ATK. עכשיו ${event.atk}, ${event.lasting === "damage-step" ? `רק ב־${L("Damage Step")}` : event.lasting === "for-good" ? "לתמיד" : "עד סוף התור"}.`;
				case "destroyed":
					return `${name(event.card)} ${w("הושמד", "destroyed")} והולך ל${w("בית הקברות", "Graveyard")}.`;
				case "no-effect":
					return `${name(event.card)} נפתר, אבל לא נשאר לו מה לעשות.`;
				case "position":
					return event.position === "defense" ? `${name(event.card)} עובר ל${w("מצב הגנה", "Defense Position")}. עכשיו ה־DEF קובע.` : `${name(event.card)} עובר ל${w("מצב התקפה", "Attack Position")}.`;
				case "attack-declared":
					return event.target ? `${name(event.attacker)} תוקף את ${name(event.target)}!` : event.hidden ? `${name(event.attacker)} תוקף ${MONSTER} ${DOWN}!` : `${name(event.attacker)} תוקף ישירות!`;
				case "damage-step":
					return `${L("Damage Step")}: רגע לפני חישוב הנזק.`;
				case "window":
					if (event.step === "damage") return mine ? `עצרו! ${L("Kuriboh")} וקלפים שמשנים ATK עוד יכולים לפעול.` : `${RIVAL} עוד יכול לשנות ATK.`;
					if (!mine) return `${RIVAL} יכול לענות.`;
					if (event.kind === "summon") return `עצרו! ${MONSTER} זומנה עכשיו: אפשר לענות.`;
					if (event.kind === "effect") return `עצרו! ${MONSTER} ${w("הפעילה", "activated")} את האפקט שלה: אפשר לענות. התשובה שלכם תיפתר ראשונה.`;
					if (event.kind === "chain") return `עצרו! ${w("מלכודת נגד", "Counter Trap")} יכולה לענות על התשובה. הקלף האחרון ב־${w("שרשרת", "Chain")} נפתר ראשון.`;
					return event.kind === "attack" ? "עצור! עכשיו אפשר לענות." : "עצור! עכשיו אפשר לענות. התשובה שלכם תיפתר ראשונה.";
				case "sprung":
					return `${mine ? "הפכתם" : `${RIVAL} הופך`} ${w("מלכודת", "Trap")}: ${name(event.card)}!`;
				case "attack-stopped":
					return `ההתקפה של ${name(event.attacker)} נעצרה.`;
				case "returned":
					return `${name(event.card)} חוזר ${mine ? "ליד שלכם" : `ליד של ${RIVAL}`}.`;
				case "chain":
					return event.link === 1 ? `${name(event.card)} מתחיל ${w("שרשרת", "Chain")}: ${L("Chain Link 1")}.` : `${name(event.card)} עולה מעל: ${L(`Chain Link ${event.link}`)}.`;
				case "resolve":
					return `${L(`Chain Link ${event.link}`)} נפתרת: ${name(event.card)}.`;
				case "battle": {
					const [a, d, x, y] = [name(event.attacker), name(event.defender), event.attackerValue, event.defenderValue];
					const destroyed = w("הושמד", "destroyed");
					if (event.defenderPosition === "attack") {
						if (x > y) return `${a} מנצח: ${L(`${x} − ${y} = ${x - y}`)}. ${d} ${destroyed}.`;
						if (x < y) return `${d} חזק יותר: ${L(`${y} − ${x} = ${y - x}`)}. ${a} ${destroyed}.`;
						return `${x} מול ${y}: תיקו. שתי ${w("המפלצות", "Monsters")} ${w("הושמדו", "destroyed")}.`;
					}
					if (x > y) return `${L(`${x} ATK`)} מנצח ${L(`${y} DEF`)}: ${d} ${destroyed}. אין נזק.`;
					if (x < y) return `${L(`${y} DEF`)} מחזיק מעמד: ${L(`${y} − ${x} = ${y - x}`)}. שום דבר לא ${destroyed}.`;
					return `${L(`${x} ATK`)} מול ${L(`${y} DEF`)}: שום דבר לא קורה.`;
				}
				case "direct":
					return `שום דבר לא חוסם: ${event.amount} נזק.`;
				case "lp":
					return `${mine ? "איבדתם" : `${RIVAL} מאבד`} ${event.from - event.to} ${LP}: נשארו ${event.to}.`;
				case "deck-out":
					return `${mine ? "החפיסה שלכם ריקה" : `החפיסה של ${RIVAL} ריקה`}: אין קלף לשלוף.`;
				case "locked":
					if (event.what === "special") return `${name(event.card)}: עד סוף התור ${mine ? "אתם יכולים" : `${RIVAL} יכול`} ${w("לזמן באופן מיוחד", "Special Summon")} רק את ה${MONSTERS} שהוא מרשה.`;
					if (event.what === "direct") return `${name(event.card)}: עד סוף התור רק ה${MONSTERS} שהוא מזכיר יכולות ${w("לתקוף ישירות", "attack directly")}.`;
					return `${name(event.card)}: עד סוף התור אי אפשר להוסיף קלפים מאף ${L("Deck")} ליד.`;
				case "exodia":
					return mine ? `כל חמשת החלקים של ${name("exodia-the-forbidden-one")} ביד שלכם: ניצחתם מיד, לא משנה כמה ${LP} יש!` : `ל${RIVAL} יש ביד את כל חמשת החלקים של ${name("exodia-the-forbidden-one")}.`;
				case "won":
					return mine ? "ניצחתם בדו־קרב!" : `${RIVAL} מנצח בדו־קרב הזה.`;
			}
		},
		describeMove(move, board) {
			const mine = board.pending ? board[board.turn === "you" ? "rival" : "you"] : board[board.turn];
			const theirs = board.pending ? board[board.turn] : board.turn === "you" ? board.rival : board.you;
			switch (move.type) {
				case "draw":
					return "שלפו את הקלף שלכם.";
				case "phase":
					return move.to === "end" ? "סיימו את התור." : `עברו ל־${phases[move.to]}.`;
				case "place": {
					const using = list((move.materials ?? []).map((item) => name(item.from === "hand" ? item.card : (mine.monsters[item.zone]?.card ?? move.card))));
					const buried = move.grave ? board[move.grave.side].graveyard[move.grave.index] : undefined;
					const activate = `${w("הפעילו", "Activate")} את ${name(move.card)}`;
					if (buried) return `${activate} ו${w("בחרו כמטרה", "target")} את ${name(buried)} ב${GY} ${move.grave?.side === "you" ? "שלכם" : `של ${RIVAL}`}.`;
					if (move.summon) return `${activate}: ${w("זימון מיזוג", "Fusion Summon")} של ${name(move.summon)} עם ${using}.`;
					if (move.materials) return `${activate} ו${w("הקריבו", "Tribute")} את ${using}.`;
					if (move.set && cardOf(move.card).kind === "monster") return `${w("הניחו", "Set")} את ${name(move.card)} ${DOWN}, ב${w("מצב הגנה", "Defense Position")}.`;
					if (move.special) return `זמנו את ${name(move.card)} מהיד ב${w("זימון מיוחד", "Special Summon")}, כמו שכתוב על הקלף.`;
					if (move.row === "field") return `שחקו את ${name(move.card)} ב${w("אזור השדה", "Field Zone")} שלכם.`;
					if (move.row === "backrow" && cardOf(move.card).kind === "monster") return `שימו את ${name(move.card)} ב${w("אזור מטוטלת", "Pendulum Zone")}.`;
					if ((move.tributes?.length ?? 0) > 0) return `${w("זמנו", "Summon")} את ${name(move.card)} ו${w("הקריבו", "Tribute")} את ${list((move.tributes ?? []).map((zone) => name(mine.monsters[zone]?.card ?? move.card)))}.`;
					return move.discard ? `${w("הפעילו", "Activate")} את ${name(move.card)} ו${w("השליכו", "discard")} את ${name(move.discard)} בתור ה${w("מחיר", "cost")}.` : `שחקו את ${name(move.card)}.`;
				}
				case "position": {
					const slot = mine.monsters[move.zone];
					return slot ? `סובבו את ${name(slot.card)}.` : "";
				}
				case "attack": {
					const attacker = mine.monsters[move.attacker];
					const target = move.target === "direct" ? null : theirs.monsters[move.target];
					if (!attacker) return "";
					return target ? `תקפו את ${name(target.card)} עם ${name(attacker.card)} (${L(`${atkOf(attacker, board)} ATK`)}).` : `תקפו ישירות עם ${name(attacker.card)}.`;
				}
				case "effect":
					return `להשתמש באפקט של ${name(move.card)}${move.pick ? `: ${name(move.pick)}` : ""}.`;
				case "ability": {
					const slot = mine.monsters[move.zone];
					const target = move.target === undefined ? null : theirs.monsters[move.target];
					if (slot && monsterOf(slot.card).detach) return `${w("נתקו", "Detach")} ${w("חומר", "material")} מ־${name(slot.card)} כדי לבטל את ההתקפה.`;
					return slot && target ? `השתמשו באפקט של ${name(slot.card)} ו${w("בחרו כמטרה", "target")} את ${name(target.card)}.` : "";
				}
				case "spring": {
					const slot = board.you.backrow[move.zone];
					return slot ? `הפכו את ה${w("מלכודת", "Trap")} ${name(slot.card)}.` : "";
				}
				case "extra":
					return `געו ב${EXTRA}: ${w("זמנו", "Summon")} את ${name(move.card)} עם ${list(move.materials.map((zone) => name(mine.monsters[zone]?.card ?? move.card)))}.`;
				case "pendulum":
					return `${w("זימון מטוטלת", "Pendulum Summon")}: זמנו את ${list(move.cards.map(name))} מהיד.`;
				case "hand":
					return `${w("השליכו", "Discard")} את ${name(move.card)} מהיד כדי להשתמש ב־${L("Quick Effect")} שלו.`;
				case "pass":
					return "תנו לזה לקרות.";
			}
		},
	};
}
export const he: PlayCopy = hebrewCopy("נוקס");
