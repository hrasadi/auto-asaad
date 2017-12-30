const SerializableObject = require('./SerializableObject');

const Context = require('../Context');

const C = require('./media/Counter');
const Counter = C.Counter;

const moment = require('moment');

class BaseClip extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get IsMainClip() {
        return this.getOrElse(this._isMainClip, false);
    }

    set IsMainClip(value) {
        if (typeof value === 'boolean') {
            this._isMainClip = value;
        } else {
            if (value && value.toLowerCase() === 'true') {
                this._isMainClip = true;
            } else {
                this._isMainClip = false;
            }
        }
    }
}

class ClipTemplate extends BaseClip {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        // REFERENCES
        this._parentShowTemplate = parent;
    }

    plan(targetDate, clipIndex) {
        let counterId = this._parentShowTemplate._parentProgramTemplate
                            ._parentBoxTemplate.BoxId + '-' +
                            this._parentShowTemplate
                            ._parentProgramTemplate.ProgramId + '-' +
                            this._parentShowTemplate.constructor.name + '-' +
                            clipIndex;

        // If the point is in future, the counter should be immutable
        let isImmutable =
            moment(targetDate)
                .isAfter(Context.LineupManager.BaseDate) ?
            true : false;

        let counter = Counter.createCounter(this.IteratorPolicy,
            counterId, this.MediaGroup.Media.length, isImmutable);

        let mediaIdx = counter.next(targetDate);
        if (mediaIdx == null) {
            return null;
        }

        let clipPlan = new ClipPlan(this);
        clipPlan.Media = this.MediaGroup.Media[mediaIdx].plan();

        return clipPlan;
    }

    get MediaGroupName() {
        return this.getOrNull(this._mediaGroupName);
    }

    set MediaGroupName(value) {
        this._mediaGroupName = value;
    }

    get MediaGroup() {
        return this._parentShowTemplate
            ._parentProgramTemplate._parentBoxTemplate
            ._parentLineupTemplate.MediaDirectory
            .getMediaGroup(this.MediaGroupName);
    }

    get IteratorPolicy() {
        return this.getOrNull(this._iteratorPolicy);
    }

    set IteratorPolicy(value) {
        this._iteratorPolicy = value;
    }

    get Offset() {
        return this.getOrNull(this._offset);
    }

    set Offset(value) {
        this._offset = value;
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
