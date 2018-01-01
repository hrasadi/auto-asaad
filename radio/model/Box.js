const SerializableObject = require('./SerializableObject');

const Schedule = require('./Schedule');

const P = require('./Program');
const ProgramTemplate = P.ProgramTemplate;

const moment = require('moment');

class BaseBox extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get BoxId() {
        return this.getOrNull(this._boxId);
    }

    set BoxId(value) {
        this._boxId = value;
    }

    // Floating boxes can cut and break other boxes and have priority over other
    // programs. It comes with some limitations:
    // 1- It can only contain one program
    // 2- If not completely wrapped in another box, it will shown as a single
    // program in the lineup
    get IsFloating() {
        return this.getOrElse(this._isFloating, false);
    }

    set IsFloating(value) {
        this._isFloating = value;
    }
}

class BoxTemplate extends BaseBox {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentLineupTemplate = parent;
    }

    validate() {
        if (!this.Schedule) {
            throw Error('BoxTemplate should have Schedule property set.');
        }
    }

    plan(targetDate, parent) {
        if (this.Schedule.isOnSchedule(targetDate)) {
            if (this.ProgramTemplates) {
                let boxPlan = new BoxPlan(this, parent);
                boxPlan.ProgramPlans = [];
                for (let programTemplate of this.ProgramTemplates) {
                    let programPlan = programTemplate.plan(targetDate, boxPlan);
                    if (programPlan) {
                        boxPlan.ProgramPlans = boxPlan.ProgramPlans.concat(programPlan);
                    }
                }

                // No programs planned for this box
                if (boxPlan.ProgramPlans.length == 0) {
                    return null;
                }

                boxPlan.StartTime = this.Schedule
                    .calculateStartTime(targetDate, this.BoxId);

                return boxPlan;
            }
        }
        return null;
    }

    get ProgramTemplates() {
        return this.getOrNull(this._programTemplates);
    }

    set ProgramTemplates(values) {
        if (typeof values !== 'undefined' && values) {
            if (this.IsFloating && values.length > 1) {
                throw Error('Box is marked as floating but' +
                 'it contains more than one program.');
            }

            this._programTemplates = [];
            for (let value of values) {
                let programTemplate =
                    ProgramTemplate.createTemplate(value, this);
                this._programTemplates.push(programTemplate);
            }
        }
    }

    get Schedule() {
        return this.getOrNull(this._schedule);
    }

    set Schedule(value) {
        this._schedule = new Schedule(value);
    }
}

class BoxPlan extends BaseBox {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentLineupPlan = parent;
    }

    compile(parent) {
        let box = new Box(this, parent);
        box.Programs = [];

        if (!this.ProgramPlans || this.ProgramPlans.length == 0) {
            return null;
        }

        // first program starts when the box starts
        let nextProgramStartTime = this.StartTime;
        let boxDuration = 0;
        for (let programPlan of this.ProgramPlans) {
            let program = programPlan.compile(nextProgramStartTime, box);

            if (program) {
                nextProgramStartTime = program.EndTime;
                boxDuration += program.Metadata.Duration;
                box.Programs.push(program);
            }
        }

        box.EndTime = moment(box.StartTime).add(boxDuration, 'seconds');

        return box;
    }

    get ProgramPlans() {
        return this.getOrNull(this._programPlans);
    }

    /**
     * Programs for this class should be assigned during plan.
     * We do not parse JSON to prevent multiple object copying
     * @param {ProgramPlan[]} values of ProgramPlan objects
     */
    set ProgramPlans(values) {
        this._programPlans = values;
    }

    get StartTime() {
        return this.getOrNull(this._startTime);
    }

    set StartTime(value) {
        this._startTime = value;
    }
}

class Box extends BaseBox {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentLineup = parent;
    }

    get Programs() {
        return this.getOrNull(this._programs);
    }

    /**
     * Programs for this class should be assigned during plan.
     * We do not parse JSON to prevent multiple object copying
     * @param {Program[]} values of ProgramPlan objects
     */
    set Programs(values) {
        this._programs = values;
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
}

module.exports = {
    'BoxTemplate': BoxTemplate,
    'BoxPlan': BoxPlan,
    'Box': Box,
};
