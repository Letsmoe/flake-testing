import { AssertionObject } from "./AssertionObject";

export type ResultObject = {
	groups: {[key: string]: number[]};
	assertions: AssertionObject[];
}