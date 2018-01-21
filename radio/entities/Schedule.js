const Entity = require('./Entity');

const AppContext = require('../AppContext');

const moment = require('moment');

const WeekDayIndexMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};

class Schedule extends Entity {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    isOnSchedule(targetDate) {
        // Check the weekly schedule
        if (!this.WeeklySchedule) {
            return true;
        }

        let targetDateDayOfWeek = moment(targetDate).day();
        if (this._weeklyScheduleBitmap[targetDateDayOfWeek]) {
            return true;
        }
        return false;
    }

    calculateStartTime(targetDate, user) {
        return this.getCalculatorObject().calculate(targetDate, this, user);
    }

    getCalculatorObject() {
        let calculatorObj = null;

        if (this._calculator) {
            calculatorObj = AppContext.getInstance(
                'LineupGenerator'
            ).StartTimeCalculatorManager.getCalculator(this._calculator);

            if (!calculatorObj) {
                throw Error(
                    'Calculator ' + this._calculator + ' is not registered.'
                );
            }
        }

        return calculatorObj;
    }

    get Calculator() {
        return this.getOrNull(this._calculator);
    }

    set Calculator(value) {
        if (value) {
            this._calculator = value;
        }
    }

    get WeeklySchedule() {
        return this.getOrNull(this._weeklySchedule);
    }

    set WeeklySchedule(values) {
        if (values) {
            this._weeklySchedule = values;

            this._weeklyScheduleBitmap = Array(7).fill(0);
            for (let value of values) {
                this._weeklyScheduleBitmap[WeekDayIndexMap[value]] = 1;
            }
        }
    }

    get Params() {
        return this.getOrNull(this._params);
    }

    set Params(value) {
        this._params = value;
    }
}

module.exports = Schedule;
