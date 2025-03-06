// Type definitions
import {z} from "zod";

export type RuntimeType = 'node' | 'browser' | 'auto';
export  type EnvType = 'server' | 'client' | 'both';

export interface EnvConfig {
    runtime?: RuntimeType;
    protectedEnv?: boolean;
    publicPrefix?: string;
    schema?: z.ZodSchema<any>;
    paths?: string[];
    exclude?: RegExp[];
    onValidationError?: (errors: z.ZodError) => void;
    watch?: boolean;
}


export interface EnvStore {
    [key: string]: {
        value: string;
        type: EnvType;
    };
}

