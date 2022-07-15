import { ImportObject } from "./ImportObject";
import { ResultObject } from "./ResultObject";
import { SnapshotObject } from "./SnapshotObject";
export declare type OutputObject = {
    inputFile: string;
    status?: boolean;
    result: ResultObject;
    imports: ImportObject[];
    snapshots: SnapshotObject[];
    startTime: number;
    endTime: number;
};
