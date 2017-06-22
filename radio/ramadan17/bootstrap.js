var fs = require('fs');
var fsExtra = require('fs-extra');
var moment = require('moment');
var path = require('path');
var execSync = require('child_process').execSync;

var DEPLOYMENT_MODE = 'liquidsoap';
var LS_SCRIPT_DIR = path.resolve('../liquidsoap');
var RUNNING_DIR = path.resolve('./');
var MEDIA_DIR = '/home/ubuntu/media';
var FILLER_MEDIA = 'Tagh-Toogh-Long.mp3'; // relative to media dir

config = JSON.parse(fs.readFileSync('./ramadan17.conf', 'utf8'));

var generateProgramDates = function() {
	var ramadanStartDate = moment(config.RamadanStartDate).set('hour', 0).set('minute', 0).set('second', 0);
	var ramadanEndDate = moment(ramadanStartDate).add(30, 'day');

	// Do not schedule past events (but do schedule for today)
	var firstDayOfProgram = moment.max(ramadanStartDate, moment(new Date()).set('hour', 0).set('minute', 0).set('second', 0));

	var dates = [];
	for (var i = 0; i < ramadanEndDate.diff(firstDayOfProgram); i++) {
		dates.push(moment(firstDayOfProgram));
		firstDayOfProgram.add(1, 'day').format("YYYY-MM-DD");
	}

	return dates;

}

var installStandaloneRadio = function(dates) {
	// nothing!
}

var installLiquidsoapRadio = function(dates) {
	// Copy the .liq file to /etc (The script should be executed with sudo)
	fsExtra.copySync('../liquidsoap/radio.liq', '/etc/liquidsoap/radio.liq'); 

	execSync("echo radio_LS_SCRIPT_DIR=" + LS_SCRIPT_DIR + " >> /etc/default/liquidsoap");
	execSync("echo radio_RUNNING_DIR=" + RUNNING_DIR  + " >> /etc/default/liquidsoap");
	execSync("echo radio_MEDIA_DIR=" + MEDIA_DIR  + " >> /etc/default/liquidsoap");
	execSync("echo radio_FILLER_MEDIA=" + FILLER_MEDIA  + " >> /etc/default/liquidsoap");
	execSync("service liquidsoap restart"); 
}

// create necassary directories
try {
	fs.mkdirSync('./logs');
} catch(e) {
	console.log(e)
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

switch (DEPLOYMENT_MODE) {
	case 'standalone':
		installStandaloneRadio();
		break;
	case 'liquidsoap':
		installLiquidsoapRadio();
		break;	
}

generateProgramDates().forEach(function(d) {
    execSync("echo 'cd " + RUNNING_DIR + "; node radio-planner.js ./ramadan17.conf " + DEPLOYMENT_MODE + "' | at -t " + moment(d).format("YYYYMMDDHHmm.ss").toString(), {
    	encoding: 'utf-8'
    	});
});
