var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

	if (fs.existsSync(lineupFilePath + ".program.iter")) {

		var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

		// If the current program does not have a preshow, then quit
		if (lineup.Programs[currentProgramIdx].PreShow) {

			// Check the iterator value
			var preShowIter = 0;
			if (fs.existsSync(lineupFilePath + ".preshow.iter")) {
			    preShowIter = parseInt(fs.readFileSync(lineupFilePath + ".preshow.iter", 'utf8')); 
			}

			if (preShowIter < lineup.Programs[currentProgramIdx].PreShow.Clips.length) {
			    console.log(lineup.Programs[currentProgramIdx].PreShow.Clips[preShowIter].Path);

			    // write the new iterator value to file
			    fs.writeFileSync(lineupFilePath + ".preshow.iter", preShowIter + 1);
			} // playback_preshow.sh must make sure that the .preshow.iter does not exist
			// else print nothing 

		} else { // This program does not have a preshow, so wait a bit to see what happens in the next program
			setTimeout(function() {
				process.exit(0);
			}, 5000);
		}
	} else { // This case only should happen in the case that radio is not does yet with compiling the lineup, so bear it up!
		setTimeout(function() {
			process.exit(0);
		}, 2000);
	}
} else { // LineupFilePath not accessible, maybe radio is not up yet
	
	setTimeout(function() {
		process.exit(0);
	}, 1000);
}
