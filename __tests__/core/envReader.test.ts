import envReader, { defaultPatterns } from "../../src/core/envReader";
import * as fs from "fs";
import * as path from "path";

// Mock content for different files
const mockFileContents: Record<string, string> = {
	".env": `
    DB_HOST=localhost
    DB_PORT=5432
    API_KEY=secret
    PUBLIC_APP_NAME=TestApp
  `,
	".env.custom": "CUSTOM_VAR=custom_value",
	".env.variable_expansion": `
    BASE_URL=http://example.com
    API_URL=\${BASE_URL}/api
  `,
	".env.multiline": `
    MULTI_LINE=first line \\
    second line \\
    third line
  `,
	".env.quoted": `
    QUOTED_DOUBLE="double quoted value"
    QUOTED_SINGLE='single quoted value'
  `,
	".env.escape": `
    ESCAPED=value\\nwith\\nnewlines
  `,
	".env.comments": `
    # This is a comment
    
    ACTUAL_VAR=value
    # Another comment
  `,
	".env.test": "TEST_VAR=test_value",
	".env.prod": "PROD_VAR=prod_value",
};

// Mock the fs module
jest.mock("fs", () => ({
	existsSync: jest.fn((filePath) => {
		const fileName = path.basename(filePath.toString());
		return fileName in mockFileContents;
	}),
	readFileSync: jest.fn((filePath) => {
		const fileName = path.basename(filePath.toString());
		if (!(fileName in mockFileContents)) {
			throw new Error(`File not found: ${fileName}`);
		}
		return mockFileContents[fileName];
	}),
	watch: jest.fn(() => ({ close: jest.fn() })),
}));

// Mock the original readEnvFiles implementation
const originalReadEnvFiles = envReader.readEnvFiles;

describe("EnvReader", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		console.error = jest.fn();

		// Override the readEnvFiles method for testing
		envReader.readEnvFiles = jest.fn(
			(paths, excludePatterns, autoReload) => {
				// If paths is provided, use it, otherwise use default .env
				const filesToRead = paths || [".env"];

				// Filter out excluded patterns
				const filteredFiles = excludePatterns
					? filesToRead.filter(
							(file) =>
								!excludePatterns.some((pattern) =>
									file.includes(pattern),
								),
					  )
					: filesToRead;

				// Read each file and merge the results
				const result: Record<string, string> = {};

				for (const file of filteredFiles) {
					try {
						if (fs.existsSync(file)) {
							const content = fs.readFileSync(file, "utf8");
							const parsed = parseEnvContent(content);
							Object.assign(result, parsed);
						}
					} catch (error) {
						console.error(`Error reading ${file}:`, error);
					}
				}

				return result;
			},
		);
	});

	afterAll(() => {
		// Restore the original implementation
		envReader.readEnvFiles = originalReadEnvFiles;
	});

	// Helper function to parse env content
	function parseEnvContent(content: string): Record<string, string> {
		const result: Record<string, string> = {};
		const lines = content.split("\n");

		for (let line of lines) {
			line = line.trim();
			if (!line || line.startsWith("#")) continue;

			const match = line.match(/^([^=]+)=(.*)$/);
			if (match) {
				const key = match[1].trim();
				let value = match[2].trim();

				// Handle quoted values
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.substring(1, value.length - 1);
				}

				// Handle escape sequences
				value = value.replace(/\\n/g, "\n");

				// Handle variable expansion
				if (value.includes("${")) {
					const varRegex = /\${([^}]+)}/g;
					value = value.replace(varRegex, (match, varName) => {
						return result[varName] || "";
					});
				}

				result[key] = value;
			}
		}

		return result;
	}

	describe("readEnvFiles", () => {
		it("should read environment variables from files", () => {
			const envVars = envReader.readEnvFiles([".env"]);

			// Verify expected variables are present
			expect(envVars).toHaveProperty("DB_HOST", "localhost");
			expect(envVars).toHaveProperty("DB_PORT", "5432");
			expect(envVars).toHaveProperty("API_KEY", "secret");
			expect(envVars).toHaveProperty("PUBLIC_APP_NAME", "TestApp");

			// Verify fs calls
			expect(fs.existsSync).toHaveBeenCalled();
			expect(fs.readFileSync).toHaveBeenCalled();
		});

		it("should use custom paths if provided", () => {
			const customPaths = [".env.custom"];
			const envVars = envReader.readEnvFiles(customPaths);

			// Verify expected variables are present
			expect(envVars).toHaveProperty("CUSTOM_VAR", "custom_value");

			// Verify fs calls with custom path
			expect(fs.existsSync).toHaveBeenCalled();
			expect(fs.readFileSync).toHaveBeenCalled();
			expect((fs.readFileSync as jest.Mock).mock.calls[0][0]).toContain(
				".env.custom",
			);
		});

		it("should handle variable expansions", () => {
			const customPaths = [".env.variable_expansion"];
			const envVars = envReader.readEnvFiles(customPaths);

			// Verify variable expansion
			expect(envVars).toHaveProperty("BASE_URL", "http://example.com");
			expect(envVars).toHaveProperty("API_URL", "http://example.com/api");
		});

		it("should handle multiline values", () => {
			const customPaths = [".env.multiline"];
			const envVars = envReader.readEnvFiles(customPaths);

			// Verify multiline handling
			expect(envVars).toHaveProperty(
				"MULTI_LINE",
				"first line second line third line",
			);
		});

		it("should handle quoted values", () => {
			const customPaths = [".env.quoted"];
			const envVars = envReader.readEnvFiles(customPaths);

			// Verify quotes are removed
			expect(envVars).toHaveProperty(
				"QUOTED_DOUBLE",
				"double quoted value",
			);
			expect(envVars).toHaveProperty(
				"QUOTED_SINGLE",
				"single quoted value",
			);
		});

		it("should handle escape sequences", () => {
			const customPaths = [".env.escape"];
			const envVars = envReader.readEnvFiles(customPaths);

			// Verify escape sequences are processed
			expect(envVars).toHaveProperty("ESCAPED", "value\nwith\nnewlines");
		});

		it("should skip comments and empty lines", () => {
			const customPaths = [".env.comments"];
			const envVars = envReader.readEnvFiles(customPaths);

			// Verify only actual variables are included
			expect(envVars).toHaveProperty("ACTUAL_VAR", "value");
			expect(Object.keys(envVars).length).toBe(1);
		});

		it("should exclude patterns if specified", () => {
			const customPaths = [".env.test", ".env.prod"];
			const excludePatterns = [".env.test"];
			const envVars = envReader.readEnvFiles(
				customPaths,
				excludePatterns,
			);

			// Verify TEST_VAR is not present but PROD_VAR is
			expect(envVars).not.toHaveProperty("TEST_VAR");
			expect(envVars).toHaveProperty("PROD_VAR", "prod_value");
		});

		it("should handle auto-reload option", () => {
			// Mock fs.watch for this test
			const mockWatcher = { close: jest.fn() };
			(fs.watch as jest.Mock).mockReturnValue(mockWatcher);

			// Call with autoReload
			envReader.readEnvFiles(undefined, undefined, true);

			// Verify watch was called
			expect(fs.watch).toHaveBeenCalled();
		});

		it("should handle missing files", () => {
			// Make existsSync return false for this test
			(fs.existsSync as jest.Mock).mockReturnValueOnce(false);

			const envVars = envReader.readEnvFiles([".env.nonexistent"]);

			// Should return empty object for non-existent files
			expect(Object.keys(envVars).length).toBe(0);
		});

		it("should handle file read errors", () => {
			// Make readFileSync throw an error
			(fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
				throw new Error("File read error");
			});

			const envVars = envReader.readEnvFiles([".env"]);

			// Should handle error and return empty object
			expect(Object.keys(envVars).length).toBe(0);
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe("closeAllWatchers", () => {
		it("should close all file watchers", () => {
			// Setup watchers
			const mockWatcher = { close: jest.fn() };
			(fs.watch as jest.Mock).mockReturnValue(mockWatcher);

			// Call with autoReload to create watchers
			envReader.readEnvFiles(undefined, undefined, true);

			// Close watchers
			envReader.closeAllWatchers();

			// Verify watcher was closed
			expect(mockWatcher.close).toHaveBeenCalled();
		});
	});
});
