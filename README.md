# SuperEnv
THIS IS A WARNING DO NOT USE THIS PACKAGE FOR PRODUCTION FOR NOW 

- for contribution read contribution guide

SuperEnv is an advanced environment variable management package for JavaScript/TypeScript applications that provides:

- Type-safe environment variables
- Automatic type inference
- Runtime protection for server/client access
- Schema validation
- Auto-reloading on environment file changes
- Framework adapters (Next.js, Vite, etc.)

## Installation

```bash
npm install superenv
# or
yarn add superenv
# or
pnpm add superenv
```

## Basic Usage

```typescript
// env.ts
import { createEnv, z } from 'superenv';

// Define your schema (optional)
const schema = z.object({
  API_URL: z.string().url(),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  DEBUG: z.enum(['true', 'false']).transform(val => val === 'true'),
});

// Create your environment with automatic types
export const env = createEnv({
  schema,
  publicPrefix: 'PUBLIC_', // Variables prefixed with PUBLIC_ will be accessible on client
  protectedEnv: true, // Other variables will be server-only
});

// Type-safe usage
const port = env.PORT; // number
const apiUrl = env.API_URL; // string
const debug = env.DEBUG; // boolean
```

## Configuration Options

The `createEnv` function accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `runtime` | `'node'` \| `'browser'` \| `'auto'` | `'auto'` | Specify the runtime environment |
| `protectedEnv` | `boolean` | `false` | Make all variables server-only by default |
| `publicPrefix` | `string` | `undefined` | Prefix for client-accessible variables |
| `schema` | `ZodSchema` | `undefined` | Zod schema for validation |
| `paths` | `string[]` | `.env.*` | Custom paths to env files |
| `exclude` | `RegExp[]` | `[]` | Patterns to exclude from loading |
| `onValidationError` | `(error: ZodError) => void` | `undefined` | Custom error handler |
| `watch` | `boolean` | `false` | Watch for file changes and reload |

## Advanced Features

### Automatic Type Inference

SuperEnv can automatically infer types from environment variable values:

```typescript
// Example .env file
PORT=3000
DEBUG=true
API_URL=https://api.example.com
MAX_RETRIES=5

// Types will be inferred as:
// PORT: number
// DEBUG: boolean
// API_URL: string
// MAX_RETRIES: number
```

### Client/Server Security

SuperEnv can protect server-only variables from being accessed on the client:

```typescript
// Setup
const env = createEnv({
  publicPrefix: 'PUBLIC_',
  protectedEnv: true,
});

// .env file
DATABASE_URL=postgres://user:password@localhost:5432/db
PUBLIC_API_URL=https://api.example.com

// Usage
// On server:
env.DATABASE_URL; // Works fine
env.PUBLIC_API_URL; // Works fine

// On client:
env.DATABASE_URL; // Throws error: Cannot access server-side variable
env.PUBLIC_API_URL; // Works fine
```

### Framework Adapters

#### Next.js Integration

```typescript
// next.config.js
const { withSuperEnv } = require('superenv');

module.exports = withSuperEnv({
  publicPrefix: 'PUBLIC_',
  protectedEnv: true,
})({
  // Your Next.js configuration
});
```

#### Vite Integration

```typescript
// vite.config.js/ts
import { defineConfig } from 'vite';
import { viteSuperEnv } from 'superenv';

export default defineConfig({
  plugins: [
    viteSuperEnv({
      publicPrefix: 'PUBLIC_',
    }),
  ],
});
```

### Schema Validation with Custom Error Handling

```typescript
import { createEnv, z } from 'superenv';

const env = createEnv({
  schema: z.object({
    PORT: z.string().transform(Number).pipe(z.number().min(1024).max(65535)),
    NODE_ENV: z.enum(['development', 'production', 'test']),
  }),
  onValidationError: (error) => {
    console.error('Environment validation failed:');
    console.error(error.format());
    process.exit(1); // Exit if validation fails
  },
});
```

### File Watching and Auto-Reloading

```typescript
const env = createEnv({
  watch: true, // Automatically reload when env files change
});
```

### Custom Env File Paths

```typescript
const env = createEnv({
  paths: [
    '.env',
    '.env.local',
    '.env.custom',
    'config/secrets.env',
  ],
  exclude: [
    /\.test$/,
    /\.example$/,
  ],
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GPL 3
