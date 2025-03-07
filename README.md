# Mr. env

Advanced environment variable manager with type safety, validation, and runtime security features.

## Features

-   🔒 **Security**: Separate client and server environment variables
-   📘 **Type Safety**: Automatic TypeScript type generation
-   ✅ **Validation**: Schema-based validation with custom error handling
-   🔍 **Pattern Support**: Read from multiple `.env.*` files with custom patterns
-   🚀 **Framework Adapters**: Integrate with Next.js, Vite, Express, Remix, and more
-   🤖 **CLI Tools**: Generate type definitions and environment files
-   🔄 **Auto Reload**: Automatically reload variables on file changes
-   🌐 **Runtime Detection**: Works across Node.js, browsers, Deno, Bun, and Edge runtimes

## Installation

```bash
npm install mrenv
# or
yarn add mrenv
# or
pnpm add mrenv
```

## Quick Start

### Basic Usage

Create a `.env` file in your project root:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASS=secret
PUBLIC_API_URL=https://api.example.com
```

Then in your code:

```typescript
import { createEnv } from "mrenv";

// Basic usage - automatically reads .env files
const env = createEnv();

// Access environment variables
console.log(env.DB_HOST); // "localhost"
console.log(env.DB_PORT); // "5432"
```

### With Schema Validation

```typescript
import { createEnv } from "mrenv";

// Define a schema for validation
const env = createEnv({
	schema: {
		DB_HOST: { type: "string", required: true },
		DB_PORT: { type: "number", required: true },
		DB_USER: { type: "string", required: true },
		DB_PASS: { type: "string", required: true },
		NODE_ENV: {
			type: "string",
			default: "development",
			validate: (value) =>
				["development", "production", "test"].includes(value),
		},
	},
	onValidationError: (error) => {
		console.error("Environment validation failed:", error.message);
		process.exit(1);
	},
});

// TypeScript will infer all the correct types
const port = env.DB_PORT; // number
const host = env.DB_HOST; // string
```

### Client/Server Security

```typescript
import { createEnv } from "mrenv";

// Define which variables should be protected (server-side only)
const env = createEnv({
	protectedEnv: ["DB_HOST", "DB_USER", "DB_PASS", "API_SECRET"],
	publicPrefix: "PUBLIC_", // Variables with this prefix are accessible on client
});

// These variables are only available on the server
console.log(env.DB_HOST);
console.log(env.API_SECRET);

// These variables with the prefix are available everywhere
console.log(env.PUBLIC_API_URL);
```

## CLI Usage

Mrenv includes a CLI to generate type definitions for your environment variables.

Add a script to your package.json:

```json
{
	"scripts": {
		"generate-env": "mrenv generate"
	}
}
```

Then run:

```bash
npm run generate-env
```

This will:

1. Scan your .env files
2. Generate a `env.d.ts` file with TypeScript definitions
3. Create an `env.ts` module with validation logic

Options:

```bash
mrenv generate --output-path ./src/config --schema-path ./src/schema.ts
```

## Framework Integration

### Next.js

```typescript
// next.config.js
const { withMrenv } = require("mrenv/dist/adapters/next");

module.exports = withMrenv(
	{
		// Your Next.js config
	},
	{
		publicPrefix: "PUBLIC_",
		protectedEnv: ["API_SECRET", "DB_PASSWORD"],
	},
);
```

### Vite

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { mrenvVite } from "mrenv/adapters/vite";

export default defineConfig({
	plugins: [
		mrenvVite({
			publicPrefix: "PUBLIC_",
		}),
	],
});
```

### Express

```typescript
import express from "express";
import { mrenvExpress } from "mrenv/adapters/express";

const app = express();

// Use the middleware
app.use(
	mrenvExpress({
		exposeKeys: ["PUBLIC_API_URL", "PUBLIC_VERSION"],
	}),
);

app.get("/", (req, res) => {
	// Access env in request
	console.log(req.env.DB_HOST);

	res.send(`
    <html>
      <head>
        <script src="/_mrenv.js"></script>
        <script>
          console.log(window.env.PUBLIC_API_URL);
        </script>
      </head>
      <body>Hello World</body>
    </html>
  `);
});
```

## Advanced Configuration

```typescript
import { createEnv } from "mrenv";

const env = createEnv({
	// Specify runtime (auto-detected by default)
	runtime: "node", // 'node', 'browser', 'deno', 'edge', 'bun', 'auto'

	// Protected environment variables (server-side only)
	protectedEnv: ["API_SECRET", "DB_PASSWORD"],

	// Prefix for client-accessible variables
	publicPrefix: "PUBLIC_",

	// Validation schema
	schema: {
		API_URL: { type: "string", required: true },
		API_SECRET: { type: "string", required: true },
		DB_PORT: { type: "number", default: 5432 },
		FEATURE_FLAGS: { type: "json", default: "{}" },
		DEBUG: { type: "boolean", default: false },
	},

	// Custom paths for .env files
	paths: [".env.local", ".env"],

	// Error handling
	onValidationError: (error) => {
		console.error("Environment validation failed:", error.message);
		process.exit(1);
	},

	// Auto reload on file changes
	autoReload: true,

	// Output path for generated files
	outputPath: "./src/config",
});
```

## Runtime Support

Mrenv automatically detects the runtime environment and adapts its behavior:

-   **Node.js**: Reads from process.env and .env files
-   **Browser**: Reads from window.env
-   **Deno**: Uses Deno.env and .env files
-   **Bun**: Supports Bun.env and .env files
-   **Edge**: Compatible with edge runtime environments

## License

AGPL-3.0-or-later
