const SerializableObject = require('./SerializableObject');

const Context = require('../Context');

const MediaDirectory = require('./media/MediaDirectory');

const B = require('./Box');
const BoxTemplate = B.BoxTemplate;
const BoxPlan = B.BoxPlan;

class LineupTemplate extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    plan(targetDate) {
        Context.Logger.info('Planning lineup for ' + targetDate);

        let lineupPlan = new LineupPlan();

        if (this.BoxTemplates) {
            lineupPlan.BoxPlans = [];
            for (let boxTemplate of this.BoxTemplates) {
                let boxPlan = boxTemplate.plan(targetDate, lineupPlan);
                if (boxPlan) {
                    lineupPlan.BoxPlans.push(boxPlan);
                }
            }
        }
        return lineupPlan;
    }

    get BoxTemplates() {
        return this.getOrNull(this._boxTemplates);
    }

    set BoxTemplates(values) {
        if (typeof values !== 'undefined' && values) {
            this._boxTemplates = [];
            for (let value of values) {
                let boxTemplate = new BoxTemplate(value, this);
                this._boxTemplates.push(boxTemplate);
            }
        }
    }

    get Version() {
        return this.getOrElse(this.value, Context.Defaults.Version);
    }

    set Version(value) {
        this._version = value;
    }

    get MediaDirectory() {
        return this.getOrNull(this._mediaDirectory);
    }

    set MediaDirectory(value) {
        if (value) {
            this._mediaDirectory = new MediaDirectory(value);
        }
    }
}

class LineupPlan extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    compile() {

    }

    getBoxPlan(boxId) {
        if (!this.BoxPlans || this.BoxPlans.length == 0) {
            return null;
        }
        for (let boxPlan of this.BoxPlans) {
            if (boxPlan.BoxId == boxId) {
                return boxPlan;
            }
        }
        return null;
    }

    get BoxPlans() {
        return this.getOrNull(this._boxPlans);
    }

    set BoxPlans(values) {
        this._boxPlans = values;
    }

    get Version() {
        return this.getOrElse(this.value, Context.Defaults.Version);
    }

    set Version(value) {
        this._version = value;
    }
}

class Lineup extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    schedule() {

    }
}

module.exports = {
    'LineupTemplate': LineupTemplate,
    'LineupPlan': LineupPlan,
    'Lineup': Lineup,
};
