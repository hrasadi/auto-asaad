const AppContext = require('../AppContext');
const DateUtils = require('../DateUtils');

const F = require('./Feed');
const Feed = F.Feed;
const FeedWatcher = F.FeedWatcher;
const FeedEntry = F.FeedEntry;

const moment = require('moment');
const uuid = require('uuid/v1');

class PublicFeed extends Feed {
    constructor(dbFileName, historyDbFileName) {
        super(dbFileName, historyDbFileName);
    }

    async init() {
        await this.init1();

        this._db.run(
            'CREATE TABLE IF NOT EXISTS PUBLICFEEDENTRY ' +
                '(Id TEXT PRIMARY_KEY, ' +
                'Program TEXT, Upvotes INTEGER, ReleaseTimestamp REAL,' +
                'ExpirationTimestamp REAL, unique(Id))'
        );
        this._db.run(
            'CREATE TABLE IF NOT EXISTS UPVOTES ' +
                '(UserId TEXT, ' +
                'ProgramId TEXT, Timestamp REAL,' +
                'PRIMARY KEY(UserId, ProgramId), unique(UserId), unique(ProgramId))'
        );

        if (this._historyProdiver) {
            this._historyProdiver._db.run(
                'CREATE TABLE IF NOT EXISTS PUBLICFEEDENTRY ' +
                    '(Id TEXT PRIMARY_KEY, ' +
                    'Program TEXT, Upvotes INTEGER, ReleaseTimestamp REAL,' +
                    'ExpirationTimestamp REAL, unique(Id))'
            );
            this._historyProdiver._db.run(
                'CREATE TABLE IF NOT EXISTS UPVOTES ' +
                    '(UserId TEXT ,' +
                    'ProgramId TEXT, Timestamp REAL,' +
                    'PRIMARY KEY(UserId, ProgramId), unique(UserId), unique(ProgramId))'
            );
        }

        this._type = PublicFeedEntry;
        this._tableName = 'PublicFeedEntry';
    }

    registerProgram(program) {
        let feedEntry = new PublicFeedEntry();
        feedEntry.ReleaseTimestamp = DateUtils.getEpochSeconds(
            program.Metadata.StartTime
        );
        feedEntry.ExpirationTimestamp = DateUtils.getEpochSeconds(
            program.Metadata.EndTime
        );
        feedEntry.Program = program;
        feedEntry.Upvotes = 0;

        this.persist(feedEntry);
    }

    deregisterEntry(feedEntry) {
        // TODO:
        AppContext.getInstance().Logger.debug('Program ' + feedEntry.Id +
                                                ' marked for deregistration.');
    }

    upvoteProgram(programId, userId) {
        // TODO:
        AppContext.getInstance().Logger.debug('Upvote program Id ' + programId +
                                                ' by user ' + userId);
    }

    renderFeed(onFeedRendered) {
        let now = DateUtils.getEpochSeconds(moment());
        this.entryListForAll(
            PublicFeedEntry,
            {
                statement: 'ReleaseTimestamp < ?', // skip programs planned for future
                values: now,
            },
            onFeedRendered
        );
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

        this._id = uuid();
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
    PublicFeed: PublicFeed,
    PublicFeedWatcher: PublicFeedWatcher,
    PublicFeedEntry: PublicFeedEntry,
};
