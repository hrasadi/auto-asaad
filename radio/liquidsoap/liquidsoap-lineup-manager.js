var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var utils = require('../../utils');
var LineupManager = require('../lineup-manager');

var LiquidsoapLineupManager = function(radioConfig, cwd, radioObj) {
    LineupManager.call(this, radioConfig, cwd, radioObj);
}

utils.inheritsFrom(LiquidsoapLineupManager, LineupManager);

LiquidsoapLineupManager.prototype.onSchedulingComplete = function() {
    // Let Liquidsoap know that the lineup has been changed
    this.logger.info("Changing the current lineup file to " + this.today.compiledLineupFilePath);
    try {
        execSync("cd " + __dirname + "; ./update-lineup-file.sh " + this.today.compiledLineupFilePath + " " + this.today.compiledLineup.PlaylistStartIdx, {
            encoding: 'utf-8'
        });        
    } catch (e) {
            // telnet return non-zero exit codes, simply ignore them!
    }
}

LiquidsoapLineupManager.prototype.schedulePlayback = function(currentProgram, currentProgramIdx) {
    /** We should now register cron events **/
    // Register event using 'at'
    if (this.hasPreProgram(currentProgram)) {


        // Register preshow and its filler if any
        this.logger.info("PreShow playback scheduled for " + moment(currentProgram.PreShow.Meta.TentativeStartTime).format("YYYY-MM-DDTHH:mm:ss").toString());
        
        var ret = execSync("echo 'cd " + __dirname + "; ./playback-preshow.sh' " + this.today.compiledLineupFilePath + " " + currentProgramIdx + " | at -t " + moment(currentProgram.PreShow.Meta.TentativeStartTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString() + " 2>&1", {
            encoding: 'utf-8'
        });                    

        currentProgram.PreShow.Scheduler = {};
        currentProgram.PreShow.Scheduler.ScheduledAt = currentProgram.PreShow.Meta.TentativeStartTime;
        currentProgram.PreShow.Scheduler.SchedulerId = ret.split("\n")[1].split(" ")[1]; // The second token (e.g. "warning .... \n job xxx at Thu Jun 29 20:24:58 2017")
    }

    // Register auto-asaad program announcement! (One minute earlier and the rest is handled in the shell file)
    this.logger.info("Show playback scheduled for " + moment(currentProgram.Show.StartTime).format("YYYY-MM-DDTHH:mm:ss").toString());
    var ret = execSync("echo 'cd " + __dirname + "; ./playback-show.sh' " + this.today.compiledLineupFilePath + " " + currentProgramIdx + "| at -t " + moment(currentProgram.Show.StartTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString() + " 2>&1", {
        encoding: 'utf-8'
    });

    currentProgram.Show.Scheduler = {};
    currentProgram.Show.Scheduler.ScheduledAt = currentProgram.Show.StartTime;
    currentProgram.Show.Scheduler.SchedulerId = ret.split("\n")[1].split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
}

LiquidsoapLineupManager.prototype.getMediaDuration = function(media) {

    var cmd = 'mp3info -p "%S" ' + media.Path;
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

module.exports = LiquidsoapLineupManager;
