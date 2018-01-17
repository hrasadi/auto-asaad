const F = require('./Feed');
const Feed = F.Feed;
const FeedWatcher = F.FeedWatcher;
const FeedEntry = F.FeedEntry;

class PublicFeed extends Feed {
    registerProgram(program) {

    }

    getPublicFeed(userId) {

    }

    getWatcher() {
        return new PublicFeedWatcher(this);
    }
}

class PublicFeedWatcher extends FeedWatcher {

}

class PublicFeedEntry extends FeedEntry {
    constructor() {
        super();
        // TODO: set Id
    }

    get EntryId() {
        return this._entryId;
    }

    set EntryId(value) {
        this._entryId = value;
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
