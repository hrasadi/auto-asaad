const AppContext = require('../AppContext');

const LivePlaybackSchedulerMeta = require('../entities/LivePlaybackSchedulerMeta');
const Box = require('../entities/Box').Box;

const moment = require('moment');
const execSync = require('child_process').execSync;

class LiquidsoapBox extends Box {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    doScheduleBox() {
        let targetLineupFilePath = AppContext.getInstance(
            'LineupGenerator'
        ).LineupManager.getScheduledLineupFilePath(this._parentLineup.LineupId);

        // we Active wait in the last minute to guarantee precision by seconds.
        let boxStartTime = moment(this.StartTime).subtract(1, 'minute');

        if (boxStartTime.isBefore(moment())) {
            AppContext.getInstance().Logger.info(
                `Box ${this.CanonicalIdPath} start` +
                    `time is passed. Skipping scheudling.`
            );
            return;
        }

        let boxStartTimeString = boxStartTime.format('YYYYMMDDHHmm.ss');

        let boxSchedulerCmd =
            'echo \'cd ' +
            __dirname +
            '/bin; ./play-box.sh ' +
            AppContext.getInstance().CWD +
            ' ' +
            targetLineupFilePath +
            ' "' +
            this.CanonicalIdPath +
            '"\' | at -t ' +
            boxStartTimeString +
            ' 2>&1';

        if (
            AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
            AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob
        ) {
            AppContext.getInstance().Logger.debug(
                'Box scheduler command is: ' + boxSchedulerCmd
            );
        } else {
            let ret = execSync(boxSchedulerCmd, {
                encoding: 'utf-8',
            });

            this.LivePlaybackSchedulerMeta = new LivePlaybackSchedulerMeta();
            this.LivePlaybackSchedulerMeta.ShowAt = this.StartTime;

            // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
            this.LivePlaybackSchedulerMeta.ShowId = ret.split('\n')[1].split(' ')[1];
        }
    }

    doUnscheduleBox(oldBox) {
        if (!this.LivePlaybackSchedulerMeta || !this.LivePlaybackSchedulerMeta.ShowId) {
            return;
        }

        let boxUnschedulingCmd = 'atrm ' + this.LivePlaybackSchedulerMeta.ShowId;
        if (
            AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
            AppContext.getInstance('LineupGenerator').GeneratorOptions.NoAtJob
        ) {
            AppContext.getInstance().Logger.debug(
                'Box unscheduler command is: ' + boxUnschedulingCmd
            );
        } else {
            try {
                execSync(boxUnschedulingCmd);
            } catch (e) {
                AppContext.getInstance().Logger.debug(
                    'Box unschedule resturns non-empty: ' + e
                );
            }
        }
    }
}

module.exports = LiquidsoapBox;
