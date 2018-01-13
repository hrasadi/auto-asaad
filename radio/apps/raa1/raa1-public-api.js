const APIBase = require('./APIBase');

const Logger = require('../../../logger');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();

class Raa1PublicAPI extends APIBase {
    constructor(port) {
        super(port);

        this._logger = new Logger(__dirname + '/run/logs/public-api.log');
    }

    register() {
        this.openDatabases();

        let self = this;

        this.register0(() => {
            self._logger.info('Raa public API activated on port: ' + self._port);
        });
    }

    openDatabases() {
        this._iosDB = new sqlite3.Database(this.cwd + '/run/ios-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
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
    }

    registerCalls() {
        let self = this;

        self._webApp.get('/registerDevice/ios/:deviceId', (req, res) => {
            let deviceId = req.params.deviceId;
            if (deviceId) {
                // Persist deviceId in our local database
                self.iosDB.serialize(function() {
                    let stmt = self.iosDB.prepare('INSERT INTO devices VALUES (?)');
                    // Insertion can fail because of duplicate rows coming in. Ignore it
                    stmt.run(deviceId);
                });
            }
            res.send('Success');
        });

        self._webApp.get('/registerDevice/fcm/:deviceId', (req, res) => {
            let deviceId = req.params.deviceId;
            if (deviceId) {
                // Persist deviceId in our local database
                self.fcmDB.serialize(() => {
                    let stmt = self.fcmDB.prepare('INSERT INTO devices VALUES (?)');
                    // Insertion can fail because of duplicate rows coming in. Ignore it
                    stmt.run(deviceId);
                });
            }
            res.send('Success');
        });

        let deliverMedia = function(req, res) {
            let medium = req.params.medium;
            let urlEncoded = req.quer.src;
            let reqUrl = Buffer.from(urlEncoded, 'base64').toString('ascii');

            if (reqUrl) {
                let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                let userAgent = req.headers['user-agent'];

                // Report to GA server
                let gaParams = {
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

                let requestOptions = {
                    url: 'https://www.google-analytics.com/collect',
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    form: gaParams,
                };

                request.post(requestOptions,
                    (error, response, body) => {
                        if (error) {
                            self._logger.error('Error while sending GA request: ' +
                                                error);
                        }
                    });

                return res.redirect(reqUrl);
            }
            return res.status(400).send('The request is not valid');
        };

        // DEPRECATE: linkgenerator is deprecated in favor of 'deliver'
        self._webApp.get('/linkgenerator/:medium', deliverMedia);
        self._webApp.get('/deliver/:medium', deliverMedia);
    }
}

let publicAPI = new Raa1PublicAPI(7799);
publicAPI.register();
