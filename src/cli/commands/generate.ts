import * as fs from "fs";
import * as path from "path";
import fileGenerator from "../utils/fileGenerator";

interface GenerateOptions {
	outputPath?: string;
	schemaPath?: string;
	typesOnly?: boolean;
}

/**
 * Generate command to create type definitions and env file
 */
export function executeGenerateCommand(options: GenerateOptions = {}): void {
	console.log("🔍 Scanning environment files...");

	// Load schema if provided
	let schema;
	if (options.schemaPath) {
		try {
			const schemaPath = path.resolve(process.cwd(), options.schemaPath);
			if (fs.existsSync(schemaPath)) {
				const schemaModule = require(schemaPath);
				schema = schemaModule.default || schemaModule;
				console.log("📄 Using schema from:", options.schemaPath);
			} else {
				console.warn(
					`⚠️ Schema file not found at ${options.schemaPath}, will infer types`,
				);
			}
		} catch (error) {
			console.error("❌ Error loading schema:", error);
			process.exit(1);
		}
	}

	// Determine output path
	const outputPath = options.outputPath || "./";

	// Generate the files
	fileGenerator.generateTypeDefinitions(outputPath, schema);

	if (!options.typesOnly) {
		fileGenerator.generateEnvFile(outputPath, schema);
	}

	console.log("✨ Environment files generated successfully!");
}
