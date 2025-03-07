import * as fs from "fs";
import * as path from "path";
import { EnvPattern } from "./types";

/**
 * Default environment file patterns in order of priority
 */
export const defaultPatterns: EnvPattern[] = [
	{ pattern: ".env.local", priority: 1 },
	{ pattern: ".env.development.local", priority: 2 },
	{ pattern: ".env.test.local", priority: 3 },
	{ pattern: ".env.production.local", priority: 4 },
	{ pattern: ".env.development", priority: 5 },
	{ pattern: ".env.test", priority: 6 },
	{ pattern: ".env.production", priority: 7 },
	{ pattern: ".env", priority: 8 },
];

/**
 * Reads and parses environment variables from .env files
 */
export class EnvReader {
	private envCache: Record<string, Record<string, string>> = {};
	private watchers: fs.FSWatcher[] = [];

	/**
	 * Read environment variables from files using specified patterns
	 * @param customPaths Custom paths to .env files
	 * @param excludePatterns Patterns to exclude
	 * @param autoReload Whether to reload on file changes
	 * @returns Object with environment variables
	 */
	public readEnvFiles(
		customPaths?: string[],
		excludePatterns?: string[],
		autoReload = false,
	): Record<string, string> {
		const envFiles = this.getEnvFiles(customPaths, excludePatterns);
		const env: Record<string, string> = {};

		for (const file of envFiles) {
			try {
				const filePath = path.resolve(process.cwd(), file);

				if (!fs.existsSync(filePath)) {
					continue;
				}

				if (!this.envCache[filePath] || autoReload) {
					const content = fs.readFileSync(filePath, "utf8");
					this.envCache[filePath] = this.parseEnvFile(content);

					// Setup file watcher for auto reload
					if (autoReload) {
						this.setupWatcher(filePath);
					}
				}

				// Merge env variables, with later files overriding earlier ones
				Object.assign(env, this.envCache[filePath]);
			} catch (error) {
				console.error(`Error reading env file ${file}:`, error);
			}
		}

		return env;
	}

	/**
	 * Parse .env file content into key-value pairs
	 * @param content File content
	 * @returns Object with parsed variables
	 */
	private parseEnvFile(content: string): Record<string, string> {
		const env: Record<string, string> = {};
		const lines = content.split("\n");

		for (const line of lines) {
			const trimmedLine = line.trim();

			// Skip empty lines and comments
			if (!trimmedLine || trimmedLine.startsWith("#")) {
				continue;
			}

			// Find the first = character (ignoring = in quoted values)
			const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);

			if (keyValueMatch) {
				const key = keyValueMatch[1].trim();
				let value = keyValueMatch[2].trim();

				// Remove quotes if present
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.substring(1, value.length - 1);
				}

				// Handle variable expansions ${VAR}
				value = value.replace(/\${([^}]+)}/g, (match, varName) => {
					return env[varName] || process.env[varName] || "";
				});

				env[key] = value;
			}
		}

		return env;
	}

	/**
	 * Get a list of env files based on patterns
	 * @param customPaths Custom paths to .env files
	 * @param excludePatterns Patterns to exclude
	 * @returns Array of file paths
	 */
	private getEnvFiles(
		customPaths?: string[],
		excludePatterns?: string[],
	): string[] {
		if (customPaths && customPaths.length > 0) {
			return customPaths;
		}

		const patterns = [...defaultPatterns]
			.sort((a, b) => a.priority - b.priority)
			.map((p) => p.pattern);

		if (excludePatterns) {
			return patterns.filter(
				(pattern) => !excludePatterns.includes(pattern),
			);
		}

		return patterns;
	}

	/**
	 * Setup a file watcher for auto reload
	 * @param filePath Path to the .env file
	 */
	private setupWatcher(filePath: string): void {
		// Close any existing watcher for this file
		this.closeWatcher(filePath);

		const watcher = fs.watch(filePath, (eventType) => {
			if (eventType === "change") {
				try {
					const content = fs.readFileSync(filePath, "utf8");
					this.envCache[filePath] = this.parseEnvFile(content);
					this.notifyChange(filePath);
				} catch (error) {
					console.error(
						`Error reloading env file ${filePath}:`,
						error,
					);
				}
			}
		});

		this.watchers.push(watcher);
	}

	/**
	 * Close watcher for a specific file
	 * @param filePath Path to the file
	 */
	private closeWatcher(filePath: string): void {
		const index = this.watchers.findIndex(
			(w) => (w as any).path === filePath,
		);
		if (index !== -1) {
			this.watchers[index].close();
			this.watchers.splice(index, 1);
		}
	}

	/**
	 * Close all file watchers
	 */
	public closeAllWatchers(): void {
		for (const watcher of this.watchers) {
			watcher.close();
		}
		this.watchers = [];
	}

	/**
	 * Notify that a file has changed
	 * @param filePath Path to the changed file
	 */
	private notifyChange(filePath: string): void {
		// This will be extended later to trigger reloads
		console.log(`Env file changed: ${filePath}`);
	}
}

export default new EnvReader();
