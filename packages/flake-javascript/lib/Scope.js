export default class Scope {
    constructor(initial = {}) {
        this.properties = initial;
    }
    set(name, value) {
        this.properties[name] = value;
    }
    get(name) {
        return this.properties[name];
    }
    getAll() {
        return Object.assign({}, this.properties);
    }
}
