var fs = require('fs');
var moment = require('moment');
// Custom format so that files are easier to read
moment.prototype.toJSON = function() {
    return this.format();
}

var path = require('path');
var readline = require('readline');

// Entry Point
if (process.argv.length < 4) {
    console.log("usage: node add-program.js {config-file} {radio-ID}");
    process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var cwd = path.resolve(path.dirname(process.argv[2]));
var radioId = process.argv[3];
var today = moment().format("YYYY-MM-DD");

var lineupPath = cwd + "/lineups/" + radioId + "-" + today + ".json";
var lineup = JSON.parse(fs.readFileSync(lineupPath, 'utf8'));

var program = {};

rl.question('Enter the new program ID: ', (pid) => {
  if (pid.length == 0) {
    throw "Invalid program ID!";
  }

  program.Id = pid;

  readTitle();
});

var readTitle = function() {
    rl.question('Enter the program title: ', (title) => {
        program.Title = title;
        
        readClips();
    });
}

var readClips = function() {
  program.Show = {}
  program.Show.Clips = []  
  
  var readClip = function() {
    rl.question('Enter path to next clip for this program (empty line to break): ', (clipPath) => {
        if (clipPath.length == 0) {
            // done with clips, read the start time now
            readStartTime();

        } else {
            program.Show.Clips.push(JSON.parse(fs.readFileSync(clipPath, 'utf8')));
            readClip();
        }
    });
  }

  readClip();
}

var readStartTime = function() {
    rl.question('Enter program start time (empty for 5 mins from now): ', (startTime) => {
        if (startTime.length > 0) { 
            program.Show.StartTime = moment(startTime, ['h:m:s', 'H:m:s']);
        } else {
            program.Show.StartTime = moment().add(5, 'minutes').set('second', 0);
        }
        readPosition();
    });
}

var readPosition = function() {
    rl.question('Enter ID of the program that this program should be added after (empty for schedule as first program): ', (prevProgramId) => {
        if (prevProgramId.length == 0) {
            lineup.Programs.splice(0, 0, program);
        } else {
            var inserted = false;
            // iterate through the lineup to find the position
            for (var i =0; i < lineup.Programs.length; i++) {
                curProgram = lineup.Programs[i];

                if (curProgram.Id == prevProgramId) {
                    lineup.Programs.splice(i + 1, 0, program); // insert after this items
                    inserted = true;
                    break;
                }
                
            }
            if (!inserted) {
                throw "Could not find program with ID = " + prevProgramId;
            }		
        }
        rl.close();
        // Read everything, persist the results
        persistNewLineup();
    });
}

var persistNewLineup = function() {
    fs.writeFileSync(lineupPath, JSON.stringify(lineup, null, 2));
}
