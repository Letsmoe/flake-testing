import { comments } from "./shared.js";

export function every(comment: string) {
	comments["__main"] = comment;
}

export function group(group: string, comment: string) {
	comments[group] = comment
}