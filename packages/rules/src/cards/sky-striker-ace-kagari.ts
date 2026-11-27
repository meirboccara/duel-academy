import type { CardSources } from "../coverage";
import { moveCard } from "../duel";
import { type CardDef, cardTypeOf, targetsOf } from "../effects";
import { belongsTo } from "../identity";
import { konamiCardUrl } from "../sources";
import { factsOf } from "./helpers";
import { spellsInGraveyard } from "./sky-striker-helpers";

const NAME = "Sky Striker Ace - Kagari";
/**
 * FIRE Machine Link 1, top-left arrow. One non-FIRE Ace; every Ace is also Sky Striker (name membership).
 * The Special Summon limit is a card rule, not an effect, regardless of Summoning method (JP notes).
 * Optional Special Summon trigger, including the Damage Step; target a Sky Striker Spell in the controller's GY.
 * The ATK gain is continuous and recalculated from that controller's GY, not the owner's.
 */
export const SKY_STRIKER_ACE_KAGARI: CardDef = {
 code:"sky-striker-ace-kagari",kind:"monster",
 facts:{name:NAME,attribute:"FIRE",monsterType:"Machine",frame:"link",link:1,arrows:["top-left"],atk:1500,archetypes:["Sky Striker Ace","Sky Striker"],mentions:[NAME]},
 summon:{oncePerTurn:true},
 procedure:{kind:"link",materials:{min:1,max:1,filter:(duel,card)=>belongsTo(duel,card.id,"Sky Striker Ace")&&factsOf(duel,card.id)?.attribute!=="FIRE"}},
 effects:[
 {type:"trigger",timing:"if",categories:["add-to-hand"],event:(_duel,event,{card})=>event.type==="summoned"&&event.card.id===card.id&&event.how==="special",
 target:(duel,{player})=>duel.piles[player].graveyard.filter(id=>belongsTo(duel,id,"Sky Striker")&&cardTypeOf(duel,duel.cards[id]!)==="spell"),
 operation:(duel,link)=>{const target=targetsOf(duel,link)[0];return target&&target.zone==="graveyard"?moveCard(duel,target.id,{zone:"hand",effect:link}):duel;}},
 {type:"continuous",modifies:()=>[{kind:"add",stat:"atk",by:(duel,source)=>source===null?0:100*spellsInGraveyard(duel,source.controller)}]}
 ]
};
const EN=konamiCardUrl(13668,"en");
const NOTES="https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=13668&request_locale=ja";
export const SKY_STRIKER_ACE_KAGARI_SOURCES: CardSources={
 code:"sky-striker-ace-kagari",cid:13668,
 french:{text:"1 monstre \"Assaut de l'Air - As\" non-FEU\nSi cette carte est Invoquée Spécialement : vous pouvez cibler 1 Magie \"Assaut de l'Air\" dans votre Cimetière ; ajoutez-la à votre main. Gagne 100 ATK pour chaque Magie dans votre Cimetière. Vous ne pouvez Invoquer Spécialement un ou plusieurs \"Assaut de l'Air - As - Kagari\" qu'une fois par tour.",url:konamiCardUrl(13668,"fr"),read:"2026-11-26"},
 sources:[
 {id:"facts",kind:"card-text",cid:13668,url:EN,read:"2026-11-26",quote:"FIRE Link 1 ATK 1500 DEF - Machine ／ Link／Effect"},
 {id:"procedure",kind:"card-text",cid:13668,url:EN,read:"2026-11-26",quote:"1 non-FIRE \"Sky Striker Ace\" monster"},
 {id:"recover",kind:"card-text",cid:13668,url:EN,read:"2026-11-26",quote:"If this card is Special Summoned: You can target 1 \"Sky Striker\" Spell in your GY; add it to your hand."},
 {id:"atk",kind:"card-text",cid:13668,url:EN,read:"2026-11-26",quote:"Gains 100 ATK for each Spell in your GY."},
 {id:"once",kind:"card-text",cid:13668,url:EN,read:"2026-11-26",quote:"You can only Special Summon \"Sky Striker Ace - Kagari(s)\" once per turn."},
 // OCG notes. Q&A 8161 is the Raye trigger/controller interaction, for batch 7; 10427 and 21760 concern absent cards.
 {id:"notes-trigger",kind:"jp-notes",cid:13668,url:NOTES,read:"2026-11-26",quote:"■モンスターゾーンで発動できる誘発効果です。"},
 {id:"notes-damage-step",kind:"jp-notes",cid:13668,url:NOTES,read:"2026-11-26",quote:"■ダメージステップでも発動できます。"},
 {id:"notes-continuous",kind:"jp-notes",cid:13668,url:NOTES,read:"2026-11-26",quote:"■モンスターゾーンで適用する永続効果です。"},
 {id:"notes-not-effect",kind:"jp-notes",cid:13668,url:NOTES,read:"2026-11-26",quote:"■効果として扱いません。"},
 {id:"notes-any-summon",kind:"jp-notes",cid:13668,url:NOTES,read:"2026-11-26",quote:"■リンク召喚による特殊召喚かどうかにかかわらず、１ターンに１度しか特殊召喚できません。"}
 ],effects:["facts","procedure","recover","atk","once"],rulings:[{source:"notes-trigger"},{source:"notes-damage-step"},{source:"notes-continuous"},{source:"notes-not-effect"},{source:"notes-any-summon"}]
};
