var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

// Check the iterator value
var preShowIter = 0;
if (fs.existsSync(lineupFilePath + ".preshow.iter")) {
	iter = parseInt(fs.readFileSync(lineupFilePath + ".preshow.iter", 'utf8')); 
}

if (iter < lineup.Programs[currentProgramIdx].PreShow.Clips.length) {
	console.log(lineup.Programs[currentProgramIdx].PreShow.Clips[iter].Path);

	// write the new iterator value to file
	fs.writeFileSync(lineupFilePath + ".preshow.iter", iter + 1);
}
// else print nothing 

