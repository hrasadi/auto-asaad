var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

// Program does not have a preshow
if (!lineup.Programs[currentProgramIdx].PreShow) {
    process.exit(0);
}

if (lineup.Programs[currentProgramIdx].PreShow.FillerClip) {
	console.log(lineup.Programs[currentProgramIdx].PreShow.FillerClip.Path);
}
// else print nothing 

