var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;


var config = null;
if (process.argv.length < 3) {
	console.log("FATAL ERROR: Config file not specified");
	process.exit(1);
}

config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

var today = moment().format('YYYY-MM-DD');
lineup = JSON.parse(fs.readFileSync("lineups/" + today + ".json", 'utf8'));

// So that it can be killed later
fs.writeFileSync("radio.lock", process.pid, 'utf-8');

// Do playback
lineup.preAdhanPlaylist.forEach (function(item) {	
	execSync('afplay ' + item.path);
})

// Filler until it is killed
while(true) {
	execSync('afplay ' + config.Media.Filler[0].path);
}