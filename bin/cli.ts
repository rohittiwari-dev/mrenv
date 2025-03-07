#!/usr/bin/env node

import { Command } from "commander";
import { generateTypes } from "../src/cli/generator";
import { findProjectRoot } from "../src/cli/utils";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

program
	.name("mrenv")
	.description("Type-safe environment variable management")
	.version("0.1.0");

program
	.command("generate")
	.description("Generate type definitions and env file")
	.option("-p, --path <path>", "Path to save env.ts")
	.option("-d, --declaration <path>", "Path to save env.d.ts")
	.option("-z, --zod", "Generate Zod schema instead of custom schema")
	.action(async (options) => {
		try {
			const projectRoot = findProjectRoot();
			console.log("📂 Project root:", projectRoot);

			// Check if tsconfig.json exists to determine if it's a TypeScript project
			const isTsProject = fs.existsSync(
				path.join(projectRoot, "tsconfig.json"),
			);

			const result = await generateTypes({
				projectRoot,
				outputPath: options.path,
				declarationPath: options.declaration,
				useZod: options.zod,
			});

			console.log("✅ Generated files:");
			console.log(`   - ${result.envPath}`);
			console.log(`   - ${result.declarationPath}`);

			if (options.zod) {
				console.log("\n🔍 Using Zod for schema validation");
				console.log(
					"   Don't forget to install Zod if not already installed:",
				);
				console.log("   npm install zod");
			}

			// Show usage examples based on whether it's TypeScript or JavaScript
			console.log("\n📝 Usage example:");
			if (isTsProject) {
				console.log(`
import { env } from "${path
					.relative(process.cwd(), result.envPath)
					.replace(/\\/g, "/")}";

// Environment variables are type-safe!
console.log(env.DB_HOST); // TypeScript knows the type
console.log(env.DB_PORT); // TypeScript knows this is a number
				`);
			} else {
				console.log(`
const { env } = require("${path
					.relative(process.cwd(), result.envPath)
					.replace(/\\/g, "/")}");

// Environment variables are validated!
console.log(env.DB_HOST);
console.log(env.DB_PORT);
				`);
			}

			console.log(
				`\n🔐 Security tip: To protect sensitive variables, use the 'protectedEnv' option.`,
			);
			console.log(
				`   Edit the generated ${path.basename(
					result.envPath,
				)} file to configure options.`,
			);
		} catch (error: any) {
			console.error("❌ Error:", error.message);
			process.exit(1);
		}
	});

program.parse();
