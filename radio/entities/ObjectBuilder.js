class ObjectBuilder {
    constructor(types) {
        this._types = types;
    }

    buildOfType(Type, jsonOrOther, parent) {
        let evaluatedType = this._types[Type.name] ? this._types[Type.name] : Type;

        return this.createNew(evaluatedType, jsonOrOther, parent);
    }

    createNew(Type, jsonOrOther, parent) {
        return new (Type)(jsonOrOther, parent);
    }
}

module.exports = ObjectBuilder;
