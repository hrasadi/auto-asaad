var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));


if (!fs.existsSync(lineupFilePath + ".program.lock")) {
	process.exit(0);
}

// Check the iterator value
var iter = 0;
if (fs.existsSync(lineupFilePath + ".program.iter")) {
	iter = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8')); 
}

if (iter < lineup.programPlaylist.length) {
	console.log(lineup.programPlaylist[iter].path);

	// write the new iterator value to file
	fs.writeFileSync(lineupFilePath + ".program.iter", iter + 1);
}
// else print nothing 

