var fs = require('fs');
var fsextra = require('fs-extra');
var moment = require('moment');

var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

var Utils = require('./utils');

var Scheduler = function() {
    Stage.call(this, "Scheduler");
}
OOUtils.inheritsFrom(Scheduler, Stage);

Scheduler.prototype.perform = function(compiledLineup) {
    this.compiledLineup = compiledLineup;
    
    this.scheduleLineupPlayback(this.context.options.currentDayMoment);

    return compiledLineup;
}

Scheduler.prototype.scheduleLineupPlayback = function(targetDateMoment) {

    this.compiledLineup.PlaylistStartIdx = 0;

    for (var i = 0; i < this.compiledLineup.Programs.length; i++) {
        var currentProgram = this.compiledLineup.Programs[i];

        // if the program is explicitly marked for scheduling (StartTime is
        // specified for it), do it!
        if (currentProgram.Show.StartTime) {
            // Note that we only schedule programs with a future start times.
            // Hence, we are not prune to scheduling problems if admins modify the
            // lineup midway throughout the day
            if (currentProgram.Show.StartTime.isAfter(moment())) {
                this.schedulePlayback(currentProgram, i);
            } else {
                this.compiledLineup.PlaylistStartIdx = i + 1;
                this.context.logger().warn("   WARN: Program " + currentProgram.Id + " start time is already passed. I do not schedule it.");
            }
        }
    }

    // Unschedule the old programs
    var oldCompiledLineupFilePath = this.generateCompilerLineupFilePath(targetDateMoment);
    if (fs.existsSync(oldCompiledLineupFilePath)) {
        var oldCompiledLineupPrograms = JSON.parse(fs.readFileSync(oldCompiledLineupFilePath, 'utf-8')).Programs;
        for (var i = 0; i < oldCompiledLineupPrograms.length; i++) {
            this.unschedulePlayback(oldCompiledLineupPrograms[i]);
            // Should we remove the old lineup? I donno! For now it is safe to keep it!
        }
    }
}

Scheduler.prototype.generateCompilerLineupFilePath = function(targetDateMoment) {
    return this.context.options.lineupFilePathPrefix + targetDateMoment.format("YYYY-MM-DD") + ".json.compiled.old";
}

// Implemented in subclasses
Scheduler.prototype.schedulePlayback = function(currentProgram, currentProgramIdx) {
    console.log("Not implemented!");
}

// Implemented in subclasses
Scheduler.prototype.unschedulePlayback = function(program) {
    console.log("Not implemented!");
}

module.exports = {
    "Scheduler": Scheduler
}
