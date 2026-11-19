import type { Locale } from "@/lib/i18n/locales";
import type { StoryId } from "./flow";
import type { CardKind, OptionId, QuizId, SortId } from "./mission1";

export interface StoryCopy {
	title: string;
	text: string;
	/** Description of the picture for screen readers. */
	art: string;
}
export interface CardCopy {
	name: string;
	text: string;
	/** One kind explanation for each possible answer, the right one included. */
	explain: Record<CardKind, string>;
}
export interface QuizCopy {
	question: string;
	options: Record<OptionId, { text: string; explain: string }>;
}
export interface Copy {
	pageTitle: string;
	kicker: string;
	introText: string;
	masteredNote: string;
	start: string;
	next: string;
	storyStep: (n: number, total: number) => string;
	sortStep: (n: number, total: number) => string;
	quizStep: (n: number, total: number) => string;
	sortPrompt: string;
	kinds: Record<CardKind, string>;
	level: string;
	atk: string;
	def: string;
	right: string;
	notYet: string;
	tryAgain: string;
	calm: string;
	calmHint: string;
	calmDevice: string;
	badgeTitle: string;
	badgeText: string;
	badgeArt: string;
	replay: string;
	back: string;
	story: Record<StoryId, StoryCopy>;
	cards: Record<SortId, CardCopy>;
	quiz: Record<QuizId, QuizCopy>;
}

const en: Copy = {
	pageTitle: "Mission 1: The Deck wakes up",
	kicker: "Junior mission",
	introText:
		"Meet the three kinds of cards in a Deck: Monsters, Spells and Traps. Read a short story, sort six cards, then answer three questions. Take your time: you lose nothing for a wrong answer, and you can try again as often as you like.",
	masteredNote: "You already earned the Deck Waker badge. You can play again any time.",
	start: "Start the mission",
	next: "Next",
	storyStep: (n, total) => `Story ${n} of ${total}`,
	sortStep: (n, total) => `Card ${n} of ${total}`,
	quizStep: (n, total) => `Question ${n} of ${total}`,
	sortPrompt: "Which kind of card is this?",
	kinds: { monster: "Monster", spell: "Spell", trap: "Trap" },
	level: "Level",
	atk: "ATK",
	def: "DEF",
	right: "Correct!",
	notYet: "Not this one yet.",
	tryAgain: "Pick another answer to try again.",
	calm: "Calm mode",
	calmHint: "Turns off all movement.",
	calmDevice: "Your device also asks for less motion, so movement stays off.",
	badgeTitle: "Deck Waker badge",
	badgeText: "You told Monsters, Spells and Traps apart and answered every question. The Deck is awake!",
	badgeArt: "A round gold badge with a star in the middle.",
	replay: "Play again",
	back: "Back to home",
	story: {
		cub: {
			title: "A cub wakes up",
			text: "Meet Pip, a small cub in armour. Pip is a Monster. Monsters are the cards that stand on the field and fight for you.",
			art: "Pip, a small round cub with a shield, drawn with simple shapes.",
		},
		stats: {
			title: "Two numbers on a shield",
			text: "Pip carries two numbers on its shield. ATK is how strong Pip is when it attacks. DEF is how tough Pip is when it defends.",
			art: "Pip holding a shield that shows the letters ATK and DEF.",
		},
		level: {
			title: "Stars show the Level",
			text: "Most Monsters you meet first show stars. The stars give the Level. Pip has three stars, so Pip is Level 3.",
			art: "A card with three gold stars above the cub.",
		},
		spark: {
			title: "A spark on your turn",
			text: "Zip is a quick green spark. Zip is a Spell. A Normal Spell is played on your own turn, does its job at once, and then goes away.",
			art: "Zip, a small green lightning spark with a smiling face.",
		},
		chameleon: {
			title: "A chameleon that waits",
			text: "Mimi is a patient chameleon. Mimi is a Trap. A Normal Trap is Set face-down first. It cannot be used the turn it is Set. Later it springs out when its moment comes, often on your opponent's turn.",
			art: "Mimi, a pink chameleon half hidden behind a face-down card.",
		},
		recap: {
			title: "Three kinds of cards",
			text: "A Deck holds Monsters, Spells and Traps. Monsters have a Level, ATK and DEF. This mission is about Normal Spells and Normal Traps; there are more kinds to meet later. Can you tell them apart?",
			art: "Pip, Zip and Mimi standing side by side.",
		},
	},
	cards: {
		"pocket-cub": {
			name: "Pocket Cub",
			text: "A tiny armoured cub. It fights for you from the field.",
			explain: {
				monster: "Yes! It has a Level, ATK and DEF. Those numbers belong to Monsters.",
				spell: "Not a Spell. A Spell has no Level, ATK or DEF. This card does, so it is a Monster.",
				trap: "Not a Trap. A Trap has no Level, ATK or DEF either. This card does, so it is a Monster.",
			},
		},
		"spark-dash": {
			name: "Spark Dash",
			text: "Play this card on your turn: one of your Monsters gains 500 ATK until the end of the turn. Then this card goes away.",
			explain: {
				monster: "Not a Monster. It has no Level, ATK or DEF. You play it, it does its job, and it goes away: that is a Spell.",
				spell: "Yes! A Normal Spell is played on your own turn, does its job at once, then goes away.",
				trap: "Not a Trap. A Normal Trap is Set face-down and waits. This card is played at once on your turn, so it is a Spell.",
			},
		},
		"fog-snare": {
			name: "Fog Snare",
			text: "Set this card face-down. Later, when your opponent attacks, flip it up: the attacking Monster loses 500 ATK until the end of the turn.",
			explain: {
				monster: "Not a Monster. It has no Level, ATK or DEF. It is Set face-down and waits: that is a Trap.",
				spell: "Not a Spell. A Normal Spell is played at once on your turn. This card is Set face-down and waits for an attack, so it is a Trap.",
				trap: "Yes! A Normal Trap is Set face-down first and springs out later, when its moment comes.",
			},
		},
		"moss-beetle": {
			name: "Moss Beetle",
			text: "A sleepy beetle with a thick mossy shell.",
			explain: {
				monster: "Yes! It has a Level, ATK and DEF. Its DEF is higher than its ATK, so it is better at defending.",
				spell: "Not a Spell. A Spell has no Level, ATK or DEF. This card does, so it is a Monster.",
				trap: "Not a Trap. A Trap has no Level, ATK or DEF. This card does, so it is a Monster.",
			},
		},
		"glow-charm": {
			name: "Glow Charm",
			text: "Play this card on your turn: you gain 500 Life Points. Then this card goes away.",
			explain: {
				monster: "Not a Monster. It has no Level, ATK or DEF. You play it, it does its job, and it goes away: that is a Spell.",
				spell: "Yes! A Normal Spell is played on your own turn, does its job at once, then goes away.",
				trap: "Not a Trap. A Normal Trap is Set face-down and waits. This card is played at once on your turn, so it is a Spell.",
			},
		},
		"sticky-vine": {
			name: "Sticky Vine",
			text: "Set this card face-down. Later, when your opponent attacks, flip it up: that attack is stopped.",
			explain: {
				monster: "Not a Monster. It has no Level, ATK or DEF. It is Set face-down and waits: that is a Trap.",
				spell: "Not a Spell. A Normal Spell is played at once on your turn. This card is Set face-down and waits for an attack, so it is a Trap.",
				trap: "Yes! A Normal Trap is Set face-down first and springs out later, when its moment comes.",
			},
		},
	},
	quiz: {
		"trap-first": {
			question: "You want to use a Normal Trap. What do you do first?",
			options: {
				a: { text: "Play it face-up right away, like a Normal Spell.", explain: "Not quite. A Normal Spell can be played at once, but a Normal Trap has to be Set face-down first." },
				b: { text: "Set it face-down and let it wait.", explain: "Yes! A Normal Trap is Set face-down first. It cannot be used the turn it is Set, so it waits for its moment." },
				c: { text: "Turn it into a Monster.", explain: "Not quite. A Trap stays a Trap and has no Level. A Normal Trap is Set face-down first and waits." },
			},
		},
		atk: {
			question: "A Monster shows Level 4, ATK 1500 and DEF 1000. What does ATK 1500 tell you?",
			options: {
				a: { text: "How strong it is when it attacks.", explain: "Yes! ATK is attack strength. A Monster with 1500 ATK attacks harder than one with 1000 ATK." },
				b: { text: "How many stars it has.", explain: "Not quite. The stars show the Level, which is 4 here. ATK is its attack strength." },
				c: { text: "How many cards you draw.", explain: "Not quite. Drawing cards has nothing to do with ATK. ATK is its attack strength." },
			},
		},
		"spell-now": {
			question: "Which sentence is true about a Normal Spell?",
			options: {
				a: { text: "You can only play it on your opponent's turn.", explain: "Not quite. You play a Normal Spell on your own turn, not on your opponent's turn." },
				b: { text: "It is Set face-down and must wait a turn.", explain: "Not quite. That is how a Normal Trap works. A Normal Spell does not have to wait: you can play it right away on your turn." },
				c: { text: "You play it on your turn, it does its job, then it goes away.", explain: "Yes! That is exactly how a Normal Spell works." },
			},
		},
	},
};

const fr: Copy = {
	pageTitle: "Mission 1 : Le Deck se réveille",
	kicker: "Mission Junior",
	introText:
		"Découvre les trois sortes de cartes d’un Deck : les Monstres, les Magies et les Pièges. Lis une courte histoire, classe six cartes, puis réponds à trois questions. Prends ton temps : une mauvaise réponse ne te fait rien perdre et tu peux réessayer autant de fois que tu veux.",
	masteredNote: "Tu as déjà gagné l’insigne Réveilleur de Deck. Tu peux rejouer quand tu veux.",
	start: "Commencer la mission",
	next: "Suivant",
	storyStep: (n, total) => `Histoire ${n} sur ${total}`,
	sortStep: (n, total) => `Carte ${n} sur ${total}`,
	quizStep: (n, total) => `Question ${n} sur ${total}`,
	sortPrompt: "De quelle sorte est cette carte ?",
	kinds: { monster: "Monstre", spell: "Magie", trap: "Piège" },
	level: "Niveau",
	atk: "ATK",
	def: "DEF",
	right: "Bravo !",
	notYet: "Pas encore.",
	tryAgain: "Choisis une autre réponse pour réessayer.",
	calm: "Mode calme",
	calmHint: "Coupe tous les mouvements.",
	calmDevice: "Ton appareil demande aussi moins de mouvement, alors les mouvements restent coupés.",
	badgeTitle: "Insigne Réveilleur de Deck",
	badgeText: "Tu as distingué les Monstres, les Magies et les Pièges et répondu à toutes les questions. Le Deck est réveillé !",
	badgeArt: "Un insigne rond doré avec une étoile au centre.",
	replay: "Rejouer",
	back: "Retour à l’accueil",
	story: {
		cub: {
			title: "Un ourson se réveille",
			text: "Voici Pip, un petit ourson en armure. Pip est un Monstre. Les Monstres sont les cartes qui se tiennent sur le terrain et se battent pour toi.",
			art: "Pip, un petit ourson rond avec un bouclier, dessiné avec des formes simples.",
		},
		stats: {
			title: "Deux nombres sur un bouclier",
			text: "Pip porte deux nombres sur son bouclier. L’ATK, c’est la force de Pip quand il attaque. La DEF, c’est sa solidité quand il défend.",
			art: "Pip tenant un bouclier qui affiche les lettres ATK et DEF.",
		},
		level: {
			title: "Les étoiles donnent le Niveau",
			text: "La plupart des Monstres que tu verras d’abord ont des étoiles. Les étoiles donnent le Niveau. Pip a trois étoiles : il est de Niveau 3.",
			art: "Une carte avec trois étoiles dorées au-dessus de l’ourson.",
		},
		spark: {
			title: "Une étincelle pendant ton tour",
			text: "Zip est une étincelle verte et rapide. Zip est une Magie. Une Magie Normale se joue pendant ton propre tour, fait son effet tout de suite, puis disparaît.",
			art: "Zip, une petite étincelle verte en forme d’éclair avec un visage souriant.",
		},
		chameleon: {
			title: "Un caméléon qui attend",
			text: "Mimi est un caméléon patient. Mimi est un Piège. Un Piège Normal se Pose d’abord face verso. Il ne peut pas être utilisé le tour où il est Posé. Plus tard, il se déclenche quand son moment arrive, souvent pendant le tour de ton adversaire.",
			art: "Mimi, un caméléon rose à moitié caché derrière une carte face verso.",
		},
		recap: {
			title: "Trois sortes de cartes",
			text: "Un Deck contient des Monstres, des Magies et des Pièges. Les Monstres ont un Niveau, une ATK et une DEF. Cette mission parle des Magies Normales et des Pièges Normaux ; il y a d’autres sortes à découvrir plus tard. Sauras-tu les distinguer ?",
			art: "Pip, Zip et Mimi côte à côte.",
		},
	},
	cards: {
		"pocket-cub": {
			name: "Ourson de Poche",
			text: "Un minuscule ourson en armure. Il se bat pour toi depuis le terrain.",
			explain: {
				monster: "Oui ! Elle a un Niveau, une ATK et une DEF. Ces nombres appartiennent aux Monstres.",
				spell: "Ce n’est pas une Magie. Une Magie n’a ni Niveau, ni ATK, ni DEF. Cette carte en a : c’est un Monstre.",
				trap: "Ce n’est pas un Piège. Un Piège n’a ni Niveau, ni ATK, ni DEF non plus. Cette carte en a : c’est un Monstre.",
			},
		},
		"spark-dash": {
			name: "Course d’Étincelle",
			text: "Joue cette carte pendant ton tour : un de tes Monstres gagne 500 ATK jusqu’à la fin du tour. Ensuite, cette carte disparaît.",
			explain: {
				monster: "Ce n’est pas un Monstre. Elle n’a ni Niveau, ni ATK, ni DEF. On la joue, elle fait son effet et elle disparaît : c’est une Magie.",
				spell: "Oui ! Une Magie Normale se joue pendant ton propre tour, fait son effet tout de suite, puis disparaît.",
				trap: "Ce n’est pas un Piège. Un Piège Normal se Pose face verso et attend. Cette carte se joue tout de suite pendant ton tour : c’est une Magie.",
			},
		},
		"fog-snare": {
			name: "Piège de Brume",
			text: "Pose cette carte face verso. Plus tard, quand ton adversaire attaque, retourne-la : le Monstre attaquant perd 500 ATK jusqu’à la fin du tour.",
			explain: {
				monster: "Ce n’est pas un Monstre. Elle n’a ni Niveau, ni ATK, ni DEF. Elle se Pose face verso et attend : c’est un Piège.",
				spell: "Ce n’est pas une Magie. Une Magie Normale se joue tout de suite pendant ton tour. Cette carte se Pose face verso et attend une attaque : c’est un Piège.",
				trap: "Oui ! Un Piège Normal se Pose d’abord face verso et se déclenche plus tard, quand son moment arrive.",
			},
		},
		"moss-beetle": {
			name: "Scarabée Moussu",
			text: "Un scarabée endormi à la carapace épaisse et couverte de mousse.",
			explain: {
				monster: "Oui ! Elle a un Niveau, une ATK et une DEF. Sa DEF est plus haute que son ATK : il défend mieux qu’il n’attaque.",
				spell: "Ce n’est pas une Magie. Une Magie n’a ni Niveau, ni ATK, ni DEF. Cette carte en a : c’est un Monstre.",
				trap: "Ce n’est pas un Piège. Un Piège n’a ni Niveau, ni ATK, ni DEF. Cette carte en a : c’est un Monstre.",
			},
		},
		"glow-charm": {
			name: "Charme Lumineux",
			text: "Joue cette carte pendant ton tour : tu gagnes 500 Points de Vie. Ensuite, cette carte disparaît.",
			explain: {
				monster: "Ce n’est pas un Monstre. Elle n’a ni Niveau, ni ATK, ni DEF. On la joue, elle fait son effet et elle disparaît : c’est une Magie.",
				spell: "Oui ! Une Magie Normale se joue pendant ton propre tour, fait son effet tout de suite, puis disparaît.",
				trap: "Ce n’est pas un Piège. Un Piège Normal se Pose face verso et attend. Cette carte se joue tout de suite pendant ton tour : c’est une Magie.",
			},
		},
		"sticky-vine": {
			name: "Liane Collante",
			text: "Pose cette carte face verso. Plus tard, quand ton adversaire attaque, retourne-la : cette attaque est arrêtée.",
			explain: {
				monster: "Ce n’est pas un Monstre. Elle n’a ni Niveau, ni ATK, ni DEF. Elle se Pose face verso et attend : c’est un Piège.",
				spell: "Ce n’est pas une Magie. Une Magie Normale se joue tout de suite pendant ton tour. Cette carte se Pose face verso et attend une attaque : c’est un Piège.",
				trap: "Oui ! Un Piège Normal se Pose d’abord face verso et se déclenche plus tard, quand son moment arrive.",
			},
		},
	},
	quiz: {
		"trap-first": {
			question: "Tu veux utiliser un Piège Normal. Que fais-tu d’abord ?",
			options: {
				a: { text: "Je le joue face recto tout de suite, comme une Magie Normale.", explain: "Pas tout à fait. Une Magie Normale peut se jouer tout de suite, mais un Piège Normal doit d’abord être Posé face verso." },
				b: { text: "Je le Pose face verso et je le laisse attendre.", explain: "Oui ! Un Piège Normal se Pose d’abord face verso. Il ne peut pas être utilisé le tour où il est Posé : il attend son moment." },
				c: { text: "Je le transforme en Monstre.", explain: "Pas tout à fait. Un Piège reste un Piège et n’a pas de Niveau. Un Piège Normal se Pose d’abord face verso et attend." },
			},
		},
		atk: {
			question: "Un Monstre affiche Niveau 4, ATK 1500 et DEF 1000. Que t’indique ATK 1500 ?",
			options: {
				a: { text: "Sa force quand il attaque.", explain: "Oui ! L’ATK est la force d’attaque. Un Monstre à 1500 ATK frappe plus fort qu’un Monstre à 1000 ATK." },
				b: { text: "Combien d’étoiles il a.", explain: "Pas tout à fait. Les étoiles donnent le Niveau, ici 4. L’ATK est sa force d’attaque." },
				c: { text: "Combien de cartes tu pioches.", explain: "Pas tout à fait. Piocher des cartes n’a rien à voir avec l’ATK. L’ATK est sa force d’attaque." },
			},
		},
		"spell-now": {
			question: "Quelle phrase est vraie à propos d’une Magie Normale ?",
			options: {
				a: { text: "On ne peut la jouer que pendant le tour de l’adversaire.", explain: "Pas tout à fait. Tu joues une Magie Normale pendant ton propre tour, pas pendant celui de ton adversaire." },
				b: { text: "Elle se Pose face verso et doit attendre un tour.", explain: "Pas tout à fait. C’est ainsi que fonctionne un Piège Normal. Une Magie Normale n’a pas à attendre : tu peux la jouer tout de suite pendant ton tour." },
				c: { text: "On la joue pendant son tour, elle fait son effet, puis elle disparaît.", explain: "Oui ! C’est exactement comme cela que fonctionne une Magie Normale." },
			},
		},
	},
};

const he: Copy = {
	pageTitle: "משימה 1: החפיסה מתעוררת",
	kicker: "משימת ג׳וניור",
	introText:
		"הכירו את שלושת סוגי הקלפים בחפיסה: מפלצות, לחשים ומלכודות. קראו סיפור קצר, מיינו שישה קלפים ואז ענו על שלוש שאלות. אין לחץ: תשובה שגויה לא מפסידה כלום, ואפשר לנסות שוב כמה פעמים שרוצים.",
	masteredNote: "כבר קיבלתם את תג מעורר החפיסה. אפשר לשחק שוב מתי שרוצים.",
	start: "מתחילים את המשימה",
	next: "הבא",
	storyStep: (n, total) => `סיפור ${n} מתוך ${total}`,
	sortStep: (n, total) => `קלף ${n} מתוך ${total}`,
	quizStep: (n, total) => `שאלה ${n} מתוך ${total}`,
	sortPrompt: "איזה סוג קלף זה?",
	kinds: { monster: "מפלצת", spell: "לחש", trap: "מלכודת" },
	level: "רמה",
	atk: "ATK",
	def: "DEF",
	right: "נכון!",
	notYet: "עוד לא.",
	tryAgain: "בחרו תשובה אחרת כדי לנסות שוב.",
	calm: "מצב רגוע",
	calmHint: "מכבה כל תנועה.",
	calmDevice: "המכשיר שלכם גם מבקש פחות תנועה, ולכן התנועה נשארת כבויה.",
	badgeTitle: "תג מעורר החפיסה",
	badgeText: "הבחנתם בין מפלצות, לחשים ומלכודות וענו על כל השאלות. החפיסה ערה!",
	badgeArt: "תג עגול וזהוב עם כוכב באמצע.",
	replay: "משחקים שוב",
	back: "חזרה לדף הבית",
	story: {
		cub: {
			title: "גור מתעורר",
			text: "הכירו את פיפ, גור קטן בשריון. פיפ הוא מפלצת. מפלצות הן הקלפים שעומדים בשדה ונלחמים בשבילכם.",
			art: "פיפ, גור קטן ועגול עם מגן, מצויר בצורות פשוטות.",
		},
		stats: {
			title: "שני מספרים על מגן",
			text: "על המגן של פיפ יש שני מספרים. ATK הוא כמה פיפ חזק כשהוא תוקף. DEF הוא כמה פיפ חסון כשהוא מגן.",
			art: "פיפ מחזיק מגן שעליו כתוב ATK ו-DEF.",
		},
		level: {
			title: "הכוכבים מראים את הרמה",
			text: "לרוב המפלצות שתפגשו בהתחלה יש כוכבים. הכוכבים הם הרמה. לפיפ יש שלושה כוכבים, אז פיפ ברמה 3.",
			art: "קלף עם שלושה כוכבים זהובים מעל הגור.",
		},
		spark: {
			title: "ניצוץ בתור שלכם",
			text: "זיפ הוא ניצוץ ירוק ומהיר. זיפ הוא לחש. לחש רגיל משחקים בתור שלכם, הוא עושה את שלו מיד, ואז נעלם.",
			art: "זיפ, ניצוץ ירוק קטן בצורת ברק עם פנים מחייכות.",
		},
		chameleon: {
			title: "זיקית שמחכה",
			text: "מימי היא זיקית סבלנית. מימי היא מלכודת. מלכודת רגילה מניחים קודם עם הפנים כלפי מטה. אי אפשר להשתמש בה בתור שבו הונחה. אחר כך היא קופצת החוצה כשמגיע הרגע שלה, לעיתים קרובות בתור של היריב.",
			art: "מימי, זיקית ורודה חבויה למחצה מאחורי קלף הפוך.",
		},
		recap: {
			title: "שלושה סוגי קלפים",
			text: "בחפיסה יש מפלצות, לחשים ומלכודות. למפלצות יש רמה, ATK ו-DEF. המשימה הזאת עוסקת בלחשים רגילים ובמלכודות רגילות; יש עוד סוגים שנכיר בהמשך. תצליחו להבדיל ביניהם?",
			art: "פיפ, זיפ ומימי עומדים זה לצד זה.",
		},
	},
	cards: {
		"pocket-cub": {
			name: "גור כיס",
			text: "גור זעיר בשריון. הוא נלחם בשבילכם מהשדה.",
			explain: {
				monster: "נכון! יש לו רמה, ATK ו-DEF. המספרים האלה שייכים למפלצות.",
				spell: "זה לא לחש. ללחש אין רמה, ATK או DEF. לקלף הזה יש, אז הוא מפלצת.",
				trap: "זו לא מלכודת. גם למלכודת אין רמה, ATK או DEF. לקלף הזה יש, אז הוא מפלצת.",
			},
		},
		"spark-dash": {
			name: "מרוץ ניצוץ",
			text: "שחקו את הקלף הזה בתור שלכם: אחת המפלצות שלכם מקבלת 500 ATK עד סוף התור. אחר כך הקלף נעלם.",
			explain: {
				monster: "זו לא מפלצת. אין לו רמה, ATK או DEF. משחקים אותו, הוא עושה את שלו ונעלם: זה לחש.",
				spell: "נכון! לחש רגיל משחקים בתור שלכם, הוא עושה את שלו מיד, ואז נעלם.",
				trap: "זו לא מלכודת. מלכודת רגילה מניחים עם הפנים כלפי מטה והיא מחכה. את הקלף הזה משחקים מיד בתור שלכם, אז הוא לחש.",
			},
		},
		"fog-snare": {
			name: "מלכודת ערפל",
			text: "הניחו את הקלף הזה עם הפנים כלפי מטה. אחר כך, כשהיריב תוקף, הפכו אותו: המפלצת התוקפת מאבדת 500 ATK עד סוף התור.",
			explain: {
				monster: "זו לא מפלצת. אין לו רמה, ATK או DEF. מניחים אותו עם הפנים כלפי מטה והוא מחכה: זו מלכודת.",
				spell: "זה לא לחש. לחש רגיל משחקים מיד בתור שלכם. את הקלף הזה מניחים עם הפנים כלפי מטה והוא מחכה להתקפה, אז הוא מלכודת.",
				trap: "נכון! מלכודת רגילה מניחים קודם עם הפנים כלפי מטה, והיא קופצת החוצה אחר כך, כשמגיע הרגע שלה.",
			},
		},
		"moss-beetle": {
			name: "חיפושית אזוב",
			text: "חיפושית רדומה עם שריון עבה מכוסה אזוב.",
			explain: {
				monster: "נכון! יש לו רמה, ATK ו-DEF. ה-DEF שלו גבוה מה-ATK, אז הוא טוב יותר בהגנה.",
				spell: "זה לא לחש. ללחש אין רמה, ATK או DEF. לקלף הזה יש, אז הוא מפלצת.",
				trap: "זו לא מלכודת. למלכודת אין רמה, ATK או DEF. לקלף הזה יש, אז הוא מפלצת.",
			},
		},
		"glow-charm": {
			name: "קמע זוהר",
			text: "שחקו את הקלף הזה בתור שלכם: אתם מקבלים 500 נקודות חיים. אחר כך הקלף נעלם.",
			explain: {
				monster: "זו לא מפלצת. אין לו רמה, ATK או DEF. משחקים אותו, הוא עושה את שלו ונעלם: זה לחש.",
				spell: "נכון! לחש רגיל משחקים בתור שלכם, הוא עושה את שלו מיד, ואז נעלם.",
				trap: "זו לא מלכודת. מלכודת רגילה מניחים עם הפנים כלפי מטה והיא מחכה. את הקלף הזה משחקים מיד בתור שלכם, אז הוא לחש.",
			},
		},
		"sticky-vine": {
			name: "גפן דביקה",
			text: "הניחו את הקלף הזה עם הפנים כלפי מטה. אחר כך, כשהיריב תוקף, הפכו אותו: ההתקפה נעצרת.",
			explain: {
				monster: "זו לא מפלצת. אין לו רמה, ATK או DEF. מניחים אותו עם הפנים כלפי מטה והוא מחכה: זו מלכודת.",
				spell: "זה לא לחש. לחש רגיל משחקים מיד בתור שלכם. את הקלף הזה מניחים עם הפנים כלפי מטה והוא מחכה להתקפה, אז הוא מלכודת.",
				trap: "נכון! מלכודת רגילה מניחים קודם עם הפנים כלפי מטה, והיא קופצת החוצה אחר כך, כשמגיע הרגע שלה.",
			},
		},
	},
	quiz: {
		"trap-first": {
			question: "אתם רוצים להשתמש במלכודת רגילה. מה עושים קודם?",
			options: {
				a: { text: "משחקים אותה עם הפנים כלפי מעלה מיד, כמו לחש רגיל.", explain: "לא בדיוק. לחש רגיל אפשר לשחק מיד, אבל מלכודת רגילה צריך קודם להניח עם הפנים כלפי מטה." },
				b: { text: "מניחים אותה עם הפנים כלפי מטה ונותנים לה לחכות.", explain: "נכון! מלכודת רגילה מניחים קודם עם הפנים כלפי מטה. אי אפשר להשתמש בה בתור שבו הונחה, אז היא מחכה לרגע שלה." },
				c: { text: "הופכים אותה למפלצת.", explain: "לא בדיוק. מלכודת נשארת מלכודת ואין לה רמה. מלכודת רגילה מניחים קודם עם הפנים כלפי מטה והיא מחכה." },
			},
		},
		atk: {
			question: "על מפלצת כתוב רמה 4, ATK 1500 ו-DEF 1000. מה אומר המספר ATK 1500?",
			options: {
				a: { text: "כמה היא חזקה כשהיא תוקפת.", explain: "נכון! ATK הוא עוצמת ההתקפה. מפלצת עם 1500 ATK תוקפת חזק יותר ממפלצת עם 1000 ATK." },
				b: { text: "כמה כוכבים יש לה.", explain: "לא בדיוק. הכוכבים מראים את הרמה, כאן 4. ATK הוא עוצמת ההתקפה שלה." },
				c: { text: "כמה קלפים שולפים.", explain: "לא בדיוק. שליפת קלפים לא קשורה ל-ATK. ATK הוא עוצמת ההתקפה שלה." },
			},
		},
		"spell-now": {
			question: "איזה משפט נכון לגבי לחש רגיל?",
			options: {
				a: { text: "אפשר לשחק אותו רק בתור של היריב.", explain: "לא בדיוק. לחש רגיל משחקים בתור שלכם, לא בתור של היריב." },
				b: { text: "מניחים אותו עם הפנים כלפי מטה והוא חייב לחכות תור.", explain: "לא בדיוק. כך עובדת מלכודת רגילה. לחש רגיל לא חייב לחכות: אפשר לשחק אותו מיד בתור שלכם." },
				c: { text: "משחקים אותו בתור שלכם, הוא עושה את שלו, ואז נעלם.", explain: "נכון! בדיוק כך עובד לחש רגיל." },
			},
		},
	},
};

export const COPY: Record<Locale, Copy> = { en, fr, he };
