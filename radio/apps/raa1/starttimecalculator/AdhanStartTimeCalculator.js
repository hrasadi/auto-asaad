const StartTimeCalculator = require('../../../starttimecalculator/StartTimeCalculator');

const AppContext = require('../../../AppContext');
const DateUtils = require('../../../DateUtils');

const moment = require('moment');
const request = require('sync-request');
const queryString = require('query-string');
const md5 = require('md5');

class AdhanStartTimeCalculator extends StartTimeCalculator {
    constructor(adhanConf) {
        super();

        this._adhanConf = adhanConf;
        this._timingsCache = {};
    }

    validate(scheduleObj) {
        if (!scheduleObj.Params.AdhanName) {
            throw Error(
                'Property "AdhanName" must be set with calulation method "Adhan".'
            );
        }
    }

    /**
     * Returns a moment with time in the user's local timezone
     * @param {String} targetDate target date in string format YYYY-MM-DD
     * @param {Schedule} scheduleObj schedule params
     * @param {User} user user object (or null for the radio live broadcast)
     * @return {moment} Loclaized start time moment
     */
    calculate(targetDate, scheduleObj, user) {
        this.validate(scheduleObj);

        let timing = this.readAdhanTimings(targetDate, (user ? user : this._adhanConf));
        return timing[scheduleObj.Params.AdhanName];
    }

    readAdhanTimings(targetDate, user) {
        let qs = queryString.stringify({
            country: user.Country,
            state: user.State,
            city: user.City,
            method: this._adhanConf.CalculationMethod,
        });
        qs = DateUtils.getEpochSeconds(targetDate) + '?' + qs;

        if (this._timingsCache[md5(qs)]) {
            return this._timingsCache[md5(qs)];
        }

        let res = request(
            'GET',
            'http://api.aladhan.com' +
                '/timingsByCity/' +
                qs
        );

        if (res.statusCode > 400) {
            AppContext.getInstance().Logger.warn(
                'Adhan API request failed with error: ' +
                    res.statusCode +
                    ' ' +
                    res.getBody()
            );
            return null;
        }

        if (res.statusCode > 300) {
            throw Error('Error while reading adhan times for given request: ' + qs);
        }
        let parsed = JSON.parse(res.getBody());

        let dateTimings = {};
        for (let adhanName in parsed.data.timings) {
            if (parsed.data.timings.hasOwnProperty(adhanName)) {
                let timingLocalMoment = moment.tz(
                    targetDate + ' ' + parsed.data.timings[adhanName],
                    'YYYY-MM-DD HH:mm',
                    parsed.data.meta.timezone
                );

                dateTimings[adhanName] = timingLocalMoment;
            }
        }

        // Cache for future use
        this._timingsCache[md5(qs)] = dateTimings;

        return dateTimings;
    }
}

module.exports = AdhanStartTimeCalculator;
