import type { CardDef } from "./effects";

/** Exact inventory, not a playable deck. An absent code is deliberately unsupported, never substituted. */
export interface DeckEntry { readonly name: string; readonly count: number; readonly code?: string }
export interface DeckManifest {
 readonly id: number; readonly name: string; readonly url: string; readonly inventory: string; readonly column: string;
 readonly main: readonly DeckEntry[]; readonly extra: readonly DeckEntry[]; readonly side: readonly DeckEntry[];
}
/** Frozen from the local research inventories' L1 columns, 2026-11-24. Side is inventory only. */
const DECKS: readonly DeckManifest[] = [
  {
    "id": 746021,
    "name": "Blue-Eyes",
    "url": "https://ygoprodeck.com/deck/primite-blue-eyes-746021",
    "inventory": "docs/research/blue-eyes-dark-time-wizard-coverage-2026-11.md",
    "column": "L1 M/E/S",
    "main": [
      {
        "name": "Ash Blossom & Joyous Spring",
        "count": 3,
        "code": "ash-blossom-joyous-spring"
      },
      {
        "name": "Bingo Machine, Go!!!",
        "count": 1,
        "code": "bingo-machine-go"
      },
      {
        "name": "Blue-Eyes White Dragon",
        "count": 2,
        "code": "blue-eyes-white-dragon"
      },
      {
        "name": "Blue-Eyes White Dragon, the White Phantom Beast",
        "count": 1,
        "code": "blue-eyes-white-dragon-the-white-phantom-beast"
      },
      {
        "name": "Bystial Magnamhut",
        "count": 1,
        "code": "bystial-magnamhut"
      },
      {
        "name": "Deep-Eyes White Dragon, the Blue Abyss",
        "count": 3,
        "code": "deep-eyes-white-dragon"
      },
      {
        "name": "Dominus Purge",
        "count": 3,
        "code": "dominus-purge"
      },
      {
        "name": "Droll & Lock Bird",
        "count": 1,
        "code": "droll-lock-bird"
      },
      {
        "name": "Effect Veiler",
        "count": 3,
        "code": "effect-veiler"
      },
      {
        "name": "Ghost Ogre & Snow Rabbit",
        "count": 3,
        "code": "ghost-ogre-snow-rabbit"
      },
      {
        "name": "Infinite Impermanence",
        "count": 3,
        "code": "infinite-impermanence"
      },
      {
        "name": "Maiden of White",
        "count": 3,
        "code": "maiden-of-white"
      },
      {
        "name": "Majesty of the White Dragons",
        "count": 1,
        "code": "majesty-of-the-white-dragons"
      },
      {
        "name": "Mausoleum of White",
        "count": 1,
        "code": "mausoleum-of-white"
      },
      {
        "name": "Pot of Prosperity",
        "count": 1,
        "code": "pot-of-prosperity"
      },
      {
        "name": "Primite Dragon Ether Beryl",
        "count": 1,
        "code": "primite-dragon-ether-beryl"
      },
      {
        "name": "Primite Drillbeam",
        "count": 1,
        "code": "primite-drillbeam"
      },
      {
        "name": "Primite Lordly Lode",
        "count": 3,
        "code": "primite-lordly-lode"
      },
      {
        "name": "Roar of the Blue-Eyed Dragons",
        "count": 1,
        "code": "roar-of-the-blue-eyed-dragons"
      },
      {
        "name": "Sage with Eyes of Blue",
        "count": 3,
        "code": "sage-with-eyes-of-blue"
      },
      {
        "name": "True Light",
        "count": 1,
        "code": "true-light"
      },
      {
        "name": "Wishes for Eyes of Blue",
        "count": 3,
        "code": "wishes-for-eyes-of-blue"
      }
    ],
    "extra": [
      {
        "name": "Ancient Fairy Life Dragon",
        "count": 1,
        "code": "ancient-fairy-life-dragon"
      },
      {
        "name": "Blue-Eyes Spirit Dragon",
        "count": 2,
        "code": "blue-eyes-spirit-dragon"
      },
      {
        "name": "Blue-Eyes Tyrant Dragon",
        "count": 1,
        "code": "blue-eyes-tyrant-dragon"
      },
      {
        "name": "Blue-Eyes Ultimate Spirit Dragon",
        "count": 1,
        "code": "blue-eyes-ultimate-spirit-dragon"
      },
      {
        "name": "Crimson Dragon",
        "count": 1,
        "code": "crimson-dragon"
      },
      {
        "name": "Hieratic Seal of the Heavenly Spheres",
        "count": 2,
        "code": "hieratic-seal-of-the-heavenly-spheres"
      },
      {
        "name": "Lightstorm Dragon",
        "count": 1,
        "code": "lightstorm-dragon"
      },
      {
        "name": "Neo Blue-Eyes Ultimate Dragon",
        "count": 1,
        "code": "neo-blue-eyes-ultimate-dragon"
      },
      {
        "name": "Psychic End Punisher",
        "count": 1,
        "code": "psychic-end-punisher"
      },
      {
        "name": "Spirit with Eyes of Blue",
        "count": 2,
        "code": "spirit-with-eyes-of-blue"
      },
      {
        "name": "Stardust Sifr Divine Dragon",
        "count": 1,
        "code": "stardust-sifr-divine-dragon"
      },
      {
        "name": "Super Starslayer TY-PHON - Sky Crisis",
        "count": 1,
        "code": "super-starslayer-ty-phon-sky-crisis"
      }
    ],
    "side": [
      {
        "name": "Mulcharmy Fuwalos",
        "count": 3,
        "code": "mulcharmy-fuwalos"
      },
      {
        "name": "Mulcharmy Purulia",
        "count": 3,
        "code": "mulcharmy-purulia"
      },
      {
        "name": "PSY-Frame Driver",
        "count": 1
      },
      {
        "name": "PSY-Framegear Gamma",
        "count": 1
      },
      {
        "name": "Solemn Judgment",
        "count": 1,
        "code": "solemn-judgment"
      },
      {
        "name": "Solemn Warning",
        "count": 3
      },
      {
        "name": "The Great Gallant Bandit",
        "count": 3
      }
    ]
  },
  {
    "id": 745443,
    "name": "Sky Striker",
    "url": "https://ygoprodeck.com/deck/sky-striker-745443",
    "inventory": "docs/research/meta-decks-engine-coverage-2026-11.md",
    "column": "L1 M/E/S",
    "main": [
      {
        "name": "Ash Blossom & Joyous Spring",
        "count": 3,
        "code": "ash-blossom-joyous-spring"
      },
      {
        "name": "Lightning Storm",
        "count": 2,
        "code": "lightning-storm"
      },
      {
        "name": "Mulcharmy Fuwalos",
        "count": 3,
        "code": "mulcharmy-fuwalos"
      },
      {
        "name": "Mulcharmy Purulia",
        "count": 3,
        "code": "mulcharmy-purulia"
      },
      {
        "name": "Mystical Space Typhoon",
        "count": 1,
        "code": "mystical-space-typhoon"
      },
      {
        "name": "Pot of Sloth",
        "count": 2,
        "code": "pot-of-sloth"
      },
      {
        "name": "Radiant Typhoon Vision",
        "count": 3,
        "code": "radiant-typhoon-vision"
      },
      {
        "name": "Raigeki",
        "count": 3,
        "code": "raigeki"
      },
      {
        "name": "Sky Striker Ace - Raye",
        "count": 3,
        "code": "sky-striker-ace-raye"
      },
      {
        "name": "Sky Striker Ace - Roze",
        "count": 2,
        "code": "sky-striker-ace-roze"
      },
      {
        "name": "Sky Striker Mecha - Shark Cannon",
        "count": 1,
        "code": "sky-striker-mecha-shark-cannon"
      },
      {
        "name": "Sky Striker Mecha - Widow Anchor",
        "count": 1,
        "code": "sky-striker-mecha-widow-anchor"
      },
      {
        "name": "Sky Striker Mobilize - Engage!",
        "count": 2,
        "code": "sky-striker-mobilize-engage"
      },
      {
        "name": "Sky Striker Mobilize - Linkage!",
        "count": 3,
        "code": "sky-striker-mobilize-linkage"
      },
      {
        "name": "Sky Striker Special Maneuver - Lemnisgate!",
        "count": 2,
        "code": "sky-striker-special-maneuver-lemnisgate"
      },
      {
        "name": "The Fallen & The Virtuous",
        "count": 3,
        "code": "the-fallen-and-the-virtuous"
      },
      {
        "name": "Upstart Goblin",
        "count": 3,
        "code": "upstart-goblin"
      }
    ],
    "extra": [
      {
        "name": "Ecclesia and the Dark Dragon",
        "count": 1,
        "code": "ecclesia-and-the-dark-dragon"
      },
      {
        "name": "Prototype Sky Striker Ace - Amatsu",
        "count": 1,
        "code": "prototype-sky-striker-ace-amatsu"
      },
      {
        "name": "S:P Little Knight",
        "count": 1,
        "code": "sp-little-knight"
      },
      {
        "name": "Sky Striker Ace - Azalea",
        "count": 1,
        "code": "sky-striker-ace-azalea"
      },
      {
        "name": "Sky Striker Ace - Hayate",
        "count": 2,
        "code": "sky-striker-ace-hayate"
      },
      {
        "name": "Sky Striker Ace - Kagari",
        "count": 3,
        "code": "sky-striker-ace-kagari"
      },
      {
        "name": "Sky Striker Ace - Shizuku",
        "count": 1,
        "code": "sky-striker-ace-shizuku"
      },
      {
        "name": "Sky Striker Ace - Zeke",
        "count": 1,
        "code": "sky-striker-ace-zeke"
      },
      {
        "name": "Sky Striker Ace = Zero",
        "count": 3,
        "code": "sky-striker-ace-zero"
      },
      {
        "name": "The Dragon that Devours the Dogma",
        "count": 1,
        "code": "the-dragon-that-devours-the-dogma"
      }
    ],
    "side": [
      {
        "name": "Cosmic Cyclone",
        "count": 3
      },
      {
        "name": "Forbidden Crown",
        "count": 2
      },
      {
        "name": "Forbidden Droplet",
        "count": 3
      },
      {
        "name": "Ghost Ogre & Snow Rabbit",
        "count": 3,
        "code": "ghost-ogre-snow-rabbit"
      },
      {
        "name": "Harpie's Feather Duster",
        "count": 1
      },
      {
        "name": "Solemn Accusation",
        "count": 2
      },
      {
        "name": "Surgical Striker - H.A.M.P.",
        "count": 1
      }
    ]
  }
];

/** Registration is only a first gate, NOT the per-effect/ruling/French/review coverage definition of done. */
export function deckReadiness(deck: DeckManifest, defs: Readonly<Record<string, CardDef>>) {
 const cards = [...deck.main, ...deck.extra].map((entry) => {
  const def = entry.code === undefined ? undefined : defs[entry.code];
  // A definition whose printed name is not the manifest's (missing, or a wrong code) is not counted as this card.
  return { ...entry, status: !def ? "missing" as const : def.unmodelled?.length || def.facts?.name !== entry.name ? "partial" as const : "registered" as const };
 });
 // This inventory cannot certify source coverage, review, lifecycle or full-duel acceptance.
 return { cards, ready: false as const };
}

const deepFreeze = <T>(value: T): T => {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const inner of Object.values(value as object)) deepFreeze(inner);
	}
	return value;
};

/** The two exact lists, frozen at runtime too: no caller can change the shared inventory. */
export const READINESS_DECKS: readonly DeckManifest[] = deepFreeze(DECKS);
