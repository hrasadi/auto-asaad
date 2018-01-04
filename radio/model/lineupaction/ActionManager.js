class ActionManager {
    constructor() {
        this._actionMap = {};
    }

    registerAction(name, fn) {
        this._actionMap[name] = fn;
    }

    getAction(name) {
        return this._actionMap[name];
    }
}

module.exports = ActionManager;
