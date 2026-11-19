// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, LanguageSwitcher } from "@/lib/i18n/provider";
import { LEVELS } from "@/lib/junior/play/levels";
import { PLAY_PROGRESS_KEY, emptyPlayProgress } from "@/lib/junior/play/progress";
import { JuniorPlay } from "./junior-play";

/* The page without 3D: the island world says it cannot draw, so the list of levels is the map. */
vi.mock("../world/island-world", () => ({
	IslandWorld: ({ onAvailable }: { onAvailable: (ok: boolean) => void }) => {
		useEffect(() => onAvailable(false), [onAvailable]);
		return null;
	},
}));

beforeEach(() => {
	window.localStorage.clear();
	window.localStorage.setItem("duel-academy-language", "en");
	document.documentElement.lang = "en";
	document.documentElement.dir = "ltr";
});
afterEach(() => {
	cleanup();
	document.documentElement.lang = "en";
	document.documentElement.dir = "ltr";
});

type User = ReturnType<typeof userEvent.setup>;
/** Opens the level with this title, every level before it already solved, past its demonstration if it has one. */
async function open(title: string): Promise<User> {
	const user = userEvent.setup();
	window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), levels: Object.fromEntries(LEVELS.map((level) => [level.id, { clean: true, firstTry: true }])) }));
	render(
		<LanguageProvider>
			<LanguageSwitcher />
			<JuniorPlay />
		</LanguageProvider>,
	);
	await user.click(await screen.findByRole("button", { name: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: solved`) }));
	return user;
}
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const status = () => within(screen.getByRole("main")).getByRole("status");
/** A card of the hand, by the name printed on it. */
function hand(name: string): HTMLElement {
	const cards = within(screen.getByRole("list", { name: "Your hand" })).getAllByRole("button");
	const found = cards.find((card) => (card.textContent ?? "").replace(/^[^A-Za-z0-9]+/, "").startsWith(name));
	if (!found) throw new Error(`no ${name} in hand`);
	return found;
}
const rivalNext = async (user: User) => user.click(button("Nox's turn: next"));
const battlePhase = async (user: User) => user.click(within(screen.getByRole("list", { name: "Phases of the turn" })).getByRole("button", { name: "Battle Phase" }));

describe("the whole mat", () => {
	it("names every zone, and opens the Graveyard so Monster Reborn can take a Monster from it", async () => {
		const user = await open("Either Graveyard");
		for (const name of [/^Your Main Monster Zone 5: empty/, /^Your Spell & Trap Zone 5: empty/, /^Your Field Zone: empty/, /^Your Extra Monster Zone: empty/, /^Nox's Extra Monster Zone: empty/]) expect(screen.getByLabelText(name)).toBeTruthy();
		expect(screen.getByLabelText("Nox's Extra Deck: 0").tagName).toBe("DIV");
		await user.click(hand("Monster Reborn"));
		expect(status().textContent).toMatch(/Tap a Graveyard, then tap the Monster to target/);
		expect(document.querySelector("[data-card-text]")?.textContent).toContain("Target 1 monster in either GY; Special Summon it.");
		await user.click(button("Nox's Graveyard: 1"));
		await user.click(within(screen.getByRole("region", { name: "Nox's Graveyard: 1" })).getByRole("button", { name: /Cosmo Queen/ }));
		expect(status().textContent).toMatch(/You activate the Spell Monster Reborn and target Cosmo Queen\. You Special Summon Cosmo Queen from Nox's Graveyard\./);
		expect(button(/^Your Main Monster Zone 2: Cosmo Queen, ATK 2900, DEF 2450/)).toBeTruthy();
		await battlePhase(user);
		await user.click(button(/^Your Main Monster Zone 2: Cosmo Queen/));
		await user.click(button(/^Nox's Main Monster Zone 1: Judge Man/));
		await user.click(button(/^Your Main Monster Zone 1: Destroyer Golem/));
		await user.click(button("Attack directly"));
		expect(status().textContent).toMatch(/You win the duel!/);
	});
	it("sends a Field Spell to the Field Zone only, and shows what it adds to both players' Monsters", async () => {
		const user = await open("Two Mountains");
		expect(screen.getByLabelText(/^Nox's Field Zone: Mountain, face-up/)).toBeTruthy();
		expect(button(/^Your Main Monster Zone 1: Sky Scout, ATK 2000, DEF 800/)).toBeTruthy();
		await user.click(hand("Mountain"));
		await user.click(button(/^Your Spell & Trap Zone 1: empty/));
		expect(status().textContent).toMatch(/A Field Spell goes in the Field Zone/);
		await user.click(hand("Mountain"));
		await user.click(button(/^Your Field Zone: empty/));
		expect(status().textContent).toMatch(/Mountain stays face-up in the Field Zone/);
		expect(button(/^Your Main Monster Zone 1: Sky Scout, ATK 2200, DEF 1000/)).toBeTruthy();
	});
	it("banishes the attacker with one Trap, and shows it among the banished cards, not in the Graveyard", async () => {
		const user = await open("Banished");
		await rivalNext(user);
		expect(status().textContent).toMatch(/Busy Bee attacks directly! Freeze!/);
		await user.click(button(/^Your Spell & Trap Zone 2: Dimensional Prison, face-down/));
		expect(status().textContent).toMatch(/Busy Bee is banished\. Banished cards do not go to the Graveyard\./);
		await user.click(button("Nox's banished cards: 1"));
		expect(within(screen.getByRole("region", { name: "Nox's banished cards: 1" })).getByRole("img", { name: "Busy Bee" })).toBeTruthy();
		expect(button("Nox's Graveyard: 0")).toBeTruthy();
		await rivalNext(user);
		expect(status().textContent).toMatch(/You did it!/);
	});
});

describe("a Ritual Summon", () => {
	it("adds up the Levels of the Tributes as they are tapped, and refuses a sum below the number on the Spell", async () => {
		const user = await open("8 or more");
		await user.click(hand("Black Luster Ritual"));
		expect(status().textContent).toMatch(/Levels: 0 of 8/);
		await user.click(button(/^Your Main Monster Zone 2: Silver Fang/));
		await user.click(button(/^Your Main Monster Zone 3: Sky Scout/));
		expect(status().textContent).toMatch(/Levels: 7 of 8/);
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/do not reach the number on the Ritual Spell/);
		await user.click(hand("Black Luster Ritual"));
		await user.click(button(/^Your Main Monster Zone 1: Ally of Justice Clausolas/));
		await user.click(button(/^Your Main Monster Zone 2: Silver Fang/));
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/You Tribute Ally of Justice Clausolas and Silver Fang and Ritual Summon Black Luster Soldier from the hand\./);
		expect(button(/^Your Main Monster Zone 1: Black Luster Soldier, ATK 3000, DEF 2500/)).toBeTruthy();
	});
});

describe("the Extra Deck", () => {
	it("refuses a Fusion Monster tapped in the Extra Deck, and Fusion Summons it with Polymerization", async () => {
		const user = await open("Two become one");
		/* "Show me" plays the rule on the whole mat, one step per tap. */
		await user.click(button("Show me"));
		expect(screen.getByRole("heading", { level: 3, name: "Watch first: Fusion Summon" })).toBeTruthy();
		await user.click(button("Next"));
		expect(status().textContent).toMatch(/You Fusion Summon Flame Swordsman from the Extra Deck/);
		await user.click(button("My turn!"));
		await user.click(button("Your Extra Deck: 1"));
		await user.click(within(screen.getByRole("region", { name: "Your Extra Deck: 1" })).getByRole("button", { name: /Flame Swordsman/ }));
		expect(status().textContent).toMatch(/A Fusion Summon needs a card like Polymerization/);
		await user.click(hand("Polymerization"));
		expect(status().textContent).toMatch(/Tap the Monsters the Fusion Monster names/);
		await user.click(button(/^Your Main Monster Zone 1: Flame Manipulator/));
		await user.click(button(/^Your Main Monster Zone 2: Masaki the Legendary Swordsman/));
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/Flame Manipulator and Masaki the Legendary Swordsman go to the Graveyard\. You Fusion Summon Flame Swordsman from the Extra Deck\./);
		expect(button("Your Graveyard: 3")).toBeTruthy();
	});
	it("Synchro Summons only when one Tuner and the others add up exactly to the Level", async () => {
		const user = await open("Exactly 6");
		const pickGaia = async () => {
			await user.click(button("Your Extra Deck: 1"));
			await user.click(within(screen.getByRole("region", { name: "Your Extra Deck: 1" })).getByRole("button", { name: /Gaia Knight/ }));
		};
		await pickGaia();
		expect(document.querySelector("[data-card-text]")?.textContent).toContain("1 Tuner + 1 or more non-Tuner monsters");
		await user.click(button(/^Your Main Monster Zone 1: Tune Warrior/));
		await user.click(button(/^Your Main Monster Zone 3: Destroyer Golem/));
		expect(status().textContent).toMatch(/Levels: 7 of 6/);
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/the Levels must add up exactly/);
		await pickGaia();
		await user.click(button(/^Your Main Monster Zone 1: Tune Warrior/));
		await user.click(button(/^Your Main Monster Zone 2: Giant Soldier of Stone/));
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/Level 3 \+ 3 = 6\. You Synchro Summon Gaia Knight, the Force of Earth\./);
	});
	it("stacks Xyz Materials under the Monster instead of sending them to the Graveyard", async () => {
		const user = await open("Stack them");
		await user.click(button("Your Extra Deck: 1"));
		await user.click(within(screen.getByRole("region", { name: "Your Extra Deck: 1" })).getByRole("button", { name: /Gem-Knight Pearl/ }));
		expect(status().textContent).toMatch(/Tap 2 Level 4 Monsters/);
		await user.click(button(/^Your Main Monster Zone 1: Destroyer Golem/));
		await user.click(button(/^Your Main Monster Zone 2: Fairy's Gift/));
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/go under Gem-Knight Pearl as materials, not to the Graveyard/);
		expect(button(/^Your Main Monster Zone 1: Gem-Knight Pearl, ATK 2600, DEF 1900, 2 materials under it/)).toBeTruthy();
		expect(button("Your Graveyard: 0")).toBeTruthy();
	});
	it("detaches a material as the cost of Utopia's effect, after the card is read", async () => {
		const user = await open("Detach");
		await rivalNext(user);
		await user.click(button(/^Your Main Monster Zone 1: Number 39: Utopia, ATK 2500, DEF 2000, 2 materials under it/));
		expect(document.querySelector("[data-card-text]")?.textContent).toContain("You can detach 1 material from this card; negate the attack.");
		await user.click(button("Detach a material"));
		expect(status().textContent).toMatch(/You detach Fairy's Gift from Number 39: Utopia to pay the cost\. It goes to the Graveyard\. The attack of Judge Man is stopped\./);
		expect(button(/Number 39: Utopia, ATK 2500, DEF 2000, 1 material under it/)).toBeTruthy();
	});
	it("Link Summons to the Extra Monster Zone, and never turns a Link Monster to Defense Position", async () => {
		const user = await open("Link up");
		await user.click(button("Your Extra Deck: 1"));
		await user.click(within(screen.getByRole("region", { name: "Your Extra Deck: 1" })).getByRole("button", { name: /LANphorhynchus/ }));
		expect(status().textContent).toMatch(/Tap 2 Monsters/);
		await user.click(button(/^Your Main Monster Zone 1: Prevent Rat/));
		await user.click(button(/^Your Main Monster Zone 2: Saggi the Dark Clown/));
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/You Link Summon LANphorhynchus in the Extra Monster Zone\./);
		await user.click(button(/^Your Extra Monster Zone: LANphorhynchus, ATK 1200, Link 2/));
		await user.click(button("Turn LANphorhynchus"));
		expect(status().textContent).toMatch(/A Link Monster has no DEF/);
	});
});

describe("a Pendulum Summon", () => {
	it("places two Scales in the Pendulum Zones, then Summons the chosen Monsters from the hand together", async () => {
		const user = await open("Two Scales");
		await user.click(hand("Mandragon"));
		await user.click(button(/^Your Spell & Trap Zone 3: empty/));
		expect(status().textContent).toMatch(/leftmost or rightmost Spell & Trap Zone/);
		await user.click(hand("Mandragon"));
		await user.click(button(/^Your Spell & Trap Zone 1: empty/));
		expect(button(/^Your Pendulum Zone 1: Mandragon, face-up, Pendulum Scale 2/)).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Pendulum Summon" })).toBeNull();
		await user.click(hand("Flash Knight"));
		await user.click(button(/^Your Spell & Trap Zone 5: empty/));
		await user.click(button("Pendulum Summon"));
		expect(status().textContent).toMatch(/Scales 2 and 7: tap the Monsters in your hand/);
		await user.click(hand("Ally of Justice Clausolas"));
		await user.click(hand("Destroyer Golem"));
		await user.click(button("Summon!"));
		expect(status().textContent).toMatch(/Pendulum Summon! Scales 2 and 7: Ally of Justice Clausolas and Destroyer Golem come from the hand\./);
		expect(button(/^Your Main Monster Zone 1: Ally of Justice Clausolas, ATK 2300/)).toBeTruthy();
	});
});

describe("every word counts", () => {
	it("Special Summons Cyber Dragon only while its condition is true", async () => {
		const user = await open("Only your opponent");
		await user.click(hand("Destroyer Golem"));
		await user.click(button(/^Your Main Monster Zone 1: empty/));
		await user.click(hand("Cyber Dragon"));
		await user.click(button("Special Summon it"));
		expect(status().textContent).toMatch(/what it asks for is not true right now/);
		await user.click(button("Start again"));
		await user.click(hand("Cyber Dragon"));
		await user.click(button("Special Summon it"));
		expect(status().textContent).toMatch(/You Special Summon Cyber Dragon from the hand, as its card says\. The Normal Summon is still free\./);
	});
	it("uses Kuriboh's Quick Effect from the hand in answer to an attack", async () => {
		const user = await open("A surprise in your hand");
		await rivalNext(user);
		await user.click(hand("Kuriboh"));
		expect(document.querySelector("[data-card-text]")?.textContent).toContain("(Quick Effect): You can discard this card;");
		await user.click(button("Discard it: Quick Effect"));
		expect(status().textContent).toMatch(/You discard Kuriboh from the hand to pay the cost of its Quick Effect: no battle damage from this battle\./);
		expect(screen.getByText("Your Life Points: 2000")).toBeTruthy();
	});
});
