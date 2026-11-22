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
