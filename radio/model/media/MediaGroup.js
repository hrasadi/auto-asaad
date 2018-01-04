const Entity = require('../Entity');

const Media = require('./Media');

const Context = require('../../Context');

const fs = require('fs');

class MediaGroup extends Entity {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentMediaDirectory = parent;

        this.deflatePartial();
    }

    deflatePartial() {
        if (this.PartialConfigFilePath) {
            let partialConfigFilePrefix = Context.CWD + '/conf/partials/';

            let mediaInPartial = JSON.parse(
                fs.readFileSync(partialConfigFilePrefix +
                 this.PartialConfigFilePath, 'utf-8'));

            for (let mediaJson of mediaInPartial) {
                let media = new Media(mediaJson, this);
                this.Media.push(media);
            }
        }
    }

    get Name() {
        return this.getOrNull(this._name);
    }

    set Name(value) {
        this._name = value;
    }

    get PartialConfigFilePath() {
        return this.getOrNull(this._partialConfigFilePath);
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
        this._media = [];
        if (values) {
            for (let value of values) {
                let media = new Media(value, this);
                this._media.push(media);
            }
        }
    }
}

module.exports = MediaGroup;
