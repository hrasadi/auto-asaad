const SerializableObject = require('./SerializableObject');

const B = require('./Box');
const BoxTemplate = B.BoxTemplate;

class LineupTemplate extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
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
}

class LineupPlan extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }
}

class Lineup extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }
}

module.exports = {
    'LineupTemplate': LineupTemplate,
    'LineupPlan': LineupPlan,
    'Lineup': Lineup,
};
