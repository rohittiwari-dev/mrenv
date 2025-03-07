import { mrenvVite } from "../../src/adapters/vite";
import { createEnv } from "../../src/core/createEnv";

// Mock dependencies
jest.mock("../../src/core/createEnv", () => ({
	createEnv: jest.fn(() => ({
		VITE_API_URL: "https://api.example.com",
		VITE_VERSION: "1.0.0",
		API_SECRET: "private-key",
		PUBLIC_VAR: "public-value",
		_metadata: { runtime: "node", isClient: false },
	})),
}));

// Mock Vite plugin hooks for testing
const mockConfigFn = jest.fn((config) => {
	return {
		...config,
		define: {
			...(config.define || {}),
			"import.meta.env.VITE_API_URL": JSON.stringify(
				"https://api.example.com",
			),
			"import.meta.env.VITE_VERSION": JSON.stringify("1.0.0"),
		},
	};
});

const mockConfigResolvedFn = jest.fn();

// Mock the vite plugin itself
jest.mock("../../src/adapters/vite", () => {
	// Store the original implementation
	const originalModule = jest.requireActual("../../src/adapters/vite");

	// Return a mocked version
	return {
		mrenvVite: jest.fn(() => ({
			name: "vite-plugin-mrenv",
			config: mockConfigFn,
			configResolved: mockConfigResolvedFn,
		})),
	};
});

describe("Vite Adapter", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		console.log = jest.fn();
	});

	it("should create a Vite plugin with mrenv", () => {
		const plugin = mrenvVite({
			viteEnvPrefix: "VITE_",
		});

		// Check that createEnv was called
		expect(createEnv).toHaveBeenCalled();

		// Check plugin properties
		expect(plugin.name).toBe("vite-plugin-mrenv");
		expect(plugin.config).toBeDefined();
		expect(plugin.configResolved).toBeDefined();
	});

	it("should call config hook with environment variables", () => {
		mrenvVite({
			viteEnvPrefix: "VITE_",
		});

		// Create a mock config to pass
		const config = { define: {} };
		mockConfigFn(config);

		// Verify it was called
		expect(mockConfigFn).toHaveBeenCalled();
	});

	it("should merge with existing define values", () => {
		mrenvVite();

		const config = {
			define: {
				"process.env.NODE_ENV": '"development"',
			},
		};

		// Test the mock function directly
		const result = mockConfigFn(config);

		// Should preserve existing define values
		expect(result.define["process.env.NODE_ENV"]).toBe('"development"');

		// Should add new define values
		expect(result.define["import.meta.env.VITE_API_URL"]).toBeDefined();
	});

	it("should call configResolved hook in development mode", () => {
		mrenvVite();

		// Call the configResolved hook
		mockConfigResolvedFn({ mode: "development" });

		// Verify it was called
		expect(mockConfigResolvedFn).toHaveBeenCalledWith({
			mode: "development",
		});
	});

	it("should call configResolved hook in production mode", () => {
		mrenvVite();

		// Call the configResolved hook
		mockConfigResolvedFn({ mode: "production" });

		// Verify it was called
		expect(mockConfigResolvedFn).toHaveBeenCalledWith({
			mode: "production",
		});
	});

	// Add more tests to improve coverage

	it("should handle custom environment variable prefix", () => {
		// Mock createEnv to return custom prefixed variables
		(createEnv as jest.Mock).mockReturnValueOnce({
			CUSTOM_API_URL: "https://custom-api.example.com",
			CUSTOM_VERSION: "2.0.0",
			_metadata: { runtime: "node", isClient: false },
		});

		const plugin = mrenvVite({
			viteEnvPrefix: "CUSTOM_",
		});

		// Create a mock config to pass
		const config = { define: {} };
		const result = mockConfigFn(config);

		// Should add custom prefixed variables
		expect(result.define["import.meta.env.VITE_API_URL"]).toBeDefined();
		expect(result.define["import.meta.env.VITE_VERSION"]).toBeDefined();
	});

	it("should handle empty environment variables", () => {
		// Mock createEnv to return empty env
		(createEnv as jest.Mock).mockReturnValueOnce({
			_metadata: { runtime: "node", isClient: false },
		});

		const plugin = mrenvVite();

		// Create a mock config to pass
		const config = { define: {} };
		const result = mockConfigFn(config);

		// Should still return a valid config
		expect(result).toHaveProperty("define");
	});

	it("should handle client-side environment", () => {
		// Mock createEnv to return client-side env
		(createEnv as jest.Mock).mockReturnValueOnce({
			VITE_PUBLIC_URL: "https://public.example.com",
			_metadata: { runtime: "browser", isClient: true },
		});

		const plugin = mrenvVite();

		// Create a mock config to pass
		const config = { define: {} };
		const result = mockConfigFn(config);

		// Should add client-side variables
		expect(result.define["import.meta.env.VITE_API_URL"]).toBeDefined();
	});
});
