module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/__tests__/**/*.test.ts"],
	collectCoverage: true,
	collectCoverageFrom: ["src/**/*.ts"],
	coverageReporters: ["text", "lcov"],
	coverageThreshold: {
		global: {
			branches: 10,
			functions: 10,
			lines: 10,
			statements: 10,
		},
	},
	moduleFileExtensions: ["ts", "js", "json"],
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.json",
			},
		],
	},
	testPathIgnorePatterns: [
		"/node_modules/",
		"__tests__/core/envReader.test.ts",
		"__tests__/core/createEnv.test.ts",
		"__tests__/adapters/vite.test.ts",
		"__tests__/cli/generator.test.ts",
	],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
