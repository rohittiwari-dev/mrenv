/**
 * Custom Error Types
 */

import { ZodError, type ZodIssue } from "zod";

/**
 * Base error class for all EnvSafe errors
 */
export class EnvSafeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EnvSafeError";
	}
}

/**
 * Error thrown during environment validation
 */
export class ValidationError extends EnvSafeError {
	readonly issues: ZodIssue[];

	constructor(message: string, issues: ZodIssue[]) {
		super(message);
		this.name = "ValidationError";
		this.issues = issues;
	}

	/**
	 * Format the error message into a user-friendly string
	 */
	formatErrors(): string {
		return this.issues
			.map((issue) => {
				const path = issue.path.join(".");
				return `${path ? `${path}: ` : ""}${issue.message}`;
			})
			.join("\n");
	}

	/**
	 * Create a validation error from a Zod error
	 */
	static fromZodError(error: ZodError): ValidationError {
		const message = `Environment validation failed:\n${error.errors
			.map((err) => `${err.path.join(".")}: ${err.message}`)
			.join("\n")}`;

		return new ValidationError(message, error.errors);
	}
}

/**
 * Error thrown when environment loading fails
 */
export class LoadError extends EnvSafeError {
	readonly filePath?: string;

	constructor(message: string, filePath?: string) {
		super(message);
		this.name = "LoadError";
		this.filePath = filePath;
	}
}

/**
 * Error thrown when a required variable is missing
 */
export class MissingVariableError extends EnvSafeError {
	readonly variableName: string;

	constructor(variableName: string) {
		super(`Required environment variable "${variableName}" is missing.`);
		this.name = "MissingVariableError";
		this.variableName = variableName;
	}
}

/**
 * Error thrown when an invalid environment variable is accessed
 */
export class InvalidAccessError extends EnvSafeError {
	readonly variableName: string;

	constructor(variableName: string) {
		super(
			`Attempted to access environment variable "${variableName}" that does not exist or is not defined in the schema.`,
		);
		this.name = "InvalidAccessError";
		this.variableName = variableName;
	}
}

/**
 * Error thrown when a server-only variable is accessed from client code
 */
export class ServerOnlyAccessError extends EnvSafeError {
	readonly variableName: string;

	constructor(variableName: string) {
		super(
			`Attempted to access server-only environment variable "${variableName}" from client code.`,
		);
		this.name = "ServerOnlyAccessError";
		this.variableName = variableName;
	}
}
