// Core functionality
export { createEnv } from "./core/createEnv";
export { default as envReader } from "./core/envReader";
export { default as runtimeDetector } from "./core/runtimeDetector";
export { default as schemaValidator } from "./core/schema";

// Type exports
export * from "./core/types";

// Adapters (to be implemented)
export * from "./adapters/next";
export * from "./adapters/vite";
export * from "./adapters/express";
export * from "./adapters/remix";
export * from "./adapters/deno";
export * from "./adapters/edge";

// CLI exports
export { executeCommand } from "./cli";
