# duel-academy

Duel Academy: the Yu-Gi-Oh teaching game for children. One app today: `apps/academy-ygo` (Next.js, port 3220).
The duel rules live in `packages/engine` (`@duel-academy/engine`, no cards of its own) and the cards in
`packages/cards` (`@duel-academy/cards`); the app plugs them together.
Moved out of `meirboccara/project-meir` into its own repo; the docs in `docs/` came with it.

## Agent rules

- **Never publish anything outside this repo unless the owner asks for it in that message.** No claude.ai Artifacts, gists or uploads; no sharing links. Specs, plans and notes go in `docs/` or the session scratchpad. A subagent never publishes.
- **Work on the branch you start on.** No new branch or worktree unless the owner names one.
- **Never commit unless asked.**
- **Model split:** Opus 5.5 leads and decides when a task really needs Fable 5.2's deep rules work (chain/timing,
  summon procedures, board-state rules); Sonnet 5.5 for card scripting once the mechanic exists.
- **TCG rules questions: ask YGOProJudge.** When a rules decision is unclear (timing, chains, triggers, a card's
  ruling), ask the owner's rules site YGOProJudge through its partner API (`https://ygoprojudge.com/api/partner/v1`):
  open a session with `POST /judge-sessions` (`externalDuelId`, `callerSeat: "A"`, `format: { game: "tcg" }`), ask with
  `POST /judge-sessions/{id}/turns` (`seat: "A"`, `text` up to 1000 characters; an answer can take minutes), then
  `POST /judge-sessions/{id}/close`. Call that API directly: the ruling is in the `postTurn` response (`agent.text`;
  use a timeout of at least 5 minutes). The API's own code is the `judge-ygo` project (`lib/partner/api-reference.ts`);
  `project-meir`'s duel-nextjs is only another partner client. The key is `YGOJ_PARTNER_KEY` in
  `project-meir/apps/duel-nextjs/.env.development`; where `project-meir` is checked out differs by machine (e.g.
  `D:\Documents\Projet Meir\project-meir`, `~/Documents/personal/project-meir`): find it, read the key there, never
  print it or copy it into this repo. Ask one question per session, in general terms, naming no person or project.
  - Its answers often cite no source: treat them as a lead, not a record. Tests in `packages/rules` still cite Konami
    sources; when YGOProJudge and a Konami page disagree, Konami wins. Where only YGOProJudge backs a choice, say so in
    the code comment or README.
