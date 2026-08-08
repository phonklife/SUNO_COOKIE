import { loadConfig } from "./config.js";
import { redactSecret } from "./redact.js";

function main(): void {
  try {
    const config = loadConfig();
    console.log("SUNO_COOKIE configuration: OK");
    console.log(`Value: ${redactSecret(config.cookie)}`);
    console.log("Secret remains local and is never printed in full.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Configuration error: ${message}`);
    process.exitCode = 1;
  }
}

main();
