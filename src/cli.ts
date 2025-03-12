/**
 * mrenv CLI
 *
 * Command-line interface for environment variable management.
 */

import fs from "fs";
import path from "path";
import { Command } from "commander";
import chalk from "chalk";
import {
	generateSchemaFromEnvFiles,
	createEnvFileFromSchema,
} from "./schema-utils";
import { parse, stringify } from "./parser";
import { z } from "zod";

// Initialize CLI
const program = new Command();

// Get package version from package.json
const packageVersion = "1.0.0"; // This will be replaced with the actual version during build

// Set up the command
program
	.name("mrenv")
	.description("Enhanced type-safe environment variable management system")
	.version(packageVersion);

// Basic commands
program
	.command("generate-schema")
	.description("Generate Zod schema from .env files")
	.option(
		"-d, --directory <path>",
		"Directory containing .env files",
		process.cwd(),
	)
	.option(
		"-e, --env <environment>",
		"Environment to generate schema for",
		process.env.NODE_ENV || "development",
	)
	.option("-o, --output <file>", "Output file path", "./src/env-schema.ts")
	.action((options) => {
		try {
			console.log(chalk.blue("Generating schema from .env files..."));
			const { zodSchema } = generateSchemaFromEnvFiles({
				directory: options.directory,
				environment: options.env,
				output: options.output,
				type: "zod",
				includeComments: true,
			});

			console.log(
				chalk.green(
					`✓ Schema successfully generated to ${options.output}`,
				),
			);
		} catch (error) {
			console.error(chalk.red("Error generating schema:"), error);
			process.exit(1);
		}
	});

program
	.command("create-env")
	.description("Create .env file from schema")
	.option("-s, --schema <file>", "Schema file path", "./src/env-schema.ts")
	.option("-o, --output <file>", "Output file path", "./.env")
	.action((options) => {
		try {
			console.log(chalk.blue("Creating .env file from schema..."));
			createEnvFileFromSchema({
				schemaPath: options.schema,
				outputPath: options.output,
			});
			console.log(
				chalk.green(
					`✓ .env file successfully created at ${options.output}`,
				),
			);
		} catch (error) {
			console.error(chalk.red("Error creating .env file:"), error);
			process.exit(1);
		}
	});

program
	.command("validate")
	.description("Validate environment variables against schema")
	.option("-s, --schema <file>", "Schema file path", "./src/env-schema.ts")
	.option("-e, --env <file>", "Environment file to validate", "./.env")
	.action(async (options) => {
		try {
			console.log(chalk.blue("Validating environment variables..."));

			// Load the environment file
			if (!fs.existsSync(options.env)) {
				throw new Error(`Environment file not found: ${options.env}`);
			}

			const envContent = fs.readFileSync(options.env, "utf-8");
			const parsedEnv = parse(envContent);

			// Dynamically import the schema file
			// This is using dynamic import which works in ESM
			const schemaPath = path.resolve(process.cwd(), options.schema);

			try {
				// Try to import the schema directly
				const schemaModule = await import(schemaPath);
				const schema =
					schemaModule.schema ||
					schemaModule.envSchema ||
					schemaModule.default;

				if (!schema || typeof schema.parse !== "function") {
					throw new Error(
						`Invalid schema: No valid Zod schema found in ${options.schema}`,
					);
				}

				// Validate the environment variables
				schema.parse(parsedEnv);
				console.log(chalk.green("✓ Environment variables are valid!"));
			} catch (importError: unknown) {
				console.error(
					chalk.yellow(
						`Could not import schema directly. Trying to evaluate file content...`,
					),
				);

				// Fallback: read the file and try to find the schema
				if (!fs.existsSync(schemaPath)) {
					throw new Error(`Schema file not found: ${options.schema}`);
				}

				const fileContent = fs.readFileSync(schemaPath, "utf-8");
				console.error(
					chalk.yellow(
						`Schema file found but could not be imported. Please check your schema file.`,
					),
				);
				console.error(
					chalk.yellow(
						`Hint: Make sure your schema is exported correctly and is a valid Zod schema.`,
					),
				);
				throw new Error(
					`Failed to validate: ${
						importError instanceof Error
							? importError.message
							: String(importError)
					}`,
				);
			}
		} catch (error) {
			console.error(chalk.red("Validation error:"), error);
			process.exit(1);
		}
	});

program
	.command("help")
	.description("Display help information")
	.action(() => {
		program.outputHelp();
	});

// Add interactive command
program
	.command("interactive")
	.description("Interactive mode for environment setup")
	.action(async () => {
		try {
			console.log(chalk.blue("Starting interactive setup..."));

			// We'll need to dynamically import inquirer to maintain ESM compatibility
			let inquirer;
			try {
				// Try to import inquirer
				const inquirerModule = await import("inquirer");
				inquirer = inquirerModule.default;
			} catch (error) {
				console.error(
					chalk.red("Error loading interactive dependencies:"),
					error,
				);
				console.log(
					chalk.yellow(
						"Please install inquirer: npm install inquirer",
					),
				);
				process.exit(1);
			}

			// Main menu
			const { action } = await inquirer.prompt([
				{
					type: "list",
					name: "action",
					message: "What would you like to do?",
					choices: [
						{
							name: "Generate schema from .env files",
							value: "generate-schema",
						},
						{
							name: "Create .env file from schema",
							value: "create-env",
						},
						{
							name: "Validate environment variables",
							value: "validate",
						},
						{ name: "Exit", value: "exit" },
					],
				},
			]);

			if (action === "exit") {
				console.log(chalk.blue("Exiting interactive mode. Goodbye!"));
				return;
			}

			// Handle each action
			switch (action) {
				case "generate-schema": {
					const answers = await inquirer.prompt([
						{
							type: "input",
							name: "directory",
							message: "Directory containing .env files:",
							default: process.cwd(),
						},
						{
							type: "input",
							name: "environment",
							message: "Environment to generate schema for:",
							default: process.env.NODE_ENV || "development",
						},
						{
							type: "input",
							name: "output",
							message: "Output file path:",
							default: "./src/env-schema.ts",
						},
					]);

					console.log(
						chalk.blue("Generating schema from .env files..."),
					);
					const { zodSchema } = generateSchemaFromEnvFiles({
						directory: answers.directory,
						environment: answers.environment,
						output: answers.output,
						type: "zod",
						includeComments: true,
					});

					console.log(
						chalk.green(
							`✓ Schema successfully generated to ${answers.output}`,
						),
					);
					break;
				}
				case "create-env": {
					const answers = await inquirer.prompt([
						{
							type: "input",
							name: "schema",
							message: "Schema file path:",
							default: "./src/env-schema.ts",
						},
						{
							type: "input",
							name: "output",
							message: "Output .env file path:",
							default: "./.env",
						},
					]);

					console.log(
						chalk.blue("Creating .env file from schema..."),
					);
					createEnvFileFromSchema({
						schemaPath: answers.schema,
						outputPath: answers.output,
					});
					console.log(
						chalk.green(
							`✓ .env file successfully created at ${answers.output}`,
						),
					);
					break;
				}
				case "validate": {
					const answers = await inquirer.prompt([
						{
							type: "input",
							name: "schema",
							message: "Schema file path:",
							default: "./src/env-schema.ts",
						},
						{
							type: "input",
							name: "env",
							message: "Environment file to validate:",
							default: "./.env",
						},
					]);

					console.log(
						chalk.blue("Validating environment variables..."),
					);
					// Load the environment file
					if (!fs.existsSync(answers.env)) {
						throw new Error(
							`Environment file not found: ${answers.env}`,
						);
					}

					const envContent = fs.readFileSync(answers.env, "utf-8");
					const parsedEnv = parse(envContent);

					// Dynamically import the schema file
					const schemaPath = path.resolve(
						process.cwd(),
						answers.schema,
					);
					try {
						const schemaModule = await import(schemaPath);
						const schema =
							schemaModule.schema ||
							schemaModule.envSchema ||
							schemaModule.default;

						if (!schema || typeof schema.parse !== "function") {
							throw new Error(
								`Invalid schema: No valid Zod schema found in ${answers.schema}`,
							);
						}

						// Validate the environment variables
						schema.parse(parsedEnv);
						console.log(
							chalk.green("✓ Environment variables are valid!"),
						);
					} catch (importError: unknown) {
						console.error(
							chalk.yellow(`Could not import schema directly.`),
						);
						if (!fs.existsSync(schemaPath)) {
							throw new Error(
								`Schema file not found: ${answers.schema}`,
							);
						}

						console.error(
							chalk.yellow(
								`Schema file found but could not be imported. Please check your schema file.`,
							),
						);
						console.error(
							chalk.yellow(
								`Hint: Make sure your schema is exported correctly and is a valid Zod schema.`,
							),
						);
						throw new Error(
							`Failed to validate: ${
								importError instanceof Error
									? importError.message
									: String(importError)
							}`,
						);
					}
					break;
				}
			}
		} catch (error) {
			console.error(chalk.red("Error in interactive mode:"), error);
			process.exit(1);
		}
	});

// Parse command line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
	program.outputHelp();
}
