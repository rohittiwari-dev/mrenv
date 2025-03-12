/**
 * Type Definitions
 */

import { z, ZodType, type ZodTypeDef, ZodError } from "zod";
import { type EnvironmentAdapter } from "./adapters";

/**
 * Schema configuration for environment variables
 */
export interface EnvSafeSchema {
	/**
	 * Server-only environment variables
	 */
	server?: Record<string, ZodType<any, any, any>>;

	/**
	 * Client-accessible environment variables
	 */
	client?: Record<string, ZodType<any, any, any>>;

	/**
	 * Environment variables shared between client and server
	 */
	shared?: Record<string, ZodType<any, any, any>>;
}

/**
 * Options for environment configuration
 */
export interface EnvSafeOptions {
	/**
	 * Schema for server-only variables
	 */
	server?: Record<string, ZodType<any, any, any>>;

	/**
	 * Schema for client-accessible variables
	 */
	client?: Record<string, ZodType<any, any, any>>;

	/**
	 * Schema for shared variables
	 */
	shared?: Record<string, ZodType<any, any, any>>;

	/**
	 * Runtime environment to validate
	 */
	runtimeEnv?: Record<string, any>;

	/**
	 * Whether to skip validation
	 */
	skipValidation?: boolean;

	/**
	 * Error handler for validation failures
	 */
	onValidationError?: (
		error: ZodError,
		env: Record<string, any>,
		schema: ZodType,
	) => never;

	/**
	 * Error handler for invalid variable access
	 */
	onInvalidAccess?: (key: string) => never;

	/**
	 * Environment adapter to use
	 */
	adapter?: string | EnvironmentAdapter;

	/**
	 * Whether to update process.env with validated values
	 */
	updateProcessEnv?: boolean;

	/**
	 * Log level for operations
	 */
	logLevel?: "none" | "error" | "warn" | "info" | "debug";
}

/**
 * Options for loading environment files
 */
export interface LoadOptions {
	/**
	 * Directory containing .env files
	 */
	directory?: string;

	/**
	 * Base file name
	 */
	fileName?: string;

	/**
	 * Environment to load
	 */
	environment?: string;

	/**
	 * File encoding
	 */
	encoding?: BufferEncoding;

	/**
	 * Whether to expand variables
	 */
	expandVariables?: boolean;

	/**
	 * Whether to override existing variables
	 */
	override?: boolean;
}

/**
 * Options for environment validation
 */
export interface ValidationOptions {
	/**
	 * Whether to throw on validation error
	 */
	throwOnError?: boolean;

	/**
	 * Custom error formatter
	 */
	errorFormatter?: (error: ZodError) => string;

	/**
	 * Custom success handler
	 */
	onSuccess?: (result: Record<string, any>) => void;
}

/**
 * Options for environment adapters
 */
export interface AdapterOptions {
	/**
	 * Custom environment detection
	 */
	isServerOverride?: boolean;

	/**
	 * Custom environment variables
	 */
	envOverride?: Record<string, string>;

	/**
	 * Custom configuration
	 */
	[key: string]: any;
}

/**
 * Type-safe result from environment configuration
 */
export type EnvSafeResult<T extends EnvSafeSchema> = {
	// Include all server variables
	[K in keyof T["server"]]: T["server"][K] extends ZodType<infer U>
		? U
		: never;
} & {
	// Include all client variables
	[K in keyof T["client"]]: T["client"][K] extends ZodType<infer U>
		? U
		: never;
} & {
	// Include all shared variables
	[K in keyof T["shared"]]: T["shared"][K] extends ZodType<infer U>
		? U
		: never;
};

/**
 * Create a more specific type helper for better IntelliSense
 */
export type TypedEnv<
	TServer extends Record<string, ZodType> = {},
	TClient extends Record<string, ZodType> = {},
	TShared extends Record<string, ZodType> = {},
> = EnvSafeResult<{
	server: TServer;
	client: TClient;
	shared: TShared;
}>;

/**
 * Environment configuration definition
 */
export interface EnvSafeConfig<T extends EnvSafeSchema> {
	/**
	 * Get the typed environment value
	 */
	get<K extends keyof EnvSafeResult<T>>(key: K): EnvSafeResult<T>[K];

	/**
	 * Check if a variable exists
	 */
	has<K extends keyof EnvSafeResult<T>>(key: K): boolean;

	/**
	 * Get all environment variables
	 */
	getAll(): EnvSafeResult<T>;

	/**
	 * Get client-safe variables only
	 */
	getClientEnv(): Partial<EnvSafeResult<T>>;
}
