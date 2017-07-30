var Radio = require('../../radio');

var fs = require('fs');
var moment = require('moment');
var path = require('path');
var dot = require('dot');

var Events = require('../../../events');
var Messaging = require('../../../messaging');
var Utils = require('../../../utils');

const { URL } = require('url');

var lm = require('../../lineup-manager');

var Raa1 = function(configFile, deploymentMode) {
    this.configFilePath = path.resolve(configFile);
    this.cwd = path.resolve(path.dirname(configFile));
    this.config = null;

    this.events = null;
    this.messaging = null;

    this.deploymentMode = deploymentMode;

    this.dataProvider = {};

    Radio.call(this, "Raa1", "Radio Auto-asaad");
}

Utils.inheritsFrom(Raa1, Radio);

Raa1.prototype.initialize = function() {

    this.config = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));

    if (this.config == null) {
        console.log("FATAL ERROR: Error reading config file");
        process.exit(1);
    }

    this.events = new Events(this.config.Events);
    this.messaging = new Messaging(this.config.Messaging);

    var lineupManager = lm.build(process.argv[3], this.config.Radio, this.cwd, this);
    lineupManager.startMainLoop();
}

Raa1.prototype.reset = function(currentDate, callback_fn) {
    this.dataProvider.currentDate = currentDate;

    var self = this;
    this.events.readTodayEvent(function(eventsDict) {
        self.dataProvider.fajrTime = events[self.events.EventType.FAJR];
        self.dataProvider.dhuhrTime = events[self.events.EventType.DHUHR];
        self.dataProvider.maghribTime = events[self.events.EventType.MAGHRIB];

        // give back control to lineupManager
        callback_fn();
    });
}

Raa1.prototype.calculateProgramStartTime = function(program) {
    if (program.Id == 'FajrProgram') {
        return this.dataProvider.fajrTime;
    } else if (program.Id == 'DhuhrProgram') {
        return this.dataProvider.dhuhrTime;
    } else if (program.Id == 'MaghribProgram') {
        return this.dataProvider.maghribTime;
    }
}

// For raa1, we should generate the lineup HTML
Radio.prototype.onLineupCompiled = function(compiledLineup) {

    var lineupTemplateText = fs.readFileSync('lineup-view.jst', 'utf8');
    dot.templateSettings.strip = false;

    var lineupTemplateFn = dot.template(lineupTemplateText);

    var data = {};
    data.array = [];
    for (var i = 0; i < compiledLineup.Programs.length; i++) {
        var entry = {};

        if (compiledLineup.Programs[i].Title) {
                    entry.title = compiledLineup.Programs[i].Title;
                } else {
                    entry.title = "بی نام";
                }
                entry.description = "";

        if (compiledLineup.Programs[i].PreShow) {
            entry.time = moment(compiledLineup.Programs[i].PreShow.Meta.TentativeStartTime).format('HH:mm');

            for (var j = 0; j < compiledLineup.Programs[i].PreShow.Clips.length; j++) {
                if (compiledLineup.Programs[i].PreShow.Clips[j].Description) {
                    entry.description += compiledLineup.Programs[i].PreShow.Clips[j].Description;
                    entry.description += "؛ ";
                }
            }
        } else {
            entry.time = moment(compiledLineup.Programs[i].Show.Meta.TentativeStartTime).format('HH:mm');
        }
        for (var j = 0; j < compiledLineup.Programs[i].Show.Clips.length; j++) {
            if (compiledLineup.Programs[i].Show.Clips[j].Description) {
                if (compiledLineup.Programs[i].Show.Clips[j].HasVOD) {
                    // reconstruct the relative path to the media from the absolute playback path
                    vodRelativeURI = compiledLineup.Programs[i].Show.Clips[j].Path.replace(this.config.Radio.Media.BaseDir,"");
                    vodUrl = new URL(vodRelativeURI, 'http://vod.raa.media/');
                    entry.description += '<a class="vod-link" href="' + vodUrl.toString() + '">' + compiledLineup.Programs[i].Show.Clips[j].Description + "</a>";
                } else {
                    entry.description += compiledLineup.Programs[i].Show.Clips[j].Description;
                }

                if (j != compiledLineup.Programs[i].Show.Clips.length - 1) { // Except for the last item
                    entry.description += "؛ ";
                }
            }
        }

        data.array.push(entry);
    }

    var resultText = lineupTemplateFn(data);
    fs.writeFileSync(this.cwd + "/lineups/lineup.html", resultText)
}

// Entry Point
if (process.argv.length < 4) {
    console.log("usage: node raa1.js {config-file} {deployment-mode}");
    process.exit(1);
}

var raa1 = new Raa1(process.argv[2], process.argv[3]);

raa1.initialize();
