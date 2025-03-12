/**
 * Schema Utils Example for mrenv
 *
 * This example demonstrates how to use the schema utilities in mrenv
 * to generate schemas from .env files and create .env files from schemas.
 */

import { generateSchemaFromEnvFiles, createEnvFileFromSchema } from "mrenv";
import path from "path";

// Example 1: Generate a Zod schema from .env files
async function generateSchema() {
	console.log("Generating schema from .env files...");

	const { zodSchema, typeDefinitions } = generateSchemaFromEnvFiles({
		// Directory containing .env files
		directory: process.cwd(),

		// Environment to generate schema for
		environment: "development",

		// Output file path
		output: "./src/env-schema.ts",

		// Schema type (zod or typescript)
		type: "zod",

		// Include comments in the generated schema
		includeComments: true,

		// Additional options
		clientPrefix: "NEXT_PUBLIC_",
	});

	console.log("Schema generated successfully!");
	console.log("Zod Schema:", zodSchema);
	console.log("TypeScript Definition:", typeDefinitions);
}

// Example 2: Create a .env file from a schema
async function createEnvFile() {
	console.log("Creating .env file from schema...");

	await createEnvFileFromSchema({
		// Path to the schema file
		schemaPath: "./src/env-schema.ts",

		// Output file path
		outputPath: "./.env",
	});

	console.log(".env file created successfully!");
}

// Run the examples
async function runExamples() {
	try {
		await generateSchema();
		console.log("\n---\n");
		await createEnvFile();
	} catch (error) {
		console.error("Error:", error);
	}
}

// Only run if this file is executed directly
if (require.main === module) {
	runExamples();
}
