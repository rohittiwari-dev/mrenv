import { EnvSchema } from "./types";

export class SchemaValidator {
	/**
	 * Validate environment variables against a schema
	 * @param env Environment variables
	 * @param schema Validation schema
	 * @returns Tuple with [isValid, errors, typedEnv]
	 */
	public validate<T extends Record<string, any>>(
		env: Record<string, string>,
		schema: EnvSchema<T>,
	): [boolean, string[], T] {
		const errors: string[] = [];
		const typedEnv = {} as T;

		for (const key in schema) {
			const schemaItem = schema[key];
			const rawValue = env[key];
			let value: any = rawValue;

			// Check if value is required but missing
			if (
				schemaItem.required &&
				(rawValue === undefined || rawValue === "")
			) {
				if (schemaItem.default !== undefined) {
					value = schemaItem.default;
				} else {
					errors.push(
						`Required environment variable ${key} is missing`,
					);
					continue;
				}
			}

			// If value is not required and missing, use default or skip
			if (
				(rawValue === undefined || rawValue === "") &&
				!schemaItem.required
			) {
				if (schemaItem.default !== undefined) {
					typedEnv[key as keyof T] = schemaItem.default;
				}
				continue;
			}

			// Type conversion
			try {
				switch (schemaItem.type) {
					case "string":
						value = String(rawValue);
						break;
					case "number":
						value = Number(rawValue);
						if (isNaN(value)) {
							throw new Error(`${key} must be a number`);
						}
						break;
					case "boolean":
						const lowercase = String(rawValue).toLowerCase().trim();
						if (["true", "1", "yes"].includes(lowercase)) {
							value = true;
						} else if (["false", "0", "no"].includes(lowercase)) {
							value = false;
						} else {
							throw new Error(`${key} must be a boolean`);
						}
						break;
					case "json":
						try {
							value = JSON.parse(rawValue);
						} catch (e) {
							throw new Error(`${key} must be valid JSON`);
						}
						break;
				}
			} catch (error: any) {
				errors.push(`Error parsing ${key}: ${error.message}`);
				continue;
			}

			// Custom validation
			if (schemaItem.validate && !schemaItem.validate(value)) {
				errors.push(`Validation failed for ${key}`);
				continue;
			}

			typedEnv[key as keyof T] = value;
		}

		return [errors.length === 0, errors, typedEnv];
	}

	/**
	 * Generate TypeScript types from schema
	 * @param schema Validation schema
	 * @returns TypeScript type definition string
	 */
	public generateTypeDefinitions<T extends Record<string, any>>(
		schema: EnvSchema<T>,
	): string {
		let typeDefinition = "export interface Env {\n";

		for (const key in schema) {
			const schemaItem = schema[key];
			let typeName: string;

			switch (schemaItem.type) {
				case "string":
					typeName = "string";
					break;
				case "number":
					typeName = "number";
					break;
				case "boolean":
					typeName = "boolean";
					break;
				case "json":
					typeName = "any";
					break;
				default:
					typeName = "string";
			}

			const optional =
				!schemaItem.required && schemaItem.default === undefined;
			typeDefinition += `  ${key}${optional ? "?" : ""}: ${typeName};\n`;
		}

		typeDefinition += "}\n";
		return typeDefinition;
	}
}

export default new SchemaValidator();
