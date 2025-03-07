import { CreateEnvConfig, EnvResult, Runtime } from "./types";
import envReader, { defaultPatterns } from "./envReader";
import runtimeDetector from "./runtimeDetector";
import schemaValidator from "./schema";

/**
 * Main function to create and validate environment variables
 * @param config Configuration options
 * @returns Typed environment variables
 */
export function createEnv<
	T extends Record<string, any> = Record<string, string>,
>(config: CreateEnvConfig<T> = {}): EnvResult<T> {
	// Detect runtime if not specified
	const runtime: Runtime =
		config.runtime === "auto" || !config.runtime
			? runtimeDetector.detectRuntime()
			: config.runtime;

	// Check if running on client-side
	const isClient = !runtimeDetector.isServer(runtime);

	// Read environment variables from files if on server-side
	let envVars: Record<string, string> = {};

	// Loaded files for metadata
	let loadedFiles: string[] = [];

	if (!isClient) {
		// Only read .env files on server-side
		envVars = envReader.readEnvFiles(
			config.paths,
			undefined,
			config.autoReload,
		);

		// Store loaded files for metadata
		loadedFiles = config.paths || defaultPatterns.map((p) => p.pattern);
	}

	// Merge with process.env or other runtime-specific env vars
	const globalObject = runtimeDetector.getGlobalObject(runtime);

	// Start with existing environment variables
	const processEnv: Record<string, string> = {
		...(globalObject.process?.env || {}),
		...envVars,
	};

	// Filter variables based on protected/public settings
	let filteredEnv: Record<string, string> = { ...processEnv };

	// Handle server/client variable filtering
	if (isClient && config.protectedEnv && config.protectedEnv.length > 0) {
		// Remove protected variables on client-side
		filteredEnv = Object.keys(filteredEnv).reduce((acc, key) => {
			if (!config.protectedEnv?.includes(key)) {
				acc[key] = filteredEnv[key];
			}
			return acc;
		}, {} as Record<string, string>);
	}

	// Handle public prefix filtering
	if (config.publicPrefix) {
		if (isClient) {
			// On client, only include variables with public prefix
			filteredEnv = Object.keys(filteredEnv).reduce((acc, key) => {
				if (key.startsWith(config.publicPrefix!)) {
					acc[key] = filteredEnv[key];
				}
				return acc;
			}, {} as Record<string, string>);
		} else {
			// Server can access all variables
		}
	}

	let typedEnv: T;
	let validationErrors: string[] = [];

	// Validate against schema if provided
	if (config.schema) {
		const [isValid, errors, validated] = schemaValidator.validate<T>(
			filteredEnv,
			config.schema,
		);

		typedEnv = validated;
		validationErrors = errors;

		// Handle validation errors
		if (!isValid && validationErrors.length > 0) {
			if (config.onValidationError) {
				config.onValidationError(
					new Error(
						`Environment validation failed: ${validationErrors.join(
							", ",
						)}`,
					),
				);
			} else {
				throw new Error(
					`Environment validation failed: ${validationErrors.join(
						", ",
					)}`,
				);
			}
		}
	} else {
		// If no schema, just cast the filtered env
		typedEnv = filteredEnv as unknown as T;
	}

	// Add metadata
	const result = {
		...typedEnv,
		_metadata: {
			isClient,
			runtime,
			loadedFiles,
		},
	} as EnvResult<T>;

	// Apply runtime-specific behavior
	if (runtime === "node" || runtime === "bun") {
		// For Node.js/Bun, we could optionally override process.env
	} else if (runtime === "deno") {
		// For Deno, we might need additional logic
	} else if (runtime === "browser") {
		// For browser, maybe store in localStorage or similar
	}

	return result;
}
