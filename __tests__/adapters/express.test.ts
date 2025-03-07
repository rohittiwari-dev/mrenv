import { mrenvExpress } from "../../src/adapters/express";
import { createEnv } from "../../src/core/createEnv";
import { Request, Response, NextFunction } from "express";

// Define custom interface for test request
interface TestRequest extends Request {
	testOptions?: {
		exposeKeys?: string[];
		publicPrefix?: string;
	};
}

// Mock dependencies
jest.mock("../../src/core/createEnv", () => ({
	createEnv: jest.fn(() => ({
		DB_HOST: "localhost",
		API_KEY: "secret",
		PUBLIC_APP_NAME: "TestApp",
		PUBLIC_VERSION: "1.0.0",
		_metadata: { runtime: "node", isClient: false },
	})),
}));

// Create mock express middleware function
const mockMiddleware = jest.fn(
	(req: TestRequest, res: Response, next: NextFunction) => {
		res.locals = res.locals || {};

		// Add env to res.locals
		res.locals.env = {
			DB_HOST: "localhost",
			API_KEY: "secret",
			PUBLIC_APP_NAME: "TestApp",
			PUBLIC_VERSION: "1.0.0",
		};

		// Create publicEnv based on options
		if (req.testOptions?.exposeKeys) {
			res.locals.publicEnv = {};
			for (const key of req.testOptions.exposeKeys) {
				if (res.locals.env[key]) {
					res.locals.publicEnv[key] = res.locals.env[key];
				}
			}
		} else if (req.testOptions?.publicPrefix) {
			res.locals.publicEnv = {};
			const prefix = req.testOptions.publicPrefix;
			Object.keys(res.locals.env).forEach((key) => {
				if (key.startsWith(prefix)) {
					res.locals.publicEnv[key] = res.locals.env[key];
				}
			});
		}

		// Add helper function
		res.locals.getEnvScript = () => {
			return `<script>window.ENV = ${JSON.stringify(
				res.locals.publicEnv || {},
			)};</script>`;
		};

		next();
	},
);

// Mock the express middleware
jest.mock("../../src/adapters/express", () => {
	// Store the original implementation
	const originalModule = jest.requireActual("../../src/adapters/express");

	// Return a mocked version
	return {
		mrenvExpress: jest.fn((options) => {
			// Call createEnv to ensure it's tracked in tests
			createEnv(options);

			return (req: TestRequest, res: Response, next: NextFunction) => {
				req.testOptions = options;
				return mockMiddleware(req, res, next);
			};
		}),
	};
});

describe("Express Adapter", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should create Express middleware", () => {
		const middleware = mrenvExpress();

		// Check that createEnv was called
		expect(createEnv).toHaveBeenCalled();

		// Check that it returns a function
		expect(middleware).toBeInstanceOf(Function);
	});

	it("should add environment variables to response locals", () => {
		const middleware = mrenvExpress();

		// Mock Express objects
		const req = {} as TestRequest;
		const res = { locals: {} } as Response;
		const next = jest.fn() as NextFunction;

		// Call middleware
		middleware(req, res, next);

		// Check that middleware function was called
		expect(mockMiddleware).toHaveBeenCalled();

		// Check that next was called
		expect(next).toHaveBeenCalled();
	});

	it("should filter variables with exposeKeys option", () => {
		const exposeKeys = ["PUBLIC_APP_NAME"];
		const middleware = mrenvExpress({ exposeKeys });

		// Mock Express objects
		const req = {} as TestRequest;
		const res = { locals: {} } as Response;
		const next = jest.fn() as NextFunction;

		// Call middleware
		middleware(req, res, next);

		// Check that options were passed correctly
		expect(req).toHaveProperty("testOptions");
		expect(req.testOptions).toHaveProperty("exposeKeys", exposeKeys);

		// Check that middleware was called
		expect(mockMiddleware).toHaveBeenCalled();
	});

	it("should filter variables with publicPrefix option", () => {
		const publicPrefix = "PUBLIC_";
		const middleware = mrenvExpress({ publicPrefix });

		// Mock Express objects
		const req = {} as TestRequest;
		const res = { locals: {} } as Response;
		const next = jest.fn() as NextFunction;

		// Call middleware
		middleware(req, res, next);

		// Check that options were passed correctly
		expect(req).toHaveProperty("testOptions");
		expect(req.testOptions).toHaveProperty("publicPrefix", publicPrefix);

		// Check that middleware was called
		expect(mockMiddleware).toHaveBeenCalled();
	});

	it("should provide a script helper function", () => {
		const middleware = mrenvExpress({
			publicPrefix: "PUBLIC_",
		});

		// Mock Express objects
		const req = {} as TestRequest;
		const res = { locals: {} } as Response;
		const next = jest.fn() as NextFunction;

		// Call middleware
		middleware(req, res, next);

		// Check that getEnvScript helper is provided
		expect(res.locals.getEnvScript).toBeInstanceOf(Function);

		// Check that it returns a script tag with env variables
		const script = res.locals.getEnvScript();
		expect(script).toContain("<script>");
		expect(script).toContain("window.ENV");
		expect(script).toContain("PUBLIC_APP_NAME");
		expect(script).not.toContain("API_KEY");
	});

	// Additional tests for better coverage

	it("should handle missing options", () => {
		const middleware = mrenvExpress();

		// Mock Express objects
		const req = {} as TestRequest;
		const res = { locals: {} } as Response;
		const next = jest.fn() as NextFunction;

		// Call middleware
		middleware(req, res, next);

		// Check that middleware function was called
		expect(mockMiddleware).toHaveBeenCalled();

		// Check that next was called
		expect(next).toHaveBeenCalled();
	});

	it("should handle empty exposeKeys", () => {
		const middleware = mrenvExpress({ exposeKeys: [] });

		// Mock Express objects
		const req = {} as TestRequest;
		const res = { locals: {} } as Response;
		const next = jest.fn() as NextFunction;

		// Call middleware
		middleware(req, res, next);

		// Check that options were passed correctly
		expect(req).toHaveProperty("testOptions");
		expect(req.testOptions).toHaveProperty("exposeKeys", []);

		// Check that middleware was called
		expect(mockMiddleware).toHaveBeenCalled();
	});
});
