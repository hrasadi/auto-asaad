const SerializableObject = require('../SerializableObject');

class MediaGroup extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    validate() {
        if (!this._path) {
            throw Error('Media must have Path property');
        }
    }

    get Path() {
        return this.getOrNull(this._path);
    }

    set Path(value) {
        this._path = value;
    }

    get Description() {
        return this.getOrNull(this._description);
    }

    set Description(value) {
        this._description = value;
    }

}

module.exports = MediaGroup;
