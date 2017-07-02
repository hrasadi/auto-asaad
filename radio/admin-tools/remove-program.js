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
    console.log("usage: node remove-program.js {config-file} {radio-ID}");
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

rl.question('Enter the program ID you want to delete: ', (pid) => {
    if (pid.length == 0) {
        throw "Invalid program ID!";
    }

    var deleted = false;
    // iterate through the lineup to find the position
    for (var i =0; i < lineup.Programs.length; i++) {
        curProgram = lineup.Programs[i];

        if (curProgram.Id == pid) {
            lineup.Programs.splice(i, 1); // remove this item
            deleted = true;
            break;
        }
    }

    rl.close();
    if (!deleted) {
        throw "Could not find program with ID = " + prevProgramId;
    }       

    // persist
    persistNewLineup();
});

var persistNewLineup = function() {
    fs.writeFileSync(lineupPath, JSON.stringify(lineup, null, 2));
}
