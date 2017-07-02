var Radio = require('../../radio');

var fs = require('fs');
var moment = require('moment');
var path = require('path');
var dot = require('dot');

var Events = require('../../../events');
var Messaging = require('../../../messaging');
var Utils = require('../../../utils');

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

	self = this;
	this.events.readTodayEvent(this.events.EventType.MAGHRIB, function(maghribTime) {
		self.dataProvider.maghribTime = maghribTime;	
		
		// give back control to lineupManager
		callback_fn();
	});	
}

Raa1.prototype.calculateProgramStartTime = function(program) {
	if (program.Id == 'IftarProgram') {
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
				entry.description += compiledLineup.Programs[i].Show.Clips[j].Description;
				entry.description += "؛ ";
			}
		}
		// remove the extra semi-colon
		if (entry.description) {
			entry.description.slice(0, -2);
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


/*

events.readTodayEvent(events.EventType.MAGHRIB, function(maghribTime) {

        var indexDayOfRamadan = moment(maghribTime).diff(moment(config.RamadanStartDate), 'days');
        var lineupName = 'ramadan17-lineup-' + moment(maghribTime).format("YYYY-MM-DD");

		var lineup = lineupManager.createLineup(maghribTime, indexDayOfRamadan, lineupName);

        var preAdhanProgramTime = moment(maghribTime).subtract(lineup.totalPreProgramLineupDuration, 'seconds').set('second', 0);

		// Now let's create auto-asaad message
		scheduleAutoAsaadMessage(lineup, indexDayOfRamadan, maghribTime, preAdhanProgramTime);
	});

var scheduleAutoAsaadMessage = function(lineup, indexDayOfRamadan, adhanTime, preAdhanProgramTime) {
	var autoAsaadMessage = "برنامه‌های رادیو اتو اسعد، " + (indexDayOfRamadan + 1) + " رمضان المبارک\\n";

	autoAsaadMessage += "شروع برنامه‌ها از ساعت: " + moment(preAdhanProgramTime).format("HH:mm") + "\\n";

	autoAsaadMessage += "ابتدا به " + lineup.preProgramPlaylist[0].description + " گوش فرا خواهیم داد. سپس نوای " + lineup.preProgramPlaylist[1].description
				+ " را خواهیم شنید. بعد از " + lineup.preProgramPlaylist[2].description + " با شنیدن " + lineup.preProgramPlaylist[3].description 
				+ " به استقبال " + lineup.programPlaylist[0].description + " خواهیم رفت. در نهایت " + lineup.programPlaylist[1].description 
				+ " پایان بخش برنامه‌های امشب رادیو اتو-اسعد خواهد بود. \\n التماس دعا."

	var calEventDateTime = moment(adhanTime).set('hour', 14).set('minute', 0).format('YYYY-MM-DDTHH:mm:ss');
	messaging.createCalEvent(calEventDateTime, "#scheduler", autoAsaadMessage);
}
*/



