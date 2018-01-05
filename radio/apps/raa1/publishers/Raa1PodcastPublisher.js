const Context = require('../../../Context');

const PodcastPublisher = require('../../../publishers/PodcastPublisher');

const RollingList = require('./RollingList');

class Raa1PodcastPublisher extends PodcastPublisher {
    constructor() {
        super();

        this._rollingLists = {};
    }

    doPublish(program, targetDate) {
        // push program in rolling lineup
        let feedName = program.Publishing.PodcastFeed;
        if (!this._rollingLists[feedName]) {
            this._rollingLists[feedName] =
                    new RollingList(feedName, targetDate,
                                        Context.CWD + '/run/podcast/',
                                        Context.MaxPodcastEntries);
        }

        this._rollingLists[feedName].addItem(program);
    }

    commit() {
        for (let feedName in this._rollingLists) {
            if (this._rollingLists.hasOwnProperty(feedName)) {
                this._rollingLists[feedName].flush();
            }
        }
    }
}

module.exports = Raa1PodcastPublisher;
