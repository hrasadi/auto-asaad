const AppContext = require('../AppContext');
const DateUtils = require('../DateUtils');

const F = require('./Feed');
const Feed = F.Feed;
const FeedWatcher = F.FeedWatcher;
const FeedEntry = F.FeedEntry;

const U = require('../collaborativelistening/UserManager');
const User = U.User;

const moment = require('moment-timezone');
const uuid = require('uuid/v1');

class PersonalFeed extends Feed {
    constructor(dbFileName, historyDbFileName) {
        super(dbFileName, historyDbFileName);
    }

    async init() {
        await this.init1();

        await this._db.runAsync(
            'CREATE TABLE IF NOT EXISTS PERSONALFEEDENTRY ' +
                '(Id TEXT PRIMARY_KEY, ' +
                'Program TEXT, UserId INTEGER, ReleaseTimestamp REAL,' +
                'ExpirationTimestamp REAL, unique(Id))'
        );

        if (this._historyProdiver) {
            await this._historyProdiver._db.runAsync(
                'CREATE TABLE IF NOT EXISTS PERSONALFEEDENTRY ' +
                    '(Id TEXT PRIMARY_KEY, ' +
                    'Program TEXT, UserId INTEGER, ReleaseTimestamp REAL,' +
                    'ExpirationTimestamp REAL, unique(Id))'
            );
        }

        this._type = PersonalFeedEntry;
        this._tableName = 'PersonalFeedEntry';
    }

    registerProgram(program, targetDate) {
        // TODO: Remove old entries (if regenerating the lineup)
        let self = this;
        this.entryListForEach(User, null, (err, user) => {
            let releaseMoment = program._parentBox.Schedule.calculateStartTime(
                targetDate,
                user
            );
            self.registerProgramForUser(program, releaseMoment, user.Id);
        });
    }

    async registerProgramForUser(program, releaseMoment, userId) {
        let feedEntry = new PersonalFeedEntry();

        feedEntry.UserId = userId;

        if (releaseMoment) {
            feedEntry.ReleaseTimestamp = DateUtils.getEpochSeconds(releaseMoment);
        } else {
            feedEntry.ReleaseTimestamp = DateUtils.getEpochSeconds(
                program.Metadata.StartTime
            );
        }

        feedEntry.ExpirationTimestamp = DateUtils.getEpochSeconds(
            moment
                .unix(feedEntry.ReleaseTimestamp)
                .add(program.Metadata.Duration, 'seconds')
        );
        feedEntry.Program = program;

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
            AppContext.getInstance().Logger.debug(
                'Register program to personal feed with entry: ' +
                    JSON.stringify(feedEntry, null, 2)
            );
        } else {
            await this.persist(feedEntry);
        }
    }

    deregisterEntry(feedEntry) {
        // TODO:
        AppContext.getInstance().Logger.debug(
            'Program ' + feedEntry.Id + ' marked for deregistration.'
        );
    }

    async renderFeed() {
        let now = DateUtils.getEpochSeconds(moment());
        return await this.entryListForAll(PersonalFeedEntry, {
            statement: 'ReleaseTimestamp < ?', // skip programs planned for future
            values: now,
        });
    }

    getWatcher() {
        return new PersonalFeedWatcher(this);
    }
}

class PersonalFeedWatcher extends FeedWatcher {
    constructor(feed) {
        super(feed);
    }
}

class PersonalFeedEntry extends FeedEntry {
    constructor() {
        super();

        this._id = uuid();
    }

    /**
     * Foreign key to the target user id
     */
    get UserId() {
        return this._userId;
    }

    set UserId(value) {
        this._userId = value;
    }
}

module.exports = {
    PersonalFeed: PersonalFeed,
    PersonalFeedWatcher: PersonalFeedWatcher,
    PersonalFeedEntry: PersonalFeedEntry,
};
