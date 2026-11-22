import { describe, expect, it, vi } from "vitest";
import { fitView, project, projectTile } from "./board3d-camera";
import { CARD, TILE, framePoints, handSlots, matLayout, spotPoint } from "./board3d-layout";
import { ATTACK_ART, LUNGE_HIT, LUNGE_HIT_SHARE, PIECES, flightAt, flights, knockAt, lungeAt, lunges, pieceThrow, playLength } from "./board3d-moves";
import { SHAKE_TIME, clashes, hurtPower, impacts, lifeChanges, shakeAt, showLength } from "./board3d-show";
import { holdPiles, matView, monsterFace, printedFace } from "./board3d-view";
import { PLAY_COPY } from "./copy";
import { effectCues } from "./cues";
import { EXTRA_ZONE, apply, board, type Board, type Move } from "@duel-academy/engine";

const copy = PLAY_COPY.en;
const BEAT = 0.65;
/* The screens the mat must fit: a phone on its side next to its panel, an iPad both ways, a desktop. */
const SHAPES = [506 / 390, 820 / 660, 812 / 820, 1180 / 820, 2.4, 0.6];

/** A move played on a board, with the cues it gives. */
function played(before: Board, move: Move) {
	const result = apply(before, move);
	if (!result.ok) throw new Error(result.reason);
	return { before, events: result.events, after: result.board, beats: effectCues(before, result.events, result.board) };
}
const battle = () => played(board({ you: { monsters: ["lantern-owl"] }, rival: { monsters: ["pocket-cub"] }, phase: "battle" }), { type: "attack", attacker: 0, target: 0 });
const direct = () => played(board({ you: { monsters: ["lantern-owl"] }, phase: "battle" }), { type: "attack", attacker: 0, target: "direct" });

describe("the plan of the 3D mat", () => {
	it("is the real mat for every level: the same 39 places, in the same spots, on the small board and the whole mat", () => {
		const full = matLayout(true);
		const small = matLayout(false);
		/* Per player: 5 + 5 zones, Field, Graveyard, Deck, Extra Deck, banished, and an Extra Monster Zone. */
		expect(full.places).toHaveLength(2 * 16);
		expect(small.places).toHaveLength(full.places.length);
		expect(new Set(full.places.map((item) => item.key)).size).toBe(full.places.length);
		expect(new Set(small.places.map((item) => item.key)).size).toBe(small.places.length);
		const spots = (layout: typeof full) => layout.places.map((item) => `${item.side}:${item.kind}:${item.x.toFixed(2)}:${item.z.toFixed(2)}`).sort();
		expect(spots(small)).toEqual(spots(full));
		expect([small.minX, small.maxX, small.minZ, small.maxZ]).toEqual([full.minX, full.maxX, full.minZ, full.maxZ]);
		/* Nothing is quiet on the whole mat. */
		expect(full.places.some((item) => item.quiet)).toBe(false);
	});

	it("lays the child's half out as a real mat reads", () => {
		const layout = matLayout(true);
		const at = (key: string) => layout.byKey.get(key)!;
		/* The child's Spell & Trap row is behind its monsters, nearest the child. */
		expect(at("you-backrow-2").z).toBeGreaterThan(at("you-monsters-2").z);
		expect(at("you-backrow-2").z).toBeCloseTo(layout.maxZ - TILE.d / 2);
		/* Field Zone left of the monsters and the Extra Deck under it; Graveyard right and the Deck under it; banished above the Graveyard. */
		expect(at("you-field-0").x).toBeLessThan(at("you-monsters-0").x);
		expect(at("you-extra").x).toBe(at("you-field-0").x);
		expect(at("you-extra").z).toBe(at("you-backrow-0").z);
		expect(at("you-monsters-0").x).toBeLessThan(at("you-monsters-4").x);
		expect(at("you-graveyard").x).toBeGreaterThan(at("you-monsters-4").x);
		expect(at("you-deck").x).toBe(at("you-graveyard").x);
		expect(at("you-deck").z).toBe(at("you-backrow-0").z);
		expect(at("you-banished").x).toBe(at("you-graveyard").x);
		expect(at("you-banished").z).toBe(0);
		/* The two Extra Monster Zones are between the players, over the second and fourth columns. */
		expect(at(`you-monsters-${EXTRA_ZONE}`)).toMatchObject({ z: 0, x: at("you-monsters-1").x, extraZone: true });
		expect(at(`rival-monsters-${EXTRA_ZONE}`)).toMatchObject({ z: 0, x: at("you-monsters-3").x, extraZone: true });
		/* The Pendulum Zones are the two ends of the Spell & Trap row. */
		expect(layout.places.filter((item) => item.pendulum).map((item) => item.key).sort()).toEqual(["rival-backrow-0", "rival-backrow-4", "you-backrow-0", "you-backrow-4"]);
	});

	it("turns the rival's half around, as across a real table", () => {
		const layout = matLayout(true);
		const at = (key: string) => layout.byKey.get(key)!;
		for (const [mine, theirs] of [["you-monsters-0", "rival-monsters-0"], ["you-monsters-3", "rival-monsters-3"], ["you-backrow-4", "rival-backrow-4"], ["you-field-0", "rival-field-0"], ["you-graveyard", "rival-graveyard"], ["you-deck", "rival-deck"], ["you-extra", "rival-extra"], ["you-banished", "rival-banished"]] as const) {
			expect(at(theirs).x, theirs).toBeCloseTo(-at(mine).x);
			expect(at(theirs).z, theirs).toBeCloseTo(-at(mine).z);
		}
		/* So the rival's Deck is far left and its monsters are nearer the child than its Spells and Traps. */
		expect(at("rival-deck").x).toBeCloseTo(layout.minX + TILE.w / 2);
		expect(at("rival-backrow-2").z).toBeLessThan(at("rival-monsters-2").z);
	});

	it("plays the small board on the three middle zones and keeps the rest of the mat quiet", () => {
		const small = matLayout(false);
		const full = matLayout(true);
		for (const row of ["monsters", "backrow"] as const) {
			for (let zone = 0; zone < 3; zone++) {
				const place = small.byKey.get(`you-${row}-${zone}`)!;
				expect(place.quiet).toBe(false);
				expect(place.x).toBe(full.byKey.get(`you-${row}-${zone + 1}`)!.x);
			}
			expect(small.byKey.has(`you-${row}-3`)).toBe(false);
		}
		expect(small.places.filter((item) => !item.quiet).map((item) => item.kind).sort()).toEqual([...Array(6).fill("backrow"), "deck", "deck", "graveyard", "graveyard", ...Array(6).fill("monsters")]);
		/* A zone the small board does not have is printed but belongs to no board zone. */
		expect(small.places.filter((item) => item.zone < 0)).toHaveLength(2 * (2 + 2 + 1));
		/* Everything has somewhere to fly to, even what the small board does not use. */
		expect(spotPoint(small, { at: "pile", side: "you", pile: "graveyard" }).found).toBe(true);
		expect(spotPoint(small, { at: "pile", side: "rival", pile: "banished" }).found).toBe(true);
		expect(spotPoint(small, { at: "pile", side: "rival", pile: "hand" }).found).toBe(false);
	});

	it("keeps zones apart, wide enough for a monster turned sideways", () => {
		const { places } = matLayout(true);
		for (const a of places) for (const b of places) if (a !== b) expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.z - b.z))).toBeGreaterThanOrEqual(TILE.w);
		expect(TILE.w).toBeGreaterThan(CARD.h);
		expect(TILE.d).toBeGreaterThan(CARD.h);
	});

	it("holds the hand in front of the mat, inside its width, however many cards", () => {
		const layout = matLayout(false);
		for (const count of [1, 2, 5, 9]) {
			const slots = handSlots(layout, count);
			expect(slots).toHaveLength(count);
			for (const slot of slots) {
				expect(slot.z).toBeGreaterThan(layout.maxZ);
				expect(slot.x - (CARD.w * layout.handScale) / 2).toBeGreaterThanOrEqual(layout.minX - 1e-9);
				expect(slot.x + (CARD.w * layout.handScale) / 2).toBeLessThanOrEqual(layout.maxX + 1e-9);
			}
			for (let index = 1; index < count; index++) expect(slots[index]!.x).toBeGreaterThan(slots[index - 1]!.x);
		}
		expect(handSlots(layout, 0)).toEqual([]);
	});
});

describe("the camera of the 3D mat", () => {
	it("shows the whole mat and the hand on every screen, fills the screen one way and centres the mat the other", () => {
		const layout = matLayout(true);
		const points = [...framePoints(layout), ...handSlots(layout, 6)];
		for (const shape of SHAPES) {
			const width = 1000;
			const height = width / shape;
			const view = fitView(framePoints(layout), shape);
			const seen = points.map((point) => project(view, point, width, height));
			for (const at of seen) {
				expect(at.x).toBeGreaterThanOrEqual(0);
				expect(at.x).toBeLessThanOrEqual(width);
				expect(at.y).toBeGreaterThanOrEqual(0);
				expect(at.y).toBeLessThanOrEqual(height);
			}
			const top = Math.min(...seen.map((at) => at.y));
			const bottom = Math.max(...seen.map((at) => at.y));
			const wide = (Math.max(...seen.map((at) => at.x)) - Math.min(...seen.map((at) => at.x))) / width;
			expect(Math.max(wide, (bottom - top) / height)).toBeGreaterThan(0.88);
			/* As much room above the mat as under the hand, within a tenth of the screen. */
			expect(Math.abs(top - (height - bottom))).toBeLessThan(height * 0.1);
		}
	});

	it("puts the rival at the top, the child at the bottom and the right on the right", () => {
		const layout = matLayout(true);
		const view = fitView(framePoints(layout), 1.4);
		const at = (key: string) => {
			const item = layout.byKey.get(key)!;
			return project(view, { x: item.x, y: 0, z: item.z }, 700, 500);
		};
		expect(at("rival-monsters-2").y).toBeLessThan(at("you-monsters-2").y);
		expect(at("you-monsters-0").x).toBeLessThan(at("you-monsters-4").x);
		/* Near things look bigger. */
		expect(at("you-monsters-2").scale).toBeGreaterThan(at("rival-monsters-2").scale);
		const box = projectTile(view, { x: 0, y: 0, z: 0 }, TILE.w, TILE.d, 700, 500);
		expect(box.w).toBeGreaterThan(20);
		expect(box.h).toBeGreaterThan(20);
		expect(box.x + box.w / 2).toBeCloseTo(350, 0);
	});

	it("survives a canvas with no shape yet", () => {
		const view = fitView(framePoints(matLayout(false)), 0);
		expect(Number.isFinite(view.distance)).toBe(true);
		expect(Number.isFinite(fitView([], Number.NaN).distance)).toBe(true);
	});
});

describe("what the 3D cards do in a move", () => {
	it("makes the attacker charge and the destroyed monster break and fly to its Graveyard", () => {
		const { before, beats } = battle();
		const jumps = lunges(beats, BEAT);
		expect(jumps).toHaveLength(1);
		expect(jumps[0]).toMatchObject({ key: "you-monsters-0", from: { at: "zone", side: "you", zone: 0 }, to: { at: "zone", side: "rival", zone: 0 } });
		const gone = flights(before, beats, BEAT);
		expect(gone).toHaveLength(1);
		expect(gone[0]).toMatchObject({ card: "pocket-cub", how: "destroyed", stands: true, turned: false, from: { at: "zone", side: "rival", zone: 0 }, to: { at: "pile", side: "rival", pile: "graveyard" } });
		/* The hit comes first; the loser breaks after it, takes longer than a plain flight, and everything is over within the play. */
		expect(gone[0]!.start).toBeGreaterThan(jumps[0]!.start + jumps[0]!.length * LUNGE_HIT_SHARE);
		expect(gone[0]!.length).toBeGreaterThan(BEAT);
		expect(playLength(beats, BEAT)).toBeGreaterThan(gone[0]!.start + gone[0]!.length);
	});

	it("lets a monster destroyed in Defense Position leave turned sideways", () => {
		const { before, beats } = played(board({ you: { monsters: ["lantern-owl"] }, rival: { monsters: [{ card: "pocket-cub", position: "defense" }] }, phase: "battle" }), { type: "attack", attacker: 0, target: 0 });
		expect(flights(before, beats, BEAT)[0]?.turned).toBe(true);
	});

	it("only charges for an attack, not for a monster's effect", () => {
		expect(lunges([[{ kind: "beam", from: { at: "zone", side: "you", row: "monsters", zone: 0 }, to: { at: "lantern", side: "rival" }, art: ATTACK_ART }], [{ kind: "beam", from: { at: "zone", side: "you", row: "monsters", zone: 1 }, to: { at: "lantern", side: "rival" }, art: "🦉" }]], 1)).toHaveLength(1);
	});

	it("rises first, then charges, hits when it says it does, and comes back", () => {
		const still = { reach: 0, lift: 0, grow: 0, lean: 0 };
		expect(lungeAt(0)).toEqual(still);
		expect(lungeAt(1)).toEqual(still);
		/* Rising: high and bigger, but still over its own zone. */
		const risen = lungeAt(0.25);
		expect(risen.lift).toBeGreaterThan(0.7);
		expect(risen.grow).toBeGreaterThan(0.2);
		expect(risen.reach).toBeLessThanOrEqual(0);
		/* At the hit it is at its target, and it never goes past it. */
		expect(lungeAt(LUNGE_HIT_SHARE).reach).toBeCloseTo(0.8);
		for (let u = 0; u <= 1; u += 0.02) expect(lungeAt(u).reach).toBeLessThanOrEqual(0.8 + 1e-9);
		expect(lungeAt(0.95).reach).toBeLessThan(0.1);
	});

	it("knocks a monster that is hit back, and lets it spring forward again", () => {
		expect(knockAt(-0.1)).toBe(0);
		expect(knockAt(0)).toBe(0);
		expect(knockAt(0.12)).toBeGreaterThan(0.15);
		expect(knockAt(0.5)).toBe(0);
	});

	it("keeps a card in its zone until it leaves, breaks a destroyed one before it flies, and hides it once it has arrived", () => {
		expect(flightAt("destroyed", -1)).toMatchObject({ along: 0, scale: 1, shown: true, shake: 0, burst: 0 });
		/* First the pieces jump apart, where the card stood. */
		expect(flightAt("destroyed", 0.2)).toMatchObject({ along: 0, scale: 1 });
		expect(flightAt("destroyed", 0.2).burst).toBeGreaterThan(0.5);
		expect(flightAt("destroyed", 0.31).burst).toBeGreaterThan(0.95);
		/* Then they fly, closing up as they go. */
		expect(flightAt("destroyed", 0.7).along).toBeGreaterThan(0.4);
		expect(flightAt("destroyed", 0.98).along).toBeGreaterThan(0.95);
		expect(flightAt("destroyed", 0.98).burst).toBeLessThan(0.3);
		expect(flightAt("destroyed", 1).shown).toBe(false);
		/* Other cards fly whole. */
		expect(flightAt("tribute", 0.5).burst).toBe(0);
		expect(flightAt("tribute", 0.5).along).toBeCloseTo(0.5);
		expect(flightAt("banished", 0.9).spin).toBeGreaterThan(1);
		expect(flightAt("draw", 0.99).scale).toBeCloseTo(1, 1);
	});

	it("throws every piece of a broken card a different way, up and away from its middle", () => {
		const count = PIECES.across * PIECES.down;
		const thrown = Array.from({ length: count }, (_, index) => pieceThrow(index));
		expect(new Set(thrown.map((item) => `${item.x.toFixed(2)}:${item.z.toFixed(2)}`)).size).toBe(count);
		for (const item of thrown) expect(item.y).toBeGreaterThan(0.5);
		/* The left pieces go left, the right ones right. */
		expect(thrown[0]!.x).toBeLessThan(0);
		expect(thrown[1]!.x).toBeGreaterThan(0);
		expect(pieceThrow(3)).toEqual(pieceThrow(3));
	});
});

describe("the big moments of a move, in order", () => {
	it("shows a battle as cause, then effect: the charge, the hit, the destroyed monster, then the Life Points", () => {
		const { before, events, beats } = battle();
		const [clash] = clashes(events, beats, BEAT);
		expect(clash).toMatchObject({ side: "you", attacker: "lantern-owl", attackerValue: 1800, defender: { card: "pocket-cub", value: 1200, position: "attack" }, winner: "attacker", from: { at: "zone", side: "you" }, to: { at: "zone", side: "rival" } });
		expect(clashes(events, beats, BEAT)).toHaveLength(1);
		const [gone] = flights(before, beats, BEAT);
		const [change] = lifeChanges(beats, BEAT);
		expect(change).toMatchObject({ side: "rival", amount: -600, from: 4000, to: 3400 });
		/* The numbers appear with the charge, the monsters meet, the loser breaks, the amount is shown, the counter rolls. */
		expect(clash!.start).toBeLessThan(clash!.hit);
		expect(clash!.hit).toBeCloseTo(LUNGE_HIT * BEAT);
		expect(clash!.hit).toBeLessThan(gone!.start);
		expect(gone!.start).toBeLessThan(change!.start);
		expect(change!.start).toBeLessThan(change!.roll);
		expect(clash!.end).toBeGreaterThan(gone!.start);
		/* A whole battle takes about two seconds: long enough to follow, short enough to keep playing. */
		const hits = impacts(beats, BEAT);
		const total = Math.max(playLength(beats, BEAT), showLength([clash!], [change!], hits));
		expect(change!.roll + 0.7).toBeGreaterThan(1.5);
		expect(change!.roll + 0.7).toBeLessThan(2.8);
		expect(total).toBeLessThan(4);
	});

	it("says who has the higher number, and compares DEF when the defender defends", () => {
		const lost = played(board({ you: { monsters: ["pocket-cub"] }, rival: { monsters: ["lantern-owl"] }, phase: "battle" }), { type: "attack", attacker: 0, target: 0 });
		expect(clashes(lost.events, lost.beats, BEAT)[0]).toMatchObject({ winner: "defender", attackerValue: 1200, defender: { value: 1800 } });
		const wall = played(board({ you: { monsters: ["pocket-cub"] }, rival: { monsters: [{ card: "moss-beetle", position: "defense" }] }, phase: "battle" }), { type: "attack", attacker: 0, target: 0 });
		expect(clashes(wall.events, wall.beats, BEAT)[0]).toMatchObject({ winner: "defender", defender: { value: 2000, position: "defense" } });
		const tie = played(board({ you: { monsters: ["pocket-cub"] }, rival: { monsters: ["pocket-cub"] }, phase: "battle" }), { type: "attack", attacker: 0, target: 0 });
		expect(clashes(tie.events, tie.beats, BEAT)[0]?.winner).toBe("tie");
	});

	it("shows a direct attack as one number, the damage, and hits the player", () => {
		const { events, beats } = direct();
		const [clash] = clashes(events, beats, BEAT);
		expect(clash).toMatchObject({ attackerValue: 1800, defender: null, winner: "attacker", to: { at: "lantern", side: "rival" } });
		const hits = impacts(beats, BEAT);
		expect(hits.map((hit) => hit.kind)).toEqual(["clash", "hurt"]);
		expect(hits[1]).toMatchObject({ at: { at: "lantern", side: "rival" }, power: hurtPower(1800) });
		expect(hits[0]!.time).toBeLessThan(hits[1]!.time);
		expect(lifeChanges(beats, BEAT)[0]).toMatchObject({ side: "rival", amount: -1800 });
	});

	it("shows Life Points gained as a gain that does not shake the table", () => {
		const { beats } = played(board({ you: { hand: ["glow-charm"] } }), { type: "place", card: "glow-charm", row: "backrow", zone: 0 });
		const [change] = lifeChanges(beats, BEAT);
		expect(change?.amount).toBeGreaterThan(0);
		expect(change?.side).toBe("you");
		const hits = impacts(beats, BEAT);
		expect(hits.map((hit) => hit.kind)).toEqual(["heal"]);
		expect(shakeAt(hits, hits[0]!.time + 0.05)).toBe(0);
	});

	it("hits a monster destroyed by a Spell, where it stands", () => {
		const { beats } = played(board({ you: { hand: ["thunder-clap"] }, rival: { monsters: ["mud-toad"] } }), { type: "place", card: "thunder-clap", row: "backrow", zone: 0, target: 0 });
		expect(impacts(beats, BEAT)).toEqual([expect.objectContaining({ kind: "strike", at: { at: "zone", side: "rival", row: "monsters", zone: 0 } })]);
	});

	it("shakes hard at a hit and is still again soon after, harder for a bigger loss", () => {
		const hit = { id: "a", kind: "hurt" as const, at: { at: "lantern" as const, side: "you" as const }, time: 1, power: hurtPower(2000) };
		expect(shakeAt([hit], 0.99)).toBe(0);
		expect(shakeAt([hit], 1)).toBeCloseTo(hurtPower(2000));
		expect(shakeAt([hit], 1 + SHAKE_TIME / 2)).toBeLessThan(shakeAt([hit], 1.01));
		expect(shakeAt([hit], 1 + SHAKE_TIME + 0.001)).toBe(0);
		expect(hurtPower(300)).toBeLessThan(hurtPower(2000));
		expect(hurtPower(9000)).toBe(1);
		expect(shakeAt([hit, { ...hit, id: "b" }, { ...hit, id: "c" }], 1)).toBe(1);
	});

	it("has no numbers for an attack that a Trap stops", () => {
		const beats = [[{ kind: "beam" as const, from: { at: "zone" as const, side: "rival" as const, row: "monsters" as const, zone: 0 }, to: { at: "zone" as const, side: "you" as const, row: "monsters" as const, zone: 0 }, art: ATTACK_ART }]];
		expect(clashes([{ type: "attack-declared", side: "rival", attacker: "lantern-owl", target: "pocket-cub" }, { type: "attack-stopped", attacker: "lantern-owl" }], beats, BEAT)).toEqual([]);
	});
});

describe("what the 3D mat shows and where it can be tapped", () => {
	it("offers a tap exactly where the small HTML board has a button", () => {
		const state = board({ you: { monsters: ["pocket-cub"], backrow: ["sakuretsu-armor"] }, rival: { monsters: ["lantern-owl"], backrow: ["fog-snare"] } });
		const onZone = vi.fn();
		const view = matView({ board: state, copy, layout: matLayout(false), onZone, onPile: vi.fn() });
		const tappable = view.filter((item) => item.tap).map((item) => item.place.key).sort();
		expect(tappable).toEqual(["rival-monsters-0", "rival-monsters-1", "rival-monsters-2", "you-backrow-0", "you-backrow-1", "you-backrow-2", "you-monsters-0", "you-monsters-1", "you-monsters-2"]);
		view.find((item) => item.place.key === "rival-monsters-1")!.tap!();
		expect(onZone).toHaveBeenCalledWith("rival", "monsters", 1);
		/* A demonstration has no handlers: nothing can be tapped. */
		expect(matView({ board: state, copy, layout: matLayout(false) }).some((item) => item.tap)).toBe(false);
	});

	it("shows the places a small-board level does not use, quiet: no tap, no glow, no card", () => {
		const state = board({ you: { monsters: ["pocket-cub"] } });
		const layout = matLayout(false);
		const view = matView({ board: state, copy, layout, glow: new Set(layout.places.map((item) => item.key)), onZone: vi.fn(), onPile: vi.fn() });
		expect(view).toHaveLength(layout.places.length);
		const quiet = view.filter((item) => item.quiet);
		/* Per player: two spare zones a row, the Extra Monster Zone, Field Zone, Extra Deck, banished cards and, with no Deck in the level, the Deck. */
		expect(quiet).toHaveLength(2 * 9);
		for (const item of quiet) {
			expect(item.tap, item.place.key).toBeUndefined();
			expect(item.state, item.place.key).toBe("plain");
			expect(item.card, item.place.key).toBeUndefined();
		}
		expect(view.find((item) => item.place.key === "you-graveyard")?.quiet).toBe(false);
		/* A level that uses a Deck has it awake. */
		const drawing = matView({ board: board({ you: { deck: ["mud-toad"] } }), copy, layout });
		expect(drawing.find((item) => item.place.key === "you-deck")).toMatchObject({ quiet: false, pile: { count: 1, top: null } });
		expect(drawing.find((item) => item.place.key === "rival-deck")?.quiet).toBe(true);
	});

	it("offers a tap exactly where the whole HTML mat has a button", () => {
		const state = board({ full: true, you: { monsters: ["pocket-cub"] } });
		const onZone = vi.fn();
		const onPile = vi.fn();
		const view = matView({ board: state, copy, layout: matLayout(true), onZone, onPile });
		expect(view.some((item) => item.quiet)).toBe(false);
		const tappable = new Set(view.filter((item) => item.tap).map((item) => item.place.key));
		for (const key of ["you-monsters-0", `you-monsters-${EXTRA_ZONE}`, "rival-monsters-3", `rival-monsters-${EXTRA_ZONE}`, "you-backrow-4", "you-field-0", "you-graveyard", "rival-graveyard", "you-banished", "rival-banished", "you-extra"]) expect(tappable.has(key), key).toBe(true);
		for (const key of ["rival-backrow-0", "rival-field-0", "rival-extra", "you-deck", "rival-deck"]) expect(tappable.has(key), key).toBe(false);
		view.find((item) => item.place.key === "you-field-0")!.tap!();
		expect(onZone).toHaveBeenCalledWith("you", "field", 0);
		view.find((item) => item.place.key === "rival-graveyard")!.tap!();
		expect(onPile).toHaveBeenCalledWith("rival", "graveyard");
		view.find((item) => item.place.key === "you-extra")!.tap!();
		expect(onPile).toHaveBeenCalledWith("you", "extra");
		view.find((item) => item.place.key === `rival-monsters-${EXTRA_ZONE}`)!.tap!();
		expect(onZone).toHaveBeenCalledWith("rival", "monsters", EXTRA_ZONE);
	});

	it("shows the number that counts, the position, the choices and what is held back", () => {
		const state = board({ you: { monsters: ["pocket-cub", { card: "moss-beetle", position: "defense" }], backrow: ["sakuretsu-armor"] }, rival: { backrow: ["fog-snare"] } });
		const view = matView({ board: state, copy, layout: matLayout(false), glow: new Set(["you-monsters-2"]), chosen: new Set(["you-monsters-0"]), landing: new Map([["you-monsters-0", 1.3]]), holding: new Map([["you-monsters-0", { atk: 700, def: 800, delay: 0.9 }]]) });
		const at = (key: string) => view.find((item) => item.place.key === key)!;
		expect(at("you-monsters-0")).toMatchObject({ state: "chosen", card: { turned: false, delay: 1.3, face: { card: "pocket-cub", line: "ATK 1200", compact: true }, hold: { delay: 0.9, face: { line: "ATK 700" } } } });
		expect(at("you-monsters-1").card).toMatchObject({ turned: true, face: { line: "DEF 2000" } });
		expect(at("you-monsters-2")).toMatchObject({ state: "glow" });
		expect(at("you-monsters-2").card).toBeUndefined();
		/* The child's own Set card keeps its name; the rival's is only a back. */
		expect(at("you-backrow-0").card).toMatchObject({ face: null, backName: copy.cards["sakuretsu-armor"].name });
		expect(at("rival-backrow-0").card).toMatchObject({ face: null });
		expect(at("rival-backrow-0").card?.backName).toBeUndefined();
	});

	it("counts the piles and shows the top of a Graveyard", () => {
		const state = board({ full: true, you: { graveyard: ["pocket-cub", "lantern-owl"], deck: ["mud-toad"] } });
		const view = matView({ board: state, copy, layout: matLayout(true) });
		const at = (key: string) => view.find((item) => item.place.key === key)!;
		expect(at("you-graveyard").pile).toMatchObject({ count: 2, top: { card: "lantern-owl" } });
		expect(at("you-deck").pile).toEqual({ count: 1, top: null });
		expect(at("rival-graveyard").pile).toEqual({ count: 0, top: null });
		expect(at("you-extra").pile).toEqual({ count: 0, top: null });
		expect(at(`you-monsters-${EXTRA_ZONE}`).pile).toBeUndefined();
	});

	it("keeps a Graveyard as it was until the destroyed monster lands in it", () => {
		const { before, after } = battle();
		const layout = matLayout(false);
		const now = matView({ board: after, copy, layout });
		const held = holdPiles(now, matView({ board: before, copy, layout }), new Map([["rival-graveyard", 1.4]]));
		const grave = held.find((item) => item.place.key === "rival-graveyard")!;
		expect(grave.pile).toMatchObject({ count: 1, top: { card: "pocket-cub" } });
		expect(grave.pileHold).toEqual({ count: 0, top: null, delay: 1.4 });
		/* Nothing else is held back, and with no card in flight the list is as it was. */
		expect(held.filter((item) => item.pileHold)).toHaveLength(1);
		expect(holdPiles(now, now, new Map())).toEqual(now);
	});

	it("prints a card for the hand with both numbers, and a Spell with its type", () => {
		expect(printedFace(copy, "pocket-cub")).toMatchObject({ name: copy.cards["pocket-cub"].name, line: "1200 / 800", note: "★★★" });
		expect(printedFace(copy, "monster-reborn").line).toBe(copy.spellTypes.normal);
		const state = board({ you: { monsters: ["pocket-cub"] } });
		expect(monsterFace(copy, state, state.you.monsters[0]!, { atk: 1, def: 2 }).line).toBe("ATK 1");
	});
});
