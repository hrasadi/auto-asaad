var fs = require('fs');
var moment = require('moment');
var path = require('path');

var DEPLOYMENT_MODE = 'liquidsoap';
var SCRIPT_DIR = path.resolve('../');
var RUNNING_DIR = path.resolve('./');
var MEDIA_DIR = '/home/ubuntu/media';
var FILLER_MEDIA = 'Tagh-Toogh-Long.mp3'; // relative to media dir

config = JSON.parse(fs.readFileSync('./ramadan17.conf', 'utf8'));

var generateProgramDates = function() {
	var ramadanStartDate = moment(config.RamadanStartDate).set('hour', 0).set('minute', 0).set('second', 0);
	var ramadanEndDate = moment(ramadanStartDate).add(30, 'day');

	// Do not schedule past events (but do schedule for today)
	console.log(moment(new Date()));
	console.log(ramadanStartDate);
	var firstDayOfProgram = moment.max(ramadanStartDate, moment(new Date()).set('hour', 0).set('minute', 0).set('second', 0));

	var dates = [];
	for (var i = 0; i < ramadanEndDate.diff(firstDayOfProgram); i++) {
		dates.push(moment(firstDayOfProgram));
		firstDayOfProgram.add(1, 'day').format("YYYY-MM-DD");
	}

	return dates;

}

var postInstallStandaloneRadio = function(dates) {
	// nothing!
}

var postInstallLiquidsoapRadio = function(dates) {
	// Copy the .liq file to /etc (The script should be executed with sudo)
	path.copySync('../liquidsoap/radio.liq', '/etc/liquidsoap'); 

	execSync('service liquidsoap restart ' + SCRIPT_DIR + " " + RUNNING_DIR + " " + MEDIA_DIR + " " + FILLER_MEDIA);
}

// create necassary directories
try {
	fs.mkdirSync('./logs');
} catch(e) {
	console.log(e);
}

try {
	fs.mkdirSync('./lineups');
} catch(e) {
	console.log(e);
}

// Let the lineups be writable by other processes (esp. when running liquidsoap as deamon)
try {
	fs.chmodSync('./lineups', '777');
} catch(e) {
	console.log(e);
}

generateProgramDates().forEach(function(d) {
    var scriptDir = path.resolve(__dirname + '..');
    execSync("echo 'cd " + scriptDir + "; node radio-planner.js " + __dirname + "/ramadan17.conf " + DEPLOYMENT_MODE + "' | at -t " + moment(d).format("YYYYMMDDHHmm.ss").toString(), {
    	encoding: 'utf-8'
    })
})

switch (DEPLOYMENT_MODE) {
	case 'standalone':
		postInstallStandaloneRadio();
		break;
	case 'liquidsoap':
		postInstallLiquidsoapRadio();
		break;	
}