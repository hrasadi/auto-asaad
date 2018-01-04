const SerializableObject = require('./SerializableObject');

const CustomAction = require('./CustomAction');

const Context = require('../Context');

class Entity extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    onEvent(eventName) {
        let customAction = this.findCustomAction(eventName);

        if (customAction) {
            let action = Context.LineupManager
                        .ActionManager.getAction(customAction.Action);

            if (action) {
                action(this, customAction.Params);
            }
        }
    }

    findCustomAction(eventName) {
        if (this.CustomActions) {
            for (let customAction of this.CustomActions) {
                if (customAction.On === eventName) {
                    return customAction;
                }
            }
        }
        return null;
    }

    get CustomActions() {
        return this.getOrNull(this._customActions);
    }

    set CustomActions(values) {
        if (values) {
            this._customActions = [];
            this._
            for (let value of values) {
                this._customActions.push(new CustomAction(value));
            }
        }
    }
}

module.exports = Entity;
