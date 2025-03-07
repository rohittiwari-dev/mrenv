# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within SuperEnv, please send an email to [your-email]. All security vulnerabilities will be promptly addressed.

Please include the following information in your report:

-   Type of vulnerability
-   Steps to reproduce
-   Affected versions
-   Potential impact

## Security Features

SuperEnv includes several security features designed to protect sensitive environment variables:

### Client/Server Variable Separation

By default, all environment variables loaded through SuperEnv can be configured to separate client-side and server-side variables:

-   Use the `protectedEnv` option to specify variables that should only be accessible on the server
-   Use the `publicPrefix` option to specify a prefix for variables that can be exposed to clients

### Runtime Detection

SuperEnv automatically detects the runtime environment (Node.js, browser, Deno, etc.) and adjusts its behavior accordingly, ensuring that protected variables are not exposed in client environments.

### Validation

Schema validation ensures that your environment variables meet your requirements, helping to prevent security issues caused by missing or malformed variables.

## Secure Usage Guidelines

For optimal security, we recommend following these guidelines:

1. Never commit `.env` files to version control
2. Use the `protectedEnv` option to explicitly mark sensitive variables
3. Set a specific `publicPrefix` (e.g., `PUBLIC_`) for variables that are safe to expose to clients
4. Validate all environment variables using the schema feature

## Reporting Issues

If you discover any security-related issues or have suggestions for improving security, please create an issue or submit a pull request.

## License

SuperEnv is open-sourced software licensed under the MIT license.
