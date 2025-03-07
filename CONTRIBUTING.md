# Contributing to MrEnv

Thank you for considering contributing to MrEnv! We welcome contributions from everyone, whether it's fixing a typo in documentation or implementing a new feature.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct, which asks you to be respectful and considerate of others.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your changes
4. Make your changes
5. Run tests and linting
6. Commit and push your changes
7. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev

# Run linting
npm run lint
```

## Project Structure

-   `src/core/` - Core functionality
-   `src/adapters/` - Framework adapters
-   `src/cli/` - CLI commands
-   `bin/` - Executable scripts

## Pull Request Process

1. Update the README.md with details of changes to the API, if applicable
2. Update the documentation with details of features added or changed
3. The versioning scheme we use is [SemVer](http://semver.org/)
4. Your PR should be reviewed by at least one maintainer

## Coding Guidelines

-   Write tests for new features
-   Follow the existing code style
-   Document new functions, methods, and classes
-   Keep your changes focused and specific
-   Be considerate of performance implications
-   Provide meaningful commit messages

## Testing

Before submitting your changes, make sure to test them thoroughly. This includes:

-   Manual testing of your new features
-   Running existing tests
-   Adding new tests for your features if applicable

## Documentation

If you're adding or changing features, make sure to update the documentation, including:

-   README.md
-   Code comments
-   TSDoc comments for public APIs

## Releasing

For maintainers only:

1. Update the version in package.json
2. Run `npm run build`
3. Create a new GitHub release
4. Publish to npm with `npm publish`

## Additional Notes

### Commit Messages

We recommend following the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Branch Strategy

-   `main` - Latest stable release
-   `develop` - Development branch
-   Feature branches should be created from `develop` and named descriptively

## Project Structure

```
mrenv/
├── src/
│   ├── core/
│   │   ├── createEnv.ts         # Main API function
│   │   ├── envReader.ts         # Environment file reader
│   │   ├── runtimeDetector.ts   # Detects Node.js, Deno, browser, etc.
│   │   ├── schema.ts            # Schema validation functions
│   │   └── types.ts             # Core type definitions
│   ├── adapters/
│   │   ├── next.ts              # Next.js adapter
│   │   ├── vite.ts              # Vite plugin
│   │   ├── express.ts           # Express.js adapter
│   │   ├── remix.ts             # Remix adapter
│   │   ├── deno.ts              # Deno adapter
│   │   └── edge.ts              # Edge runtime adapter
│   ├── cli/
│   │   ├── index.ts             # CLI entry point
│   │   ├── commands/
│   │   │   ├── generate.ts      # Generate typings command
│   │   └── utils/
│   │       └── fileGenerator.ts # Utilities for generating files
│   └── index.ts                 # Package entry point
├── bin/
│   └── mrenv.js                 # CLI binary
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Package manifest
├── SECURITY.md                  # Security documentation
├── CONTRIBUTING.md              # Contribution guidelines
├── README.md                    # Package documentation
└── tsup.config.ts               # Build configuration
```

## Closing notes

Again, thank you so much for your interest in contributing to MrEnv, we really appreciate it, and if there is anything we can do to help your journey, make sure to join our Community.
