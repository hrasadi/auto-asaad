const moment = require('moment-timezone');

class DateUtils {
    /**
     * Reads date string from moment (in UTC + 14 timezone)
     * @param {moment} m Moment object to get date from
     * @return {String} Date string
     */
    static getDateString(m) {
        return m.tz('Pacific/Kiritimati').format('YYYY-MM-DD');
    }

    static getTodayString() {
        return DateUtils.getDateString(moment());
    }

    static getEpochSeconds(m) {
        // .unix() returns timestamp is Epoch seconds
        return moment(m).seconds(0).unix();
    }
}

module.exports = DateUtils;
