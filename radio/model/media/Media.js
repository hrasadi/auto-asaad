const SerializableObject = require('../SerializableObject');

class Media extends SerializableObject {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        // REFERENCES
        this._parentMediaGroup = parent;
    }

    validate() {
        if (!this._path) {
            throw Error('Media must have Path property');
        }
    }

    plan() {
        let plannedMedia = new Media(this);
        plannedMedia.Path = this._parentMediaGroup
                            ._parentMediaDirectory.BaseDir +
                            '/' + this.Path;

        return plannedMedia;
    }

    compile() {
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

module.exports = Media;

