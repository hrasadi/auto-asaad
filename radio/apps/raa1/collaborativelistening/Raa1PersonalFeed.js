const AppContext = require('../../../AppContext');

const P = require('../../../collaborativelistening/PersonalFeed');
const PersonalFeed = P.PersonalFeed;
const PersonalFeedWatcher = P.PersonalFeedWatcher;
const PersonalFeedEntry = P.PersonalFeedEntry;


class Raa1PersonalFeed extends PersonalFeed {
    constructor() {
        super();

        // initiate db
        initDB();
    }

    initDB() {
        self = this;
        this._personalFeedDB = new sqlite3.Database(
                            AppContext.getInstance().CWD + '/run/db/feed.db',
                            sqlite3.OPEN_READWRITE, function(err) {
            if (err) {
              AppContext.getInstance().Logger.error(
                        'Error connecting to "Personal Feed" database: ' + err.message);
            }
            AppContext.getInstance().Logger.info(
                        'Connected to the "Personal Feed" database.');

            self.iosDB.serialize(function() {
                self._personalFeedDB.run(
                    'CREATE TABLE if not exists PersonalFeed ' +
                    '(deviceId TEXT PRIMARY_KEY, unique(deviceId))');
            });
        });

        // archive db
        this._iosDB = new sqlite3.Database(this.cwd + '/run/ios-device-list.db',
                                            sqlite3.OPEN_READWRITE, function(err) {
            if (err) {
              self.logger.error('Error connecting to iOS database: ' + err.message);
            }
            self.logger.info('Connected to the iOS database.');

            self.iosDB.serialize(function() {
                self.iosDB.run("CREATE TABLE if not exists devices (deviceId TEXT PRIMARY_KEY, unique(deviceId))");
            });
        });
    }

    getWatcher() {
        return new Raa1PersonalFeedWatcher(this);
    }
}

class Raa1PersonalFeedWatcher extends PersonalFeedWatcher {

}

module.exports = {
    'Raa1PersonalFeed': Raa1PersonalFeed,
    'Raa1PersonalFeedWatcher': Raa1PersonalFeedWatcher,
}
