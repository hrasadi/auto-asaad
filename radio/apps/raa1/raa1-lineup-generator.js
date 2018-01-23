const Logger = require('../../../logger');
const DateUtils = require('../../DateUtils');

const ObjectBuilder = require('../../entities/ObjectBuilder');
const LineupGenerator = require('../../LineupGenerator');

const Raa1ActionManager = require('./lineupaction/Raa1ActionManager');
const Raa1StartTimeCalculatorManager =
                        require('./starttimecalculator/Raa1StartTimeCalculatorManager');

const StandaloneMedia = require('../../standalone/StandaloneMedia');
const StandaloneBox = require('../../standalone/StandaloneBox');
const StandaloneProgram = require('../../standalone/StandaloneProgram');
const LiquidsoapMedia = require('../../liquidsoap/LiquidsoapMedia');
const LiquidsoapBox = require('../../liquidsoap/LiquidsoapBox');
const LiquidsoapProgram = require('../../liquidsoap/LiquidsoapProgram');

const Raa1ClipUtils = require('./Raa1ClipUtils');

const Raa1PodcastPublisher = require('./publishers/Raa1PodcastPublisher');
const Raa1ArchivePublisher = require('./publishers/Raa1ArchivePublisher');

const RUF = require('./collaborativelistening/Raa1PublicFeed');
const Raa1PublicFeed = RUF.Raa1PublicFeed;
const RSF = require('./collaborativelistening/Raa1PersonalFeed');
const Raa1PersonalFeed = RSF.Raa1PersonalFeed;

const fs = require('fs');
const program = require('commander');
const path = require('path');

class Raa1LineupGenerator extends LineupGenerator {
    constructor(proram) {
        super();

        this.parseProgramOptions(program);

        this._productionMode = process.env.NODE_ENV == 'production' ? true : false;

        this._cwd = __dirname;

        let myName = path.basename(__filename, '.js');
        this._logger = new Logger(
            this._cwd + '/run/logs/' + myName + '.log',
            this._verboseLogging
        );
    }

    parseProgramOptions(program) {
        // One option to override them all!
        if (program.test) {
            this._generatorOptions.TestMode = true;
        }
        if (!program.planning) {
            this._generatorOptions.ActiveStages.Plan = false;
        }
        if (!program.atJob) {
            this._generatorOptions.NoAtJob = true;
        }
        if (!program.tts) {
            this._generatorOptions.NoTTS = true;
        }

        if (program.targetDate) {
            this._targetDate = program.targetDate;
        } else {
            // Current date (earliest tz on earth)
            this._targetDate = DateUtils.getTodayString();
        }

        if (program.planAheadDays) {
            this._generatorOptions.PlanAheadDays = program.planAheadDays;
        }

        if (program.verbose) {
            this._verboseLogging = true;
        }

        this._confFilePath = program.args[0];
        this._pinfoDirectoryFilePath = program.args[1];
    }

    async init() {
        try {
            this._conf = JSON.parse(fs.readFileSync(this._confFilePath));
        } catch (e) {
            this.Logger.error('Error parsing config file. Inner exception is: ' + e);
            process.exit(1);
        }

        this._lineupFileNamePrefix = 'raa1';
        this._lineupManager.init(this._conf.LineupTemplate);

        this._objectBuilder = new ObjectBuilder({
            Box: this._productionMode ? LiquidsoapBox : StandaloneBox,
            Program: this._productionMode ? LiquidsoapProgram : StandaloneProgram,
            Media: this._productionMode ? LiquidsoapMedia : StandaloneMedia,
        });

        this._actionManager = new Raa1ActionManager();
        this._startTimeCalculatorManager =
                                new Raa1StartTimeCalculatorManager(this._conf.Adhan);
        this._publishers = {
            PodcastPublisher: new Raa1PodcastPublisher(),
            ArchivePublisher: new Raa1ArchivePublisher(),
        };

        this._clipUtils = new Raa1ClipUtils(this._conf.Credentials);
        try {
            this._pinfoDirectory = JSON.parse(
                fs.readFileSync(this._pinfoDirectoryFilePath)
            );
        } catch (e) {
            this.Logger.error(
                'Error parsing program info directory file.' + ' Inner exception is: ' + e
            );
            process.exit(1);
        }

        // Feeds
        this._publicFeed = new Raa1PublicFeed(
            this._conf.CollaborativeListening.FeedDBFile
        );
        this._publicFeed = new Raa1PersonalFeed(
            this._conf.CollaborativeListening.FeedDBFile
        );
        // this._personalFeed = new Raa1PersonalFeed('feed.db');
        await this._publicFeed.init();
    }
}

/* === Entry Point === */
program
    .version('1.0.0')
    .option(
        '-t --test',
        'No side-effects. Only plans for the current day and entails \'-js\' as well'
    )
    .option('-c --no-planning', 'Use the current plan and start from compiling stage')
    .option('-s --no-tts', 'Do not call Text-to-Speech services.')
    .option(
        '-j --no-at-job',
        'Do not creat system jobs for boxes and interrupting ' +
            'programs in system (no UNIX at call)'
    )
    .option('-d --target-date [date]', 'Target date in YYYY-MM-DD format')
    .option('-p --plan-ahead-days [integer]', 'Number of days to plan')
    .option(
        '-v --verbose',
        'Verbose loggging (enabled by default in non-production mode)'
    )
    .parse(process.argv);

if (program.args.length < 2) {
    console.log(
        'Usage: [NODE_ENV=production] node raa1-lineup-generator.js OPTIONS ' +
            '{config-file} {program-info-directory-file}'
    );
    process.exit(1);
}

new Raa1LineupGenerator(program).run();
