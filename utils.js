var Utils = function() {}

Utils.prototype.inheritsFrom = function(child, parent) {
	child.prototype = Object.create(parent.prototype);
	// re-register the constructor
	child.prototype.constructor = child;
}


module.exports = new Utils();