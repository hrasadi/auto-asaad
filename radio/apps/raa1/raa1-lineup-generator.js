const Logger = require('../../../logger');
const DateUtils = require('../../DateUtils');

const ObjectBuilder = require('../../entities/ObjectBuilder');
const LineupGenerator = require('../../LineupGenerator');

const LineupManager = require('../../LineupManager');

const Raa1ActionManager = require('./lineupaction/Raa1ActionManager');

const StandaloneMedia = require('../../standalone/StandaloneMedia');
const StandaloneBox = require('../../standalone/StandaloneBox');
const StandaloneProgram = require('../../standalone/StandaloneProgram');
const LiquidsoapMedia = require('../../liquidsoap/LiquidsoapMedia');
const LiquidsoapBox = require('../../liquidsoap/LiquidsoapBox');
const LiquidsoapProgram = require('../../liquidsoap/LiquidsoapProgram');

const Raa1ClipUtils = require('./Raa1ClipUtils');

const Raa1PodcastPublisher = require('./publishers/Raa1PodcastPublisher');
const Raa1ArchivePublisher = require('./publishers/Raa1ArchivePublisher');

const fs = require('fs');
const moment = require('moment-timezone');
const program = require('commander');
const path = require('path');

class Raa1LineupGenerator extends LineupGenerator {
    constructor(proram) {
        super();

        this.parseProgramOptions(program);

        this._productionMode = (process.env.NODE_ENV == 'production') ? true : false;

        this._cwd = __dirname;

        let myName = path.basename(__filename, '.js');
        this._logger = new Logger(this._cwd + '/run/logs/' + myName + '.log');
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

        this._generatorOptions.PlanAheadDays = 5;

        this._confFilePath = program.args[0];
        this._pinfoDirectoryFilePath = program.args[1];

        this._lineupFileNamePrefix = 'raa1';
    }

    initiate() {
        try {
            this._conf = JSON.parse(fs.readFileSync(this._confFilePath));
        } catch (e) {
            this.Logger.error('Error parsing config file. Inner exception is: ' + e);
            process.exit(1);
        }

        this._objectBuilder = new ObjectBuilder({
            'Box': this._productionMode ? LiquidsoapBox : StandaloneBox,
            'Program': this._productionMode ? LiquidsoapProgram : StandaloneProgram,
            'Media': this._productionMode ? LiquidsoapMedia : StandaloneMedia,
        });

        this._lineupManager = new LineupManager();
        this._actionManager = new Raa1ActionManager();
        this._publishers = {
            'PodcastPublisher': new Raa1PodcastPublisher(),
            'ArchivePublisher': new Raa1ArchivePublisher(),
        };

        this._utils = new Raa1ClipUtils(this._conf);
        try {
            this._pinfoDirectory = JSON.parse(
                                    fs.readFileSync(this._pinfoDirectoryFilePath));
        } catch (e) {
            this.Logger.error('Error parsing program info directory file.' +
                                ' Inner exception is: ' + e);
            process.exit(1);
        }

        this._lineupManager.initiate(this._conf.Radio);
    }
}
/* === Entry Point === */
program
    .version('1.0.0')
    .option('-t --test', 'No side-effects. Only plans for the current day' +
                                                        'and entails \'-ns\' as well')
    .option('-c --no-planning', 'Use the current plan and start from compiling stage')
    .option('-s --no-tts', 'Do not call Text-to-Speech services.')
    .option('-j --no-at-job', 'Do not creat system jobs for boxes and interrupting ' +
                                'programs in system (no UNIX at call)')
    .option('-d --target-date [date]', 'Target date in YYYY-MM-DD format', moment)
    .parse(process.argv);

if (program.args.length < 2) {
    console.log('Usage: [NODE_ENV=production] node raa1.js OPTIONS' +
                '{config-file} {program-info-directory-file}');
    process.exit(1);
}

new Raa1LineupGenerator(program).run();
