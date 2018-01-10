class SerializableObject {
    /**
     * @param {object} other either JSON to parse or another object to copy
     */
    constructor(other) {
        if (other) { // we invoke copy constructor
            Object.assign(this, JSON.parse(JSON.stringify(other)));

            // Now validate
            this.validate();
        }
    }

    validate() {}

    getOrNull(prop) {
        if (typeof prop !== 'undefined' && prop) {
            return prop;
        } else {
            return null;
        }
    }

    getOrElse(prop, onElse) {
        if (typeof prop !== 'undefined' && prop) {
            return prop;
        } else {
            return onElse;
        }
    }

    toJSON() {
        return this.toJSONRec(Object.getPrototypeOf(this));
    }

    toJSONRec(proto) {
        // Termination
        if (proto.constructor.name == 'SerializableObject') {
            return {};
        }

        let result = this.toJSONRec(Object.getPrototypeOf(proto));
        for (let getter of this.listGetters(proto)) {
            let getterValue = this[getter];
            if (getterValue) {
                result[getter] = getterValue;
            }
        }
        return result;
    }

    listGetters(proto) {
        return Object.entries(
           Object.getOwnPropertyDescriptors(proto))
           .filter(([key, descriptor]) => typeof descriptor.get === 'function')
           .map(([key]) => key);
    }
}

module.exports = SerializableObject;
