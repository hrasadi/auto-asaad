const moment = require('moment');

class DateUtils {
    static getDateString(m) {
        return m.tz('Pacific/Kiritimati').format('YYYY-MM-DD');
    }

    static getTodayString() {
        return DateUtils.getDateString(moment());
    }

    static getEpochSeconds(m) {
        // .unix() returns timestamp is Epoch seconds
        return m.unix();
    }
}

module.exports = DateUtils;
