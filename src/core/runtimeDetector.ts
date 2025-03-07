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

		// Check for Edge runtime (workers)
		if (
			typeof self !== "undefined" &&
			typeof self.addEventListener !== "undefined" &&
			typeof document === "undefined"
		) {
			return "edge";
		}

		// Default to node as fallback
		return "node";
	}

	/**
	 * Checks if the current environment is server-side
	 * @param runtime Current runtime
	 * @returns True if server-side
	 */
	public isServer(runtime: Runtime): boolean {
		return ["node", "deno", "bun", "edge"].includes(runtime);
	}

	/**
	 * Get the global object for the current runtime
	 * @param runtime Current runtime
	 * @returns Global object
	 */
	public getGlobalObject(runtime: Runtime): any {
		switch (runtime) {
			case "node":
			case "bun":
				return global;
			case "deno":
				return (globalThis as any).Deno ? globalThis : global;
			case "browser":
				return window;
			case "edge":
				return self;
			default:
				return globalThis;
		}
	}
}

export default new RuntimeDetector();
