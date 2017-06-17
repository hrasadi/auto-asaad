var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;
var kill = require('tree-kill');

var config = null;
if (process.argv.length < 3) {
	console.log("FATAL ERROR: Config file not specified");
	process.exit(1);
}

config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// kill the pre-adhan
var preAdhanPid = parseInt(fs.readFileSync('radio.lock', 'utf-8'));
kill(preAdhanPid, 'SIGTERM', doPlayback);
fs.unlinkSync('radio.lock');

function doPlayback() {
	var today = moment().format('YYYY-MM-DD');
	lineup = JSON.parse(fs.readFileSync("lineups/" + today + ".json", 'utf8'));

	// Do playback
	lineup.adhanPlaylist.forEach (function(item) {	
		execSync('afplay ' + item.path);
	})	
}
