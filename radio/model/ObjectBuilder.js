const L = require('./Lineup');
const Lineup = L.Lineup;

const Media = require('./media/Media');

class ObjectBuilder {
    constructor(types) {
        this._types = types;
    }

    buildLineup(jsonOrOther) {
        let Type =
            this._types.LineupClass ? this._types.LineupClass : Lineup;

        return this.createNew(Type, jsonOrOther);
    }

    buildMedia(jsonOrOther) {
        let Type =
        this._types.MediaClass ? this._types.MediaClass : Media;

        return this.createNew(Type, jsonOrOther);
    }

    createNew(Type, jsonOrOther) {
        return new (Type)(jsonOrOther);
    }
}

module.exports = ObjectBuilder;
