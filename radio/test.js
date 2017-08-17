var fs = require('fs');
var moment = require('moment');
var LineupManager = require('./lineup-manager');

var config = JSON.parse(fs.readFileSync('apps/raa1/raa1.conf', 'utf-8')).Radio;

var lm = new LineupManager(config, './apps/raa1/', new function() {
	this.id = "Raa-Test";

	this.calculateProgramStartTime = function() {
		return moment();
	}

	this.onLineupPlanned = function() {
		console.log("radio planned");
	}

	this.onLineupCompiled = function() {
		console.log("radio compiled");
	}
});
lm.logger = function() {
		return new function() {
			this.info = function(str) {
				console.log(str);
			}
			this.debug = function(str) {
				console.log(str);
			}
			this.warn = function(str) {
				console.log(str);
			}
			this.fatal = function(str) {
				console.log(str);
			}
		}
}

lm.initStages();

