/**
 * Container for CL functionality, instantiates all the workers and provides
 * high level API.
 */
class FeedManager {
    constructor() {

    }

    initiate(config) {
    }

    get PersonalFeed() {
        return this._personalFeed;
    }

    get PublicFeed() {
        return this._publicFeed;
    }

    get UserManager() {
        return this._userManager;
    }
}

class FeedWatcherManager {
    constructor(feedManager) {
        this._personalFeedWatcher = feedManager._personalFeed.getWatcher();
        this._publicFeedWatcher = feedManager._publicFeed.getWatcher();
        this._userManager = feedManager._userManager;
    }

    initiate(config) {
    }

    get PersonalFeedWatcher() {
        return this._personalFeedWatcher;
    }

    get PublicFeedWatcher() {
        return this._publicFeedWatcher;
    }

    get UserManager() {
        return this._userManager;
    }
}

module.exports = {
    'FeedManager': FeedManager,
    'FeedWatcherManager': FeedWatcherManager,
};
