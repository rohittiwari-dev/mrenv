import { defineConfig } from "tsup";
import { readFileSync } from "fs";
import { join } from "path";

// Read package version from package.json
let packageVersion = "1.0.0";
try {
	const packageJson = JSON.parse(
		readFileSync(join(process.cwd(), "package.json"), "utf-8"),
	);
	packageVersion = packageJson.version || "1.0.0";
} catch (error) {
	console.warn("Could not read package.json, using default version");
}

export default defineConfig([
	// Main library build
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
		clean: true,
		minify: true,
		treeshake: true,
		external: ["zod"],
		noExternal: [/.*/],
		define: {
			"process.env.PACKAGE_VERSION": JSON.stringify(packageVersion),
		},
		esbuildOptions(options) {
			options.platform = "neutral";
			options.target = ["es2020"];
		},
		bundle: true,
	},
	// CLI build - CommonJS only with proper Node.js compatibility
	{
		entry: ["src/cli.ts"],
		format: ["cjs"],
		platform: "node",
		target: "node16",
		dts: true,
		sourcemap: true,
		clean: false,
		minify: true,
		treeshake: true,
		external: ["zod"],
		noExternal: [/.*/],
		define: {
			"process.env.PACKAGE_VERSION": JSON.stringify(packageVersion),
		},
		banner: {
			js: "#!/usr/bin/env node\nrequire('source-map-support').install();",
		},
		esbuildOptions(options) {
			options.platform = "node";
			options.target = ["node16"];
		},
		bundle: true,
	},
]);
