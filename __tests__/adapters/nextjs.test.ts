import { withMrenv } from "../../src/adapters/nextjs";
import { createEnv } from "../../src/core/createEnv";

// Mock dependencies
jest.mock("../../src/core/createEnv", () => ({
	createEnv: jest.fn(() => ({
		DB_HOST: "localhost",
		API_KEY: "secret",
		_metadata: { runtime: "node", isClient: false },
	})),
}));

describe("Next.js Adapter", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should create a Next.js config with mrenv", () => {
		const nextConfig = withMrenv({
			protectedEnv: ["API_KEY"],
		});

		// Check that createEnv was called with the correct options
		expect(createEnv).toHaveBeenCalledWith({
			protectedEnv: ["API_KEY"],
		});

		// Check that the config has the env property
		expect(nextConfig).toHaveProperty("env");
		expect(nextConfig.env).toHaveProperty("DB_HOST", "localhost");
		expect(nextConfig.env).toHaveProperty("API_KEY", "secret");
	});

	it("should merge with existing nextConfig", () => {
		const originalConfig = {
			reactStrictMode: true,
			env: {
				EXISTING_VAR: "value",
			},
			webpack: jest.fn((config) => config),
		};

		const nextConfig = withMrenv({
			nextConfig: originalConfig,
		});

		// Check that it preserves the original config
		expect(nextConfig.reactStrictMode).toBe(true);

		// Check that it merges env variables
		expect(nextConfig.env).toHaveProperty("EXISTING_VAR", "value");
		expect(nextConfig.env).toHaveProperty("DB_HOST", "localhost");

		// Test webpack configuration
		const mockConfig = { module: {} };
		const mockOptions = { isServer: true };
		nextConfig.webpack(mockConfig, mockOptions);

		// Check that the original webpack function was called
		expect(originalConfig.webpack).toHaveBeenCalledWith(
			mockConfig,
			mockOptions,
		);
	});

	it("should work without a nextConfig", () => {
		const nextConfig = withMrenv();

		// Should have env without error
		expect(nextConfig).toHaveProperty("env");
		expect(nextConfig.env).toHaveProperty("DB_HOST", "localhost");

		// Should have webpack function
		expect(nextConfig.webpack).toBeInstanceOf(Function);

		// Test webpack without original config
		const mockConfig = { module: {} };
		const result = nextConfig.webpack(mockConfig, {});
		expect(result).toBe(mockConfig);
	});
});
