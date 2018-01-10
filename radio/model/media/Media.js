const Entity = require('../Entity');

const Context = require('../../Context');

class Media extends Entity {
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
        // (Object.getPrototypeOf(this)) returns
        // a new object of the same child type
        // i.e. Standalone or LiquidSoap
        let plannedMedia = Context.LineupManager.RadioApp
                            .ObjectBuilder
                            .buildMedia(this, this._parentMediaGroup);
        plannedMedia.Path = Context.LineupManager.MediaDirectory.BaseDir +
                            '/' + this.Path;

        return plannedMedia;
    }

    // Impletemented in subclasses
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
        return this.getOrElse(this._duration, 0.0);
    }

    set Duration(value) {
        this._duration = parseFloat(value);
    }
}

module.exports = Media;

