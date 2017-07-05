var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];
// which program?
var currentProgramIdx = process.argv[3];

if (fs.existsSync(lineupFilePath)) {
    lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

    var hitSchedulingWall = false;
    
    while(!hitSchedulingWall) {
        
        for (var i = 0; i < lineup.Programs[currentProgramIdx].Show.Clips.length; i++) {             
            console.log(lineup.Programs[currentProgramIdx].Show.Clips[i].Path);
        }

        // Note that the next upcoming programming may only be played by us if it is NOT scheduled explicitly.
        // We know by design that in this case, program cannot have a preshow.
        ++currentProgramIdx; // m
        // Either no more programs in the lineup or the next one is scheduled for another time
        if (currentProgramIdx>= lineup.Programs.length || lineup.Programs[currentProgramIdx].Show.StartTime) { 
            hitSchedulingWall = true;
        }
    }
    
} else { // LineupFilePath not accessible, maybe radio is not up yet
    
    setTimeout(function() {
        process.exit(0);
    }, 1000);
}

