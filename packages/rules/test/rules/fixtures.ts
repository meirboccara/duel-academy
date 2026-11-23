import { type Action, act, breakEffect, raiseEvent, type CardDef, cardsIn, createDuel, type Duel, type Effect, legalActions, moveCard, negateActivation, negateEffect, other, type Phase, type Side, type TeachingOptions, type Zone } from "../../src";

/**
 * Test cards for step 2, written with the provisional effect shape of src/effects.ts. None is registered in
 * CARD_SOURCES: real cards come through the definition of done once effect records exist (step 4).
 */

const discardItself: Effect["cost"] = { pay: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }) };
const top = (duel: Duel) => duel.chain[duel.chain.length - 1];

/**
 * Made-up cards, one per way of activating. Each writes its code in `log` when its effect is applied, so a test can
 * see which links resolved and in which order.
 */
export function plainCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): Effect["resolve"] => (duel) => {
		log.push(code);
		return duel;
	};
	const card = (code: string, kind: CardDef["kind"], effect: Partial<Effect> = {}): CardDef => ({ code, kind, effects: [{ activates: "card", resolve: logs(code), ...effect }] });
	const cards: CardDef[] = [
		{ code: "monster", kind: "monster" },
		card("spell", "spell"),
		card("other-spell", "spell"),
		card("quick-play", "quick-play"),
		card("other-quick-play", "quick-play"),
		card("trap", "trap"),
		card("other-trap", "trap"),
		// A Counter Trap that negates the activation it is chained to.
		card("counter", "counter-trap", {
			condition: (duel) => duel.chain.length > 0,
			resolve: (duel, _link, index) => {
				log.push("counter");
				return negateActivation(duel, index - 1);
			},
		}),
		// A Trap that only answers an activation.
		card("answer", "trap", { condition: (duel) => duel.chain.length > 0 }),
		// A Quick-Play Spell that targets 1 monster on the field.
		card("aimed", "quick-play", { targets: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster] }),
		// A monster with a Quick Effect in the hand, discarded as cost.
		card("hand-quick", "monster", { activates: "effect", speed: 2, from: "hand", cost: discardItself }),
		// A monster with an Ignition Effect on the field.
		card("ignition", "monster", { activates: "effect", speed: 1, from: "field" }),
		// A monster with a Quick Effect on the field.
		card("field-quick", "monster", { activates: "effect", speed: 2, from: "field" }),
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

const FIELD_SPELLS = new Set(["umi"]);

/**
 * Real cards, as far as the provisional shape can say them. Texts read on Konami's card database, 2026-11-23.
 * Left for later steps: once-per-turn limits, the player's choice of which card to add, shuffling after a search.
 */
export const REAL_CARDS: Record<string, CardDef> = Object.fromEntries(
	(
		[
			{ code: "umi", kind: "spell" },
			{ code: "celtic-guardian", kind: "monster" },
			// Terraforming (cid 5537): "Add 1 Field Spell from your Deck to your hand."
			{
				code: "terraforming",
				kind: "spell",
				effects: [
					{
						activates: "card",
						categories: ["search"],
						condition: (duel, { player }) => duel.piles[player].deck.some((id) => FIELD_SPELLS.has(duel.cards[id]!.code)),
						resolve: (duel, link) => {
							const found = duel.piles[link.player].deck.find((id) => FIELD_SPELLS.has(duel.cards[id]!.code));
							return found === undefined ? duel : moveCard(duel, found, { zone: "hand" });
						},
					},
				],
			},
			// Ash Blossom & Joyous Spring (cid 12950): "When a card or effect is activated that includes any of these
			// effects (Quick Effect): You can discard this card; negate that effect. ●Add a card from the Deck to the
			// hand. ●Special Summon from the Deck. ●Send a card from the Deck to the GY."
			{
				code: "ash-blossom",
				kind: "monster",
				effects: [
					{
						activates: "effect",
						speed: 2,
						from: "hand",
						condition: (duel) => top(duel)?.categories.some((category) => category === "search" || category === "summon-from-deck" || category === "send-from-deck") ?? false,
						cost: discardItself,
						resolve: (duel, _link, index) => negateEffect(duel, index - 1),
					},
				],
			},
			// Mystical Space Typhoon (cid 4909): "Target 1 Spell/Trap on the field; destroy that target."
			{
				code: "mystical-space-typhoon",
				kind: "quick-play",
				effects: [
					{
						activates: "card",
						targets: (duel, { card }) => [...duel.piles.you.spell, ...duel.piles.rival.spell].filter((id) => id !== card.id),
						resolve: (duel, link) => {
							const target = duel.cards[link.targets[0]!]!;
							return target.zone === "spell" ? moveCard(duel, target.id, { zone: "graveyard" }) : duel;
						},
					},
				],
			},
			// D.D. Crow (cid 6980): "(Quick Effect): You can discard this card to the GY, then target 1 card in your
			// opponent's GY; banish that target."
			{
				code: "dd-crow",
				kind: "monster",
				effects: [
					{
						activates: "effect",
						speed: 2,
						from: "hand",
						targets: (duel, { player }) => duel.piles[other(player)].graveyard,
						cost: discardItself,
						resolve: (duel, link) => {
							const target = duel.cards[link.targets[0]!]!;
							return target.zone === "graveyard" ? moveCard(duel, target.id, { zone: "banished" }) : duel;
						},
					},
				],
			},
			// Needlebug Nest (cid 7769), a Normal Trap: "Send the top 5 cards of your Deck to the GY."
			{
				code: "needlebug-nest",
				kind: "trap",
				effects: [
					{
						activates: "card",
						categories: ["send-from-deck"],
						resolve: (duel, link) => duel.piles[link.player].deck.slice(0, 5).reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), duel),
					},
				],
			},
		] satisfies CardDef[]
	).map((def) => [def.code, def]),
);

export interface SideSpec {
	hand?: string[];
	/** Set in the Spell & Trap Zone on an earlier turn. */
	set?: string[];
	/** Set in the Spell & Trap Zone this turn. */
	setThisTurn?: string[];
	/** Face-up monsters. */
	monsters?: string[];
	graveyard?: string[];
	deck?: string[];
}

/** Builds a position: your turn, Main Phase 1, the game state open, unless told otherwise. */
export function position(spec: { defs: Record<string, CardDef>; you?: SideSpec; rival?: SideSpec; turn?: Side; phase?: Phase; options?: Partial<TeachingOptions> }): Duel {
	const places: [keyof SideSpec, Zone, "up" | "down" | undefined][] = [
		["hand", "hand", undefined],
		["set", "spell", "down"],
		["setThisTurn", "spell", "down"],
		["monsters", "monster", "up"],
		["graveyard", "graveyard", undefined],
		["deck", "deck", undefined],
	];
	const all = (side: SideSpec) => places.flatMap(([key]) => side[key] ?? []);
	const sides = { you: spec.you ?? {}, rival: spec.rival ?? {} };
	let duel = createDuel({ seed: 7, you: { deck: all(sides.you) }, rival: { deck: all(sides.rival) }, defs: spec.defs, options: spec.options });
	const setThisTurn: number[] = [];
	let id = 1;
	for (const side of ["you", "rival"] as const) {
		for (const [key, zone, face] of places) {
			for (const _code of sides[side][key] ?? []) {
				if (zone !== "deck") duel = moveCard(duel, id, { zone, face });
				if (key === "setThisTurn") setThisTurn.push(id);
				id++;
			}
		}
	}
	const turn = spec.turn ?? "you";
	// Placing the cards for the position is not something that happened in the duel.
	return { ...duel, turn: { player: turn, number: 3, phase: spec.phase ?? "main1" }, priority: { holder: turn, passed: [], open: true }, setThisTurn, live: [], waiting: [] };
}

export const codes = (duel: Duel, side: Side, zone: Zone) => cardsIn(duel, side, zone).map((card) => card.code);

/** One line per action, sorted: "pass", "set trap", "activate quick-play", "activate aimed > monster". */
export function label(duel: Duel, action: Action): string {
	if (action.type === "pass") return "pass";
	const code = duel.cards[action.card]!.code;
	if (action.type === "set") return `set ${code}`;
	return `activate ${code}${action.targets.map((target) => ` > ${duel.cards[target]!.code}`).join("")}`;
}
export const offered = (duel: Duel) => legalActions(duel).map((action) => label(duel, action)).sort();

/** Does the action described, as the player holding priority: play(duel, "activate trap"), play(duel, "pass"). */
export function play(duel: Duel, ...moves: string[]): Duel {
	for (const move of moves) {
		const action = legalActions(duel).find((candidate) => label(duel, candidate) === move);
		if (!action) throw new Error(`"${move}" is not offered to ${duel.priority.holder}; offered: ${offered(duel).join(", ")}`);
		duel = act(duel, action);
	}
	return duel;
}

const banishGraveyards = (duel: Duel) => [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard].reduce((next, id) => moveCard(next, id, { zone: "banished" }), duel);

const sentToGraveyard: NonNullable<Effect["on"]> = (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.after.zone === "graveyard";

/**
 * Made-up cards for the trigger tests, written with the provisional effect shape. A monster whose trigger is "sent to
 * the Graveyard" writes its code in `log` when it resolves. `sweep` sends every monster on both fields to the
 * Graveyard at once.
 */
export function triggerCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): Effect["resolve"] => (duel) => {
		log.push(code);
		return duel;
	};
	const sentBy = (code: string, mandatory: boolean, timing: "when" | "if", more: Partial<Effect> = {}): CardDef => ({
		code,
		kind: "monster",
		effects: [{ activates: "trigger", from: "graveyard", mandatory, timing, on: sentToGraveyard, resolve: logs(code), ...more }],
	});
	const sweepAll = (duel: Duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster].reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), duel);
	const cards: CardDef[] = [
		// A hand effect that discards the card as its cost; once in the Graveyard, it triggers.
		...(["when", "if"] as const).map((timing): CardDef => {
			const code = `pitcher-${timing}`;
			const trigger = sentBy(code, false, timing).effects![0]!;
			return { code, kind: "monster", effects: [{ activates: "effect", speed: 2, from: "hand", cost: discardItself, resolve: (duel) => (log.push(`${code} quick`), duel) }, trigger] };
		}),
		// "Special Summon 1 monster from your hand", and the same followed by "then" something else.
		...(["summon-and", "summon-then"] as const).map((code): CardDef => ({
			code,
			kind: "spell",
			effects: [
				{
					activates: "card",
					resolve: (duel, link) => {
						const id = duel.piles[link.player].hand.find((held) => duel.defs[duel.cards[held]!.code]?.kind === "monster");
						if (id === undefined) return duel;
						const moved = moveCard(duel, id, { zone: "monster", face: "up" });
						const summoned = raiseEvent(moved, { type: "summoned", card: moved.cards[id]!, how: "special" });
						return code === "summon-then" ? breakEffect(summoned) : summoned;
					},
				},
			],
		})),
		// Torrential Tribute: "When a monster(s) is Summoned: Destroy all monsters on the field."
		{
			code: "tribute",
			kind: "trap",
			effects: [{ activates: "card", on: (_duel, event) => event.type === "summoned", resolve: (duel) => (log.push("tribute"), duel) }],
		},
		{ code: "tribute-b", kind: "trap", effects: [{ activates: "card", on: (_duel, event) => event.type === "summoned", resolve: (duel) => (log.push("tribute-b"), duel) }] },
		// "When a monster is Summoned" (mandatory), the trigger that Torrential Tribute answers.
		{ code: "summon-watcher", kind: "monster", effects: [{ activates: "trigger", mandatory: true, on: (_duel, event) => event.type === "summoned", resolve: logs("summon-watcher") }] },
		{ code: "monster", kind: "monster" },
		// "During your Standby Phase" (both players' monsters answer to the turn's Standby Phase, so any side's card may use it).
		...[true, false].map((mandatory): CardDef => {
			const code = mandatory ? "standby-forced" : "standby-optional";
			return { code, kind: "monster", effects: [{ activates: "trigger", mandatory, on: (_duel, event) => event.type === "phase" && event.phase === "standby", resolve: logs(code) }] };
		}),
		// "When this card is sent to the GY: Target 1 monster your opponent controls": mandatory, so it must be aimed.
		sentBy("forced-aim", true, "when", { targets: (duel, { player }) => duel.piles[other(player)].monster }),
		// "When a card is Set": optional.
		{ code: "set-watcher", kind: "monster", effects: [{ activates: "trigger", on: (_duel, event) => event.type === "moved" && event.before.zone === "hand" && event.after.zone === "spell" && event.after.face === "down", resolve: logs("set-watcher") }] },
		{ code: "spell", kind: "spell", effects: [{ activates: "card", resolve: logs("spell") }] },
		// Sends your monsters to the GY, back to the hand, and to the GY again, all at once: a card triggers twice.
		{
			code: "churn",
			kind: "spell",
			effects: [
				{
					activates: "card",
					resolve: (duel, link) => {
						const ids = [...duel.piles[link.player].monster];
						const to = (zone: "graveyard" | "hand") => (state: Duel) => ids.reduce((next, id) => moveCard(next, id, { zone }), state);
						return to("graveyard")(to("hand")(to("graveyard")(duel)));
					},
				},
			],
		},
		// A mandatory trigger whose cost banishes the card itself.
		sentBy("forced-exile", true, "when", { cost: { pay: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }) } }),
		// "Send 1 monster your opponent controls to the GY" (the rival's, whoever activates it): a Spell and a Quick-Play Spell.
		...(["hit-rival", "hit-rival-quick"] as const).map((code): CardDef => ({
			code,
			kind: code === "hit-rival" ? "spell" : "quick-play",
			effects: [{ activates: "card", resolve: (duel) => (duel.piles.rival.monster[0] === undefined ? duel : moveCard(duel, duel.piles.rival.monster[0], { zone: "graveyard" })) }],
		})),
		// "Each time a monster you do not control is sent to the GY" (mandatory), and the same without "each time".
		...([true, false] as const).map((each): CardDef => {
			const code = each ? "each-counter" : "once-counter";
			return {
				code,
				kind: "monster",
				effects: [{ activates: "trigger", mandatory: true, each, on: (_duel, event, { card }) => event.type === "moved" && event.before.zone === "monster" && event.after.zone === "graveyard" && event.after.controller !== card.controller, resolve: logs(code) }],
			};
		}),
		// Writes what its controller's Spell & Trap Zones hold while it resolves.
		{ code: "peek", kind: "spell", effects: [{ activates: "card", resolve: (duel) => (log.push(`peek sees ${duel.piles.you.spell.map((id) => duel.cards[id]!.code).sort().join(",")}`), duel) }] },
		{ code: "quick-play", kind: "quick-play", effects: [{ activates: "card", resolve: logs("quick-play") }] },
		// "Banish all cards in both Graveyards."
		{ code: "vacuum", kind: "spell", effects: [{ activates: "card", resolve: banishGraveyards }] },
		// A mandatory trigger that banishes both Graveyards as its cost.
		sentBy("forced-vacuum", true, "when", { cost: { pay: banishGraveyards } }),
		sentBy("forced-a", true, "when"),
		sentBy("forced-b", true, "when"),
		sentBy("forced-c", true, "when"),
		sentBy("if-a", false, "if"),
		sentBy("if-b", false, "if"),
		sentBy("when-a", false, "when"),
		sentBy("when-b", false, "when"),
		// "Send your monsters to the GY, then send your opponent's": the second half happens after something else did.
		{
			code: "then-sweep",
			kind: "spell",
			effects: [
				{
					activates: "card",
					resolve: (duel, link) => {
						const sent = duel.piles[link.player].monster.reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), duel);
						return sent.piles[other(link.player)].monster.reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), breakEffect(sent));
					},
				},
			],
		},
		// "Send all the monsters you control to the GY": a Spell, and a Quick-Play Spell to answer with.
		...(["purge-spell", "purge-quick"] as const).map((code): CardDef => ({
			code,
			kind: code === "purge-spell" ? "spell" : "quick-play",
			effects: [{ activates: "card", resolve: (duel, link) => (log.push(code), duel.piles[link.player].monster.reduce((next, id) => moveCard(next, id, { zone: "graveyard" }), duel)) }],
		})),
		{ code: "sweep", kind: "spell", effects: [{ activates: "card", resolve: (duel) => (log.push("sweep"), sweepAll(duel)) }] },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}
