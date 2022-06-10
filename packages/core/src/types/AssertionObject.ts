export type AssertionObject = {
	line: number;
	from: number;
	to: number;
	description: string;
	content: string;
	result: boolean;
}