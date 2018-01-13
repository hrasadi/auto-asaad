class FeedEntry {
    get ReleaseTimestamp() {
        return this._releaseTimestamp;
    }

    set ReleaseTimestamp(value) {
        this._releaseTimestamp = value;
    }

    get ExpiryTimestamp() {
        return this._expiryTimestamp;
    }

    set ExpiryTimestamp(value) {
        this._expiryTimestamp = value;
    }
}

module.exports = FeedEntry;
