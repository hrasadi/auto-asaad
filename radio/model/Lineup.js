const SerializableObject = require('./SerializableObject');

const Context = require('../Context');

const B = require('./Box');
const BoxTemplate = B.BoxTemplate;
const Box = B.Box;

class LineupTemplate extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    plan(targetDateMoment) {
        Context.Logger.info('Planning lineup for ${date}',
            targetDateMoment.format('YYYY-MM-DD'));

        let lineupPlan = new LineupPlan();

        if (this.BoxTemplates) {
            let plannedBoxes = [];
            for (let boxTemplate of this.BoxTemplates) {
                let box = boxTemplate.plan(targetDateMoment);
                if (box) {
                    plannedBoxes.append(box);
                }
            }
            lineupPlan.Boxes = plannedBoxes;
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
                let boxTemplate = new BoxTemplate(value);
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
}

class LineupPlan extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    compile() {

    }

    get Boxes() {
        return this.getOrNull(this._boxes);
    }

    set Boxes(values) {
        if (typeof values !== 'undefined' && values) {
            this._boxes = [];
            for (let value of values) {
                let box = new Box(value);
                this._boxes.push(box);
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
