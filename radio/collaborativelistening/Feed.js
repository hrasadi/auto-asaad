const AppContext = require('../AppContext');

const DBObject = require('./DBObject');
const DBProvider = require('./DBProvider');

const DateUtils = require('../DateUtils');

const moment = require('moment');
const fs = require('fs');

const FEED_CHECKING_FREQUENCY = 60000; // One minute

class Feed extends DBProvider {
    constructor(dbFileName, historyDbFileName) {
        super(dbFileName);

        if (historyDbFileName) {
            this._historyProdiver = new DBProvider(historyDbFileName);
        }

        // Set in persistent subclasses
        this._type = null;
    }

    // implemented in subclasses
    init(resolve) {
    }

    async init1(resolve) {
        await this.init0(resolve);
        if (this._historyProdiver) {
            await this._historyProdiver.init0(resolve);
        }
    }

    // implemented in subclasses
    registerProgram(program, targetDate) {
    }

    // implemented in subclasses
    deregisterFeedEntry(feedEntry) {
    }

    // implemented in subclasses
    async renderFeed(userId) {
    }

    foreachProgramStartingWithinMinute(nowEpoch, onFeedEntry) {
        return this.entryListForEach(this._type, {
            statement: 'ReleaseTimestamp <= ? AND ReleaseTimestamp >= ?',
            values: [nowEpoch, nowEpoch - 60],
        }, onFeedEntry);
    }

    foreachProgramEndingUntilNow(nowEpoch, onFeedEntry) {
        return this.entryListForEach(this._type, {
            statement: 'ExpirationTimestamp <= ?',
            values: nowEpoch,
        }, onFeedEntry);
    }

    // implemented in subclasses
    notifyProgramStart(feedEntry) {
    }

    // overriden in subclasses
    getWatcher() {
        return new FeedWatcher(this);
    }
}

class FeedWatcher {
    constructor(feed) {
        this._feed = feed;

        this._epochLockFilePath = AppContext.getInstance().CWD + '/run/db/' +
                                            this._feed.constructor.name + '-epoch.lock';
    }

    init() {
        let self = this;
        setInterval(() => this.tick(self), FEED_CHECKING_FREQUENCY);
        // Start with a firing
        this.tick(self);
    }

    tick(self) {
        let currentTimeEpoch = DateUtils.getEpochSeconds(moment());
        // check last persisted time (should be one minute before)
        if (self.LastProcessedEpoch +
            (FEED_CHECKING_FREQUENCY / 1000) != currentTimeEpoch) {
            AppContext.getInstance()
                    .Logger.warn('Watcher ' +
                            self._feed.constructor.name + ' has time inconsistencies. ' +
                            'Jumping from ' + self.LastProcessedEpoch + ' to ' +
                            currentTimeEpoch);
        }
        // One minute in (success path).
        // Check for programs released now. Notify listeners
        self._feed.foreachProgramStartingWithinMinute(currentTimeEpoch,
                                                            (err, feedEntry) => {
            if (err) {
                throw err;
            }
            self._feed.notifyProgramStart(feedEntry);
        });
        // Check for expired programs
        self._feed.foreachProgramEndingUntilNow(currentTimeEpoch, (err, feedEntry) => {
            if (err) {
                throw err;
            }
            self._feed.deregisterFeedEntry(feedEntry);
        });
        // Persist new epoch
        self.LastProcessedEpoch = currentTimeEpoch;
    }

    get LastProcessedEpoch() {
        if (this._lastProcessedEpoch) {
            return this._lastProcessedEpoch;
        }

        if (fs.existsSync(this._epochLockFilePath)) {
            return parseFloat(fs.readFileSync(this._epochLockFilePath), 'utf-8');
        } else {
            this._lastProcessedEpoch = DateUtils.getEpochSeconds(moment());
            return this._lastProcessedEpoch;
        }
    }

    set LastProcessedEpoch(value) {
        this._lastProcessedEpoch = value;
        fs.writeFileSync(this._epochLockFilePath, this._lastProcessedEpoch);
    }
}

class FeedEntry extends DBObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get Program() {
        return this._program;
    }

    set Program(value) {
        if (value) {
            this._program = value;
        }
    }

    get ReleaseTimestamp() {
        return this._releaseTimestamp;
    }

    set ReleaseTimestamp(value) {
        this._releaseTimestamp = value;
    }

    get ExpirationTimestamp() {
        return this._expirationTimestamp;
    }

    set ExpirationTimestamp(value) {
        this._expirationTimestamp = value;
    }
}

module.exports = {
    'Feed': Feed,
    'FeedWatcher': FeedWatcher,
    'FeedEntry': FeedEntry,
};
