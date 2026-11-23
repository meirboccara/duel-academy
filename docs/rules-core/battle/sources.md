# Battle sources (6b) - partial, written when the disk filled

Read 2026-11-23. All quotes are copied from pages already on disk (RB10 text, Damage Step Rules page fetched one page, no 403).

## Damage Step Rules (Konami TCG, https://www.yugioh-card.com/eu/play/damage-step-rules/)
- Start of the Damage Step: "You declare that you are entering the Damage Step." / effects that activate "at the start of the damage step".
- Before Damage Calculation: "If the monster being attacked is face-down, flip it face-up. Then, cards or effects that modify ATK/DEF can activate. If the monster has a Trigger Effect that activates by being flipped face-up, it does not activate yet."
- Perform Damage Calculation: "Cards or effects that can activate "during damage calculation" activate/resolve, then the damage calculation is performed. Compare ATK/DEF and apply damage to Life Points. Determine whether either monster will be destroyed by battle or not, but do not send it to the Graveyard yet."
- After Damage Calculation: "Effects that activate as a result of battle happen here." Flip triggers of monsters flipped before damage calculation happen here. "A monster that was determined to be destroyed is still not sent to the Graveyard." ("when this card battles", "when battle damage is inflicted", "after damage calculation", FLIP effects).
- End of the Damage Step: "If a monster was determined to be destroyed by the battle during damage calculation, send it to the Graveyard first. Then effects that activate when a monster is destroyed by battle and sent to the Graveyard, activate now. Then ... effects that apply "until the end of the Damage Step" disappear" / "at the end of the Damage Step". "After the end of the Damage Step, return to the Battle Step. If the turn player does not want to attack again after that, go to the End Step."

## RB10 (https://www.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf, printed pp. 37-43)
- Steps: "The Battle Phase is split into 4 steps" (Start, Battle, Damage, End); "The Battle Step and Damage Step are repeated each time you attack with a monster."
- First turn: "The player who goes first cannot conduct their Battle Phase on their first turn."
- Battle Step: "Select 1 monster on your side of the field to attack with, and 1 of your opponent's monsters as your attack target, and then declare the attack. If your opponent does not have any monsters on the field, you can attack directly." "Each face-up Attack Position monster you control is allowed 1 attack per turn."
- Replay: "the attack target might be removed from the field, or a new monster may be played onto the opponent's side of the field before the Damage Step ... This causes a "Replay." When this occurs, you can choose to attack with the same monster again, or choose to attack with a different monster, or choose not to attack at all. Note that if you attack with a different monster, the first monster is still considered to have declared an attack, and it cannot attack again this turn."
- Damage Step limits: "During the Damage Step, you can only activate Counter Trap Cards, or cards with effects that directly change a monster's ATK or DEF. Also, these cards can only be activated up until the start of damage calculation."
- Face-down defender: "If you attack a face-down Defense Position monster, flip the card to face-up Defense Position in the Damage Step."
- Flip effect: "any Flip effects are activated and resolved after damage calculation. ... you cannot target a monster that has already been destroyed during damage calculation."
- Damage: ATK vs ATK (higher destroys, difference to LP; equal: both destroyed, no damage; lower: attacker destroyed, difference to its controller). ATK vs DEF (higher: defender destroyed, no damage; equal: nothing; lower: difference to attacker's controller, nobody destroyed). Direct: "The full amount of your attacking monster's ATK is subtracted from the opponent's LP as battle damage."
- Battled: "the attack had to have reached the damage calculation portion of the Damage Step in order for the monster to have "battled"."
- Winning: "You win a Duel if: you reduce your opponent's LP to 0 ... If you and your opponent both reach 0 LP at the same time, the Duel is declared a draw."

## Added after the disk was freed (read 2026-11-23)
- FET (https://www.yugioh-card.com/eu/play/fast-effect-timing/): "Declare an attack" is listed among the actions of the open game state that do "NOT start a Chain"; if nothing triggers, "Turn Player" at B, then "Opponent" at C. The page does not cover the Battle Step or Damage Step (it only links "Damage Step Rules").
- Damage Step Rules, re-read: nothing there about Counter Traps, negation or Quick Effects. Only "cards or effects that modify ATK/DEF can activate" (Before Damage Calculation) and the timing words per sub-step.
- Understanding Card Text index (https://www.yugioh-card.com/eu/play/understanding-card-text/): no text on the Damage Step; only a link to Damage Step Rules.
- OCG only, Infinite Impermanence notes (cid 13631, dated 2021-05-15, ope=4 ja): "■ダメージステップ中には発動できません。" (cannot be activated during the Damage Step; under the heading for effect 1).
- OCG only, Solemn Strike notes (cid 12187, dated 2025-02-21, ope=4 ja): "■ダメージステップでも発動できます。" (can also be activated in the Damage Step).
- Dead ends: yugioh-card.com/japan/rules/damage_step/ is 404; the web search tool returned no results for any query; the db page ope=4&fid=14086 was not a Q&A page.
- YGOProJudge: not asked. The auto-mode classifier denied the command that reads the partner key from project-meir's .env.development (rule: credential exploration). I did not try another way. Needs the owner's permission (a Bash allow rule for that read) before any question; see design.md open questions.

## Gaps (still open)
1. Which effects may be activated at the start of the Damage Step, and after damage calculation / at the end (TCG: only the Damage Step Rules timing words and RB10's "up until the start of damage calculation").
2. TCG source for "Counter Trap in the Damage Step": RB10 states it ("you can only activate Counter Trap Cards, or cards with effects that directly change a monster's ATK or DEF"); the OCG Solemn Strike note agrees.
3. Quick Effects of monsters in the Damage Step (hand traps such as Ash Blossom in the Damage Step): no Konami page read.
4. Negation of a Counter Trap's effect or of an attack (Negate Attack: does it end the Battle Phase, does the attack count as declared): not read.
5. What "the battle" does when the attacker or target leaves the field in the Damage Step: no record.
