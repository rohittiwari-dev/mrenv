/**
 * Next.js Usage Example for mrenv
 *
 * This example demonstrates how to use mrenv in a Next.js application,
 * handling both server and client-side environment variables.
 */

import { createEnv, TypedEnv } from "mrenv";
import { z } from "zod";

// Define your schemas
const serverSchema = {
	DATABASE_URL: z.string().url(),
	STRIPE_SECRET_KEY: z.string().min(10),
	SMTP_SERVER: z.string(),
	SMTP_PORT: z.coerce.number().int().positive(),
	SMTP_USERNAME: z.string(),
	SMTP_PASSWORD: z.string(),
};

const clientSchema = {
	NEXT_PUBLIC_API_URL: z.string().url(),
	NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(10),
	NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
	NEXT_PUBLIC_SITE_URL: z.string().url(),
};

const sharedSchema = {
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
};

// Define the type for your environment
type Env = TypedEnv<
	typeof serverSchema,
	typeof clientSchema,
	typeof sharedSchema
>;

// Typically, you would put this in a separate file like 'env.ts' or 'env.mjs'
export const env = createEnv<{
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

	// Next.js specific configuration
	adapter: "next",

	// Error handling for validation failures
	onValidationError: (error) => {
		console.error("❌ Invalid environment variables:", error.format());
		throw new Error("Invalid environment variables");
	},

	// Customizing client-side variable behavior
	clientPrefix: "NEXT_PUBLIC_",

	// Additional options
	skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
	runtimeEnv: process.env,
});

// Usage in a Next.js API route (server-side)
export async function GET() {
	// Server-side code can access all variables
	const dbConnection = await connectToDatabase(env.DATABASE_URL);
	const stripeClient = new StripeClient(env.STRIPE_SECRET_KEY);

	// You can also access client-side variables
	const siteUrl = env.NEXT_PUBLIC_SITE_URL;

	return { success: true };
}

// Usage in a Next.js component (client-side)
export function ClientComponent() {
	// Client-side code can only access client-side variables
	// env.DATABASE_URL would cause a runtime error

	return (
		<div>
			<p>API URL: {env.NEXT_PUBLIC_API_URL}</p>
			<p>Environment: {env.NODE_ENV}</p>
			{env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
				<script
					async
					src={`https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
				/>
			)}
		</div>
	);
}

// Helper functions (not part of the example)
async function connectToDatabase(url: string) {
	return {};
}

class StripeClient {
	constructor(key: string) {}
}
