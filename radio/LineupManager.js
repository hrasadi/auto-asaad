const AppContext = require('./AppContext');

const L = require('./entities/Lineup');
const LineupTemplate = L.LineupTemplate;
const LineupPlan = L.LineupPlan;
const Lineup = L.Lineup;

const moment = require('moment');
const fs = require('fs');

class LineupManager {
    constructor() {
        // Dictionary from date to LineupPlan objects.
        this._lineupPlansCache = {};
        this._lineupsCache = {};
        this._lineupTemplate = null;
    }

    init(config) {
        // Read the template
        this._lineupTemplate = new LineupTemplate(config);
    }

    planLineupRange(startDate, numDaysToPlan = 1) {
        this._baseDate = startDate;

        for (let i = 0; i < numDaysToPlan; i++) {
            let targetDate = moment(startDate)
                .add(i, 'days')
                .format('YYYY-MM-DD');

            this._lineupPlansCache[targetDate] = this._lineupTemplate.plan(targetDate);

            if (!AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
                fs.writeFileSync(
                    this.getLineupPlanFilePath(targetDate),
                    JSON.stringify(this._lineupPlansCache[targetDate], null, 2)
                );
            }
        }
    }

    compileLineup(targetDate) {
        let lineup = this.getLineupPlan(targetDate).compile();
        this._lineupsCache[targetDate] = lineup;

        if (!AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
            fs.writeFileSync(
                this.getLineupFilePath(targetDate),
                JSON.stringify(lineup, null, 2)
            );
        }
    }

    publishLineup(targetDate) {
        let lineup = this.getLineup(targetDate);
        if (lineup) {
            lineup.publish();
        } else {
            throw Error('Lineup not found for date ' + targetDate);
        }
    }

    scheduleLineup(targetDate) {
        let lineup = this.getLineup(targetDate);
        if (lineup) {
            lineup.schedule();

            let lineupJSON = JSON.stringify(lineup, null, 2);
            if (!AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
                fs.writeFileSync(this.getScheduledLineupFilePath(targetDate), lineupJSON);
            } else {
                AppContext.getInstance().Logger.debug(lineupJSON);
            }
        } else {
            throw Error('Lineup not found for date ' + targetDate);
        }
    }

    getLineupFileName(targetDate) {
        return (
            AppContext.getInstance('LineupGenerator').LineupFileNamePrefix +
            '-' +
            targetDate
        );
    }

    getLineupPlanFilePath(targetDate) {
        return (
            AppContext.getInstance().CWD +
            '/run/lineup/' +
            this.getLineupFileName(targetDate) +
            '.planned.json'
        );
    }

    getLineupFilePath(targetDate) {
        return (
            AppContext.getInstance().CWD +
            '/run/lineup/' +
            this.getLineupFileName(targetDate) +
            '.json'
        );
    }

    getScheduledLineupFilePath(targetDate) {
        return (
            AppContext.getInstance().CWD +
            '/run/lineup/' +
            this.getLineupFileName(targetDate) +
            '.json.scheduled'
        );
    }

    getLineupPlan(targetDate) {
        // Load from memory if present
        if (this._lineupPlansCache[targetDate]) {
            return this._lineupPlansCache[targetDate];
        }

        // Load from file if not in memory
        let lineupPlanFilePath = this.getLineupPlanFilePath(targetDate);
        if (fs.existsSync(lineupPlanFilePath)) {
            return new LineupPlan(JSON.parse(fs.readFileSync(lineupPlanFilePath)));
        }

        // If not found (date belongs to feature of latest planned lineup)
        AppContext.getInstance().Logger.warn(
            'LineupPlan for ' +
                targetDate +
                ' does not exist.'
        );

        return null;
    }

    getLineup(targetDate) {
        // Load from file if not in memory
        if (this._lineupsCache[targetDate]) {
            return this._lineupsCache[targetDate];
        }

        let lineupFilePath = this.getLineupFilePath(targetDate);
        if (fs.existsSync(lineupFilePath)) {
            return new Lineup(JSON.parse(fs.readFileSync(lineupFilePath)));
        }
        return null;
    }

    get MediaDirectory() {
        return this._lineupTemplate.MediaDirectory;
    }

    get BaseDate() {
        return this._baseDate;
    }
}

module.exports = LineupManager;
