import {createEnv, envStore} from "@/env";
import {EnvConfig} from "@/config";

/**
 * Vite plugin
 * @param config Super Env configuration
 * @returns Vite plugin object
 */
export const viteSuperEnv = (config: EnvConfig = {}) => {
    const env = createEnv(config);

    return {
        name: 'vite-plugin-super-env',
        config: () => {
            // Filter for client-side variables
            const clientEnv = Object.entries(envStore)
                .filter(([_, { type }]) => type === 'client' || type === 'both')
                .reduce((acc, [key, { value }]) => ({
                    ...acc,
                    [`import.meta.env.${key}`]: JSON.stringify(value)
                }), {});

            return {
                define: clientEnv
            };
        }
    };
};
