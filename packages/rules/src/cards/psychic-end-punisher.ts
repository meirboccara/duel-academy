import type { CardSources } from "../coverage";
import { type Duel, moveCards, other, type Side } from "../duel";
import { type CardDef, targetGroupsOf } from "../effects";
import { payLp } from "../life";
import { addModifier, FOREVER, fromActivated, fromOpponent } from "../modifiers";
import { konamiCardUrl } from "../sources";

const NAME = "Psychic End Punisher";

/** Every card on `player`'s field, face-up or face-down: a monster, a Spell or Trap Card, a Field Spell. */
const cardsOnField = (duel: Duel, player: Side): number[] => [...duel.piles[player].monster, ...duel.piles[player].spell, ...duel.piles[player].field];

/**
 * "1 Tuner + 1+ non-Tuner monsters. While your LP are less than or equal to your opponent's, this Synchro Summoned card is unaffected by your
 * opponent's activated effects. Once per turn: You can pay 1000 LP, then target 1 monster you control and 1 card your opponent controls; banish them.
 * At the start of the Battle Phase: You can make this card gain ATK equal to the difference in your LP and your opponent's." A LIGHT Psychic Synchro
 * Effect Monster of Level 11.
 *
 * - Procedure: the generic Synchro Summon (`procedure: { kind: "synchro" }`: 1 Tuner and 1 or more non-Tuners, whose Levels add up to 11).
 * - First effect: a Continuous Effect of the Monster Zone (notes): while this card was Synchro Summoned (`summonedBy`: still so after a flip face-down or a
 *   temporary banishment, Konami's Q&A fid 14641, which lists this card among the effects that stay) and its controller's LP are less than or equal to the
 *   opponent's, the effects the opponent activates (a Chain Link: `fromActivated`) are not applied to it. Not a Continuous Effect of the opponent's cards,
 *   and not the controller's own effects. It can still be targeted, and the effect is then not applied when it resolves (Q&A fid 23617).
 * - Second effect: an Ignition Effect of the Monster Zone (notes), once per turn for each copy. Paying 1000 LP is the cost, then the two targets are chosen
 *   (coupled targets: 1 monster the controller controls, itself included, and 1 card the opponent controls, a face-down one included). When it resolves
 *   the targets still targeted are banished face-up, also when only one is left (notes).
 * - Third effect: an optional Trigger Effect of the Monster Zone (notes) at the start of each Battle Phase, whoever's turn it is (the "start" of the phase
 *   is its Start Step, and the effect can be activated once for each Start Step: notes). The ATK gained is the difference between the Life Points when it
 *   resolves, a number that is not recalculated afterwards and no duration is printed, so it lasts as long as it is that card on the field; it is the card's
 *   own effect on itself, which stops while its effects are negated.
 */
export const PSYCHIC_END_PUNISHER: CardDef = {
	code: "psychic-end-punisher",
	kind: "monster",
	facts: { name: NAME, attribute: "LIGHT", monsterType: "Psychic", frame: "synchro", level: 11, atk: 3500, def: 3500 },
	procedure: { kind: "synchro" },
	effects: [
		{
			type: "continuous",
			condition: (duel, { player, card }) => card.summonedBy === "synchro" && duel.lp[player] <= duel.lp[other(player)],
			modifies: () => [{ kind: "protect", against: "effects", from: (duel, by, target) => fromOpponent(duel, by, target) && fromActivated(duel, by) }],
		},
		{
			type: "ignition",
			categories: ["banish"],
			once: { scope: "instance" },
			cost: (duel, { player }) => payLp(duel, player, 1000),
			targetGroups: (duel, { player }) => [
				{ from: duel.piles[player].monster, min: 1, max: 1 },
				{ from: cardsOnField(duel, other(player)), min: 1, max: 1 },
			],
			operation: (duel, link) =>
				moveCards(
					duel,
					targetGroupsOf(duel, link).flatMap((group) => group.map((card) => card.id)),
					{ zone: "banished", face: "up", effect: link },
				),
		},
		{
			type: "trigger",
			timing: "if",
			event: (_duel, event) => event.type === "phase" && event.phase === "battle",
			operation: (duel, link) => {
				const now = duel.cards[link.card.id]!;
				if (now.zone !== "monster" || now.face !== "up" || now.moves !== link.card.moves) return duel;
				const gain = Math.abs(duel.lp.you - duel.lp.rival);
				return addModifier(duel, { affects: { card: now.id, moves: now.moves }, until: FOREVER, layer: { kind: "add", stat: "atk", by: gain }, by: link, own: true });
			},
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=17154&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(17154, "en");

export const PSYCHIC_END_PUNISHER_SOURCES: CardSources = {
	code: "psychic-end-punisher",
	cid: 17154,
	french: {
		text: "1 Syntoniseur + 1+ monstre non-Syntoniseur\nTant que vos LP sont inférieurs ou égaux à ceux de votre adversaire, cette carte Invoquée par Synchronisation n'est pas affectée par les effets activés de votre adversaire. Une fois par tour : vous pouvez payer 1000 LP, puis ciblez 1 monstre que vous contrôlez et 1 carte contrôlée par votre adversaire ; bannissez-les. Au début de la Battle Phase : vous pouvez faire gagner à cette carte une ATK égale à la différence entre vos LP et ceux de votre adversaire.",
		url: konamiCardUrl(17154, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 17154, url: EN, read: "2026-11-25", quote: "Psychic End Punisher LIGHT Level 11 ATK 3500 DEF 3500 Psychic ／ Synchro／Effect" },
		{ id: "procedure", kind: "card-text", cid: 17154, url: EN, read: "2026-11-25", quote: "1 Tuner + 1+ non-Tuner monsters" },
		{ id: "unaffected", kind: "card-text", cid: 17154, url: EN, read: "2026-11-25", quote: "While your LP are less than or equal to your opponent's, this Synchro Summoned card is unaffected by your opponent's activated effects." },
		{ id: "banish", kind: "card-text", cid: 17154, url: EN, read: "2026-11-25", quote: "Once per turn: You can pay 1000 LP, then target 1 monster you control and 1 card your opponent controls; banish them." },
		{ id: "gain", kind: "card-text", cid: 17154, url: EN, read: "2026-11-25", quote: "At the start of the Battle Phase: You can make this card gain ATK equal to the difference in your LP and your opponent's." },
		// OCG only. Konami's notes (補足情報, 2024-12-21), page read 2026-11-25. Its 8 Q&A entries: the titles were read and three opened (fids 14641, 23617 and 23510); the others are about other cards ("Light Vessel Waterfall", "Cyber Dark End Dragon", "Dragonmaid Tirrul", "Shooting Sonic").
		{ id: "notes-unaffected-field", kind: "jp-notes", cid: 17154, url: NOTES, read: "2026-11-25", quote: "【①の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-banish-field", kind: "jp-notes", cid: 17154, url: NOTES, read: "2026-11-25", quote: "【②の効果について】■モンスターゾーンで発動できる起動効果です。" },
		{ id: "notes-banish-partial", kind: "jp-notes", cid: 17154, url: NOTES, read: "2026-11-25", quote: "■処理時に、対象のカードの一部が対象から外れた場合でも、残りの対象のカードについて処理を行います。" },
		{ id: "notes-gain-trigger", kind: "jp-notes", cid: 17154, url: NOTES, read: "2026-11-25", quote: "【③の効果について】■モンスターゾーンで発動できる誘発効果です。" },
		{ id: "notes-gain-once", kind: "jp-notes", cid: 17154, url: NOTES, read: "2026-11-25", quote: "■バトルフェイズのスタートステップごとに１度発動できます。" },
		{ id: "qa-synchro-flipped", kind: "jp-qa", cid: 17154, fid: 14641, url: qa(14641), read: "2026-11-25", quote: "シンクロ召喚したモンスターが裏側守備表示になった場合や、一時的に除外されてモンスターゾーンに戻った場合でも、引き続きシンクロ召喚によって特殊召喚したモンスターとして扱われたままとなります" },
		{ id: "qa-targeted-not-applied", kind: "jp-qa", cid: 17154, fid: 23617, url: qa(23617), read: "2026-11-25", quote: "どちらの場合でも適用されません。" },
		{ id: "qa-super-polymerization", kind: "jp-qa", cid: 17154, fid: 23510, url: qa(23510), read: "2026-11-25", quote: "融合素材にできるモンスター一組が存在していなければ、融合召喚を行う効果の発動自体ができません。" },
	],
	effects: ["facts", "procedure", "unaffected", "banish", "gain"],
	rulings: [
		{ source: "notes-unaffected-field" },
		{ source: "notes-banish-field" },
		{ source: "notes-banish-partial" },
		{ source: "notes-gain-trigger" },
		{ source: "notes-gain-once" },
		{ source: "qa-synchro-flipped" },
		{ source: "qa-targeted-not-applied" },
		{ source: "qa-super-polymerization", pending: "Fid 23510 is about \"Super Polymerization\" and \"Albaz's descendant\" with a monster that is unaffected by effects, which the core does not have" },
	],
};
