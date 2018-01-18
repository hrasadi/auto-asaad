const DateUtils = require('../DateUtils');

const F = require('./Feed');
const Feed = F.Feed;
const FeedWatcher = F.FeedWatcher;
const FeedEntry = F.FeedEntry;

const moment = require('moment');

class PublicFeed extends Feed {
    constructor(dbFileName) {
        super(dbFileName);
    }

    init() {
        let self = this;
        this.init0(() => {
            self._db.run('CREATE TABLE IF NOT EXISTS PUBLICFEEDENTRY ' +
                        '(Id TEXT PRIMARY_KEY, ' +
                        'Program TEXT, Upvotes INTEGER, ReleaseTimestamp REAL,' +
                        'ExpirationTimestamp REAL, unique(Id))');
        });

        this._type = PublicFeedEntry;
        this._tableName = 'PublicFeedEntry';
    }

    registerProgram(program) {
        let feedEntry = new PublicFeedEntry();
        feedEntry.ReleaseTimestamp =
                        DateUtils.getEpochSeconds(program.Metadata.StartTime);
        feedEntry.ExpirationTimestamp =
                        DateUtils.getEpochSeconds(program.Metadata.EndTime);
        feedEntry.Program = program;
        feedEntry.Upvotes = 0;

        this.persist(feedEntry);
    }

    deregisterEntry(feedEntry) {
        // TODO:
    }

    renderFeed(onFeedRendered) {
        let now = DateUtils.getEpochSeconds(moment());
        this.entryListForAll({
            statement: 'ReleaseTimestamp < ?', // skip programs planned for future
            values: now,
        }, onFeedRendered);
    }

    getWatcher() {
        return new PublicFeedWatcher(this);
    }
}

class PublicFeedWatcher extends FeedWatcher {
    constructor(feed) {
        super(feed);
    }
}

class PublicFeedEntry extends FeedEntry {
    constructor() {
        super();
    }

    get Program() {
        return this._program;
    }

    set Program(value) {
        this._program = value;
    }

    get Upvotes() {
        return this._upvotes;
    }

    set Upvotes(value) {
        this._upvotes = value;
    }
}

module.exports = {
    'PublicFeed': PublicFeed,
    'PublicFeedWatcher': PublicFeedWatcher,
    'PublicFeedEntry': PublicFeedEntry,
};
