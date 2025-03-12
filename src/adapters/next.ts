/**
 * Next.js Adapter
 *
 * Specialized adapter for Next.js applications with client/server awareness.
 */

import { type EnvironmentAdapter } from "./";

interface NextAdapterOptions {
	/**
	 * Prefix for client-exposed variables (default: NEXT_PUBLIC_)
	 */
	publicPrefix?: string;

	/**
	 * Whether to validate prefix conventions
	 */
	strictPrefix?: boolean;

	/**
	 * Function to determine if a variable is client-safe
	 */
	isClientSafe?: (key: string, value: string) => boolean;
}

/**
 * Extended Next.js adapter with additional features
 */
export class NextjsAdapter implements EnvironmentAdapter {
	private options: NextAdapterOptions = {
		publicPrefix: "NEXT_PUBLIC_",
		strictPrefix: true,
	};

	/**
	 * Initialize the adapter with options
	 */
	init(options?: NextAdapterOptions): void {
		this.options = {
			...this.options,
			...options,
		};
	}

	/**
	 * Check if running in a server environment
	 */
	isServer(): boolean {
		return typeof window === "undefined";
	}

	/**
	 * Get environment variables based on current environment
	 */
	getEnvironment(): Record<string, string> {
		if (this.isServer()) {
			return process.env as Record<string, string>;
		}

		// In browser, only return client-safe variables
		return this.getClientEnv();
	}

	/**
	 * Get all environment variables
	 */
	getAllEnv(): Record<string, string> {
		return process.env as Record<string, string>;
	}

	/**
	 * Get only client-safe environment variables
	 */
	getClientEnv(): Record<string, string> {
		const env: Record<string, string> = {};
		const { publicPrefix, isClientSafe } = this.options;

		Object.entries(process.env as Record<string, string>).forEach(
			([key, value]) => {
				const isPublic = key.startsWith(publicPrefix ?? "");

				// Check if variable is client-safe
				if (isPublic || (isClientSafe && isClientSafe(key, value))) {
					env[key] = value;
				}
			},
		);

		return env;
	}

	/**
	 * Check if a variable is client-safe
	 */
	isPublicVariable(key: string): boolean {
		const { publicPrefix, isClientSafe } = this.options;

		if (key.startsWith(publicPrefix ?? "")) {
			return true;
		}

		if (isClientSafe && isClientSafe(key, process.env[key] || "")) {
			return true;
		}

		return false;
	}

	/**
	 * Get build-time variables for Next.js
	 */
	getBuildEnv(): Record<string, string> {
		// These variables are available at build time in Next.js
		const env: Record<string, string> = {};

		Object.entries(process.env as Record<string, string>).forEach(
			([key, value]) => {
				if (this.isPublicVariable(key)) {
					env[key] = value;
				}
			},
		);

		return env;
	}

	/**
	 * Validate that client-safe variables follow the prefix convention
	 */
	validatePrefixConventions(
		env: Record<string, any>,
		clientKeys: string[],
	): string[] {
		if (!this.options.strictPrefix) {
			return [];
		}

		const { publicPrefix } = this.options;
		const errors: string[] = [];

		// Check that client variables follow the prefix convention
		clientKeys.forEach((key) => {
			if (!key.startsWith(publicPrefix ?? "")) {
				errors.push(
					`Client variable "${key}" does not follow the ${publicPrefix} prefix convention. ` +
						`Either prefix it with ${publicPrefix} or mark it as server-only.`,
				);
			}
		});

		return errors;
	}
}

// Export a singleton instance
export const nextAdapter = new NextjsAdapter();

export default nextAdapter;
