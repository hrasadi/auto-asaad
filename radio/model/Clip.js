const SerializableObject = require('./SerializableObject');

class Clip extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }
}

module.exports = Clip;
