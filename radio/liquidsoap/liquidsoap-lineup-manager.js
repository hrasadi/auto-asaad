var execSync = require('child_process').execSync;
var moment = require('moment');
var path = require('path');

var OOUtils = require('../../utils');
var LineupManager = require('../lineup-manager');

var LineupCompiler = require('../lineup-operators/lineup-compiler').LineupCompiler;
var Scheduler = require('../lineup-operators/scheduler').Scheduler;
var PostOperator = require('../lineup-operators/post-operator').PostOperator;

var LiquidsoapLineupManager = function(radioConfig, cwd, radioObj) {
    LineupManager.call(this, radioConfig, cwd, radioObj);
}
OOUtils.inheritsFrom(LiquidsoapLineupManager, LineupManager);

LiquidsoapLineupManager.prototype.instantiateLineupCompiler = function() {
    return new LiquidsoapLineupCompiler();
}

LiquidsoapLineupManager.prototype.instantiateScheduler = function() {
    return new LiquidsoapScheduler();
}

LiquidsoapLineupManager.prototype.instantiatePostOperator = function() {
    return new LiquidsoapPostOperator();
}


/* Operators */
// LineupCompiler
var LiquidsoapLineupCompiler = function() {
    LineupCompiler.call(this);
}
OOUtils.inheritsFrom(LiquidsoapLineupCompiler, LineupCompiler);

LiquidsoapLineupCompiler.prototype.getMediaDuration = function(media) {
    var cmd = 'mp3info -p "%S" ' + media.Path;
    var mediaDuration = parseFloat(execSync(cmd, {
        encoding: 'utf-8'
    }));

    return mediaDuration;
} 

// Scheduler
var LiquidsoapScheduler = function() {
    Scheduler.call(this);
}
OOUtils.inheritsFrom(LiquidsoapScheduler, Scheduler);

LiquidsoapScheduler.prototype.schedulePlayback = function(compiledLineupFilePath, currentProgram, currentProgramIdx) {
    /** We should now register cron events **/
    // Register event using 'at'
    if (this.hasPreShow(currentProgram)) {

        var alignedPreShowStartTime = moment(currentProgram.PreShow.Meta.TentativeStartTime);
        // Register preshow and its filler if any
        this.context.logger().info("PreShow playback scheduled for " + alignedPreShowStartTime.format("YYYY-MM-DDTHH:mm:ss").toString());
        
        var preShowSchedulerCmd = "echo 'cd " + __dirname + "; ./playback-preshow.sh' " + compiledLineupFilePath + " " + currentProgramIdx + " | at -t " + alignedPreShowStartTime.subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString() + " 2>&1";
        if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {   
            var ret = execSync(preShowSchedulerCmd, {
                encoding: 'utf-8'
            });                    

            currentProgram.PreShow.Scheduler = {};
            currentProgram.PreShow.Scheduler.ScheduledAt = currentProgram.PreShow.Meta.TentativeStartTime;
            currentProgram.PreShow.Scheduler.SchedulerId = ret.split("\n")[1].split(" ")[1]; // The second token (e.g. "warning .... \n job xxx at Thu Jun 29 20:24:58 2017")
        } else {
            this.context.logger().debug("PreShow scheduler command is: " + preShowSchedulerCmd);
        }
    }

    // Register auto-asaad program (One minute earlier and the rest is handled in the shell file)
    var showSchedulerCmd = "echo 'cd " + __dirname + "; ./playback-show.sh' " + compiledLineupFilePath + " " + currentProgramIdx + "| at -t " + moment(currentProgram.Show.StartTime).subtract(1, 'minutes').format("YYYYMMDDHHmm.ss").toString() + " 2>&1";
    if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {
        this.context.logger().info("Show playback scheduled for " + moment(currentProgram.Show.StartTime).format("YYYY-MM-DDTHH:mm:ss").toString());
    
        var ret = execSync(showSchedulerCmd, {
            encoding: 'utf-8'
        });        
    
        currentProgram.Show.Scheduler = {};
        currentProgram.Show.Scheduler.ScheduledAt = currentProgram.Show.StartTime;
        currentProgram.Show.Scheduler.SchedulerId = ret.split("\n")[1].split(" ")[1]; // The second token (e.g. "job xxx at Thu Jun 29 20:24:58 2017")
    } else {
        this.context.logger().debug("Show scheduler command is: " + showSchedulerCmd);            
    }

}

LiquidsoapScheduler.prototype.unscheduleLineup = function(lineup) {
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

// Post Operator
var LiquidsoapPostOperator = function() {
    PostOperator.call(this);
}
OOUtils.inheritsFrom(LiquidsoapPostOperator, PostOperator);

LiquidsoapPostOperator.prototype.operate = function() {
    // TODO - A BIG ONE! (We definitely need to break this reverse dependency (liquidsoap to raa))
    // the var will be set only if in deploy mode. In the test mode, we do not create any side effects
    if (this.context.options.mode == 'deploy' && !this.context.options.noScheduling) {
        if (this.compiledLineupFilePath) {
            // Let Liquidsoap know that the lineup has been changed
            this.context.logger().info("Changing the current lineup file to " + this.compiledLineupFilePath);
            try {
                execSync("cd " + __dirname + "; ./update-lineup-file.sh " + this.compiledLineupFilePath, { encoding: 'utf-8' });        
            } catch (e) {
                    // telnet returns non-zero exit code, simply ignore it!
            }
        }
    } else {
        this.context.logger().debug("Lineup file to change to is: " + this.compiledLineupFilePath);
    }
}

module.exports = LiquidsoapLineupManager;
