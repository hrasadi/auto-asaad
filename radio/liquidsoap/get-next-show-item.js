var fs = require('fs');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var lineupFilePath = process.argv[2];

if (fs.existsSync(lineupFilePath)) {
    lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

    if (fs.existsSync(ineupFilePath + ".program.iter")) {

        var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

        // Program does not have a preshow

        if (fs.existsSync(lineupFilePath + ".show.lock")) {

            // Check the iterator value
            var iter = 0;
            if (fs.existsSync(lineupFilePath + ".show.iter")) {
                iter = parseInt(fs.readFileSync(lineupFilePath + ".show.iter", 'utf8')); 
            }

            if (iter < lineup.Programs[currentProgramIdx].Show.Clips.length) {
                console.log(lineup.Programs[currentProgramIdx].Show.Clips[iter].Path);

                // write the new iterator value to file
                fs.writeFileSync(lineupFilePath + ".show.iter", iter + 1);

            } else if (iter == lineup.Programs[currentProgramIdx].Show.Clips.length) {
                // when playback of the show is finished, remove the playback lock and the iterators, 
                // also move to the next program if application
                fs.unlinkSync(lineupFilePath + ".show.iter");
                fs.unlinkSync(lineupFilePath + ".show.lock");

                // Note that the next upcoming programming may only be played by us if it is not scheduled explicitly.
                // We know by design that in this case, program cannot have a preshow.
                nextProgramIdx = currentProgramIdx + 1;

                if (nextProgramIdx < lineup.Programs.length) { // More programs in the lineup
                    if (!lineup.Programs[nextProgramIdx].Show.StartTime) { // If next program is not explicitly scheduled
                        // Move forward
                        fs.writeFileSync(lineupFilePath + ".program.iter", nextProgramIdx);

                        // Playback of the new program automatically begins in the next iteration when this script is executed by liquidsoap server
                        // We should lock it already
                        fs.writeFileSync(lineupFilePath + ".show.lock", "");
                    }
                }
                // No output, nothing to play in this iteration
            }

            // else print nothing 
        } else { // We are still in preshow
            setTimeout(function() {
                process.exit(0);
            }, 2000);
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

