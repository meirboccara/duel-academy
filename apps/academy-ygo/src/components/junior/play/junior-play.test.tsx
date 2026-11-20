// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, LanguageSwitcher } from "@/lib/i18n/provider";
import { PLAY_COPY } from "@/lib/junior/play/copy";
import { LEVELS, WORLD_IDS } from "@/lib/junior/play/levels";
import { masterLevelId } from "@/lib/junior/play/masters";
import { PLAY_PROGRESS_KEY, emptyPlayProgress } from "@/lib/junior/play/progress";
import { starsEarned } from "@/lib/junior/world/shop";
import { useEffect } from "react";
import { JuniorPlay } from "./junior-play";

/* These tests cover the page without 3D: the island world says it cannot draw, so the list of levels is the map. */
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
/** Opens the page with every level before `opened` already solved without help. */
/** Opens the game with every level before `opened` solved. A dorm is already chosen unless `dorm` is null, so its question stays out of the way. */
function setup(opened?: string, dorm: string | null = "slifer") {
	if (opened) {
		const levels = Object.fromEntries(LEVELS.slice(0, LEVELS.findIndex((level) => level.id === opened)).map((level) => [level.id, { clean: true, firstTry: true }]));
		window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), levels }));
	}
	if (dorm) window.localStorage.setItem(`${PLAY_PROGRESS_KEY}:dorm`, JSON.stringify({ version: 1, dorm }));
	const user = userEvent.setup();
	render(
		<LanguageProvider>
			<LanguageSwitcher />
			<JuniorPlay />
		</LanguageProvider>,
	);
	return user;
}
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const zone = (name: RegExp) => screen.getByRole("button", { name });
const status = () => within(screen.getByRole("main")).getByRole("status");
const saved = () => JSON.parse(window.localStorage.getItem(PLAY_PROGRESS_KEY) ?? "null");
async function openLevel(user: User, title: string) {
	await user.click(await screen.findByRole("button", { name: title }));
}
async function skipDemo(user: User) {
	await user.click(button("My turn!"));
}

describe("the Junior map", () => {
	it("offers the first level and keeps later levels closed", async () => {
		setup();
		expect(screen.getByRole("heading", { level: 1, name: /learn by playing/i })).toBeTruthy();
		expect(button("Play: Fill the field")).toBeTruthy();
		expect((button("Fill the field") as HTMLButtonElement).disabled).toBe(false);
		expect((button(/^Three more: Solve the one before/) as HTMLButtonElement).disabled).toBe(true);
		expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toContain("7 The rival's challenge");
	});
	it("has no question screen: a level opens on a demonstration, then on the board", async () => {
		const user = setup();
		await user.click(button("Play: Fill the field"));
		expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2, name: "Fill the field" }));
		expect(screen.getByRole("heading", { level: 3, name: /Watch first: Card kinds and zones/ })).toBeTruthy();
		expect(screen.getByText("Step 1 of 4")).toBeTruthy();
		await user.click(button("Next"));
		expect(status().textContent).toMatch(/You Summon Mystical Elf in Attack Position/);
		await skipDemo(user);
		expect(screen.getByRole("group", { name: "The duel board" })).toBeTruthy();
		expect(screen.queryByRole("radio")).toBeNull();
	});
	it("spends the stars of solved missions in Grandpa's shop, and the card joins the binder", async () => {
		const user = setup("w2-wall");
		/* Counting stars is tested in shop.test.ts; this test is about spending them. */
		const stars = starsEarned(saved());
		await user.click(await screen.findByRole("button", { name: new RegExp(`Grandpa's game shop · ${stars}`) }));
		await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Watapon, Common, 4 ★/ }));
		await user.click(button("Buy for 4 ★"));
		expect(JSON.parse(window.localStorage.getItem(`${PLAY_PROGRESS_KEY}:shop`)!).cards).toEqual(["watapon"]);
		await user.click(button("Back"));
		await user.click(button("Close"));
		expect(within(screen.getByRole("region", { name: "Your card album" })).getByText("Watapon")).toBeTruthy();
		expect(screen.getByRole("button", { name: new RegExp(`Grandpa's game shop · ${stars - 4}`) })).toBeTruthy();
	});
	it("does not ask for a dorm before the first island is finished", async () => {
		setup("w1-tie", null);
		await screen.findByRole("button", { name: /^Your card album/ });
		expect(screen.queryByRole("dialog", { name: "Choose your dorm" })).toBeNull();
	});
	it("asks for a dorm once the first island is finished, and remembers the choice", async () => {
		const user = setup("w2-crouch", null);
		await user.click(await screen.findByRole("button", { name: /^Join Obelisk Blue/ }));
		expect(JSON.parse(window.localStorage.getItem(`${PLAY_PROGRESS_KEY}:dorm`)!)).toMatchObject({ dorm: "obelisk" });
		expect(screen.queryByRole("dialog", { name: "Choose your dorm" })).toBeNull();
		/* The dorm's cap comes with it, worn at once and free. */
		expect(JSON.parse(window.localStorage.getItem(`${PLAY_PROGRESS_KEY}:shop`)!)).toMatchObject({ items: ["hat-cap-obelisk"], wear: { hat: "hat-cap-obelisk" } });
	});
	it("gives the dorm's cap on the next visit to a save that chose its dorm before caps existed", async () => {
		setup("w2-crouch", "ra");
		await screen.findByRole("button", { name: /^Your card album/ });
		expect(JSON.parse(window.localStorage.getItem(`${PLAY_PROGRESS_KEY}:shop`)!)).toMatchObject({ items: ["hat-cap-ra"], wear: { hat: "hat-cap-ra" } });
	});
	const openAsNoa = (solved: number, onChangeAvatar = vi.fn(), onChangeLocale?: (locale: string | null) => void) => {
		const levels = Object.fromEntries(LEVELS.slice(0, solved).map((level) => [level.id, { clean: true, firstTry: true }]));
		window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), levels }));
		if (solved >= 5) window.localStorage.setItem(`${PLAY_PROGRESS_KEY}:dorm`, JSON.stringify({ version: 1, dorm: "ra" }));
		render(
			<LanguageProvider>
				<JuniorPlay player={{ storage: window.localStorage, key: PLAY_PROGRESS_KEY, stillMine: () => true, avatar: "knight", name: "Noa", onChangePlayer: () => undefined, onChangeAvatar, ...(onChangeLocale && { locale: null, onChangeLocale }) }} />
			</LanguageProvider>,
		);
		return onChangeAvatar;
	};
	it("lets the save's own language be chosen in the pause menu, also in full screen", async () => {
		const user = userEvent.setup();
		const onChangeLocale = vi.fn();
		openAsNoa(7, vi.fn(), onChangeLocale);
		await user.click(await screen.findByRole("button", { name: "My hero" }));
		const dialog = screen.getByRole("dialog", { name: "My hero" });
		await user.click(within(dialog).getByRole("button", { name: "Previous page: Quest" }));
		const select = within(dialog).getByLabelText("Language of this save");
		await user.selectOptions(select, "he");
		expect(onChangeLocale).toHaveBeenCalledWith("he");
		/* Choosing in the list did not turn the page. */
		expect(within(dialog).getByRole("heading", { name: "Quest" })).toBeTruthy();
	});
	it("lets the character change in My hero before the first mission is done", async () => {
		const user = userEvent.setup();
		const onChangeAvatar = openAsNoa(0);
		await user.click(await screen.findByRole("button", { name: "My hero" }));
		await user.click(within(screen.getByRole("dialog", { name: "My hero" })).getByRole("radio", { name: "Explorer" }));
		expect(onChangeAvatar).toHaveBeenCalledWith("explorer");
	});
	it("keeps the character once a mission is done: My hero only dresses it, and turns to the album and the quest", async () => {
		const user = userEvent.setup();
		openAsNoa(7);
		await user.click(await screen.findByRole("button", { name: "My hero" }));
		const dialog = screen.getByRole("dialog", { name: "My hero" });
		expect(within(dialog).queryByRole("radio")).toBeNull();
		/* The dorm's cap, given on joining, is there to wear. */
		expect(within(dialog).getByRole("button", { name: "Ra Yellow cap" }).getAttribute("aria-pressed")).toBe("true");
		await user.click(within(dialog).getByRole("button", { name: "Next page: Your card album" }));
		await user.click(within(dialog).getByRole("button", { name: "Next page: Quest" }));
		expect(within(dialog).getByText(`Islands finished: 1 of ${WORLD_IDS.length}`)).toBeTruthy();
	});
	it("opens the card album from a button at any time, and closes it again", async () => {
		const user = setup("w2-wall");
		await user.click(await screen.findByRole("button", { name: /^Your card album: \d+ cards?$/ }));
		const album = screen.getByRole("dialog", { name: "Your card album" });
		expect(within(album).getAllByRole("listitem").length).toBeGreaterThan(0);
		await user.click(within(album).getByRole("button", { name: "Close" }));
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});

describe("playing a level", () => {
	it("places each kind of card by tapping the card, then a zone, and saves the solved level", async () => {
		const user = setup();
		await user.click(button("Play: Fill the field"));
		await skipDemo(user);
		await user.click(button(/Silver Fang/));
		expect(status().textContent).toMatch(/Silver Fang is picked. Tap a glowing zone/);
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		expect(status().textContent).toMatch(/Wrong row!/);
		await user.click(button(/Silver Fang/));
		await user.click(zone(/^Your Monster Zone 2: empty/));
		expect(zone(/^Your Monster Zone 2: Silver Fang, ATK 1200, DEF 800/)).toBeTruthy();
		await user.click(button(/Red Medicine/));
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		expect(status().textContent).toMatch(/You gain 500 Life Points: 4500 now/);
		await user.click(button(/Draining Shield/));
		await user.click(zone(/^Your Spell & Trap Zone 3: empty/));
		expect(zone(/^Your Spell & Trap Zone 3: Draining Shield, face-down/)).toBeTruthy();
		expect(status().textContent).toMatch(/You did it!/);
		expect(document.activeElement).toBe(button("Next level"));
		expect(saved().levels["w1-field"]).toEqual({ clean: true, firstTry: false });
		expect(saved().slips).toEqual({ "wrong-zone": 1 });
	});
	it("plays a battle out as a subtraction, and lets a losing attack be taken back", async () => {
		const user = setup("w1-clash");
		await openLevel(user, "Clash!");
		await skipDemo(user);
		await user.click(zone(/^Your Monster Zone 1: Silver Fang/));
		await user.click(zone(/Monster Zone 1: Fairy's Gift/));
		expect(status().textContent).toMatch(/Fairy's Gift is stronger: 1400 − 1200 = 200\. Silver Fang is destroyed\. You lose 200 Life Points: 3800 left\./);
		expect(status().textContent).toMatch(/Not this time\. You lost a Monster you needed\./);
		expect(document.querySelector("[data-clash]")?.textContent).toContain("1400 − 1200 = 200");
		await user.click(button("Go back one step"));
		expect(zone(/^Your Monster Zone 1: Silver Fang/)).toBeTruthy();
		await user.click(zone(/^Your Monster Zone 2: Sky Scout/));
		await user.click(zone(/Monster Zone 1: Fairy's Gift/));
		expect(status().textContent).toMatch(/Sky Scout wins: 1800 − 1400 = 400\. Fairy's Gift is destroyed\. Nox loses 400 Life Points: 3600 left\.\s*You did it!/);
		expect(saved().levels["w1-clash"]).toEqual({ clean: true, firstTry: false });
	});
	it("turns a Monster to Defense Position, then shows the rival's turn one step at a time", async () => {
		const user = setup("w2-crouch");
		await openLevel(user, "Shield up");
		await skipDemo(user);
		await user.click(zone(/^Your Monster Zone 1: Mystical Elf/));
		await user.click(button("Turn Mystical Elf"));
		expect(zone(/^Your Monster Zone 1: Mystical Elf, ATK 800, DEF 2000, Defense Position/)).toBeTruthy();
		await user.click(button("End turn"));
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/Battle Ox attacks Mystical Elf! 2000 DEF holds: 2000 − 1700 = 300\. Nothing is destroyed\. Nox loses 300 Life Points/);
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/You did it! First try, no help/);
		expect(saved().levels["w2-crouch"]).toEqual({ clean: true, firstTry: true });
	});
	it("pays a Tribute by tapping the Monster to send away", async () => {
		const user = setup("w3-tribute");
		await openLevel(user, "A bigger friend");
		await skipDemo(user);
		await user.click(button(/Ally of Justice Clausolas/));
		expect(status().textContent).toMatch(/Tap one of your Monsters to Tribute it/);
		await user.click(zone(/^Your Monster Zone 1: Silver Fang/));
		expect(status().textContent).toMatch(/You Tribute Silver Fang to Summon Ally of Justice Clausolas/);
		expect(zone(/^Your Monster Zone 1: Ally of Justice Clausolas, ATK 2300/)).toBeTruthy();
		expect(screen.getByText("Your Graveyard: 1")).toBeTruthy();
	});
	it("walks the phases of a turn with the phase bar, and lets a Quick-Play Spell be used in the Battle Phase", async () => {
		const user = setup("w4-spell");
		await openLevel(user, "Spell now!");
		await skipDemo(user);
		const bar = within(screen.getByRole("list", { name: "Phases of the turn" }));
		await user.click(bar.getByRole("button", { name: "Main Phase 1" }));
		expect(status().textContent).toMatch(/Draw your card first/);
		await user.click(bar.getByRole("button", { name: "Draw Phase: Draw" }));
		expect(status().textContent).toMatch(/You draw Offerings to the Doomed/);
		await user.click(bar.getByRole("button", { name: "Main Phase 1" }));
		await user.click(bar.getByRole("button", { name: "Battle Phase" }));
		expect(bar.getByRole("button", { name: "Battle Phase" }).getAttribute("aria-current")).toBe("step");
		await user.click(button(/Offerings to the Doomed/));
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		await user.click(zone(/Monster Zone 1: Battle Ox/));
		expect(status().textContent).toMatch(/You activate the Spell Offerings to the Doomed and target Battle Ox\. Battle Ox is destroyed/);
		await user.click(zone(/^Your Monster Zone 1: Destroyer Golem/));
		await user.click(button("Attack directly"));
		expect(status().textContent).toMatch(/You win the duel!\s*You did it!/);
	});
	it("freezes the rival's attack so a Set Trap can be flipped", async () => {
		const user = setup("w4-ambush");
		await openLevel(user, "Ambush");
		await skipDemo(user);
		const bar = within(screen.getByRole("list", { name: "Phases of the turn" }));
		await user.click(bar.getByRole("button", { name: "Draw Phase: Draw" }));
		await user.click(bar.getByRole("button", { name: "Main Phase 1" }));
		await user.click(button(/Draining Shield/));
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		await user.click(zone(/^Your Spell & Trap Zone 1: Draining Shield/));
		expect(status().textContent).toMatch(/Not yet! A Trap cannot be activated the turn it was Set/);
		await user.click(bar.getByRole("button", { name: "End Phase" }));
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/Battle Ox attacks Silver Fang! Freeze!/);
		expect(button("Let it happen")).toBeTruthy();
		await user.click(zone(/^Your Spell & Trap Zone 1: Draining Shield/));
		expect(status().textContent).toMatch(/You flip a Trap: Draining Shield! The attack of Battle Ox is stopped/);
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/You did it!/);
	});
	it("resolves a chain from the top: the Trap saves the Monster before the Spell arrives", async () => {
		const user = setup("w6-tower");
		await openLevel(user, "Turtle tower");
		await skipDemo(user);
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/Nox activates the Spell Offerings to the Doomed and targets Silver Fang\. Offerings to the Doomed starts a Chain: Chain Link 1/);
		expect(document.querySelector("[data-chain]")?.textContent).toContain("Offerings to the Doomed");
		await user.click(zone(/^Your Spell & Trap Zone 1: Compulsory Evacuation Device/));
		await user.click(zone(/^Your Monster Zone 1: Silver Fang/));
		expect(status().textContent).toMatch(/Compulsory Evacuation Device goes on top: Chain Link 2\. Chain Link 2 resolves: Compulsory Evacuation Device\. Silver Fang returns to your hand\. Chain Link 1 resolves: Offerings to the Doomed\. Offerings to the Doomed resolves, but there is nothing left for it to do/);
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/You did it!/);
	});
	it("gives a hint as a move to make, and a hinted solve earns no star", async () => {
		const user = setup("w1-clash");
		await openLevel(user, "Clash!");
		await skipDemo(user);
		await user.click(button("Hint"));
		expect(status().textContent).toMatch(/Attack Fairy's Gift with Sky Scout \(1800 ATK\)/);
		await user.click(zone(/^Your Monster Zone 2: Sky Scout/));
		await user.click(zone(/Monster Zone 1: Fairy's Gift/));
		expect(status().textContent).toMatch(/Solved with a hint/);
		expect(saved().levels["w1-clash"]).toEqual({ clean: false, firstTry: false });
		await user.click(button("Back to the map"));
		expect(button("Clash!: solved")).toBeTruthy();
		expect(screen.getByText(/Battle: ATK against ATK/).textContent).toMatch(/\(met\)/);
	});
	it("ends the whole duel with a certificate", async () => {
		const user = setup("w7-duel");
		await openLevel(user, "The rival's challenge");
		const level = LEVELS.find((item) => item.id === "w7-duel");
		const bar = () => within(screen.getByRole("list", { name: "Phases of the turn" }));
		const rival = async () => {
			while (screen.queryByRole("button", { name: "Nox's turn: next" })) await user.click(button("Nox's turn: next"));
		};
		const names: Record<string, RegExp> = { "river-otter": /Destroyer Golem/, "fog-snare": /Reinforcements/, "pocket-cub": /Silver Fang/, "thunder-clap": /Offerings to the Doomed/ };
		const phaseNames = { draw: "Draw Phase", standby: "Standby Phase", main1: "Main Phase 1", battle: "Battle Phase", main2: "Main Phase 2", end: "End Phase" } as const;
		for (const move of level?.solution ?? []) {
			await rival();
			if (move.type === "draw") await user.click(bar().getByRole("button", { name: "Draw Phase: Draw" }));
			else if (move.type === "phase") await user.click(bar().getByRole("button", { name: phaseNames[move.to] }));
			else if (move.type === "place") {
				await user.click(button(names[move.card] ?? /none/));
				if (move.target !== undefined) await user.click(zone(new RegExp(`^Nox's Monster Zone ${move.target + 1}: `)));
				else await user.click(zone(new RegExp(`^Your ${move.row === "monsters" ? "Monster" : "Spell & Trap"} Zone ${move.zone + 1}: `)));
			} else if (move.type === "spring") {
				await user.click(zone(new RegExp(`^Your Spell & Trap Zone ${move.zone + 1}: `)));
				if (move.target !== undefined) await user.click(zone(new RegExp(`^Your Monster Zone ${move.target + 1}: `)));
			} else if (move.type === "attack") {
				await user.click(zone(new RegExp(`^Your Monster Zone ${move.attacker + 1}: `)));
				await user.click(button("Attack directly"));
			}
		}
		expect(status().textContent).toMatch(/You win the duel!/);
		expect(screen.getByRole("heading", { level: 3, name: "Junior Duelist" })).toBeTruthy();
		expect(button("Print my certificate")).toBeTruthy();
		expect(Object.keys(saved().levels)).toHaveLength(LEVELS.findIndex((item) => item.id === "w7-duel") + 1);
	});
});

describe("reading the card", () => {
	it("pays a cost by tapping the card to discard, and refuses the Spell without one", async () => {
		const user = setup("r-cost");
		await openLevel(user, "Pay first");
		await skipDemo(user);
		await user.click(button(/Tribute to the Doomed/));
		expect(within(document.querySelector("[data-card-text]") as HTMLElement).getByText("Discard 1 card, then target 1 monster on the field; destroy it.")).toBeTruthy();
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		await user.click(zone(/^Nox's Monster Zone 1: /));
		expect(status().textContent).toMatch(/Pay the cost: tap another card in your hand to discard it/);
		await user.click(button(/Happy Lover/));
		expect(status().textContent).toMatch(/You activate the Spell Tribute to the Doomed and target Judge Man\. You discard Happy Lover to pay the cost\. Judge Man is destroyed/);
		expect(screen.getByText("Your Graveyard: 2")).toBeTruthy();
		const bar = within(screen.getByRole("list", { name: "Phases of the turn" }));
		await user.click(bar.getByRole("button", { name: "Battle Phase" }));
		await user.click(zone(/^Your Monster Zone 1: Sky Scout/));
		await user.click(button("Attack directly"));
		expect(status().textContent).toMatch(/You win the duel!/);
	});
	it("explains the cost when there is no other card left to discard", async () => {
		const user = setup("r-cost");
		await openLevel(user, "Pay first");
		await skipDemo(user);
		await user.click(button(/Happy Lover/));
		await user.click(zone(/^Your Monster Zone 2: empty/));
		await user.click(button(/Tribute to the Doomed/));
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		await user.click(zone(/^Nox's Monster Zone 1: /));
		expect(status().textContent).toMatch(/Pay the cost first: discard 1 other card from your hand\. No card to discard, no activation\./);
		expect(saved().levels["r-cost"]).toBeUndefined();
	});
	it('shows a "When…" card missing its chance and an "If…" card getting it', async () => {
		const user = setup("r-when");
		await openLevel(user, "When or If?");
		expect(screen.getByRole("heading", { level: 3, name: /Watch first: "When… you can" or "If… you can"/ })).toBeTruthy();
		await skipDemo(user);
		await user.click(button(/Tribute to the Doomed/));
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		await user.click(zone(/^Nox's Monster Zone 1: /));
		await user.click(button(/Dozy Moth/));
		expect(status().textContent).toMatch(/Dozy Moth missed its chance! Its card says "When…": it only gets its chance if going to the Graveyard happens last\. Here, activating the Spell came last\./);
		expect(screen.getByText("Nox's Life Points: 900")).toBeTruthy();
		await user.click(button("Go back one step"));
		await user.click(button(/Tribute to the Doomed/));
		await user.click(zone(/^Your Spell & Trap Zone 1: empty/));
		await user.click(zone(/^Nox's Monster Zone 1: /));
		await user.click(button(/Busy Bee/));
		expect(status().textContent).toMatch(/Busy Bee says "If…": it gets its chance! You deal 500 damage\. Nox loses 500 Life Points: 400 left\./);
		await user.click(button(/Dozy Moth/));
		await user.click(zone(/^Your Monster Zone 1: empty/));
		const bar = within(screen.getByRole("list", { name: "Phases of the turn" }));
		await user.click(bar.getByRole("button", { name: "Battle Phase" }));
		await user.click(zone(/^Your Monster Zone 1: Dozy Moth/));
		await user.click(button("Attack directly"));
		expect(status().textContent).toMatch(/You win the duel!/);
	});
	it("answers an attack with a Quick Effect, and refuses an effect without one", async () => {
		const user = setup("r-quick");
		await openLevel(user, "Quick Effect");
		await skipDemo(user);
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/Battle Ox attacks Destroyer Golem! Freeze!/);
		expect(zone(/^Your Monster Zone 2: Glint Lynx, ATK 1300, DEF 1100, has an effect \(Quick Effect\)/)).toBeTruthy();
		await user.click(zone(/^Your Monster Zone 3: Cinder Hedgehog/));
		expect(document.querySelector("[data-card-text]")?.textContent).toMatch(/^On the card: Cinder HedgehogYou can target 1 face-up monster/);
		await user.click(zone(/Monster Zone 1: Battle Ox/));
		expect(status().textContent).toMatch(/This Monster effect has no \(Quick Effect\), so it only works in your own Main Phase/);
		await user.click(zone(/^Your Monster Zone 2: Glint Lynx/));
		await user.click(zone(/Monster Zone 1: Battle Ox/));
		expect(status().textContent).toMatch(/You use the effect of Glint Lynx and target Battle Ox\. Battle Ox loses 800 ATK: 900 until the end of the turn\. Destroyer Golem is stronger: 1500 − 900 = 600\. Battle Ox is destroyed/);
		await user.click(button("Nox's turn: next"));
		expect(status().textContent).toMatch(/You did it!/);
		expect(saved().slips).toEqual({ "not-quick": 1 });
	});
	it("uses a Monster's effect on your own turn from the Monster's buttons", async () => {
		const user = setup("r-main");
		await openLevel(user, "My turn only");
		await user.click(zone(/^Your Monster Zone 1: Cinder Hedgehog/));
		await user.click(button("Use its effect"));
		await user.click(zone(/Monster Zone 1: Battle Ox/));
		expect(status().textContent).toMatch(/You use the effect of Cinder Hedgehog and target Battle Ox/);
		await user.click(zone(/^Your Monster Zone 1: Cinder Hedgehog/));
		await user.click(button("Use its effect"));
		await user.click(zone(/Monster Zone 1: Battle Ox/));
		expect(status().textContent).toMatch(/This effect can be used only once per turn/);
	});
});

describe("Hebrew", () => {
	async function inHebrew(user: User) {
		await act(async () => {
			await user.selectOptions(screen.getByRole("combobox"), "he");
		});
		await screen.findByRole("heading", { level: 1, name: "ג׳וניור: לומדים תוך כדי משחק" });
	}
	it("prints card names and card text in English, with the meaning in Hebrew under it", async () => {
		const user = setup("r-cost");
		await inHebrew(user);
		await user.click(screen.getByRole("button", { name: "קודם משלמים" }));
		await user.click(screen.getByRole("button", { name: "עכשיו אני!" }));
		await user.click(screen.getByRole("button", { name: /Tribute to the Doomed/ }));
		const reader = document.querySelector("[data-card-text]") as HTMLElement;
		const printed = within(reader).getByText("Discard 1 card, then target 1 monster on the field; destroy it.");
		expect(printed.getAttribute("lang")).toBe("en");
		expect(printed.getAttribute("dir")).toBe("ltr");
		expect(reader.textContent).toContain("המחיר: משליכים קלף אחד מהיד.");
		await user.click(screen.getAllByRole("button", { name: /Spell & Trap Zone/ })[0]!);
		await user.click(screen.getByRole("button", { name: (label) => label.startsWith(PLAY_COPY.he.monsterZone("rival", 1)) }));
		expect(status().textContent).toMatch(/\(\u2066cost\u2069\).*\(\u2066discard\u2069\)/);
	});
	it("speaks English, with an English voice, when Hebrew is chosen", async () => {
		const said: { text: string; lang: string; voice: string }[] = [];
		class Utterance {
			lang = "";
			rate = 1;
			voice: { name: string } | null = null;
			constructor(readonly text: string) {}
		}
		const voices = [
			{ name: "English", lang: "en-US", localService: true },
			{ name: "Hebrew", lang: "he-IL", localService: true },
		];
		vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
		Object.defineProperty(window, "speechSynthesis", {
			configurable: true,
			value: { getVoices: () => voices, cancel: () => {}, speak: (u: Utterance) => said.push({ text: u.text, lang: u.lang, voice: u.voice?.name ?? "" }) },
		});
		try {
			const user = setup("w1-clash");
			await inHebrew(user);
			await user.click(screen.getByRole("button", { name: "קול וצלילים" }));
			await user.click(screen.getByRole("button", { name: "התנגשות!" }));
			await user.click(screen.getByRole("button", { name: "עכשיו אני!" }));
			await user.click(zone(/Sky Scout/));
			await user.click(zone(/Fairy's Gift/));
			const last = said.at(-1);
			expect(last).toMatchObject({ lang: "en-US", voice: "English" });
			expect(last?.text).toMatch(/^Sky Scout attacks Fairy's Gift! Sky Scout wins: 1800 − 1400 = 400\. Fairy's Gift is destroyed and goes to the Graveyard|^Sky Scout attacks Fairy's Gift! Sky Scout wins: 1800 − 1400 = 400\. Fairy's Gift is destroyed\./);
		} finally {
			vi.unstubAllGlobals();
			Reflect.deleteProperty(window, "speechSynthesis");
		}
	});
});

describe("language, calm and sound", () => {
	it("keeps the board where it is when the language changes, in French and in right-to-left Hebrew", async () => {
		const user = setup("w1-clash");
		await openLevel(user, "Clash!");
		await skipDemo(user);
		await user.click(zone(/^Your Monster Zone 2: Sky Scout/));
		await user.click(zone(/Monster Zone 1: Fairy's Gift/));
		await act(async () => {
			await user.selectOptions(screen.getByRole("combobox"), "fr");
		});
		expect(await screen.findByRole("heading", { level: 2, name: "Choc !" })).toBeTruthy();
		expect(status().textContent).toMatch(/Éclaireur du Ciel gagne : 1800 − 1400 = 400\. Cadeau de Fée est détruit\./);
		await act(async () => {
			await user.selectOptions(screen.getByRole("combobox"), "he");
		});
		expect(await screen.findByRole("heading", { level: 2, name: "התנגשות!" })).toBeTruthy();
		expect(document.documentElement.dir).toBe("rtl");
		expect(screen.getByRole("group", { name: "לוח הדו־קרב" }).getAttribute("dir")).toBe("ltr");
	});
	it("remembers sound, off at first, and offers no calm button", async () => {
		const user = setup();
		expect(screen.queryByRole("button", { name: "Calm mode" })).toBeNull();
		expect(button("Voice and sounds").getAttribute("aria-pressed")).toBe("false");
		await user.click(button("Voice and sounds"));
		expect(saved()).toMatchObject({ sound: true });
	});
	it("keeps its own sound choice when another tab of the same save writes progress", async () => {
		setup();
		await act(async () => {});
		window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), sound: true }));
		await act(async () => {
			window.dispatchEvent(new StorageEvent("storage", { key: PLAY_PROGRESS_KEY }));
		});
		expect(button("Voice and sounds").getAttribute("aria-pressed")).toBe("false");
	});
	it("starts silent every time the game opens, even when sound was on last time", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), sound: true }));
		setup();
		await act(async () => {});
		expect(button("Voice and sounds").getAttribute("aria-pressed")).toBe("false");
	});
	it("moves unless the device asks for reduced motion; an old saved calm choice no longer stops it", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ ...emptyPlayProgress(), calm: true }));
		setup();
		expect(screen.getByRole("main").getAttribute("data-motion")).toBe("on");
		cleanup();
		const original = window.matchMedia;
		window.matchMedia = ((query: string) => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
		try {
			setup();
			expect(screen.getByRole("main").getAttribute("data-motion")).toBe("off");
		} finally {
			window.matchMedia = original;
		}
	});
	it("leaves an unknown saved record alone and still lets the child play", async () => {
		window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify({ version: 9 }));
		const user = setup();
		await user.click(button("Play: Fill the field"));
		expect(screen.getByRole("heading", { level: 2, name: "Fill the field" })).toBeTruthy();
		expect(saved()).toEqual({ version: 9 });
	});
});

describe("full screen", () => {
	afterEach(() => {
		delete document.documentElement.dataset.immersive;
		Reflect.deleteProperty(document, "fullscreenEnabled");
		Reflect.deleteProperty(document, "fullscreenElement");
		Reflect.deleteProperty(document.documentElement, "requestFullscreen");
		Reflect.deleteProperty(document, "exitFullscreen");
	});

	it("hides the site's header and footer and asks the browser for full screen; leaving it (Escape) turns it all off", async () => {
		let inFull: Element | null = null;
		Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
		Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => inFull });
		const request = vi.fn(async () => {
			inFull = document.documentElement;
		});
		Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: request });
		const user = setup();
		const full = button("Full screen");
		await user.click(full);
		expect(request).toHaveBeenCalled();
		expect(document.documentElement.dataset.immersive).toBe("on");
		expect(full.getAttribute("aria-pressed")).toBe("true");
		/* No Home Screen tip where the browser gave full screen. */
		expect(screen.queryByText(/Add to Home Screen/)).toBeNull();
		act(() => {
			inFull = null;
			document.dispatchEvent(new Event("fullscreenchange"));
		});
		expect(document.documentElement.dataset.immersive).toBeUndefined();
		expect(full.getAttribute("aria-pressed")).toBe("false");
	});

	it("still hides the header and footer where the browser has no full screen (an iPhone), with a tip for grown-ups", async () => {
		const user = setup();
		await user.click(button("Full screen"));
		expect(document.documentElement.dataset.immersive).toBe("on");
		expect(screen.getByText(/Share, then Add to Home Screen/)).toBeTruthy();
		await user.click(button("Full screen"));
		expect(document.documentElement.dataset.immersive).toBeUndefined();
	});
});

describe("the masters' island", () => {
	it("asks for a starter Deck first, then deals a whole duel against the trainer at 8000 Life Points", async () => {
		const user = setup(masterLevelId("rex-raptor"));
		await openLevel(user, "Duel: Rex Raptor · beginner");
		expect(screen.getByText("To challenge the masters, you need a Deck of 40 cards.")).toBeTruthy();
		await user.click(button("Choose your starter Deck"));
		await user.click(screen.getByRole("button", { name: /^Choose: Dragons\./ }));
		expect(JSON.parse(window.localStorage.getItem(`${PLAY_PROGRESS_KEY}:deck`) ?? "null")).toMatchObject({ starter: "dragon" });
		expect(screen.getByRole("heading", { level: 2, name: "Duel: Rex Raptor · beginner" })).toBeTruthy();
		expect(screen.getAllByText(/Your Life Points: 8000/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/Rex Raptor's Life Points: 8000/).length).toBeGreaterThan(0);
	});
});

