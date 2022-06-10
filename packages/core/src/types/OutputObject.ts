import { ImportObject } from "./ImportObject";
import { ResultObject } from "./ResultObject";
import { SnapshotObject } from "./SnapshotObject";

export type OutputObject = {
	inputFile: string;
	testFile: string;
	identifier: string;
	status?: boolean;
	result: ResultObject;
	imports: ImportObject[];
	snapshots: SnapshotObject[],
	startTime: number;
	endTime: number;
}