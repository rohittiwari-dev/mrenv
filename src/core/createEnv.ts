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

	// If publicPrefix is specified, filter out non-public variables on client
	if (isClient && config.publicPrefix) {
		filteredEnv = Object.keys(filteredEnv).reduce((acc, key) => {
			if (key.startsWith(config.publicPrefix as string)) {
				acc[key] = filteredEnv[key];
			}
			return acc;
		}, {} as Record<string, string>);
	}

	// Validate against schema if provided
	let typedEnv: any = filteredEnv;

	if (config.schema) {
		const [isValid, errors, validatedEnv] = schemaValidator.validate<T>(
			filteredEnv,
			config.schema,
		);

		if (!isValid) {
			const errorMessage = `Environment validation failed: ${errors.join(
				", ",
			)}`;

			if (config.onValidationError) {
				const error = new Error(errorMessage);
				config.onValidationError(error);
			} else {
				// Throw error by default unless onValidationError is provided
				throw new Error(errorMessage);
			}
		}

		typedEnv = validatedEnv;
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

	return result;
}
