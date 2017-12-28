const SerializableObject = require('./SerializableObject');

class Scheduling extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    validate() {
        if (this.CalculationMethod === 'static' && !this.At) {
            throw Error(
                'Property "At" must be set with calulation method static.');
        }
        if (this.CalculationMethod === 'dynamic' && !this.Calculator) {
            throw Error('Property "Calculator" must be set with calulation' +
            'method dynamic.');
        }
    }

    get CalculationMethod() {
        return this.getOrNull(this._calculationMethod);
    }

    set CalculationMethod(value) {
        this._calculationMethod = value;
    }

    get At() {
        return this.getOrNull(this._at);
    }

    set At(value) {
        this._at = value;
    }

    get Calculator() {
        return this.getOrNull(this._calculator);
    }

    set Calculator(value) {
        this._calculator = value;
    }
}

module.exports = Scheduling;
