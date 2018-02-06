const AppContext = require('../AppContext');

const LivePlaybackSchedulerMeta = require('../entities/LivePlaybackSchedulerMeta');
const Box = require('../entities/Box').Box;

const moment = require('moment');
const execSync = require('child_process').execSync;

class LiquidsoapBox extends Box {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    doScheduleBox(targetDate, boxIdx) {
        let targetLineup = AppContext.getInstance('LineupGenerator').
                                    LineupManager.getScheduledLineupFilePath(targetDate);

        let boxStartTimeString = moment(this.StartTime).subtract(1, 'minute')
                                                        .format('YYYYMMDDHHmm.ss');
        let boxSchedulerCmd = 'echo \'cd ' + __dirname +
                                    '/bin; node playback-box.js ' +
                                    AppContext.getInstance().CWD + ' ' +
                                    targetLineup + ' ' +
                                    this.CanonicalIdPath + '\' | at -t ' +
                                    boxStartTimeString + ' 2>&1';

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
            AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob) {
            AppContext.getInstance().Logger.debug('Box scheduler command is: ' +
                                                        boxSchedulerCmd);
        } else {
            let ret = execSync(boxSchedulerCmd, {
                encoding: 'utf-8',
            });

            this.LivePlaybackSchedulerMeta =
                                new LivePlaybackSchedulerMeta();
            this.LivePlaybackSchedulerMeta.ShowAt = this.StartTime;

            // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
            this.LivePlaybackSchedulerMeta.ShowId = ret.split('\n')[1].split(' ')[1];
        }
    }

    doUnscheduleBox(oldBox) {
        if (!this.LivePlaybackSchedulerMeta ||
            !this.LivePlaybackSchedulerMeta.ShowId) {
            return;
        }

        let boxUnschedulingCmd = 'atrm ' +
                                        this.LivePlaybackSchedulerMeta.ShowId;
        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
            AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob) {
            AppContext.getInstance().Logger.debug('Box unscheduler command is: ' +
                                                        boxUnschedulingCmd);
        } else {
            let ret = execSync(boxUnschedulingCmd);

            if (ret) {
                AppContext.getInstance().Logger.debug(
                                'Box unschedule resturns non-empty: ' + ret);
            }
        }
    }
}

module.exports = LiquidsoapBox;
