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
    // we should flatten the programs and 'Unbox' them
    this.context.logger().debug("-- Compiling Lineup - Pass 0 (Unboxing programs)");
    var unboxedLineup = this.unboxLineup();

    // Calculate the start and end times for all programs
    this.context.logger().debug("-- Compiling Lineup - Pass 1 (Timing)");
    var compiledLineup = this.arrangeLineupTiming(unboxedLineup);

    compiledLineup.Version = this.lineup.Version; // Preserve the lineup syntax version

    // TODO check that first program is scheduled for a specific time

    // Validate that there is no overlap
    this.context.logger().debug("-- Compiling Lineup - Pass 2 (Validation)");
    this.validateLineup(compiledLineup);

    return compiledLineup;
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

                // Add start time to the first program if it does not have any
                if (j == 0 && !program.StartTime) {
                    program.Show.StartTime = this.lineup.Boxes[i].StartTime;
                }

                unboxedLineup.Programs.push(program);
            }
        } else {
            program = this.lineup.Boxes[i];
            program.BoxId = program.Id; // Program is a box for itself 
            unboxedLineup.Programs.push(program);
        }
    }

    return unboxedLineup;
}

LineupCompiler.prototype.arrangeLineupTiming = function(unboxedLineup) {
    var compiledLineup = {};
    compiledLineup.Programs = [];

    for (var i = 0; i < unboxedLineup.Programs.length; i++) {
        
        // Copy all data from planned program to compiled version (and complete the fields)
        var compiledProgram = JSON.parse(JSON.stringify(unboxedLineup.Programs[i]));

        this.calculateProgramTiming(unboxedLineup.Programs[i], compiledProgram, compiledLineup);
        compiledLineup.Programs.push(compiledProgram);
    }

    return compiledLineup;
}

LineupCompiler.prototype.calculateProgramTiming = function(program, compiledProgram, intermediateCompiledLineup) {

    // Calculate the show start and end time
    compiledProgram.Show.Meta = {};

    // If this show is not scheduled for a specific time, then calculate timing
    // based on previous programs (and it should not have a pre-show program)
    if (program.Show.StartTime == undefined) {
        // Should start playback right after the last show
        var mostRecentProgram = intermediateCompiledLineup.Programs[intermediateCompiledLineup.Programs.length - 1];
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
    if (this.hasPreShow(program)) {
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

LineupCompiler.prototype.validateLineup = function(compiledLineup) {
    var latestEndTimeObserved = 0;
    for (var i = 0; i < compiledLineup.Programs.length; i++) {
        var currentProgram = compiledLineup.Programs[i];

        var currentProgramStartTime = this.hasPreShow(currentProgram) ?
                        currentProgram.PreShow.Meta.TentativeStartTime :
                        currentProgram.Show.Meta.TentativeStartTime;

        if (currentProgramStartTime < latestEndTimeObserved) {
            throw "   Error: Program " + currentProgram.Id + " from box: " + currentProgram.BoxId + " overlaps with the program before that. ("+ currentProgramStartTime + " < " + latestEndTimeObserved + ")";
        } else {
            latestEndTimeObserved = currentProgramStartTime;
        }
    }
}

// implemented in subclasses
LineupCompiler.prototype.getMediaDuration = function(media) {
    console.log("Not implemented!");
}

module.exports = {
    "LineupCompiler": LineupCompiler
}
