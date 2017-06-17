var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var Utils = require('../../utils');
var LineupManager = require('../lineup-manager');

var StandaloneLineupManager = function(radioConfig, configFile) {
    this.configFilePath = path.resolve(configFile);
    var runningDir = require('path').dirname(configFile);

    LineupManager.call(this, radioConfig, runningDir);
}

Utils.inheritsFrom(StandaloneLineupManager, LineupManager);

StandaloneLineupManager.prototype.schedulePlayback = function(programTime, lineup) {
    
    // Estimate the shift in time required
    // We start from second 0 of the minute to prevent possible errors
    var preProgramTime = moment(programTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

    /** We should now register cron events **/
    // Register event using 'at'
    this.logger.info("PreProgram playback scheduled for " + moment(preProgramTime).format("YYYY-MM-DDTHH:mm:ss").toString())
    execSync("echo 'cd " + __dirname + "; node playback-pre-adhan.js " + this.configFilePath + " ' | at -t " + moment(preProgramTime).format("YYYYMMDDHHmm.ss").toString(), {
        encoding: 'utf-8'
    })

    // Register auto-asaad program announcement!
    this.logger.info("Program playback scheduled for " + moment(programTime).format("YYYY-MM-DDTHH:mm:ss").toString())
    execSync("echo 'cd " + __dirname + "; node playback-adhan.js' | at -t " + moment(programTime).format("YYYYMMDDHHmm.ss").toString(), {
        encoding: 'utf-8'
    })

} // implemented in subclasses


StandaloneLineupManager.prototype.getMediaDuration = function(media) {
    var cmd = 'afinfo ' + media.path + ' | awk \'/estimated duration/ { print $3 }\'';
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

module.exports = StandaloneLineupManager;
