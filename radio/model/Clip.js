const SerializableObject = require('./SerializableObject');

class BaseClip extends SerializableObject {
    static createTemplate(json) {
        if (typeof json.MediaGroup !== 'undefined') {
            return new ClipTemplate(json);
        } else if (typeof json.Path !== 'undefined') {
            return new Clip(json);
        }
        throw Error('Neither MediaGroup nor Path is defined.' +
            'Cannot decide the clip type');
    }

    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get IsMainClip() {
        return this.getOrElse(this._isMainClip, false);
    }

    set IsMainClip(value) {
        if (!value) {
            this._isMainClip = false;
        } else {
            this._isMainClip = true;
        }
    }
}

class ClipTemplate extends BaseClip {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get MediaGroup() {
        return this.getOrNull(this._mediaGroup);
    }

    set MediaGroup(value) {
        this._mediaGroup = value;
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

class Clip extends BaseClip {
    constructor(jsonOrOther) {
        super(jsonOrOther);
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

module.exports = {
    'ClipTemplate': ClipTemplate,
    'Clip': Clip,
};
