var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var running_dir = process.argv[2];
var lineupFilePath = fs.readFileSync(running_dir + "/lineups/current", 'utf8');

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

	if (fs.existsSync(lineupFilePath + ".program.iter")) {

		var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

		// Program does not have a preshow
		if (lineup.Programs[currentProgramIdx].PreShow) {
			if (lineup.Programs[currentProgramIdx].PreShow.FillerClip) {
			    console.log(lineup.Programs[currentProgramIdx].PreShow.FillerClip.Path);
			}
			
			// Preprogram exists but no filler is set.
			// Print nothing 

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


