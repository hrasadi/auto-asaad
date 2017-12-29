const L = require('./model/Lineup');
const LineupTemplate = L.LineupTemplate;
const LineupPlan = L.LineupPlan;
const Lineup = L.Lineup;

const moment = require('moment');

class LineupManager {

    static getLineupFileNameForDate(targetDateMoment) {
        // TODO:
    }

    constructor() {
        // Dictionary from date to LineupPlan objects.
        this._lineupPlansCache = {};
        this._lineupTemplate = null;
    }

    initiate(config) {
        // Read the template
        this._lineupTemplate = new LineupTemplate(config);
    }

    planLineupRange(startDateMoment, numDaysToPlan = 1) {
        for (let i = 0; i < numDaysToPlan; i++) {
            let targetDateMoment = moment(startDateMoment).add(i, 'days');

            this._lineupPlansCache[targetDateMoment.format('YYYY-MM-DD')] =
                    this._lineupTemplate.plan(targetDateMoment);
        }
    }

    CompileLineupForDate(targetDateMoment) {
    }

    ScheduleLineupForDate(targetDateMoment) {
    }

    getLineupPlan(targetDateMoment) {
        // Load from memory if present

        // Load from file if not in memory

        // If not found (date belongs to feature of latest planned lineup)
        throw Error('LineupPlan for specified date does not exist.' +
         'Perhaps this date is in future');
    }
}

module.exports = LineupManager;
