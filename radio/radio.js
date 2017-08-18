var Radio = function(radioId, description) {
    this.id = radioId;
    this.description = description;
}

// Will be called at the beginning of each day of program (new lineup)
Radio.prototype.reset = function(currentDate, callback_fn) {
    console.log("Not implemented");
}

Radio.prototype.onLineupPlanned = function(targetDateMoment, lineup) {
	console.log("Not implemented");
}

Radio.prototype.onLineupCompiled = function(compiledLineup) {
	console.log("Not implemented");
}

module.exports = Radio;
