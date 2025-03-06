import {EnvConfig, EnvStore, EnvType} from "./config";
import {detectRuntime, generateTypes, parseEnvContent} from "./utils";
import path from "node:path";
import * as fs from "node:fs";
import chokidar, {FSWatcher} from "chokidar";
import {z} from "zod";


// Global store for environment variables
export let envStore: EnvStore = {};
export let watchers: FSWatcher[] = [];

/**
 * Find and read environment files
 * @param config Configuration options
 * @returns Object with all environment variables
 */
const readEnvFiles = (config: EnvConfig): Record<string, string> => {
    const envVars: Record<string, string> = {};
    const runtime = config.runtime === 'auto' ? detectRuntime() : config.runtime;

    if (runtime === 'browser') {
        // In browser, we can't read files directly, so return an empty object
        return envVars;
    }

    const rootDir = process.cwd();
    const defaultPatterns = ['.env', '.env.local', '.env.development', '.env.production'];
    const patterns = config.paths || defaultPatterns;
    const exclude = config.exclude || [];

    for (const pattern of patterns) {
        // Skip excluded patterns
        if (exclude.some(regex => regex.test(pattern))) {
            continue;
        }

        const filePath = path.resolve(rootDir, pattern);

        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const parsedVars = parseEnvContent(content);

                // Merge with existing vars (later files override earlier ones)
                Object.assign(envVars, parsedVars);

                // Set up file watcher if watch is enabled
                if (config.watch) {
                    const watcher = chokidar.watch(filePath);
                    watcher.on('change', () => {
                        try {
                            const updatedContent = fs.readFileSync(filePath, 'utf8');
                            const updatedVars = parseEnvContent(updatedContent);

                            // Update the global store with new values
                            for (const [key, value] of Object.entries(updatedVars)) {
                                if (envStore[key]) {
                                    envStore[key].value = value;
                                }
                            }
                        } catch (error) {
                            console.error(`Error watching environment file ${filePath}:`, error);
                        }
                    });
                    watchers.push(watcher);
                }
            }
        } catch (error) {
            console.error(`Error reading environment file ${filePath}:`, error);
        }
    }

    return envVars;
};


/**
 * Write type definitions to a file
 * @param content Type definition content
 */
const writeTypeDefinitions = (content: string): void => {
    const runtime = detectRuntime();

    if (runtime === 'node') {
        try {
            const typesDir = path.resolve(process.cwd(), 'node_modules/.superenv');

            if (!fs.existsSync(typesDir)) {
                fs.mkdirSync(typesDir, { recursive: true });
            }

            fs.writeFileSync(path.resolve(typesDir, 'env.d.ts'), content);
        } catch (error) {
            console.error('Error writing type definitions:', error);
        }
    }
};

/**
 * Organize environment variables into the global store
 * @param envVars Environment variables
 * @param config Configuration options
 */
const organizeEnvStore = (envVars: Record<string, string>, config: EnvConfig): void => {
    const publicPrefix = config.publicPrefix;
    const isProtected = config.protectedEnv || false;

    for (const [key, value] of Object.entries(envVars)) {
        // Determine variable type (server, client, or both)
        let type: EnvType = 'both';

        if (publicPrefix) {
            type = key.startsWith(publicPrefix) ? 'client' : 'server';
        } else if (isProtected) {
            type = 'server';
        }

        envStore[key] = {
            value,
            type
        };
    }
};


/**
 * Create a proxy to handle environment variable access
 * @param runtime Current runtime environment
 * @returns Proxy that controls access to environment variables
 */
const createEnvProxy = (runtime: 'node' | 'browser') => {
    return new Proxy({}, {
        get: (target, prop) => {
            if (typeof prop !== 'string') return undefined;

            const env = envStore[prop];

            if (!env) {
                return undefined;
            }

            // Enforce server-side only access
            if (env.type === 'server' && runtime === 'browser') {
                throw new Error(`Cannot access server-side environment variable '${prop}' from client`);
            }

            // Convert value to appropriate type
            const value = env.value;

            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);

            return value;
        }
    });
};


/**
 * Create environment variable store with type safety
 * @param config Configuration options
 * @returns Type-safe environment variable object
 */
export const createEnv = <T = any>(config: EnvConfig = {}): T => {
    const currentRuntime = config.runtime === 'auto' || !config.runtime
        ? detectRuntime()
        : config.runtime;

    // Reset global store
    envStore = {};

    // Close any existing watchers
    for (const watcher of watchers) {
        (()=>watcher.close())();
    }
    watchers = [];

    // Read environment variables from files
    const envVars = readEnvFiles({
        ...config,
        runtime: currentRuntime
    });

    // If in Node.js, also include process.env variables
    if (currentRuntime === 'node' && typeof process !== 'undefined' && process.env) {
        Object.assign(envVars, process.env);
    }

    // Validate against schema if provided
    if (config.schema) {
        try {
            config.schema.parse(envVars);
        } catch (error) {
            if (error instanceof z.ZodError) {
                if (config.onValidationError) {
                    config.onValidationError(error);
                } else {
                    console.error('Environment validation failed:', error.format());
                }
            }
        }
    }

    // Generate and write type definitions
    const typeDefinitions = generateTypes(envVars, config);
    writeTypeDefinitions(typeDefinitions);

    // Organize variables in the global store
    organizeEnvStore(envVars, config);

    // Create and return the proxy
    return createEnvProxy(currentRuntime as 'node' | 'browser') as T;
};