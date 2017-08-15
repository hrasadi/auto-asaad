var fs = require('fs');
var fsextra = require('fs-extra');
var moment = require('moment');

var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

var Utils = require('./utils');

var LineupCompiler = function() {
    Stage.call(this, "LineupCompiler");
}
OOUtils.inheritsFrom(LineupCompiler, Stage);

LineupCompiler.prototype.perform = function(lineup) {
    this.lineup = lineup;
    
    var compiledLineup = this.compileLineup(this.context.options.currentDayMoment);

    return compiledLineup;
}

LineupCompiler.prototype.compileLineup = function(targetDateMoment) {
    var compiledLineupFilePath = this.generateCompilerLineupFilePath(targetDateMoment);
    // Backup the old compiled lineup, so that we can unschedule old lineup
    if (!this.context.options.mode == 'deploy') {
        if (this.fs.existsSync(compiledLineupFilePath)) {
            // cp            
            this.fsextra.copy(compiledLineupFilePath, compiledLineupFilePath + ".old", {force: true});
        }        
    }

    // we should flatten the programs and 'Unbox' them
    this.context.logger().debug("-- Compiling Lineup - Pass 0 (Unboxing programs)");
    this.unboxLineup();

    // Calculate the start and end times for all programs
    this.logger.debug("-- Compiling Lineup - Pass 1 (Timing)");
    this.arrangeLineupTiming();

    // // Validate that there is no overlap
    // this.logger.debug("-- Compiling Lineup - Pass 2 (Validation)");
    // if (i == 0) {
    //     if (!compiledLineup.Show.StartTime) {
    //         throw "The first program in the list should specify the start time. Aborting!";
    //     }
    // }
    // this.validateLineup();

    // Schedule the playback
    // this.logger.debug("Compiling Lineup - Pass 3 (Scheduling)");
    // this.scheduleLineupPlayback(oldCompiledLineupPrograms);

    // // Persist the compiled lineup
    // this.fs.writeFileSync(this.today.compiledLineupFilePath, JSON.stringify(this.today.compiledLineup, null, 2), 'utf-8');

    // // POST COMPILE EVENT IN THE RADIO (e.g. generate lineup web page etc.)
    // this.radio.onLineupCompiled(this.today.compiledLineup);

    if (this.context.options.verbose) {
        this.context.logger().info(JSON.stringify(this.lineup, null, 2));
    }

}

LineupCompiler.prototype.unboxLineup = function() {
    unboxedLineup = JSON.parse(JSON.stringify(this.lineup)); // Copy all fields (other than programs) from the planned lineup 
    delete unboxedLineup.Boxes;
    
    unboxedLineup.Programs = [];

    for (var i = 0; i < this.lineup.Boxes.length; i++) {
        if (this.lineup.Boxes[i].BoxId) {
            // this is a box (so unbox it!)
            for (var j = 0; j < this.lineup.Boxes[i].Programs.length; j++) {
                program = this.lineup.Boxes[i].Programs[j];
                program.BoxId = this.lineup.Boxes[i].BoxId;

                unboxedLineup.Programs.push(program);
            }
        } else {
            program = this.lineup.Boxes[i];
            program.BoxId = program.Id; // Program is a box for itself 
            unboxedLineup.Programs.push(program);
        }
    }

    this.lineup = unboxedLineup;
}

LineupCompiler.prototype.arrangeLineupTiming = function() {
    for (var i = 0; i < this.lineup.Programs.length; i++) {
        // Prepare compiled program object
        compiledProgram = {};
        Object.assign(compiledProgram, this.today.lineup.Programs[i]);

        this.calculateProgramTimes(this.today.lineup.Programs[i], compiledProgram);
        this.today.compiledLineup.Programs.push(compiledProgram);
    }
}

LineupCompiler.prototype.calculateProgramTimes = function(program, compiledProgram) {

    // Calculate the show start and end time
    compiledProgram.Show.Meta = {};

    // If this show is not scheduled for a specific time, then calculate timing
    // based on previous programs (and it should not have a pre-show program)
    if (program.Show.StartTime == undefined) {
        // Should start playback right after the last show
        var mostRecentProgram = this.today.compiledLineup.Programs[this.today.compiledLineup.Programs.length - 1];
        compiledProgram.Show.Meta.TentativeStartTime = mostRecentProgram.Show.Meta.TentativeEndTime;
    } else {
        compiledProgram.Show.StartTime = moment(program.Show.StartTime);
        compiledProgram.Show.Meta.TentativeStartTime = moment(program.Show.StartTime);
    }

    // Calculate the end time
    var totalShowDuration = 0;
    for (var i = 0; i < program.Show.Clips.length; i++) {
        var clip = program.Show.Clips[i]

        var clipDuration = this.getMediaDuration(clip);
        totalShowDuration += clipDuration;
        compiledProgram.Show.Clips[i].Duration = clipDuration;
    }

    compiledProgram.Show.Meta.TotalDuration = Math.ceil(totalShowDuration);
    compiledProgram.Show.Meta.TentativeEndTime = moment(compiledProgram.Show.Meta.TentativeStartTime).add(compiledProgram.Show.Meta.TotalDuration, 'seconds');

    // If there is a pre-show available calculate the timing for that too
    if (this.hasPreProgram(program)) {
        compiledProgram.PreShow.Meta = {};
        // Preshow ends when the main show begins
	compiledProgram.PreShow.Meta.TentativeEndTime = compiledProgram.Show.Meta.TentativeStartTime;

        // Calculate the start time of the preshow
        var totalPreShowDuration = 0;
        for (var i = 0; i < program.PreShow.Clips.length; i++) {
            var clip = program.PreShow.Clips[i]

            var clipDuration = this.getMediaDuration(clip);
            totalPreShowDuration += clipDuration;
            compiledProgram.PreShow.Clips[i].Duration = clipDuration;
        }

        compiledProgram.PreShow.Meta.TotalDuration = Math.ceil(totalPreShowDuration);
        compiledProgram.PreShow.Meta.TentativeStartTime = moment(compiledProgram.PreShow.Meta.TentativeEndTime).subtract(compiledProgram.PreShow.Meta.TotalDuration, 'seconds');
    }
}

LineupCompiler.prototype.validateLineup = function() {
    var latestEndTimeObserved = 0;
    for (var i = 0; i < this.today.compiledLineup.Programs.length; i++) {
        var currentProgram = this.today.compiledLineup.Programs[i];

        var currentProgramStartTime = this.hasPreProgram(currentProgram) ?
                        currentProgram.PreShow.Meta.TentativeStartTime :
                        currentProgram.Show.Meta.TentativeStartTime;

        if (currentProgramStartTime < latestEndTimeObserved) {
            throw "   Error: Program " + currentProgram.Id + " overlaps with the program before that.";
        } else {
            latestEndTimeObserved = currentProgramStartTime;
        }
    }
}

LineupCompiler.prototype.generateCompilerLineupFilePath = function(targetDateMoment) {
    return this.context.options.lineupFilePathPrefix + targetDateMoment.format("YYYY-MM-DD") + ".json.compiled";
}

// implemented in subclasses
LineupCompiler.prototype.getMediaDuration = function(media) {
    console.log("Not implemented!");
}

module.exports = {
    "LineupCompiler": LineupCompiler
}
