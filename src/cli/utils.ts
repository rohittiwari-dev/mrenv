import * as fs from "fs";
import * as path from "path";

export function findProjectRoot(): string {
	let currentDir = process.cwd();

	while (currentDir !== path.parse(currentDir).root) {
		if (
			fs.existsSync(path.join(currentDir, "package.json")) ||
			fs.existsSync(path.join(currentDir, "tsconfig.json"))
		) {
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}

	return process.cwd();
}

export function determineOutputPath(projectRoot: string): string {
	if (fs.existsSync(path.join(projectRoot, "src"))) {
		return path.join(projectRoot, "src", "env.ts");
	}
	if (fs.existsSync(path.join(projectRoot, "app"))) {
		return path.join(projectRoot, "app", "_env.ts");
	}
	return path.join(projectRoot, "env.ts");
}

export function determineDeclarationPath(projectRoot: string): string {
	return path.join(projectRoot, "env.d.ts");
}

export function ensureDirectoryExists(filePath: string): void {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}
