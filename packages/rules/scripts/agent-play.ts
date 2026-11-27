import { CARD_DEFS } from "../src";
import { runCli } from "../src/agent-play";

/** Local, no-network referee driver. FILE is the private MatchRecord; only seat boards are printed. See src/agent-play.ts. */
try {
	console.log(runCli(process.argv.slice(2), CARD_DEFS));
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
