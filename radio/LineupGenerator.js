const AppContext = require('./AppContext');

class LineupGenerator extends AppContext {
    constructor() {
        super();

        // Could be overriden in subclasses
        this._defaults = {
            'Publishing': {
                'ColloborativeListening': {
                    'DefaultLife': 24,
                    'MaxLife': 48,
                    'UpvoteBonus': 0.5,
                },
                'PodcastFeed': 'rss',
            },
            'Version': '3.0',
            'MaxPodcastEntries': 50,
        };

        // Could be overriden in subclasses
        // By very default, run with all switches on
        this._generatorOptions = {
            'ActiveStages': {
                'Plan': true,
                'Compile': true,
                'Publish': true,
                'Schedule': true,
            },
            'TestMode': false,
            'NoTTS': false,
            'PlanAheadDays': 5,
        };
    }

    // imlemented in subclasses
    initiate() {
    }

    run() {
        this.initiate();

        if (this.GeneratorOptions.ActiveStages.Plan) {
            this.LineupManager.planLineupRange(this._targetDate,
                                            this.GeneratorOptions.PlanAheadDays);
        } else {
            this.Logger.debug('Skipped stage "Plan" due to options settings');
        }

        if (this.GeneratorOptions.ActiveStages.Compile) {
            this.LineupManager.compileLineup(this._targetDate);
        } else {
            this.Logger.debug('Skipped stage "Compile" due to options settings');
        }

        if (this.GeneratorOptions.ActiveStages.Publish) {
            this.LineupManager.publishLineup(this._targetDate);
        } else {
            this.Logger.debug('Skipped stage "Publish" due to options settings');
        }

        if (this.GeneratorOptions.ActiveStages.Schedule) {
            this.LineupManager.scheduleLineup(this._targetDate);
        } else {
            this.Logger.debug('Skipped stage "Schedule" due to options settings');
        }
    }

    get GeneratorOptions() {
        return this._generatorOptions;
    }

    /**
     * These are the keys that would be replaced when not
     * provided by templates, must not be confused with the configuration itself.
     */
    get Defaults() {
        return this._defaults;
    }

    get LineupManager() {
        return this._lineupManager;
    }

    get LineupFileNamePrefix() {
        return this._lineupFileNamePrefix;
    }

    get ActionManager() {
        return this._actionManager;
    }

    get Publishers() {
        return this._publishers;
    }

    get Utils() {
        return this._utils;
    }

    get ProgramInfoDirectory() {
        return this._pinfoDirectory;
    }

    get MaxPodcastEntries() {
        return this._maxPodcastEntries ? this._maxPodcastEntries
                                        : this._defaults.MaxPodcastEntries;
    }
}

module.exports = LineupGenerator;
