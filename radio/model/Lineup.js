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

    plan(targetDateMoment) {
        Context.Logger.info('Planning lineup for ' + targetDateMoment);

        let lineupPlan = new LineupPlan();

        if (this.BoxTemplates) {
            let plannedBoxes = [];
            for (let boxTemplate of this.BoxTemplates) {
                let box = boxTemplate.plan(targetDateMoment);
                if (box) {
                    plannedBoxes.push(box);
                }
            }
            lineupPlan.BoxPlans = plannedBoxes;
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

    get BoxPlans() {
        return this.getOrNull(this._boxPlans);
    }

    set BoxPlans(values) {
        if (typeof values !== 'undefined' && values) {
            this._boxPlans = [];
            for (let value of values) {
                let box = new BoxPlan(value);
                this._boxPlans.push(box);
            }
        }
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
