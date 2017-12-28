const SerializableObject = require('./SerializableObject');
const Scheduling = require('./Scheduling');

const P = require('./Program');
const ProgramTemplate = P.ProgramTemplate;

// const Context = require('./Context');

class BoxTemplate extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get BoxId() {
        return this.getOrNull(this._boxId);
    }

    set BoxId(value) {
        this._id = value;
    }

    get Scheduling() {
        return this.getOrNull(this._scheduling);
    }

    set Scheduling(value) {
        this._scheduling = new Scheduling(value);
    }

    get BoxProgramTemplates() {
        return this.getOrNull(this._boxProgramTemplates);
    }

    set BoxProgramTemplates(values) {
        if (typeof values !== 'undefined' && values) {
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

    get BoxId() {
        return this.getOrNull(this._boxId);
    }

    set BoxId(value) {
        this._id = value;
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

}

module.exports = {
    'BoxTemplate': BoxTemplate,
    'Box': Box,
};
