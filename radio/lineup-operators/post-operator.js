var OOUtils = require('../../utils');
var Logger = require('../../logger');

var Stage = require('../staged-executor').Stage;

var Utils = require('./utils');

var PostOperator = function() {
    Stage.call(this, "PostOperator");
}
OOUtils.inheritsFrom(PostOperator, Stage);

PostOperator.prototype.perform = function() {
	this.context.logger().info("Not implemented!");
}

module.exports = {
	"PostOperator": PostOperator
}