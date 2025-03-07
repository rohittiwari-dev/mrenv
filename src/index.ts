// Core exports
export { createEnv } from "./core/createEnv";
export { default as envReader } from "./core/envReader";
export { default as runtimeDetector } from "./core/runtimeDetector";
export { default as schemaValidator } from "./core/schema";

// Type exports
export * from "./core/types";

// Adapter exports
export { withMrenv } from "./adapters/nextjs";
export { mrenvVite } from "./adapters/vite";
export { mrenvExpress } from "./adapters/express";

// Version
export const version = "0.1.0";
