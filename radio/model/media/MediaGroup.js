const SerializableObject = require('../SerializableObject');

const Media = require('./Media');

const Context = require('../Context');

const fs = require('fs');

class MediaGroup extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    deflatePartial() {
        let result = new MediaGroup(this);

        if (result.PartialConfigFilePath) {
            let partialConfigFilePrefix = Context.CWD + '/conf/partials/';

            let mediaInPartial = JSON.parse(
                fs.readFileSync(partialConfigFilePrefix +
                 result.PartialConfigPath, 'utf-8'));

            result.PartialConfigPath.append(mediaInPartial);
        }
        return result;
    }

    get Name() {
        return this.getOrNull(this._name);
    }

    set Name(value) {
        this._name = value;
    }

    get PartialConfigFilePath() {
        this.getOrNull(this._partialConfigFilePath);
    }

    set PartialConfigFilePath(value) {
        this._partialConfigFilePath = value;
    }

    get Media() {
        return this.getOrElse(this._media, []);
    }

    /*
        Each media value contains a (Path, Description) tuple.
    */
    set Media(values) {
        if (values) {
            this._media = [];
            for (let value of values) {
                let media = new Media(value);
                this._media.push(media);
            }
        }
    }
}

module.exports = MediaGroup;
