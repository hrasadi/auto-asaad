const Program = require('../entities/Program').Program;
const LivePlaybackSchedulerMeta = require('../entities/LivePlaybackSchedulerMeta');

const AppContext = require('../AppContext');

const moment = require('moment');
const execSync = require('child_process').execSync;

class LiquidsoapProgram extends Program {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    doScheduleProgram(targetDate) {
        let targetLineup = AppContext.getInstance('LineupGenerator').
                                    LineupManager.getScheduledLineupFilePath(targetDate);

        this.LivePlaybackSchedulerMeta =
                                new LivePlaybackSchedulerMeta();

        let showStartTime = moment(this.ShowStartTime).subtract(1, 'minute');

        if (showStartTime.isBefore(moment())) {
            AppContext.getInstance().Logger.info(`Show ${this.CanonicalIdPath} start` +
                                                `time is passed. Skipping scheudling.`);
            return;
        }

        let showStartTimeString = showStartTime.format('YYYYMMDDHHmm.ss');

        let showSchedulerCmd = 'echo \'cd ' + __dirname +
                                '/bin; node playback-program-show.js ' +
                                AppContext.getInstance().CWD + ' ' +
                                targetLineup + ' ' +
                                this.CanonicalIdPath + ' \' | at -t ' +
                                showStartTimeString + ' 2>&1';

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
            AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob) {
            AppContext.getInstance().Logger.debug('Program show scheduler command is: ' +
                                                        showSchedulerCmd);
        } else {
            let ret = execSync(showSchedulerCmd, {
                encoding: 'utf-8',
            });

            this.LivePlaybackSchedulerMeta.ShowAt = this.ShowStartTime;

            // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
            this.LivePlaybackSchedulerMeta.ShowId = ret.split('\n')[1]
                                                        .split(' ')[1];
        }

        if (this.PreShow) {
            let preShowStartTime = moment(this.PreShowStartTime).subtract(1, 'minute');

            if (preShowStartTime.isBefore(moment())) {
                AppContext.getInstance().Logger
                                        .info(`PreShow ${this.CanonicalIdPath}` +
                                        `start time is passed. Skipping scheudling.`);
                return;
            }

            let preShowStartTimeString = preShowStartTime.format('YYYYMMDDHHmm.ss');

            let preShowSchedulerCmd =
                                'echo \'cd ' + __dirname +
                                '/bin; node playback-program-preshow.js ' +
                                AppContext.getInstance().CWD + ' ' +
                                targetLineup + ' ' +
                                this.CanonicalIdPath + ' ' +
                                this.PreShow.FillerClip ?
                                this.PreShow.FillerClip.Media.Path : '' +
                                ' \' | at -t ' +
                                preShowStartTimeString + ' 2>&1';

            if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
                AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob) {
                AppContext.getInstance().Logger.debug('PreShow scheduler command is: ' +
                                                        preShowSchedulerCmd);
            } else {
                let ret = execSync(preShowSchedulerCmd, {
                    encoding: 'utf-8',
                });

                this.LivePlaybackSchedulerMeta.PreShowAt =
                                                        this.PreShowStartTime;

                // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
                this.LivePlaybackSchedulerMeta.PreShowId = ret.split('\n')[1]
                                                                .split(' ')[1];
            }
        }
    }

    doUnscheduleProgram() {
        if (!this.LivePlaybackSchedulerMeta ||
            !this.LivePlaybackSchedulerMeta.ShowId) {
            return;
        }

        let preShowUnschedulingCmd = null;
        if (this.LivePlaybackSchedulerMeta &&
            this.LivePlaybackSchedulerMeta.ShowId) {
             preShowUnschedulingCmd = 'atrm ' +
                            this.LivePlaybackSchedulerMeta.PreShowId;
        }

        let showUnschedulingCmd = 'atrm ' +
                                    this.LivePlaybackSchedulerMeta.ShowId;

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
            AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob) {
            if (preShowUnschedulingCmd) {
                AppContext.getInstance().Logger.debug('PreShow unscheduler command is: ' +
                                                    preShowUnschedulingCmd);
            }
            AppContext.getInstance().Logger.debug('Show unscheduler command is: ' +
                                                        showUnschedulingCmd);
        } else {
            if (preShowUnschedulingCmd) {
                try {
                    execSync(preShowUnschedulingCmd);
                } catch (e) {
                    AppContext.getInstance().Logger.debug(
                                    'PreShow unschedule resturns non-empty: ' + e);
                }
            }

            try {
                execSync(showUnschedulingCmd);
            } catch (e) {
                AppContext.getInstance().Logger.debug(
                                'Show unschedule resturns non-empty: ' + e);
            }
        }
    }
}

module.exports = LiquidsoapProgram;
