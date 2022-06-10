export type SnapshotObject = {
	time: number;
	event: {
		type: string;
		line: number;
		from: number;
		to: number;
		name: string;
		value: any;
	},
	scope: {[key: string]: any}
}