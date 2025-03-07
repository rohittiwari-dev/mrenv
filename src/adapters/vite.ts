import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";
import type { Plugin } from "vite";

/**
 * Vite plugin options for superenv
 */
export interface SuperenvViteOptions extends CreateEnvConfig {
	/**
	 * Prefix to use for environment variables in Vite
	 * @default 'VITE_'
	 */
	viteEnvPrefix?: string;
}

/**
 * Create a Vite plugin for superenv
 * @param options Superenv options
 * @returns Vite plugin
 */
export function superenvVite(options: SuperenvViteOptions = {}): Plugin {
	// Initialize environment
	const env = createEnv(options);

	// Default prefix for Vite
	const vitePrefix = options.viteEnvPrefix || "VITE_";

	return {
		name: "vite-plugin-superenv",
		config(config) {
			// Filter environment variables
			const publicEnvKeys = Object.keys(env).filter((key) => {
				// Skip internal metadata
				if (key === "_metadata") return false;

				// Check for Vite prefix
				if (key.startsWith(vitePrefix)) return true;

				// If publicPrefix is specified, check for prefix
				if (
					options.publicPrefix &&
					key.startsWith(options.publicPrefix)
				) {
					return true;
				}

				// If protected list is specified, exclude those
				if (
					options.protectedEnv &&
					!options.protectedEnv.includes(key)
				) {
					return true;
				}

				return false;
			});

			// Create env object for Vite
			const viteEnv = publicEnvKeys.reduce((acc, key) => {
				acc[key] = env[key];
				return acc;
			}, {} as Record<string, any>);

			// Return updated config
			return {
				...config,
				define: {
					...(config.define || {}),
					// Add environment variables to define
					...Object.entries(viteEnv).reduce((acc, [key, value]) => {
						acc[`import.meta.env.${key}`] = JSON.stringify(value);
						return acc;
					}, {} as Record<string, string>),
				},
			};
		},
		configResolved(config) {
			// Log available environment variables
			console.log("📄 Superenv loaded environment variables for Vite");
		},
	};
}
