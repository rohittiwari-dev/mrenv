// Detect the runtime environment
import {EnvConfig} from "@/config";

export const detectRuntime = (): 'node' | 'browser' => {
    return typeof window === 'undefined' ? 'node' : 'browser';
};

/**
 * Parse environment file content
 * @param content File content
 * @returns Object with parsed environment variables
 */
export const parseEnvContent = (content: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip comments and empty lines
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        // Match key=value pattern
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }

            // Process escape sequences
            value = value
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t');

            result[key] = value;
        }
    }

    return result;
};


/**
 * Infer type of an environment variable
 * @param value The environment variable value
 * @returns Inferred type as a string
 */
export const inferType = (value: string): string => {
    // Check if value is a boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        return 'boolean';
    }

    // Check if value is a number
    if (!isNaN(Number(value)) && value.trim() !== '') {
        return 'number';
    }

    // Default to string
    return 'string';
};



/**
 * Generate TypeScript type definitions from environment variables
 * @param envVars Environment variables
 * @param config Configuration options
 * @returns TypeScript type definition as a string
 */
export const generateTypes = (envVars: Record<string, string>, config: EnvConfig): string => {
    const publicPrefix = config.publicPrefix;
    const isProtected = config.protectedEnv || false;

    let typeDefinition = 'export interface Env {\n';

    for (const [key, value] of Object.entries(envVars)) {
        // Determine if variable is public or server-only
        const isPublic = publicPrefix ? key.startsWith(publicPrefix) : !isProtected;
        const type = inferType(value);

        typeDefinition += `  ${key}: ${type};\n`;
    }

    typeDefinition += '}\n\n';

    // Add client-side environment interface if public prefix is set
    if (publicPrefix) {
        typeDefinition += 'export interface ClientEnv {\n';

        for (const [key, value] of Object.entries(envVars)) {
            if (key.startsWith(publicPrefix)) {
                const type = inferType(value);
                typeDefinition += `  ${key}: ${type};\n`;
            }
        }

        typeDefinition += '}\n';
    }

    return typeDefinition;
};