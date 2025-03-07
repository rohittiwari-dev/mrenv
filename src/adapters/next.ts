import { type NextConfig } from "next";
import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";

/**
 * Next.js adapter configuration
 */
export interface WithSuperenvOptions extends CreateEnvConfig {
	/**
	 * Whether to expose environment variables in browser
	 * @default false
	 */
	exposeToClient?: boolean;
}

/**
 * Next.js adapter for superenv
 * @param nextConfig Next.js configuration
 * @param options Superenv options
 * @returns Modified Next.js configuration
 */
export function withSuperenv(
	nextConfig: NextConfig = {},
	options: WithSuperenvOptions = {},
) {
	// Initialize environment
	const env = createEnv(options);

	// Filter environment for client
	const publicEnvKeys = Object.keys(env).filter((key) => {
		// Skip internal metadata
		if (key === "_metadata") return false;

		// If publicPrefix is specified, check for prefix
		if (options.publicPrefix) {
			return key.startsWith(options.publicPrefix);
		}

		// If protected list is specified, exclude those
		if (options.protectedEnv) {
			return !options.protectedEnv.includes(key);
		}

		// If exposeToClient is explicitly set to false, don't expose anything
		if (options.exposeToClient === false) {
			return false;
		}

		// Default: expose all if no filtering is configured
		return true;
	});

	// Create public env object
	const publicEnv = publicEnvKeys.reduce((acc, key) => {
		acc[key] = env[key];
		return acc;
	}, {} as Record<string, any>);

	return {
		...nextConfig,
		// Merge with existing env
		env: {
			...(nextConfig.env || {}),
			...publicEnv,
		},
		// Optional: add server runtime config
		serverRuntimeConfig: {
			...(nextConfig.serverRuntimeConfig || {}),
			// Full env available on server
			_superenv: env,
		},
		// Optional: add public runtime config
		publicRuntimeConfig: {
			...(nextConfig.publicRuntimeConfig || {}),
			// Public env for client
			_superenv: publicEnv,
		},
	};
}
