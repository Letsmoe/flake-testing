import { SpecifierObject } from "./SpecifierObject";

export type ImportObject = { 
	line: number;
	from: number;
	to: number;
	source: string;
	specifiers: SpecifierObject[];
};