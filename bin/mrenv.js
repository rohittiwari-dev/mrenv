// This file is the CLI entry point for the mrenv package
const { executeCommand } = require("../dist/cli");

executeCommand(process.argv.slice(2));
