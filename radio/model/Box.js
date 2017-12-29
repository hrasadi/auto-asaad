const SerializableObject = require('./SerializableObject');

const Schedule = require('./Schedule');

const P = require('./Program');
const ProgramTemplate = P.ProgramTemplate;

class BaseBox extends SerializableObject {
    get BoxId() {
        return this.getOrNull(this._boxId);
    }

    set BoxId(value) {
        this._id = value;
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

    get Schedule() {
        return this.getOrNull(this._schedule);
    }

    set Schedule(value) {
        this._scheduling = new Schedule(value);
    }
}

class BoxTemplate extends BaseBox {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    validate() {
        if (!this.Schedule) {
            throw Error('Box should have Schedule property set.');
        }
    }

    plan(targetDateMoment) {
        if (this.Schedule.isOnSchedule(targetDateMoment)) {
            if (this.BoxProgramTemplates) {
                let programPlans = [];
                for (let programTemplate of this.BoxProgramTemplates) {
                    let programPlan = programTemplate.plan(targetDateMoment);
                    programPlans.append(programPlan);
                }

                // No programs planned for this box
                if (!programPlans) {
                    return null;
                }

                let box = new Box(this);
                box.Programs = programPlans;
                box.StartTime = this.Schedule
                    .calculateStartTime(targetDateMoment, this.BoxId);
                return box;
            }
        }
        return null;
    }

    get BoxProgramTemplates() {
        return this.getOrNull(this._boxProgramTemplates);
    }

    set BoxProgramTemplates(values) {
        if (typeof values !== 'undefined' && values) {
            if (this.IsFloating && values.length > 1) {
                throw Error('Box is marked as floating but' +
                 'it contains more than one program.');
            }

            this._boxProgramTemplates = [];
            for (let value of values) {
                let programTemplate = ProgramTemplate.createTemplate(value);
                this._boxProgramTemplates.push(programTemplate);
            }
        }
    }
}

class Box extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get Programs() {
        return this._programs;
    }

    set Programs(values) {
        this._programs = [];
        for (let value of values) {
            let program = new ProgramTemplate(value);
            this._programs.push(program);
        }
    }

    get StartTime() {
        return this.getOrNull(this._startTime);
    }

    set StartTime(value) {
        this._startTime = value;
    }
}

module.exports = {
    'BoxTemplate': BoxTemplate,
    'Box': Box,
};
