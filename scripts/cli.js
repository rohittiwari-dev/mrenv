#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, "..", "dist", "cli.cjs");

try {
	// Pass all arguments to the CLI
	const args = process.argv.slice(2).join(" ");

	// Use --require to force CommonJS mode
	execSync(`node --require=source-map-support/register ${cliPath} ${args}`, {
		stdio: "inherit",
		env: { ...process.env, NODE_OPTIONS: "--no-warnings" },
	});
} catch (error) {
	// Exit with the same code as the CLI
	process.exit(error.status || 1);
}
