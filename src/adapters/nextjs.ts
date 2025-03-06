import {EnvConfig} from "@/config";
import {createEnv, envStore} from "@/env";

/**
 * Next.js adapter
 * @param config Super Env configuration
 * @returns Next.js config wrapper
 */
export const withSuperEnv = (config: EnvConfig = {}) => {
    return (nextConfig: any = {}) => {
        const env = createEnv(config);

        return {
            ...nextConfig,
            env,
            // Automatically add public env variables to Next.js public runtime config
            publicRuntimeConfig: {
                ...nextConfig.publicRuntimeConfig,
                ...(config.publicPrefix
                    ? Object.entries(envStore)
                        .filter(([key]) => key.startsWith(config.publicPrefix!))
                        .reduce((acc, [key, { value }]) => ({ ...acc, [key]: value }), {})
                    : {})
            }
        };
    };
};
