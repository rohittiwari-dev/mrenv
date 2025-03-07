import { createEnv } from "../core/createEnv";
import type { Request, Response, NextFunction } from "express";
import { CreateEnvConfig } from "../core/types";

/**
 * Express middleware options
 */
export interface MrenvExpressOptions extends CreateEnvConfig {
	/**
	 * Environment variable to expose to frontend
	 * @default []
	 */
	exposeKeys?: string[];
}

/**
 * Create Express middleware for mrenv
 * This middleware will:
 * 1. Make environment variables available in res.locals.env
 * 2. Optionally expose selected variables to the frontend
 *
 * @param options Configuration options
 * @returns Express middleware
 */
export function mrenvExpress(options: MrenvExpressOptions = {}) {
	// Initialize the environment
	const env = createEnv(options);

	// Determine which keys to expose
	const exposeKeys = options.exposeKeys || [];

	// Create a filtered version for frontend exposure
	const publicEnv: Record<string, any> = {};

	if (exposeKeys.length > 0) {
		// Only include explicitly listed keys
		for (const key of exposeKeys) {
			if (key in env && key !== "_metadata") {
				publicEnv[key] = env[key];
			}
		}
	} else if (options.publicPrefix) {
		// Include all keys with public prefix
		for (const [key, value] of Object.entries(env)) {
			if (key !== "_metadata" && key.startsWith(options.publicPrefix)) {
				publicEnv[key] = value;
			}
		}
	}

	// Return the middleware
	return (req: Request, res: Response, next: NextFunction) => {
		// Make full env available to server code via res.locals
		res.locals.env = env;

		// Make public env available for templates
		res.locals.publicEnv = publicEnv;

		// Add helper to expose env to frontend
		res.locals.getEnvScript = () => {
			const script = `<script>window.ENV = ${JSON.stringify(
				publicEnv,
			)};</script>`;
			return script;
		};

		next();
	};
}
