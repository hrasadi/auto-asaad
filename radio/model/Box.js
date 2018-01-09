const Entity = require('./Entity');

const Context = require('../Context');

const Schedule = require('./Schedule');

const LivePlaybackSchedulerMeta = require('./LivePlaybackSchedulerMeta');
const P = require('./Program');
const ProgramTemplate = P.ProgramTemplate;

const fs = require('fs');
const moment = require('moment');

class BaseBox extends Entity {
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

        if (this.IsFloating && this.ProgramTemplates.length > 1) {
            throw Error('Floating boxes can only have one program');
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
                        boxPlan.ProgramPlans =
                                boxPlan.ProgramPlans.concat(programPlan);
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
        let box = Context.LineupManager
                        .RadioApp.ObjectBuilder.buildBox(this, parent);
        let programs = [];

        if (!this.ProgramPlans || this.ProgramPlans.length == 0) {
            return null;
        }

        // first program starts when the box starts
        let nextProgramStartTime = this.StartTime;
        for (let programPlan of this.ProgramPlans) {
            let program = programPlan.compile(nextProgramStartTime, box);

            if (program) {
                nextProgramStartTime = program.EndTime;
                programs.push(program);
            }
        }
        box.Programs = programs;
        // In case there is a shift up due to a preshow
        box.StartTime = moment(box.Programs[0].Metadata.StartTime);
        box.EndTime = moment(box.Programs[box.Programs.length - 1]
                                                        .Metadata.EndTime);
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

    validate() {
        if (this.IsFloating &&
                this.Programs && this.Programs.length > 1) {
            throw Error('Floating box can only contain one program');
        }
    }

    publish(targetDate) {
        for (let program of this.Programs) {
            program.publish(targetDate);
        }
    }

    schedule(targetDate, boxIdx) {
        let oldLineupFilePath = Context.LineupManager
                            .getScheduledLineupFilePath(targetDate);

        if (fs.existsSync(oldLineupFilePath)) {
            let oldLineup = JSON.parse(fs.readFileSync(oldLineupFilePath));
            for (let oldBox of oldLineup.Boxes) {
                if (oldBox.BoxId == this.BoxId) {
                    this.unscheduleBox(Context.LineupManager.RadioApp
                                            .ObjectBuilder.buildBox(oldBox));
                }
            }
        }

        if (!this.IsFloating) {
            this.doScheduleBox(targetDate, boxIdx);
        }
        // Also schedule any program with high priority
        // Note that if the box is floating, we expect it
        // only to have high priority programs
        for (let i = 0; i < this.Programs.length; i++) {
            if (this.Programs[i].Priority == 'High') {
                console.log(boxIdx + ' ' + i);
                this.Programs[i].schedule(targetDate, boxIdx, i);
            }
        }
    }

    // Implemneted in subclasses
    doScheduleBox(targetDate) {
    }

    // Implemented in subclasses
    unscheduleBox(oldBox) {
        // If box is floating, only the box has scheduling
        if (oldBox.IsFloating) {
            oldBox.Programs[0].unschedule();
        } else {
            oldBox.doUnscheduleBox();
            // In case there is a floating program inside the box
            for (let p of oldBox.Programs) {
                if (p.Priority == 'High') {
                    p.unschedule();
                }
            }
        }
    }

    // Implemneted in subclasses
    doUnscheduleBox(oldBox) {
    }

    injectProgram(interruptingProgram) {
        let newBox = Context.LineupManager.RadioApp
                        .ObjectBuilder.buildBox(this, this._parentLineup);
        // find the program that should be interrupted
        // This is the closest program that starts
        // sooner than interrupting.
        // In other words, interrupt crosses its boundaries.
        for (let i = 0; i < this.Programs.length; i++) {
            if (moment(this.Programs[i].Metadata.StartTime)
                .isBefore(interruptingProgram.Metadata.StartTime) &&
                ((i + 1) == this.Programs.length ||
                moment(this.Programs[i + 1].Metadata.StartTime)
                .isAfter(interruptingProgram.Metadata.StartTime))) {
                    let shiftAmount =
                                moment(interruptingProgram.Metadata.EndTime)
                                .diff(interruptingProgram.Metadata.StartTime,
                                'seconds');
                    // We will have three programs resulting:
                    // Original before the interrupt
                    // The interrupting
                    // The result of program
                    let splittedProgs =
                        this.Programs[i]
                            .split(interruptingProgram.Metadata.StartTime,
                                    interruptingProgram.Metadata.EndTime,
                                    shiftAmount);
                    newBox.Programs[i] = splittedProgs[0];
                    newBox.Programs.splice(i + 1, 0,
                        [interruptingProgram, splittedProgs[1]]);

                    // shift all the programs down as well
                    // starting from the next program
                    newBox.shiftProgramsDown(i + 3, shiftAmount);

                return newBox;
            }
        }

        throw Error('Logic error: We should have been able to find a program' +
                    ' to interrupt, but we could\'t. This is a bug');
    }

    shiftProgramsDown(startingProgramIdx, shiftAmount) {
        for (let i = startingProgramIdx; i < this.Programs.length; i++) {
            this.Programs[i].Metadata.StartTime =
                moment(this.Programs[i].Metadata.StartTime)
                .add(shiftAmount, 'seconds');
            this.Programs[i].EndTime =
                moment(this.Programs[i].Metadata.EndTime)
                .add(shiftAmount, 'seconds');
        }
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
        if (values) {
            this._programs = [];
            for (let value of values) {
                if (value.constructor.name == 'Program') {
                    this._programs.push(value);
                } else {
                    this._programs.push(Context.LineupManager.RadioApp
                                        .ObjectBuilder.buildProgram(value));
                }
            }
        }
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
        return moment(this.EndTime).diff(this.StartTime, 'seconds');
    }

    set Duration(value) {
        // do nothing!
    }

    get LivePlaybackSchedulerMeta() {
        return this.getOrNull(this._livePlaybackSchedulerMeta);
    }

    set LivePlaybackSchedulerMeta(value) {
        this._livePlaybackSchedulerMeta = new LivePlaybackSchedulerMeta(value);
    }
}

module.exports = {
    'BoxTemplate': BoxTemplate,
    'BoxPlan': BoxPlan,
    'Box': Box,
};
