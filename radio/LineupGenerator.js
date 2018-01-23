const AppContext = require('./AppContext');

const LineupManager = require('./LineupManager');

const fs = require('fs');

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
            'NoVODUpload': false,
            'NoAtJob': false,
            'PlanAheadDays': 5,
        };

        this._lineupManager = new LineupManager();
    }

    // imlemented in subclasses
    init() {
    }

    async run() {
        try {
            await this.init();

            // If admin locks a lineup plan, we skip planning it
            if (this.GeneratorOptions.ActiveStages.Plan &&
                !fs.existsSync(this.LineupManager.getLineupPlanFilePath + '.lock')) {
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
        } catch (error) {
            AppContext.getInstance().Logger.error(error.stack);
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

    get StartTimeCalculatorManager() {
        return this._startTimeCalculatorManager;
    }

    get PublicFeed() {
        return this._publicFeed;
    }

    get PersonalFeed() {
        return this._personalFeed;
    }

    get Publishers() {
        return this._publishers;
    }

    get ClipUtils() {
        return this._clipUtils;
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
