import { expect, it } from "vitest";
import { CARD_DEFS, READINESS_DECKS, deckReadiness } from "../src";

it("freezes the exact 746021 and 745443 inventories without passing off absent cards as supported", () => {
	const totals = READINESS_DECKS.map((deck) => [deck.id, ...(["main", "extra", "side"] as const).map((zone) => deck[zone].reduce((sum, card) => sum + card.count, 0))]);
	expect(totals).toEqual([[746021, 43, 15, 15], [745443, 40, 15, 15]]);
	const union = new Map(READINESS_DECKS.flatMap((deck) => deckReadiness(deck, CARD_DEFS).cards.map((card) => [card.name, card] as const)));
	expect(union.size).toBe(60);
	expect([...union.values()].filter((card) => card.status === "missing")).toHaveLength(0);
	expect([...union.values()].filter((card) => card.status === "registered").map((card) => card.name).sort()).toEqual(["Ancient Fairy Life Dragon", "Ash Blossom & Joyous Spring", "Bingo Machine, Go!!!", "Blue-Eyes Spirit Dragon", "Blue-Eyes Tyrant Dragon", "Blue-Eyes Ultimate Spirit Dragon", "Blue-Eyes White Dragon", "Blue-Eyes White Dragon, the White Phantom Beast", "Bystial Magnamhut", "Crimson Dragon", "Deep-Eyes White Dragon, the Blue Abyss", "Dominus Purge", "Droll & Lock Bird", "Ecclesia and the Dark Dragon", "Effect Veiler", "Ghost Ogre & Snow Rabbit", "Hieratic Seal of the Heavenly Spheres", "Infinite Impermanence", "Lightning Storm", "Lightstorm Dragon", "Maiden of White", "Majesty of the White Dragons", "Mausoleum of White", "Mulcharmy Fuwalos", "Mulcharmy Purulia", "Mystical Space Typhoon", "Neo Blue-Eyes Ultimate Dragon", "Pot of Prosperity", "Pot of Sloth", "Primite Dragon Ether Beryl", "Primite Drillbeam", "Primite Lordly Lode", "Prototype Sky Striker Ace - Amatsu", "Psychic End Punisher", "Radiant Typhoon Vision", "Raigeki", "Roar of the Blue-Eyed Dragons", "S:P Little Knight", "Sage with Eyes of Blue", "Sky Striker Ace - Azalea", "Sky Striker Ace - Hayate", "Sky Striker Ace - Kagari", "Sky Striker Ace - Raye", "Sky Striker Ace - Roze", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Zeke", "Sky Striker Ace = Zero", "Sky Striker Mecha - Shark Cannon", "Sky Striker Mecha - Widow Anchor", "Sky Striker Mobilize - Engage!", "Sky Striker Mobilize - Linkage!", "Sky Striker Special Maneuver - Lemnisgate!", "Spirit with Eyes of Blue", "Stardust Sifr Divine Dragon", "Super Starslayer TY-PHON - Sky Crisis", "The Dragon that Devours the Dogma", "The Fallen & The Virtuous", "True Light", "Upstart Goblin", "Wishes for Eyes of Blue"]);
	expect(READINESS_DECKS.map((deck) => deckReadiness(deck, CARD_DEFS).ready)).toEqual([false, false]);
	expect(READINESS_DECKS[0]!.main).toContainEqual({ name: "Blue-Eyes White Dragon, the White Phantom Beast", count: 1, code: "blue-eyes-white-dragon-the-white-phantom-beast" });
	expect(READINESS_DECKS[1]!.extra).toContainEqual({ name: "Sky Striker Ace = Zero", count: 3, code: "sky-striker-ace-zero" });
	expect([...union.keys()]).not.toContain("Cosmic Cyclone"); // Side-only inventory, not a Main/Extra completion target.
});

it("counts a card as registered only when its printed name matches the manifest, and keeps the inventory frozen (review)", () => {
	const misnamed = { ...CARD_DEFS, "solemn-judgment": { ...CARD_DEFS["solemn-judgment"]!, facts: { name: "Solemn Judgment" } } };
	const deck = { ...READINESS_DECKS[0]!, main: [{ name: "Solemn Warning", count: 1, code: "solemn-judgment" }], extra: [] };
	expect(deckReadiness(deck, misnamed).cards[0]!.status).toBe("partial");
	expect(Object.isFrozen(READINESS_DECKS) && Object.isFrozen(READINESS_DECKS[0]!.main) && Object.isFrozen(READINESS_DECKS[0]!.main[0])).toBe(true);
});
