var moment = require('moment');
var fs = require('fs');

adhans = ['https://www.youtube.com/watch?v=cWJ0A2MGADc', 
			'https://www.youtube.com/watch?v=IUuGAeK5Hi0', 
			'https://www.youtube.com/watch?v=ZQztDKU4J7g', 
			'http://dl.aviny.com/voice/azan/moazenin/46-karami.mp3', 
			'http://dl.aviny.com/voice/azan/moazenin/84-aghati.mp3',
			'http://dl.aviny.com/voice/azan/moazenin/66-rafeei.mp3', 
			'http://dl.aviny.com/voice/azan/moazenin/10-aborieh.mp3', 
			'http://dl.aviny.com/voice/azan/moazenin/80-tukhi.mp3', 
			'https://www.youtube.com/watch?v=m6Ren0qbf3w'
	  ];

var config = null;
if (process.argv.length < 5) {
	console.log("usage: adhan.js {config-file} {start-date(YYYY-MM-DD)} {end-date(YYYY-MM-DD)}");
	process.exit(1);
}

config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

var startDate = moment(process.argv[3]);
var endDate = moment(process.argv[4]);

var events = require('../../events');
events = new events(config.Events);

var messaging = require('../../messaging');

messaging = new messaging(config.Messaging);

var current_adhan = 0;

var periodLengthInDays = endDate.diff(startDate, 'day');

for (var i = 0; i < periodLengthInDays; i++) {
	events.readEvent(startDate.toDate(), events.EventType.MAGHRIB, function(maghribTime) {

	    var autoAsaadMessage = "حدود وقت اذان مغرب \\n <a>" + adhans[current_adhan]  + "</a>"
	    	
	    current_adhan++;

		messaging.createCalEvent(maghribTime, "#scheduler", autoAsaadMessage);
	});	

	startDate.add(1, 'day');
}

