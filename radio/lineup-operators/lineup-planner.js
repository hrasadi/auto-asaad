var fs = require('fs');
var moment = require('moment');

var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

var Utils = require('./utils');

var LineupPlanner = function() {
    Stage.call(this, "LineupPlanner");
}
OOUtils.inheritsFrom(LineupPlanner, Stage);

LineupPlanner.prototype.perform = function(flatTemplateConfig) {
    // reset the state for every planning round
    this.planningMode = 'current';
    this.iterators = {};

    // We should select the media items, but keep the boxes in place (so that modifying programs 
    // for a day remains simple)
    this.config = flatTemplateConfig;
    
    this.lineups = [];
    var currentLineup = this.planLineup(this.context.options.currentDayMoment);
    // current lineup is index 0
    this.lineups.push(currentLineup);

    // Now plan future lineups
    // first change state of the planner
    this.planningMode = 'future';
    for (var i = 1; i < this.context.options.futureLineupsCount; i++) {
        var lineup = this.planLineup(moment(this.context.options.currentDayMoment).add(i, 'days'));
        this.lineups.push(lineup);
    }

    return currentLineup;
}

LineupPlanner.prototype.planLineup = function(targetDateMoment) {
    var lineup = {};
    lineup.Version = this.config.Version; // preserve the version of the lineup syntax
    lineup.Boxes = [];

    this.context.logger().info("- Planning lineup for " + targetDateMoment.format("YYYY-MM-DD"));

    for (var i = 0; i < this.config.BoxTemplates.length; i++) {
        // determine wether it is a program or box
        if (this.config.BoxTemplates[i].BoxId) {
            var box = {};
            box.BoxId = this.config.BoxTemplates[i].BoxId;
            box.Programs = [];
            
            if (!this.config.BoxTemplates[i].StartTime) {
                throw "Error: Box" + box.BoxId + " did specify a start time!";
            }
            // Check this for each box, if not scheduled. 
            if (!this.isProgramOnScheduleToday(this.config.BoxTemplates[i], targetDateMoment)) {
                continue;
            }

            this.calculateStartTime(targetDateMoment, box.BoxId, this.config.BoxTemplates[i], box);

            for (var j = 0; j < this.config.BoxTemplates[i].BoxProgramTemplates.length; j++) {
                // Decide for the program from the template
                var program = this.planProgramFromTemplate(targetDateMoment, i, j);
                // if returned program is null, it means that the current template does not result into a program
                // today (maybe because it should not be played today). In this case, igonore it
                if (program == null) {
                    continue;
                }
                
                // the program might be one object or a list of object (in case of replays)
                // The concat trick, returns an array (even if program is a single item)
                // This is to ensure correct call of push.apply
                Array.prototype.push.apply(box.Programs, [].concat(program));
                //box.Programs.push(program);
            }


            // if the box has not program, skip it!
            if (box.Programs.length > 0) {
                lineup.Boxes.push(box);
            }
        } else { // it is a program
            // Decide for the program from the template
            var program = this.planProgramFromTemplate(targetDateMoment, i);
            // if returned program is null, it means that the current template does not result into a program
            // today (maybe because it should not be played today). In this case, igonore it
            if (program == null) {
                continue;
            }
            // The show might have start time. If the program has a pre-program show,
            // it is mandatory to specify start time for it!
            lineup.Boxes.push(program);
        }
    }

    // Persist
    if (this.context.options.mode == 'deploy') {        
        fs.writeFileSync(this.generateLineupFilePath(targetDateMoment), JSON.stringify(lineup, null, 2), 'utf-8');
        // For all lineups, we also need the lineup html
        this.context.radio.onLineupPlanned(targetDateMoment, lineup);
    }
        
    if (this.context.options.verbose) {
        this.context.logger().info(JSON.stringify(lineup, null, 2));
    }
    
    return lineup;    
}

LineupPlanner.prototype.planProgramFromTemplate = function(targetDateMoment, boxIdx, programIdx) { 
    programTemplate = null;
    if (programIdx != undefined) {
        programTemplate = this.config.BoxTemplates[boxIdx].BoxProgramTemplates[programIdx];
    } else {
        programTemplate = this.config.BoxTemplates[boxIdx];
        programIdx = -1;
    }

    var program = null; // Could be an object or an array

    // Check this for both replays and new episode templates
    if (!this.isProgramOnScheduleToday(programTemplate, targetDateMoment)) {
        return null;
    }

    if (programTemplate.ProgramType == "Replay") {

        program = this.selectReplayProgram(programTemplate, targetDateMoment);
        
    } else { // New Episode
        program = {};

        program.Id = programTemplate.Id;
        program.Title = programTemplate.Title;

        // Optional field, is the eligible (that have HasVOD=true) clips from this program 
        // should also be published in the podcast feed
        if (programTemplate.PublishPodcast) {
            program.PublishPodcast = programTemplate.PublishPodcast;
        }

        if (this.hasPreShow(programTemplate)) {
            this.selectProgramPreShowClipsFromTemplate(programTemplate, program, targetDateMoment, boxIdx, programIdx);
        }
        // if there is no media on for the show, we must reject the program
        if (!this.selectProgramShowClipsFromTemplate(programTemplate, program, targetDateMoment, boxIdx, programIdx)) {
            return null;
        }

        // If the program has a pre-show we must make sure that it is defined
        // correctly
        if (this.hasPreShow(programTemplate)) {
            if (programTemplate.Show.StartTime == undefined || programTemplate.Show.StartTime == null) {
                throw "Error: Program " + program.Id + " has a pre-show but does not specify exact start time for the program.";
            }
        }

        if (programTemplate.Show.StartTime) {
            this.calculateStartTime(targetDateMoment, program.Id, programTemplate.Show, program.Show);
        }
    }

    return program;
}

LineupPlanner.prototype.selectReplayProgram = function(programTemplate, targetDateMoment) {
    originalAiringDateMoment = moment(targetDateMoment).subtract(parseInt(programTemplate.OriginalAiringOffset), 'days');
    var originalAiringLineupFilePath = this.generateLineupFilePath(originalAiringDateMoment);

    var originalAiringLineup = null;
    // If this a point in future, refer to in-memory copies, otherwise read from file
    if (originalAiringDateMoment.isBefore(this.context.options.currentDayMoment)) {
        if (!fs.existsSync(originalAiringLineupFilePath)) {
            this.context.logger().warn("   WARN: Replay for box " + programTemplate.OriginalBoxId +
                 " requested but lineup file with for " + 
                 originalAiringDateMoment.format('YYYY-MM-DD') + " cannot be found!");

            return null;
        }    
        originalAiringLineup = JSON.parse(fs.readFileSync(originalAiringLineupFilePath, 'utf-8'));        
    } else {
        var offset = originalAiringDateMoment.diff(this.context.options.currentDayMoment, 'days');
        originalAiringLineup = this.lineups[offset];
    }

    if (!originalAiringLineup.Version || originalAiringLineup.Version == "1.0") {
        // Not supported! Format too old
        return null;
    }

    // Now check for the programs in the original airing and find the target programs

    // Apply include filter
    var programs = [];
    for (var i = 0; i < originalAiringLineup.Boxes.length; i++) {
        if (originalAiringLineup.Boxes[i].BoxId == programTemplate.OriginalBoxId) {
            for (var j = 0; j < originalAiringLineup.Boxes[i].Programs.length; j++) {
                var candidateProgram = originalAiringLineup.Boxes[i].Programs[j];
                var replayEligible = false;

                // Apply the include filter (no include section means *)
                if (!programTemplate.Include || programTemplate.Include.includes(candidateProgram.Id)) {
                    replayEligible = true;
                }

                // Apply the exclude filter (no include section means null)
                if (programTemplate.Exclude && programTemplate.Exclude.includes(candidateProgram.Id)) {
                    replayEligible = false
                }

                if (replayEligible) {
                    var replayProgram = this.copyProgramForReplay(candidateProgram);
                    if (replayProgram != null) {
                        programs.push(replayProgram);
                    }
                }
            }
            // We are done here
            break;
        }
    }

    if (programs.length == 0) {
        return null;
    }

    return programs;
}

LineupPlanner.prototype.copyProgramForReplay = function(program) {
    var replayProgram = {};
    
    // Mend the name and Id
    replayProgram.Id = program.Id + "_replay";
    replayProgram.Title = program.Title + " - تکرار";
    // Replays do not publish podcast!
    replayProgram.PublishPodcast = false;
    // Copy the show and preshow clips as is
    if (program.PreShow) {
        replayProgram.PreShow = JSON.parse(JSON.stringify(program.PreShow));
    }
    
    // Only add the main clips in replay boxes
    replayProgram.Show = {};
    replayProgram.Show.Clips = [];
    originalShow = JSON.parse(JSON.stringify(program.Show));

    for (var i = 0; i < originalShow.Clips.length; i++) {
        var clip = originalShow.Clips[i];
        if (clip.IsMainClip) {
            replayProgram.Show.Clips.push(clip);
        }
    }

    if (replayProgram.Show.Clips.length > 0) {
        return replayProgram;
    } else {
        // If there is no clips to this program, do not include it at all
        return null;
    }
}

LineupPlanner.prototype.selectProgramPreShowClipsFromTemplate = function(programTemplate, program, targetDateMoment, boxIdx, programIdx) {
    this.context.logger().debug("-- Preshow plannig for program: " + programTemplate.Id);

    program.PreShow = {}
    program.PreShow.Clips = [];

    for (var i = 0; i < programTemplate.PreShow.Clips.length; i++) {
        // resolve the media file path before writing down to lineup
        media = {};
        Object.assign(media, this.getMedia(programTemplate, targetDateMoment, boxIdx, programIdx, 'PreShow', i));
        if (media.Path != undefined) {
            media.Path = this.config.Media.BaseDir + "/" + media.Path;
            program.PreShow.Clips.push(media);

            this.context.logger().debug("   * From " + programTemplate.PreShow.Clips[i].MediaGroup + " I have selected: " + media.Path);
        }
    }

    var fillerMedia = {};
    Object.assign(fillerMedia, this.config.Media[programTemplate.PreShow.FillerClip][0]);
    fillerMedia.Path = this.config.Media.BaseDir + "/" + fillerMedia.Path;
    program.PreShow.FillerClip = fillerMedia;

    this.context.logger().debug("   * Filler clip is " + fillerMedia.Path);
}

LineupPlanner.prototype.selectProgramShowClipsFromTemplate = function(programTemplate, program, targetDateMoment, boxIdx, programIdx) {
    this.context.logger().debug("-- Show planning for program: " + programTemplate.Id);

    program.Show = {}
    program.Show.Clips = [];

    for (var i = 0; i < programTemplate.Show.Clips.length; i++) {
        // resolve the media file path before writing down to lineup
        var media = {};
        Object.assign(media, this.getMedia(programTemplate, targetDateMoment, boxIdx, programIdx, 'Show', i));
        if (media.Path != undefined) {
            media.Path = this.config.Media.BaseDir + "/" + media.Path;
            if (programTemplate.Show.Clips[i].IsMainClip) {
                media.IsMainClip = true;
            }
            program.Show.Clips.push(media);
            
            this.context.logger().debug("   * From " + programTemplate.Show.Clips[i].MediaGroup + " I have selected: " + media.Path);
        } else {
            // If the main clip of a program is empty, the whole program should not be planned
            if (programTemplate.Show.Clips[i].IsMainClip) {
                return false;
            }
        }
    }

    if (program.Show.Clips.length == 0) {
        return false;
    }
    return true;
}

LineupPlanner.prototype.getMedia = function(programTemplate, targetDateMoment, boxIdx, programIdx, showType, clipIdx) {
    var iteratorId = programTemplate.Id + "-" + boxIdx + "-" + programIdx + "-" + showType + "-" + clipIdx;
    var persistentIteratorFilePath = this.context.cwd + "/run/" + iteratorId + ".iterator";

    var iterator = null;
    if (this.planningMode == 'current' && this.context.options.mode == 'deploy') { // no side-effect in test-mode
        iterator = Utils.IteratorFactory.build(programTemplate[showType].Clips[clipIdx].Policy, 
                                                       this.config.Media[programTemplate[showType].Clips[clipIdx].MediaGroup],
                                                       true, persistentIteratorFilePath);            
    } else {
        // planning mode is 'future' (or test mode)
        if (!this.iterators[iteratorId]) {
            iterator = Utils.IteratorFactory.build(programTemplate[showType].Clips[clipIdx].Policy, 
                                                           this.config.Media[programTemplate[showType].Clips[clipIdx].MediaGroup],
                                                           false, persistentIteratorFilePath);
            this.iterators[iteratorId] = iterator;
        } else {
            iterator = this.iterators[iteratorId];
        }
    }
    
    offset = programTemplate[showType].Clips[clipIdx].Offset ? 
                                    parseInt(programTemplate[showType].Clips[clipIdx].Offset) : undefined;
    return iterator.next(this.tag(targetDateMoment), offset);
}

LineupPlanner.prototype.generateLineupFilePath = function(targetDateMoment) {
    return this.context.options.lineupFilePathPrefix + targetDateMoment.format("YYYY-MM-DD") + ".json";
}

LineupPlanner.prototype.isProgramOnScheduleToday = function(programTemplate, targetDateMoment) {
    // if the primiere date is not arrived yet, return false
    if (programTemplate.PremiereDate) {
        if (moment(programTemplate.PremiereDate) > targetDateMoment) {
            return false;
        }
    }

    // Check the weekly schedule
    if (!programTemplate.WeeklySchedule) {
        return true;
    }

    todayDayOfWeek = targetDateMoment.day();
    for (var i = 0; i < programTemplate.WeeklySchedule.length; i++) {
        if (Utils.WeekDaysEnum[programTemplate.WeeklySchedule[i]] == todayDayOfWeek) { // Today is a day!
            return true;
        }
    }

    return false;
}

LineupPlanner.prototype.calculateStartTime = function(targetDateMoment, itemId, template, generated) {
    if (template.StartTime.CalculationMethod == 'static') {
        var startTime = moment(template.StartTime.At, ['h:m:s', 'H:m:s']);
        generated.StartTime = moment(targetDateMoment).hours(startTime.hours())
                                                        .minutes(startTime.minutes())
                                                        .seconds(startTime.seconds());
    } else {
        generated.StartTime = moment(this.context.radio[template.StartTime.Calculator](targetDateMoment, itemId));
    }
}

// When the radio first starts, it should play something (of course!).
// Therefore, either the first program in the list should be scheduled or
// otherwise we will schedule it for now.
LineupPlanner.prototype.adjustFirstProgramStartTime = function(program) {

    if (program.Show.StartTime == undefined) {
        this.context.logger().warn("First program template in the lineup should have explicitly set start time but it was not. I will schedule it for playback in 5 minutes!");
        // schedule it for a minute from now (to handle possible system delays)
        program.Show.StartTime = moment().add(5, 'minute');
    }
}

LineupPlanner.prototype.tag = function(dateMoment) {
    return parseInt(dateMoment.format("YYYYMMDD"));
}

module.exports = {
	"LineupPlanner": LineupPlanner
}