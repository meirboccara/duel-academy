import { type Action, act, ask, CARD_DEFS, targetsOf, moveCards, breakEffect, raiseEvent, type CardDef, cardsIn, createDuel, type Duel, type EffectRecord, legalActions, moveCard, negateActivation, negateEffect, other, type Phase, type Side, type TeachingOptions, type Zone } from "../../src";

/**
 * Test cards, written as effect records (src/effects.ts). The made-up ones are not registered in CARD_SOURCES; the real
 * cards are the records of src/cards (`CARD_DEFS`), each with its sources and tests in test/cards.
 */

const discardItself: EffectRecord["cost"] = (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" });
const top = (duel: Duel) => duel.chain[duel.chain.length - 1];

/**
 * Made-up cards, one per way of activating. Each writes its code in `log` when its effect is applied, so a test can
 * see which links resolved and in which order.
 */
export function plainCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => {
		log.push(code);
		return duel;
	};
	const card = (code: string, kind: CardDef["kind"], effect: Partial<EffectRecord> = {}): CardDef => ({ code, kind, effects: [{ type: "activation", operation: logs(code), ...effect }] });
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
			operation: (duel, _link, index) => {
				log.push("counter");
				return negateActivation(duel, index - 1);
			},
		}),
		// A Trap that only answers an activation.
		card("answer", "trap", { condition: (duel) => duel.chain.length > 0 }),
		// A Quick-Play Spell that targets 1 monster on the field.
		card("aimed", "quick-play", { target: (duel) => [...duel.piles.you.monster, ...duel.piles.rival.monster] }),
		// A monster with a Quick Effect in the hand, discarded as cost.
		card("hand-quick", "monster", { type: "quick", range: "hand", cost: discardItself }),
		// A monster with an Ignition Effect on the field.
		card("ignition", "monster", { type: "ignition", range: "field" }),
		// A monster with a Quick Effect on the field.
		card("field-quick", "monster", { type: "quick", range: "field" }),
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

/**
 * The real cards the core plays (`CARD_DEFS`, written as effect records in src/cards) and the made-up cards they need
 * around them: Field Spells to search, Normal Monsters to Special Summon.
 */
export const REAL_CARDS: Record<string, CardDef> = {
	...CARD_DEFS,
	umi: { code: "umi", kind: "spell", facts: { icon: "field" } },
	"other-field": { code: "other-field", kind: "spell", facts: { icon: "field" } },
	"normal-4": { code: "normal-4", kind: "monster", facts: { level: 4, normal: true } },
	"normal-4-b": { code: "normal-4-b", kind: "monster", facts: { level: 4, normal: true } },
	"normal-6": { code: "normal-6", kind: "monster", facts: { level: 6, normal: true } },
	"effect-4": { code: "effect-4", kind: "monster", facts: { level: 4, effect: true } },
	// Needlebug Nest (cid 7769), a Normal Trap: "Send the top 5 cards of your Deck to the GY." Not one of the core's cards.
	"needlebug-nest": {
		code: "needlebug-nest",
		kind: "trap",
		effects: [{ type: "activation", categories: ["send-from-deck"], operation: (duel, link) => moveCards(duel, duel.piles[link.player].deck.slice(0, 5), { zone: "graveyard" }) }],
	},
};

export interface SideSpec {
	hand?: string[];
	/** Set in the Spell & Trap Zone on an earlier turn. */
	set?: string[];
	/** Set in the Spell & Trap Zone this turn. */
	setThisTurn?: string[];
	/** Face-up monsters. */
	monsters?: string[];
	/** Face-up Spell and Trap Cards in the Spell & Trap Zone (Continuous cards whose effects are activated). */
	faceupSpells?: string[];
	/** Face-down monsters (Defense Position). */
	facedown?: string[];
	/** Face-up monsters in Defense Position. */
	defense?: string[];
	/** Step 7: a face-up monster in an Extra Monster Zone (yours: the one over your second column, slot 5; the rival's: slot 6). */
	extraZone?: string[];
	graveyard?: string[];
	deck?: string[];
	/** Step 8: the Extra Deck (face-down), and Pendulum Monsters face-up on it. */
	extra?: string[];
	extraFaceUp?: string[];
}

/** Builds a position: your turn, Main Phase 1, the game state open, unless told otherwise. */
export function position(spec: { defs: Record<string, CardDef>; you?: SideSpec; rival?: SideSpec; turn?: Side; phase?: Phase; options?: Partial<TeachingOptions> }): Duel {
	const places: [keyof SideSpec, Zone, "up" | "down" | undefined, ("attack" | "defense")?][] = [
		["hand", "hand", undefined],
		["set", "spell", "down"],
		["setThisTurn", "spell", "down"],
		["monsters", "monster", "up"],
		["facedown", "monster", "down"],
		["defense", "monster", "up", "defense"],
		["extraZone", "monster", "up"],
		["faceupSpells", "spell", "up"],
		["graveyard", "graveyard", undefined],
		["deck", "deck", undefined],
	];
	const all = (side: SideSpec) => places.flatMap(([key]) => side[key] ?? []);
	const sides = { you: spec.you ?? {}, rival: spec.rival ?? {} };
	const extraOf = (side: SideSpec) => [...(side.extra ?? []), ...(side.extraFaceUp ?? [])];
	let duel = createDuel({ seed: 7, you: { deck: all(sides.you), extra: extraOf(sides.you) }, rival: { deck: all(sides.rival), extra: extraOf(sides.rival) }, defs: spec.defs, options: spec.options });
	const setThisTurn: number[] = [];
	let id = 1;
	for (const side of ["you", "rival"] as const) {
		for (const [key, zone, face, battlePosition] of places) {
			for (const _code of sides[side][key] ?? []) {
				// Step 7: a Field Spell is placed in the Field Zone.
				const placed = zone === "spell" && spec.defs[_code]?.facts?.icon === "field" ? "field" : zone;
				if (zone !== "deck") duel = moveCard(duel, id, { zone: placed, face, ...(battlePosition ? { position: battlePosition } : {}), ...(key === "extraZone" ? { slot: side === "you" ? 5 : 6 } : {}) });
				if (key === "setThisTurn") setThisTurn.push(id);
				id++;
			}
		}
		// The Extra Deck's cards come after the side's other cards: those face-up on it (Pendulum Monsters) are turned now.
		id += sides[side].extra?.length ?? 0;
		for (const _code of sides[side].extraFaceUp ?? []) duel = moveCard(duel, id++, { zone: "extra", face: "up" });
	}
	const turn = spec.turn ?? "you";
	// Placing the cards for the position is not something that happened in the duel.
	return { ...duel, turn: { player: turn, number: 3, phase: spec.phase ?? "main1" }, priority: { holder: turn, passed: [], open: true }, setThisTurn, live: [], waiting: [] };
}

export const codes = (duel: Duel, side: Side, zone: Zone) => cardsIn(duel, side, zone).map((card) => card.code);

/** One line per action, sorted: "pass", "set trap", "activate quick-play", "activate aimed > monster". */
export function label(duel: Duel, action: Action): string {
	if (action.type === "pass") return "pass";
	if (action.type === "place") return `place ${action.zone}`;
	if (action.type === "declare") return `declare ${action.declaration.value}`;
	if (action.type === "pendulum-summon") return "pendulum-summon";
	const code = duel.cards[action.card]!.code;
	if (action.type === "set") return `set ${code}`;
	if (action.type === "summon") return `${action.how === "special" ? "special-summon" : "summon"} ${code}${action.extra ? " additional" : ""}`;
	if (action.type === "choose") return `choose ${code}`;
	if (action.type === "apply") return `apply ${code}`;
	if (action.type === "flip-summon" || action.type === "change-position") return `${action.type} ${code}`;
	if (action.type === "attack") return `attack ${code} ${action.target === null ? "directly" : `> ${duel.cards[action.target]!.code}`}`;
	const mode = action.mode === undefined ? "" : ` :${action.mode}`;
	const declared = action.declared === undefined ? "" : ` =${action.declared.value}`;
	const groups = action.groups === undefined ? "" : ` {${action.groups.join(",")}}`;
	return `activate ${code}${mode}${declared}${(action.paid ?? []).map((card) => ` ~ ${duel.cards[card]!.code}`).join("")}${action.targets.map((target) => ` > ${duel.cards[target]!.code}`).join("")}${groups}`;
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

const banishGraveyards = (duel: Duel) => moveCards(duel, [...duel.piles.you.graveyard, ...duel.piles.rival.graveyard], { zone: "banished" });

const sentToGraveyard: NonNullable<EffectRecord["event"]> = (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.after.zone === "graveyard";

/**
 * Made-up cards for the trigger tests, written as effect records. A monster whose trigger is "sent to
 * the Graveyard" writes its code in `log` when it resolves. `sweep` sends every monster on both fields to the
 * Graveyard at once.
 */
export function triggerCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => {
		log.push(code);
		return duel;
	};
	const sentBy = (code: string, mandatory: boolean, timing: "when" | "if", more: Partial<EffectRecord> = {}): CardDef => ({
		code,
		kind: "monster",
		effects: [{ type: "trigger", range: "graveyard", mandatory, timing, event: sentToGraveyard, operation: logs(code), ...more }],
	});
	const sweepAll = (duel: Duel) => moveCards(duel, [...duel.piles.you.monster, ...duel.piles.rival.monster], { zone: "graveyard" });
	const cards: CardDef[] = [
		// A hand effect that discards the card as its cost; once in the Graveyard, it triggers.
		...(["when", "if"] as const).map((timing): CardDef => {
			const code = `pitcher-${timing}`;
			const trigger = sentBy(code, false, timing).effects![0]!;
			return { code, kind: "monster", effects: [{ type: "quick", range: "hand", cost: discardItself, operation: (duel) => (log.push(`${code} quick`), duel) }, trigger] };
		}),
		// "Special Summon 1 monster from your hand", and the same followed by "then" something else.
		...(["summon-and", "summon-then"] as const).map((code): CardDef => ({
			code,
			kind: "spell",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
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
			effects: [{ type: "activation", event: (_duel, event) => event.type === "summoned", operation: (duel) => (log.push("tribute"), duel) }],
		},
		{ code: "tribute-b", kind: "trap", effects: [{ type: "activation", event: (_duel, event) => event.type === "summoned", operation: (duel) => (log.push("tribute-b"), duel) }] },
		// "When a monster is Summoned" (mandatory), the trigger that Torrential Tribute answers.
		{ code: "summon-watcher", kind: "monster", effects: [{ type: "trigger", mandatory: true, event: (_duel, event) => event.type === "summoned", operation: logs("summon-watcher") }] },
		{ code: "monster", kind: "monster" },
		// "During your Standby Phase" (both players' monsters answer to the turn's Standby Phase, so any side's card may use it).
		...[true, false].map((mandatory): CardDef => {
			const code = mandatory ? "standby-forced" : "standby-optional";
			return { code, kind: "monster", effects: [{ type: "trigger", mandatory, event: (_duel, event) => event.type === "phase" && event.phase === "standby", operation: logs(code) }] };
		}),
		// "When this card is sent to the GY: Target 1 monster your opponent controls": mandatory, so it must be aimed.
		sentBy("forced-aim", true, "when", { target: (duel, { player }) => duel.piles[other(player)].monster }),
		// "When a card is Set": optional.
		{ code: "set-watcher", kind: "monster", effects: [{ type: "trigger", event: (_duel, event) => event.type === "moved" && event.before.zone === "hand" && event.after.zone === "spell" && event.after.face === "down", operation: logs("set-watcher") }] },
		{ code: "spell", kind: "spell", effects: [{ type: "activation", operation: logs("spell") }] },
		// Sends your monsters to the GY, back to the hand, and to the GY again, all at once: a card triggers twice.
		{
			code: "churn",
			kind: "spell",
			effects: [
				{
					type: "activation",
					operation: (duel, link) => {
						const ids = [...duel.piles[link.player].monster];
						const to = (zone: "graveyard" | "hand") => (state: Duel) => moveCards(state, ids, { zone });
						return to("graveyard")(to("hand")(to("graveyard")(duel)));
					},
				},
			],
		},
		// A mandatory trigger whose cost banishes the card itself.
		sentBy("forced-exile", true, "when", { cost: (duel, { card }) => moveCard(duel, card.id, { zone: "banished" }) }),
		// "Send 1 monster your opponent controls to the GY" (the rival's, whoever activates it): a Spell and a Quick-Play Spell.
		...(["hit-rival", "hit-rival-quick"] as const).map((code): CardDef => ({
			code,
			kind: code === "hit-rival" ? "spell" : "quick-play",
			effects: [{ type: "activation", operation: (duel) => (duel.piles.rival.monster[0] === undefined ? duel : moveCard(duel, duel.piles.rival.monster[0], { zone: "graveyard" })) }],
		})),
		// "Each time a monster you do not control is sent to the GY" (mandatory), and the same without "each time".
		...([true, false] as const).map((each): CardDef => {
			const code = each ? "each-counter" : "once-counter";
			return {
				code,
				kind: "monster",
				effects: [{ type: "trigger", mandatory: true, each, event: (_duel, event, { card }) => event.type === "moved" && event.before.zone === "monster" && event.after.zone === "graveyard" && event.after.controller !== card.controller, operation: logs(code) }],
			};
		}),
		// Writes what its controller's Spell & Trap Zones hold while it resolves.
		{ code: "peek", kind: "spell", effects: [{ type: "activation", operation: (duel) => (log.push(`peek sees ${duel.piles.you.spell.map((id) => duel.cards[id]!.code).sort().join(",")}`), duel) }] },
		{ code: "quick-play", kind: "quick-play", effects: [{ type: "activation", operation: logs("quick-play") }] },
		// "Send all monsters your opponent controls to the GY" (the rival's, whoever activates it), all at once.
		{ code: "sweep-rival", kind: "spell", effects: [{ type: "activation", operation: (duel) => moveCards(duel, duel.piles.rival.monster, { zone: "graveyard" }) }] },
		// "Banish all cards in both Graveyards."
		{ code: "vacuum", kind: "spell", effects: [{ type: "activation", operation: banishGraveyards }] },
		// A mandatory trigger that banishes both Graveyards as its cost.
		sentBy("forced-vacuum", true, "when", { cost: banishGraveyards }),
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
					type: "activation",
					operation: (duel, link) => {
						const sent = moveCards(duel, duel.piles[link.player].monster, { zone: "graveyard" });
						return moveCards(breakEffect(sent), sent.piles[other(link.player)].monster, { zone: "graveyard" });
					},
				},
			],
		},
		// "Send all the monsters you control to the GY": a Spell, and a Quick-Play Spell to answer with.
		...(["purge-spell", "purge-quick"] as const).map((code): CardDef => ({
			code,
			kind: code === "purge-spell" ? "spell" : "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => (log.push(code), moveCards(duel, duel.piles[link.player].monster, { zone: "graveyard" })) }],
		})),
		{ code: "sweep", kind: "spell", effects: [{ type: "activation", operation: (duel) => (log.push("sweep"), sweepAll(duel)) }] },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}

/**
 * Made-up cards for the step 4 tests (costs, targets, choices, categories, once per turn). Each writes its code in
 * `log` when its effect is applied.
 */
export function recordCards(log: string[] = []): Record<string, CardDef> {
	const logs = (code: string): EffectRecord["operation"] => (duel) => {
		log.push(code);
		return duel;
	};
	const firstOf = (duel: Duel, side: Side, zone: Zone) => duel.piles[side][zone][0];
	const monsterIn = (duel: Duel, side: Side, zone: Zone) => duel.piles[side][zone].filter((id) => duel.defs[duel.cards[id]!.code]?.kind === "monster");
	const cards: CardDef[] = [
		{ code: "monster", kind: "monster" },
		{ code: "monster-b", kind: "monster" },
		// "Send 1 other card from your hand to the GY; draw 0": a Spell whose cost needs another card in the hand.
		{
			code: "pay-a-card",
			kind: "spell",
			effects: [{ type: "activation", cost: (duel, { player, card }) => { const other = duel.piles[player].hand.find((id) => id !== card.id); return other === undefined ? null : moveCard(duel, other, { zone: "graveyard" }); }, operation: logs("pay-a-card") }],
		},
		// "Banish 1 monster from your GY; target 1 monster in your GY": the cost may take the only target.
		{
			code: "banish-then-aim",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					cost: (duel, { player }) => { const first = monsterIn(duel, player, "graveyard")[0]; return first === undefined ? null : moveCard(duel, first, { zone: "banished" }); },
					target: (duel, { player }) => monsterIn(duel, player, "graveyard"),
					operation: logs("banish-then-aim"),
				},
			],
		},
		// "Send the top card of your Deck to the GY, then target 1 card in your GY": the cost makes the target.
		{
			code: "mill-then-aim",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					cost: (duel, { player }) => { const top = firstOf(duel, player, "deck"); return top === undefined ? null : moveCard(duel, top, { zone: "graveyard" }); },
					target: (duel, { player }) => duel.piles[player].graveyard,
					operation: logs("mill-then-aim"),
				},
			],
		},
		// Targets of other counts, all in your Graveyard: "target 2 monsters", "target up to 2", "you can target 1" (no target is fine).
		...([
			["aim-two", { min: 2, max: 2 }],
			["aim-up-to-two", { min: 1, max: 2 }],
			["aim-optional", { min: 0, max: 1 }],
		] as const).map(([code, count]): CardDef => ({
			code,
			kind: "quick-play",
			effects: [{ type: "activation", target: (duel, { player }) => monsterIn(duel, player, "graveyard"), targetCount: count, operation: (duel, link) => (log.push(`${code} aims ${targetsOf(duel, link).map((card) => card.code).sort().join(",")}`), duel) }],
		})),
		// "Target 2 monsters" whose candidate list repeats every card (a card written carelessly): a card is still not paired with itself.
		{
			code: "aim-two-repeated",
			kind: "quick-play",
			effects: [{ type: "activation", target: (duel, { player }) => [...monsterIn(duel, player, "graveyard"), ...monsterIn(duel, player, "graveyard")], targetCount: { min: 2, max: 2 }, operation: logs("aim-two-repeated") }],
		},
		// A definition error: a count of targets with nothing to target.
		{ code: "count-without-target", kind: "quick-play", effects: [{ type: "activation", targetCount: { min: 2, max: 2 }, operation: logs("count-without-target") }] },
		// The same with a cost that banishes the first monster of your Graveyard.
		{
			code: "banish-then-aim-two",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					cost: (duel, { player }) => { const first = monsterIn(duel, player, "graveyard")[0]; return first === undefined ? null : moveCard(duel, first, { zone: "banished" }); },
					target: (duel, { player }) => monsterIn(duel, player, "graveyard"),
					targetCount: { min: 2, max: 2 },
					operation: logs("banish-then-aim-two"),
				},
			],
		},
		// "Discard 1 card": a Spell whose cost is the player's choice among the other cards of the hand.
		{
			code: "discard-one",
			kind: "spell",
			effects: [
				{
					type: "activation",
					cost: {
						pick: (duel, { player, card }) => duel.piles[player].hand.filter((id) => id !== card.id).map((id) => [id]),
						pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }),
					},
					operation: logs("discard-one"),
				},
			],
		},
		// "Discard 1 card; target 1 monster in your GY": the card discarded may be the target.
		{
			code: "discard-then-aim",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					cost: {
						pick: (duel, { player, card }) => duel.piles[player].hand.filter((id) => id !== card.id).map((id) => [id]),
						pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }),
					},
					target: (duel, { player }) => monsterIn(duel, player, "graveyard"),
					operation: logs("discard-then-aim"),
				},
			],
		},
		// "Tribute 1 monster": a Quick-Play Spell with a cost that cannot be paid without one, and a cheap pre-check for it.
		{
			code: "tribute-one",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					cost: {
						can: (duel, { player }) => duel.piles[player].monster.length > 0,
						pick: (duel, { player }) => duel.piles[player].monster.map((id) => [id]),
						pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }),
					},
					operation: logs("tribute-one"),
				},
			],
		},
		// "Add 1 monster from your Deck to your hand": the player picks which one when it resolves.
		...(["pick-from-deck", "pick-quick"] as const).map((code): CardDef => ({
			code,
			kind: code === "pick-quick" ? "quick-play" : "spell",
			effects: [
				{
					type: "activation",
					categories: ["search"],
					condition: (duel, { player }) => monsterIn(duel, player, "deck").length > 0,
					operation: (duel, link) => ask(duel, link.player, monsterIn(duel, link.player, "deck"), (board, picked) => (log.push(`${code} adds ${board.cards[picked]!.code}`), moveCard(board, picked, { zone: "hand" }))),
				},
			],
		})),
		// "Send the top card of your Deck to the GY."
		{ code: "mill-top", kind: "quick-play", effects: [{ type: "activation", operation: (duel, link) => { const top = firstOf(duel, link.player, "deck"); return top === undefined ? duel : moveCard(duel, top, { zone: "graveyard" }); } }] },
		// "Return all other Spells/Traps you control to the hand, then Set them": each comes back as a new card.
		{
			code: "reset-backrow",
			kind: "quick-play",
			// Step 7: a Field Spell goes back to the Field Zone.
			effects: [{ type: "activation", operation: (duel, link) => [...duel.piles[link.player].spell, ...duel.piles[link.player].field].filter((id) => id !== link.card.id).reduce((board, id) => { const zone = board.cards[id]!.zone; return moveCard(moveCard(board, id, { zone: "hand" }), id, { zone, face: "down" }); }, duel) }],
		},
		// "Return all cards in your GY to the hand, then send them to the GY again."
		{
			code: "recycle-graveyard",
			kind: "quick-play",
			effects: [{ type: "activation", operation: (duel, link) => duel.piles[link.player].graveyard.reduce((board, id) => moveCard(moveCard(board, id, { zone: "hand" }), id, { zone: "graveyard" }), duel) }],
		},
		{ code: "log-quick", kind: "quick-play", effects: [{ type: "activation", operation: logs("log-quick") }] },
		// An effect whose categories are read when it is activated: "search" only if the Deck still holds a monster once the cost is paid.
		{
			code: "mill-then-search",
			kind: "quick-play",
			effects: [
				{
					type: "activation",
					categories: (duel, { player }) => (monsterIn(duel, player, "deck").length > 0 ? ["search"] : []),
					cost: (duel, { player }) => { const top = firstOf(duel, player, "deck"); return top === undefined ? null : moveCard(duel, top, { zone: "graveyard" }); },
					operation: logs("mill-then-search"),
				},
			],
		},
		{ code: "reckless-search", kind: "quick-play", effects: [{ type: "activation", categories: (duel, { player }) => (monsterIn(duel, player, "deck").length > 0 ? ["search"] : []), operation: logs("reckless-search") }] },
		// "Send all monsters from your Deck to the GY" as a cost, and nothing else.
		{ code: "deck-sweeper", kind: "quick-play", effects: [{ type: "activation", cost: (duel, { player }) => moveCards(duel, monsterIn(duel, player, "deck"), { zone: "graveyard" }), operation: logs("deck-sweeper") }] },
		// Hand effects that answer the top link: discard to negate its effect (a "search" one, or any).
		{ code: "search-negator", kind: "monster", effects: [{ type: "quick", range: "hand", condition: (duel) => duel.chain[duel.chain.length - 1]?.categories.includes("search") ?? false, cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
		{ code: "effect-negator", kind: "monster", effects: [{ type: "quick", range: "hand", condition: (duel) => duel.chain.length > 0, cost: (duel, { card }) => moveCard(duel, card.id, { zone: "graveyard" }), operation: (duel, _link, index) => negateEffect(duel, index - 1) }] },
		// One monster per scope, each with a Quick Effect on the field that writes its code in the log.
		...(["instance", "name", "duel", "chain"] as const).map((scope): CardDef => ({ code: `once-${scope}`, kind: "monster", effects: [{ type: "quick", range: "field", once: { scope }, operation: logs(`once-${scope}`) }] })),
		// "You can only activate 1 [name] per turn": a Quick-Play Spell.
		{ code: "once-activation", kind: "quick-play", effects: [{ type: "activation", once: { scope: "activation" }, operation: logs("once-activation") }] },
		// Two effects that share one limit ("You can only use 1 [name] effect per turn").
		{ code: "once-shared", kind: "monster", effects: ["a", "b"].map((id): EffectRecord => ({ type: "quick", range: "field", once: { scope: "name", key: "once-shared" }, operation: logs(`once-shared ${id}`) })) },
		// Two effects each with its own "Once per turn:".
		{ code: "once-two", kind: "monster", effects: ["a", "b"].map((id): EffectRecord => ({ type: "quick", range: "field", once: { scope: "instance" }, operation: logs(`once-two ${id}`) })) },
		// A mandatory "when this card is sent to the GY" trigger, once per turn by name.
		{ code: "once-trigger", kind: "monster", effects: [{ type: "trigger", mandatory: true, range: "graveyard", event: sentToGraveyard, once: { scope: "name" }, operation: logs("once-trigger") }] },
		{ code: "sweep", kind: "spell", effects: [{ type: "activation", operation: (duel) => (log.push("sweep"), moveCards(duel, [...duel.piles.you.monster, ...duel.piles.rival.monster], { zone: "graveyard" })) }] },
	];
	return Object.fromEntries(cards.map((def) => [def.code, def]));
}
