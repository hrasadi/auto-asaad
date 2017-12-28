const SerializableObject = require('./SerializableObject');

const Context = require('./Context');

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

    get Id() {
        return this.getOrNull(this._id);
    }

    set Id(value) {
        this._id = value;
    }

    get Title() {
        return this.getOrNull(this._title);
    }

    set Title(value) {
        this._title = value;
    }

    get SocialListeningProps() {
        return this.getOrElse(this._socialListeningProps, 
            Object.assign({}, Context.Defaults.SocialListeningProps));
    }

    set SocialListeningProps(value) {
        if (!value) {
            value = {};
        }

        value.DefaultLife = value.DefaultLife ?
            Context.Defaults.SocialListeningProps.DefaultLife :
            value.DefaultLife;
        value.MaxLife = value.MaxLife ?
            Context.Defaults.SocialListeningProps.MaxLife : value.MaxLife;
        value.VoteEffect = value.VoteEffect ?
            Context.Defaults.SocialListeningProps.VoteEffect : value.VoteEffect;

        this._value = value;
    }

    get WeeklySchedule() {
        return this.getOrNull(this._weeklySchedule);
    }

    set WeeklySchedule(value) {
        this._weeklySchedule = value;
    }

    get ProgramType() {
        return this._programType;
    }

    set ProgramType(value) {
        this._programType = value;
    }
}

class PremiereProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get PreShow() {
        return this.getOrNull(this._preShow);
    }

    set PreShow(value) {
        this._preShow = value;
    }

    get Show() {
        return this.getOrNull(this._show);
    }

    set Show(value) {
        this._show = value;
    }

    get PublishPodcast() {
        return this.getOrNull(this._publishPodcast);
    }

    set PublishPodcast(value) {
        this._publishPodcast = value;
    }
}

class ReplayProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther) {
        super(jsonOrOther);
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

class ProgramPlan extends ProgramTemplate {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get StartTime() {
        return this.getOrNull(this._startTime);
    }

    set StartTime(value) {
        this._startTime = value;
    }
}

class Program extends ProgramPlan {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }
}

module.exports = {
    'ProgramTemplate': ProgramTemplate,
    'ProgramPlan': ProgramPlan,
    'Program': Program,
    'PremiereProgramTemplate': PremiereProgramTemplate,
    'ReplayProgramTemplate': ReplayProgramTemplate,
};
