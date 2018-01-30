const Logger = require('../../../logger');
const AppContext = require('../../AppContext');

const UF = require('./collaborativelistening/Raa1PublicFeed');
const Raa1PublicFeed = UF.Raa1PublicFeed;

const SF = require('./collaborativelistening/Raa1PersonalFeed');
const Raa1PersonalFeed = SF.Raa1PersonalFeed;

const Raa1UserManager = require('./collaborativelistening/Raa1UserManager');
const U = require('../../collaborativelistening/UserManager');
const User = U.User;

const program = require('commander');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

class Raa1API extends AppContext {
    constructor(program) {
        super();

        this._confFilePath = program.args[0];

        this._productionMode = process.env.NODE_ENV == 'production' ? true : false;

        this._cwd = __dirname;

        let myName = path.basename(__filename, '.js');
        this._logger = new Logger(this._cwd + '/run/logs/' + myName + '.log');

        this._webApp = express();
    }

    async init() {
        try {
            try {
                this._conf = JSON.parse(fs.readFileSync(this._confFilePath));
            } catch (e) {
                this.Logger.error('Error parsing config file. Inner exception is: ' + e);
                process.exit(1);
            }
            // User manager
            this._userManager = new Raa1UserManager(
                this._conf.CollaborativeListening.FeedDBFile
            );
            // Feeds
            this._publicFeed = new Raa1PublicFeed(
                this._conf.CollaborativeListening.FeedDBFile
            );
            // this._personalFeed = new Raa1PersonalFeed('feed.db');

            await this._publicFeed.init();
            await this._userManager.init(this._conf.Credentials);

            this.registerAPI();

            process.on('SIGINT', () => this.shutdown());
            process.on('unhandledRejection', (e) => console.log(e));
        } catch (error) {
            this._logger.error('Uncaught Error: ' + error.stack);
            process.exit(0);
        }
    }

    shutdown() {
        this._logger.info('Signal received. Shutting down...');

        // Wait for any incomplete work
        this.UserManager.shutdown();
        this.PublicFeed.shutdown();

        process.exit();
    }

    registerAPI() {
        let self = this;
        this._webApp.post('/registerDevice/:deviceType/', (req, res) => {
            let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            let user = new User(req.body, req.params.deviceType, ip);
            self.UserManager.registerUser(user);
            res.send('Success');
        });

        this._webApp.get('/publicfeed', async (req, res) => {
            try {
                let feed = await this.PublicFeed.renderFeed();
                res.send(feed);
            } catch (error) {
                AppContext.getInstance.Logger.error(error.stack);
            }
        });

        this._webApp.get('/linkgenerator/:medium', (req, res) => {
            let medium = req.params['medium'];
            let urlEncoded = req.query['src'];
            let reqUrl = Buffer.from(urlEncoded, 'base64').toString('ascii');

            if (reqUrl) {
                let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                let userAgent = req.headers['user-agent'];

                // Report to GA server
                let gaParams = {
                    v: '1',
                    tid: 'UA-103579661-1',
                    cid: '555',
                    t: 'event',
                    ea: 'play',
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

                request.post(requestOptions, function(error, response, body) {
                    if (error) {
                        self.logger.error('Error while sending GA request: ' + error);
                    }
                });

                return res.redirect(reqUrl);
            }

            return res.status(400).send('The querystring is missing or not valid');
        });

        this._webApp.use(bodyParser.json());
        this._webApp.use((err, req, res, next) => {
            AppContext.getInstance().Logger.error(err.stack);
            res
                .status(500)
                .send(
                    'Oops! We cannot think of anything right now.' +
                        'Please come back later'
                );
        });
        this._webApp.listen(this._conf.Port, () => {
            AppContext.getInstance().Logger.info(
                'Raa API started on port ' + this._conf.Port
            );
        });
    }

    get PublicFeed() {
        return this._publicFeed;
    }

    get UserManager() {
        return this._userManager;
    }
}

/* === Entry Point === */
program.version('1.0.0').parse(process.argv);

if (program.args.length < 1) {
    console.log('Usage: [NODE_ENV=production] node raa1-api.js {config-file}');
    process.exit(1);
}

new Raa1API(program).init();
