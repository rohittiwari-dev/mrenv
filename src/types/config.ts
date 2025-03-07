export interface mrenvConfig {
	runtime?: "node" | "browser" | "edge" | "auto";
	protectEnv?: boolean;
	publicPrefix?: string;
	schema?: Record<string, SchemaDefinition>;
	paths?: string[];
	onValidationError?: (errors: ValidationError[]) => void;
}

export interface SchemaDefinition {
	type: "string" | "number" | "boolean" | "array" | "object";
	required?: boolean;
	default?: any;
	description?: string;
	enum?: any[];
	pattern?: string;
	transform?: (value: any) => any;
}

export interface ValidationError {
	key: string;
	message: string;
	value?: any;
}

export interface EnvResult<T = Record<string, any>> {
	env: T;
	errors: ValidationError[];
	reload: () => EnvResult<T>;
}
