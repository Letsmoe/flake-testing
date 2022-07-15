import * as fs from 'fs';
import * as path from 'path';
import { OutputObject } from './types';

export function getUtils() {
	return {
		getConfig: () => {
			return this.config
		},
		getOptions: () => {
			return this.options || {}
		},
		getFileContent: () => {
			return fs.readFileSync(this.absolutePath, "utf-8")
		}
	}
}