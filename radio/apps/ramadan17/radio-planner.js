var fs = require('fs');
var moment = require('moment');

var Events = require('../../../events');
var Messaging = require('../../../messaging');

var config = null;
if (process.argv.length < 4) {
	console.log("usage: radio-planner {config-file} {deployment-mode}");
	process.exit(1);
}

config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

if (config == null) {
	console.log("FATAL ERROR: Error reading config file");
	process.exit(1);
}

var events = new Events(config.Events);
var messaging = new Messaging(config.Messaging);

var LineupManager = {};
switch (process.argv[3]) {
	case require('../../lineup-manager').prototype.DeploymentMode.STANDALONE:
		LineupManager = require('../../standalone/standalone-lineup-manager');
		break;
	case require('../../lineup-manager').prototype.DeploymentMode.LIQUIDSOAP:
		LineupManager = require('../../liquidsoap/liquidsoap-lineup-manager');
		break;
}

var lineupManager = new LineupManager(config.RamadanRadio, process.argv[2]);

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



