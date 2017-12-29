const SerializableObject = require('./SerializableObject');

const M = require('./media/Media');
const MediaTemplate = M.MediaTemplate;

class BaseClip extends SerializableObject {
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

    plan(targetDateMoment) {
        
    }

    get MediaTemplate() {
        return this.getOrNull(this._mediaTemplate);
    }

    set MediaTemplate(value) {
        if (value) {
            this._mediaTemplate = new MediaTemplate(value);
        }
    }
}

class ClipPlan extends BaseClip {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get Media() {
        return this.getOrNull(this._media);
    }

    set Media(value) {
        this._media = value;
    }
}

class Clip extends ClipPlan {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get Media() {
        return this.getOrNull(this._media);
    }

    set Media(value) {
        this._media = value;
    }
}

module.exports = {
    'ClipTemplate': ClipTemplate,
    'ClipPlan': ClipPlan,
    'Clip': Clip,
};
