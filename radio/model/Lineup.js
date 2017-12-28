const ProgramTemplate = require('./Program');
const SerializableObject = require('./SerializableObject');

class LineupTemplate extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    plan() {
        let lineupPlan = null;
        return lineupPlan;
    }
}

class LineupPlan extends LineupTemplate {
    constructor() {
        super();
        this._id = null;
    }

    get Id() {
        return this._id;
    }
}

class Lineup extends LineupPlan {
    constructor() {
        super();
        this._id = null;
    }
}

module.exports = {
    'LineupTemplate': LineupTemplate,
    'LineupPlan': LineupPlan,
    'Lineup': Lineup,
};
