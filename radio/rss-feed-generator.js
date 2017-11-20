var RSS = require('rss');
var fs = require('fs-extra');

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

RSSFeedGenerator.prototype.publishFeed = function(targetDateMoment, feedPath, publishNewItems = true) {
         
    var feedJSONPath = this.generateFeedJSONPath(targetDateMoment, feedPath);

    if (!fs.existsSync(feedJSONPath)) {
        // We are in a new day, so remove outdated json (day before yesterday)
        var outdatedJSONPath = this.generateFeedJSONPath(moment(targetDateMoment).subtract(2, 'days'), feedPath);
        if (fs.existsSync(outdatedJSONPath)) {
            fs.removeSync(outdatedJSONPath);
        }
    }
    
    var yesterdayFeedJSONPath = this.generateFeedJSONPath(moment(targetDateMoment).subtract(1, 'days'), feedPath);
    // In any case we create the base json is what we have generated yesterday
    if (fs.existsSync(yesterdayFeedJSONPath)) {
        fs.copySync(yesterdayFeedJSONPath, feedJSONPath, {force: true});
    }

    // Read the old feed JSON, append to it and write it back
    var currentItems = [];
    if (fs.existsSync(feedJSONPath)) {
        currentItems = JSON.parse(fs.readFileSync(feedJSONPath, "utf-8"));
    }

    newItemList = currentItems.concat(this.items);
    
    fs.writeFileSync(feedJSONPath, JSON.stringify(newItemList, null, 2));

    // Decide which edition of the data we want to publish
    var itemsToPublish = currentItems;
    if (publishNewItems) {
        itemsToPublish = newItemList;
    }

    var feed = new RSS(this.options)

    if (itemsToPublish) {
        for (var i = 0; i < itemsToPublish.length; i++) {
            feed.item(itemsToPublish[i]);
        }
    }

    var xml = feed.xml({indent: true});
    fs.writeFileSync(feedPath, xml);
}

RSSFeedGenerator.prototype.generateFeedJSONPath = function(targetDateMoment, feedPath) {
    return feedPath + ".json." + targetDateMoment.format("YYYY-MM-DD");
}

module.exports = RSSFeedGenerator;