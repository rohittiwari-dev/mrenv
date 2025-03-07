import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";

/**
 * Edge runtime configuration for superenv
 */
export interface SuperenvEdgeOptions extends CreateEnvConfig {
	/**
	 * Whether to expose environment variables to client
	 * @default false
	 */
	exposeToClient?: boolean;
}

/**
 * Load environment variables for Edge runtimes
 * @param options Superenv options
 * @returns Environment variables
 */
export function superenvEdge(options: SuperenvEdgeOptions = {}) {
	// Use edge runtime
	return createEnv({
		...options,
		runtime: "edge",
	});
}

/**
 * Middleware for edge environment variables
 * @param options Superenv options
 * @returns Middleware function
 */
export function superenvEdgeMiddleware(options: SuperenvEdgeOptions = {}) {
	const env = superenvEdge(options);

	// Create middleware for edge runtime
	return async (req: Request) => {
		const url = new URL(req.url);

		// Endpoint for client environment
		if (url.pathname === "/_superenv.js" && options.exposeToClient) {
			// Filter environment for client
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

			return new Response(`self.env = ${JSON.stringify(publicEnv)};`, {
				headers: {
					"Content-Type": "application/javascript",
				},
			});
		}

		// Pass env to other middleware or handlers
		return null;
	};
}
