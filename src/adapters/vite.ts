import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";
import type { Plugin, UserConfig } from "vite";

/**
 * Vite plugin options for mrenv
 */
export interface MrenvViteOptions extends CreateEnvConfig {
	/**
	 * Prefix to use for environment variables in Vite
	 * @default 'VITE_'
	 */
	viteEnvPrefix?: string;
}

/**
 * Create a Vite plugin for mrenv
 * @param options Mrenv options
 * @returns Vite plugin
 */
export function mrenvVite(options: MrenvViteOptions = {}): Plugin {
	// Initialize environment
	const env = createEnv(options);

	// Default prefix for Vite
	const vitePrefix = options.viteEnvPrefix || "VITE_";

	// Store public env keys for later use
	let publicEnv: Record<string, any> = {};

	return {
		name: "vite-plugin-mrenv",
		config(config) {
			// Filter environment variables
			const publicEnvKeys = Object.keys(env).filter((key) => {
				// Skip internal metadata
				if (key === "_metadata") return false;

				// Check for Vite prefix
				if (key.startsWith(vitePrefix)) return true;

				// Otherwise, only include if no prefix is defined and not in protected keys
				if (
					!options.publicPrefix &&
					(!options.protectedEnv ||
						!options.protectedEnv.includes(key))
				) {
					return true;
				}

				return false;
			});

			// Create the public env object
			publicEnv = {};
			for (const key of publicEnvKeys) {
				publicEnv[key] = env[key];
			}

			// Create define object for Vite
			const define: Record<string, string> = {};
			for (const [key, value] of Object.entries(publicEnv)) {
				define[`import.meta.env.${key}`] = JSON.stringify(value);
			}

			// Return updated config
			return {
				...config,
				define: {
					...(config.define || {}),
					...define,
				},
			};
		},
		configResolved(config) {
			// Log available environment variables
			if (config.mode === "development") {
				console.log("🔍 [mrenv] Available environment variables:");
				Object.keys(publicEnv).forEach((key) => {
					console.log(`  ${key}`);
				});
			}
		},
	};
}
