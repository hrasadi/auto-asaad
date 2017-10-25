var Radio = require('../../radio');

var program = require('commander');

var fs = require('fs');
var fsextra = require('fs-extra');
var moment = require('moment');
var path = require('path');

var dot = require('dot');

/* WEB APP REQUIREMENTS */
// Expressjs for devices to register for push notifications
var express = require('express');
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
/*----*/

var Events = require('../../../events');
var Utils = require('../../../utils');
var RSSFeedGenerator = require('../../rss-feed-generator');

const { URL } = require('url');

var lm = require('../../lineup-manager');

var Raa1 = function(program) {
    this.configFilePath = path.resolve(program.args[0]);
    this.cwd = path.resolve(path.dirname(program.args[0]) + '/..');
    this.config = null;

    this.events = null;

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

    this.registerWebApp();

    this.events = new Events(this.config.Events);

    this.lineupManager = lm.build(this.deploymentMode, this.cwd, this);
    this.lineupManager.init(this.options);
}

Raa1.prototype.getRadioConfig = function() {
    this.config = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));

    if (this.config == null) {
        console.log("FATAL ERROR: Error reading config file");
        process.exit(1);
    }

    return this.config.Radio;
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
            self.dataProvider[dateString].fajrTime = eventsDict[self.events.EventType.FAJR];
            self.dataProvider[dateString].dhuhrTime = eventsDict[self.events.EventType.DHUHR];
            self.dataProvider[dateString].maghribTime = eventsDict[self.events.EventType.MAGHRIB];

            if (Object.keys(self.dataProvider).length > self.lineupManager.options.futureLineupsCount) {
                onAllEventsCollection();
            }
        });
        d.add(1, 'days');
    }
}

Raa1.prototype.calculateProgramStartTime = function(targetDateMoment, id) {
    if (id == 'اذان صبح') {
        return this.dataProvider[targetDateMoment.format("YYYYMMDD")].fajrTime;
    } else if (id == 'اذان ظهر') {
        return this.dataProvider[targetDateMoment.format("YYYYMMDD")].dhuhrTime;
    } else if (id == 'اذان مغرب') {
        return this.dataProvider[targetDateMoment.format("YYYYMMDD")].maghribTime;
    }
}

// For raa1, we should generate the basic lineup HTML
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

    var feedGen = this.createFeedGenerator();

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
                        rssFeedItem = this.createRSSItemTemplate();
                        rssFeedItem.title = compiledLineup.Programs[i].Title;
                        rssFeedItem.description = compiledLineup.Programs[i].Show.Clips[j].Description;
                        rssFeedItem.url = vodUrl.toString();
                        rssFeedItem.date = Date().toString();
                        
                        rssFeedItem.enclosure = {};
                        var podcastEncodedUrl = 'https://api.raa.media/linkgenerator/podcast' + Buffer.from(vodUrl.toString()).toString('base64');
                        // This is to convince podcast players that this is an audio file!! It will be ignored by base64 decoder later
                        podcastEncodedUrl = podcastEncodedUrl + ".mp3"; 
                        rssFeedItem.enclosure.url = podcastEncodedUrl;
                        
                        itunesSubtitleElement = {};
                        itunesSubtitleElement["itunes:subtitle"] = compiledLineup.Programs[i].Show.Clips[j].Description;;
                        rssFeedItem.custom_elements.push(itunesSubtitleElement);

                        // Push the new item
                        feedGen.addItem(rssFeedItem);
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
    // A little bit of hacking here to recreate the current date 
    today = moment(compiledLineup.Programs[0].Show.StartTime).format('YYYY-MM-DD');
    fs.writeFileSync(this.cwd + "/web/lineup-" + today + ".html", resultText);
    fs.writeFileSync(this.cwd + "/web/lineup-" + today + ".json", JSON.stringify(data, null, 4));

    // Publish the RSS feed (but publish yesterday items not today's)
    feedGen.publishFeed(targetDateMoment, this.cwd + "/rss/rss.xml", true);
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

Raa1.prototype.registerWebApp = function() {
    var self = this;

    self.iosDB = new sqlite3.Database(this.cwd + '/run/ios-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
      if (err) {
        console.error('Error connecting to iOS database: ' + err.message);        
      }
      console.log('Connected to the iOS database.');
    });
    
    self.fcmDB = new sqlite3.Database(this.cwd + '/run/fcm-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
      if (err) {
        console.error('Error connecting to FCM database: ' + err.message);        
      }
      console.log('Connected to the FCM database.');
    });

    self.iosDB.serialize(function() {
        self.iosDB.run("CREATE TABLE if not exists devices (deviceId TEXT PRIMARY_KEY, unique(deviceId))");
    });

    self.fcmDB.serialize(function() {
        self.fcmDB.run("CREATE TABLE if not exists devices (deviceId TEXT PRIMARY_KEY, unique(deviceId))");
    });

    self.webApp = express()
    self.webApp.get('/registerDevice/ios/:deviceId', function(req, res) {
        var deviceId = req.params['deviceId'];
        if (deviceId) {
            // Persist deviceId in our local database
            self.iosDB.serialize(function() {
                var stmt = self.iosDB.prepare("INSERT INTO devices VALUES (?)");
                stmt.run(deviceId, function(err) {
                    // Insertion can fail because of duplicate rows coming in. Ignore them
                    // TODO better exception handling
                });
            });
        }
        res.send("Success");
    });

    self.webApp.get('/registerDevice/fcm/:deviceId', function(req, res) {
        var deviceId = req.params['deviceId'];
        if (deviceId) {
            // Persist deviceId in our local database
            self.fcmDB.serialize(function() {
                var stmt = self.fcmDB.prepare("INSERT INTO devices VALUES (?)");
                stmt.run(deviceId, function(err) {
                    // Insertion can fail because of duplicate rows coming in. Ignore them
                    // TODO better exception handling
                });
            });
        }
        res.send("Success");
    });

    self.webApp.get('/linkgenerator/:medium/:urlEncoded', function(req, res) {
        var medium = req.params['medium'];
        var urlEncoded = req.params['urlEncoded'];
        var reqUrl = Buffer.from(urlEncoded, 'base64').toString('ascii');

        if (reqUrl) {
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var userAgent = req.headers['user-agent'];
            
            // Report to GA server
            var gaParams = {
                'v': '1',
                'tid': 'UA-103579661-1',
                'cid': '555',
                't': 'event',
                'ea': 'play',
            };
            gaParams.el = reqUrl;
            gaParams.uip = ip;
            gaParams.ua = userAgent;
            gaParams.ec = medium;
            gaParams.ca = medium;
            gaParams.cn = medium;
            gaParams.cm = medium;

            var requestOptions = {
                url: "https://www.google-analytics.com/collect",
                method: "POST",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                form: gaParams                
            }

            request.post(requestOptions, 
                function(error, response, body) {
                    if (error) {
                        console.log("Error while sending GA request: " + error);
                    }
                });

            return res.redirect(reqUrl);
        }

        return res.status(400).send("The query url is missing or not valid");
    });

    self.webApp.listen(7799, function () {
        console.log('Raa device registration endpoint activated on port 7799');
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
