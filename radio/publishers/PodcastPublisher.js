const Context = require('../Context');

const Program = require('../model/Program').Program;

const Publisher = require('./Publisher');

class PodcastPubliser extends Publisher {
    publish(program, targetDate) {
        let mergedClip = Context.LineupManager.RadioApp
                                .Utils.mergeClips(program.Show.Clips);
        let programToPublish = new Program(program, program._parentBoxPlan);
        programToPublish.Show.Clips = [mergedClip];
        programToPublish.Metadata.Duration = programToPublish.Show.Duration;

        // publish
        this.doPublish(programToPublish, targetDate);
    }

    // Implemented in subclasses (apps)
    doPublish(program, targetDate) {
    }
}

module.exports = PodcastPubliser;
