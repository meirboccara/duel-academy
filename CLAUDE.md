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
  ruling), ask the owner's rules site YGOProJudge through its partner **chat** API, with the reviewed helper
  `scripts/ygoprojudge-chat.sh` (use it as is, no need to read it first):
  - `scripts/ygoprojudge-chat.sh open <conversationId>` prints the chat's sessionId;
  - `scripts/ygoprojudge-chat.sh ask <sessionId> <question-file> [cards]` sends the question (English, in a file) with
    the card names comma-separated, and prints the answer (`KIND:`, the Markdown text, `SOURCE:` lines); it can take
    minutes, so run it in the background or with a 10-minute timeout;
  - `scripts/ygoprojudge-chat.sh close <sessionId>` ends the chat.
  The key is read from `YGOJ_PARTNER_KEY` or from `~/.config/ygoprojudge/key` (outside the repo, readable by the owner
  only); if neither exists, ask the owner. Never print the key or copy it into this repo. The API itself
  (`https://ygoprojudge.com/api/partner/v1`, `/chat-sessions`) is the `judge-ygo` project (`lib/partner/api-reference.ts`);
  a key enabled for judge calls only answers 403 `api_not_enabled`. One topic per chat, in general terms, naming no
  person or project.
  - Treat the chat as a discussion, not a single shot: if an answer cites no source, contradicts a Konami page or the
    core, misreads the situation, or asks for clarification, reply in the same chat (clarify, or contest with the
    counter-evidence: a rulebook quote, a Konami Q&A, and ask it to re-check or cite a source). At most 2-3 follow-ups
    per chat, then close it; do not loop. Record the final answer and whether it changed after a contest.
  - Its answers often cite no source: treat them as a lead, not a record. Tests in `packages/rules` still cite Konami
    sources; when YGOProJudge and a Konami page disagree, Konami wins. Where only YGOProJudge backs a choice, say so in
    the code comment or README.
