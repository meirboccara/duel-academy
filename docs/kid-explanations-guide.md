# Writing card explanations for children

The card search (`/card-search`) shows each card with an explanation for children aged 8 to 12, in the reader's
language only. Claude drafts them **offline, in the terminal**. Nothing is written while a page loads. Each one is saved
as a draft until a grown-up checks it. Decisions and sources: [research note §E](research/card-search-and-kid-explanations.md).

## Steps

```sh
cd apps/academy-ygo
pnpm explanations:todo --locale fr --limit 30        # cards with no French explanation yet -> explanations-todo-fr.json
# ask Claude: "Write the explanations for explanations-todo-fr.json following docs/kid-explanations-guide.md,
#              into explanations-fr.json"
pnpm explanations:save explanations-fr.json          # refuses the whole file if one text breaks a rule below
```

Output file shape:

```json
{ "model": "<model id>", "promptVersion": 2,
  "explanations": [{ "passcode": 5318639, "locale": "fr", "text": "Choisis … {answer} … {if-gone}" }] }
```

## Shared sentences

The same idea is said **the same way on every card**. Write the token, never your own version: the page turns it into
the sentence in the reader's language, and changing a sentence in `apps/academy-ygo/src/lib/card-search/phrases.ts`
changes it on every card at once (the text is stored with its tokens).

| Token | Use it when | English |
| --- | --- | --- |
| `{answer}` | the other player can answer before the card works (the "chain") | Your opponent can still answer with a card first, and the last card played happens first. |
| `{cost}` | right after the sentence saying what you must give up first (the "cost") | This happens even if your opponent stops the card afterwards. |
| `{if-gone}` | the card picked at the start may be gone when the card works | If the card you picked is gone by then, nothing happens to it. |
| `{set-trap}` | a Trap: set first, not usable the turn it is set, usable from the next turn on (either player's) | Place this Trap face-down first: you can use it from the next turn on, even your opponent's. |
| `{quick-play}` | a Quick-Play Spell: when it can be played | You can play it on your turn, or place it face-down and surprise your opponent on a later turn, even theirs. |

**How an effect works**

| Token | Use it when the card says | English |
| --- | --- | --- |
| `{mandatory}` | no "You can" ("Add…", "Destroy…") | This always happens, even if you don't want it to. |
| `{optional}` | "You can" | You choose if you want to use it. |
| `{when}` | **optional** "When … : You can" (it can miss its moment; a mandatory "When" never does) | It only works if that was the very last thing that happened. If something else happened just after, the moment is lost. |
| `{if}` | optional "If … : You can" | It still works even if other things happened just after. |
| `{once-per-turn}` | "Once per turn:" (this copy; resets if it leaves the field or is turned face-down) | You can use this once each turn. If this card leaves the field or is turned face-down and comes back, it is like a new card and can use it again this turn. |
| `{once-per-turn-name}` | "You can only use this effect of [name] once per turn" (all copies together) | You can use this only once each turn, even with several copies of this card, and even if it leaves the field and comes back. |
| `{quick-effect}` | "(Quick Effect)" | This monster can use its power even on your opponent's turn, even right after they play a card. |
| `{then}` | "…, then …" | First the first part happens, then the second. If the first part doesn't happen, the second doesn't either. |
| `{also}` | "…, also …" | Both parts happen at the same time, and each one happens even if the other can't. |
| `{if-you-do}` | "…, and if you do, …" | Both parts happen at the same time, but the second part only happens if the first one did. |

**What happens to a card** (add it after the card's own sentence that uses the word): `{destroy}`,
`{cannot-be-destroyed}`, `{send-to-gy}`, `{banish}`, `{discard}`, `{tribute}`, `{special-summon}`, `{return-to-hand}`,
`{negate}`, `{set}`, `{equip}`. Their exact words in each language are in `phrases.ts`.

Sources: then/also/and if you do from Konami's PSCT Part 7; Quick Effects from Konami's Fast Effect Timing page;
When/If and the two once-per-turn rules from YGOProJudge only (2026-11-23), since Konami's PSCT pages don't cover them.

`explanations:save` refuses an unknown token, and a shared idea written by hand when it has tell-tale wording (answer, cost, if-gone, set-trap, quick-play, mandatory, when, once per turn, quick effect; a card's own words may still say "destroyed", "banished" or "then") (for example "Ton adversaire peut
encore répondre avec une carte avant" instead of `{answer}`).

## Rules (prompt version 2)

1. **Start from the printed words** (`printed` in the todo file). Explain what the card really does; never guess. If
   the text is unclear, leave the card out and ask the owner (or YGOProJudge, per CLAUDE.md).
2. **Use the shared sentences** above for the ideas they cover.
3. **No game jargon.** Do not write "target", "chain", "cost", "activate", "resolve" (fr: cibler, chaîne, coût, activer,
   résoudre; he: מטרה, שרשרת, מחיר/עלות, הפעלה). Say what they mean: "pick one card" for target (choosing is **not**
   paying anything); "first you must give up …" then `{cost}`; `{answer}` for the chain; "then …" for resolving.
   `explanations:save` checks for these words, in the shared sentences too.
4. **Short:** besides the shared sentences, 1 to 3 sentences of the card's own, one idea each, present tense, "you"
   (fr: "tu"; he: plural imperative, as in the app). The other player is "your opponent", as on the cards
   (fr "ton adversaire", he "היריב"); `explanations:save` refuses "friend" in English. Card names, Monster, Spell and Trap stay as the child sees them.
5. **Written for the language**, not translated word for word. Hebrew has no official card text: keep card names in
   English.
6. Keep the timing exactly right (when the card can be played, what happens first, what happens if the picked card is
   gone).

Example, Mystical Space Typhoon (en): *"Pick one Spell or Trap card on the field, yours or your opponent's. {answer}
Then the card you picked is destroyed. {if-gone} {quick-play}"*
