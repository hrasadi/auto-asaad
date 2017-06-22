var LineupManager = function(radioConfig, runningDir) {
    this.Logger = require('../logger');
    this.logger = null;
    this.fs = require('fs');
    this.moment = require('moment');

    this.config = radioConfig;
    this.runningDir = runningDir;

    this.hasPreProgram = (radioConfig.PreProgram != undefined) ? true : false;
}

LineupManager.prototype.DeploymentMode = {
    STANDALONE: "standalone",
    LIQUIDSOAP: "liquidsoap"
}


// implemented in subclasses
LineupManager.prototype.schedulePlayback = function(programTime, lineup, lineupName) {
    console.log("Not implemented!");
}

LineupManager.prototype.createLineup = function(programTime, selectorIdx, lineupName) {
    this.logger = new this.Logger(this.runningDir + "/logs/lineup-planner-" + lineupName + ".log");

    if (this.config.Test) {
        logger.warn("WARNING! RUNNING IN TEST MODE. YOU SHOULD KNOW WHAT YOU ARE DOING!");
    }

    var lineup = {};
    if (this.hasPreProgram) {
        this.decidePreProgramLineup(lineup, selectorIdx);        
    }
    this.decideProgramLineup(lineup, selectorIdx);

    // persist the lineup
    var lineupFilePath = this.runningDir + "/lineups/" + lineupName + ".json";
    this.fs.writeFileSync(lineupFilePath, JSON.stringify(lineup, null, 2), 'utf-8');

    this.schedulePlayback(programTime, lineup, lineupFilePath);

    return lineup;
}

// implemented in subclasses
LineupManager.prototype.getMediaDuration = function(media) {
    console.log("Not implemented!");
} 

LineupManager.prototype.decidePreProgramLineup = function(lineup, selectorIdx) {
    this.logger.info("-- BEGIN OF PRE-PROGRAM LINEUP ARRANGEMENT");

    lineup.preProgramPlaylist = [];
    var totalLineupDuration = 0;

    // in test mode, only the first item from the playlist will be played
    var testMode = false;
    if (this.config.Test) {
        testMode = true;
    }
    
    for (var i = 0; i < this.config.PreProgram.Slots.length; i++) {
        var mediaIdx = 0;
        // decide the index of media to be played in the slot
        if (!testMode) {
            mediaIdx = this.myMod(selectorIdx, this.config.Media[this.config.PreProgram.Slots[i]].length);            
        }

        // resolve the media file path before writing down to lineup
        var media = {};
        Object.assign(media, this.config.Media[this.config.PreProgram.Slots[i]][mediaIdx]);
        media.path = this.config.Media.BaseDir + media.path;

        var mediaDuration = this.getMediaDuration(media);
        
        this.logger.info("* I have decided to play " + this.config.PreProgram.Slots[i] + " with index: " + mediaIdx + " and the duration is: " + mediaDuration);


        lineup.preProgramPlaylist.push(media);
        totalLineupDuration += mediaDuration;
    }

    lineup.totalPreProgramLineupDuration = Math.round(totalLineupDuration);

    this.logger.info("-- END OF PRE-PROGRAM LINEUP. TOTAL DURATION IS: " + totalLineupDuration + " (rounded to " + Math.round(totalLineupDuration) + ")");
}

LineupManager.prototype.decideProgramLineup = function(lineup, selectorIdx) {
    this.logger.info("-- BEGIN OF PROGRAM LINEUP ARRANGEMENT");

    lineup.programPlaylist = [];

    // in test mode, only the first item from the playlist will be played
    var testMode = false;
    if (this.config.Test) {
        testMode = true;
    }

    for (var i = 0; i < this.config.Program.Slots.length; i++) {
        var mediaIdx = 0;
        // decide the index of media to be played in the slot
        if (!testMode) {
            mediaIdx = this.myMod(selectorIdx, this.config.Media[this.config.Program.Slots[i]].length);            
        }
        
        // resolve the media file path before writing down to lineup
        var media = {};
        Object.assign(media, this.config.Media[this.config.Program.Slots[i]][mediaIdx]);
        media.path = this.config.Media.BaseDir + media.path;

        this.logger.info("* I have decided to play " + this.config.Program.Slots[i] + " with index: " + mediaIdx);

        lineup.programPlaylist.push(media);
    }

    this.logger.info("-- END OF ADHAN LINEUP");
}

LineupManager.prototype.myMod = function(m, n) {
    return ((m % n) + n) % n;
}

module.exports = LineupManager;