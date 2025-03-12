/**
 * EnvSafe - Enhanced Environment Management System
 *
 * A robust, type-safe environment variable management system with validation,
 * schema support, and framework adapters.
 */

import fs from "fs";
import path from "path";
import { z, ZodType, ZodError } from "zod";
import { parse } from "./parser";
import { EnvSafeError, ValidationError } from "./errors";
import { resolveAdapter } from "./adapters";
import { EnvironmentStore } from "./store";
import type {
	EnvSafeOptions,
	EnvSafeSchema,
	EnvSafeConfig,
	LoadOptions,
	AdapterOptions,
	EnvSafeResult,
	ValidationOptions,
	TypedEnv,
} from "./types";

/**
 * Create a type-safe environment configuration.
 *
 * @param schema The Zod schema for environment validation
 * @param options Configuration options for EnvSafe
 * @returns A typed environment object
 */
export function createEnv<T extends EnvSafeSchema = EnvSafeSchema>(
	config: EnvSafeOptions & { schema?: ZodType },
): EnvSafeResult<T> {
	const {
		server = {},
		client = {},
		shared = {},
		runtimeEnv = process.env,
		skipValidation = false,
		onValidationError = defaultValidationErrorHandler,
		onInvalidAccess = defaultInvalidAccessHandler,
		adapter = "node",
		updateProcessEnv = true,
		logLevel = "error",
		schema,
	} = config;

	// Initialize the environment store
	const store = new EnvironmentStore({
		updateProcessEnv,
		logLevel,
	});

	// Resolve the adapter
	const adapterInstance = resolveAdapter(adapter);

	// Combine schemas
	const combinedClientSchema = z.object({
		...shared,
		...client,
	});

	const combinedServerSchema = z.object({
		...shared,
		...server,
	});

	const isServer = adapterInstance.isServer();

	// Determine the appropriate schema based on environment
	const activeSchema = isServer ? combinedServerSchema : combinedClientSchema;

	// Extract raw environment values
	const env = { ...runtimeEnv };

	// Skip validation if specified
	if (skipValidation) {
		return createProxy(env, activeSchema, store, {
			isServer,
			onInvalidAccess,
		}) as EnvSafeResult<T>;
	}

	try {
		// Validate the environment against the schema
		const parsed = activeSchema.parse(env);

		// Store validated environment variables
		store.setAll(parsed);

		// Return the validated environment as a proxy
		return createProxy(parsed, activeSchema, store, {
			isServer,
			onInvalidAccess,
		}) as EnvSafeResult<T>;
	} catch (error) {
		if (error instanceof ZodError) {
			return onValidationError(error, env, activeSchema);
		}
		throw error;
	}
}

/**
 * Create a proxy for accessing environment variables with proper type checking
 */
function createProxy<T>(
	env: Record<string, any>,
	schema: z.ZodObject<any>,
	store: EnvironmentStore,
	options: {
		isServer: boolean;
		onInvalidAccess: (key: string) => never;
	},
): T {
	const { isServer, onInvalidAccess } = options;

	return new Proxy(env as any, {
		get: (target, prop) => {
			if (typeof prop !== "string") return target[prop];

			// Check if property exists in the target
			if (!(prop in target)) {
				return onInvalidAccess(prop);
			}

			// Check if trying to access server variable from client
			const serverShape = schema.shape?.server;
			if (!isServer && serverShape && prop in serverShape) {
				throw new EnvSafeError(
					`Attempted to access server-only environment variable "${prop}" from client code. ` +
						`This is not allowed for security reasons.`,
				);
			}

			return target[prop];
		},
	}) as T;
}

/**
 * Load environment variables from .env files
 */
export function loadEnvFile(options: LoadOptions = {}): Record<string, string> {
	const {
		directory = process.cwd(),
		fileName = ".env",
		environment = process.env.NODE_ENV || "development",
		encoding = "utf8",
		expandVariables = true,
		override = true,
	} = options;

	const envFiles = [
		`.env`,
		`.env.local`,
		`.env.${environment}`,
		`.env.${environment}.local`,
	].filter(Boolean);

	const envVars: Record<string, string> = {};

	// Load each env file in order of precedence
	for (const file of envFiles) {
		const filePath = path.resolve(directory, file);

		if (fs.existsSync(filePath)) {
			try {
				const content = fs.readFileSync(filePath, { encoding });
				const parsed = parse(content, { expandVariables });

				// Merge variables
				Object.entries(parsed).forEach(([key, value]) => {
					if (override || !(key in envVars)) {
						envVars[key] = value as string;
					}
				});
			} catch (error) {
				console.error(`Error loading env file ${filePath}:`, error);
			}
		}
	}

	return envVars;
}

/**
 * Default handler for validation errors
 */
function defaultValidationErrorHandler(
	error: ZodError,
	env: Record<string, any>,
	schema: z.ZodType,
): never {
	const formattedErrors = error.errors
		.map((err) => {
			return `${err.path.join(".")}: ${err.message}`;
		})
		.join("\n");

	throw new ValidationError(
		`Environment validation failed:\n${formattedErrors}`,
		error.errors,
	);
}

/**
 * Default handler for invalid access to environment variables
 */
function defaultInvalidAccessHandler(key: string): never {
	throw new EnvSafeError(
		`Attempted to access environment variable "${key}" that does not exist or is not defined in the schema.`,
	);
}

// Export types
export type {
	EnvSafeOptions,
	EnvSafeSchema,
	EnvSafeConfig,
	LoadOptions,
	AdapterOptions,
	EnvSafeResult,
	ValidationOptions,
	TypedEnv,
};

// Export modules
export * from "./adapters";
export * from "./store";
export * from "./parser";
export * from "./schema-utils";

// Re-export error types without namespace conflicts
export {
	EnvSafeError,
	ValidationError,
	ServerOnlyAccessError,
	MissingVariableError,
	InvalidAccessError,
	LoadError,
} from "./errors";

/**
 * Helper function to create a strongly-typed environment configuration with better IntelliSense.
 * This function is just a type wrapper around createEnv to provide better TypeScript support.
 *
 * @example
 * ```typescript
 * const serverSchema = { PORT: z.number() };
 * const clientSchema = { API_URL: z.string() };
 *
 * // Define your schema
 * const env = createTypedEnv({
 *   server: serverSchema,
 *   client: clientSchema,
 * });
 *
 * // Full IntelliSense support
 * env.PORT; // number
 * env.API_URL; // string
 * ```
 */
export function createTypedEnv<
	TServer extends Record<string, ZodType> = {},
	TClient extends Record<string, ZodType> = {},
	TShared extends Record<string, ZodType> = {},
>(config: {
	server?: TServer;
	client?: TClient;
	shared?: TShared;
	[key: string]: any;
}): TypedEnv<TServer, TClient, TShared> {
	return createEnv<{
		server: TServer;
		client: TClient;
		shared: TShared;
	}>(config) as TypedEnv<TServer, TClient, TShared>;
}
