const FeedEntry = require('./FeedEntry');

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

module.exports = PublicFeedEntry;
