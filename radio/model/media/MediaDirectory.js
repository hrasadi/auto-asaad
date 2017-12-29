const SerializableObject = require('../SerializableObject');

const MediaGroup = require('./MediaGroup');

class MediaDirectory extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get BaseDir() {
        return this.getOrNull(this._baseDir);
    }

    set BaseDir(value) {
        this._baseDir = value;
    }

    get MediaGroups() {
        return this.getOrNull(this._mediaGroups);
    }

    set MediaGroups(values) {
        if (values) {
            this._mediaGroups = [];
            for (let value of values) {
                let mediaGroup = new MediaGroup(value);
                this._mediaGroups.push(mediaGroup);
            }
        }
    }
}

module.exports = MediaDirectory;
