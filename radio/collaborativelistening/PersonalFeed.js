const F = require('./Feed');
const Feed = F.Feed;
const FeedWatcher = F.FeedWatcher;
const FeedEntry = F.FeedEntry;

class PersonalFeed extends Feed {
    registerProgram(userId, program) {

    }

    getPublicFeed(userId) {

    }

    getWatcher() {
        return new PersonalFeedWatcher(this);
    }
}

class PersonalFeedWatcher extends FeedWatcher {

}

class PersonalFeedEntry extends FeedEntry {
    constructor() {
        super();
    }

    get Program() {
        return this._program;
    }

    set Program(value) {
        this._program = value;
    }
}

module.exports = {
    'PersonalFeed': PersonalFeed,
    'PersonalFeedWatcher': PersonalFeedWatcher,
    'PersonalFeedEntry': PersonalFeedEntry,
};
