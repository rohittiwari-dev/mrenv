/**
 * Adapter System
 *
 * Provides environment-specific adapters for different frameworks.
 */

import { EnvSafeError } from "../errors";
import type { AdapterOptions } from "../types";

/**
 * Interface for environment adapters
 */
export interface EnvironmentAdapter {
	/**
	 * Check if the current environment is a server environment
	 */
	isServer(): boolean;

	/**
	 * Get environment-specific variables
	 */
	getEnvironment(): Record<string, string>;

	/**
	 * Initialize the adapter
	 */
	init(options?: AdapterOptions): void;

	/**
	 * Get client-safe variables
	 */
	getClientEnv(): Record<string, string>;

	/**
	 * Get all environment variables
	 */
	getAllEnv(): Record<string, string>;
}

/**
 * Base adapter implementation
 */
abstract class BaseAdapter implements EnvironmentAdapter {
	protected options: AdapterOptions = {};

	init(options: AdapterOptions = {}): void {
		this.options = options;
	}

	abstract isServer(): boolean;

	getEnvironment(): Record<string, string> {
		return typeof process !== "undefined" && process.env
			? (process.env as Record<string, string>)
			: {};
	}

	getClientEnv(): Record<string, string> {
		return {};
	}

	getAllEnv(): Record<string, string> {
		return this.getEnvironment();
	}
}

/**
 * Node.js adapter
 */
export class NodeAdapter extends BaseAdapter {
	isServer(): boolean {
		return true;
	}
}

/**
 * Browser adapter
 */
export class BrowserAdapter extends BaseAdapter {
	isServer(): boolean {
		return false;
	}

	getEnvironment(): Record<string, string> {
		// Browser doesn't have direct access to process.env
		return {};
	}
}

/**
 * Next.js adapter
 */
export class NextAdapter extends BaseAdapter {
	isServer(): boolean {
		return typeof window === "undefined";
	}

	getEnvironment(): Record<string, string> {
		return typeof process !== "undefined" && process.env
			? (process.env as Record<string, string>)
			: {};
	}

	getClientEnv(): Record<string, string> {
		const env: Record<string, string> = {};

		if (typeof process !== "undefined" && process.env) {
			Object.entries(process.env as Record<string, string>).forEach(
				([key, value]) => {
					if (key.startsWith("NEXT_PUBLIC_")) {
						env[key] = value;
					}
				},
			);
		}

		return env;
	}
}

// Map of available adapters
const adapters: Record<string, new () => EnvironmentAdapter> = {
	node: NodeAdapter,
	browser: BrowserAdapter,
	next: NextAdapter,
};

/**
 * Resolve an adapter by name or instance
 */
export function resolveAdapter(
	adapter?: string | EnvironmentAdapter,
	options?: AdapterOptions,
): EnvironmentAdapter {
	// If adapter is provided as object, use it
	if (typeof adapter === "object" && adapter !== null) {
		if (options) {
			adapter.init(options);
		}
		return adapter;
	}

	// If adapter is specified by name
	if (typeof adapter === "string") {
		const AdapterClass = adapters[adapter.toLowerCase()];
		if (!AdapterClass) {
			throw new EnvSafeError(
				`Unknown adapter: ${adapter}. Available adapters: ${Object.keys(
					adapters,
				).join(", ")}`,
			);
		}

		const instance = new AdapterClass();
		if (options) {
			instance.init(options);
		}
		return instance;
	}

	// Auto-detect environment
	if (
		typeof process !== "undefined" &&
		process.versions &&
		process.versions.node
	) {
		const instance = new NodeAdapter();
		if (options) {
			instance.init(options);
		}
		return instance;
	}

	const isWindowDefined = typeof window !== "undefined";
	const isDocumentDefined = typeof document !== "undefined";

	if (isWindowDefined && isDocumentDefined) {
		const instance = new BrowserAdapter();
		if (options) {
			instance.init(options);
		}
		return instance;
	}

	// Default to Node adapter
	const instance = new NodeAdapter();
	if (options) {
		instance.init(options);
	}
	return instance;
}

/**
 * Register a custom adapter
 */
export function registerAdapter(
	name: string,
	adapter: new () => EnvironmentAdapter,
): void {
	adapters[name] = adapter;
}
