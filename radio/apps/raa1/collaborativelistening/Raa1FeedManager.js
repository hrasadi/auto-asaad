const F = require('../../../collaborativelistening/FeedManager');
const FeedManager = F.FeedManager;
const FeedWatcherManager = F.FeedWatcherManager;

class Raa1FeedManager extends FeedManager {
    constructor() {
        super();
    }
}

class Raa1FeedWatcherManager extends FeedWatcherManager {

}

module.exports = {
    'Raa1FeedManager': Raa1FeedManager,
    'Raa1FeedWatcherManager': Raa1FeedWatcherManager,
};
