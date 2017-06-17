var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;
var kill = require('tree-kill');

var config = null;
if (process.argv.length < 3) {
	console.log("usage: playback-program.js {lineup-file-path}");
	process.exit(1);
}

var lineupFilePath = process.argv[2];

// kill the pre-program
var preProgramPid = parseInt(fs.readFileSync('radio.lock', 'utf-8'));
kill(preProgramPid, 'SIGTERM', doPlayback);
fs.unlinkSync('radio.lock');

function doPlayback() {
	var today = moment().format('YYYY-MM-DD');
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

	// Do playback
	lineup.programPlaylist.forEach (function(item) {	
		execSync('afplay ' + item.path);
	})	
}
