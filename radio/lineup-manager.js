/** LineupManager is the heart of Radio auto-asaad. It is a deamon responsible 
for creating lineups for the Liquidsoap and schedule their playback. The 
workflow in this class in a nutshell is as follows:

1- Generate a basic lineup based on the informatio provided in LineupTemplate 
section of the config file. Store it in 'lineups' folder
2- Calculate the precise program timing and validate it to make sure to 
overlapping happens
3- Generate a compiled version of the lineup that contains metadata information
about scheduling and other system-related info
3- Watch the lineup file (uncompiled version) for changes. If a change occurs
(by readio admin) the lineup should be recompiled and scheduled items must 
be updated accordingly.

Note: We provide radio admins a set of web-service and/or script handlers 
to modify the program lineups. 
**/

/* ProgramTemplate objects look likes this:
 {
    "Id": "id"
    "PreShow": {
      "Clips": [list-clips-from-media-section], 
      "FillerClip": "filler-from-media-section"
    },
    "Show": {
      "StartTime": {
        "CalculationMethod": "dynamic/static",
        "Calculator": "func_name/time-in-HH:mm:ss"
      },
      "OnLineupDecided": "func_name",
      "Clips": [clips-from-media-section]
    }
  }
*/

/* Program objects look like this:
  {
    "Id": "id"
    "PreShow": {
      "Clips": [
        {
            "Path": "uri-to-media",
            "Description": "description"
        }
      ], 
      "FillerClip": {
        "Path": "uri-to-media",
        "Description": "description"
      }
    },
    "Show": {
      "StartTime": "time-in-HH:mm:ss",
      "Clips": [
        {
            "Path": "uri-to-media",
            "Description": "description"
        }
      ]
    }
  }
*/

/* CompiledProgram objects looks like this:
 {
    "Id": "id"
    "PreShow": {
      "Meta": {
          "TentativeStartTime": "time-in-HH:mm:ss",
          "TentativeEndTime": "time-in-HH:mm:ss"
      },
      "Scheduler": {
          "ScheduledAt": "time-in-HH:mm:ss",
          "ScheulerId": "cron-id"    
      },
      "Clips": [
        {
            "Duration": length,
            "Path": "uri-to-media",
            "Description": "description"
        }
      ], 
      "FillerClip": {
        "Path": "uri-to-media",
        "Description": "description"
      }
    },
    "Show": {
      "Meta": {
          "TentativeStartTime": "time-in-HH:mm:ss",
          "TentativeEndTime": "time-in-HH:mm:ss"
      }
      "Clips": [
        {
            "Length": length,
            "Path": "uri-to-media",
            "Description": "description"
        }
      ]
    }
  }
*/

var LineupManager = function(radioConfig, cwd, radioObj) {
    this.logger = null;
    this.fs = require('fs');
    
    this.moment = require('moment');
    // Custom format so that files are easier to read
    this.moment.prototype.toJSON = function() {
        return this.format();
    }

    this.config = radioConfig;
    this.cwd = cwd;
    // This is the radio object who calls us, should implement any 
    // radio specific logic in the form of callbacks.
    this.radio = radioObj;

    // Today
    this.today = {
        date: null,
        lineupFilePath: "",
        lineupFileWatcher: null,
        lineup: {},
        compiledLineup: {}
    };
}

LineupManager.prototype.startMainLoop = function() {
    var Logger = require("../logger");

    var self = this;

    var lineupWatcher = function() {
        // Watch the lineup file for changes
        try {   
            self.today.lineupFileWatcher = self.fs.watch(lineupFilePath, "", 
                function(eventType, fileName) {
                    if (eventType == 'change') {
                        // Recompile
                        self.compileLineup();
                    }
                    // else?
                });   
        } catch (e) {
            // If the lineup file does not exist, generate it from template        
            self.generateLineup();
            self.compileLineup();
        }
    }

    var resetRadio = function() {
        // unwatch the old file
        if (self.today.lineupFileWatcher != null) {
            self.fs.close(self.today.lineupFileWatcher);
        }

        // start preparing for today
        self.today.date = self.moment().format("YYYY-MM-DD");
        self.today.lineupFilePath = self.cwd + "/lineups/" + self.radio.id + "-" + self.today.date + ".json";
        
        self.logger = new Logger(self.cwd + "/logs/lm-" + self.radio.id + "-" + self.today.date + ".log");

        self.radio.reset(self.today.date, function() {
            self.today.selectorIdx = self.radio.getSelectorIdx();

            lineupWatcher();
        })
    }

    resetRadio();

    // Wake up at the end of the day and reset the manager
    var tomorrow = this.moment().add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0);
    var nextDayStartsInMillis = tomorrow.diff(this.moment());
    
    setTimeout(function() {
            
            // reset lineup manager, the file watcher will hence generate the new 
            // lineup automatically.
            resetRadio(self);

        }, nextDayStartsInMillis);    
    
    this.logger.info("Scheduled next lineup regeneration in " + nextDayStartsInMillis + 
                "ms. (" + tomorrow.toString() + ")");

}

LineupManager.prototype.hasPreProgram = function(programTemplate) {
    return programTemplate.PreShow ? true: false;
}

LineupManager.prototype.generateLineup = function() {

    this.today.lineup.Programs = [];

    for (var i = 0; i < this.config.LineupTemplate.length; i++) {
        var programTemplate = this.config.LineupTemplate[i];

        // Decide for the program from the template
        var program = this.createProgramFromTemplate(programTemplate);

        // The show might have start time. If the program has a pre-program show,
        // it is mandatory to specify start time for it!
        //console.log(program.Show.StartTime)
        this.today.lineup.Programs.push(program);            
    }

    // Persist
    this.fs.writeFileSync(this.today.lineupFilePath, JSON.stringify(this.today.lineup, null, 2), 'utf-8');

}

LineupManager.prototype.createProgramFromTemplate = function(programTemplate) {
    var program = {};
    program.Id = programTemplate.Id;

    if (this.hasPreProgram(programTemplate)) {
        this.decideProgramPreShowClipsFromTemplate(programTemplate, program);        
    }
    this.decideProgramShowClipsFromTemplate(programTemplate, program);

    // If the program has a pre-show we must make sure that it is defined 
    // correctly
    if (this.hasPreProgram(programTemplate)) {
        if (programTemplate.Show.StartTime == undefined || programTemplate.Show.StartTime == null) {
            throw "Program " + program.Id + " has a pre-show but does not specify exact start time for the program";
        }
    }

    if (programTemplate.Show.StartTime) {
        if (programTemplate.Show.StartTime.CalculationMethod == 'static') {            
            program.Show.StartTime = moment(programTemplate.Show.StartTime.At, ['h:m:s', 'H:m:s']);
        } else {
            program.Show.StartTime = moment(this.radio[programTemplate.Show.StartTime.Calculator](program));
        }
    }

    return program;
}

LineupManager.prototype.decideProgramPreShowClipsFromTemplate = function(programTemplate, program) {
    this.logger.info("-- BEGIN OF PRE-SHOW LINEUP ARRANGEMENT FOR " + programTemplate.Id);

    program.PreShow = {}
    program.PreShow.Clips = [];
    
    for (var i = 0; i < programTemplate.PreShow.Clips.length; i++) {
        var mediaIdx = 0;
        // decide the index of media to be played in the slot
        mediaIdx = this.myMod(this.today.selectorIdx, this.config.Media[programTemplate.PreShow.Clips[i]].length);            

        // resolve the media file path before writing down to lineup
        var media = {};
        Object.assign(media, this.config.Media[programTemplate.PreShow.Clips[i]][mediaIdx]);

        media.path = this.config.Media.BaseDir + media.path;
        
        this.logger.info("* I have decided to play " + programTemplate.PreShow.Clips[i] + " with index: " + mediaIdx);

        program.PreShow.Clips.push(media);
    }

    var fillerMedia = this.config.Media[programTemplate.PreShow.FillerClip][0];
    program.PreShow.FillerClip = fillerMedia;

    this.logger.info("* Filler clip is " + fillerMedia.path);

    this.logger.info("-- END OF PRE-SHOW LINEUP FOR " + programTemplate.Id);
}

LineupManager.prototype.decideProgramShowClipsFromTemplate = function(programTemplate, program) {
    this.logger.info("-- BEGIN OF PROGRAM LINEUP ARRANGEMENT FOR " + programTemplate.Id);

    program.Show = {}
    program.Show.Clips = [];

    for (var i = 0; i < programTemplate.Show.Clips.length; i++) {
        var mediaIdx = 0;
        // decide the index of media to be played in the slot
        mediaIdx = this.myMod(this.today.selectorIdx, this.config.Media[programTemplate.Show.Clips[i]].length);            
        
        // resolve the media file path before writing down to lineup
        var media = {};
        Object.assign(media, this.config.Media[programTemplate.Show.Clips[i]][mediaIdx]);
        media.path = this.config.Media.BaseDir + media.path;

        this.logger.info("* I have decided to play " + programTemplate.Show.Clips[i] + " with index: " + mediaIdx);

        program.Show.Clips.push(media);
    }

    this.logger.info("-- END OF PROGRAM LINEUP FOR " + programTemplate.Id);
}

LineupManager.prototype.myMod = function(m, n) {
    return ((m % n) + n) % n;
}

LineupManager.prototype.compileLineup = function() {
    this.today.compiledLineup.Programs = [];
    
    // Calculate the start and end times for all programs
    for (var i = 0; i < this.today.lineup.Programs.length; i++) {
        
        // Prepare compiled program object
        compiledProgram = {};
        Object.assign(compiledProgram, this.today.lineup.Programs[i]);

        this.logger.info("Compiling Lineup - Pass 1 (Timing Calculation)");
        this.calculateProgramTimes(this.today.lineup.Programs[i], compiledProgram);

        this.today.compiledLineup.Programs.push(compiledProgram);
    }

    // Validate that there is no overlap
    this.validateLineup();

    // Schedule the playback
    this.scheduleLineupPlayback();

    // Persist the compiled lineup
    this.fs.writeFileSync(this.today.lineupFilePath + ".compiled", JSON.stringify(this.today.compiledLineup, null, 2), 'utf-8');

}

LineupManager.prototype.calculateProgramTimes = function(program, compiledProgram) {
        
    // Calculate the show start and end time
    compiledProgram.Show.Meta = {};
    
    // If this show is not scheduled for a specific time, then calculate timing 
    // based on previous programs (and it should not have a pre-show program)
    if (program.Show.StartTime == undefined) {        
        // Should start playback right after the last show
        var mostRecentProgram = this.today.compiledLineup.Programs[this.today.compiledLineup.Programs.length - 1];
        compiledProgram.Show.Meta.TentativeStartTime = mostRecentProgram.Meta.TentativeEndTime;
    } else {
        compiledProgram.Show.Meta.TentativeStartTime = program.Show.StartTime;
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
        compiledProgram.PreShow.Meta.TentativeStartTime = moment(compiledProgram.PreShow.Meta.TentativeEndTime).subtract(compiledProgram.Show.Meta.TotalDuration, 'seconds');        
    }
}

LineupManager.prototype.validateLineup = function() {
    var latestEndTimeObserved = 0;
    for (var i = 0; i < this.today.compiledLineup.Programs.length; i++) {
        var currentProgram = this.today.compiledLineup.Programs[i];

        var currentProgramStartTime = this.hasPreProgram(currentProgram) ? 
                        currentProgram.PreShow.Meta.TentativeStartTime : 
                        currentProgram.Show.Meta.TentativeStartTime;
    
        if (currentProgramStartTime < latestEndTimeObserved) {
            throw "Program " + currentProgram.Id + " overlaps with the program before that.";
        } else {
            latestEndTimeObserved = currentProgramStartTime;
        }
    }
}

LineupManager.prototype.scheduleLineupPlayback = function() {
    for (var i = 0; i < this.today.compiledLineup.Programs.length; i++) {
        var currentProgram = this.today.compiledLineup.Programs[i];

        // if the program is explicitly marked for scheduling (StartTime is specified for it), do it!
        if (currentProgram.Show.StartTime) {
            this.schedulePlayback(currentProgram)
        }
    }
}

// implemented in subclasses
LineupManager.prototype.schedulePlayback = function(programTime) {
    console.log("Not implemented!");
}


// implemented in subclasses
LineupManager.prototype.getMediaDuration = function(media) {
    console.log("Not implemented!");
} 


LineupManager.prototype.DeploymentMode = {
    STANDALONE: "standalone",
    LIQUIDSOAP: "liquidsoap"
}

LineupManager.build = function(deploymentMode, radioConfig, configFile, radioObj) {    
    var clazz;
    switch (deploymentMode) {
        case LineupManager.prototype.DeploymentMode.STANDALONE:
            clazz = require('./standalone/standalone-lineup-manager');
            break;
        case LineupManager.prototype.DeploymentMode.LIQUIDSOAP:
            clazz = require('./liquidsoap/liquidsoap-lineup-manager');
            break;
    }
    return new clazz(radioConfig, configFile, radioObj);
}

module.exports = LineupManager;
