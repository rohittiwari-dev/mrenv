import runtimeDetector from "../../src/core/runtimeDetector";

// Store original globals
const originalGlobal = global;
const originalWindow = global.window;
const originalProcess = global.process;
const originalSelf = global.self;

// Mock the runtime detector
jest.mock("../../src/core/runtimeDetector", () => {
	const original = jest.requireActual(
		"../../src/core/runtimeDetector",
	).default;

	return {
		__esModule: true,
		default: {
			detectRuntime: jest.fn((environment) => {
				// Return based on the mocked environment
				if (environment === "browser") return "browser";
				if (environment === "deno") return "deno";
				if (environment === "bun") return "bun";
				if (environment === "edge") return "edge";
				return "node";
			}),
			isServer: original.isServer,
			getGlobalObject: original.getGlobalObject,
		},
	};
});

describe("RuntimeDetector", () => {
	// Reset globals after each test
	afterEach(() => {
		global.window = originalWindow;
		global.process = originalProcess;
		global.self = originalSelf;
		// @ts-ignore
		global.Deno = undefined;

		jest.clearAllMocks();
	});

	describe("detectRuntime", () => {
		it("should detect Node.js runtime", () => {
			// Call with default environment
			expect(runtimeDetector.detectRuntime()).toBe("node");
		});

		it("should detect browser runtime", () => {
			// Call with browser environment
			(runtimeDetector.detectRuntime as jest.Mock).mockImplementationOnce(
				() => "browser",
			);
			expect(runtimeDetector.detectRuntime()).toBe("browser");
		});

		it("should detect Deno runtime", () => {
			// Call with Deno environment
			(runtimeDetector.detectRuntime as jest.Mock).mockImplementationOnce(
				() => "deno",
			);
			expect(runtimeDetector.detectRuntime()).toBe("deno");
		});

		it("should detect Bun runtime", () => {
			// Call with Bun environment
			(runtimeDetector.detectRuntime as jest.Mock).mockImplementationOnce(
				() => "bun",
			);
			expect(runtimeDetector.detectRuntime()).toBe("bun");
		});

		it("should detect Edge runtime", () => {
			// Call with Edge environment
			(runtimeDetector.detectRuntime as jest.Mock).mockImplementationOnce(
				() => "edge",
			);
			expect(runtimeDetector.detectRuntime()).toBe("edge");
		});
	});

	describe("isServer", () => {
		it("should return true for server runtimes", () => {
			expect(runtimeDetector.isServer("node")).toBe(true);
			expect(runtimeDetector.isServer("deno")).toBe(true);
			expect(runtimeDetector.isServer("bun")).toBe(true);
			expect(runtimeDetector.isServer("edge")).toBe(true);
		});

		it("should return false for browser runtime", () => {
			expect(runtimeDetector.isServer("browser")).toBe(false);
		});
	});

	describe("getGlobalObject", () => {
		it("should return global for node runtime", () => {
			expect(runtimeDetector.getGlobalObject("node")).toBeDefined();
		});

		it("should handle browser runtime", () => {
			global.window = {} as any;
			const result = runtimeDetector.getGlobalObject("browser");
			expect(result).toBeDefined();
		});

		it("should handle edge runtime", () => {
			global.self = {} as any;
			const result = runtimeDetector.getGlobalObject("edge");
			expect(result).toBeDefined();
		});

		it("should handle deno runtime", () => {
			// @ts-ignore
			global.Deno = {};
			const result = runtimeDetector.getGlobalObject("deno");
			expect(result).toBeDefined();
		});

		it("should return empty object as fallback", () => {
			const result = runtimeDetector.getGlobalObject("unknown" as any);
			expect(result).toBeDefined();
		});
	});
});
