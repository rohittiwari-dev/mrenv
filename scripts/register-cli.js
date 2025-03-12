// This script helps to run the CLI as CommonJS
// It's only used for development/testing
// When installed globally, the shebang will handle this properly

// Force CommonJS mode for CLI
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("../dist/cli.cjs");
