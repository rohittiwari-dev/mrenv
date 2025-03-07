import { executeGenerateCommand } from "./commands/generate";

/**
 * Parse CLI arguments
 */
export function parseArgs(args: string[]): {
	command: string;
	options: Record<string, any>;
} {
	const command = args[0] || "help";
	const options: Record<string, any> = {};

	for (let i = 1; i < args.length; i++) {
		const arg = args[i];

		if (arg.startsWith("--")) {
			const option = arg.substring(2);

			if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
				options[option] = args[i + 1];
				i++;
			} else {
				options[option] = true;
			}
		}
	}

	return { command, options };
}

/**
 * Display help information
 */
function showHelp(): void {
	console.log(`
mrenv CLI

Commands:
  generate    Generate type definitions and env file
    Options:
      --output-path    Output directory for generated files
      --schema-path    Path to schema file
      --types-only     Generate only type definitions

  help        Show this help message
  `);
}

/**
 * Execute CLI command
 */
export function executeCommand(args: string[]): void {
	const { command, options } = parseArgs(args);

	switch (command) {
		case "generate":
			executeGenerateCommand({
				outputPath: options["output-path"],
				schemaPath: options["schema-path"],
				typesOnly: options["types-only"],
			});
			break;
		case "help":
		default:
			showHelp();
			break;
	}
}

// Direct execution
if (require.main === module) {
	executeCommand(process.argv.slice(2));
}
