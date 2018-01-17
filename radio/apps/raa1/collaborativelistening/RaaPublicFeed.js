const P = require('../../../collaborativelistening/PublicFeed');
const PublicFeed = P.PublicFeed;
const PublicFeedWatcher = P.PublicFeedWatcher;
const PublicFeedEntry = P.PublicFeedEntry;

class Raa1PublicFeed extends PublicFeed {
    getWatcher() {
        return new Raa1PublicFeedWatcher(this);
    }
}

class Raa1PublicFeedWatcher extends PublicFeedWatcher {

}

module.exports = {
    'Raa1PublicFeed': Raa1PublicFeed,
    'Raa1PublicFeedWatcher': Raa1PublicFeedWatcher,
};
