import { CreateEnvConfig } from "../core/types";
import { createEnv } from "../core/createEnv";

/**
 * Express middleware options
 */
export interface SuperenvExpressOptions extends CreateEnvConfig {
	/**
	 * Environment variable to expose to frontend
	 * @default []
	 */
	exposeKeys?: string[];
}

/**
 * Create Express middleware for exposing environment variables
 * @param options Superenv options
 * @returns Express middleware
 */
export function superenvExpress(options: SuperenvExpressOptions = {}) {
	// Initialize environment
	const env = createEnv({
		...options,
		runtime: "node",
	});

	// Filter environment for client exposure
	const publicEnvKeys = options.exposeKeys || [];
	const publicEnv = publicEnvKeys.reduce((acc, key) => {
		if (env[key] !== undefined) {
			acc[key] = env[key];
		}
		return acc;
	}, {} as Record<string, any>);

	// Create middleware
	return (req: any, res: any, next: () => void) => {
		// Make full env available on request object
		req.env = env;

		// Send public env to client when requested
		if (req.path === "/_superenv.js") {
			res.setHeader("Content-Type", "application/javascript");
			res.send(`window.env = ${JSON.stringify(publicEnv)};`);
			return;
		}

		next();
	};
}
