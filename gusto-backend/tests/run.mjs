// Run the scenario tests: node tests/run.mjs [scenarioName ...]
// Uses its own database (gusto_test) and server (port 3999); gusto_db is never touched.
import { resetDb, startServer, stopServer, failed, check } from "./harness.mjs";
import { scenarios as finance } from "./finance.test.mjs";
import { scenarios as operations } from "./operations.test.mjs";

const all = { ...finance, ...operations };
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(all);

await resetDb();
await startServer();
try {
  for (const name of wanted) {
    if (!all[name]) { console.log("unknown scenario:", name); continue; }
    await resetDb();
    try {
      await all[name]();
    } catch (e) {
      check(`${name} crashed`, false, e.message);
    }
  }
} finally {
  await stopServer();
}
console.log(failed() ? `\n${failed()} check(s) failed` : "\nall checks passed");
process.exit(failed() ? 1 : 0);
