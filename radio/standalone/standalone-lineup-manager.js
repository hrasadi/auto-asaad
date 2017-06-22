var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var Utils = require('../../utils');
var LineupManager = require('../lineup-manager');

var StandaloneLineupManager = function(radioConfig, configFile) {
    this.configFilePath = path.resolve(configFile);
    var runningDir = path.resolve(path.dirname(configFile));
    this.config = radioConfig;

    LineupManager.call(this, radioConfig, runningDir);
}

Utils.inheritsFrom(StandaloneLineupManager, LineupManager);

StandaloneLineupManager.prototype.schedulePlayback = function(programTime, lineup, lineupFilePath) {
    
    // Estimate the shift in time required
    // We start from second 0 of the minute to prevent possible errors
    var preProgramTime = moment(programTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

    /** We should now register cron events **/
    // Register event using 'at'
    if (this.hasPreProgram) {
        this.logger.info("PreProgram playback scheduled for " + moment(preProgramTime).format("YYYY-MM-DDTHH:mm:ss").toString());
        var fillerPath = this.config.Media.BaseDir + this.config.Media.Filler[0].path
        execSync("echo 'cd " + __dirname + "; node playback-pre-program.js " + lineupFilePath + " " + fillerPath + " ' | at -t " + moment(preProgramTime).format("YYYYMMDDHHmm.ss").toString(), {
            encoding: 'utf-8'
        })        
    }

    // Register auto-asaad program announcement!
    this.logger.info("Program playback scheduled for " + moment(programTime).format("YYYY-MM-DDTHH:mm:ss").toString())
    execSync("echo 'cd " + __dirname + "; node playback-program.js' " + lineupFilePath + " | at -t " + moment(programTime).format("YYYYMMDDHHmm.ss").toString(), {
        encoding: 'utf-8'
    })

}

StandaloneLineupManager.prototype.getMediaDuration = function(media) {
    var cmd = 'afinfo ' + media.path + ' | awk \'/estimated duration/ { print $3 }\'';
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

module.exports = StandaloneLineupManager;
