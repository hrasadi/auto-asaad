const AppContext = require('../../../AppContext');

const PodcastPublisher = require('../../../publishers/PodcastPublisher');

const RollingList = require('../../../publishers/RollingList');

class Raa1PodcastPublisher extends PodcastPublisher {
    constructor() {
        super();
    }

    doPublish(program, targetDate) {
        // push program in rolling lineup
        let feedName = program.Publishing.PodcastFeed;
        if (!this._rollingListsDict[feedName]) {
            this._rollingListsDict[feedName] =
                    new RollingList(feedName, targetDate,
                                    AppContext.getInstance().CWD + '/run/podcast/',
                                    AppContext.getInstance('LineupGenerator')
                                                                    .MaxPodcastEntries);
        }

        this._rollingListsDict[feedName].addItem(program);
    }

    commit() {
        for (let feedName in this._rollingListsDict) {
            if (this._rollingListsDict.hasOwnProperty(feedName)) {
                this._rollingListsDict[feedName].flush();
                this.generateRSS(feedName);
            }
        }
    }
}

module.exports = Raa1PodcastPublisher;
