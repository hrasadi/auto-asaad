const L = require('./Lineup');
const Lineup = L.Lineup;

const Media = require('./media/Media');

class ObjectBuilder {
    constructor(types) {
        this._types = types;
    }

    buildLineup(jsonOrOther) {
        let Type =
            this._types.Lineup ? this._types.Lineup : Lineup;

        return this.createNew(Type, jsonOrOther);
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
