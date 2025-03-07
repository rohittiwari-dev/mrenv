import {defineConfig} from "tsup"

export default defineConfig([
    {
        entry: ["src/index.ts"],
        outDir: "dist/",
        format: ["esm", "cjs"],
        external: ["zod"],
    },
    {
        entry: ["src/cli/index.ts"],
        outDir: "dist/cli",
        format: ["cjs"]
    },
])