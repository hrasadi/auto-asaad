/**
 * Container for CL functionality, instantiates all the workers and provides 
 * high level API.
 */
class CollabortiveListeningManager {
    constructor() {

    }

    initiate(config, mode) {
        // mode controls the feed clock state (name?)
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

module.exports = CollabortiveListeningManager;

