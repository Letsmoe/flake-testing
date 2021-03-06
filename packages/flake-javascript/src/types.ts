export type VariableDeclarationObject = acorn.Node & {
	declarations: any[];
	id: any;
	kind: string;
};

export type ImportObject = {
	source: string;
	specifiers: any[];
	from: number;
	to: number;
	line: number;
};
