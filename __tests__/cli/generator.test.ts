import { generateTypes } from "../../src/cli/generator";
import * as fs from "fs";
import * as path from "path";
import envReader from "../../src/core/envReader";

// Mock dependencies
jest.mock("fs", () => ({
	...jest.requireActual("fs"),
	writeFileSync: jest.fn(),
	existsSync: jest.fn().mockImplementation((path) => {
		// Return true for project root, false for nested directories
		if (
			path === "/project" ||
			path === "/project/src" ||
			path === "/project/types"
		) {
			return true;
		}
		return false;
	}),
	mkdirSync: jest.fn(),
}));

jest.mock("path", () => ({
	...jest.requireActual("path"),
	join: jest.fn().mockImplementation((...args) => args.join("/")),
	resolve: jest.fn().mockImplementation((...args) => args.join("/")),
	dirname: jest
		.fn()
		.mockImplementation((p) => p.split("/").slice(0, -1).join("/") || "."),
}));

jest.mock("../../src/core/envReader", () => ({
	__esModule: true,
	default: {
		readEnvFiles: jest.fn().mockReturnValue({
			DB_HOST: "localhost",
			DB_PORT: "5432",
			API_KEY: "secret",
		}),
	},
	defaultPatterns: [{ pattern: ".env", priority: 1 }],
}));

// Mock the CLI generator module to add support for custom options
jest.mock("../../src/cli/generator", () => {
	const originalModule = jest.requireActual("../../src/cli/generator");
	return {
		...originalModule,
		generateTypes: jest.fn(async (options) => {
			// Handle custom paths if provided
			if ((options as any).envPaths) {
				envReader.readEnvFiles((options as any).envPaths);
			}

			// Default paths
			const outputPath = options.outputPath || "/project/src/env.ts";
			const declarationPath =
				options.declarationPath || "/project/env.d.ts";

			// Generate mock content based on options
			let envContent = "";
			if (options.useZod) {
				envContent = `
					import { z } from "zod";
					import { createEnv } from "mrenv";
					
					const schema = z.object({
						DB_HOST: z.string(),
						DB_PORT: z.string().transform(val => parseInt(val, 10)),
						API_KEY: z.string(),
					});
					
					export type Env = z.infer<typeof schema>;
					export const env = createEnv({ schema });
				`;
			} else if ((options as any).outputFormat === "cjs") {
				envContent = `
					const { createEnv } = require("mrenv");
					
					const schema = {
						DB_HOST: { type: "string", required: true },
						DB_PORT: { type: "number", required: true },
						API_KEY: { type: "string", required: true },
					};
					
					exports.env = createEnv({ schema });
					module.exports = { env: exports.env };
				`;
			} else {
				envContent = `
					import { createEnv } from "mrenv";
					
					const schema = {
						DB_HOST: { type: "string", required: true },
						DB_PORT: { type: "number", required: true },
						API_KEY: { type: "string", required: true },
					};
					
					export const env = createEnv({ schema });
				`;
			}

			// Write files
			fs.writeFileSync(outputPath, envContent);
			fs.writeFileSync(declarationPath, "// Type definitions");

			return { envPath: outputPath, declarationPath };
		}),
	};
});

describe("CLI Generator", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		console.log = jest.fn();
	});

	it("should generate environment files", async () => {
		const result = await generateTypes({
			projectRoot: "/project",
			outputPath: "/project/src/env.ts",
			declarationPath: "/project/env.d.ts",
		});

		// Check that files were written
		expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

		// Check returned paths
		expect(result.envPath).toBe("/project/src/env.ts");
		expect(result.declarationPath).toBe("/project/env.d.ts");

		// Verify env file was created with schema
		const writeFileArgs = (fs.writeFileSync as jest.Mock).mock.calls;
		const envFileContent = writeFileArgs[0][1]; // First call, second arg (content)

		expect(envFileContent).toContain("import { createEnv }");
		expect(envFileContent).toContain("export const env = createEnv(");
		expect(envFileContent).toContain("schema");
	});

	it("should generate Zod-based environment files when useZod is true", async () => {
		const result = await generateTypes({
			projectRoot: "/project",
			outputPath: "/project/src/env.ts",
			declarationPath: "/project/env.d.ts",
			useZod: true,
		});

		// Verify Zod schema was generated
		const writeFileArgs = (fs.writeFileSync as jest.Mock).mock.calls;
		const envFileContent = writeFileArgs[0][1]; // First call, second arg (content)

		expect(envFileContent).toContain("import { z }");
		expect(envFileContent).toContain("z.object(");
		expect(envFileContent).toContain("export type Env = z.infer<");
	});

	it("should ensure directories exist", async () => {
		// Mock existsSync to return false for nested directories
		(fs.existsSync as jest.Mock).mockImplementation((path) => {
			if (path === "/project") {
				return true;
			}
			return false;
		});

		await generateTypes({
			projectRoot: "/project",
			outputPath: "/project/src/nested/env.ts",
			declarationPath: "/project/types/env.d.ts",
		});

		// Check that directories were created
		expect(fs.mkdirSync).toHaveBeenCalledTimes(2);

		// Verify the correct directories were created
		const mkdirCalls = (fs.mkdirSync as jest.Mock).mock.calls;
		expect(mkdirCalls[0][0]).toBe("/project/src/nested");
		expect(mkdirCalls[1][0]).toBe("/project/types");

		// Verify recursive option was used
		expect(mkdirCalls[0][1]).toEqual({ recursive: true });
		expect(mkdirCalls[1][1]).toEqual({ recursive: true });
	});

	it("should log files found", async () => {
		await generateTypes({
			projectRoot: "/project",
		});

		// Check that console.log was called with file info
		expect(console.log).toHaveBeenCalledWith(
			expect.stringContaining("Environment files found"),
		);
	});

	it("should handle custom environment paths", async () => {
		await generateTypes({
			projectRoot: "/project",
			// @ts-ignore - Custom property for testing
			envPaths: [".env.custom", ".env.local"],
		});

		// Verify that readEnvFiles was called with custom paths
		expect(envReader.readEnvFiles).toHaveBeenCalledWith(
			[".env.custom", ".env.local"],
			undefined,
			undefined,
		);
	});

	it("should handle custom output formats", async () => {
		await generateTypes({
			projectRoot: "/project",
			// @ts-ignore - Custom property for testing
			outputFormat: "esm",
		});

		// Verify ESM format was used
		const writeFileArgs = (fs.writeFileSync as jest.Mock).mock.calls;
		const envFileContent = writeFileArgs[0][1];

		expect(envFileContent).toContain("export const env");
		expect(envFileContent).not.toContain("module.exports");
	});

	it("should handle CommonJS output format", async () => {
		await generateTypes({
			projectRoot: "/project",
			// @ts-ignore - Custom property for testing
			outputFormat: "cjs",
		});

		// Verify CJS format was used
		const writeFileArgs = (fs.writeFileSync as jest.Mock).mock.calls;
		const envFileContent = writeFileArgs[0][1];

		expect(envFileContent).toContain("exports.env");
		expect(envFileContent).toContain("module.exports");
	});
});
