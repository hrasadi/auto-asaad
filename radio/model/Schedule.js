const SerializableObject = require('./SerializableObject');

const moment = require('moment');

const WeekDayIndexMap = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6,
};

class Schedule extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    validate() {
        if (this.CalculationMethod === 'static' && !this.At) {
            throw Error(
                'Property "At" must be set with calulation method static.');
        }
        if (this.CalculationMethod === 'dynamic' && !this.Calculator) {
            throw Error('Property "Calculator" must be set with calulation' +
            'method dynamic.');
        }
    }

    isOnSchedule(targetDateMoment) {
        // Check the weekly schedule
        if (!this.WeeklySchedule) {
            return true;
        }

        let targetDateDayOfWeek = targetDateMoment.day();
        if (this._weeklyScheduleBitmap[targetDateDayOfWeek]) {
            return true;
        }
        return false;
    }

    calculateStartTime(targetDateMoment, id) {
        let startTimeMoment = null;
        if (this.CalculationMethod == 'static') {
            let startTime = moment(this.At, ['h:m:s', 'H:m:s']);
            startTimeMoment = moment(targetDateMoment)
                .hours(startTime.hours())
                .minutes(startTime.minutes())
                .seconds(startTime.seconds());
        } else {
            // TODO:
            // startTimeMoment = moment(this.context.radio[template.StartTime.Calculator](targetDateMoment, itemId));
        }

        return startTimeMoment;
    }

    get CalculationMethod() {
        return this.getOrNull(this._calculationMethod);
    }

    set CalculationMethod(value) {
        this._calculationMethod = value;
    }

    get At() {
        return this.getOrNull(this._at);
    }

    set At(value) {
        this._at = value;
    }

    get Calculator() {
        return this.getOrNull(this._calculator);
    }

    set Calculator(value) {
        this._calculator = value;
    }

    get WeeklySchedule() {
        return this.getOrNull(this._weeklySchedule);
    }

    set WeeklySchedule(values) {
        if (values) {
            this._weeklySchedule = values;

            this._weeklyScheduleBitmap = Array(7);
            for (let value of values) {
                this._weeklyScheduleBitmap[WeekDayIndexMap[value]] = 1;
            }
        }
    }
}

module.exports = Schedule;
