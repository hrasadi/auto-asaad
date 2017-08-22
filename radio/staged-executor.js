/**
* context is the StagedExecutor instance
**/
var Stage = function(name) {
	this.name = name;
	this.options = {};
}

Stage.prototype.perform = function(input) {
	this.context.logger().debug("default stage implementation!");
	return;
}

var StagedExecutor = function() {
	this.stages = [];
}

Stage.prototype.hasPreShow = function(program) {
    return program.PreShow ? true: false;
}

// This should be implemented by subclasses
StagedExecutor.logger = function() {
	throw "Logger is not ready yet!";
}

StagedExecutor.prototype.pushStage = function(stage) {
	// set the context of the stage to the executor
	stage.context = this;
	
	this.stages.push(stage);
}

StagedExecutor.prototype.getStage = function(stageName) {
	for (var i = 0 ; i < this.stages.length; i++) {
		if (this.stages[i].name == stageName) {
			return this.stages[i];
		}
	}
	throw "Reqeusted stage " + stageName + " is not registered with this executor.";
}

StagedExecutor.prototype.execute = function(initialInput, firstStageName) {	
	
	var firstStageIdx = 0;
	if (firstStageName) {
		var found = false;
		for (var i = 0 ; i < this.stages.length; i++) {
			if (this.stages[i].name == firstStageName) {
				firstStageIdx = i;
				found = true;
				break;
			}
		}
		if (!found) {
			throw "Reqeusted stage " + firstStageName + " is not registered with this executor.";
		}
	}
	this.logger().info("Executor will start executing from stage offset: " + firstStageIdx);

	pipeObject = initialInput;
	for (var i = firstStageIdx; i < this.stages.length; i++) {
		this.logger().info("Executing stage " + (i + 1) + " of " + this.stages.length + " (" + this.stages[i].name + ")");
		pipeObject = this.stages[i].perform(pipeObject);
	}

	return pipeObject;
}

module.exports = {
	"StagedExecutor": StagedExecutor,
	"Stage": Stage
}