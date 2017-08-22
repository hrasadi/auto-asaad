var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var OOUtils = require('../../utils');
var LineupManager = require('../lineup-manager');

var LineupCompiler = require('../lineup-operators/lineup-compiler').LineupCompiler;
var Scheduler = require('../lineup-operators/scheduler').Scheduler;

var StandaloneLineupManager = function(radioConfig, cwd, radioObj) {
    LineupManager.call(this, radioConfig, cwd, radioObj);
}
OOUtils.inheritsFrom(StandaloneLineupManager, LineupManager);

StandaloneLineupManager.prototype.instantiateLineupCompiler = function() {
    return new StandaloneLineupCompiler();
}

StandaloneLineupManager.prototype.instantiateScheduler = function() {
    return new StandaloneScheduler();
}

/* Operators */
// LineupCompiler
var StandaloneLineupCompiler = function() {
    LineupCompiler.call(this);
}
OOUtils.inheritsFrom(StandaloneLineupCompiler, LineupCompiler);

StandaloneLineupCompiler.prototype.getMediaDuration = function(media) {
    var cmd = 'afinfo ' + media.Path + ' | awk \'/estimated duration/ { print $3 }\'';
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

var StandaloneScheduler = function() {
    Scheduler.call(this);
}
OOUtils.inheritsFrom(StandaloneScheduler, Scheduler);

StandaloneScheduler.prototype.schedulePlayback = function(compiledLineupFilePath, currentProgram) {    
    // Estimate the shift in time required
    // // We start from second 0 of the minute to prevent possible errors
    // var preProgramTime = moment(programTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

    /** We should now register cron events **/
    // Register event using 'at'
    if (this.hasPreShow(currentProgram)) {
        preShowStartTimeString = moment(currentProgram.PreShow.Meta.TentativeStartTime).format("YYYYMMDDHHmm.ss").toString();
        this.context.logger().info("PreShow playback scheduled for " + preShowStartTimeString);
        
        var preShowSchedulerCmd = "echo 'cd " + __dirname + "; node playback-pre-program.js " + compiledLineupFilePath + " " + currentProgram.PreShow.FillerClip.path + " ' | at -t " + preShowStartTimeString + " 2>&1";
        if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {   
            var ret = execSync(preShowSchedulerCmd, {
                encoding: 'utf-8'
            });

            currentProgram.PreShow.Scheduler = {};
            currentProgram.PreShow.Scheduler.ScheduledAt = currentProgram.PreShow.Meta.TentativeStartTime;
            currentProgram.PreShow.Scheduler.SchedulerId = ret.split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
        } else {
            this.context.logger().debug("PreShow scheduler command is: " + preShowSchedulerCmd);
        }
    }

    // Register auto-asaad program announcement!
    var showStartTimeString = moment(currentProgram.Show.StartTime).format("YYYYMMDDHHmm.ss").toString();
    var showSchedulerCmd = "echo 'cd " + __dirname + "; node playback-program.js' " + compiledLineupFilePath + " | at -t " + showStartTimeString + " 2>&1";
    if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {
        this.context.logger().info("Show playback scheduled for " + showStartTimeString);
    
        var ret = execSync(showSchedulerCmd, {
            encoding: 'utf-8'
        });        
    
        currentProgram.Show.Scheduler = {};
        currentProgram.Show.Scheduler.ScheduledAt = currentProgram.Show.StartTime;
        currentProgram.Show.Scheduler.SchedulerId = ret.split(" ")[1];; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
    } else {
        this.context.logger().debug("Show scheduler command is: " + showSchedulerCmd);            
    }
}

StandaloneScheduler.prototype.unscheduleLineup = function(lineup) {
    for (var i = 0; i < lineup.Programs.length; i++) {
        program = lineup.Programs[i];
        if (program.PreShow && program.PreShow.Scheduler) {
            // unschedule preshow
            cmd = 'atrm ' + program.PreShow.Scheduler.SchedulerId;
            
            if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {
                try {
                    execSync(cmd);
                } catch(e) {
                    this.logger.warn("Failed to remove job. Inner exception is: " + e);
               }
            } else {
                this.context.logger().debug("Unscheduling PreShow command is: " + cmd)
            }
        }

        if (program.Show.Scheduler) {
            // unschedule show
            cmd = 'atrm ' + program.Show.Scheduler.SchedulerId;

            if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {
                try {
                    execSync(cmd);
                } catch(e) {
                    this.logger.warn("Failed to remove job. Inner exception is: " + e);
               }
            } else {
                this.context.logger().debug("Unscheduling Show command is: " + cmd)
            }
        }
    }
}

module.exports = StandaloneLineupManager;
