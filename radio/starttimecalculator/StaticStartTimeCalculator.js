const StartTimeCalculator = require('./StartTimeCalculator');

const moment = require('moment');

class StaticStartTimeCalculator extends StartTimeCalculator {
    validate(scheduleObj) {
        if (!scheduleObj.Params.At) {
            throw Error('Property "At" must be set with calulation method "Static".');
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

        let startTime = moment(scheduleObj.Params.At, ['h:m:s', 'H:m:s']);
        let startTimeMoment = moment(targetDate)
            .hours(startTime.hours())
            .minutes(startTime.minutes())
            .seconds(startTime.seconds());

        return startTimeMoment;
    }
}

module.exports = StaticStartTimeCalculator;
