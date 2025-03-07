# mrenv

A type-safe environment variable manager with runtime detection and automatic type generation.

## Features

-   🔒 Type-safe environment variables
-   🔍 Runtime detection (Node.js, Browser, Deno, Edge, Bun)
-   📝 Automatic type generation
-   🛡️ Client/server side security
-   🔄 Auto-reload on file changes
-   🔌 Adapters for Next.js, Vite, Express and more
-   ✅ Validation with schema support
-   🛠️ CLI for type generation

## Installation

```bash
npm install mrenv
```

## Basic Usage

Create a `.env` file in your project root:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
PUBLIC_API_URL=https://api.example.com
```

Then use it in your code:

```typescript
// env.ts
import { createEnv } from "mrenv";

export const env = createEnv({
	// Specify which variables are protected (server-side only)
	protectedEnv: ["DB_HOST", "DB_PORT", "DB_USER"],

	// Specify prefix for public variables
	publicPrefix: "PUBLIC_",
});

// Your environment variables are now type-safe!
console.log(env.DB_HOST); // localhost
console.log(env.PUBLIC_API_URL); // https://api.example.com
```

## Schema Validation

You can add validation using a schema in two ways:

### 1. Using Built-in Schema

```typescript
import { createEnv } from "mrenv";

export const env = createEnv({
	schema: {
		DB_PORT: {
			type: "number",
			required: true,
		},
		DEBUG: {
			type: "boolean",
			default: false,
		},
		NODE_ENV: {
			type: "string",
			validate: (value) =>
				["development", "production", "test"].includes(value),
		},
	},
});
```

### 2. Using Zod Schema (Recommended)

```typescript
import { createEnv } from "mrenv";
import { z } from "zod";

// Define your schema with Zod for powerful validations
const schema = z.object({
	PORT: z.preprocess((val) => Number(val), z.number().min(1000).max(9999)),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	DATABASE_URL: z.string().url(),
	DEBUG: z
		.preprocess((val) => val === "true" || val === "1", z.boolean())
		.default(false),
	// Complex transformations and validations
	API_CONFIG: z.preprocess(
		(val) => (typeof val === "string" ? JSON.parse(val) : val),
		z.object({
			baseUrl: z.string().url(),
			timeout: z.number().positive(),
		}),
	),
});

// Use the Zod schema with mrenv
export const env = createEnv({ schema });

// TypeScript types are automatically inferred from your Zod schema!
console.log(env.PORT); // number
console.log(env.DATABASE_URL); // string
console.log(env.API_CONFIG.baseUrl); // string
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

## Error Handling

By default, `mrenv` will throw errors when validation fails, allowing you to catch issues early:

```typescript
try {
	const env = createEnv({
		schema: {
			PORT: { type: "number", required: true },
		},
	});
} catch (error) {
	console.error("Environment validation failed:", error.message);
	process.exit(1);
}
```

You can also provide a custom error handler:

```typescript
const env = createEnv({
	schema: {
		PORT: { type: "number", required: true },
	},
	onValidationError: (error) => {
		// Log to a monitoring service
		sendToMonitoring(error);

		// Exit with error code
		process.exit(1);
	},
});
```

With Zod schemas, you get detailed error messages about validation failures:

```typescript
try {
	const env = createEnv({
		schema: z.object({
			PORT: z.number().min(1000).max(9999),
			DATABASE_URL: z.string().url(),
		}),
	});
} catch (error) {
	// Error will contain detailed information about validation failures
	console.error("Validation error:", error.message);
	// Example: "Validation failed: PORT: Expected number, received string, DATABASE_URL: Invalid url"
}
```

## License

AGPL-3.0-or-later
