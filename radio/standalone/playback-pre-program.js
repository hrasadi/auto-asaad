var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;


var config = null;
if (process.argv.length < 4) {
	console.log("usage: node play-pre-program.js {lineup-file-path} {filler-media-path}");
	process.exit(1);
}

lineupFilePath = process.argv[2];
fillerMediaPath = process.argv[3];

var today = moment().format('YYYY-MM-DD');
lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

// So that it can be killed later
fs.writeFileSync("radio.lock", process.pid, 'utf-8');

// Do playback
lineup.preProgramPlaylist.forEach (function(item) {	
	execSync('afplay ' + item.path);
})

// Filler until it is killed
while(true) {
	execSync('afplay ' + fillerMediaPath);
}