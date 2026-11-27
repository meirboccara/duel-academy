import type { CardSources } from "../coverage";
import { type Duel, materialsOf, moveCard, other } from "../duel";
import { ask, type CardDef } from "../effects";
import { addModifier, atk } from "../modifiers";
import { detach } from "../procedures";
import { konamiCardUrl } from "../sources";
import { summonedCount } from "../summon";

const NAME = "Super Starslayer TY-PHON - Sky Crisis";

/** Every monster on the field of either player, face-up or face-down. */
const monstersOnField = (duel: Duel): number[] => [...duel.piles.you.monster, ...duel.piles.rival.monster];

/**
 * "2 Level 12 monsters. During the turn, or turn after, your opponent Special Summoned 2 or more monsters from the Extra Deck, you can also Xyz Summon
 * this card by using 1 monster you control with the highest ATK (your choice, if tied). (Transfer its materials.) If you do, you cannot Normal or Special
 * Summon for the rest of this turn. While this Xyz Summoned monster is on the field, neither player can activate the effects of monsters with 3000 or more
 * ATK. Once per turn: You can detach 1 material from this card; return 1 monster from the field to the hand." A DARK Fiend Xyz Effect Monster of Rank 12.
 *
 * - Procedure: the Xyz Summon with 2 Level 12 monsters (the default of `xyz`: Levels equal to the Rank), or the alternative one. The alternative is not an effect
 *   but a way of Summoning, a proper Xyz Summon, and a Summon of the Main Phase only like the other one (notes). Open during the turn the opponent Special
 *   Summoned 2 or more monsters from the Extra Deck, and the next one (`summonedCount`: the notes of the Summons of this turn and the last). Its material is a
 *   face-up monster its controller controls whose ATK is the highest among their face-up monsters (the player chooses among tied ones; an ATK of 0 is fine:
 *   notes), and its Xyz Materials go under this card (`transfer`). The core's reading: a face-down monster has no ATK to compare, so it is neither the
 *   material nor in the comparison. A Token cannot be the material and then no other monster can (notes): the core has no Tokens, so that ruling is pending.
 *   "If you do, you cannot Normal or Special Summon for the rest of this turn" is not an effect (notes): it is applied once the material is used
 *   (`ifYouDo`, a `summon` lock for Normal and Special Summons, not Sets: Konami's Q&A fid 24169), and the alternative Summon itself can be made in a turn
 *   when a monster was already Summoned. While it applies, no effect that gives an additional Normal Summon can be used (Q&A fid 17215).
 * - First effect: a Continuous Effect of the Monster Zone, on both players (notes), only while the card was Xyz Summoned (`summonedBy`): no player can activate the
 *   effects of monsters whose ATK is 3000 or more, even a monster that is unaffected by monster effects (notes: the activation itself is stopped). "Monsters"
 *   are the face-up monsters on the field and their current ATK: a monster in the hand or the Graveyard is a monster card, not a "monster" in the card text's
 *   sense, so it still activates (**YGOProJudge's answer only**, asked 2026-11-25, no source cited; chat 9dc0dafb, one question, no follow-up). A Set monster flipped
 *   face-up is one when its Flip effect would be activated. Not the activation of a Spell or Trap Card of a monster card.
 * - Second effect: an Ignition Effect of the Monster Zone (notes), once per turn for each copy. Detaching 1 Xyz Material (the player chooses which) is the
 *   cost; the monster, any monster on the field of either player and this card included, is chosen when the effect resolves (no target) and returned to its
 *   owner's hand.
 */
export const SUPER_STARSLAYER_TY_PHON_SKY_CRISIS: CardDef = {
	code: "super-starslayer-ty-phon-sky-crisis",
	kind: "monster",
	facts: { name: NAME, attribute: "DARK", monsterType: "Fiend", frame: "xyz", rank: 12, atk: 2900, def: 2900 },
	procedure: {
		kind: "xyz",
		alternatives: [
			{
				condition: (duel, { player }) => [duel.turn.number, duel.turn.number - 1].some((turn) => summonedCount(duel, { player: other(player), turn, from: "extra", how: "special" }) >= 2),
				materials: { min: 1, filter: (duel, card, { player }) => card.face === "up" && duel.piles[player].monster.every((id) => duel.cards[id]!.face !== "up" || atk(duel, id) <= atk(duel, card.id)) },
				transfer: true,
				ifYouDo: (duel, { player }) => addModifier(duel, { affects: () => false, until: duel.turn.number, layer: { kind: "lock", what: "summon", who: player, ways: ["normal", "special"] } }),
			},
		],
	},
	effects: [
		{
			type: "continuous",
			condition: (_duel, { card }) => card.summonedBy === "xyz",
			affects: () => false,
			modifies: () => [{ kind: "lock", what: "activate", who: "both", stops: (duel, attempt) => attempt.def.kind === "monster" && attempt.effect.type !== "activation" && attempt.card.zone === "monster" && attempt.card.face === "up" && atk(duel, attempt.card.id) >= 3000, describe: "the effects of monsters with 3000 or more ATK" }],
		},
		{
			type: "ignition",
			categories: ["return-to-hand"],
			once: { scope: "instance" },
			cost: { pick: (duel, { card }) => materialsOf(duel, card.id).map((id) => [id]), pay: (duel, { card }, picked) => (picked.length === 1 ? detach(duel, card.id, picked[0]) : null) },
			operation: (duel, link) => ask(duel, link.player, monstersOnField(duel), (board, picked) => moveCard(board, picked, { zone: "hand", effect: link })),
		},
	],
};

const NOTES = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=19184&request_locale=ja";
const qa = (fid: number) => `https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=${fid}&request_locale=ja`;
const EN = konamiCardUrl(19184, "en");

export const SUPER_STARSLAYER_TY_PHON_SKY_CRISIS_SOURCES: CardSources = {
	code: "super-starslayer-ty-phon-sky-crisis",
	cid: 19184,
	french: {
		text: "2 monstres de Niveau 12\nDurant le tour ou le tour après que votre adversaire a Invoqué Spécialement min. 2 monstres depuis l'Extra Deck, vous pouvez aussi Invoquer par Xyz cette carte en utilisant 1 monstre que vous contrôlez avec la plus haute ATK (en cas d'égalité, vous choisissez). (Transférez ses Matériels.) Si vous le faites, vous ne pouvez Invoquer ni Normalement ni Spécialement le reste de ce tour. Tant que ce monstre Invoqué par Xyz est sur le Terrain, aucun joueur ne peut activer les effets des monstres avec min. 3000 ATK. Une fois par tour : vous pouvez détacher 1 Matériel de cette carte ; renvoyez 1 monstre depuis le Terrain à la main.",
		url: konamiCardUrl(19184, "fr"),
		read: "2026-11-25",
	},
	sources: [
		{ id: "facts", kind: "card-text", cid: 19184, url: EN, read: "2026-11-25", quote: "Super Starslayer TY-PHON - Sky Crisis DARK Rank 12 ATK 2900 DEF 2900 Fiend ／ Xyz／Effect" },
		{ id: "procedure", kind: "card-text", cid: 19184, url: EN, read: "2026-11-25", quote: "2 Level 12 monsters" },
		{ id: "alternative", kind: "card-text", cid: 19184, url: EN, read: "2026-11-25", quote: "During the turn, or turn after, your opponent Special Summoned 2 or more monsters from the Extra Deck, you can also Xyz Summon this card by using 1 monster you control with the highest ATK (your choice, if tied). (Transfer its materials.)" },
		{ id: "if-you-do", kind: "card-text", cid: 19184, url: EN, read: "2026-11-25", quote: "If you do, you cannot Normal or Special Summon for the rest of this turn." },
		{ id: "lock", kind: "card-text", cid: 19184, url: EN, read: "2026-11-25", quote: "While this Xyz Summoned monster is on the field, neither player can activate the effects of monsters with 3000 or more ATK." },
		{ id: "detach", kind: "card-text", cid: 19184, url: EN, read: "2026-11-25", quote: "Once per turn: You can detach 1 material from this card; return 1 monster from the field to the hand." },
		// OCG only. Konami's notes (補足情報, 2023-07-22), page read 2026-11-25. Its 2 Q&A entries (fids 17215 and 24169) were opened and read in full.
		{ id: "notes-alternative-not-effect", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■効果として扱いません。このモンスターをエクシーズ召喚する方法です。" },
		{ id: "notes-alternative-proper", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■この方法も正規の方法によるこのモンスターのエクシーズ召喚です。" },
		{ id: "notes-alternative-main-phase", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■レベル１２モンスター２体を素材としてエクシーズ召喚する場合と同じく、原則としてこの方法によるエクシーズ召喚は自分メインフェイズにしか行えません。" },
		{ id: "notes-alternative-highest", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■自分フィールドの攻撃力が一番高いモンスターが複数体存在する場合、そのうち１体の上に重ねてエクシーズ召喚できます。" },
		{ id: "notes-alternative-zero", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■自分フィールドのモンスターの一番高い攻撃力が０である（攻撃力０のモンスターしか存在しない）状況でも、そのモンスターの上に重ねてエクシーズ召喚できます。" },
		{ id: "notes-alternative-token", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■自分フィールドの攻撃力が一番高いモンスターがモンスタートークンの場合、この方法でエクシーズ召喚することはできません。" },
		{ id: "notes-if-you-do-not-effect", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "■すでにモンスターを召喚・特殊召喚したターンでも、このカードをテキストに記載されている方法で特殊召喚できます。" },
		{ id: "notes-lock-field", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "【①の効果について】■モンスターゾーンで適用する永続効果です。" },
		{ id: "notes-lock-both", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "（攻撃力３０００以上のモンスターがモンスター効果を受けない状態であっても、お互いにそのモンスターの効果を発動できなくなります。）" },
		{ id: "notes-detach-field", kind: "jp-notes", cid: 19184, url: NOTES, read: "2026-11-25", quote: "【②の効果について】■モンスターゾーンで発動できる起動効果です。" },
		{ id: "qa-set-after", kind: "jp-qa", cid: 19184, fid: 24169, url: qa(24169), read: "2026-11-25", quote: "通常召喚ができる状況であれば、モンスターを裏側守備表示でセットできます。" },
		{ id: "qa-extra-normal-summon", kind: "jp-qa", cid: 19184, fid: 17215, url: qa(17215), read: "2026-11-25", quote: "『このターン自分は通常召喚に加えて１度だけモンスター１体をアドバンス召喚できる』効果を適用することができないためです。" },
	],
	effects: ["facts", "procedure", "alternative", "if-you-do", "lock", "detach"],
	rulings: [
		{ source: "notes-alternative-not-effect" },
		{ source: "notes-alternative-proper" },
		{ source: "notes-alternative-main-phase" },
		{ source: "notes-alternative-highest" },
		{ source: "notes-alternative-zero" },
		{ source: "notes-if-you-do-not-effect" },
		{ source: "notes-lock-field" },
		{ source: "notes-lock-both" },
		{ source: "notes-detach-field" },
		{ source: "qa-set-after" },
		{ source: "qa-extra-normal-summon" },
		{ source: "notes-alternative-token", pending: "A Token that is the monster with the highest ATK blocks the alternative Summon; the core has no Tokens" },
	],
};
