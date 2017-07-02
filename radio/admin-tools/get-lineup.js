var fs = require('fs');
var moment = require('moment');

// Entry Point
if (process.argv.length < 4) {
	console.log("usage: node get-lineup.js {config-file} {radio-ID}");
	process.exit(1);
}

var cwd = path.resolve(path.dirname(process.argv[3]));
var radioId = process.argv[4];
var today = moment().format("YYYY-MM-DD");

var lineupPath = cwd + "/lineups/" + radioId + "-" + today + ".json.compiled";
var compiledLineup = JSON.parse(self.fs.readFileSync(lineupPath, 'utf8'));

console.log(JSON.stringify(compiledLineup, null, 2));