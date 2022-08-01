import { comments } from "./shared.js";
export function every(comment) {
    comments["__main"] = comment;
}
export function group(group, comment) {
    comments[group] = comment;
}
