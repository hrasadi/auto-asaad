var fs = require('fs');
var moment = require('moment');
var path = require('path');

// Entry Point
if (process.argv.length < 4) {
    console.log("usage: node get-lineup.js {config-file} {radio-ID}");
    process.exit(1);
}

var cwd = path.resolve(path.dirname(process.argv[2]));
var radioId = process.argv[3];
var today = moment().format("YYYY-MM-DD");

var lineupPath = cwd + "/lineups/" + radioId + "-" + today + ".json.compiled";
var compiledLineup = JSON.parse(fs.readFileSync(lineupPath, 'utf8'));

console.log(JSON.stringify(compiledLineup, null, 2));
