import { configure } from "@testing-library/dom";
/* Every test plays with the Duel Academy cards: importing the package gives them to the engine. */
import "@duel-academy/cards";

/*
 * A page waited for (findBy…, waitFor) may take more than the default second while the whole suite runs at once:
 * five seconds, so a slow machine does not fail a test that is right.
 */
configure({ asyncUtilTimeout: 5000 });
