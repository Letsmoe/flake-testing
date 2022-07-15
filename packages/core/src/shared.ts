export const CURRENT_VERSION = "0.0.1";
export function safe_exit() {
	process.exit(0);
}

export function error(message: string) {
	console.error(message);
	process.exit(1);
}

export enum Reasons {
	JSON_PARSE_ERROR
}

export enum Properties {
	DEFAULT_FILE_EXTENSION,
	USE_REWRITE
}