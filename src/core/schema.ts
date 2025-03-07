import { EnvSchema, EnvSchemaItem, ZodSchema } from "./types";
import { z } from "zod";

/**
 * Infer environment variable types from values
 * @param env Environment variables
 * @returns Inferred schema
 */
export function inferSchema(env: Record<string, any>): Record<string, any> {
	const schema: Record<string, any> = {};

	for (const [key, value] of Object.entries(env)) {
		// Skip metadata
		if (key === "_metadata") continue;

		const type = inferType(value);
		schema[key] = { type, required: true };
	}

	return schema;
}

/**
 * Infer type from a value
 * @param value Value to infer type from
 * @returns Type as string
 */
function inferType(value: any): string {
	if (value === undefined || value === null) return "string";

	const type = typeof value;

	if (type === "number") return "number";
	if (type === "boolean") return "boolean";

	try {
		JSON.parse(value);
		return "json";
	} catch {
		return "string";
	}
}

/**
 * Schema validator class
 */
export class SchemaValidator {
	/**
	 * Validate environment variables against schema
	 * @param env Environment variables
	 * @param schema Schema to validate against
	 * @returns [isValid, errors, typedEnv]
	 */
	public validate<T extends Record<string, any>>(
		env: Record<string, string>,
		schema: EnvSchema<T> | ZodSchema,
	): [boolean, string[], T] {
		// Check if schema is a Zod schema
		if (this.isZodSchema(schema)) {
			return this.validateWithZod(env, schema);
		}

		// Otherwise use our custom schema validation
		return this.validateWithCustomSchema(env, schema as EnvSchema<T>);
	}

	/**
	 * Check if a schema is a Zod schema
	 */
	private isZodSchema(schema: any): schema is ZodSchema {
		return typeof schema.parse === "function";
	}

	/**
	 * Validate using Zod schema
	 */
	private validateWithZod<T extends Record<string, any>>(
		env: Record<string, string>,
		schema: ZodSchema,
	): [boolean, string[], T] {
		try {
			// Convert string values to appropriate types for Zod validation
			const processedEnv = this.preprocessEnvForZod(env);

			// Parse with Zod schema
			const result = schema.parse(processedEnv) as T;
			return [true, [], result];
		} catch (error: any) {
			if (error instanceof z.ZodError) {
				const errors = error.errors.map(
					(err) => `${err.path.join(".")}: ${err.message}`,
				);
				return [false, errors, {} as T];
			}

			return [false, [error.message || "Unknown error"], {} as T];
		}
	}

	/**
	 * Preprocess environment variables for Zod validation
	 * This tries to convert string values to their appropriate types
	 */
	private preprocessEnvForZod(
		env: Record<string, string>,
	): Record<string, any> {
		const result: Record<string, any> = {};

		for (const [key, value] of Object.entries(env)) {
			// Skip if undefined
			if (value === undefined) continue;

			// Try to parse as JSON
			try {
				result[key] = JSON.parse(value);
				continue;
			} catch {
				// Not valid JSON, try to guess the type
			}

			// Try to parse as number
			if (/^-?\d+(\.\d+)?$/.test(value)) {
				result[key] = Number(value);
				continue;
			}

			// Try to parse as boolean
			if (value.toLowerCase() === "true") {
				result[key] = true;
				continue;
			}
			if (value.toLowerCase() === "false") {
				result[key] = false;
				continue;
			}

			// Default to string
			result[key] = value;
		}

		return result;
	}

	/**
	 * Validate using our custom schema
	 */
	private validateWithCustomSchema<T extends Record<string, any>>(
		env: Record<string, string>,
		schema: EnvSchema<T>,
	): [boolean, string[], T] {
		const errors: string[] = [];
		const typedEnv = {} as T;

		// Check for required variables
		for (const [key, def] of Object.entries(schema)) {
			const value = env[key];

			// Skip if the schema definition is undefined
			if (!def) continue;

			// Check if required
			if (def.required && (value === undefined || value === null)) {
				errors.push(`Missing required environment variable: ${key}`);
				continue;
			}

			// Use default value if provided and value is missing
			if (
				(value === undefined || value === null) &&
				def.default !== undefined
			) {
				typedEnv[key as keyof T] = def.default;
				continue;
			}

			// Convert value based on type
			try {
				const convertedValue = this.convertValue(value, def.type);
				typedEnv[key as keyof T] = convertedValue;

				// Validate if validator provided
				if (def.validate && !def.validate(convertedValue)) {
					errors.push(
						`Invalid value for environment variable: ${key}`,
					);
				}
			} catch (error: any) {
				errors.push(
					`Error parsing environment variable ${key}: ${error.message}`,
				);
			}
		}

		return [errors.length === 0, errors, typedEnv];
	}

	/**
	 * Convert string value to specified type
	 * @param value String value
	 * @param type Target type
	 * @returns Converted value
	 */
	private convertValue(value: string, type: string): any {
		if (value === undefined || value === null) {
			return undefined;
		}

		switch (type) {
			case "string":
				return value;
			case "number":
				const num = Number(value);
				if (isNaN(num))
					throw new Error(`Cannot convert '${value}' to number`);
				return num;
			case "boolean":
				return ["true", "1", "yes"].includes(value.toLowerCase());
			case "json":
				return JSON.parse(value);
			default:
				return value;
		}
	}

	/**
	 * Generate TypeScript definitions for schema
	 * @param schema Environment schema
	 * @returns TypeScript definitions
	 */
	public generateTypeDefinitions<T extends Record<string, any>>(
		schema: EnvSchema<T>,
	): string {
		let defs = `declare namespace NodeJS {\n`;
		defs += `  interface ProcessEnv {\n`;

		for (const [key, def] of Object.entries(schema)) {
			// Skip if the schema definition is undefined
			if (!def) continue;

			let type = "string";

			switch (def.type) {
				case "number":
					type = "number";
					break;
				case "boolean":
					type = "boolean";
					break;
				case "json":
					type = "any";
					break;
				default:
					type = "string";
			}

			defs += `    ${key}: ${type};\n`;
		}

		defs += `  }\n}\n`;

		return defs;
	}
}

export default new SchemaValidator();
