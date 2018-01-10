const ActionManager = require('../../../lineupaction/ActionManager');

const say = require('./Say');

class Raa1ActionManager extends ActionManager {
    constructor() {
        super();

        this.registerAction('Say', say);
    }
}

module.exports = Raa1ActionManager;
