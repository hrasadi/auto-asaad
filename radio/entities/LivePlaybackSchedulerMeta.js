const SerializableObject = require('../entities/SerializableObject');

class LivePlaybackSchedulerMeta extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get PreShowAt() {
        return this.getOrNull(this._preShowAt);
    }

    set PreShowAt(value) {
        this._preShowAt = value;
    }

    get PreShowId() {
        return this.getOrNull(this._preShowId);
    }

    set PreShowId(value) {
        this._preShowId = value;
    }

    get ShowAt() {
        return this.getOrNull(this._showAt);
    }

    set ShowAt(value) {
        this._showAt = value;
    }

    get ShowId() {
        return this.getOrNull(this._showId);
    }

    set ShowId(value) {
        this._showId = value;
    }
}

module.exports = LivePlaybackSchedulerMeta;
