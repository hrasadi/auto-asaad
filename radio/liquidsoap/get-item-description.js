var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var running_dir = process.argv[2];
var lineupFilePath = fs.readFileSync(running_dir + "lineups/current", 'utf8');
var currentTrackFilePath = process.argv[3];

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

	var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));
	
	// In case of back-to-back programs, we need to move program iter when the first 
	// track of the next programs begins to play.
	if (lineup.Programs[currentProgramIdx + 1] && 
		currentTrackFilePath.indexOf(lineup.Programs[currentProgramIdx + 1].Show.Clips[0].Path) != -1) {
		// Lets shift the current program iterator
		currentProgramIdx++;
		fs.writeFileSync(lineupFilePath + ".program.iter", currentProgramIdx);
	}

	console.log(lineup.Programs[currentProgramIdx].Title);
		
	// TODO use currentTrackFilePath to show the current track info too
}
