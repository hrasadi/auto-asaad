const SerializableObject = require('../SerializableObject');

class MediaTemplate extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get MediaGroupName() {
        return this.getOrNull(this._mediaGroupName);
    }

    set MediaGroupName(value) {
        this._mediaGroupName = value;
    }

    get Iterator() {
        return this.getOrNull(this._iterator);
    }

    set Iterator(value) {
        this._iterator = value;
    }

    get Offset() {
        return this.getOrNull(this._offset);
    }

    set Offset(value) {
        this._offset = value;
    }
}

class Media extends SerializableObject {
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

    get Duration() {
        this.getOrNull(this._duration);
    }

    set Duration(value) {
        this._duration = value;
    }
}

module.exports = {
    'MediaTemplate': MediaTemplate,
    'Media': Media,
};
