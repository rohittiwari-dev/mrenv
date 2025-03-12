/**
 * Schema Utilities
 *
 * Utilities for generating and manipulating Zod schemas for environment variables.
 */

import fs from "fs";
import path from "path";
import { z, ZodType } from "zod";
import { EnvSafeError } from "./errors";

/**
 * Options for schema generation
 */
export interface SchemaGenerationOptions {
	/**
	 * Directory containing .env files
	 */
	directory?: string;

	/**
	 * Environment to generate schema for
	 */
	environment?: string;

	/**
	 * Schema type to generate ('zod' or 'typescript')
	 */
	type?: "zod" | "typescript" | "both";

	/**
	 * Whether to include comments from .env files
	 */
	includeComments?: boolean;

	/**
	 * Output file path for generated schema
	 */
	output?: string;

	/**
	 * Prefix for client-side variables
	 */
	clientPrefix?: string;

	/**
	 * Whether to make all variables required
	 */
	required?: boolean;
}

/**
 * Generate a schema from environment files
 */
export function generateSchemaFromEnvFiles(
	options: SchemaGenerationOptions = {},
): {
	zodSchema: string;
	typeDefinitions: string;
} {
	const {
		directory = process.cwd(),
		environment = process.env.NODE_ENV || "development",
		type = "both",
		includeComments = true,
		clientPrefix = "NEXT_PUBLIC_",
		required = true,
	} = options;

	// Collect environment files
	const envFiles = [
		".env",
		".env.local",
		`.env.${environment}`,
		`.env.${environment}.local`,
	]
		.map((file) => path.resolve(directory, file))
		.filter((file) => fs.existsSync(file));

	if (envFiles.length === 0) {
		throw new EnvSafeError(`No .env files found in ${directory}`);
	}

	// Parse all environment files
	const variables: Record<string, { value: string; comments: string[] }> = {};
	const comments: Record<string, string[]> = {};

	for (const file of envFiles) {
		const content = fs.readFileSync(file, "utf8");
		const lines = content.split(/\r?\n/);

		let currentComments: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Collect comments
			if (line.trim().startsWith("#")) {
				currentComments.push(line.trim().substring(1).trim());
				continue;
			}

			// Match variable definitions
			const match = line.match(
				/^\s*([\w.-]+)\s*=\s*("[^"]*"|'[^']*'|[^#]*)?(\s*#.*)?$/,
			);

			if (match) {
				const key = match[1];
				let value = (match[2] || "").trim();

				// Remove surrounding quotes
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.substring(1, value.length - 1);
				}

				// Store inline comment if any
				if (match[3]) {
					const inlineComment = match[3].trim().substring(1).trim();
					currentComments.push(inlineComment);
				}

				variables[key] = {
					value,
					comments: currentComments,
				};
				comments[key] = currentComments;
				currentComments = [];
			}
		}
	}

	// Generate Zod schema
	let zodSchema =
		"/**\n * Generated Zod schema for environment variables\n */\n\n";
	zodSchema += 'import { z } from "zod";\n\n';
	zodSchema += "export const envSchema = {\n";

	// Separate server and client variables
	const serverVars: string[] = [];
	const clientVars: string[] = [];

	// First pass: categorize variables
	Object.keys(variables).forEach((key) => {
		if (key.startsWith(clientPrefix)) {
			clientVars.push(key);
		} else {
			serverVars.push(key);
		}
	});

	// Generate server schema section
	zodSchema += "  server: {\n";

	serverVars.forEach((key) => {
		const variable = variables[key];

		// Add comments if available
		if (includeComments && variable.comments.length > 0) {
			zodSchema += `    /**\n`;
			variable.comments.forEach((comment) => {
				zodSchema += `     * ${comment}\n`;
			});
			zodSchema += `     */\n`;
		}

		// Infer schema type based on value
		const schemaType = inferSchemaType(variable.value);
		zodSchema += `    ${key}: z.${schemaType}${
			required ? "" : ".optional()"
		},\n`;
	});

	zodSchema += "  },\n\n";

	// Generate client schema section
	zodSchema += "  client: {\n";

	clientVars.forEach((key) => {
		const variable = variables[key];

		// Add comments if available
		if (includeComments && variable.comments.length > 0) {
			zodSchema += `    /**\n`;
			variable.comments.forEach((comment) => {
				zodSchema += `     * ${comment}\n`;
			});
			zodSchema += `     */\n`;
		}

		// Infer schema type based on value
		const schemaType = inferSchemaType(variable.value);
		zodSchema += `    ${key}: z.${schemaType}${
			required ? "" : ".optional()"
		},\n`;
	});

	zodSchema += "  },\n\n";

	// Generate shared variables section (empty by default)
	zodSchema += "  shared: {\n";
	zodSchema += "    // Add shared variables here\n";
	zodSchema += "  }\n";
	zodSchema += "};\n";

	// Generate TypeScript definitions
	let typeDefinitions =
		"/**\n * Generated TypeScript definitions for environment variables\n */\n\n";

	typeDefinitions += "export interface ServerEnv {\n";
	serverVars.forEach((key) => {
		const variable = variables[key];

		// Add comments if available
		if (includeComments && variable.comments.length > 0) {
			typeDefinitions += `  /**\n`;
			variable.comments.forEach((comment) => {
				typeDefinitions += `   * ${comment}\n`;
			});
			typeDefinitions += `   */\n`;
		}

		// Infer TypeScript type based on value
		const tsType = inferTypeScriptType(variable.value);
		typeDefinitions += `  ${key}${required ? "" : "?"}: ${tsType};\n`;
	});
	typeDefinitions += "}\n\n";

	typeDefinitions += "export interface ClientEnv {\n";
	clientVars.forEach((key) => {
		const variable = variables[key];

		// Add comments if available
		if (includeComments && variable.comments.length > 0) {
			typeDefinitions += `  /**\n`;
			variable.comments.forEach((comment) => {
				typeDefinitions += `   * ${comment}\n`;
			});
			typeDefinitions += `   */\n`;
		}

		// Infer TypeScript type based on value
		const tsType = inferTypeScriptType(variable.value);
		typeDefinitions += `  ${key}${required ? "" : "?"}: ${tsType};\n`;
	});
	typeDefinitions += "}\n\n";

	typeDefinitions += "export interface SharedEnv {\n";
	typeDefinitions += "  // Add shared variables here\n";
	typeDefinitions += "}\n\n";

	typeDefinitions +=
		"export interface Env extends ServerEnv, ClientEnv, SharedEnv {}\n";

	// Write to output file if specified
	if (options.output) {
		const outputPath = path.resolve(options.output);

		if (type === "zod" || type === "both") {
			fs.writeFileSync(
				type === "both"
					? outputPath.replace(/\.\w+$/, ".schema.ts")
					: outputPath,
				zodSchema,
				"utf8",
			);
		}

		if (type === "typescript" || type === "both") {
			fs.writeFileSync(
				type === "both"
					? outputPath.replace(/\.\w+$/, ".types.ts")
					: outputPath,
				typeDefinitions,
				"utf8",
			);
		}
	}

	return {
		zodSchema,
		typeDefinitions,
	};
}

/**
 * Infer Zod schema type from a value
 */
function inferSchemaType(value: string): string {
	// Check for booleans
	if (value === "true" || value === "false") {
		return "boolean()";
	}

	// Check for numbers
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return "number()";
	}

	// URLs
	if (/^https?:\/\//.test(value)) {
		return "string().url()";
	}

	// Email
	if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
		return "string().email()";
	}

	// Default to string
	return "string()";
}

/**
 * Infer TypeScript type from a value
 */
function inferTypeScriptType(value: string): string {
	// Check for booleans
	if (value === "true" || value === "false") {
		return "boolean";
	}

	// Check for numbers
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return "number";
	}

	// Default to string
	return "string";
}

/**
 * Create a new .env file from a schema
 */
export function createEnvFileFromSchema(
	schema: Record<string, ZodType>,
	options: {
		directory?: string;
		fileName?: string;
		includeComments?: boolean;
		defaults?: Record<string, any>;
	} = {},
): void {
	const {
		directory = process.cwd(),
		fileName = ".env.example",
		includeComments = true,
		defaults = {},
	} = options;

	const filePath = path.resolve(directory, fileName);
	let content = "# Generated .env file from schema\n\n";

	// Process schema entries
	Object.entries(schema).forEach(([key, zodType]) => {
		// Add description from schema if available
		if (includeComments && zodType.description) {
			content += `# ${zodType.description}\n`;
		}

		// Generate default value
		let defaultValue = defaults[key] !== undefined ? defaults[key] : "";

		// If no default provided, try to generate one based on the schema type
		if (defaultValue === "") {
			defaultValue = generateDefaultValue(zodType);
		}

		content += `${key}=${defaultValue}\n\n`;
	});

	// Write to file
	fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Generate a default value based on a Zod schema type
 */
function generateDefaultValue(schema: ZodType): string {
	if (schema instanceof z.ZodString) return "";
	if (schema instanceof z.ZodNumber) return "0";
	if (schema instanceof z.ZodBoolean) return "false";
	if (schema instanceof z.ZodArray) return "[]";
	if (schema instanceof z.ZodObject) return "{}";
	return "";
}

/**
 * Convert a schema to TypeScript type definitions
 */
export function schemaToTypeDefinitions(
	schema: Record<string, ZodType>,
): string {
	let content = "/**\n * Generated TypeScript definitions\n */\n\n";
	content += "export interface Env {\n";

	Object.entries(schema).forEach(([key, zodType]) => {
		// Add description as JSDoc comment
		if (zodType.description) {
			content += `  /**\n   * ${zodType.description}\n   */\n`;
		}

		// Determine if the field is optional
		const isOptional = zodType instanceof z.ZodOptional;

		// Get the appropriate TypeScript type
		const tsType = zodTypeToTsType(
			isOptional ? (zodType as z.ZodOptional<any>).unwrap() : zodType,
		);

		content += `  ${key}${isOptional ? "?" : ""}: ${tsType};\n`;
	});

	content += "}\n";
	return content;
}

/**
 * Convert a Zod type to TypeScript type
 */
function zodTypeToTsType(zodType: ZodType): string {
	if (zodType instanceof z.ZodString) return "string";
	if (zodType instanceof z.ZodNumber) return "number";
	if (zodType instanceof z.ZodBoolean) return "boolean";
	if (zodType instanceof z.ZodArray)
		return `${zodTypeToTsType(zodType.element)}[]`;
	if (zodType instanceof z.ZodObject) return "Record<string, any>";
	if (zodType instanceof z.ZodEnum)
		return zodType.options.map((v: string) => `"${v}"`).join(" | ");
	if (zodType instanceof z.ZodUnion)
		return zodType.options.map(zodTypeToTsType).join(" | ");
	if (zodType instanceof z.ZodLiteral)
		return typeof zodType.value === "string"
			? `"${zodType.value}"`
			: String(zodType.value);
	if (zodType instanceof z.ZodOptional)
		return zodTypeToTsType(zodType.unwrap());
	return "any";
}
