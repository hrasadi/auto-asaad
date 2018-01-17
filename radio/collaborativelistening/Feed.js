const DBObject = require('./DBObject');
const DBProvider = require('./DBProvider');

const FEED_CHECKING_FREQUENCY = 60000; // One minute

class Feed extends DBProvider {
    constructor() {
        super();
    }

    // override in subclasses
    getWatcher() {
        return new FeedWatcher(this);
    }

}

class FeedWatcher {
    constructor(feed) {
        this._feed = feed;
        setInterval(this.tick, FEED_CHECKING_FREQUENCY);
    }

    tick() {
        // check time
        // check last persisted time (should be one minute before)
        // check for new released programs
        // check for expired programs
        // if more that one minute, cleanup at the end (too late to notify people)
    }
}

class FeedEntry extends DBObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

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

module.exports = {
    'Feed': Feed,
    'FeedWatcher': FeedWatcher,
    'FeedEntry': FeedEntry,
};
