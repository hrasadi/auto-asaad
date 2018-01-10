const addClip = require('./AddClip');

class ActionManager {
    constructor() {
        this._actionMap = {};

        this.registerAction('AddClip', addClip);
    }

    registerAction(name, fn) {
        this._actionMap[name] = fn;
    }

    getAction(name) {
        return this._actionMap[name];
    }
}

module.exports = ActionManager;
