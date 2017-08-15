var fs = require('fs');
var moment = require('moment');

var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

var Utils = require('./utils');

var LineupPlanner = function() {
    Stage.call(this, "LineupPlanner");

    this.planningMode = 'current';
    this.iterators = {};
}
OOUtils.inheritsFrom(LineupPlanner, Stage);

LineupPlanner.prototype.perform = function(flatTemplateConfig) {
    // We should select the media items, but keep the boxes in place (so that modifying programs 
    // for a day remains simple)
    this.config = flatTemplateConfig;
    
    var currentLineup = this.planLineup(this.context.options.currentDayMoment);

    // Now plan future lineups
    // first change state of the planner
    this.planningMode = 'future';
    for (var i = 1; i < this.context.options.futureLineupsCount; i++) {
        this.planLineup(moment(this.context.options.currentDayMoment).add(i, 'days'));
    }

    return currentLineup;
}

LineupPlanner.prototype.planLineup = function(targetDateMoment) {
    var lineup = {};
    lineup.Boxes = [];

    this.context.logger().info("- Planning lineup for " + targetDateMoment.format("YYYY-MM-DD"));

    for (var i = 0; i < this.config.BoxTemplates.length; i++) {
        // determine wether it is a program or box
        if (this.config.BoxTemplates[i].BoxId) {
            var box = {};
            box.BoxId = this.config.BoxTemplates[i].BoxId;
            box.Programs = [];
            
            this.calculateStartTime(box.BoxId, this.config.BoxTemplates[i], box);

            for (var j = 0; j < this.config.BoxTemplates[i].BoxProgramTemplates.length; j++) {
                // Decide for the program from the template
                var program = this.planProgramFromTemplate(targetDateMoment, i, j);
                // if returned program is null, it means that the current template does not result into a program
                // today (maybe because it should not be played today). In this case, igonore it
                if (program == null) {
                    continue;
                }
                // StartTime MUST be specified for a Box, and hence the first program StartTime
                // will be overriden by this start time value 
                if (i == 0) {
                    program.StartTime = box.StartTime;
                }
                box.Programs.push(program);
            }

            lineup.Boxes.push(box);
        } else { // it is a program
            // Decide for the program from the template
            var program = this.planProgramFromTemplate(targetDateMoment, i);
            // if returned program is null, it means that the current template does not result into a program
            // today (maybe because it should not be played today). In this case, igonore it
            if (program == null) {
                continue;
            }
            if (i == 0) {
                this.adjustFirstProgramStartTime(program);
            }
            // The show might have start time. If the program has a pre-program show,
            // it is mandatory to specify start time for it!
            lineup.Boxes.push(program);
        }
    }

    // Persist
    if (this.context.options.mode == 'deploy') {        
        fs.writeFileSync(this.generateLineupFilePath(targetDateMoment), JSON.stringify(lineup, null, 2), 'utf-8');
        // for all lineups, we also need the lineup html 
        // TODO
        // Note that we create a brief lineup html here, the current lineup will get a full lineup page after compilation.
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

    // TODO
    if (programTemplate.ProgramType == "Replay") {
        return;
    }
    
    if (!this.isProgramOnScheduleToday(programTemplate, targetDateMoment)) {
        return null;
    }

    var program = {};
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
        this.calculateStartTime(program.Id, programTemplate.Show, program.Show);
    }

    return program;
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
            media.Path = this.config.Media.BaseDir + "/" +  media.Path;
            program.Show.Clips.push(media);
            
            this.context.logger().debug("   * From " + programTemplate.Show.Clips[i].Media + " I have selected: " + media.Path);
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
    return iterator.next(this.tag(targetDateMoment));
}

LineupPlanner.prototype.generateLineupFilePath = function(targetDateMoment) {
    return this.context.options.lineupFilePathPrefix + targetDateMoment.format("YYYY-MM-DD") + ".json";
}

LineupPlanner.prototype.hasPreShow = function(programTemplate) {
    return programTemplate.PreShow ? true: false;
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
}

LineupPlanner.prototype.calculateStartTime = function(itemId, template, generated) {
    if (template.StartTime.CalculationMethod == 'static') {
        generated.StartTime = moment(template.StartTime.At, ['h:m:s', 'H:m:s']);
    } else {
        generated.StartTime = moment(this.context.radio[template.StartTime.Calculator](itemId));
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