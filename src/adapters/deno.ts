import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";

/**
 * Deno configuration for superenv
 */
export interface SuperenvDenoOptions extends CreateEnvConfig {
	/**
	 * Whether to load from Deno.env
	 * @default true
	 */
	loadFromDenoEnv?: boolean;
}

/**
 * Load environment variables for Deno
 * @param options Superenv options
 * @returns Environment variables
 */
export function superenvDeno(options: SuperenvDenoOptions = {}) {
	// Override runtime to Deno
	return createEnv({
		...options,
		runtime: "deno",
	});
}

/**
 * Middleware for Oak (Deno web framework)
 * @param options Superenv options
 * @returns Oak middleware
 */
export function superenvOak(options: SuperenvDenoOptions = {}) {
	const env = superenvDeno(options);

	// Create middleware for Oak
	return async (ctx: any, next: () => Promise<void>) => {
		// Make environment available on context
		ctx.state.env = env;

		// Provide endpoint for client env
		if (ctx.request.url.pathname === "/_superenv.js") {
			// Filter for client-safe variables
			const publicEnv = Object.keys(env)
				.filter((key) => {
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
				})
				.reduce((acc, key) => {
					acc[key] = env[key];
					return acc;
				}, {} as Record<string, any>);

			ctx.response.type = "application/javascript";
			ctx.response.body = `globalThis.env = ${JSON.stringify(
				publicEnv,
			)};`;
			return;
		}

		await next();
	};
}
