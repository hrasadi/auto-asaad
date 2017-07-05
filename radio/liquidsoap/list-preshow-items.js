var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];
// which program?
var currentProgramIdx = process.argv[3];

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

		// If the current program does not have a preshow, then quit
		if (lineup.Programs[currentProgramIdx].PreShow) {
			for (var i = 0; i < lineup.Programs[currentProgramIdx].PreShow.Clips.length; i++) {				
			    console.log(lineup.Programs[currentProgramIdx].PreShow.Clips[i].Path);
			}

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
