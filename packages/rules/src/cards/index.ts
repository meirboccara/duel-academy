import type { CardDef } from "../effects";
import type { CardSources } from "../coverage";
import { ASH_BLOSSOM, ASH_BLOSSOM_SOURCES } from "./ash-blossom-joyous-spring";
import { CELTIC_GUARDIAN, CELTIC_GUARDIAN_DEF } from "./celtic-guardian";
import { DD_CROW, DD_CROW_SOURCES } from "./dd-crow";
import { DROLL_LOCK_BIRD, DROLL_LOCK_BIRD_SOURCES } from "./droll-lock-bird";
import { EFFECT_VEILER, EFFECT_VEILER_SOURCES } from "./effect-veiler";
import { GHOST_OGRE_SNOW_RABBIT, GHOST_OGRE_SNOW_RABBIT_SOURCES } from "./ghost-ogre-snow-rabbit";
import { INFINITE_IMPERMANENCE, INFINITE_IMPERMANENCE_SOURCES } from "./infinite-impermanence";
import { SHRINK, SHRINK_SOURCES } from "./shrink";
import { SKILL_DRAIN, SKILL_DRAIN_SOURCES } from "./skill-drain";
import { SOLEMN_JUDGMENT, SOLEMN_JUDGMENT_SOURCES } from "./solemn-judgment";
import { SOLEMN_STRIKE, SOLEMN_STRIKE_SOURCES } from "./solemn-strike";
import { LINK_SPIDER, LINK_SPIDER_SOURCES } from "./link-spider";
import { MUKA_MUKA, MUKA_MUKA_SOURCES } from "./muka-muka";
import { MYSTICAL_SPACE_TYPHOON, MYSTICAL_SPACE_TYPHOON_SOURCES } from "./mystical-space-typhoon";
import { POT_OF_GREED, POT_OF_GREED_SOURCES } from "./pot-of-greed";
import { TERRAFORMING, TERRAFORMING_SOURCES } from "./terraforming";

export { ASH_BLOSSOM_ANSWERS } from "./ash-blossom-joyous-spring";

/** Every card the rules core plays, with what it owes the definition of done. */
export const CARD_SOURCES: readonly CardSources[] = [CELTIC_GUARDIAN, ASH_BLOSSOM_SOURCES, TERRAFORMING_SOURCES, MYSTICAL_SPACE_TYPHOON_SOURCES, DD_CROW_SOURCES, POT_OF_GREED_SOURCES, LINK_SPIDER_SOURCES, INFINITE_IMPERMANENCE_SOURCES, SOLEMN_JUDGMENT_SOURCES, SOLEMN_STRIKE_SOURCES, SHRINK_SOURCES, MUKA_MUKA_SOURCES, SKILL_DRAIN_SOURCES, DROLL_LOCK_BIRD_SOURCES, GHOST_OGRE_SNOW_RABBIT_SOURCES, EFFECT_VEILER_SOURCES];

/**
 * The cards written as effect records, by code: pass them as `defs` to `createDuel`. Written from Konami's card text
 * (each card's file says what it leaves out). This is the check that today's data-written cards can be records, not the
 * port of Academy's cards (step 10).
 */
export const CARD_DEFS: Readonly<Record<string, CardDef>> = Object.fromEntries([CELTIC_GUARDIAN_DEF, ASH_BLOSSOM, TERRAFORMING, MYSTICAL_SPACE_TYPHOON, DD_CROW, POT_OF_GREED, LINK_SPIDER, INFINITE_IMPERMANENCE, SOLEMN_JUDGMENT, SOLEMN_STRIKE, SHRINK, MUKA_MUKA, SKILL_DRAIN, DROLL_LOCK_BIRD, GHOST_OGRE_SNOW_RABBIT, EFFECT_VEILER].map((def) => [def.code, def]));
