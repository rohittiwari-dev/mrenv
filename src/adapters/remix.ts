import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";

/**
 * Remix configuration for superenv
 */
export interface SuperenvRemixOptions extends CreateEnvConfig {
	/**
	 * Whether to register a route for client environment
	 * @default true
	 */
	registerRoute?: boolean;
}

/**
 * Load environment variables for Remix
 * @param options Superenv options
 * @returns Environment variables and Remix helpers
 */
export function superenvRemix(options: SuperenvRemixOptions = {}) {
	// Initialize environment
	const env = createEnv({
		...options,
		runtime: "node",
	});

	// Filter environment for client
	const publicEnvKeys = Object.keys(env).filter((key) => {
		// Skip internal metadata
		if (key === "_metadata") return false;

		// Filter based on configuration
		if (options.publicPrefix) {
			return key.startsWith(options.publicPrefix);
		}

		if (options.protectedEnv) {
			return !options.protectedEnv.includes(key);
		}

		return true;
	});

	// Create public env object
	const publicEnv = publicEnvKeys.reduce((acc, key) => {
		acc[key] = env[key];
		return acc;
	}, {} as Record<string, any>);

	// Create server loader data
	const getEnvLoader = () => {
		return async () => {
			return {
				env: publicEnv,
			};
		};
	};

	// Create client script
	const getClientScript = () => {
		return `window.env = ${JSON.stringify(publicEnv)};`;
	};

	return {
		env,
		publicEnv,
		getEnvLoader,
		getClientScript,
	};
}

/**
 * Create a route handler for Remix environment
 * @param options Superenv options
 * @returns Remix route handler
 */
export function createRemixEnvRoute(options: SuperenvRemixOptions = {}) {
	const { publicEnv } = superenvRemix(options);

	return () => {
		return new Response(`window.env = ${JSON.stringify(publicEnv)};`, {
			headers: {
				"Content-Type": "application/javascript",
			},
		});
	};
}
