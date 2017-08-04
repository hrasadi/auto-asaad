var RSS = require('rss');
var fs = require('fs');

var RSSFeedGenerator = function(options) {
	this.options = options;
	this.items = [];
}

RSSFeedGenerator.prototype.addItem = function(item) {
	this.items.push(item);
}

RSSFeedGenerator.prototype.addAllItems = function(items) {
	this.items = this.items.concat(items);	
}

RSSFeedGenerator.prototype.publishFeed = function(feedPath) {

	// Read the old feed JSON, append to it and write it back
	var currentItems = [];
	if (fs.existsSync(feedPath + ".json")) {
		currentItems = JSON.parse(fs.readFileSync(feedPath + ".json", "utf-8"));
	}

	var newItems = currentItems.concat(this.items);
	fs.writeFileSync(feedPath + ".json", JSON.stringify(newItems, null, 2));

	var feed = new RSS(this.options)

	if (newItems) {
		for (var i = 0; i < newItems.length; i++) {
			feed.item(newItems[i]);
		}
	}

	var xml = feed.xml({indent: true});
	fs.writeFileSync(feedPath, xml);
}


module.exports = RSSFeedGenerator;