/**
 * Environment Variable Parser
 *
 * Handles parsing of .env files and environment variable expansion.
 */

import { EnvSafeError } from "./errors";

/**
 * Options for parsing environment variables
 */
export interface ParseOptions {
	/**
	 * Whether to expand variables like ${VAR} or $VAR
	 */
	expandVariables?: boolean;

	/**
	 * Whether to throw on parsing errors
	 */
	throwOnError?: boolean;

	/**
	 * Environment variables to use for expansion
	 */
	envForExpansion?: Record<string, string>;
}

/**
 * Parse environment variables from a string content
 *
 * @param content The content to parse
 * @param options Parsing options
 * @returns Parsed environment variables
 */
export function parse(
	content: string,
	options: ParseOptions = {},
): Record<string, string> {
	const {
		expandVariables = true,
		throwOnError = false,
		envForExpansion = process.env,
	} = options;

	const result: Record<string, string> = {};
	const lines = content.split(/\r?\n/);

	for (const line of lines) {
		// Skip comments and empty lines
		if (line.trim().startsWith("#") || !line.trim()) {
			continue;
		}

		// Match variable definitions
		const match = line.match(
			/^\s*([\w.-]+)\s*=\s*("[^"]*"|'[^']*'|[^#]*)?(\s*#.*)?$/,
		);

		if (match) {
			const key = match[1];
			// Extract the value, handling quotes
			let value = (match[2] || "").trim();

			// Remove surrounding quotes
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.substring(1, value.length - 1);
			}

			// Expand variables if enabled
			if (expandVariables) {
				try {
					value = expandEnvironmentVariables(value, {
						...result,
						...envForExpansion,
					});
				} catch (error) {
					if (throwOnError) {
						throw new EnvSafeError(
							`Error expanding variables in "${key}": ${
								(error as any).message
							}`,
						);
					}
				}
			}

			result[key] = value;
		}
	}

	return result;
}

/**
 * Expand environment variables in a string
 *
 * @param value The string containing variables to expand
 * @param env The environment variables to use for expansion
 * @returns The expanded string
 */
export function expandEnvironmentVariables(
	value: string,
	env: Record<string, string | undefined> = process.env,
): string {
	// Match ${VAR} or $VAR patterns
	return value.replace(
		/\${([^}]+)}|\$([a-zA-Z0-9_]+)/g,
		(match, bracketed, simple) => {
			const key = bracketed || simple;

			// Check for default value syntax ${VAR:-default}
			if (bracketed && bracketed.includes(":-")) {
				const [varName, defaultValue] = bracketed.split(":-");
				return env[varName] !== undefined ? env[varName] : defaultValue;
			}

			// Regular variable replacement
			if (env[key] !== undefined) {
				return env[key];
			}

			// Return the original if not found
			return match;
		},
	);
}

/**
 * Stringify environment variables into a format suitable for a .env file
 *
 * @param env The environment variables to stringify
 * @returns A string representation for a .env file
 */
export function stringify(
	env: Record<string, string | number | boolean>,
): string {
	return Object.entries(env)
		.map(([key, value]) => {
			// Handle different value types
			let stringValue: string;

			if (typeof value === "string") {
				// Quote strings that contain spaces or special characters
				if (/[\s"'=]/.test(value)) {
					stringValue = `"${value.replace(/"/g, '\\"')}"`;
				} else {
					stringValue = value;
				}
			} else {
				stringValue = String(value);
			}

			return `${key}=${stringValue}`;
		})
		.join("\n");
}
