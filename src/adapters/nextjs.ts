import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";
import type { NextConfig } from "next";

export interface SuperenvNextOptions extends CreateEnvConfig {
	/**
	 * Next.js config to extend
	 */
	nextConfig?: NextConfig;
}

/**
 * Create a Next.js config with mrenv integration
 * @param options Configuration options
 * @returns Extended Next.js config
 */
export function withMrenv(options: SuperenvNextOptions = {}): NextConfig {
	// Initialize the environment
	const env = createEnv(options);

	// Get the original Next.js config
	const nextConfig = options.nextConfig || {};

	// Merge with existing env if any
	const originalEnv = nextConfig.env || {};

	// Return extended config
	return {
		...nextConfig,
		// Merge environment variables
		env: {
			...originalEnv,
			...env,
		},
		// Override webpack configuration to add mrenv
		webpack: (config: any, options: any) => {
			// Call the original webpack config if it exists
			if (typeof nextConfig.webpack === "function") {
				config = nextConfig.webpack(config, options);
			}

			// Add mrenv support (if needed in the future)

			return config;
		},
	};
}
