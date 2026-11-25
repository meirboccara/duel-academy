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
    several minutes, so ALWAYS run it with a 600000 ms timeout or in the background;
  - `scripts/ygoprojudge-chat.sh answer <sessionId>` prints the chat's latest answer and sends nothing;
  - `scripts/ygoprojudge-chat.sh close <sessionId>` ends the chat.
  Every message costs money: never send the same question twice. If an `ask` call was cut off or its result is unclear,
  read the answer with `answer`, never `ask` again (`ask` also refuses a question the chat already holds). A follow-up
  is only for a new clarification or a contest, never a repeat.
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
  - **Grade the answer** once a Konami page settles the question, after `close`: one final verdict per chat, sent once.
    `scripts/ygoprojudge-chat.sh verdict <sessionId> okay` when it matches Konami;
    `scripts/ygoprojudge-chat.sh verdict <sessionId> issue <reason> <comment-file>` to report a wrong ruling, with
    `reason` one of `wrong_ruling`, `unclear`, `missed_question`, `should_not_answer`, `other`, and a comment (1-1000
    characters) that says what is wrong and quotes the Konami source (URL or Q&A id). It grades the chat's latest answer
    and opens a report the site's admins review. `HTTP 201` or `200`: recorded; `409 verdict_conflict`: a verdict
    already stands, leave it; `409 session_not_closed`: close first. With no Konami page, send no verdict: the answer
    stays a lead.
