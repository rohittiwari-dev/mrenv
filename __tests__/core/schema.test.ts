import schemaValidator, { inferSchema } from "../../src/core/schema";
import { z } from "zod";
import { EnvType } from "../../src/core/types";

describe("Schema", () => {
	describe("inferSchema", () => {
		it("should infer schema from environment variables", () => {
			const env = {
				STRING_VAR: "string",
				NUMBER_VAR: 123,
				BOOLEAN_VAR: true,
				JSON_VAR: '{"key":"value"}',
				_metadata: {
					isClient: false,
					runtime: "node",
					loadedFiles: [".env"],
				},
			};

			const schema = inferSchema(env);

			// Check inferred types
			expect(schema.STRING_VAR.type).toBe("string");
			expect(schema.NUMBER_VAR.type).toBe("number");
			expect(schema.BOOLEAN_VAR.type).toBe("boolean");
			expect(schema.JSON_VAR.type).toBe("json");

			// Check _metadata is skipped
			expect(schema._metadata).toBeUndefined();
		});
	});

	describe("SchemaValidator", () => {
		describe("validate with custom schema", () => {
			it("should validate environment variables against schema", () => {
				const env = {
					DB_HOST: "localhost",
					DB_PORT: "5432",
					DEBUG: "true",
				};

				const schema = {
					DB_HOST: { type: "string" as EnvType, required: true },
					DB_PORT: { type: "number" as EnvType, required: true },
					DEBUG: { type: "boolean" as EnvType, required: false },
				};

				const [isValid, errors, typedEnv] = schemaValidator.validate(
					env,
					schema,
				);

				expect(isValid).toBe(true);
				expect(errors).toHaveLength(0);
				expect(typedEnv.DB_HOST).toBe("localhost");
				expect(typedEnv.DB_PORT).toBe(5432);
				expect(typedEnv.DEBUG).toBe(true);
			});

			it("should return errors for invalid values", () => {
				const env = {
					DB_HOST: "localhost",
					DB_PORT: "not-a-number",
				};

				const schema = {
					DB_HOST: { type: "string" as EnvType, required: true },
					DB_PORT: { type: "number" as EnvType, required: true },
					API_KEY: { type: "string" as EnvType, required: true },
				};

				const [isValid, errors, typedEnv] = schemaValidator.validate(
					env,
					schema,
				);

				expect(isValid).toBe(false);
				expect(errors.length).toBeGreaterThan(0);
				// Should have error for missing API_KEY and invalid DB_PORT
				expect(errors.some((err) => err.includes("API_KEY"))).toBe(
					true,
				);
				expect(errors.some((err) => err.includes("DB_PORT"))).toBe(
					true,
				);
			});
		});

		describe("validate with Zod schema", () => {
			it("should validate using Zod schema", () => {
				const env = {
					DB_HOST: "localhost",
					DB_PORT: "5432",
					DEBUG: "true",
				};

				const testOutput = {
					DB_HOST: "localhost",
					DB_PORT: 5432,
					DEBUG: true,
				};

				// Create a simple mock of the Zod validation result
				const zodSchema = {
					parse: jest.fn().mockReturnValue(testOutput),
				};

				const [isValid, errors, typedEnv] = schemaValidator.validate(
					env,
					zodSchema as any,
				);

				expect(isValid).toBe(true);
				expect(errors).toHaveLength(0);
				expect(typedEnv).toEqual(testOutput);
			});

			it("should return errors for invalid Zod schema", () => {
				const env = {
					DB_HOST: "localhost",
					DB_PORT: "not-a-number",
				};

				// Create a mock that throws a Zod error
				const zodError = new Error("Validation failed");
				(zodError as any).errors = [
					{
						path: ["DB_PORT"],
						message: "Expected number, received string",
					},
				];

				const zodSchema = {
					parse: jest.fn().mockImplementation(() => {
						throw zodError;
					}),
				};

				const [isValid, errors, typedEnv] = schemaValidator.validate(
					env,
					zodSchema as any,
				);

				expect(isValid).toBe(false);
				expect(errors.length).toBeGreaterThan(0);
			});
		});
	});
});
