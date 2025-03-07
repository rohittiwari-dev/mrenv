import { Runtime } from "./types";

/**
 * Detects the current runtime environment
 */
export class RuntimeDetector {
	/**
	 * Detect the current runtime environment
	 * @returns Detected runtime
	 */
	public detectRuntime(): Runtime {
		// Check for Deno
		if (typeof Deno !== "undefined") {
			return "deno";
		}

		// Check for Bun
		if (
			typeof process !== "undefined" &&
			typeof process.versions !== "undefined" &&
			process.versions.bun
		) {
			return "bun";
		}

		// Check for Node.js
		if (
			typeof process !== "undefined" &&
			typeof process.versions !== "undefined" &&
			process.versions.node
		) {
			return "node";
		}

		// Check for browser
		if (typeof window !== "undefined" && typeof document !== "undefined") {
			return "browser";
		}

		// Check for edge runtimes
		if (
			typeof self !== "undefined" &&
			typeof self.addEventListener === "function" &&
			typeof window === "undefined"
		) {
			return "edge";
		}

		// Default to node if we can't detect
		return "node";
	}

	/**
	 * Check if the runtime is server-side
	 * @param runtime Runtime to check
	 * @returns True if server-side
	 */
	public isServer(runtime: Runtime): boolean {
		return (
			runtime !== "browser" && runtime !== "auto" // Auto isn't a runtime, should never be passed here
		);
	}

	/**
	 * Get the global object for the given runtime
	 * @param runtime Runtime
	 * @returns Global object for runtime
	 */
	public getGlobalObject(runtime: Runtime): any {
		switch (runtime) {
			case "node":
			case "bun":
				return typeof global !== "undefined" ? global : {};
			case "browser":
				return typeof window !== "undefined" ? window : {};
			case "deno":
				return typeof Deno !== "undefined"
					? { process: { env: {} } }
					: {};
			case "edge":
				return typeof self !== "undefined" ? self : {};
			default:
				return {};
		}
	}
}

export default new RuntimeDetector();
