var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];
var currentTrackFilePath = process.argv[3];

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

	var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));
	console.log(lineup.Programs[currentProgramIdx].Title);
		
	// TODO use currentTrackFilePath to show th current track info too
}
