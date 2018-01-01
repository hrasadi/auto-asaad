const SerializableObject = require('./SerializableObject');

const Publishing = require('./Publishing');

const Context = require('../Context');

const S = require('./Show');
const ShowTemplate = S.ShowTemplate;
const PreShowTemplate = S.PreShowTemplate;
const PreShowPlan = S.PreShowPlan;
const ShowPlan = S.ShowPlan;

const moment = require('moment');

class BaseProgram extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get ProgramId() {
        return this.getOrNull(this._programId);
    }

    set ProgramId(value) {
        this._programId = value;
    }

    get Title() {
        return this.getOrNull(this._title);
    }

    set Title(value) {
        this._title = value;
    }

    get Publishing() {
        this.getOrElse(this._publishing, new Publishing());
    }

    set Publishing(value) {
        if (value) {
            this._publishing = new Publishing(value);
        }
    }
}
class ProgramTemplate extends BaseProgram {
    static createTemplate(json, parent) {
        if (json.ProgramType === 'Premiere') {
            return new PremiereProgramTemplate(json, parent);
        } else if (json.ProgramType === 'Replay') {
            return new ReplayProgramTemplate(json, parent);
        }
    }

    constructor(jsonOrOther, parent = null) {
        super(jsonOrOther);

        // REFERENCES
        this._parentBoxTemplate = parent;
    }

    get ProgramType() {
        return this._programType;
    }

    set ProgramType(value) {
        this._programType = value;
    }

    get PremiereDate() {
        let result = this.getOrNull(this._premiereDate);
        if (result) {
            result = moment(result);
        }
        return result;
    }

    set PremiereDate(value) {
        this._premiereDate = value;
    }

    /**
     * Path to program cover image (used in feed cards and podcasts)
     */
    get CoverArt() {
        return this.getOrNull(this._coverArt);
    }

    set CoverArt(value) {
        this._coverArt = value;
    }
}
class PremiereProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    plan(targetDate, parent) {
        // Plan a new episode
        let plannedPreShow = null;
        let plannedShow = null;

        if (this.PreShowTemplate) {
            plannedPreShow = this.PreShowTemplate.plan(targetDate, parent);
        }

        if (this.ShowTemplate) {
            plannedShow = this.ShowTemplate.plan(targetDate, parent);
        }

        if (!plannedShow) {
            return null;
        }

        let plannedProgram = new ProgramPlan(this, parent);
        plannedProgram.PreShowPlan = plannedPreShow;
        plannedProgram.ShowPlan = plannedShow;

        return plannedProgram;
    }

    get PreShowTemplate() {
        return this.getOrNull(this._preShowTemplate);
    }

    set PreShowTemplate(value) {
        if (value) {
            this._preShowTemplate = new PreShowTemplate(value, this);
        }
    }

    get ShowTemplate() {
        return this.getOrNull(this._showTemplate);
    }

    set ShowTemplate(value) {
        if (value) {
            this._showTemplate = new ShowTemplate(value, this);
        }
    }
}

class ReplayProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    plan(targetDate, parent) {
        let originalAiringDate =
                moment(targetDate)
                .subtract(this.OriginalAiringOffset, 'days')
                .format('YYYY-MM-DD');

        // If offset == 0, we are replaying from today
        let originalAiringLineupPlan =
                !this.OriginalAiringOffset ? parent._parentLineupPlan :
                Context.LineupManager
                .getLineupPlan(originalAiringDate);

        if (!originalAiringLineupPlan ||
            !originalAiringLineupPlan.Version ||
            originalAiringLineupPlan.Version !== '3.0') {
            // Not supported! Format too old or
            // original lineup does not exist at all
            return null;
        }

        let originalBoxPlan =
            originalAiringLineupPlan.getBoxPlan(this.OriginalBoxId);
        if (!originalBoxPlan) {
            return null;
        }

        // Now check for the programs in the original airing and
        // find the target programs
        // Apply include filter
        let replayProgramPlans = [];
        for (let programPlan of originalBoxPlan.ProgramPlans) {
            let replayEligible = false;

            // Apply the include filter (no include section means *)
            if (!this.Include || this.Include.includes(programPlan.ProgramId)) {
                replayEligible = true;
            }

            // Apply the exclude filter (no include section means null)
            if (this.Exclude && this.Exclude.includes(programPlan.ProgramId)) {
                replayEligible = false;
            }

            if (replayEligible) {
                let replayProgram = new ProgramPlan(programPlan, parent);
                if (replayProgram) {
                    replayProgram.ProgramId =
                                        programPlan.ProgramId + '_Replay';
                    replayProgram.Title = programPlan.Title + ' - تکرار';
                    replayProgramPlans.push(replayProgram);
                }
            }
        }

        if (replayProgramPlans.length == 0) {
            return null;
        }

        return replayProgramPlans;
    }

    get OriginalAiringOffset() {
        return this.getOrNull(this._originalAiringOffset);
    }

    set OriginalAiringOffset(value) {
        this._originalAiringOffset = parseInt(value);
    }

    get OriginalBoxId() {
        return this.getOrNull(this._originalBoxId);
    }

    set OriginalBoxId(value) {
        this._originalBoxId = value;
    }

    get Include() {
        return this.getOrNull(this._include);
    }

    set Include(value) {
        this._include = value;
    }

    get Exclude() {
        return this.getOrNull(this._exclude);
    }

    set Exclude(value) {
        this._exclude = value;
    }
}

class ProgramPlan extends BaseProgram {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentBoxPlan = parent;
    }

    compile(startTimeMoment, parent) {
        let compiledProgram = new Program(this, parent);

        let compiledPreShow = null;
        if (this.PreShowPlan) {
            compiledPreShow = this.PreShowPlan.compile(this, compiledProgram);
        }
        let compiledShow = this.ShowPlan.compile(this, compiledProgram);

        if (!compiledShow) {
            return null;
        }

        compiledProgram.PreShow = compiledPreShow;
        compiledProgram.Show = compiledShow;

        let compiledProgramMetadata = new Metadata(compiledProgram);
        compiledProgramMetadata.Duration =
                compiledPreShow ? compiledPreShow.Duration : 0 +
                compiledShow.Duration;
        compiledProgramMetadata.StartTime = moment(startTimeMoment);
        compiledProgramMetadata.EndTime =
                             moment(startTimeMoment)
                            .add(compiledProgramMetadata.Duration, 'seconds');

        compiledProgram.Metadata = compiledProgramMetadata;
        return compiledProgram;
    }

    get PreShowPlan() {
        return this.getOrNull(this._preShowPlan);
    }

    set PreShowPlan(value) {
        if (value) {
            this._preShowPlan = new PreShowPlan(value);
        }
    }

    get ShowPlan() {
        return this.getOrNull(this._showPlan);
    }

    set ShowPlan(value) {
        if (value) {
            this._showPlan = new ShowPlan(value);
        }
    }
}

class Program extends BaseProgram {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    schedule() {

    }

    get PreShow() {
        return this.getOrNull(this._preShow);
    }

    set PreShow(value) {
        if (value) {
            this._preShow = value;
        }
    }

    get Show() {
        return this.getOrNull(this._show);
    }

    set Show(value) {
        if (value) {
            this._show = value;
        }
    }

    get Metadata() {
        return this.getOrNull(this._metadata);
    }

    /**
     * @param {Metadata} value Program metadata \
     * (including calculated start and end time)
     */
    set Metadata(value) {
        if (value) {
            this._metadata = value;
        }
    }
}

class Metadata extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get StartTime() {
        return this.getOrNull(this._startTime);
    }

    set StartTime(value) {
        this._startTime = value;
    }

    get EndTime() {
        return this.getOrNull(this._endTime);
    }

    set EndTime(value) {
        this._endTime = value;
    }

    get Duration() {
        return this.getOrNull(this._duration);
    }

    set Duration(value) {
        this._duration = value;
    }
}

module.exports = {
    'ProgramTemplate': ProgramTemplate,
    'ProgramPlan': ProgramPlan,
    'Program': Program,
    'PremiereProgramTemplate': PremiereProgramTemplate,
    'ReplayProgramTemplate': ReplayProgramTemplate,
};
