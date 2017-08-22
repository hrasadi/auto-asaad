var Radio = require('../../radio');

var program = require('commander');

var fs = require('fs');
var fsextra = require('fs-extra');
var moment = require('moment');
var path = require('path');

var dot = require('dot');

var Events = require('../../../events');
var Messaging = require('../../../messaging');
var Utils = require('../../../utils');
var RSSFeedGenerator = require('../../rss-feed-generator');

const { URL } = require('url');

var lm = require('../../lineup-manager');

var Raa1 = function(program) {
    this.configFilePath = path.resolve(program.args[0]);
    this.cwd = path.resolve(path.dirname(program.args[0]) + '/..');
    this.config = null;

    this.events = null;
    this.messaging = null;

    this.deploymentMode = program.args[1];
    this.options = program;

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

    this.lineupManager = lm.build(this.deploymentMode, this.config.Radio, this.cwd, this);
    this.lineupManager.init(this.options);
}

Raa1.prototype.reset = function(currentDate, callback_fn) {
    var self = this;
    var d = moment(this.lineupManager.options.currentDayMoment);

    this.dataProvider = {};

    var onAllEventsCollection = function() {
        callback_fn();
    }

    for (var i = 0; i <= this.lineupManager.options.futureLineupsCount; i++) {
        this.events.readEvent(d.toDate(), function(d, eventsDict) {
            dateString = moment(d).format("YYYYMMDD");
            self.dataProvider[dateString] = {};
            self.dataProvider[dateString].fajrTime = events[self.events.EventType.FAJR];
            self.dataProvider[dateString].dhuhrTime = events[self.events.EventType.DHUHR];
            self.dataProvider[dateString].maghribTime = events[self.events.EventType.MAGHRIB];

            if (Object.keys(self.dataProvider).length > self.lineupManager.options.futureLineupsCount) {
                onAllEventsCollection();
            }
        });
        d.add(1, 'days');
    }
}

Raa1.prototype.calculateProgramStartTime = function(targetDateMoment, id) {
    if (id == 'FajrProgram') {
        return this.dataProvider[targetDateMoment.format("YYYYMMDD")].fajrTime;
    } else if (id == 'DhuhrProgram') {
        return this.dataProvider[targetDateMoment.format("YYYYMMDD")].dhuhrTime;
    } else if (id == 'MaghribProgram') {
        return this.dataProvider[targetDateMoment.format("YYYYMMDD")].maghribTime;
    }
}

// For raa1, we should generate the lineup HTML
Radio.prototype.onLineupPlanned = function(targetDateMoment, lineup) {
    // TODO
}

// For raa1, we should generate the lineup HTML
Radio.prototype.onLineupCompiled = function(targetDateMoment, compiledLineup) {

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

        entry.description = entry.description.trim();
        // Hack to remove extra semicolon if it is remained from before
        if (entry.description.charAt(entry.description.length - 1) == "؛") {
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
          {'itunes:subtitle': 'پادکست‌های رادیو اتو-اسعد'},
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

/* === Entry Point === */
program
    .version('1.0.0')
    .option('-v, --verbose', 'Detailed logs')
    .option('-t, --test', 'Test mode (no side effects)')
    .option('-n --no-scheduling', 'Persist all steps except scheduling (For advacned testing only)')
    .option('-d --target-date [date]', "Target date in YYYY-MM-DD format", moment)
    .parse(process.argv)

if (program.args.length < 2) {
    console.log("Usage: node raa1.js OPTIONS {config-file} {deployment-mode}");
    process.exit(1);
}

var raa1 = new Raa1(program);

raa1.initialize();
