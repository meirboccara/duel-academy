import { cardOf, monsterOf, type CardId } from "./cards";
import { atkOf } from "./engine";
import { printedWords } from "./card-words";
import { MASTERS, MASTER_NAMES, MASTER_TIER, masterLevelId, type Tier } from "./masters";
import type { PlayCopy } from "./copy";

/** The level of a trainer of the masters' island, after its name. */
const TIER_WORDS: Record<Tier, string> = { basic: "débutant", medium: "moyen", strong: "fort", expert: "expert" };

/*
 * French follows the site's Konami-based vocabulary (docs/academy-french-terminology.md): phase names stay in English.
 * Card text follows the style of French cards (vous, « ; » before the effect, « Effet Rapide », « une fois par tour »).
 * Real cards carry the name and the text of Konami's French card database, copied as printed (straight quotes included).
 * Written by the model: a native review is still needed.
 */
const written: Partial<PlayCopy["cards"]> = {
	"pocket-cub": { name: "Croc Argenté" },
	"moss-beetle": { name: "Elfe Mystique" },
	"river-otter": { name: "Golem Destructeur" },
	"lantern-owl": { name: "Éclaireur du Ciel" },
	"pebble-crab": { name: "Saggi le Clown des Ténèbres" },
	"storm-stag": { name: "Claíomh Solais, Allié de la Justice" },
	"mountain-bison": { name: "Cosmoreine" },
	"mud-toad": { name: "Jeune Amoureux" },
	"night-bat": { name: "Dame de la Foi" },
	"thorn-fox": { name: "Cadeau de Fée" },
	"bramble-ram": { name: "Vierge de la Lumière de Lune" },
	"iron-boar": { name: "Bœuf de Combat" },
	"stone-golem": { name: "Rat Préventif" },
	"shadow-wolf": { name: "Juge" },
	"glint-lynx": { name: "Lynx Scintillant", text: "(Effet Rapide) : Vous pouvez cibler 1 monstre face recto contrôlé par votre adversaire ; il perd 800 ATK jusqu’à la fin de ce tour. Vous ne pouvez utiliser cet effet de « Lynx Scintillant » qu’une fois par tour." },
	"cinder-hedgehog": { name: "Hérisson de Braise", text: "Vous pouvez cibler 1 monstre face recto contrôlé par votre adversaire ; il perd 800 ATK jusqu’à la fin de ce tour. Vous ne pouvez utiliser cet effet de « Hérisson de Braise » qu’une fois par tour." },
	"dozy-moth": { name: "Papillon Somnolent", text: "Lorsque cette carte est envoyée au Cimetière : Vous pouvez infliger 500 dommages à votre adversaire." },
	"busy-bee": { name: "Abeille Affairée", text: "Si cette carte est envoyée au Cimetière : Vous pouvez infliger 500 dommages à votre adversaire." },
	"glow-charm": { name: "Médicament Rouge", text: "Augmentez vos Life Points de 500 points." },
	"spark-dash": { name: "Charge Intrépide", text: "Ciblez 1 monstre face recto sur le Terrain ; jusqu'à la fin de ce tour, il gagne 700 ATK." },
	"thunder-clap": { name: "Offrande aux Damnés", text: "Ciblez 1 monstre face recto sur le Terrain ; détruisez la cible, et aussi, sautez votre prochaine Draw Phase." },
	"spark-trade": { name: "Hommage aux Damnés", text: "Défaussez 1 carte, puis ciblez 1 monstre sur le Terrain ; détruisez-le." },
	"fog-snare": { name: "Renforts", text: "Ciblez 1 monstre face recto sur le Terrain ; jusqu'à la fin de ce tour, il gagne 500 ATK." },
	"sticky-vine": { name: "Bouclier Drainant", text: "Si un monstre de l'adversaire déclare une attaque : ciblez le monstre attaquant ; annulez l'attaque, et si vous le faites, gagnez des LP égaux à l'ATK de la cible." },
	"quick-burrow": { name: "Dispositif d'Évacuation Obligatoire", text: "Ciblez 1 monstre sur le Terrain ; renvoyez la cible à la main." },
	/* Real cards: the name and the text are the ones in Konami's French card database. */
	"monster-reborn": { name: "Monster Reborn", text: "Ciblez 1 monstre dans l'un des Cimetières ; Invoquez-le Spécialement." },
	mountain: { name: "Montagne", text: "Tous les monstres Dragon, Bête Ailée et Tonnerre sur le Terrain gagnent 200 ATK/DEF." },
	"sakuretsu-armor": { name: "Armure de Sakuretsu", text: "Lorsqu'un monstre de l'adversaire déclare une attaque : ciblez le monstre attaquant ; détruisez la cible." },
	"dimensional-prison": { name: "Prison Dimensionnelle", text: "Lorsqu'un monstre de l'adversaire déclare une attaque : ciblez le monstre attaquant ; bannissez la cible." },
	"pot-of-desires": { name: "Pot des Désirs", text: "Bannissez face verso 10 cartes du dessus de votre Deck ; piochez 2 cartes. Vous ne pouvez activer qu'1 \"Pot des Désirs\" par tour." },
	"black-luster-ritual": { name: "Rituel du Lustre Noir", text: "Cette carte est utilisée pour Invoquer Rituellement \"Soldat du Lustre Noir\". Vous devez aussi Sacrifier des monstres depuis votre main ou Terrain dont le Niveau total est égal à min. 8." },
	"black-luster-soldier": { name: "Soldat du Lustre Noir", text: "Vous pouvez Invoquer Rituellement cette carte avec \"Rituel du Lustre Noir\"." },
	polymerization: { name: "Polymérisation", text: "Invoquez par Fusion 1 Monstre Fusion depuis votre Extra Deck, en utilisant des monstres depuis votre main ou Terrain." },
	"flame-manipulator": { name: "Manipulateur de Flammes" },
	masaki: { name: "Masaki le Spadassin Légendaire" },
	"flame-swordsman": { name: "Spadassin des Flammes", text: "\"Manipulateur de Flammes\" + \"Masaki le Spadassin Légendaire\"" },
	"tune-warrior": { name: "Guerrier Syntoniseur" },
	"giant-soldier-of-stone": { name: "Soldat Géant de Pierre" },
	"gaia-knight": { name: "Chevalier Gaia, Force de la Terre", text: "1 Syntoniseur + 1 monstre non-Syntoniseur ou plus" },
	"gem-knight-pearl": { name: "Perle, Chevalier-Gemmes", text: "2 monstres de Niveau 4" },
	utopia: { name: "Numéro 39 : Utopie", text: "2 monstres de Niveau 4\nLorsqu'un monstre déclare une attaque : vous pouvez détacher 1 Matériel de cette carte ; annulez l'attaque. Si cette carte est ciblée par une attaque, tant qu'elle n'a pas de Matériel : détruisez cette carte." },
	lanphorhynchus: { name: "LANphorhynchus", text: "2 monstres" },
	"flash-knight": { name: "Chevalier Flash" },
	dragong: { name: "Dragong" },
	mandragon: { name: "Mandragon" },
	"lightning-vortex": { name: "Vortex Foudroyant", text: "Défaussez 1 carte ; détruisez tous les monstres face recto contrôlés par votre adversaire." },
	fissure: { name: "Fissure", text: "Détruisez le monstre face recto contrôlé par votre adversaire avec la plus faible ATK (en cas d'égalité, vous choisissez)." },
	"upstart-goblin": { name: "Gobelin Parvenu", text: "Piochez 1 carte, puis votre adversaire gagne 1000 LP." },
	"cyber-dragon": { name: "Cyber Dragon", text: "Si uniquement votre adversaire contrôle un monstre, vous pouvez Invoquer Spécialement cette carte (depuis votre main)." },
	"dark-magician": { name: "Magicien Sombre" },
	"blue-eyes-white-dragon": { name: "Dragon Blanc aux Yeux Bleus" },
	"blue-eyes-ultimate-dragon": { name: "Dragon Ultime aux Yeux Bleus", text: '"Dragon Blanc aux Yeux Bleus" + "Dragon Blanc aux Yeux Bleus" + "Dragon Blanc aux Yeux Bleus"' },
	"exodia-the-forbidden-one": { name: "Éxodia l'Interdit", text: `Si vous avez "Jambe Droite de l'Interdit", "Jambe Gauche de l'Interdit", "Bras Droit de l'Interdit" et "Bras Gauche de l'Interdit" en plus de cette carte dans votre main, vous gagnez le Duel.` },
	"right-arm-of-the-forbidden-one": { name: "Bras Droit de l'Interdit" },
	"left-arm-of-the-forbidden-one": { name: "Bras Gauche de l'Interdit" },
	"right-leg-of-the-forbidden-one": { name: "Jambe Droite de l'Interdit" },
	"left-leg-of-the-forbidden-one": { name: "Jambe Gauche de l'Interdit" },
	"banner-of-courage": { name: "Bannière du Courage", text: "Durant votre Battle Phase uniquement, tous les monstres que vous contrôlez gagnent 200 ATK." },
	"legendary-sword": { name: "Épée Légendaire", text: "Équipable uniquement à un monstre Guerrier. Il gagne 300 ATK/DEF." },
	"call-of-the-haunted": { name: "Appel de l'Être Hanté", text: "Activez cette carte en ciblant 1 monstre dans votre Cimetière ; Invoquez Spécialement la cible en Position d'Attaque. Lorsque cette carte quitte le Terrain, détruisez le monstre. Lorsque le monstre est détruit, détruisez cette carte." },
	"negate-attack": { name: "Annulation d'Attaque", text: "Lorsqu'un monstre de l'adversaire déclare une attaque : ciblez le monstre attaquant ; annulez l'attaque, puis terminez la Battle Phase." },
	kuriboh: { name: "Kuriboh", text: "Durant le calcul des dommages, si un monstre de votre adversaire attaque (Effet Rapide) : vous pouvez défausser cette carte ; vous ne recevez aucun dommage de combat de ce combat." },
};
const cards = { ...printedWords("fr"), ...written } as PlayCopy["cards"];
const name = (card: CardId) => cards[card].name;
const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} et ${names.at(-1)}`);
const phases: PlayCopy["phases"] = { draw: "Draw Phase", standby: "Standby Phase", main1: "Main Phase 1", battle: "Battle Phase", main2: "Main Phase 2", end: "End Phase" };

/** The words of Junior play for a duel against this rival: Nox in the course, a trainer on the masters' island. */
export function frenchCopy(RIVAL: string): PlayCopy {
	return {
		pageTitle: "Junior : apprendre en jouant",
		intro: "De petits duels sur un petit terrain. Chacun apprend une règle. Touche une carte, touche une zone, et regarde ce qui se passe. Si ça rate, rien n’est perdu : tu peux toujours revenir en arrière.",
		rivalName: RIVAL,
		englishCards: false,
		worlds: {
			wake: { title: "Le Deck se réveille", blurb: "Trois sortes de cartes, et tes premiers combats." },
			shield: { title: "Bouclier ou épée", blurb: "Position de Défense, Points de Vie et attaques directes." },
			friend: { title: "Appelle un ami", blurb: "Invocations, Sacrifices et phases du tour." },
			magic: { title: "Magies et Pièges", blurb: "Une Magie maintenant, un Piège pour plus tard." },
			puzzles: { title: "Gagne ce tour", blurb: "Dix terrains. Tout ce que tu sais, sans aide." },
			tower: { title: "La tour de tortues", blurb: "Les Chaînes : la dernière carte jouée passe en premier." },
			rival: { title: "Le défi du rival", blurb: "Un duel entier contre Nox." },
			reading: { title: "Lis la carte", blurb: "Coût, cible, Effet Rapide et une fois par tour, avec les mots imprimés sur les vraies cartes." },
			mat: { title: "Tout le tapis", blurb: "Toutes les zones : le Cimetière, la Zone Terrain, les cartes bannies et l’Extra Deck." },
			icons: { title: "Les six icônes", blurb: "Jeu-Rapide, Contre-Piège, Continue, Équipement : une petite icône change tout." },
			ritual: { title: "Le Rituel", blurb: "Une Magie, un Monstre dans ta main, et des Sacrifices qui s’additionnent." },
			fusion: { title: "La Fusion", blurb: "Deux Monstres n’en font plus qu’un, venu de l’Extra Deck." },
			synchro: { title: "La Synchro", blurb: "Un Syntoniseur, et des Niveaux qui tombent juste." },
			xyz: { title: "Xyz", blurb: "Même Niveau, empilés. Les Matériels attendent sous le Monstre." },
			link: { title: "Lien", blurb: "Compte les Monstres. Pas de DEF, pas de Position de Défense." },
			pendulum: { title: "Pendule", blurb: "Deux Échelles, et plusieurs Monstres d’un coup." },
			words: { title: "Chaque mot compte", blurb: "De vraies cartes. Un seul mot décide qui gagne." },
			legends: { title: "Légendes", blurb: "Les cartes les plus célèbres des premiers duels : trois dragons en un, et l’Interdit." },
			steps: { title: "L’île des étapes", blurb: "Une attaque en deux étapes : la Battle Step, puis la Damage Step." },
			final: { title: "Le duel de l’Extra Deck", blurb: "Un duel entier sur tout le tapis. Nox a aussi un Extra Deck." },
			masters: { title: "Le tournoi des maîtres", blurb: "Tous les maîtres t’attendent, chacun avec son Deck. Bats-les tous !" },
		},
		levels: {
			"w1-field": { title: "Remplis le terrain", goal: "Touche une carte, puis une zone qui brille. Mets les trois cartes en jeu." },
			"w1-field-2": { title: "Trois de plus", goal: "Joue les trois cartes. Offrande aux Damnés a besoin d’une cible : le Monstre du rival." },
			"w1-clash": { title: "Choc !", goal: "Détruis Cadeau de Fée. Touche ton Monstre, puis celui du rival." },
			"w1-clash-2": { title: "Double choc", goal: "Détruis les deux Monstres du rival. Garde les deux tiens." },
			"w1-tie": { title: "Même force", goal: "Vierge de la Lumière de Lune a 1500 ATK. Détruis-la et garde tes deux Monstres." },
			"w2-crouch": { title: "Lève le bouclier", goal: "Bœuf de Combat va attaquer. Touche Elfe Mystique pour le tourner, puis termine ton tour." },
			"w2-stand": { title: "Sors l’épée", goal: "Éclaireur du Ciel est en Position de Défense. Détruis Cadeau de Fée." },
			"w2-wall": { title: "La grosse carapace", goal: "Deux attaques arrivent. Ne perds aucun Point de Vie." },
			"w2-lantern": { title: "Souffle la lanterne", goal: "Fais tomber les Points de Vie du rival à 0." },
			"w2-boss": { title: "Casse la carapace", goal: "Fais tomber les Points de Vie du rival à 0. Qui peut battre 1500 DEF ?" },
			"w3-gem": { title: "Appelle un ami", goal: "Invoque un Monstre, puis détruis Cadeau de Fée. Une seule Invocation Normale par tour !" },
			"w3-tribute": { title: "Un plus grand ami", goal: "Claíomh Solais, Allié de la Justice est de Niveau 6 : Sacrifie un Monstre pour l’Invoquer. Détruis Bœuf de Combat." },
			"w3-two": { title: "Le géant", goal: "Cosmoreine est de Niveau 8 : il lui faut deux Sacrifices. Détruis Juge." },
			"w3-keep": { title: "Qui s’en va ?", goal: "Fais tomber les Points de Vie du rival à 0. Sacrifie le bon Monstre." },
			"w3-magician": { title: "Le Magicien Sombre", goal: "Magicien Sombre est de Niveau 7 : il lui faut deux Sacrifices. Invoque-le et gagne." },
			"w3-blue-eyes": { title: "Le dragon blanc", goal: "Dragon Blanc aux Yeux Bleus demande deux Sacrifices. Choisis quels Monstres garder. Gagne ce tour." },
			"w3-chimes": { title: "Quatre carillons", goal: "Joue un tour entier : Draw, Main, Battle. Gagne le duel." },
			"w3-two-turns": { title: "Deux tours", goal: "Détruis Rat Préventif. Il faut deux tours." },
			"w4-spell": { title: "Une Magie, vite !", goal: "Gagne ce tour. Bœuf de Combat bloque le passage." },
			"w4-boost": { title: "Une petite étincelle", goal: "Gagne ce tour. Cadeau de Fée a 1400 ATK." },
			"w4-ambush": { title: "Embuscade", goal: "Pose ton Piège, termine ton tour, et protège Croc Argenté." },
			"w4-counter": { title: "Piège, puis attaque", goal: "Gagne le duel en deux tours." },
			p1: { title: "Énigme 1", goal: "Ici, ta carte du tour est déjà piochée : on commence en Main Phase 1. Gagne ce tour." },
			p2: { title: "Énigme 2", goal: "Gagne ce tour." },
			p3: { title: "Énigme 3", goal: "Gagne ce tour." },
			p4: { title: "Énigme 4", goal: "Gagne ce tour." },
			p5: { title: "Énigme 5", goal: "Gagne ce tour." },
			p6: { title: "Énigme 6", goal: "Passe le tour du rival. Ne perds aucun Point de Vie et garde Éclaireur du Ciel." },
			p7: { title: "Énigme 7", goal: "Gagne ce tour." },
			p8: { title: "Énigme 8", goal: "Gagne ce tour." },
			p9: { title: "Énigme 9", goal: "Après le tour du rival, aie 800 Points de Vie ou plus, et garde Elfe Mystique." },
			p10: { title: "Énigme 10", goal: "Gagne ce tour." },
			"w6-tower": { title: "La tour de tortues", goal: "Nox joue une Magie sur Croc Argenté. Réponds avec ton Piège : la dernière carte passe en premier." },
			"w6-double": { title: "Deux surprises", goal: "Pioche, passe la Standby Phase, puis Pose tes deux Pièges. Garde Golem Destructeur et tous tes Points de Vie." },
			"w6-main2": { title: "Après le combat", goal: "Tes trois Zones Monstre sont pleines. Libère une zone en combattant, puis Invoque Éclaireur du Ciel en Main Phase 2." },
			"w7-duel": { title: "Le défi du rival", goal: "Un duel entier. Fais tomber les Points de Vie de Nox de 4000 à 0 !" },
			"r-cost": { title: "Paie d’abord", goal: "Lis Hommage aux Damnés : défausser 1 carte, avant le « ; », est le coût. Gagne ce tour." },
			"r-paid": { title: "Payé, c’est payé", goal: "Nox a un Piège qui protège ses Monstres des Magies. Gagne quand même ce tour." },
			"r-target": { title: "Choisis la cible", goal: "Offrande aux Damnés dit « Ciblez » : tu choisis en l’activant. Gagne ce tour." },
			"r-quick": { title: "Effet Rapide", goal: "Bœuf de Combat attaque Golem Destructeur. Chez Nox, un effet de Monstre doit être Effet Rapide. Sauve-le." },
			"r-main": { title: "Seulement à mon tour", goal: "Hérisson de Braise n’a pas d’Effet Rapide : utilise-le pendant ta Main Phase. Gagne ce tour." },
			"r-once": { title: "Une fois par tour", goal: "Deux attaques arrivent, et Lynx Scintillant ne sert qu’une fois par tour. Protège Golem Destructeur." },
			"r-when": { title: "Lorsque ou Si ?", goal: "« Si… » a toujours sa chance, « Lorsque… » seulement s’il arrive en dernier au Cimetière. Laquelle défausser ?" },
			"r-last": { title: "Pile à l’heure", goal: "Papillon Somnolent dit « Lorsque… ». Laisse un combat l’envoyer au Cimetière, sans rien après. Gagne !" },
			"r-boss": { title: "Lis chaque mot", goal: "Gagne ce tour. Lis chaque carte avant de la jouer." },
			"m-reborn": { title: "Retour du Cimetière", goal: "Lis Monster Reborn. Touche ton Cimetière, choisis un Monstre, et gagne ce tour." },
			"m-either": { title: "L’un des Cimetières", goal: "Monster Reborn dit « l'un des Cimetières ». Regarde dans les deux Cimetières. Gagne ce tour." },
			"m-field": { title: "La Zone Terrain", goal: "Montagne est une Magie de Terrain : elle va dans la Zone Terrain et y reste. Gagne ce tour." },
			"m-both": { title: "Deux Montagnes", goal: "« sur le Terrain » : des deux côtés. Nox a une Montagne. Joue la tienne aussi, et gagne." },
			"m-banish": { title: "Bannie", goal: "Abeille Affairée attaque. Un Piège peut la détruire, un autre la bannir. Une carte bannie ne va pas au Cimetière." },
			"m-desires": { title: "Face verso", goal: "Lis Pot des Désirs. Son coût bannit 10 cartes face verso. Ensuite, gagne ce tour." },
			"m-mat": { title: "Où va cette carte ?", goal: "Mets chaque carte à sa place sur tout le tapis." },
			"ic-quick": { title: "Jeu-Rapide", goal: "Pose Charge Intrépide face verso. Au tour de Nox, active-la quand Bœuf de Combat attaque." },
			"ic-quick-2": { title: "Attends ton moment", goal: "Nox va Invoquer puis attaquer. Pose Offrande aux Damnés, et réponds à son attaque. Garde Croc Argenté." },
			"ic-counter": { title: "Contre-Piège", goal: "Deux attaques arrivent, et tu n’as qu’un Piège. Lis-le : il arrête toute la Battle Phase." },
			"ic-banner": { title: "Une Magie qui reste", goal: "Bannière du Courage est une Magie Continue : elle reste face recto. Gagne ce tour." },
			"ic-equip": { title: "Équipe-toi", goal: "Épée Légendaire est une Magie d’Équipement. Équipe-la au bon Monstre, et gagne ce tour." },
			"ic-haunted": { title: "Un Piège qui reste", goal: "Appel de l'Être Hanté est un Piège Continu. Retourne-le pendant ta Main Phase, et gagne ce tour." },
			"ri-first": { title: "Le premier Rituel", goal: "Joue Rituel du Lustre Noir. Sacrifie des Monstres dont les Niveaux font 8 ou plus. Gagne ce tour." },
			"ri-hand": { title: "Depuis la main", goal: "Les Sacrifices d’une Invocation Rituelle peuvent aussi venir de ta main. Gagne ce tour." },
			"ri-more": { title: "Au moins 8", goal: "La carte dit « min. 8 » : 8 ou plus. Quels Monstres Sacrifier ? Gagne ce tour." },
			"fu-first": { title: "Deux en un", goal: "Joue Polymérisation. Spadassin des Flammes nomme ses deux Monstres. Gagne ce tour." },
			"fu-hand": { title: "Main ou Terrain", goal: "Polymérisation dit « depuis votre main ou Terrain ». Gagne ce tour." },
			"fu-grave": { title: "Où sont-ils passés ?", goal: "Les Monstres utilisés pour une Invocation Fusion vont au Cimetière. L’un d’eux peut-il revenir ? Gagne ce tour." },
			"sy-first": { title: "Syntonise !", goal: "Touche ton Extra Deck. Un Syntoniseur plus un Monstre : Niveau 3 + Niveau 3 = 6. Gagne ce tour." },
			"sy-pick": { title: "Exactement 6", goal: "Pour une Invocation Synchro, les Niveaux doivent faire le total exact. Choisis les deux bons, et gagne." },
			"sy-tuner": { title: "Pas de Syntoniseur, pas de Synchro", goal: "Une Invocation Synchro demande exactement un Syntoniseur. Gagne ce tour." },
			"xy-first": { title: "Empile-les", goal: "Deux Monstres de Niveau 4 vont sous Perle, Chevalier-Gemmes. Touche ton Extra Deck, et gagne ce tour." },
			"xy-level": { title: "Même Niveau", goal: "Une Invocation Xyz demande des Monstres de même Niveau. Gagne ce tour." },
			"xy-detach": { title: "Détacher", goal: "Deux attaques arrivent. Utopie peut détacher un Matériel, comme coût, pour annuler une attaque. Garde Croc Argenté." },
			"xy-empty": { title: "Le dernier Matériel", goal: "Lis tout le texte d’Utopie. Sans Matériel, une attaque le détruira. Garde Utopie." },
			"li-first": { title: "Fais le Lien", goal: "LANphorhynchus est Lien 2 : une Invocation Lien avec 2 Monstres. Il va en Zone Monstre Extra. Gagne !" },
			"li-keep": { title: "Qui reste ?", goal: "Invoque par Lien avec deux Monstres, et garde le bon. Gagne ce tour." },
			"li-nodef": { title: "Sans bouclier", goal: "Juge va attaquer. Un Monstre Lien n’a ni DEF ni Position de Défense. Garde LANphorhynchus autrement." },
			"pe-first": { title: "Deux Échelles", goal: "Place tes deux Échelles Pendule. Puis Invoque par Pendulation les Monstres dont le Niveau est entre les deux. Gagne !" },
			"pe-between": { title: "Entre les Échelles", goal: "Avec les Échelles 2 et 7, seuls les Niveaux 3 à 6 viennent par Invocation Pendule. Gagne ce tour." },
			"pe-extra": { title: "Pas au Cimetière", goal: "Regarde où va Chevalier Flash quand il est détruit. Puis gagne à ton tour." },
			"rd-vortex": { title: "Paie, puis ramène", goal: "Lis les deux cartes. Un coût peut t’aider. Gagne ce tour." },
			"rd-fissure": { title: "Sans cible", goal: "Fissure ne dit pas « Ciblez » : la carte choisit. Détruis les deux Monstres, garde Golem Destructeur." },
			"rd-then": { title: "Puis", goal: "Gobelin Parvenu : tu pioches, « puis » Nox gagne 1000 LP. Ça vaut le coup ? Gagne ce tour." },
			"rd-colon": { title: "Uniquement ton adversaire", goal: "Lis Cyber Dragon avant d’Invoquer quoi que ce soit. Gagne ce tour." },
			"rd-kuriboh": { title: "Une surprise dans la main", goal: "Deux attaques arrivent. Kuriboh a un Effet Rapide dans ta main. Ne perds aucun Point de Vie." },
			"lg-ultimate": { title: "Trois en un", goal: "Trois Dragons Blancs aux Yeux Bleus dans ta main. Lis le Monstre de Fusion de ton Extra Deck. Gagne." },
			"lg-exodia": { title: "L’Interdit", goal: "Quatre pièces dans ta main. Pioche la cinquième et gagne, quels que soient les Points de Vie." },
			"lg-exodia-2": { title: "À une carte près", goal: "Une pièce est encore dans ton Deck. Quelle carte peut la piocher ? Gagne ce tour." },
			"st-battle": { title: "La Battle Step", goal: "Bœuf de Combat attaque Croc Argenté. Garde Croc Argenté : quelle carte agit au bon moment ?" },
			"st-damage": { title: "La Damage Step", goal: "Deux attaques arrivent. Laisse passer la Battle Step, puis agis dans la Damage Step. Garde tes 1000 Points de Vie." },
			"st-set": { title: "Face verso", goal: "Juge va attaquer ton Monstre trop faible. Pose-le face verso : tu ne perdras aucun Point de Vie." },
			"st-flip": { title: "Invocation Flip", goal: "Ton Monstre Posé a attendu un tour. Retourne-le en Position d’Attaque, puis gagne." },
			"x-duel": { title: "Le duel de l’Extra Deck", goal: "Un duel entier sur tout le tapis. Utilise ton Extra Deck. Fais tomber Nox à 0 Point de Vie !" },
			...Object.fromEntries(MASTERS.map((master) => [masterLevelId(master), { title: `Duel : ${MASTER_NAMES[master]} · ${TIER_WORDS[MASTER_TIER[master]]}`, goal: `Un duel entier contre ${MASTER_NAMES[master]} : 40 cartes mélangées, 8000 Points de Vie. Fais-les tomber à 0 !` }])),
		},
		cards,
		kinds: { monster: "Monstre", spell: "Magie", trap: "Piège" },
		types: { aqua: "Aqua", beast: "Bête", "beast-warrior": "Bête-Guerrier", cyberse: "Cyberse", dinosaur: "Dinosaure", "divine-beast": "Bête Divine", dragon: "Dragon", fairy: "Elfe", fiend: "Démon", fish: "Poisson", insect: "Insecte", machine: "Machine", plant: "Plante", psychic: "Psychique", pyro: "Pyro", reptile: "Reptile", rock: "Rocher", "sea-serpent": "Serpent de Mer", spellcaster: "Magicien", thunder: "Tonnerre", warrior: "Guerrier", "winged-beast": "Bête Ailée", wyrm: "Wyrm", zombie: "Zombie" },
		frames: { ritual: "Rituel", fusion: "Fusion", synchro: "Synchro", xyz: "Xyz", link: "Lien" },
		spellTypes: { normal: "Magie Normale", "quick-play": "Magie Jeu-Rapide", continuous: "Magie Continue", equip: "Magie d’Équipement", field: "Magie de Terrain", ritual: "Magie Rituelle" },
		trapTypes: { normal: "Piège Normal", continuous: "Piège Continu", counter: "Contre-Piège" },
		tuner: "Syntoniseur",
		rank: "Rang",
		linkRating: "Lien",
		scale: "Échelle Pendule",
		materials: (count) => `${count} ${count === 1 ? "Matériel" : "Matériels"} dessous`,
		rules: {
			zones: "Sortes de cartes et zones",
			battle: "Combat : ATK contre ATK",
			defense: "Position de Défense",
			direct: "Points de Vie et attaques directes",
			summon: "Invocation Normale",
			tribute: "Sacrifices",
			phases: "Phases du tour",
			spell: "Magies",
			trap: "Pièges",
			chain: "Chaînes",
			cost: "Le coût : ce qui est avant le « ; »",
			target: "Cibler",
			quick: "Effet Rapide",
			once: "Une fois par tour",
			timing: "« Lorsque… vous pouvez » ou « Si… vous pouvez »",
			graveyard: "Le Cimetière",
			field: "La Zone Terrain",
			banish: "Les cartes bannies",
			quickplay: "Magie Jeu-Rapide : Posée, puis activée au tour adverse",
			counter: "Contre-Piège : il répond, et arrête tout",
			continuous: "Continue : la carte reste face recto",
			equip: "Magie d’Équipement : liée à un Monstre",
			ritual: "Invocation Rituelle",
			fusion: "Invocation Fusion",
			synchro: "Invocation Synchro",
			xyz: "Invocation Xyz",
			detach: "Détacher : un Matériel comme coût",
			link: "Invocation Lien",
			pendulum: "Invocation Pendule",
			notarget: "Sans « Ciblez » : la carte choisit",
			then: "« Puis » : une chose, puis l’autre",
			condition: "Une condition sans deux-points",
			exodia: "L’Interdit : cinq pièces en main gagnent",
			steps: "Battle Step, puis Damage Step",
			set: "Poser un Monstre face verso, puis l’Invocation Flip",
		},
		mastery: { new: "pas encore vue", met: "vue", mastered: "réutilisée sans aide" },
		phases,
		steps: { battle: "Battle Step", damage: "Damage Step" },
		stepHelp: {
			battle: "Battle Step : on choisit qui attaque, et qui est attaqué. C’est le moment des Pièges « lorsqu’un monstre déclare une attaque ».",
			damage: "Damage Step : les deux Monstres se rencontrent. Seules les cartes qui changent l’ATK, ou qui le disent comme Kuriboh, servent encore. Le perdant va au Cimetière tout à la fin.",
		},
		phaseHelp: {
			draw: "Draw Phase : tu pioches 1 carte. Plus de carte à piocher ? Tu perds le duel.",
			standby: "Standby Phase : une petite pause. Certaines cartes agissent ici. Souvent, rien ne se passe : on continue.",
			main1: "Main Phase 1 : tu construis. Une Invocation Normale, des Magies, des Pièges à Poser, dans l’ordre que tu veux.",
			battle: "Battle Phase : chacun de tes Monstres en Position d’Attaque peut attaquer une fois.",
			main2: "Main Phase 2 : après le combat, encore une Main Phase pour préparer le tour de ton adversaire.",
			end: "End Phase : les effets « jusqu’à la fin du tour » s’arrêtent. Puis c’est à l’adversaire.",
		},
		level: "Niveau",
		atk: "ATK",
		def: "DEF",
		lifePoints: (side, lp) => (side === "you" ? `Tes Points de Vie : ${lp}` : `Points de Vie de ${RIVAL} : ${lp}`),
		handCount: (side, count) => `${side === "you" ? "Ta main" : `Main de ${RIVAL}`} : ${count} ${count === 1 ? "carte" : "cartes"}`,
		monsterZone: (side, number) => (side === "you" ? `Ta Zone Monstre ${number}` : `Zone Monstre ${number} de ${RIVAL}`),
		backZone: (side, number) => (side === "you" ? `Ta Zone Magie & Piège ${number}` : `Zone Magie & Piège ${number} de ${RIVAL}`),
		mainZone: (side, number) => (side === "you" ? `Ta Zone Monstre Main ${number}` : `Zone Monstre Main ${number} de ${RIVAL}`),
		extraMonsterZone: (side) => (side === "you" ? "Ta Zone Monstre Extra" : `Zone Monstre Extra de ${RIVAL}`),
		fieldZone: (side) => (side === "you" ? "Ta Zone Terrain" : `Zone Terrain de ${RIVAL}`),
		pendulumZone: (side, number) => (side === "you" ? `Ta Zone Pendule ${number}` : `Zone Pendule ${number} de ${RIVAL}`),
		extraDeck: (side, count) => (side === "you" ? `Ton Extra Deck : ${count}` : `Extra Deck de ${RIVAL} : ${count}`),
		banished: (side, count) => (side === "you" ? `Tes cartes bannies : ${count}` : `Cartes bannies de ${RIVAL} : ${count}`),
		faceDownCards: (count) => `${count} ${count === 1 ? "carte" : "cartes"} face verso`,
		faceUp: "face recto",
		pileEmpty: "Aucune carte ici.",
		closePile: "Fermer",
		empty: "vide",
		faceDown: "face verso",
		inDefense: "Position de Défense",
		hasEffect: "a un effet",
		quickMark: "Effet Rapide",
		hand: "Ta main",
		deck: (count) => `Ton Deck : ${count} ${count === 1 ? "carte" : "cartes"}`,
		graveyard: (side, count) => (side === "you" ? `Ton Cimetière : ${count}` : `Cimetière de ${RIVAL} : ${count}`),
		board: "Le terrain de duel",
		phaseBar: "Phases du tour",
		play: "Jouer",
		replay: "Rejouer",
		continueWith: (title) => `Jouer : ${title}`,
		locked: "Réussis le niveau d’avant pour ouvrir celui-ci",
		solvedMark: "réussi",
		starMark: "réussi sans indice",
		allDone: "Tu as fini tous les niveaux. Tu peux rejouer celui que tu veux.",
		levelOf: (number, total) => `Niveau ${number} sur ${total}`,
		draw: "Piocher",
		endTurn: "Terminer le tour",
		rivalNext: `Tour de ${RIVAL} : suite`,
		pass: "Laisser faire",
		attackDirectly: "Attaquer directement",
		turnCard: (card) => `Tourner ${card}`,
		useEffect: "Utiliser son effet",
		cancel: "Reposer la carte",
		undo: "Revenir d’un coup",
		restart: "Recommencer",
		hint: "Indice",
		noHint: "D’ici, on ne peut plus atteindre le but. Reviens d’un coup, ou recommence.",
		showMe: "Montre-moi",
		watchFirst: "Regarde d’abord",
		demoStep: (number, total) => `Étape ${number} sur ${total}`,
		demoNext: "Suite",
		demoAgain: "Encore",
		demoDone: "À moi !",
		backToMap: "Retour à la carte",
		backHome: "Retour à l’accueil",
		nextLevel: "Niveau suivant",
		quizLink: "En plus : le quiz de la Mission 1",
		calm: "Mode calme",
		calmHint: "Coupe tous les mouvements.",
		calmDevice: "Ton appareil demande aussi moins de mouvement, alors les mouvements restent coupés.",
		sound: "Voix et sons",
		soundHint: "Lit chaque phrase à voix haute et joue de petits sons. Éteint tant que tu ne l’allumes pas.",
		onTheCard: "Sur la carte :",
		meaning: "Ça veut dire :",
		yourTurn: "À toi de jouer.",
		rivalTurn: `Tour de ${RIVAL}. Touche Suite pour voir chaque étape.`,
		answerNow: "Stop ! Touche ton Piège Posé, ou une carte dont tu peux utiliser l’effet maintenant, ou laisse faire.",
		selected: (card) => `${card} est choisie.`,
		chooseZone: "Touche une zone qui brille.",
		chooseTarget: "Touche maintenant le Monstre pour cette carte.",
		chooseTributes: (left) => (left === 1 ? "Touche un de tes Monstres pour le Sacrifier." : `Touche ${left} de tes Monstres pour les Sacrifier.`),
		chooseAttackTarget: "Touche ce qu’il doit attaquer.",
		chooseDiscard: "Paie le coût : touche une autre carte de ta main pour la défausser.",
		chooseGrave: "Touche un Cimetière, puis touche le Monstre à cibler.",
		chooseFromDeck: "Choisis la carte à prendre dans ton Deck.",
		chooseRitual: (sum, need) => `Touche les Monstres à Sacrifier, dans ta main ou sur le terrain. Niveaux : ${sum} sur ${need}.`,
		chooseFusion: "Touche les Monstres que nomme le Monstre Fusion, dans ta main ou sur le terrain.",
		chooseExtra: "Touche un Monstre de ton Extra Deck.",
		chooseSynchro: (sum, level) => `Touche un Syntoniseur et les autres Monstres. Niveaux : ${sum} sur ${level}.`,
		chooseXyz: (count, level) => `Touche ${count} Monstres de Niveau ${level}.`,
		chooseLink: (count) => `Touche ${count} Monstres.`,
		choosePendulum: (low, high) => `Échelles ${low} et ${high} : touche les Monstres de ta main dont le Niveau est entre les deux.`,
		confirmSummon: "Invoquer !",
		specialSummon: "L’Invoquer Spécialement",
		setFaceDown: "La Poser face verso",
		setMonster: "Le Poser face verso (Défense)",
		pendulumSummon: "Invocation Pendule",
		detach: "Détacher un Matériel",
		useFromHand: "Utiliser son effet depuis la main",
		solved: "Bravo, c’est réussi !",
		solvedFirstTry: "Du premier coup, sans aide. Cette règle est à toi !",
		solvedWithHint: "Réussi avec un indice. Rejoue-le pour gagner l’étoile.",
		notYet: "Pas cette fois.",
		fails: {
			lost: "Tes Points de Vie sont tombés à 0.",
			"monster-lost": "Tu as perdu un Monstre dont tu avais besoin.",
			"lp-lost": "Tu as perdu trop de Points de Vie.",
			"out-of-moves": "Il n’y a plus rien à faire, et le but n’est pas atteint.",
			"out-of-turns": "Le tour est fini, et le but n’est pas atteint.",
		},
		reasons: {
			"duel-over": "Le duel est fini.",
			"answer-first": "Choisis d’abord : réponds, ou laisse faire.",
			"not-in-hand": "Cette carte n’est pas dans ta main.",
			"wrong-zone": "Mauvaise rangée ! Les Monstres vont dans les Zones Monstre. Les Magies et les Pièges vont dans la rangée derrière.",
			"zone-taken": "Cette zone est prise. Choisis-en une vide.",
			"summon-used": "Une seule Invocation Normale par tour, et tu l’as déjà faite.",
			"wrong-tributes": "Ce Monstre demande des Sacrifices : un pour le Niveau 5 ou 6, deux pour le Niveau 7 ou plus.",
			"not-main-phase": "Ça, c’est pendant ta Main Phase : Invoquer, jouer une Magie, Poser un Piège, tourner un Monstre, et les effets sans Effet Rapide.",
			"no-target": "Cette carte a besoin d’un Monstre à cibler.",
			"draw-first": "Pioche d’abord ta carte.",
			"already-drew": "Tu pioches une seule carte, pendant la Draw Phase.",
			"first-turn-no-draw": "Le joueur qui commence ne pioche pas au premier tour.",
			"cannot-go-back": "Les phases ne font qu’avancer.",
			"first-turn-no-battle": "Personne n’attaque au tout premier tour d’un duel.",
			"not-battle-phase": "Les attaques se font pendant la Battle Phase.",
			"no-monster": "Il n’y a pas de Monstre ici.",
			"defense-cannot-attack": "Un Monstre en Position de Défense ne peut pas attaquer. Tourne-le d’abord.",
			"already-attacked": "Ce Monstre a déjà attaqué ce tour.",
			"monster-in-the-way": "Un Monstre bloque le passage. Pour attaquer directement, il faut un terrain vide.",
			"trap-just-set": "Pas encore ! Un Piège ne peut pas être activé le tour où il est Posé.",
			"nothing-to-answer": "Ton Piège attend que le rival fasse quelque chose.",
			"cannot-answer-that": "Ce Piège ne répond pas à ça.",
			"just-summoned": "Un Monstre ne peut pas changer de position le tour où il est Invoqué.",
			"position-used": "Ce Monstre a déjà changé de position ce tour.",
			"cost-needed": "Paie d’abord le coût : défausse 1 autre carte de ta main. Pas de carte à défausser, pas d’activation.",
			"nothing-to-hit": "Cette carte n’a rien à détruire, alors elle ne peut pas être activée.",
			"no-ability": "Ce Monstre n’a pas d’effet à utiliser.",
			"not-quick": "Cet effet de Monstre n’est pas un Effet Rapide : il ne marche que pendant ta Main Phase.",
			"once-per-turn": "Cet effet ne sert qu’une fois par tour, et tu l’as déjà utilisé.",
			"extra-zone": "C’est la Zone Monstre Extra. Seul un Monstre de l’Extra Deck y va. Un Monstre Lien va là, ou dans une zone qu’un autre Monstre Lien pointe.",
			"field-zone": "Une Magie de Terrain va dans la Zone Terrain, et rien d’autre n’y va.",
			"no-free-zone": "Il n’y a pas de Zone Monstre Main vide pour le Monstre.",
			"one-per-turn": "La carte le dit : tu ne peux activer qu’1 carte de ce nom par tour.",
			"deck-too-small": "Ton Deck n’a pas assez de cartes pour ce que dit cette carte, alors elle ne peut pas être activée.",
			"no-ritual-monster": "Le Monstre que nomme cette Magie Rituelle doit être dans ta main.",
			"wrong-materials": "Ce ne sont pas les bons Monstres. Relis la première ligne de la carte.",
			"levels-too-low": "Les Niveaux des Monstres que tu Sacrifies n’atteignent pas le nombre écrit sur la Magie Rituelle.",
			"too-many-tributes": "Un Sacrifice de trop. Sacrifie seulement ce que demande la Magie Rituelle.",
			"not-in-extra": "Ce Monstre n’est pas dans ton Extra Deck.",
			"needs-spell": "Une Invocation Fusion demande une carte comme Polymérisation. Les Monstres ne fusionnent pas tout seuls.",
			"needs-one-tuner": "Une Invocation Synchro demande exactement 1 Syntoniseur, plus 1 Monstre non-Syntoniseur ou plus.",
			"levels-not-equal": "Pour une Invocation Synchro, les Niveaux additionnés doivent faire exactement le Niveau du Monstre.",
			"wrong-levels": "Lis la première ligne : une Invocation Xyz demande ce nombre de Monstres, tous de ce Niveau.",
			"link-count": "Une Invocation Lien demande autant de Monstres que la Classification Lien.",
			"link-no-defense": "Un Monstre Lien n’a pas de DEF. Il ne peut jamais être en Position de Défense.",
			"no-material": "Il ne reste aucun Matériel à détacher, alors le coût ne peut pas être payé.",
			"pendulum-zone": "Un Monstre Pendule devient une Échelle dans la Zone Magie & Piège tout à gauche ou tout à droite : les Zones Pendule.",
			"no-scales": "Une Invocation Pendule demande une Échelle dans chacune de tes deux Zones Pendule.",
			"pendulum-used": "Une seule Invocation Pendule par tour.",
			"level-not-between": "Son Niveau n’est pas entre tes deux Échelles. Les nombres des Échelles eux-mêmes ne comptent pas.",
			"special-only": "Ce Monstre ne peut pas être Invoqué Normalement. Lis sa carte : il a sa propre Invocation.",
			"not-properly-summoned": "Ce Monstre n’a jamais été Invoqué à sa façon, alors il ne peut pas revenir du Cimetière.",
			"condition-not-met": "Relis la carte : ce qu’elle demande n’est pas vrai en ce moment.",
			"equip-only": "Lis la carte : cette Magie d’Équipement ne s’équipe qu’à un Monstre d’un certain Type.",
			"cannot-set": "Ici, seule une Magie Jeu-Rapide se Pose face verso. Les autres Magies s’activent tout de suite.",
			"not-damage-step": "Pas encore : la carte dit « Durant le calcul des dommages ». Attends la Damage Step.",
			"damage-step-closed": "C’est la Damage Step : seules les cartes qui changent l’ATK, ou qui le disent, peuvent encore servir.",
			"swords-lock": "Les Épées de Lumière Révélatrice sont face recto : tes Monstres ne peuvent pas déclarer d’attaque.",
			"jinzo-lock": "Jinzo est sur le Terrain : aucune Carte Piège ne peut être activée.",
			"one-at-a-time": "Dragon Esprit aux Yeux Bleus est sur le Terrain : personne ne peut Invoquer Spécialement 2 monstres ou plus à la fois.",
			"summon-locked": "Ce tour, une carte t’empêche d’Invoquer d’autres monstres. Tu peux encore en Poser un face verso.",
			"cannot-attack-that": "Valkyria du Magicien est là : les autres Magiciens face recto ne peuvent pas être attaqués.",
		},
		rulesTitle: "Les règles que tu as vues",
		albumTitle: "Ton album de cartes",
		albumEmpty: "Les cartes avec lesquelles tu joues apparaîtront ici.",
		certificateTitle: "Duelliste Junior",
		certificateText: "Tu as gagné un duel entier : des Invocations, des combats, une Magie et un Piège. Tu sais comment marche un duel !",
		certificateFinalText: "Tu as gagné un duel sur tout le tapis, avec ton Extra Deck. Tu sais lire une carte et jouer ce qu’elle dit !",
		print: "Imprimer mon diplôme",
		narrate(event) {
			const mine = "side" in event && event.side === "you";
			switch (event.type) {
				case "special": {
					const used = list(event.materials.map(name));
					const one = event.materials.length === 1;
					const summons = (how: string) => `${mine ? "Tu Invoques" : `${RIVAL} Invoque`} ${how} ${name(event.card)}`;
					switch (event.how) {
						case "revive":
							return `${summons("Spécialement")} depuis ${event.from === "you" ? "ton Cimetière" : `le Cimetière de ${RIVAL}`}.`;
						case "ritual":
							return `${mine ? "Tu Sacrifies" : `${RIVAL} Sacrifie`} ${used} et ${mine ? "Invoques" : "Invoque"} Rituellement ${name(event.card)} depuis la main.`;
						case "fusion":
							return `${used} ${one ? "va" : "vont"} au Cimetière. ${summons("par Fusion")} depuis l’Extra Deck.`;
						case "synchro":
							return `${used} ${one ? "va" : "vont"} au Cimetière : Niveau ${event.materials.map((card) => monsterOf(card).level).join(" + ")} = ${monsterOf(event.card).level}. ${summons("par Synchronisation")}.`;
						case "xyz":
							return `${used} ${one ? "passe" : "passent"} sous ${name(event.card)} comme ${one ? "Matériel" : "Matériels"}, pas au Cimetière. ${summons("par Xyz")}.`;
						case "link":
							return `${used} ${one ? "va" : "vont"} au Cimetière. ${summons("par Lien")} en Zone Monstre Extra.`;
						case "own":
							return `${summons("Spécialement")} depuis la main, comme le dit sa carte. L’Invocation Normale reste libre.`;
					}
				}
				case "field":
					return `${name(event.card)} reste face recto dans la Zone Terrain. Cette carte compte pour les Monstres des deux joueurs.`;
				case "banished":
					if (event.faceDown) return `${mine ? "Tu bannis" : `${RIVAL} bannit`} ${event.cards.length} cartes face verso. Elles ne sont pas au Cimetière.`;
					return event.cards.length === 1 ? `${list(event.cards.map(name))} est une carte bannie : elle ne va pas au Cimetière.` : `${list(event.cards.map(name))} sont des cartes bannies : elles ne vont pas au Cimetière.`;
				case "to-extra":
					return `${name(event.card)} est un Monstre Pendule : il va face recto dans l’Extra Deck, pas au Cimetière.`;
				case "detached":
					return `${mine ? "Tu détaches" : `${RIVAL} détache`} ${name(event.material)} de ${name(event.card)} pour payer le coût. Ce Matériel va au Cimetière.`;
				case "scale":
					return `${name(event.card)} va dans une Zone Pendule, comme une Magie : Échelle Pendule ${event.scale}.`;
				case "pendulum":
					return `Invocation Pendule ! Échelles ${event.low} et ${event.high} : ${list(event.cards.map(name))} ${event.cards.length === 1 ? "vient" : "viennent"} de la main.`;
				case "hand-effect": {
					const effect = monsterOf(event.card).hand;
					const discards = mine ? "Tu défausses" : `${RIVAL} défausse`;
					if (effect === "ash") return `${discards} ${name(event.card)} depuis la main : son Effet Rapide annule une carte qui prend dans le Deck.`;
					if (effect === "veiler") return `${mine ? "Tu envoies" : `${RIVAL} envoie`} ${name(event.card)} de la main au Cimetière : son Effet Rapide annule les effets d’un Monstre jusqu’à la fin de ce tour.`;
					if (effect === "scarecrow") return `${discards} ${name(event.card)} depuis la main : l’attaque directe est annulée, puis la Battle Phase se termine.`;
					if (effect === "fader") return `${mine ? "Tu Invoques Spécialement" : `${RIVAL} Invoque Spécialement`} ${name(event.card)} depuis la main : la Battle Phase se termine.`;
					if (effect === "crow") return `${discards} ${name(event.card)} depuis la main : son Effet Rapide bannit la carte ciblée dans le Cimetière.`;
					return `${discards} ${name(event.card)} depuis la main pour payer le coût de son Effet Rapide : aucun dommage de combat de ce combat.`;
				}
				case "skip-draw":
					return mine ? "Tu sautes ta Draw Phase, comme le disait ta carte : pas de pioche ce tour." : `${RIVAL} saute sa Draw Phase : pas de pioche ce tour.`;
				case "drew":
					return mine ? `Tu pioches ${name(event.card)}.` : `${RIVAL} pioche une carte.`;
				case "phase":
					return event.phase === "end" ? `End Phase. ${mine ? "Ton tour est fini" : `Le tour de ${RIVAL} est fini`}.` : `${phases[event.phase]}.`;
				case "turn":
					return mine ? "À toi de jouer !" : `Tour de ${RIVAL}.`;
				case "summoned":
					if (event.tributes.length > 0) return `${mine ? "Tu Sacrifies" : `${RIVAL} Sacrifie`} ${list(event.tributes.map(name))} pour Invoquer ${name(event.card)}.`;
					return `${mine ? "Tu Invoques" : `${RIVAL} Invoque`} ${name(event.card)} en Position d’Attaque.`;
				case "activated":
					return `${mine ? "Tu actives" : `${RIVAL} active`} la Magie ${name(event.card)}${event.target ? ` et ${mine ? "cibles" : "cible"} ${name(event.target)}` : ""}.`;
				case "discarded":
					return `${mine ? "Tu défausses" : `${RIVAL} défausse`} ${name(event.card)} pour payer le coût.`;
				case "ability":
					return `${mine ? "Tu utilises" : `${RIVAL} utilise`} l’effet de ${name(event.card)} et ${mine ? "cibles" : "cible"} ${name(event.target)}.`;
				case "trigger":
					return `${name(event.card)} dit « ${event.word === "when" ? "Lorsque" : "Si"}… » : son effet a sa chance ! ${mine ? "Tu infliges" : `${RIVAL} inflige`} ${event.amount} dommages.`;
				case "missed":
					return `${name(event.card)} a raté sa chance ! Sa carte dit « Lorsque… » : elle n’a sa chance que si l’envoi au Cimetière arrive en dernier. Ici, ${event.last === "activation" ? "l’activation de la Magie" : "l’Invocation"} est arrivée en dernier.`;
				case "negated":
					return `${name(event.by)} annule ${name(event.card)} : son effet n’a pas lieu.`;
				case "burned":
					return `${name(event.card)} : ${mine ? "tu infliges" : `${RIVAL} inflige`} ${event.amount} dommages.`;
				case "added":
					return `${name(event.card)} va dans ${mine ? "ta main" : `la main de ${RIVAL}`}, depuis ${event.from === "deck" ? "le Deck" : "le Cimetière"}.`;
				case "stays":
					return cardOf(event.card).kind !== "monster" && (cardOf(event.card) as { icon?: string }).icon === "continuous" ? `${name(event.card)} reste face recto sur le Terrain : c’est une Magie Continue. Son effet dure tant qu’elle est là.` : `${name(event.card)} reste face recto sur le Terrain. Son effet dure tant qu’elle est là.`;
				case "equipped":
					return `${name(event.card)} est équipée à ${name(event.target)}. Si ${name(event.target)} quitte le Terrain, elle part aussi.`;
				case "battle-ended":
					return mine ? "Ta Battle Phase est terminée." : `La Battle Phase de ${RIVAL} est terminée.`;
				case "set-monster":
					return mine ? `Tu Poses ${name(event.card)} face verso, en Position de Défense.` : `${RIVAL} Pose un Monstre face verso, en Position de Défense.`;
				case "flipped":
					return event.how === "summon" ? `Invocation Flip : ${name(event.card)} se retourne face recto, en Position d’Attaque.` : `${name(event.card)} se retourne face recto.`;
				case "turned-down":
					return `${name(event.card)} est retourné face verso, en Position de Défense.`;
				case "coin":
					return `${name(event.card)} : ${mine ? "tu lances" : `${RIVAL} lance`} une pièce… ${event.right ? "Gagné !" : "Perdu !"}`;
				case "set":
					return `Tu Poses ${name(event.card)} face verso. Elle doit attendre le tour suivant.`;
				case "gained":
					return `${mine ? "Tu gagnes" : `${RIVAL} gagne`} ${event.amount} Points de Vie : ${event.lp} maintenant.`;
				case "boosted":
					return `${name(event.card)} ${event.amount > 0 ? "gagne" : "perd"} ${Math.abs(event.amount)} ATK : ${event.atk} ${event.lasting === "damage-step" ? "pendant la Damage Step seulement" : event.lasting === "for-good" ? "pour de bon" : "jusqu’à la fin du tour"}.`;
				case "destroyed":
					return `${name(event.card)} est détruit et va au Cimetière.`;
				case "no-effect":
					return `${name(event.card)} se résout, mais il ne lui reste rien à faire.`;
				case "position":
					return event.position === "defense" ? `${name(event.card)} passe en Position de Défense. C’est sa DEF qui compte.` : `${name(event.card)} passe en Position d’Attaque.`;
				case "attack-declared":
					return event.target ? `${name(event.attacker)} attaque ${name(event.target)} !` : event.hidden ? `${name(event.attacker)} attaque un Monstre face verso !` : `${name(event.attacker)} attaque directement !`;
				case "damage-step":
					return "Damage Step : juste avant le calcul des dommages.";
				case "window":
					if (event.step === "damage") return mine ? "Stop ! Kuriboh et les cartes qui changent l’ATK peuvent encore agir." : `${RIVAL} peut encore changer l’ATK.`;
					if (!mine) return `${RIVAL} peut répondre.`;
					if (event.kind === "summon") return "Stop ! Un Monstre vient d’être Invoqué : tu peux répondre maintenant.";
					if (event.kind === "effect") return "Stop ! Un Monstre active son effet : tu peux répondre maintenant. Ta réponse se résoudra en premier.";
					if (event.kind === "chain") return "Stop ! Un Contre-Piège peut répondre à cette réponse. La dernière carte de la Chaîne se résout en premier.";
					return event.kind === "attack" ? "Stop ! Tu peux répondre maintenant." : "Stop ! Tu peux répondre maintenant. Ta réponse se résoudra en premier.";
				case "sprung":
					return `${mine ? "Tu retournes" : `${RIVAL} retourne`} un Piège : ${name(event.card)} !`;
				case "attack-stopped":
					return `L’attaque de ${name(event.attacker)} est arrêtée.`;
				case "returned":
					return `${name(event.card)} revient dans ${mine ? "ta main" : `la main de ${RIVAL}`}.`;
				case "chain":
					return event.link === 1 ? `${name(event.card)} commence une Chaîne : Maillon de Chaîne 1.` : `${name(event.card)} se pose par-dessus : Maillon de Chaîne ${event.link}.`;
				case "resolve":
					return `Le Maillon de Chaîne ${event.link} se résout : ${name(event.card)}.`;
				case "battle": {
					const [a, d, x, y] = [name(event.attacker), name(event.defender), event.attackerValue, event.defenderValue];
					if (event.defenderPosition === "attack") {
						if (x > y) return `${a} gagne : ${x} − ${y} = ${x - y}. ${d} est détruit.`;
						if (x < y) return `${d} est plus fort : ${y} − ${x} = ${y - x}. ${a} est détruit.`;
						return `${x} contre ${y} : égalité. Les deux Monstres sont détruits.`;
					}
					if (x > y) return `${x} ATK bat ${y} DEF : ${d} est détruit. Aucun dégât.`;
					if (x < y) return `${y} DEF tient bon : ${y} − ${x} = ${y - x}. Rien n’est détruit.`;
					return `${x} ATK contre ${y} DEF : il ne se passe rien.`;
				}
				case "direct":
					return `Rien ne bloque : ${event.amount} de dégâts.`;
				case "lp":
					return `${mine ? "Tu perds" : `${RIVAL} perd`} ${event.from - event.to} Points de Vie : il en reste ${event.to}.`;
				case "deck-out":
					return `${mine ? "Ton Deck est vide" : `Le Deck de ${RIVAL} est vide`} : plus de carte à piocher.`;
				case "exodia":
					return mine ? `Les cinq pièces d’${name("exodia-the-forbidden-one")} sont dans ta main : tu gagnes tout de suite, quels que soient les Points de Vie !` : `${RIVAL} a les cinq pièces d’${name("exodia-the-forbidden-one")} en main.`;
				case "won":
					return mine ? "Tu gagnes le duel !" : `${RIVAL} gagne ce duel.`;
			}
		},
		describeMove(move, board) {
			const mine = board.pending ? board[board.turn === "you" ? "rival" : "you"] : board[board.turn];
			const theirs = board.pending ? board[board.turn] : board.turn === "you" ? board.rival : board.you;
			switch (move.type) {
				case "draw":
					return "Pioche ta carte.";
				case "phase":
					return move.to === "end" ? "Termine ton tour." : `Passe à la ${phases[move.to]}.`;
				case "place": {
					const using = list((move.materials ?? []).map((item) => name(item.from === "hand" ? item.card : (mine.monsters[item.zone]?.card ?? move.card))));
					const buried = move.grave ? board[move.grave.side].graveyard[move.grave.index] : undefined;
					if (buried) return `Active ${name(move.card)} et cible ${name(buried)} dans ${move.grave?.side === "you" ? "ton Cimetière" : `le Cimetière de ${RIVAL}`}.`;
					if (move.summon) return `Active ${name(move.card)} : Invoque par Fusion ${name(move.summon)} avec ${using}.`;
					if (move.materials) return `Active ${name(move.card)} et Sacrifie ${using}.`;
					if (move.set && cardOf(move.card).kind === "monster") return `Pose ${name(move.card)} face verso, en Position de Défense.`;
				if (move.special) return `Invoque Spécialement ${name(move.card)} depuis ta main, comme le dit sa carte.`;
					if (move.row === "field") return `Joue ${name(move.card)} dans ta Zone Terrain.`;
					if (move.row === "backrow" && cardOf(move.card).kind === "monster") return `Place ${name(move.card)} dans une Zone Pendule.`;
					if ((move.tributes?.length ?? 0) > 0) return `Invoque ${name(move.card)} en Sacrifiant ${list((move.tributes ?? []).map((zone) => name(mine.monsters[zone]?.card ?? move.card)))}.`;
					return move.discard ? `Active ${name(move.card)} et défausse ${name(move.discard)} pour payer le coût.` : `Joue ${name(move.card)}.`;
				}
				case "position": {
					const slot = mine.monsters[move.zone];
					return slot ? `Tourne ${name(slot.card)}.` : "";
				}
				case "attack": {
					const attacker = mine.monsters[move.attacker];
					const target = move.target === "direct" ? null : theirs.monsters[move.target];
					if (!attacker) return "";
					return target ? `Attaque ${name(target.card)} avec ${name(attacker.card)} (${atkOf(attacker, board)} ATK).` : `Attaque directement avec ${name(attacker.card)}.`;
				}
				case "ability": {
					const slot = mine.monsters[move.zone];
					const target = move.target === undefined ? null : theirs.monsters[move.target];
					if (slot && monsterOf(slot.card).detach) return `Détache un Matériel de ${name(slot.card)} pour annuler l’attaque.`;
					return slot && target ? `Utilise l’effet de ${name(slot.card)} et cible ${name(target.card)}.` : "";
				}
				case "spring": {
					const slot = board.you.backrow[move.zone];
					return slot ? `Retourne ton Piège ${name(slot.card)}.` : "";
				}
				case "extra":
					return `Touche ton Extra Deck : Invoque ${name(move.card)} avec ${list(move.materials.map((zone) => name(mine.monsters[zone]?.card ?? move.card)))}.`;
				case "pendulum":
					return `Invoque par Pendulation ${list(move.cards.map(name))} depuis ta main.`;
				case "hand":
					return `Défausse ${name(move.card)} de ta main pour utiliser son Effet Rapide.`;
				case "pass":
					return "Laisse faire.";
			}
		},
	};
}
export const fr: PlayCopy = frenchCopy("Nox");
