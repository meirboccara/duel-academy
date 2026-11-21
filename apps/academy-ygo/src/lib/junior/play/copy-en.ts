import { cardOf, monsterOf, type CardId } from "./cards";
import { atkOf } from "./engine";
import { printedWords } from "./card-words";
import { MASTERS, MASTER_NAMES, MASTER_TIER, masterLevelId, type Tier } from "./masters";
import type { PlayCopy } from "./copy";

/** The level of a trainer of the masters' island, after its name. */
const TIER_WORDS: Record<Tier, string> = { basic: "beginner", medium: "medium", strong: "strong", expert: "expert" };

/** Card text follows the wording printed on real cards: a cost before the ";", "Target" only when the card targets. */
const written: Partial<PlayCopy["cards"]> = {
	"pocket-cub": { name: "Silver Fang" },
	"moss-beetle": { name: "Mystical Elf" },
	"river-otter": { name: "Destroyer Golem" },
	"lantern-owl": { name: "Sky Scout" },
	"pebble-crab": { name: "Saggi the Dark Clown" },
	"storm-stag": { name: "Ally of Justice Clausolas" },
	"mountain-bison": { name: "Cosmo Queen" },
	"mud-toad": { name: "Happy Lover" },
	"night-bat": { name: "Lady of Faith" },
	"thorn-fox": { name: "Fairy's Gift" },
	"bramble-ram": { name: "Maiden of the Moonlight" },
	"iron-boar": { name: "Battle Ox" },
	"stone-golem": { name: "Prevent Rat" },
	"shadow-wolf": { name: "Judge Man" },
	"glint-lynx": { name: "Glint Lynx", text: '(Quick Effect): You can target 1 face-up monster your opponent controls; it loses 800 ATK until the end of this turn. You can only use this effect of "Glint Lynx" once per turn.' },
	"cinder-hedgehog": { name: "Cinder Hedgehog", text: 'You can target 1 face-up monster your opponent controls; it loses 800 ATK until the end of this turn. You can only use this effect of "Cinder Hedgehog" once per turn.' },
	"dozy-moth": { name: "Dozy Moth", text: "When this card is sent to the GY: You can inflict 500 damage to your opponent." },
	"busy-bee": { name: "Busy Bee", text: "If this card is sent to the GY: You can inflict 500 damage to your opponent." },
	"glow-charm": { name: "Red Medicine", text: "Increase your Life Points by 500 points." },
	"spark-dash": { name: "Rush Recklessly", text: "Target 1 face-up monster on the field; it gains 700 ATK until the end of this turn." },
	"thunder-clap": { name: "Offerings to the Doomed", text: "Target 1 face-up monster on the field; destroy that target, also skip your next Draw Phase." },
	"spark-trade": { name: "Tribute to the Doomed", text: "Discard 1 card, then target 1 monster on the field; destroy it." },
	"fog-snare": { name: "Reinforcements", text: "Target 1 face-up monster on the field; it gains 500 ATK until the end of this turn." },
	"sticky-vine": { name: "Draining Shield", text: "When an opponent's monster declares an attack: Target the attacking monster; negate that attack, and if you do, gain LP equal to that target's ATK." },
	"quick-burrow": { name: "Compulsory Evacuation Device", text: "Target 1 monster on the field; return that target to the hand." },
	/* Real cards: the name and the text are the ones in Konami's card database. */
	"monster-reborn": { name: "Monster Reborn", text: "Target 1 monster in either GY; Special Summon it." },
	mountain: { name: "Mountain", text: "All Dragon, Winged Beast, and Thunder monsters on the field gain 200 ATK/DEF." },
	"sakuretsu-armor": { name: "Sakuretsu Armor", text: "When an opponent's monster declares an attack: Target the attacking monster; destroy that target." },
	"dimensional-prison": { name: "Dimensional Prison", text: "When an opponent's monster declares an attack: Target that attacking monster; banish that target." },
	"pot-of-desires": { name: "Pot of Desires", text: 'Banish 10 cards from the top of your Deck, face-down; draw 2 cards. You can only activate 1 "Pot of Desires" per turn.' },
	"black-luster-ritual": { name: "Black Luster Ritual", text: 'This card is used to Ritual Summon "Black Luster Soldier". You must also Tribute monsters from your hand or field whose total Levels equal 8 or more.' },
	"black-luster-soldier": { name: "Black Luster Soldier", text: 'You can Ritual Summon this card with "Black Luster Ritual".' },
	polymerization: { name: "Polymerization", text: "Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters from your hand or field." },
	"flame-manipulator": { name: "Flame Manipulator" },
	masaki: { name: "Masaki the Legendary Swordsman" },
	"flame-swordsman": { name: "Flame Swordsman", text: '"Flame Manipulator" + "Masaki the Legendary Swordsman"' },
	"tune-warrior": { name: "Tune Warrior" },
	"giant-soldier-of-stone": { name: "Giant Soldier of Stone" },
	"gaia-knight": { name: "Gaia Knight, the Force of Earth", text: "1 Tuner + 1 or more non-Tuner monsters" },
	"gem-knight-pearl": { name: "Gem-Knight Pearl", text: "2 Level 4 monsters" },
	utopia: { name: "Number 39: Utopia", text: "2 Level 4 monsters\nWhen a monster declares an attack: You can detach 1 material from this card; negate the attack. If this card is targeted for an attack, while it has no material: Destroy this card." },
	lanphorhynchus: { name: "LANphorhynchus", text: "2 monsters" },
	"flash-knight": { name: "Flash Knight" },
	dragong: { name: "Dragong" },
	mandragon: { name: "Mandragon" },
	"lightning-vortex": { name: "Lightning Vortex", text: "Discard 1 card; destroy all face-up monsters your opponent controls." },
	fissure: { name: "Fissure", text: "Destroy the 1 face-up monster your opponent controls that has the lowest ATK (your choice, if tied)." },
	"upstart-goblin": { name: "Upstart Goblin", text: "Draw 1 card, then your opponent gains 1000 LP." },
	"cyber-dragon": { name: "Cyber Dragon", text: "If only your opponent controls a monster, you can Special Summon this card (from your hand)." },
	"banner-of-courage": { name: "Banner of Courage", text: "All monsters you control gain 200 ATK during your Battle Phase only." },
	"legendary-sword": { name: "Legendary Sword", text: "Equip only to a Warrior monster. It gains 300 ATK/DEF." },
	"call-of-the-haunted": { name: "Call of the Haunted", text: "Activate this card by targeting 1 monster in your GY; Special Summon that target in Attack Position. When this card leaves the field, destroy that monster. When that monster is destroyed, destroy this card." },
	"negate-attack": { name: "Negate Attack", text: "When an opponent's monster declares an attack: Target the attacking monster; negate the attack, then end the Battle Phase." },
	kuriboh: { name: "Kuriboh", text: "During damage calculation, if your opponent's monster attacks (Quick Effect): You can discard this card; you take no battle damage from that battle." },
	"dark-magician": { name: "Dark Magician" },
	"blue-eyes-white-dragon": { name: "Blue-Eyes White Dragon" },
	"blue-eyes-ultimate-dragon": { name: "Blue-Eyes Ultimate Dragon", text: '"Blue-Eyes White Dragon" + "Blue-Eyes White Dragon" + "Blue-Eyes White Dragon"' },
	"exodia-the-forbidden-one": { name: "Exodia the Forbidden One", text: 'If you have "Right Leg of the Forbidden One", "Left Leg of the Forbidden One", "Right Arm of the Forbidden One" and "Left Arm of the Forbidden One" in addition to this card in your hand, you win the Duel.' },
	"right-arm-of-the-forbidden-one": { name: "Right Arm of the Forbidden One" },
	"left-arm-of-the-forbidden-one": { name: "Left Arm of the Forbidden One" },
	"right-leg-of-the-forbidden-one": { name: "Right Leg of the Forbidden One" },
	"left-leg-of-the-forbidden-one": { name: "Left Leg of the Forbidden One" },
};
const cards = { ...printedWords("en"), ...written } as PlayCopy["cards"];
const name = (card: CardId) => cards[card].name;
const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);
const phases: PlayCopy["phases"] = { draw: "Draw Phase", standby: "Standby Phase", main1: "Main Phase 1", battle: "Battle Phase", main2: "Main Phase 2", end: "End Phase" };

/** The words of Junior play for a duel against this rival: Nox in the course, a trainer on the masters' island. */
export function englishCopy(RIVAL: string): PlayCopy {
	return {
		pageTitle: "Junior: learn by playing",
		intro: "Small duels on a small board. Each one teaches one rule. Tap a card, tap a zone, and see what happens. Nothing is lost if it goes wrong: you can always go back.",
		rivalName: RIVAL,
		englishCards: false,
		worlds: {
			wake: { title: "The Deck wakes up", blurb: "Three kinds of cards, and your first battles." },
			shield: { title: "Shield or sword", blurb: "Defense Position, Life Points and direct attacks." },
			friend: { title: "Call a friend", blurb: "Summons, Tributes and the phases of a turn." },
			magic: { title: "Spells and Traps", blurb: "A Spell now, a Trap for later." },
			puzzles: { title: "Win this turn", blurb: "Ten boards. Everything you know, no help." },
			tower: { title: "Turtle tower", blurb: "Chains: the last card played goes first." },
			rival: { title: "The rival's challenge", blurb: "A whole duel against Nox." },
			reading: { title: "Read the card", blurb: "Cost, Target, Quick Effect and once per turn, in the words printed on real cards." },
			mat: { title: "The whole mat", blurb: "Every zone: the Graveyard, the Field Zone, banished cards and the Extra Deck." },
			icons: { title: "The six icons", blurb: "Quick-Play, Counter, Continuous, Equip: one small icon changes everything." },
			ritual: { title: "The Ritual", blurb: "A Spell, a Monster in your hand, and Tributes that add up." },
			fusion: { title: "Fusion", blurb: "Two Monsters become one from the Extra Deck." },
			synchro: { title: "Synchro", blurb: "One Tuner, and Levels that add up exactly." },
			xyz: { title: "Xyz", blurb: "Same Level, stacked. The materials wait under the Monster." },
			link: { title: "Link", blurb: "Count the Monsters. No DEF, no Defense Position." },
			pendulum: { title: "Pendulum", blurb: "Two Scales, and many Monsters at once." },
			words: { title: "Every word counts", blurb: "Real cards. One word decides who wins." },
			legends: { title: "Legends", blurb: "The most famous cards of the first duels: three dragons in one, and the Forbidden One." },
			steps: { title: "The island of steps", blurb: "An attack in two steps: the Battle Step, then the Damage Step." },
			final: { title: "The Extra Deck duel", blurb: "A whole duel on the whole mat. Nox has an Extra Deck too." },
			masters: { title: "The masters' tournament", blurb: "Every master is waiting, each with their own Deck. Beat them all!" },
		},
		levels: {
			"w1-field": { title: "Fill the field", goal: "Tap a card, then tap a glowing zone. Put all three cards in play." },
			"w1-field-2": { title: "Three more", goal: "Play all three cards. Offerings to the Doomed needs a target: the rival's Monster." },
			"w1-clash": { title: "Clash!", goal: "Destroy Fairy's Gift. Tap your Monster, then tap the rival's." },
			"w1-clash-2": { title: "Double clash", goal: "Destroy both rival Monsters. Keep both of yours." },
			"w1-tie": { title: "Same strength", goal: "Maiden of the Moonlight has 1500 ATK. Destroy it and keep both your Monsters." },
			"w2-crouch": { title: "Shield up", goal: "Battle Ox will attack. Tap Mystical Elf to turn it, then end your turn." },
			"w2-stand": { title: "Sword out", goal: "Sky Scout is in Defense Position. Destroy Fairy's Gift." },
			"w2-wall": { title: "The big shell", goal: "Two attacks are coming. Lose no Life Points." },
			"w2-lantern": { title: "Blow out the lantern", goal: "Bring the rival's Life Points to 0." },
			"w2-boss": { title: "Break the shell", goal: "Bring the rival's Life Points to 0. Who can break 1500 DEF?" },
			"w3-gem": { title: "Call a friend", goal: "Summon one Monster, then destroy Fairy's Gift. One Normal Summon per turn!" },
			"w3-tribute": { title: "A bigger friend", goal: "Ally of Justice Clausolas is Level 6: Tribute one Monster to Summon it. Destroy Battle Ox." },
			"w3-two": { title: "The giant", goal: "Cosmo Queen is Level 8: it needs two Tributes. Destroy Judge Man." },
			"w3-keep": { title: "Who leaves?", goal: "Bring the rival's Life Points to 0. Tribute the right Monster." },
			"w3-magician": { title: "The Dark Magician", goal: "Dark Magician is Level 7: it needs two Tributes. Summon it and win." },
			"w3-blue-eyes": { title: "The white dragon", goal: "Blue-Eyes White Dragon needs two Tributes. Choose which Monsters to keep. Win this turn." },
			"w3-chimes": { title: "Four chimes", goal: "Play a whole turn: Draw, Main, Battle. Win the duel." },
			"w3-two-turns": { title: "Two turns", goal: "Destroy Prevent Rat. It takes two turns." },
			"w4-spell": { title: "Spell now!", goal: "Win this turn. Battle Ox is in the way." },
			"w4-boost": { title: "A little spark", goal: "Win this turn. Fairy's Gift has 1400 ATK." },
			"w4-ambush": { title: "Ambush", goal: "Set your Trap, end your turn, and keep Silver Fang safe." },
			"w4-counter": { title: "Trap, then strike", goal: "Win the duel in two turns." },
			p1: { title: "Puzzle 1", goal: "Here your card for the turn is already drawn: you start in Main Phase 1. Win this turn." },
			p2: { title: "Puzzle 2", goal: "Win this turn." },
			p3: { title: "Puzzle 3", goal: "Win this turn." },
			p4: { title: "Puzzle 4", goal: "Win this turn." },
			p5: { title: "Puzzle 5", goal: "Win this turn." },
			p6: { title: "Puzzle 6", goal: "Get through the rival's turn. Lose no Life Points and keep Sky Scout." },
			p7: { title: "Puzzle 7", goal: "Win this turn." },
			p8: { title: "Puzzle 8", goal: "Win this turn." },
			p9: { title: "Puzzle 9", goal: "After the rival's turn, have 800 Life Points or more, and keep Mystical Elf." },
			p10: { title: "Puzzle 10", goal: "Win this turn." },
			"w6-tower": { title: "Turtle tower", goal: "Nox plays a Spell on Silver Fang. Answer with your Trap: the last card goes first." },
			"w6-double": { title: "Two surprises", goal: "Draw, go through the Standby Phase, then Set both Traps. Keep Destroyer Golem and all your Life Points." },
			"w6-main2": { title: "After the battle", goal: "Your three Monster Zones are full. Free a zone by battling, then Summon Sky Scout in Main Phase 2." },
			"w7-duel": { title: "The rival's challenge", goal: "A whole duel. Bring Nox's Life Points from 4000 to 0!" },
			"r-cost": { title: "Pay first", goal: "Read Tribute to the Doomed: discarding 1 card, before the ;, is the cost. Win this turn." },
			"r-paid": { title: "Paid is paid", goal: "Nox has a Trap that saves Monsters from Spells. Win this turn anyway." },
			"r-target": { title: "Pick the target", goal: "Offerings to the Doomed says Target: you choose when you activate it. Win this turn." },
			"r-quick": { title: "Quick Effect", goal: "Battle Ox attacks Destroyer Golem. On Nox's turn a Monster effect needs (Quick Effect). Save Destroyer Golem." },
			"r-main": { title: "My turn only", goal: "Cinder Hedgehog has no Quick Effect: use it in your Main Phase. Win this turn." },
			"r-once": { title: "Once per turn", goal: "Two attacks are coming, and Glint Lynx works once per turn. Keep Destroyer Golem safe." },
			"r-when": { title: "When or If?", goal: '"If…" always gets its chance. "When…" only if going to the Graveyard happens last. Which card do you discard?' },
			"r-last": { title: "Right on time", goal: 'Dozy Moth says "When…". Let a battle send it to the Graveyard, so nothing happens after. Win!' },
			"r-boss": { title: "Read every word", goal: "Win this turn. Read each card before you play it." },
			"m-reborn": { title: "Back from the Graveyard", goal: "Read Monster Reborn. Tap your Graveyard, pick a Monster, and win this turn." },
			"m-either": { title: "Either Graveyard", goal: 'Monster Reborn says "either GY". Look in both Graveyards. Win this turn.' },
			"m-field": { title: "The Field Zone", goal: "Mountain is a Field Spell: it goes in the Field Zone and stays. Win this turn." },
			"m-both": { title: "Two Mountains", goal: '"On the field" means both sides. Nox has a Mountain. Play yours too, and win.' },
			"m-banish": { title: "Banished", goal: "Busy Bee attacks. One Trap can destroy it, one can banish it. Banished cards skip the Graveyard." },
			"m-desires": { title: "Face-down", goal: "Read Pot of Desires. Its cost banishes 10 cards face-down. Then win this turn." },
			"m-mat": { title: "Where does it go?", goal: "Put every card in its place on the whole mat." },
			"ic-quick": { title: "Quick-Play", goal: "Set Rush Recklessly face-down. On Nox's turn, activate it when Battle Ox attacks." },
			"ic-quick-2": { title: "Wait for your moment", goal: "Nox will Summon, then attack. Set Offerings to the Doomed and answer its attack. Keep Silver Fang." },
			"ic-counter": { title: "Counter Trap", goal: "Two attacks are coming and you have one Trap. Read it: it stops the whole Battle Phase." },
			"ic-banner": { title: "A Spell that stays", goal: "Banner of Courage is a Continuous Spell: it stays face-up. Win this turn." },
			"ic-equip": { title: "Gear up", goal: "Legendary Sword is an Equip Spell. Equip it to the right Monster and win this turn." },
			"ic-haunted": { title: "A Trap that stays", goal: "Call of the Haunted is a Continuous Trap. Flip it in your Main Phase and win this turn." },
			"ri-first": { title: "The first Ritual", goal: "Play Black Luster Ritual. Tribute Monsters whose Levels add up to 8 or more. Win this turn." },
			"ri-hand": { title: "From the hand", goal: "Tributes for a Ritual Summon can come from your hand too. Win this turn." },
			"ri-more": { title: "8 or more", goal: 'The card says "8 or more". Which Monsters do you Tribute? Win this turn.' },
			"fu-first": { title: "Two become one", goal: "Play Polymerization. Flame Swordsman names its two Monsters. Win this turn." },
			"fu-hand": { title: "Hand or field", goal: 'Polymerization says "from your hand or field". Win this turn.' },
			"fu-grave": { title: "Where did they go?", goal: "The Monsters used for a Fusion Summon go to the Graveyard. Can one come back? Win this turn." },
			"sy-first": { title: "Tune up", goal: "Tap your Extra Deck. One Tuner plus one Monster: Level 3 + Level 3 = 6. Win this turn." },
			"sy-pick": { title: "Exactly 6", goal: "For a Synchro Summon the Levels must add up exactly. Pick the right two, and win." },
			"sy-tuner": { title: "No Tuner, no Synchro", goal: "A Synchro Summon needs exactly one Tuner. Win this turn." },
			"xy-first": { title: "Stack them", goal: "Two Level 4 Monsters go under Gem-Knight Pearl. Tap your Extra Deck, and win this turn." },
			"xy-level": { title: "Same Level", goal: "An Xyz Summon needs Monsters of the same Level. Win this turn." },
			"xy-detach": { title: "Detach", goal: "Two attacks are coming. Utopia can detach a material, as a cost, to negate an attack. Keep Silver Fang." },
			"xy-empty": { title: "The last material", goal: "Read all of Utopia. With no material, an attack will destroy it. Keep Utopia." },
			"li-first": { title: "Link up", goal: "LANphorhynchus is Link 2: a Link Summon with 2 Monsters. It goes to the Extra Monster Zone. Win!" },
			"li-keep": { title: "Who stays?", goal: "Link Summon with two Monsters, and keep the right one. Win this turn." },
			"li-nodef": { title: "No shield", goal: "Judge Man will attack. A Link Monster has no DEF and no Defense Position. Keep LANphorhynchus another way." },
			"pe-first": { title: "Two Scales", goal: "Place both Pendulum Scales. Then Pendulum Summon the Monsters whose Levels are between them. Win!" },
			"pe-between": { title: "Between the Scales", goal: "With Scales 2 and 7, only Levels 3 to 6 come by Pendulum Summon. Win this turn." },
			"pe-extra": { title: "Not the Graveyard", goal: "Watch where Flash Knight goes when it is destroyed. Then win on your turn." },
			"rd-vortex": { title: "Pay, then bring back", goal: "Read both cards. A cost can help you. Win this turn." },
			"rd-fissure": { title: "No Target", goal: "Fissure never says Target: the card chooses. Destroy both Monsters and keep Destroyer Golem." },
			"rd-then": { title: "Then", goal: 'Upstart Goblin: you draw, "then" Nox gains 1000 LP. Is it worth it? Win this turn.' },
			"rd-colon": { title: "Only your opponent", goal: "Read Cyber Dragon before you Summon anything. Win this turn." },
			"rd-kuriboh": { title: "A surprise in your hand", goal: "Two attacks are coming. Kuriboh has a Quick Effect in your hand. Lose no Life Points." },
			"lg-ultimate": { title: "Three become one", goal: "Three Blue-Eyes White Dragons in your hand. Read the Fusion Monster in your Extra Deck. Win." },
			"lg-exodia": { title: "The Forbidden One", goal: "Four pieces in your hand. Draw the fifth and win, whatever the Life Points." },
			"lg-exodia-2": { title: "One card away", goal: "One piece is still in your Deck. Which card can draw it? Win this turn." },
			"st-battle": { title: "The Battle Step", goal: "Battle Ox attacks Silver Fang. Keep Silver Fang: which card acts at the right moment?" },
			"st-damage": { title: "The Damage Step", goal: "Two attacks are coming. Let the Battle Step pass, then act in the Damage Step. Keep your 1000 Life Points." },
			"x-duel": { title: "The Extra Deck duel", goal: "A whole duel on the whole mat. Use your Extra Deck. Bring Nox's Life Points to 0!" },
			...Object.fromEntries(MASTERS.map((master) => [masterLevelId(master), { title: `Duel: ${MASTER_NAMES[master]} · ${TIER_WORDS[MASTER_TIER[master]]}`, goal: `A whole duel against ${MASTER_NAMES[master]}: 40 shuffled cards, 8000 Life Points. Bring them down to 0!` }])),
		},
		cards,
		kinds: { monster: "Monster", spell: "Spell", trap: "Trap" },
		types: { aqua: "Aqua", beast: "Beast", "beast-warrior": "Beast-Warrior", cyberse: "Cyberse", dinosaur: "Dinosaur", "divine-beast": "Divine-Beast", dragon: "Dragon", fairy: "Fairy", fiend: "Fiend", fish: "Fish", insect: "Insect", machine: "Machine", plant: "Plant", psychic: "Psychic", pyro: "Pyro", reptile: "Reptile", rock: "Rock", "sea-serpent": "Sea Serpent", spellcaster: "Spellcaster", thunder: "Thunder", warrior: "Warrior", "winged-beast": "Winged Beast", wyrm: "Wyrm", zombie: "Zombie" },
		frames: { ritual: "Ritual", fusion: "Fusion", synchro: "Synchro", xyz: "Xyz", link: "Link" },
		spellTypes: { normal: "Normal Spell", "quick-play": "Quick-Play Spell", continuous: "Continuous Spell", equip: "Equip Spell", field: "Field Spell", ritual: "Ritual Spell" },
		trapTypes: { normal: "Normal Trap", continuous: "Continuous Trap", counter: "Counter Trap" },
		tuner: "Tuner",
		rank: "Rank",
		linkRating: "Link",
		scale: "Pendulum Scale",
		materials: (count) => `${count} ${count === 1 ? "material" : "materials"} under it`,
		rules: {
			zones: "Card kinds and zones",
			battle: "Battle: ATK against ATK",
			defense: "Defense Position",
			direct: "Life Points and direct attacks",
			summon: "Normal Summon",
			tribute: "Tributes",
			phases: "Phases of a turn",
			spell: "Spells",
			trap: "Traps",
			chain: "Chains",
			cost: "Cost: the part before the ;",
			target: "Target",
			quick: "Quick Effect",
			once: "Once per turn",
			timing: '"When… you can" or "If… you can"',
			graveyard: "The Graveyard",
			field: "The Field Zone",
			banish: "Banished cards",
			quickplay: "Quick-Play Spell: Set, then activated on the opponent's turn",
			counter: "Counter Trap: it answers, and stops it all",
			continuous: "Continuous: the card stays face-up",
			equip: "Equip Spell: tied to one Monster",
			ritual: "Ritual Summon",
			fusion: "Fusion Summon",
			synchro: "Synchro Summon",
			xyz: "Xyz Summon",
			detach: "Detach: a material as a cost",
			link: "Link Summon",
			pendulum: "Pendulum Summon",
			notarget: 'No "Target": the card chooses',
			then: '"Then": one thing, then the other',
			condition: "A condition with no colon",
			exodia: "The Forbidden One: five pieces in the hand win",
			steps: "Battle Step, then Damage Step",
		},
		mastery: { new: "not met yet", met: "met", mastered: "used again without help" },
		phases,
		steps: { battle: "Battle Step", damage: "Damage Step" },
		stepHelp: {
			battle: "Battle Step: the attacker and its target are chosen. This is when Traps that say \"when a monster declares an attack\" are used.",
			damage: "Damage Step: the two Monsters meet. Only cards that change ATK, or that say so like Kuriboh, can still be used. The loser goes to the Graveyard at the very end.",
		},
		phaseHelp: {
			draw: "Draw Phase: you draw 1 card. No card left to draw? You lose the duel.",
			standby: "Standby Phase: a short pause. Some cards act here. Often nothing happens, and you go on.",
			main1: "Main Phase 1: you build. One Normal Summon, Spells, Traps to Set, in any order you like.",
			battle: "Battle Phase: each of your Monsters in Attack Position may attack once.",
			main2: "Main Phase 2: after the battle, one more Main Phase to get ready for your opponent's turn.",
			end: "End Phase: effects that last \"until the end of the turn\" stop. Then it is your opponent's turn.",
		},
		level: "Level",
		atk: "ATK",
		def: "DEF",
		lifePoints: (side, lp) => (side === "you" ? `Your Life Points: ${lp}` : `${RIVAL}'s Life Points: ${lp}`),
		handCount: (side, count) => `${side === "you" ? "Your hand" : `${RIVAL}'s hand`}: ${count} ${count === 1 ? "card" : "cards"}`,
		monsterZone: (side, number) => (side === "you" ? `Your Monster Zone ${number}` : `${RIVAL}'s Monster Zone ${number}`),
		backZone: (side, number) => (side === "you" ? `Your Spell & Trap Zone ${number}` : `${RIVAL}'s Spell & Trap Zone ${number}`),
		mainZone: (side, number) => (side === "you" ? `Your Main Monster Zone ${number}` : `${RIVAL}'s Main Monster Zone ${number}`),
		extraMonsterZone: (side) => (side === "you" ? "Your Extra Monster Zone" : `${RIVAL}'s Extra Monster Zone`),
		fieldZone: (side) => (side === "you" ? "Your Field Zone" : `${RIVAL}'s Field Zone`),
		pendulumZone: (side, number) => (side === "you" ? `Your Pendulum Zone ${number}` : `${RIVAL}'s Pendulum Zone ${number}`),
		extraDeck: (side, count) => (side === "you" ? `Your Extra Deck: ${count}` : `${RIVAL}'s Extra Deck: ${count}`),
		banished: (side, count) => (side === "you" ? `Your banished cards: ${count}` : `${RIVAL}'s banished cards: ${count}`),
		faceDownCards: (count) => `${count} face-down ${count === 1 ? "card" : "cards"}`,
		faceUp: "face-up",
		pileEmpty: "No card here.",
		closePile: "Close",
		empty: "empty",
		faceDown: "face-down",
		inDefense: "Defense Position",
		hasEffect: "has an effect",
		quickMark: "Quick Effect",
		hand: "Your hand",
		deck: (count) => `Your Deck: ${count} ${count === 1 ? "card" : "cards"}`,
		graveyard: (side, count) => (side === "you" ? `Your Graveyard: ${count}` : `${RIVAL}'s Graveyard: ${count}`),
		board: "The duel board",
		phaseBar: "Phases of the turn",
		play: "Play",
		replay: "Play again",
		continueWith: (title) => `Play: ${title}`,
		locked: "Solve the one before to open this",
		solvedMark: "solved",
		starMark: "solved without a hint",
		allDone: "You finished every level. You can replay any of them.",
		levelOf: (number, total) => `Level ${number} of ${total}`,
		draw: "Draw",
		endTurn: "End turn",
		rivalNext: `${RIVAL}'s turn: next`,
		pass: "Let it happen",
		attackDirectly: "Attack directly",
		turnCard: (card) => `Turn ${card}`,
		useEffect: "Use its effect",
		cancel: "Put the card back",
		undo: "Go back one step",
		restart: "Start again",
		hint: "Hint",
		noHint: "No way to the goal from here. Go back one step, or start again.",
		showMe: "Show me",
		watchFirst: "Watch first",
		demoStep: (number, total) => `Step ${number} of ${total}`,
		demoNext: "Next",
		demoAgain: "Again",
		demoDone: "My turn!",
		backToMap: "Back to the map",
		backHome: "Back to home",
		nextLevel: "Next level",
		quizLink: "Extra: the Mission 1 quiz",
		calm: "Calm mode",
		calmHint: "Turns off all movement.",
		calmDevice: "Your device also asks for less motion, so movement stays off.",
		sound: "Voice and sounds",
		soundHint: "Reads each line aloud and plays small sounds. Off until you turn it on.",
		onTheCard: "On the card:",
		meaning: "It means:",
		yourTurn: "Your turn.",
		rivalTurn: `${RIVAL}'s turn. Tap Next to watch each step.`,
		answerNow: "Freeze! Tap your Set Trap, or a card whose effect you can use now, or let it happen.",
		selected: (card) => `${card} is picked.`,
		chooseZone: "Tap a glowing zone.",
		chooseTarget: "Now tap the Monster for this card.",
		chooseTributes: (left) => (left === 1 ? "Tap one of your Monsters to Tribute it." : `Tap ${left} of your Monsters to Tribute them.`),
		chooseAttackTarget: "Tap what it should attack.",
		chooseDiscard: "Pay the cost: tap another card in your hand to discard it.",
		chooseGrave: "Tap a Graveyard, then tap the Monster to target.",
		chooseRitual: (sum, need) => `Tap the Monsters to Tribute, in your hand or on the field. Levels: ${sum} of ${need}.`,
		chooseFusion: "Tap the Monsters the Fusion Monster names, in your hand or on the field.",
		chooseExtra: "Tap a Monster in your Extra Deck.",
		chooseSynchro: (sum, level) => `Tap one Tuner and the other Monsters. Levels: ${sum} of ${level}.`,
		chooseXyz: (count, level) => `Tap ${count} Level ${level} Monsters.`,
		chooseLink: (count) => `Tap ${count} Monsters.`,
		choosePendulum: (low, high) => `Scales ${low} and ${high}: tap the Monsters in your hand whose Level is between them.`,
		confirmSummon: "Summon!",
		specialSummon: "Special Summon it",
		setFaceDown: "Set it face-down",
		pendulumSummon: "Pendulum Summon",
		detach: "Detach a material",
		useFromHand: "Discard it: Quick Effect",
		solved: "You did it!",
		solvedFirstTry: "First try, no help. That rule is yours!",
		solvedWithHint: "Solved with a hint. Play it again to earn the star.",
		notYet: "Not this time.",
		fails: {
			lost: "Your Life Points reached 0.",
			"monster-lost": "You lost a Monster you needed.",
			"lp-lost": "You lost too many Life Points.",
			"out-of-moves": "Nothing left to do, and the goal is not reached.",
			"out-of-turns": "The turn is over, and the goal is not reached.",
		},
		reasons: {
			"duel-over": "The duel is over.",
			"answer-first": "First choose: answer, or let it happen.",
			"not-in-hand": "That card is not in your hand.",
			"wrong-zone": "Wrong row! Monsters go in Monster Zones. Spells and Traps go in the row behind.",
			"zone-taken": "That zone is taken. Pick an empty one.",
			"summon-used": "Only one Normal Summon per turn, and you used it.",
			"wrong-tributes": "This Monster needs Tributes: one for Level 5 or 6, two for Level 7 or more.",
			"not-main-phase": "That is for your Main Phase: Summons, Spells, Setting a Trap, turning a Monster, and effects without Quick Effect.",
			"no-target": "This card needs a Monster to target.",
			"draw-first": "Draw your card first.",
			"already-drew": "You draw one card, in the Draw Phase.",
			"first-turn-no-draw": "The player who goes first does not draw on the first turn.",
			"cannot-go-back": "Phases only go forward.",
			"first-turn-no-battle": "Nobody attacks on the very first turn of a duel.",
			"not-battle-phase": "Attacks happen in the Battle Phase.",
			"no-monster": "There is no Monster there.",
			"defense-cannot-attack": "A Monster in Defense Position cannot attack. Turn it first.",
			"already-attacked": "This Monster already attacked this turn.",
			"monster-in-the-way": "A Monster is in the way. A direct attack needs an empty field.",
			"trap-just-set": "Not yet! A Trap cannot be activated the turn it was Set.",
			"nothing-to-answer": "Your Trap waits for the rival to do something.",
			"cannot-answer-that": "This Trap does not answer that.",
			"just-summoned": "A Monster cannot change position the turn it was Summoned.",
			"position-used": "This Monster already changed position this turn.",
			"cost-needed": "Pay the cost first: discard 1 other card from your hand. No card to discard, no activation.",
			"nothing-to-hit": "There is nothing for this card to destroy, so it cannot be activated.",
			"no-ability": "This Monster has no effect to use.",
			"not-quick": "This Monster effect has no (Quick Effect), so it only works in your own Main Phase.",
			"once-per-turn": "This effect can be used only once per turn, and you used it already.",
			"extra-zone": "That is the Extra Monster Zone. Only a Monster from the Extra Deck goes there. A Link Monster goes there, or where another Link Monster points.",
			"field-zone": "A Field Spell goes in the Field Zone, and nothing else goes there.",
			"no-free-zone": "There is no empty Main Monster Zone for the Monster.",
			"one-per-turn": "The card says it: you can only activate 1 card with this name per turn.",
			"deck-too-small": "Your Deck does not have enough cards for what this card says, so it cannot be activated.",
			"no-ritual-monster": "The Monster this Ritual Spell names must be in your hand.",
			"wrong-materials": "Those are not the right Monsters. Read the first line of the card again.",
			"levels-too-low": "The Levels of the Monsters you Tribute do not reach the number on the Ritual Spell.",
			"too-many-tributes": "One Tribute too many. Tribute only what the Ritual Spell needs.",
			"not-in-extra": "That Monster is not in your Extra Deck.",
			"needs-spell": "A Fusion Summon needs a card like Polymerization. The Monsters do not fuse by themselves.",
			"needs-one-tuner": "A Synchro Summon needs exactly 1 Tuner, plus 1 or more Monsters that are not Tuners.",
			"levels-not-equal": "For a Synchro Summon the Levels must add up exactly to the Level of the Monster.",
			"wrong-levels": "Read the first line: an Xyz Summon needs that many Monsters, all of that Level.",
			"link-count": "A Link Summon needs as many Monsters as the Link Rating.",
			"link-no-defense": "A Link Monster has no DEF. It can never be in Defense Position.",
			"no-material": "No material is left to detach, so the cost cannot be paid.",
			"pendulum-zone": "A Pendulum Monster becomes a Scale in the leftmost or rightmost Spell & Trap Zone: the Pendulum Zones.",
			"no-scales": "A Pendulum Summon needs a Scale in each of your two Pendulum Zones.",
			"pendulum-used": "Only one Pendulum Summon per turn.",
			"level-not-between": "Its Level is not between your two Scales. The numbers of the Scales themselves do not count.",
			"condition-not-met": "Read the card again: what it asks for is not true right now.",
			"equip-only": "Read the card: this Equip Spell can only be equipped to a monster of one Type.",
			"cannot-set": "Here only a Quick-Play Spell is Set face-down. Other Spells are activated at once.",
			"not-damage-step": "Not yet: the card says \"During damage calculation\". Wait for the Damage Step.",
			"damage-step-closed": "This is the Damage Step: only cards that change ATK, or that say so, can still be used.",
			"swords-lock": "Swords of Revealing Light is face-up: your Monsters cannot declare an attack.",
			"jinzo-lock": "Jinzo is on the field: no Trap Card can be activated.",
			"special-only": "This Monster cannot be Normal Summoned. Read its card: it is Summoned in its own way.",
			"not-properly-summoned": "This Monster was never Summoned in its own way, so it cannot come back from the Graveyard.",
		},
		rulesTitle: "Rules you have met",
		albumTitle: "Your card album",
		albumEmpty: "Cards you play with will appear here.",
		certificateTitle: "Junior Duelist",
		certificateText: "You won a whole duel: Summons, battles, a Spell and a Trap. You know how a duel works!",
		certificateFinalText: "You won a duel on the whole mat, with your Extra Deck. You can read a card and play what it says!",
		print: "Print my certificate",
		narrate(event) {
			const who = "side" in event && event.side === "rival" ? RIVAL : "You";
			const mine = "side" in event && event.side === "you";
			const s = mine ? "" : "s";
			switch (event.type) {
				case "special": {
					const used = list(event.materials.map(name));
					const go = event.materials.length === 1 ? "goes" : "go";
					switch (event.how) {
						case "revive":
							return `${who} Special Summon${s} ${name(event.card)} from ${event.from === "you" ? "your" : `${RIVAL}'s`} Graveyard.`;
						case "ritual":
							return `${who} Tribute${s} ${used} and Ritual Summon${s} ${name(event.card)} from the hand.`;
						case "fusion":
							return `${used} ${go} to the Graveyard. ${who} Fusion Summon${s} ${name(event.card)} from the Extra Deck.`;
						case "synchro":
							return `${used} ${go} to the Graveyard: Level ${event.materials.map((card) => monsterOf(card).level).join(" + ")} = ${monsterOf(event.card).level}. ${who} Synchro Summon${s} ${name(event.card)}.`;
						case "xyz":
							return `${used} ${go} under ${name(event.card)} as materials, not to the Graveyard. ${who} Xyz Summon${s} ${name(event.card)}.`;
						case "link":
							return `${used} ${go} to the Graveyard. ${who} Link Summon${s} ${name(event.card)} in the Extra Monster Zone.`;
						case "own":
							return `${who} Special Summon${s} ${name(event.card)} from the hand, as its card says. The Normal Summon is still free.`;
					}
				}
				case "field":
					return `${name(event.card)} stays face-up in the Field Zone. It counts for both players' Monsters.`;
				case "banished":
					return event.faceDown ? `${who} banish${mine ? "" : "es"} ${event.cards.length} ${event.cards.length === 1 ? "card" : "cards"} face-down. Banished cards are not in the Graveyard.` : `${list(event.cards.map(name))} ${event.cards.length === 1 ? "is" : "are"} banished. Banished cards do not go to the Graveyard.`;
				case "to-extra":
					return `${name(event.card)} is a Pendulum Monster: it goes face-up to the Extra Deck, not to the Graveyard.`;
				case "detached":
					return `${who} detach${mine ? "" : "es"} ${name(event.material)} from ${name(event.card)} to pay the cost. It goes to the Graveyard.`;
				case "scale":
					return `${name(event.card)} is placed in a Pendulum Zone, like a Spell: Pendulum Scale ${event.scale}.`;
				case "pendulum":
					return `Pendulum Summon! Scales ${event.low} and ${event.high}: ${list(event.cards.map(name))} ${event.cards.length === 1 ? "comes" : "come"} from the hand.`;
				case "hand-effect":
					return `${who} discard${s} ${name(event.card)} from the hand to pay the cost of its Quick Effect: no battle damage from this battle.`;
				case "skip-draw":
					return mine ? "You skip your Draw Phase, as your card said: no draw this turn." : `${RIVAL} skips its Draw Phase: no draw this turn.`;
				case "drew":
					return mine ? `You draw ${name(event.card)}.` : `${RIVAL} draws a card.`;
				case "phase":
					return event.phase === "end" ? `End Phase. ${mine ? "Your" : `${RIVAL}'s`} turn is over.` : `${phases[event.phase]}.`;
				case "turn":
					return mine ? "Your turn!" : `${RIVAL}'s turn.`;
				case "summoned":
					return event.tributes.length > 0 ? `${who} Tribute${mine ? "" : "s"} ${list(event.tributes.map(name))} to Summon ${name(event.card)}.` : `${who} Summon${mine ? "" : "s"} ${name(event.card)} in Attack Position.`;
				case "activated":
					return `${who} activate${mine ? "" : "s"} the Spell ${name(event.card)}${event.target ? ` and target${mine ? "" : "s"} ${name(event.target)}` : ""}.`;
				case "discarded":
					return `${who} discard${mine ? "" : "s"} ${name(event.card)} to pay the cost.`;
				case "ability":
					return `${who} use${mine ? "" : "s"} the effect of ${name(event.card)} and target${mine ? "" : "s"} ${name(event.target)}.`;
				case "trigger":
					return `${name(event.card)} says "${event.word === "when" ? "When" : "If"}…": it gets its chance! ${who} deal${mine ? "" : "s"} ${event.amount} damage.`;
				case "missed":
					return `${name(event.card)} missed its chance! Its card says "When…": it only gets its chance if going to the Graveyard happens last. Here, ${event.last === "activation" ? "activating the Spell" : "the Summon"} came last.`;
				case "burned":
					return `${name(event.card)}: ${mine ? "you inflict" : `${RIVAL} inflicts`} ${event.amount} damage.`;
				case "added":
					return `${name(event.card)} goes to ${mine ? "your" : `${RIVAL}'s`} hand, from the ${event.from === "deck" ? "Deck" : "Graveyard"}.`;
				case "stays":
					return cardOf(event.card).kind !== "monster" && (cardOf(event.card) as { icon?: string }).icon === "continuous" ? `${name(event.card)} stays face-up on the field: it is a Continuous Spell. Its effect lasts while it is there.` : `${name(event.card)} stays face-up on the field. Its effect lasts while it is there.`;
				case "equipped":
					return `${name(event.card)} is equipped to ${name(event.target)}. If ${name(event.target)} leaves the field, it goes too.`;
				case "battle-ended":
					return mine ? "Your Battle Phase is over." : `${RIVAL}'s Battle Phase is over.`;
				case "set":
					return `You Set ${name(event.card)} face-down. It has to wait for the next turn.`;
				case "gained":
					return `${who} gain${mine ? "" : "s"} ${event.amount} Life Points: ${event.lp} now.`;
				case "boosted":
					return `${name(event.card)} ${event.amount > 0 ? "gains" : "loses"} ${Math.abs(event.amount)} ATK: ${event.atk} ${event.lasting === "damage-step" ? "during the Damage Step only" : event.lasting === "for-good" ? "for good" : "until the end of the turn"}.`;
				case "destroyed":
					return `${name(event.card)} is destroyed and goes to the Graveyard.`;
				case "no-effect":
					return `${name(event.card)} resolves, but there is nothing left for it to do.`;
				case "position":
					return event.position === "defense" ? `${name(event.card)} turns to Defense Position. Its DEF counts now.` : `${name(event.card)} turns to Attack Position.`;
				case "attack-declared":
					return event.target ? `${name(event.attacker)} attacks ${name(event.target)}!` : `${name(event.attacker)} attacks directly!`;
				case "damage-step":
					return "Damage Step: just before damage is calculated.";
				case "window":
					if (event.step === "damage") return mine ? "Stop! Kuriboh and cards that change ATK can still act." : `${RIVAL} can still change ATK.`;
					if (!mine) return `${RIVAL} can answer with a Set Trap.`;
					return event.kind === "attack" ? "Freeze! You can answer now." : "Freeze! You can answer now. Your answer will resolve first.";
				case "sprung":
					return `${who} flip${mine ? "" : "s"} a Trap: ${name(event.card)}!`;
				case "attack-stopped":
					return `The attack of ${name(event.attacker)} is stopped.`;
				case "returned":
					return `${name(event.card)} returns to ${mine ? "your" : `${RIVAL}'s`} hand.`;
				case "chain":
					return event.link === 1 ? `${name(event.card)} starts a Chain: Chain Link 1.` : `${name(event.card)} goes on top: Chain Link ${event.link}.`;
				case "resolve":
					return `Chain Link ${event.link} resolves: ${name(event.card)}.`;
				case "battle": {
					const [a, d, x, y] = [name(event.attacker), name(event.defender), event.attackerValue, event.defenderValue];
					if (event.defenderPosition === "attack") {
						if (x > y) return `${a} wins: ${x} − ${y} = ${x - y}. ${d} is destroyed.`;
						if (x < y) return `${d} is stronger: ${y} − ${x} = ${y - x}. ${a} is destroyed.`;
						return `${x} against ${y}: a tie. Both Monsters are destroyed.`;
					}
					if (x > y) return `${x} ATK beats ${y} DEF: ${d} is destroyed. No damage.`;
					if (x < y) return `${y} DEF holds: ${y} − ${x} = ${y - x}. Nothing is destroyed.`;
					return `${x} ATK against ${y} DEF: nothing happens.`;
				}
				case "direct":
					return `Nothing is in the way: ${event.amount} damage.`;
				case "lp":
					return `${who} lose${mine ? "" : "s"} ${event.from - event.to} Life Points: ${event.to} left.`;
				case "deck-out":
					return `${mine ? "Your" : `${RIVAL}'s`} Deck is empty: no card to draw.`;
				case "exodia":
					return mine ? `All five pieces of ${name("exodia-the-forbidden-one")} are in your hand: you win at once, whatever the Life Points!` : `${RIVAL} holds all five pieces of ${name("exodia-the-forbidden-one")}.`;
				case "won":
					return mine ? "You win the duel!" : `${RIVAL} wins this duel.`;
			}
		},
		describeMove(move, board) {
			const mine = board.pending ? board[board.turn === "you" ? "rival" : "you"] : board[board.turn];
			const theirs = board.pending ? board[board.turn] : board.turn === "you" ? board.rival : board.you;
			switch (move.type) {
				case "draw":
					return "Draw your card.";
				case "phase":
					return move.to === "end" ? "End your turn." : `Go to the ${phases[move.to]}.`;
				case "place": {
					const using = list((move.materials ?? []).map((item) => name(item.from === "hand" ? item.card : (mine.monsters[item.zone]?.card ?? move.card))));
					const buried = move.grave ? board[move.grave.side].graveyard[move.grave.index] : undefined;
					if (buried) return `Activate ${name(move.card)} and target ${name(buried)} in ${move.grave?.side === "you" ? "your" : `${RIVAL}'s`} Graveyard.`;
					if (move.summon) return `Activate ${name(move.card)}: Fusion Summon ${name(move.summon)} with ${using}.`;
					if (move.materials) return `Activate ${name(move.card)} and Tribute ${using}.`;
					if (move.special) return `Special Summon ${name(move.card)} from your hand, as its card says.`;
					if (move.row === "field") return `Play ${name(move.card)} in your Field Zone.`;
					if (move.row === "backrow" && cardOf(move.card).kind === "monster") return `Place ${name(move.card)} in a Pendulum Zone.`;
					if ((move.tributes?.length ?? 0) > 0) return `Summon ${name(move.card)} by Tributing ${list((move.tributes ?? []).map((zone) => name(mine.monsters[zone]?.card ?? move.card)))}.`;
					return move.discard ? `Activate ${name(move.card)} and discard ${name(move.discard)} as the cost.` : `Play ${name(move.card)}.`;
				}
				case "position": {
					const slot = mine.monsters[move.zone];
					return slot ? `Turn ${name(slot.card)}.` : "";
				}
				case "attack": {
					const attacker = mine.monsters[move.attacker];
					const target = move.target === "direct" ? null : theirs.monsters[move.target];
					if (!attacker) return "";
					return target ? `Attack ${name(target.card)} with ${name(attacker.card)} (${atkOf(attacker, board)} ATK).` : `Attack directly with ${name(attacker.card)}.`;
				}
				case "ability": {
					const slot = mine.monsters[move.zone];
					const target = move.target === undefined ? null : theirs.monsters[move.target];
					if (slot && monsterOf(slot.card).detach) return `Detach a material from ${name(slot.card)} to negate the attack.`;
					return slot && target ? `Use the effect of ${name(slot.card)} and target ${name(target.card)}.` : "";
				}
				case "spring": {
					const slot = board.you.backrow[move.zone];
					return slot ? `Flip your Trap ${name(slot.card)}.` : "";
				}
				case "extra":
					return `Tap your Extra Deck: Summon ${name(move.card)} with ${list(move.materials.map((zone) => name(mine.monsters[zone]?.card ?? move.card)))}.`;
				case "pendulum":
					return `Pendulum Summon ${list(move.cards.map(name))} from your hand.`;
				case "hand":
					return `Discard ${name(move.card)} from your hand to use its Quick Effect.`;
				case "pass":
					return "Let it happen.";
			}
		},
	};
}
export const en: PlayCopy = englishCopy("Nox");
