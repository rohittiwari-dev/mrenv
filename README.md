# mrenv

Enhanced type-safe environment variable management system with Zod schema validation.

## Features

-   **Type Safety**: Full TypeScript support with Zod schema validation
-   **Environment Separation**: Separate server and client variables for security
-   **Adapters**: Framework-specific adapters for Next.js, Node.js, and browsers
-   **Validation**: Runtime validation with detailed error messages
-   **CLI Tools**: Generate and manage `.env` files with ease
-   **Extensible**: Customizable validation, error handling, and more

## Installation

```bash
# Install the package
npm install mrenv

# Install required peer dependencies
npm install zod@^3.22.0
```

## Basic Usage

```typescript
import { createEnv } from "mrenv";
import { z } from "zod";

const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		API_KEY: z.string().min(10),
	},
	client: {
		NEXT_PUBLIC_API_URL: z.string().url(),
	},
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]),
	},
});

// Type-safe access
const dbUrl = env.DATABASE_URL; // string
const apiUrl = env.NEXT_PUBLIC_API_URL; // string
```

## Perfect IntelliSense

For the best TypeScript experience, use the `createTypedEnv` helper function:

```typescript
import { createTypedEnv } from "mrenv";
import { z } from "zod";

// Define your schemas
const serverSchema = {
	DATABASE_URL: z.string().url(),
	API_KEY: z.string().min(10),
};

const clientSchema = {
	NEXT_PUBLIC_API_URL: z.string().url(),
};

const sharedSchema = {
	NODE_ENV: z.enum(["development", "production", "test"]),
};

// Use the helper function for perfect IntelliSense
const env = createTypedEnv({
	server: serverSchema,
	client: clientSchema,
	shared: sharedSchema,
	// Other options...
});

// You get perfect IntelliSense
console.log(env.DATABASE_URL); // TypeScript knows this is a string
console.log(env.API_KEY); // TypeScript knows this is a string
console.log(env.NODE_ENV); // TypeScript knows this is "development" | "production" | "test"
```

## Advanced Configuration

```typescript
import { createEnv, loadEnvFile } from "mrenv";
import { z } from "zod";

// Load environment variables from .env files
const envVars = loadEnvFile({
	directory: process.cwd(),
	environment: process.env.NODE_ENV || "development",
	expandVariables: true,
});

// Create environment with custom options
const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		REDIS_URL: z.string().url().optional(),
	},
	client: {
		NEXT_PUBLIC_API_URL: z.string().url(),
	},
	runtimeEnv: envVars, // Use loaded environment variables
	skipValidation: process.env.NODE_ENV === "test", // Skip validation in test
	adapter: "next", // Use Next.js adapter
	updateProcessEnv: true, // Update process.env with validated values
	onValidationError: (error) => {
		console.error("Environment validation failed:", error.formatErrors());
		process.exit(1);
	},
	onInvalidAccess: (key) => {
		throw new Error(`Invalid access: ${key} is not defined in the schema`);
	},
});
```

## Framework Adapters

mrenv includes built-in adapters for different environments:

-   **Node.js**: Default for server-side environments
-   **Browser**: For client-side JavaScript
-   **Next.js**: Special handling for Next.js SSR/CSR

```typescript
import { createEnv, resolveAdapter } from "mrenv";
import { z } from "zod";

// Automatically detect the environment
const adapter = resolveAdapter();

// Or specify an adapter
const nextAdapter = resolveAdapter("next");

// Or create a custom adapter
import { EnvironmentAdapter, registerAdapter } from "mrenv";

class CustomAdapter implements EnvironmentAdapter {
	isServer(): boolean {
		return true;
	}

	getEnvironment(): Record<string, string> {
		// Custom logic to get environment variables
		return process.env;
	}

	// Other required methods...
}

// Register the adapter
registerAdapter("custom", CustomAdapter);

// Use the custom adapter
const env = createEnv({
	// Schema definition...
	adapter: "custom",
});
```

## CLI Usage

`mrenv` comes with a CLI tool that helps you manage your environment variables:

```bash
# Generate a Zod schema from .env files
npx mrenv generate-schema --directory ./path/to/env/files --env development --output ./src/env-schema.ts

# Create a .env file from a schema
npx mrenv create-env --schema ./src/env-schema.ts --output ./.env

# Validate environment variables against a schema
npx mrenv validate --schema ./src/env-schema.ts --env ./.env

# Interactive mode for environment setup
npx mrenv interactive
```

### CLI Commands

#### `generate-schema`

Generates a Zod schema from your .env files.

```bash
npx mrenv generate-schema [options]
```

Options:

-   `-d, --directory <path>` - Directory containing .env files (default: current directory)
-   `-e, --env <environment>` - Environment to generate schema for (default: "development")
-   `-o, --output <file>` - Output file path (default: "./src/env-schema.ts")

#### `create-env`

Creates a .env file from a schema.

```bash
npx mrenv create-env [options]
```

Options:

-   `-s, --schema <file>` - Schema file path (default: "./src/env-schema.ts")
-   `-o, --output <file>` - Output file path (default: "./.env")

#### `validate`

Validates environment variables against a schema.

```bash
npx mrenv validate [options]
```

Options:

-   `-s, --schema <file>` - Schema file path (default: "./src/env-schema.ts")
-   `-e, --env <file>` - Environment file to validate (default: "./.env")

#### `interactive`

Launches an interactive mode to guide you through environment configuration tasks.

```bash
npx mrenv interactive
```

This command provides an interactive interface that guides you through:

-   Generating schemas from .env files
-   Creating .env files from schemas
-   Validating environment variables
-   All with custom configuration options

## Type Safety

mrenv provides full type safety with TypeScript:

```typescript
import { createEnv } from "mrenv";
import { z } from "zod";

const env = createEnv({
	server: {
		PORT: z.coerce.number().int().positive(),
		DATABASE_URL: z.string().url(),
	},
});

// TypeScript knows this is a number
const port: number = env.PORT;

// This would be a type error
// const port: string = env.PORT;
```

### Enhanced IntelliSense

For even better IntelliSense and type-safety, use the `createTypedEnv` helper:

```typescript
import { createTypedEnv } from "mrenv";
import { z } from "zod";

// Define your schemas
const serverSchema = {
	PORT: z.coerce.number().int().positive(),
	DATABASE_URL: z.string().url(),
};

const clientSchema = {
	NEXT_PUBLIC_API_URL: z.string().url(),
};

// Use the helper function for perfect IntelliSense
const env = createTypedEnv({
	server: serverSchema,
	client: clientSchema,
});

// Now you get perfect IntelliSense
env.PORT; // TypeScript knows this is a number
env.DATABASE_URL; // TypeScript knows this is a string
```

For more details on TypeScript integration, see the [TypeScript documentation](./docs/typescript.md).

## License

MIT
