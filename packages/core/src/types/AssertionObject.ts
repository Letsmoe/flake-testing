export type AssertionObject = {
	line: number;
	from: number;
	to: number;
	description: string;
	content: string;
	name: string;
	result: boolean;
	context: {[key: string]: string};
}