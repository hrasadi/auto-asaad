var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var utils = require('../../utils');
var LineupManager = require('../lineup-manager');

var LiquidsoapLineupManager = function(radioConfig, configFile) {
    this.configFilePath = path.resolve(configFile);
    this.runningDir = path.resolve(path.dirname(configFile));
    this.config = radioConfig;

    LineupManager.call(this, radioConfig, this.runningDir);
}

utils.inheritsFrom(LiquidsoapLineupManager, LineupManager);

LiquidsoapLineupManager.prototype.schedulePlayback = function(programTime, lineup, lineupFilePath) {

    // Let Liquidsoap know that the lineup has been changed
    this.logger.info("Changing the current lineup file to " + lineupFilePath);

    try {
        execSync("cd " + __dirname + "; ./update-lineup-file.sh " + lineupFilePath, {
            encoding: 'utf-8'
        });        
    } catch (e) {
            // telnet return non-zero exit codes, simply ignore them!
    }

    // Estimate the shift in time required
    // We start from second 0 of the minute to prevent possible errors
    var preProgramTime = moment(programTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

    /** We should now register cron events **/
    // Register event using 'at'
    if (this.hasPreProgram) {
        this.logger.info("PreProgram playback scheduled for " + moment(preProgramTime).format("YYYY-MM-DDTHH:mm:ss").toString());
        execSync("echo 'cd " + __dirname + "; ./playback-pre-program.sh' | at -t " + moment(preProgramTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString() " 2>&1", {
            encoding: 'utf-8'
        });                    

        currentProgram.PreShow.Scheduler = {};
        currentProgram.PreShow.Scheduler.ScheduledAt = currentProgram.PreShow.Meta.TentativeStartTime;
        currentProgram.PreShow.Scheduler.SchedulerId = ret.split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
    }

    // Register auto-asaad program announcement! (One minute earlier and the rest is handled in the shell file)
    this.logger.info("Program playback scheduled for " + moment(programTime).format("YYYY-MM-DDTHH:mm:ss").toString());
    execSync("echo 'cd " + __dirname + "; ./playback-program.sh' " + lineupFilePath + "| at -t " + moment(programTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString() " 2>&1", {
        encoding: 'utf-8'
    });

    currentProgram.Show.Scheduler = {};
    currentProgram.Show.Scheduler.ScheduledAt = currentProgram.Show.Meta.TentativeStartTime;
    currentProgram.Show.Scheduler.SchedulerId = ret.split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
}

LiquidsoapLineupManager.prototype.getMediaDuration = function(media) {

    var cmd = 'mp3info -p "%S" ' + media.path;
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

module.exports = LiquidsoapLineupManager;
