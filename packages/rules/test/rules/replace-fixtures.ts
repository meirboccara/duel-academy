import { ask, atk, type CardDef, type CardInstance, destroyCard, drawCards, type Duel, effectDestruction, fromOtherCards, type Link, moveCards, type Operation, other, replaceEffect } from "../../src";
import { readinessCards } from "./readiness-fixtures";

/**
 * Made-up cards for the replacement of an effect on the chain ("that effect becomes ..."). None is a real card: every code starts with
 * `fixture-`, and none is registered in CARD_SOURCES. With them come the readiness fixtures (`fixture-counter`, `fixture-negate-aimed`,
 * `fixture-send-all`, ...).
 */
export function replaceCards(log: string[] = []): Record<string, CardDef> {
	const isAceLink = (duel: Duel, card: CardInstance): boolean => { const facts = duel.defs[card.code]?.facts; return card.face === "up" && facts?.frame === "link" && facts.archetypes?.includes("Fixture Ace") === true; };
	/** 'Destroy 1 "Fixture Ace" Link Monster your opponent controls': "you" is the player whose effect it has become; they choose. */
	const destroyAnAce: Operation = (duel, link) => {
		log.push(`replaced effect of ${link.card.code} resolves for ${link.player}`);
		const candidates = duel.piles[other(link.player)].monster.filter((id) => isAceLink(duel, duel.cards[id]!));
		return ask(duel, link.player, candidates, (board, picked) => destroyCard(board, picked, { destruction: effectDestruction(link) }));
	};
	/** "Once per turn (by name): send 1 card from your hand to the GY; draw 2 cards." */
	const drawer = (code: string, more: Partial<CardDef> = {}): CardDef => ({
		code,
		kind: "monster",
		facts: { name: code, level: 8, atk: 2500, def: 2000 },
		...more,
		effects: [
			...(more.effects ?? []),
			{
				type: "ignition",
				once: { scope: "name" },
				categories: ["draw"],
				cost: { pick: (duel, { player }) => duel.piles[player].hand.map((id) => [id]), pay: (duel, _ctx, picked) => moveCards(duel, picked, { zone: "graveyard" }) },
				operation: (duel, link) => (log.push(`${code} draws`), drawCards(duel, link.player, 2)),
			},
		],
	});
	const ace = (code: string, more: Partial<CardDef> = {}): CardDef => ({ code, kind: "monster", facts: { name: code, frame: "link", link: 1, arrows: ["bottom"], atk: 1500, archetypes: ["Fixture Ace"] }, ...more });
	const cards: CardDef[] = [
		drawer("fixture-big-drawer"),
		// The same, "unaffected by other cards' effects".
		drawer("fixture-immune-drawer", { effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effects", from: fromOtherCards }] }] }),
		// The same with 1000 ATK (below the 2000 the rewriter asks for).
		{ ...drawer("fixture-small-drawer"), facts: { name: "fixture-small-drawer", level: 4, atk: 1000, def: 1000 } },
		// "When a monster your opponent controls with 2000 or more ATK activates its effect (Quick Effect): You can make the activated
		// effect become 'Destroy 1 "Fixture Ace" Link Monster your opponent controls'." (once per turn, by name)
		ace("fixture-rewriter", {
			effects: [
				{
					type: "quick",
					once: { scope: "name" },
					condition: (duel, { player }) => {
						const top: Link | undefined = duel.chain[duel.chain.length - 1];
						if (!top || top.player === player || duel.defs[top.card.code]?.kind !== "monster" || top.card.zone !== "monster") return false;
						return atk(duel, top.card.id) >= 2000;
					},
					operation: (duel, link) => (log.push("fixture-rewriter"), link.answers === null ? duel : replaceEffect(duel, link.answers, destroyAnAce, link)),
				},
			],
		}),
		ace("fixture-plain-ace"),
		// A "Fixture Ace" Link Monster that cannot be destroyed by card effects.
		ace("fixture-proof-ace", { effects: [{ type: "continuous", modifies: () => [{ kind: "protect", against: "effect-destruction" }] }] }),
		// A "Fixture Ace" Link Monster: "If this card is destroyed by your opponent's card effect: ..." (mandatory, in the GY).
		ace("fixture-avenging-ace", {
			effects: [
				{
					type: "trigger",
					range: "graveyard",
					mandatory: true,
					timing: "if",
					event: (_duel, event, { card }) => event.type === "moved" && event.after.id === card.id && event.destruction?.cause === "effect" && event.destruction.player !== card.owner,
					operation: (duel) => (log.push("fixture-avenging-ace"), duel),
				},
			],
		}),
	];
	return { ...readinessCards(log), ...Object.fromEntries(cards.map((def) => [def.code, def])) };
}
