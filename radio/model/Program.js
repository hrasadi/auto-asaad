const SerializableObject = require('./SerializableObject');

const Publishing = require('./Publishing');
const Schedule = require('./Schedule');

const S = require('./Show');
const Show = S.Show;
const PreShow = S.PreShow;

const moment = require('moment');

class ProgramTemplate extends SerializableObject {
    static createTemplate(json) {
        if (json.ProgramType === 'Premiere') {
            return new PremiereProgramTemplate(json);
        } else if (json.ProgramType === 'Replay') {
            return new ReplayProgramTemplate(json);
        }
    }

    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get ProgramId() {
        return this.getOrNull(this._programId);
    }

    set ProgramId(value) {
        this._prograId = value;
    }

    get Title() {
        return this.getOrNull(this._title);
    }

    set Title(value) {
        this._title = value;
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
}

class PremiereProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    plan(targetDateMoment) {
        // Plan a new episode

        let plannedPreShow = null;
        let plannedShow = null;

        if (this.PreShow) {
            plannedPreShow = this.PreShow.plan();
        }
        if (this.Show) {
            plannedShow = this.Show.plan();
        }

        this.PreShow = plannedPreShow;
        
        if (!plannedShow) {
            return null;
        }

        let plannedProgram = new ProgramPlan(this);
        plannedProgram.PreShow = plannedPreShow;
        plannedProgram.Show = plannedShow;

        return plannedProgram;
    }

    get PreShow() {
        return this.getOrNull(this._preShow);
    }

    set PreShow(value) {
        if (value) {
            this._preShow = new PreShow(value);
        }
    }

    get Show() {
        return this.getOrNull(this._show);
    }

    set Show(value) {
        if (value) {
            this._show = new Show(value);
        }
    }

    get Publishing() {
        this.getOrNull(this._publishing);
    }

    set Publishing(value) {
        if (value) {
            this._publishing = new Publishing(value);
        }
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

class ReplayProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    plan() {

    }

    get OriginalAiringOffset() {
        return this.getOrNull(this._originalAiringOffset);
    }

    set OriginalAiringOffset(value) {
        this._originalAiringOffset = value;
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

class ProgramPlan extends PremiereProgramTemplate {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    compile() {

    }
}

class Program extends ProgramPlan {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    schedule() {

    }

    // For 'floating boxes', the program will hold the start
    // time upon compilation, as the box will be removed.
    // This program is played back in 'breaking' queue of liquidsoap
    get IsBreaking() {
        return this.StartTime ? true : false;
    }

    get StartTime() {
        return this.getOrNull(this._startTime);
    }

    set StartTime(value) {
        this._startTime = value;
    }

    get Metadata() {
        return this.getOrNull(this._metadata);
    }

    set Metadata(value) {
        if (value) {
            this._metadata = new Metadata(value);
        }
    }
}

class Metadata extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get EstimatedStartTime() {
        return this.getOrNull(this._estimatedStartTime);
    }

    set EstimatedStartTime(value) {
        this._estimatedStartTime = value;
    }

    get EstimatedEndTime() {
        return this.getOrNull(this._estimatedEndTime);
    }

    set EstimatedEndTime(value) {
        this._estimatedEndTime = value;
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
