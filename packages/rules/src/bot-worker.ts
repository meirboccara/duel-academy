/**
 * Step 9: the bot's Web Worker entry (docs/rules-core/step9/design.md, "Worker protocol"). Start it with
 * `new Worker(new URL("./bot-worker.ts", import.meta.url), { type: "module" })` and post `BotRequest`s; each gets a `BotAnswer`.
 * It plays the cards of the rules core (`CARD_DEFS`); an app with more cards makes its own entry with `serveBot(self, itsDefs)`.
 * Not exported from src/index.ts: importing it outside a worker would take over `self.onmessage`.
 */
import { CARD_DEFS } from "./cards";
import { serveBot, type WorkerScope } from "./bot/protocol";

declare const self: WorkerScope;

serveBot(self, CARD_DEFS);
