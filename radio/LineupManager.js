const Context = require('./Context');

const L = require('./model/Lineup');
const LineupTemplate = L.LineupTemplate;
const LineupPlan = L.LineupPlan;
const Lineup = L.Lineup;

const moment = require('moment');
const fs = require('fs');

class LineupManager {
    constructor() {
        // Dictionary from date to LineupPlan objects.
        this._lineupPlansCache = {};
        this._lineupTemplate = null;
    }

    initiate(config, radioApp) {
        this._radioApp = radioApp;

        // Read the template
        this._lineupTemplate = new LineupTemplate(config);
    }

    planLineupRange(startDate, numDaysToPlan = 1) {
        this._baseDate = startDate;

        for (let i = 0; i < numDaysToPlan; i++) {
            let targetDate = moment(startDate)
                                    .add(i, 'days').format('YYYY-MM-DD');

            this._lineupPlansCache[targetDate] =
                    this._lineupTemplate.plan(targetDate);

            fs.writeFileSync(this.getLineupPlanFilePath(targetDate),
                    JSON.stringify(this._lineupPlansCache[targetDate],
                        null, 2));
        }
    }

    compileLineup(targetDate) {
        let lineup = this.getLineupPlan(targetDate).compile();

        fs.writeFileSync(this.getLineupFilePath(targetDate),
                JSON.stringify(lineup, null, 2));
    }

    publishLineup(targetDate) {
        let lineup = this.getLineup(targetDate);
        if (lineup) {
            lineup.publish(targetDate);
        } else {
            throw Error('Lineup not found for date ' + targetDate);
        }
    }

    scheduleLineup(targetDate) {
        let lineup = this.getLineup(targetDate);
        if (lineup) {
            lineup.schedule(targetDate);

            fs.writeFileSync(this.getScheduledLineupFilePath(targetDate),
                                            JSON.stringify(lineup, null, 2));
        } else {
            throw Error('Lineup not found for date ' + targetDate);
        }
    }

    getLineupFileName(targetDate) {
        return Context.LineupFileNamePrefix +
                '-' + targetDate;
    }

    getLineupPlanFilePath(targetDate) {
        return Context.CWD + '/run/lineup/' +
            this.getLineupFileName(targetDate) + '.planned.json';
    }

    getLineupFilePath(targetDate) {
        return Context.CWD + '/run/lineup/' +
            this.getLineupFileName(targetDate) + '.json';
    }

    getScheduledLineupFilePath(targetDate) {
        return Context.CWD + '/run/lineup/' +
            this.getLineupFileName(targetDate) + '.json.scheduled';
    }

    getLineupPlan(targetDate) {
        // Load from memory if present
        if (this._lineupPlansCache[targetDate]) {
            return this._lineupPlansCache[targetDate];
        }

        // Load from file if not in memory
        let lineupPlanFilePath = this.getLineupPlanFilePath(targetDate);
        if (fs.existsSync(lineupPlanFilePath)) {
            return new LineupPlan(
                    JSON.parse(fs.readFileSync(lineupPlanFilePath)));
        }

        // If not found (date belongs to feature of latest planned lineup)
        throw Error('LineupPlan for specified date does not exist.' +
         'Perhaps this date is in future');
    }

    getLineup(targetDate) {
        // Load from file if not in memory
        let lineupFilePath = this.getLineupFilePath(targetDate);
        if (fs.existsSync(lineupFilePath)) {
            return new Lineup(JSON.parse(fs.readFileSync(lineupFilePath)));
        }
        return null;
    }

    get BaseDate() {
        return this._baseDate;
    }

    get RadioApp() {
        return this._radioApp;
    }
}

module.exports = LineupManager;
