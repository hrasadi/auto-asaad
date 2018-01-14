const Entity = require('../Entity');

const AppContext = require('../../AppContext');

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
        let plannedMedia = AppContext.getInstance().ObjectBuilder
                            .buildOfType(Media, this, this._parentMediaGroup);

        // In some cases, we want to use a media from outside the MediaDirectory
        // (example is TTS). For these cases, we use 'IsAbsolutePath' property.
        if (!this.IsAbsolutePath) {
            plannedMedia.Path = AppContext.getInstance('LineupGenerator')
                                        .LineupManager.MediaDirectory.BaseDir +
                                        '/' + this.Path;
        }

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

    get ShortDescription() {
        return this._shortDescription ? this._shortDescription :
                                this.getOrNull(this._description);
    }

    set ShortDescription(value) {
        this._shortDescription = value;
    }

    get Duration() {
        return this.getOrElse(this._duration, 0.0);
    }

    set Duration(value) {
        this._duration = parseFloat(value);
    }
}

module.exports = Media;

