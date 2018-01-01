const SerializableObject = require('./SerializableObject');

const Context = require('../Context');

const MediaDirectory = require('./media/MediaDirectory');

const B = require('./Box');
const BoxTemplate = B.BoxTemplate;

const moment = require('moment');

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
        let lineup = new Lineup();
        lineup.Boxes = [];

        for (let boxPlan of this.BoxPlans) {
            let box = boxPlan.compile(lineup);
            if (box) {
                lineup.Boxes.push(box);
            }
        }

        // Sort, validate and merge floating boxes
        lineup.Boxes.sort((a, b) => {
            return moment(a.StartTime).isBefore(b.StartTime) ? -1 : 1;
        });

        // manually validate the compiled lineup
        lineup.validate();

        console.log(lineup)
        return lineup;
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

    /**
     * asserts that the boxes are not overlapping in time.
     * Exception is floating boxes as they can interrupt other
     * boxes.
     */
    validate() {
        for (let i = 0; i < this.Boxes.length; i++) {
            // floating box is valid
            if (this.Boxes[i].isFloating) {
                continue;
            }
            // Except for the first box
            if (i > 0) {
                if (moment(this.Boxes[i].StartTime)
                        .isBefore(moment(this.Boxes[i - 1].EndTime)) &&
                    !this.Boxes[i - 1].isFloating) {
                        throw Error('Boxes are overlapping: Box: ' +
                                this.Boxes[i - 1].BoxId + ' ending at: ' +
                                moment(this.Boxes[i - 1].EndTime).toString() +
                                ', with Box: ' + this.Boxes[i].BoxId +
                                ' starting at: ' + moment(this.Boxes[i].StartTime).toString());
                    }
            }
        }
    }

    schedule() {
        this.fixFloatingBoxes();
        // schedule based on type
    }

    /**
     * The idea is that floating boxes can collide other boxes
     * and interrupt them. As the actual playback switch is managed
     * using liquidsoap prioritized queues, we also need to manage
     * our lineup so that the information shown to listeners are
     * accurate
     */
    fixFloatingBoxes() {

    }
}

module.exports = {
    'LineupTemplate': LineupTemplate,
    'LineupPlan': LineupPlan,
    'Lineup': Lineup,
};
