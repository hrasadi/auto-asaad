var fs = require('fs');
var fsextra = require('fs-extra');
var path = require('path');

var program = require('commander');

var express = require('express');
var request = require('request');
var sqlite3 = require('sqlite3').verbose();

var Logger = require('../../logger2');

var RaaAPI = function(program) {	
    this.configFilePath = path.resolve(program.args[0]);
    this.cwd = path.resolve(path.dirname(program.args[0]) + '/..');

    var logFilePath = this.cwd + "logs/api.log";
    this.logger = new Logger(logFilePath);
}


RaaAPI.prototype.register = function() {
    var self = this;

    self.iosDB = new sqlite3.Database(this.cwd + '/run/ios-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
      if (err) {
        self.logger.error('Error connecting to iOS database: ' + err.message);        
      }
      self.logger.info('Connected to the iOS database.');
    });
    
    self.fcmDB = new sqlite3.Database(this.cwd + '/run/fcm-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
      if (err) {
        self.logger.error('Error connecting to FCM database: ' + err.message);        
      }
      self.logger.info('Connected to the FCM database.');
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

    self.webApp.get('/linkgenerator/:medium', function(req, res) {
        var medium = req.params['medium'];
        var urlEncoded = req.query['src'];
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
                        self.logger.error("Error while sending GA request: " + error);
                    }
                });

            return res.redirect(reqUrl);
        }

        return res.status(400).send("The querystring is missing or not valid");
    });

    self.webApp.listen(7799, function () {
        self.logger.info('Raa device registration endpoint activated on port 7799');
    });	
}

var RaaAPIUtils = function() {
    var encodeUrl = function(vodUrl) {
        return 'https://api.raa.media/linkgenerator/podcast.mp3?src=' + Buffer.from(vodUrl.toString()).toString('base64');
    }
}

module.exports = RaaAPIUtils;

/* === Entry Point === */

program
    .version('1.0.0')
    .parse(process.argv)

if (program.args.length < 1) {
    console.error("Usage: node raa1.js {config-file}");
    process.exit(1);
}

var api = new RaaAPI(program);

api.register();