var moment = require('moment');
var fs = require('fs');

var Events = require('../../events');
var Messaging = require('../../messaging');

var config = null;
if (process.argv.length < 6) {
	console.log("usage: owghat.js {config-file} {month} {year} {once-every}");
	process.exit(1);
}

config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var month = process.argv[3];
var year = process.argv[4];
var onceEvery = process.argv[5];

var events = new Events(config.Events);
var messaging = new Messaging(config.Messaging);

events.readCalendar(month, year, 
	function(date, fajrString, sunriseString, dhuhrString, asrString, sunsetString,
		maghribString, ishaString, midnightString) {

		dateObj = moment(date, "DD MMM YYYY").set('hour', 8).set('minute', 0);

		if (dateObj.date() % onceEvery == 0) {
			var autoAsaadMessage = "اوقات شرعی \\n اذان صبح:  " + fajrString  + "\\n طلوع آفتاب: " + sunriseString + "\\n اذان ظهر: " + 
									dhuhrString + "\\n اذان عصر: " + asrString + "\\n غروب آفتاب: " + sunsetString + "\\n اذان مغرب: " + 
									maghribString + "\\n اذان عشاء: " + ishaString  + "\\n نیمه شب شرعی: " + midnightString;
			
			messaging.createCalEvent(dateObj.toISOString(), "#scheduler", autoAsaadMessage);
		}
	}
);

    

