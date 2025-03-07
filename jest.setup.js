// Setup global Jest environment
process.env.NODE_ENV = "test";

// Setup mock for environment variables
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.PUBLIC_APP_NAME = "TestApp";

// Mock file system
jest.mock("fs", () => ({
	...jest.requireActual("fs"),
	readFileSync: jest.fn(),
	writeFileSync: jest.fn(),
	existsSync: jest.fn().mockReturnValue(true),
	mkdirSync: jest.fn(),
	watch: jest.fn().mockReturnValue({
		close: jest.fn(),
	}),
}));

// Create test .env file content
const mockEnvContent = `
DB_HOST=localhost
DB_PORT=5432
PUBLIC_APP_NAME=TestApp
`;

// Setup fs mock implementation
const fs = require("fs");
fs.readFileSync.mockImplementation((path, options) => {
	if (path.toString().includes(".env")) {
		return mockEnvContent;
	}
	throw new Error(`Unexpected file read: ${path}`);
});
