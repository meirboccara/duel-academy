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
  ruling), ask the owner's rules site YGOProJudge through its partner **chat** API
  (`https://ygoprojudge.com/api/partner/v1`, made for general rules questions with no duel behind them): open a chat
  with `POST /chat-sessions` (optional `conversationId`), ask with `POST /chat-sessions/{id}/messages` (`text`: the
  question in English; optional `cards`: the card names, comma-separated), then `POST /chat-sessions/{id}/close`.
  Send `Authorization: Bearer <key>` and `X-Agent-Id: rules-core/1`. The answer is in the message response
  (`agent.text`, Markdown; `agent.answer.sources`); it can take minutes, so use a timeout of at least 5 minutes. The
  API's own code is the `judge-ygo` project (`lib/partner/api-reference.ts`). Use the chat-enabled partner key the owner
  gives (a key enabled for judge calls only answers 403 `api_not_enabled` here); if none is at hand, ask the owner.
  Never print the key or copy it into this repo. Ask one question per chat, in general terms, naming no person or project.
  - Its answers often cite no source: treat them as a lead, not a record. Tests in `packages/rules` still cite Konami
    sources; when YGOProJudge and a Konami page disagree, Konami wins. Where only YGOProJudge backs a choice, say so in
    the code comment or README.
