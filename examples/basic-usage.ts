/**
 * Basic Usage Example for mrenv
 *
 * This example demonstrates the core functionality of mrenv for type-safe
 * environment variable management.
 */

import { createEnv, TypedEnv } from "mrenv";
import { z } from "zod";

// Define your server-side variables schema
const serverSchema = {
	DATABASE_URL: z.string().url(),
	API_KEY: z.string().min(10),
	PORT: z.coerce.number().int().positive().default(3000),
	NODE_ENV: z.enum(["development", "production", "test"]),
};

// Define your client-side variables schema
const clientSchema = {
	NEXT_PUBLIC_API_URL: z.string().url(),
	NEXT_PUBLIC_GA_ID: z.string().optional(),
};

// Define your shared variables schema
const sharedSchema = {
	LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
};

// Define the type for your environment
type Env = TypedEnv<
	typeof serverSchema,
	typeof clientSchema,
	typeof sharedSchema
>;

// Define your environment schema with server, client, and shared variables
const env = createEnv<{
	server: typeof serverSchema;
	client: typeof clientSchema;
	shared: typeof sharedSchema;
}>({
	// Server-side variables (not exposed to the client)
	server: serverSchema,

	// Client-side variables (safe to expose to the browser)
	client: clientSchema,

	// Shared variables (accessible in both environments)
	shared: sharedSchema,

	// Optional configuration
	runtimeEnv: process.env, // Use process.env as the source
	skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
	adapter: "node", // Use Node.js adapter (default)
});

// Type-safe access to environment variables
console.log(`Server is running on port ${env.PORT}`);
console.log(`Connected to database at ${env.DATABASE_URL}`);
console.log(`Public API URL: ${env.NEXT_PUBLIC_API_URL}`);
console.log(`Log level: ${env.LOG_LEVEL}`);

// TypeScript knows the types
const port: number = env.PORT; // number
const dbUrl: string = env.DATABASE_URL; // string
const logLevel: "debug" | "info" | "warn" | "error" = env.LOG_LEVEL; // enum

// This would cause a TypeScript error:
// const port: string = env.PORT; // Type 'number' is not assignable to type 'string'

// Accessing undefined variables would also cause errors
// console.log(env.UNDEFINED_VAR); // Property 'UNDEFINED_VAR' does not exist on type...
