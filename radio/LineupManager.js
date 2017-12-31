const Context = require('./Context');

const L = require('./model/Lineup');
const LineupTemplate = L.LineupTemplate;
const LineupPlan = L.LineupPlan;

const moment = require('moment');
const fs = require('fs');

class LineupManager {
    constructor() {
        // Dictionary from date to LineupPlan objects.
        this._lineupPlansCache = {};
        this._lineupTemplate = null;
    }

    initiate(config, mediaClass) {
        // Read the template
        this._lineupTemplate = new LineupTemplate(config);
        this._mediaClass = mediaClass;
    }

    planLineupRange(startDateMoment, numDaysToPlan = 1) {
        this._baseDate = startDateMoment.format('YYYY-MM-DD');

        for (let i = 0; i < numDaysToPlan; i++) {
            let targetDate = moment(startDateMoment)
                                    .add(i, 'days').format('YYYY-MM-DD');

            this._lineupPlansCache[targetDate] =
                    this._lineupTemplate.plan(targetDate);

            fs.writeFileSync(this.getLineupPlanFilePath(targetDate),
                    JSON.stringify(this._lineupPlansCache[targetDate],
                        null, 2));
        }
    }

    CompileLineup(targetDate) {
    }

    ScheduleLineup(targetDate) {
    }

    getLineupFileName(targetDate) {
        return Context.LineupFileNamePrefix +
                '-' + targetDate;
    }

    getLineupPlanFilePath(targetDate) {
        return Context.CWD + '/lineups/' +
            this.getLineupFileName(targetDate) + '.json';
    }

    getLineupPlan(targetDate) {
        // plan asks for itself!
        console.log(targetDate);
        console.log(this.BaseDate);
        if (targetDate == this.BaseDate) {
            console.log(this.getLineupPlan.caller);
        }

        // Load from memory if present
        if (this._lineupPlansCache[targetDate]) {
            return this._lineupPlansCache[targetDate];
        }

        // Load from file if not in memory
        let lineupFilePath = this.getLineupPlanFilePath(targetDate);
        if (fs.existsSync(lineupFilePath)) {
            return new LineupPlan(JSON.parse(fs.readFileSync(lineupFilePath)));
        }

        // If not found (date belongs to feature of latest planned lineup)
        throw Error('LineupPlan for specified date does not exist.' +
         'Perhaps this date is in future');
    }

    get BaseDate() {
        return this._baseDate;
    }

    get MediaClass() {
        return this._mediaClass;
    }
}

module.exports = LineupManager;
