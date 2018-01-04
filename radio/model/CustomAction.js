const SerializableObject = require('./SerializableObject');

class CustomAction extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get On() {
        return this.getOrNull(this._on);
    }

    set On(value) {
        this._on = value;
    }

    get Action() {
        return this.getOrNull(this._action);
    }

    set Action(value) {
        this._action = value;
    }

    get Params() {
        return this.getOrNull(this._params);
    }

    set Params(values) {
        this._params = values;
    }
}

module.exports = CustomAction;
