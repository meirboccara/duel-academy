# YGOProJudge feedback audit, 2026-11-26

Retrospective check of today's YGOProJudge chats against the "a consultation ends graded" rule in CLAUDE.md. Nothing was
back-dated; no `ask` was sent; no question was repeated; the denied hand-limit ask was not retried.

## Discovery bounds (not a server-wide audit)

Found only from the local Claude session transcripts of this repo (main sessions and their subagent transcripts, timestamps from
2026-11-25T22:00Z, which covers all of 2026-11-26 local time), plus the repo's own notes (`packages/rules/README.md`,
`docs/card-plan.md`, `docs/rules-core-spec.md`). Chats opened from another machine, another repo, or without a transcript are
not seen. Latest answers were read with `scripts/ygoprojudge-chat.sh answer <sessionId>` (read-only; saved in the scratch folder
`%TEMP%\ygoj-feedback-20261126\answers`, kept for the end-of-work cleanup; no comment file was needed, so none exists).

## Chats of today

| sessionId | Topic | Latest answer (final) | Changed after a contest? | Konami source | Verdict | Status |
|---|---|---|---|---|---|---|
| `3aec450a-d863-4dbd-967a-c147e0c3df74` | True Light face-up effect: Spell Speed, Battle Phase, Damage Step | Spell Speed 2, either turn, Battle Phase yes, Damage Step no | no contest | RB10 Spell Speed table; Konami notes cid 16653 (JP, "ダメージステップ中には発動できません") | `okay` sent earlier today by the asking agent, `HTTP 201`, verdictId `b2d87a3b-8c1f-478f-abd4-7f682918c4de`, 09:28Z | already graded; not resent |
| `9c99b213-d0a0-4ca2-a9a9-641befd0e7ec` | Same topic, second chat | Same conclusion (Spell Speed 2, outside the Damage Step); cites only "ruling cache" | a contest was sent after the verdict; the latest answer is unchanged in conclusion | same as above | `okay` sent earlier today, `HTTP 201`, verdictId `fa007e73-04cf-4646-b24b-f3b8a597fb25`, 09:35Z | already graded; not resent (a second verdict would be a duplicate) |
| `c7d63408-6d38-4db3-b1ef-ee7ab1bba31f` | Can Ash Blossom be chained to an effect worded "from your hand or Deck" (Hieratic Seal of the Heavenly Spheres, Mausoleum of White)? | Yes, because the wording includes the Deck | no contest | none found for these two cards. Konami Q&A fids 24162 and 24163 (JP, OCG) and Ash's notes are about "include" and chosen bullets, close by analogy but not on these cards | none | closed, **ungraded lead** |
| `010e58c9-f636-4b6f-8daf-5c315af7a3dd` | When an optional "During your Standby Phase" Trigger Effect may be activated (Primite Dragon Ether Beryl) | Latest answer asks for a card name ("黄泉ガエル" not found) and restates the Fast Effect Timing box A; two answers in all, no source cited | contested once; no change toward a source | none found (the FET page it named says nothing on it, per README) | none | closed, **ungraded lead** |
| `73f9806a-5da2-4273-8f9d-e32536e2124a` | Activation legality when the effect cannot be done (Pot of Sloth with no opposing card; Sky Striker Mobilize - Linkage! with nothing to send) | Cannot be activated; mandatory parts must be possible at activation | one clarification, same answer | Konami JP notes on both cards (cid 23010, 17034) say nothing on activation legality; Sloth has no Q&A | none | closed, **ungraded lead** |
| `ac590c63-1e57-4810-9e6d-caa8bb6951f0` | Does a negation from Sky Striker Mecha - Widow Anchor stay through the control change and the End Phase return? | Yes, the negation lasts to the end of the turn; "no official source retrieved" | no contest | none: Konami notes cid 13675 and Q&A fids 8398, 17476 do not cover it (README) | none | closed, **ungraded lead** |
| `81360f55-16b2-4d93-ab17-0f7bd99190a9` | End Phase hand adjustment | no question held ("NOT ASKED") | none | none | none | **empty**, excluded. The ask was refused locally (text over 1000 characters), the retry was then denied by the permission classifier, and the chat was closed. Not retried and not routed around |

Also seen, not a chat: `open true-light-effect-speed-2026-11-26` at 09:23Z failed with `invalid_api_key` and returned no session.

## Totals

- graded `okay` by this audit: 0
- graded `issue` by this audit: 0
- already graded (verdict stands from earlier today, no 409 provoked): 2
- ungraded leads (no Konami page): 4
- empty: 1
- blocked: 1 (the denied hand-limit ask, same chat as the empty one)

## Notes

- No verdict was sent by this audit: both gradable chats were already graded, and the other four have no Konami page that
  settles them, so they stay leads, as CLAUDE.md requires. The README entries for them stay labelled "YGOProJudge only".
- The Ash chat's question is the only one with a plausible Konami answer to look for: a Konami Q&A on an effect that offers
  "hand or Deck" and Ash (OCG fid 24162's "the effect still includes the Deck part" is the nearest). If one is read later, grade
  `c7d63408` then (it is closed).
- Pilot disputes settled directly from Konami (`settleDispute`, via `konami`) are not judge calls and are not listed.
- A transcript of one subagent (session 488f2e6d) contains a hard-coded partner key in a command line. It was masked here and
  never copied; the owner may want to rotate it.

## Follow-up 2026-11-26: Ash Blossom "hand or Deck" source check (chat `c7d63408`)

Read in full from cached pages (no fetch needed): Ash's notes and Q&A list (cid 12950, JP, all 79 titles over 8 list pages), Q&A fids
24162 and 24163, the notes of Hieratic Seal of the Heavenly Spheres (cid 13496) and Mausoleum of White (cid 12331), and every cached Ash Q&A
(86 files) searched for "手札またはデッキ", "手札かデッキ", "手札・デッキ".

- Ash notes (https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=12950&request_locale=ja): "●のいずれかを含む魔法・罠・モンスターの効果が発動した時に、直接チェーンして発動できます。" Nothing on "hand or Deck".
- fid 24162 (https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=5&fid=24162&request_locale=ja, 2026-09-25): "『セットせず手札に加える事もできる』効果を適用できない状況で「三戦の号」を発動した時でも『●デッキからカードを手札に加える効果』が含まれているためです。" It is about an effect that includes a Deck addition even when that part cannot apply; it is not about a hand-or-Deck choice.
- fid 24163 (...fid=24163..., 2026-10-30): only the chosen bullet of a "choose 1" card counts. Not on hand-or-Deck.
- Ash Q&A list: no title or cached body mentions a "hand or Deck" source. The nearest are the two above.
- Cards' notes (cid 13496, cid 12331): no statement about Ash Blossom; Mausoleum's notes only say "自分の手札またはデッキに通常モンスターが存在する場合に発動できます。"

Result: Konami is **silent on the specific "from your hand or Deck" case**. The judge's answer (yes) is consistent by analogy with fid 24162 but no
Konami page states it. **No verdict sent** (CLAUDE.md: no Konami page, no verdict); the chat stays a lead. No `verdict` call was made, so no HTTP result
and no 409. Not retried, no `ask` sent.

Script check (read only): `hieratic-seal-of-the-heavenly-spheres.ts` (categories include `summon-from-deck`) and `mausoleum-of-white.ts`
(`send-from-deck`) already let Ash answer these effects, both marked "YGOProJudge only, 2026-11-26" in a code comment; Ash's own script is
unchanged by this. Those two comments are the right label until a Konami page appears.
