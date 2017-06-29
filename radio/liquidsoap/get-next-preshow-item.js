var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

// If the current program does not have a preshow, then quit
if (!lineup.Programs[currentProgramIdx].PreShow) {
    process.exit(0);
}

// Check the iterator value
var preShowIter = 0;
if (fs.existsSync(lineupFilePath + ".preshow.iter")) {
	preShowIter = parseInt(fs.readFileSync(lineupFilePath + ".preshow.iter", 'utf8')); 
}

if (preShowIter < lineup.Programs[currentProgramIdx].PreShow.Clips.length) {
	console.log(lineup.Programs[currentProgramIdx].PreShow.Clips[preShowIter].Path);

	// write the new iterator value to file
	fs.writeFileSync(lineupFilePath + ".preshow.iter", preShowIter + 1);
} else if (iter == lineup.Programs[currentProgramIdx].PreShow.Clips.length) { // cleanup time!
	fs.unlinkSync(lineupFilePath + ".preshow.item");
}
// else print nothing 

