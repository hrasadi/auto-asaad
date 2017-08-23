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

    this.compiledLineup.PlaylistStartIdx = 0;

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
                this.compiledLineup.PlaylistStartIdx = i + 1;
                this.context.logger().warn("   WARN: Program " + currentProgram.Id + " start time is already passed. I do not schedule it.");
            }
        }
    }

    // Persist the compiled lineup
    if (this.context.options.mode == 'deploy') {   
         
        // Unschedule the old programs (if it should)
        var oldCompiledLineupFilePath = this.generateOldCompiledLineupFilePath(targetDateMoment);
        if (fs.existsSync(oldCompiledLineupFilePath)) {
            var oldCompiledLineupPrograms = JSON.parse(fs.readFileSync(oldCompiledLineupFilePath, 'utf-8')).Programs;
            this.unscheduleLineup(oldCompiledLineupPrograms);
            // Should we remove the old lineup? I donno! For now it is safe to keep it!
        }

        // Backup the old compiled lineup, so that we can unschedule old lineup later
        if (fs.existsSync(compiledLineupFilePath)) {
            // cp            
            fsextra.copy(compiledLineupFilePath, compiledLineupFilePath + ".old", {force: true});
        }        

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

Scheduler.prototype.generateOldCompiledLineupFilePath = function(targetDateMoment) {
    return this.generateCompilerLineupFilePath + ".old";
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
