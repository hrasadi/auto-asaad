const AppContext = require('../../../AppContext');

const P = require('../../../collaborativelistening/PublicFeed');
const PublicFeed = P.PublicFeed;
const PublicFeedWatcher = P.PublicFeedWatcher;

class Raa1PublicFeed extends PublicFeed {
    getWatcher() {
        return new Raa1PublicFeedWatcher(this);
    }

    notifyProgramStart(feedEntry) {
        let message = 'برنامه‌ی جدید: ' + feedEntry.Program.Title;
        AppContext.getInstance('Raa1CLWatcher').UserManager
                                    .notifyAllUsers(message, feedEntry);
    }
}

class Raa1PublicFeedWatcher extends PublicFeedWatcher {
    constructor(feed) {
        super(feed);
    }
}

module.exports = {
    'Raa1PublicFeed': Raa1PublicFeed,
    'Raa1PublicFeedWatcher': Raa1PublicFeedWatcher,
};
