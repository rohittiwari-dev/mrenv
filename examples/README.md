# mrenv Examples

This directory contains examples of how to use mrenv in different environments and scenarios.

## Basic Usage

The [basic-usage.ts](./basic-usage.ts) example demonstrates the core functionality of mrenv for type-safe environment variable management in a Node.js application.

Key features demonstrated:

-   Defining server, client, and shared variables
-   Type-safe access to environment variables
-   Using Zod for schema validation
-   Basic configuration options

## Next.js Usage

The [nextjs-usage.ts](./nextjs-usage.ts) example shows how to use mrenv in a Next.js application, handling both server and client-side environment variables.

Key features demonstrated:

-   Next.js-specific configuration
-   Separation of server and client variables
-   Custom error handling
-   Client-side variable access protection

## Schema Utilities

The [schema-utils.ts](./schema-utils.ts) example demonstrates how to use the schema utilities in mrenv to generate schemas from .env files and create .env files from schemas.

Key features demonstrated:

-   Generating Zod schemas from .env files
-   Creating .env files from schemas
-   Customizing schema generation options
-   Working with different environment types

## Running the Examples

To run these examples, you'll need to:

1. Install mrenv and its dependencies
2. Set up the required environment variables
3. Compile the TypeScript files
4. Run the compiled JavaScript

For example:

```bash
# Install dependencies
npm install mrenv zod

# Set up environment variables
echo "DATABASE_URL=postgres://user:password@localhost:5432/db" > .env
echo "API_KEY=your-api-key-here" >> .env
echo "NEXT_PUBLIC_API_URL=https://api.example.com" >> .env

# Compile and run
npx tsc examples/basic-usage.ts
node examples/basic-usage.js
```

## Additional Resources

For more information on using mrenv, check out:

-   [Main README](../README.md)
-   [API Documentation](../README.md#api-reference)
-   [CLI Documentation](../README.md#cli-usage)
