var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

var Utils = require('./utils');

var PostOperator = function() {
    Stage.call(this, "PostOperator");
}
OOUtils.inheritsFrom(PostOperator, Stage);

PostOperator.prototype.perform = function(compiledLineupFilePath) {
	this.compiledLineupFilePath = compiledLineupFilePath

	this.operate(compiledLineupFilePath);

	return compiledLineupFilePath;
}

// Subclass implementation is responsible for handling the mode
PostOperator.prototype.operate = function() {
}

module.exports = {
	"PostOperator": PostOperator
}