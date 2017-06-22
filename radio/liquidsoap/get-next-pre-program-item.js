var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

// Check the iterator value
var iter = 0;
if (fs.existsSync(lineupFilePath + ".preprogram.iter")) {
	iter = parseInt(fs.readFileSync(lineupFilePath + ".preprogram.iter", 'utf8')); 
}

if (iter < lineup.preProgramPlaylist.length) {
	console.log(lineup.preProgramPlaylist[iter].path);

	// write the new iterator value to file
	fs.writeFileSync(lineupFilePath + ".preprogram.iter", iter + 1);
}
// else print nothing 

