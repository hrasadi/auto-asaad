var Radio = require('../../radio');

var fs = require('fs');
var moment = require('moment');
var path = require('path');
var dot = require('dot');

var Events = require('../../../events');
var Messaging = require('../../../messaging');
var Utils = require('../../../utils');
var RSSFeedGenerator = require('../../rss-feed-generator');

const { URL } = require('url');

var lm = require('../../lineup-manager');

var Raa1 = function(configFile, deploymentMode) {
    this.configFilePath = path.resolve(configFile);
    this.cwd = path.resolve(path.dirname(configFile));
    this.config = null;

    this.events = null;
    this.messaging = null;

    this.deploymentMode = deploymentMode;

    this.dataProvider = {};

    Radio.call(this, "Raa1", "Radio Auto-asaad");
}

Utils.inheritsFrom(Raa1, Radio);

Raa1.prototype.initialize = function() {

    this.config = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));

    if (this.config == null) {
        console.log("FATAL ERROR: Error reading config file");
        process.exit(1);
    }

    this.events = new Events(this.config.Events);
    this.messaging = new Messaging(this.config.Messaging);

    var lineupManager = lm.build(process.argv[3], this.config.Radio, this.cwd, this);
    lineupManager.startMainLoop();
}

Raa1.prototype.reset = function(currentDate, callback_fn) {
    this.dataProvider.currentDate = currentDate;

    var self = this;
    this.events.readTodayEvent(function(eventsDict) {
        self.dataProvider.fajrTime = events[self.events.EventType.FAJR];
        self.dataProvider.dhuhrTime = events[self.events.EventType.DHUHR];
        self.dataProvider.maghribTime = events[self.events.EventType.MAGHRIB];

        // give back control to lineupManager
        callback_fn();
    });
}

Raa1.prototype.calculateProgramStartTime = function(program) {
    if (program.Id == 'FajrProgram') {
        return this.dataProvider.fajrTime;
    } else if (program.Id == 'DhuhrProgram') {
        return this.dataProvider.dhuhrTime;
    } else if (program.Id == 'MaghribProgram') {
        return this.dataProvider.maghribTime;
    }
}

// For raa1, we should generate the lineup HTML
Radio.prototype.onLineupCompiled = function(compiledLineup) {

    var lineupTemplateText = fs.readFileSync('lineup-view.jst', 'utf8');
    dot.templateSettings.strip = false;

    var lineupTemplateFn = dot.template(lineupTemplateText);

    var data = {};
    data.array = [];
    for (var i = 0; i < compiledLineup.Programs.length; i++) {
        var entry = {};

        if (compiledLineup.Programs[i].Title) {
                    entry.title = compiledLineup.Programs[i].Title;
                } else {
                    entry.title = "بی نام";
                }
                entry.description = "";

        if (compiledLineup.Programs[i].PreShow) {
            entry.startTime = moment(compiledLineup.Programs[i].PreShow.Meta.TentativeStartTime).format('HH:mm');

            for (var j = 0; j < compiledLineup.Programs[i].PreShow.Clips.length; j++) {
                if (compiledLineup.Programs[i].PreShow.Clips[j].Description) {
                    entry.description += compiledLineup.Programs[i].PreShow.Clips[j].Description;
                    entry.description += "؛ ";
                }
            }
        } else {
            entry.startTime = moment(compiledLineup.Programs[i].Show.Meta.TentativeStartTime).format('HH:mm');
        }
        entry.endTime = moment(compiledLineup.Programs[i].Show.Meta.TentativeEndTime).format('HH:mm');

        for (var j = 0; j < compiledLineup.Programs[i].Show.Clips.length; j++) {
            if (compiledLineup.Programs[i].Show.Clips[j].Description && compiledLineup.Programs[i].Show.Clips[j].Description != "") {
                if (compiledLineup.Programs[i].Show.Clips[j].HasVOD) {
                    // reconstruct the relative path to the media from the absolute playback path
                    vodRelativeURI = compiledLineup.Programs[i].Show.Clips[j].Path.replace(this.config.Radio.Media.BaseDir,"");
                    vodUrl = new URL(vodRelativeURI, 'http://vod.raa.media/');
                    entry.description += '<a class="vod-link" href="' + vodUrl.toString() + '">' + compiledLineup.Programs[i].Show.Clips[j].Description + "</a>";

                    
                    /* Now update the RSS xml feed (If the clip should be published) */  
                    // An example of an item which should not be published (although having VOD),
                    // is the re-broadcast of a program.
                    if (compiledLineup.Programs[i].PublishPodcast) {
                        // Create a new feed gen item
                        feedGen = this.createFeedGenerator();
                        rssFeedItem = this.createRSSItemTemplate();
                        rssFeedItem.title = compiledLineup.Programs[i].Title;
                        rssFeedItem.description = compiledLineup.Programs[i].Show.Clips[j].Description;
                        rssFeedItem.url = vodUrl;
                        rssFeedItem.date = Date().toString();
                        rssFeedItem.enclosure = {};
                        rssFeedItem.enclosure.url = vodUrl;
                        itunesSubtitleElement = {};
                        itunesSubtitleElement["itunes:subtitle"] = compiledLineup.Programs[i].Show.Clips[j].Description;;
                        rssFeedItem.custom_elements.push(itunesSubtitleElement);

                        // Push the new item
                        feedGen.addItem(rssFeedItem);
                        feedGen.publishFeed(this.cwd + "/rss/rss.xml");
                    }

                } else {
                    entry.description += compiledLineup.Programs[i].Show.Clips[j].Description;
                }

                if (j != compiledLineup.Programs[i].Show.Clips.length - 1) { // Except for the last item                    
                    entry.description += "؛ ";
                }
            }
        }

        // Hack to remove extra semicolon if it is remained from before
        if (entry.description.charAt(entry.description.length - 1) == ";") {
            entry.description = entry.description.slice(0, -1);
        }

        data.array.push(entry);
    }

    var resultText = lineupTemplateFn(data);
    // A little bit hack here to recreate the current date 
    today = moment(compiledLineup.Programs[0].Show.StartTime).format('YYYY-MM-DD');
    fs.writeFileSync(this.cwd + "/lineups-html/lineup-" + today + ".html", resultText)
}

Radio.prototype.createRSSItemTemplate = function() {
    return {
        author: 'رادیو اتو-اسعد', 
        custom_elements: [
          {'itunes:author': 'رادیو اتو-اسعد'},
          {'itunes:image': {
            _attr: {
              href: 'http://raa.media/img/raa-cover-itunes.png'
            }
          }}
        ]
    }
}

Radio.prototype.createFeedGenerator = function() {
    return new RSSFeedGenerator({
        title: 'رادیو اتو-اسعد',
        custom_namespaces: {
            'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        },
        description: 'پادکست‌های رادیو اتو-اسعد شامل برنامه‌هایی است که امکان پخش عمومی آن‌ها برای ما وجود داشته است.',
        feed_url: 'http://raa.media/rss.xml',
        site_url: 'http://raa.media',
        image_url: 'http://raa.media/img/raa-cover-itunes.png',
        copyright: '2017 Radio Auto-asaad',
        language: 'fa',
        pubDate: 'Aug 01, 2017 04:00:00 GMT',
        ttl: '60',
        custom_elements: [
          {'itunes:subtitle': 'پارکست‌های رادیو اتو-اسعد'},
          {'itunes:author': 'اتو-اسعد'},
          {'itunes:explicit': false},
          {'itunes:owner': [
            {'itunes:name': 'Radio Auto-asaad'},
            {'itunes:email': 'admin@raa.media'}
          ]},
          {'itunes:image': {
            _attr: {
              href: 'http://raa.media/img/raa-cover-itunes.png'
            }
          }},
          {'itunes:category': [
            {_attr: {
              text: 'Arts'
            }},
            {'itunes:category': {
              _attr: {
                text: 'Literature'
              }
            }}
          ]}
        ]
    });
}

// Entry Point
if (process.argv.length < 4) {
    console.log("usage: node raa1.js {config-file} {deployment-mode}");
    process.exit(1);
}

var raa1 = new Raa1(process.argv[2], process.argv[3]);

raa1.initialize();
