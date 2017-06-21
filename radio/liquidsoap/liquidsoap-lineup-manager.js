var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var Utils = require('../../utils');
var LineupManager = require('../lineup-manager');

var LiquidsoapLineupManager = function(radioConfig, configFile) {
    this.configFilePath = path.resolve(configFile);
    this.runningDir = path.resolve(path.dirname(configFile));
    this.config = radioConfig;

    LineupManager.call(this, radioConfig, this.runningDir);
}

Utils.inheritsFrom(LiquidsoapLineupManager, LineupManager);

LiquidsoapLineupManager.prototype.schedulePlayback = function(programTime, lineup, lineupFilePath) {

    // Let Liquidsoap know that the lineup has been changed
    logger.info("Changing the current lineup file to " + lineupFilePath);
    execSync("cd " + __dirname + "; ./update-lineup-file.sh " + lineupFilePath, {
        encoding: 'utf-8'
    });


    // Estimate the shift in time required
    // We start from second 0 of the minute to prevent possible errors
    var preProgramTime = moment(programTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

    /** We should now register cron events **/
    // Register event using 'at'
    logger.info("PreProgram playback scheduled for " + moment(preProgramTime).format("YYYY-MM-DDTHH:mm:ss").toString());
    execSync("echo 'cd " + __dirname + "; ./playback-pre-program.sh' | at -t " + moment(preProgramTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString(), {
        encoding: 'utf-8'
    });

    // Register auto-asaad program announcement! (One minute earlier and the rest is handled in the shell file)
    logger.info("Program playback scheduled for " + moment(programTime).format("YYYY-MM-DDTHH:mm:ss").toString());
    execSync("echo 'cd" + __dirname + "; ./playback-program.sh' " + lineupFilePath + "| at -t " + moment(programTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString(), {
        encoding: 'utf-8'
    });
}

LiquidsoapLineupManager.prototype.getMediaDuration = function(media) {

    var cmd = 'mp3info -p "%S" ' + media.path;
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

module.exports = LiquidsoapLineupManager;
