import { createEnv } from "../../src/core/createEnv";
import * as envReader from "../../src/core/envReader";
import * as runtimeDetector from "../../src/core/runtimeDetector";
import * as schema from "../../src/core/schema";
import { z } from "zod";
import { EnvType } from "../../src/core/types";

// Mock dependencies
jest.mock("../../src/core/envReader");
jest.mock("../../src/core/runtimeDetector");
jest.mock("../../src/core/schema", () => ({
	__esModule: true,
	default: {
		validate: jest.fn(() => [
			true,
			[],
			{
				DB_HOST: "localhost",
				DB_PORT: 5432,
				API_KEY: "secret",
			},
		]),
	},
	inferSchema: jest.fn(),
}));

describe("createEnv", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Default mocks for all tests
		jest.spyOn(envReader.default, "readEnvFiles").mockReturnValue({
			DB_HOST: "localhost",
			DB_PORT: "5432",
			API_KEY: "secret",
		});

		// Use proper typing for mocks
		jest.spyOn(runtimeDetector.default, "detectRuntime").mockReturnValue(
			"node",
		);
		jest.spyOn(runtimeDetector.default, "isServer").mockReturnValue(true);
		jest.spyOn(runtimeDetector.default, "getGlobalObject").mockReturnValue({
			process: { env: {} },
		});
	});

	it("should create an environment object with validation", () => {
		// Set up the schema
		const envSchema = {
			DB_HOST: { type: "string" as EnvType, required: true },
			DB_PORT: { type: "number" as EnvType, required: true },
			API_KEY: { type: "string" as EnvType, required: true },
		};

		// Call createEnv
		const env = createEnv({
			publicPrefix: "PUBLIC_",
			schema: envSchema,
		});

		// Verify results
		expect(env).toHaveProperty("DB_HOST", "localhost");
		expect(env).toHaveProperty("DB_PORT", 5432);
		expect(env).toHaveProperty("API_KEY", "secret");
		expect(env).toHaveProperty("_metadata");
		expect(env._metadata).toHaveProperty("isClient", false);
		expect(env._metadata).toHaveProperty("runtime", "node");
	});

	it("should handle empty schemas", () => {
		// Call createEnv with empty schemas
		const env = createEnv({
			publicPrefix: "PUBLIC_",
		});

		// Should still have metadata
		expect(env).toHaveProperty("_metadata");
		expect(env._metadata).toHaveProperty("isClient", false);
		expect(env._metadata).toHaveProperty("runtime", "node");
	});

	it("should handle client environment", () => {
		// Make it a client environment
		jest.spyOn(runtimeDetector.default, "isServer").mockReturnValue(false);
		jest.spyOn(runtimeDetector.default, "detectRuntime").mockReturnValue(
			"browser",
		);

		// Mock client variables
		jest.spyOn(envReader.default, "readEnvFiles").mockReturnValue({
			PUBLIC_APP_NAME: "TestApp",
			PUBLIC_API_URL: "https://api.example.com",
			DB_HOST: "localhost", // This shouldn't be included in client env
		});

		// Call createEnv
		const env = createEnv({
			publicPrefix: "PUBLIC_",
			protectedEnv: ["DB_HOST"],
		});

		// Verify only client variables are present
		expect(env).toHaveProperty("PUBLIC_APP_NAME", "TestApp");
		expect(env).toHaveProperty("PUBLIC_API_URL", "https://api.example.com");
		expect(env).not.toHaveProperty("DB_HOST");
		expect(env._metadata).toHaveProperty("isClient", true);
		expect(env._metadata).toHaveProperty("runtime", "browser");
	});

	it("should use custom paths if provided", () => {
		// Call createEnv with custom paths
		createEnv({
			publicPrefix: "PUBLIC_",
			paths: [".env.custom"],
		});

		// Verify readEnvFiles was called with custom paths
		expect(envReader.default.readEnvFiles).toHaveBeenCalledWith(
			[".env.custom"],
			undefined,
			undefined,
		);
	});

	it("should use exclude patterns if provided", () => {
		// Call createEnv with exclude patterns
		createEnv({
			publicPrefix: "PUBLIC_",
			excludePatterns: [".env.test"],
		});

		// Verify readEnvFiles was called with exclude patterns
		expect(envReader.default.readEnvFiles).toHaveBeenCalledWith(
			undefined,
			[".env.test"],
			undefined,
		);
	});

	it("should enable autoReload if specified", () => {
		// Call createEnv with autoReload
		createEnv({
			publicPrefix: "PUBLIC_",
			autoReload: true,
		});

		// Verify readEnvFiles was called with autoReload
		expect(envReader.default.readEnvFiles).toHaveBeenCalledWith(
			undefined,
			undefined,
			true,
		);
	});

	it("should use schema validation", () => {
		// Create a custom validation implementation
		const customValidate = jest.fn(() => [
			true,
			[],
			{ DB_HOST: "localhost" },
		]);

		// Replace the mock
		(schema.default.validate as jest.Mock) = customValidate;

		// Set up the schema
		const envSchema = {
			DB_HOST: { type: "string" as EnvType, required: true },
		};

		// Call createEnv
		createEnv({
			publicPrefix: "PUBLIC_",
			schema: envSchema,
		});

		// Verify schema validation was called
		expect(customValidate).toHaveBeenCalled();
	});

	it("should handle Zod schema", () => {
		// Set up a Zod schema
		const zodSchema = z.object({
			DB_HOST: z.string(),
			DB_PORT: z.string().transform((val) => parseInt(val, 10)),
			API_KEY: z.string(),
		});

		// Call createEnv with Zod schema
		const env = createEnv({
			publicPrefix: "PUBLIC_",
			schema: zodSchema,
		});

		// Verify results
		expect(env).toHaveProperty("DB_HOST", "localhost");
		expect(env).toHaveProperty("DB_PORT", 5432);
		expect(env).toHaveProperty("API_KEY", "secret");
	});

	it("should throw error when validation fails", () => {
		// Make schema validation throw an error
		(schema.default.validate as jest.Mock).mockReturnValueOnce([
			false,
			["DB_HOST is required"],
			{},
		]);

		// Set up the schema
		const envSchema = {
			DB_HOST: { type: "string" as EnvType, required: true },
		};

		// Expect createEnv to throw
		expect(() => {
			createEnv({
				publicPrefix: "PUBLIC_",
				schema: envSchema,
			});
		}).toThrow("Environment validation failed");
	});

	it("should use custom error handler when validation fails", () => {
		// Make schema validation fail
		(schema.default.validate as jest.Mock).mockReturnValueOnce([
			false,
			["DB_HOST is required"],
			{},
		]);

		// Create a custom error handler
		const errorHandler = jest.fn();

		// Call createEnv with custom error handler
		createEnv({
			publicPrefix: "PUBLIC_",
			schema: { DB_HOST: { type: "string" as EnvType, required: true } },
			onValidationError: errorHandler,
		});

		// Verify error handler was called
		expect(errorHandler).toHaveBeenCalled();
	});
});
