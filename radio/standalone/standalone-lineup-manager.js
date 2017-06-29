var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var utils = require('../../utils');
var LineupManager = require('../lineup-manager');

var StandaloneLineupManager = function(radioConfig, cwd, radioObj) {
    LineupManager.call(this, radioConfig, cwd, radioObj);
}

utils.inheritsFrom(StandaloneLineupManager, LineupManager);

StandaloneLineupManager.prototype.schedulePlayback = function(currentProgram) {
    
    // Estimate the shift in time required
    // // We start from second 0 of the minute to prevent possible errors
    // var preProgramTime = moment(programTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

    /** We should now register cron events **/
    // Register event using 'at'
    if (this.hasPreProgram(currentProgram)) {
        preShowStartTimeString = moment(currentProgram.PreShow.Meta.TentativeStartTime).format("YYYYMMDDHHmm.ss").toString();
        this.logger.info("PreShow playback scheduled for " + preShowStartTimeString);
        var ret = execSync("echo 'cd " + __dirname + "; node playback-pre-program.js " + this.today.lineupFilePath + " " + currentProgram.PreShow.FillerClip.path + " ' | at -t " + preShowStartTimeString + " 2>&1", {
            encoding: 'utf-8'
        });

        currentProgram.PreShow.Scheduler = {};
        currentProgram.PreShow.Scheduler.ScheduledAt = currentProgram.PreShow.Meta.TentativeStartTime;
        currentProgram.PreShow.Scheduler.SchedulerId = ret.split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
    }

    // Register auto-asaad program announcement!
    showStartTimeString = moment(currentProgram.Show.Meta.TentativeStartTime).format("YYYYMMDDHHmm.ss").toString();
    this.logger.info("Show playback scheduled for " + showStartTimeString)
    var ret = execSync("echo 'cd " + __dirname + "; node playback-program.js' " + this.today.lineupFilePath + " | at -t " + showStartTimeString + " 2>&1", {
        encoding: 'utf-8'
    });

    currentProgram.Show.Scheduler = {};
    currentProgram.Show.Scheduler.ScheduledAt = currentProgram.Show.Meta.TentativeStartTime;
    currentProgram.Show.Scheduler.SchedulerId = ret.split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")

}

StandaloneLineupManager.prototype.getMediaDuration = function(media) {
    var cmd = 'afinfo ' + media.path + ' | awk \'/estimated duration/ { print $3 }\'';
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

module.exports = StandaloneLineupManager;
