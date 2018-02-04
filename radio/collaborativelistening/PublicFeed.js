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

        await this._db.runAsync(
            'CREATE TABLE IF NOT EXISTS PUBLICFEEDENTRY ' +
                '(Id TEXT PRIMARY_KEY, ' +
                'Program TEXT, Upvotes INTEGER, ReleaseTimestamp REAL,' +
                'ExpirationTimestamp REAL, unique(Id))'
        );
        await this._db.runAsync(
            'CREATE TABLE IF NOT EXISTS UPVOTES ' +
                '(UserId TEXT, ' +
                'ProgramId TEXT, Timestamp REAL,' +
                'PRIMARY KEY(UserId, ProgramId), unique(UserId), unique(ProgramId))'
        );

        if (this._historyProdiver) {
            await this._historyProdiver._db.runAsync(
                'CREATE TABLE IF NOT EXISTS PUBLICFEEDENTRY ' +
                    '(Id TEXT PRIMARY_KEY, ' +
                    'Program TEXT, Upvotes INTEGER, ReleaseTimestamp REAL,' +
                    'ExpirationTimestamp REAL, unique(Id))'
            );
            await this._historyProdiver._db.runAsync(
                'CREATE TABLE IF NOT EXISTS UPVOTES ' +
                    '(UserId TEXT ,' +
                    'ProgramId TEXT, Timestamp REAL,' +
                    'PRIMARY KEY(UserId, ProgramId), unique(UserId), unique(ProgramId))'
            );
        }

        this._type = PublicFeedEntry;
        this._tableName = 'PublicFeedEntry';
    }

    registerProgram(program, releaseMoment) {
        let feedEntry = new PublicFeedEntry();
        if (releaseMoment) {
            feedEntry.ReleaseTimestamp = DateUtils.getEpochSeconds(releaseMoment);
        } else {
            feedEntry.ReleaseTimestamp = DateUtils.getEpochSeconds(
                program.Metadata.StartTime
            );
        }

        feedEntry.ExpirationTimestamp = DateUtils.getEpochSeconds(
            moment.unix(feedEntry.ReleaseTimestamp).add(
                program.Publishing.ColloborativeListeningProps.DefaultLife,
                'hours')
        );
        feedEntry.Program = program;
        feedEntry.Upvotes = 0;

        // Delete any entries with same Id exists from before (old onces)
        this.deregisterEntry(feedEntry);

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
            AppContext.getInstance().Logger.debug(
                'Register program to public feed with entry: ' +
                    JSON.stringify(feedEntry, null, 2)
            );
        } else {
            this.persist(feedEntry);
        }
    }

    deregisterEntry(feedEntry) {
        this.unpersist({
            statement: 'Id = ?',
            values: feedEntry.Id,
        });
    }

    upvoteProgram(programId, userId) {
        // TODO:
        AppContext.getInstance().Logger.debug(
            'Upvote program Id ' + programId + ' by user ' + userId
        );
    }

    async renderFeed() {
        let now = DateUtils.getEpochSeconds(moment());
        return await this.entryListForAll(PublicFeedEntry, {
            statement: 'ReleaseTimestamp < ?', // skip programs planned for future
            values: now,
        });
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
