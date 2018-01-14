const AppContext = require('../AppContext');

const LivePlaybackSchedulerMeta = require('../entities/LivePlaybackSchedulerMeta');
const Box = require('../entities/Box').Box;

const moment = require('moment');
const execSync = require('child_process').execSync;

class LiquidsoapBox extends Box {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    doScheduleBox(targetDate, boxIdx) {
        let lineupFilePath = AppContext.getInstance('LineupGenerator').LineupManager
                                .getScheduledLineupFilePath(targetDate);

        let boxStartTimeString = moment(this.StartTime)
                                        .format('YYYYMMDDHHmm.ss');
        let boxSchedulerCmd = 'echo \'cd ' + __dirname +
                                    '/bin; node playback-box.js ' +
                                    lineupFilePath +
                                    ' ' + boxIdx + '\' | at -t ' +
                                    boxStartTimeString + ' 2>&1';

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
            AppContext.getInstance().Logger.debug('Box scheduler command is: ' +
                                                        boxSchedulerCmd);
        } else {
            let ret = execSync(boxSchedulerCmd);

            this.LivePlaybackSchedulerMeta =
                                new LivePlaybackSchedulerMeta();
            this.LivePlaybackSchedulerMeta.ShowAt = this.StartTime;

            // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
            this.LivePlaybackSchedulerMeta.ShowId = ret.split(' ')[1];
        }
    }

    doUnscheduleBox(oldBox) {
        if (!this.LivePlaybackSchedulerMeta ||
            !this.LivePlaybackSchedulerMeta.ShowId) {
            return;
        }

        let boxUnschedulingCmd = 'atrm ' +
                                        this.LivePlaybackSchedulerMeta.ShowId;
        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
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
