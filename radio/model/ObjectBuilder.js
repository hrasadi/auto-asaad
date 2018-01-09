const Box = require('./Box');

const Media = require('./media/Media');

const P = require('./Program');
const Program = P.Program;

class ObjectBuilder {
    constructor(types) {
        this._types = types;
    }

    buildBox(jsonOrOther, parent) {
        let Type =
            this._types.Box ? this._types.Box : Box;

        return this.createNew(Type, jsonOrOther, parent);
    }

    buildProgram(jsonOrOther, parent) {
        let Type =
            this._types.Program ? this._types.Program : Program;

        return this.createNew(Type, jsonOrOther, parent);
    }

    buildMedia(jsonOrOther, parent) {
        let Type =
            this._types.Media ? this._types.Media : Media;

        return this.createNew(Type, jsonOrOther, parent);
    }

    createNew(Type, jsonOrOther, parent) {
        return new (Type)(jsonOrOther, parent);
    }
}

module.exports = ObjectBuilder;
