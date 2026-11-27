import { expect, it } from "vitest";
import { canSpecialSummon, cites, destroyedByBattleNow, negateCardEffects, printedFacts, specialSummon } from "../../src";
import { toStep } from "../rules/battle-fixtures";
import { codes, offered, play } from "../rules/fixtures";
import { board, find, resolve } from "./sky-striker-fixtures";
const card="sky-striker-ace-hayate";
it(`${cites("sky-striker-ace-hayate","facts")} is a WIND Machine Link 1, 1500 ATK, bottom-left arrow, belonging to both archetypes`,()=>{
 const duel=board({extra:[card]});
 expect(printedFacts(duel,find(duel,card).id)).toEqual({name:"Sky Striker Ace - Hayate",attribute:"WIND",monsterType:"Machine",frame:"link",link:1,arrows:["bottom-left"],atk:1500,archetypes:["Sky Striker Ace","Sky Striker"],mentions:["Sky Striker Ace - Hayate"]});
});
it(`${cites("sky-striker-ace-hayate","procedure")} needs one non-WIND Ace`,()=>{
 expect(offered(board({monsters:["fixture-ace-fire"],extra:[card]}))).toContain(`special-summon ${card}`);
 expect(offered(board({monsters:["fixture-ace-wind"],extra:[card]}))).not.toContain(`special-summon ${card}`);
});
it(`${cites("sky-striker-ace-hayate","direct")} ${cites("sky-striker-ace-hayate","notes-continuous")} may attack directly while opposing monsters exist; negation removes that permission`,()=>{
 const start=board({extraZone:[card]},{monsters:["fixture-big"]},{},"you","battle");
 expect(offered(start)).toContain(`attack ${card} directly`);
 expect(offered(negateCardEffects(start,find(start,card).id,3))).not.toContain(`attack ${card} directly`);
});
it(`${cites("sky-striker-ace-hayate","send")} ${cites("sky-striker-ace-hayate","notes-trigger")} ${cites("sky-striker-ace-hayate","notes-direct-or-destroyed")} after damage calculation even a direct attack offers a non-targeting send of any Sky Striker card`,()=>{
 const start=board({extraZone:[card],deck:["fixture-ss-spell","fixture-ss-monster","fixture-other-spell"]},{},{},"you","battle");
 const after=toStep(play(start,`attack ${card} directly`),"after");
 const asked=resolve(play(after,`activate ${card}`));
 expect(offered(asked)).toEqual(["choose fixture-ss-monster","choose fixture-ss-spell"]);
 const done=play(asked,"choose fixture-ss-monster"); expect(codes(done,"you","graveyard")).toContain("fixture-ss-monster");
});
it(`${cites("sky-striker-ace-hayate","notes-direct-or-destroyed")} still sends after losing the battle, before it goes to the GY at the end of the Damage Step`,()=>{
 const start=board({extraZone:[card],deck:["fixture-ss-spell"]},{monsters:["fixture-big"]},{},"you","battle");
 const after=toStep(play(start,`attack ${card} > fixture-big`),"after");
 expect(find(after,card).zone).toBe("monster");
 const done=resolve(play(after,`activate ${card}`)); expect(codes(done,"you","graveyard")).toContain("fixture-ss-spell");
});
it(`${cites("sky-striker-ace-hayate","once")} ${cites("sky-striker-ace-hayate","notes-any-summon")} ${cites("sky-striker-ace-hayate","notes-not-effect")} only one Special Summon per name per turn, even when negated`,()=>{
 const start=board({extra:[card,card]});const [a,b]=start.piles.you.extra;
 const done=specialSummon(start,"you",a!,{slot:5}); expect(canSpecialSummon(negateCardEffects(done,a!,3),"you",b!)).toBe(false);
});
it(`${cites("sky-striker-ace-hayate","send")} ${cites("sky-striker-ace-hayate","notes-trigger")} also when it was attacked: it battled, and the effect is offered to its controller on the opponent's turn`,()=>{
 const start=board({extraZone:[card],deck:["fixture-ss-spell"]},{monsters:["fixture-filler"]},{},"rival","battle");
 const after=toStep(play(start,`attack fixture-filler > ${card}`),"after");
 expect(find(after,card).zone).toBe("monster");
 const mine=after.priority.holder==="you"?after:play(after,"pass");
 expect(offered(mine)).toContain(`activate ${card}`);
 const done=resolve(play(mine,`activate ${card}`)); expect(codes(done,"you","graveyard")).toContain("fixture-ss-spell");
});
it(`${cites("sky-striker-ace-hayate","notes-direct-or-destroyed")} the monster that lost the battle is still on the field while the effect is on the chain and an effect can destroy it then (Konami's Q&A fid 23937)`,()=>{
 const start=board({extraZone:[card],deck:["fixture-ss-spell"]},{monsters:["fixture-filler","fixture-smasher"]},{},"you","battle");
 const after=toStep(play(start,`attack ${card} > fixture-filler`),"after");
 const filler=find(after,"fixture-filler");
 const chained=play(after,`activate ${card}`);
 expect([filler.zone,destroyedByBattleNow(chained,filler.id)]).toEqual(["monster",true]);
 let answered=play(chained,"activate fixture-smasher");
 expect(answered.chain).toHaveLength(2);
 // Resolves the chain link by link, stopping before the end of the Damage Step (where the monster would be destroyed by the battle anyway).
 for(let guard=0;guard<8&&answered.chain.length>0&&!answered.asking;guard++) answered=play(answered,"pass");
 expect(answered.battle?.step).toBe("after");
 expect(find(answered,"fixture-filler").zone).toBe("graveyard");
 // The effect of Hayate still resolves.
 expect(codes(answered,"you","graveyard")).toContain("fixture-ss-spell");
});
