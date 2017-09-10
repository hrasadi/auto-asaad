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
    
    compiledLineupFilePath = this.scheduleLineupPlayback(this.context.options.currentDayMoment);

    return compiledLineupFilePath;
}

Scheduler.prototype.scheduleLineupPlayback = function(targetDateMoment) {

    // The persisted value of PlaylistStartIdx should point to the index of previous program 
    // (-1 for first). This is to make sure the UI gets correct feeling about the next program
    this.compiledLineup.PlaylistStartIdx = -1;

    var compiledLineupFilePath = this.generateCompilerLineupFilePath(targetDateMoment);

    for (var i = 0; i < this.compiledLineup.Programs.length; i++) {
        var currentProgram = this.compiledLineup.Programs[i];

        // if the program is explicitly marked for scheduling (StartTime is
        // specified for it), do it!
        if (currentProgram.Show.StartTime) {
            // Note that we only schedule programs with a future start times.
            // Hence, we are not prune to scheduling problems if admins modify the
            // lineup midway throughout the day
            if (currentProgram.Show.StartTime.isAfter(moment())) {
                // the implementation is responsible to handling the mode
                this.schedulePlayback(compiledLineupFilePath, currentProgram, i);
            } else {
                this.compiledLineup.PlaylistStartIdx = i;
                this.context.logger().warn("   WARN: Program " + currentProgram.Id + " start time is already passed. I do not schedule it.");
            }
        }
    }

    // Unschedule the old programs (if there is any)
    // unschedule function is responsible for handling the mode
    if (fs.existsSync(compiledLineupFilePath)) {
        var oldCompiledLineup = JSON.parse(fs.readFileSync(compiledLineupFilePath, 'utf-8'));
        this.unscheduleLineup(oldCompiledLineup);
    }

    // Persist the compiled lineup
    if (this.context.options.mode == 'deploy') {           
        fs.writeFileSync(compiledLineupFilePath, JSON.stringify(this.compiledLineup, null, 2), 'utf-8');
        // Write the ".program.iter" file
        fs.writeFileSync(compiledLineupFilePath + '.program.iter', this.compiledLineup.PlaylistStartIdx);
        
        this.context.radio.onLineupCompiled(targetDateMoment, this.compiledLineup);
    }

    if (this.context.options.verbose) {
        this.context.logger().info(JSON.stringify(this.compiledLineup, null, 2));
    }

    return compiledLineupFilePath; // undefined if in test mode (which is expected behavior)
}

Scheduler.prototype.generateCompilerLineupFilePath = function(targetDateMoment) {
    return this.context.options.lineupFilePathPrefix + targetDateMoment.format("YYYY-MM-DD") + ".json.compiled";
}

// Implemented in subclasses
Scheduler.prototype.schedulePlayback = function(compiledLineupFilePath, currentProgram, currentProgramIdx) {
    console.log("Not implemented!");
}

// Implemented in subclasses
Scheduler.prototype.unscheduleLineup = function(lineup) {
    console.log("Not implemented!");
}

module.exports = {
    "Scheduler": Scheduler
}
