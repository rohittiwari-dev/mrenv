/**
 * Runtime environments where the code can execute
 */
export type Runtime = "node" | "browser" | "deno" | "edge" | "bun" | "auto";

/**
 * Environment validation schema type
 */
export type EnvSchema<T extends Record<string, any>> = {
	[K in keyof T]: {
		type: "string" | "number" | "boolean" | "json";
		default?: T[K];
		required?: boolean;
		validate?: (value: T[K]) => boolean;
	};
};

/**
 * Configuration for createEnv function
 */
export interface CreateEnvConfig<
	T extends Record<string, any> = Record<string, any>,
> {
	/**
	 * Runtime where the code is executing
	 * @default 'auto'
	 */
	runtime?: Runtime;

	/**
	 * List of environment variables that should be protected (server-side only)
	 */
	protectedEnv?: string[];

	/**
	 * Prefix for variables that should be accessible on the client
	 * @default undefined - If not provided, all variables will be available for both client and server
	 */
	publicPrefix?: string;

	/**
	 * Validation schema for environment variables
	 */
	schema?: EnvSchema<T>;

	/**
	 * Custom paths for .env files
	 * @default undefined - If not provided, will use default patterns
	 */
	paths?: string[];

	/**
	 * Function to handle validation errors
	 */
	onValidationError?: (error: Error) => void;

	/**
	 * Auto reload environment variables on file changes
	 * @default false
	 */
	autoReload?: boolean;

	/**
	 * Output path for generated env files
	 * @default './' (root directory)
	 */
	outputPath?: string;
}

/**
 * Result of createEnv function
 */
export type EnvResult<T extends Record<string, any>> = {
	[K in keyof T]: T[K];
} & {
	_metadata: {
		isClient: boolean;
		runtime: Runtime;
		loadedFiles: string[];
	};
};

/**
 * Environment file pattern
 */
export interface EnvPattern {
	pattern: string;
	priority: number;
}

/**
 * Git hook types
 */
export type GitHook = "pre-commit" | "pre-push" | "post-checkout";
