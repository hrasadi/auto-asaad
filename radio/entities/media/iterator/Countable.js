const moment = require('moment');

/**
 * This class encapsulates counting behavior required by tags in our iterators
 */
class Countable {
    constructor(value) {
        this._value = value;
    }

    add(byInteger) {
        if (!Number.isInteger(byInteger)) {
            throw Error(
                'Cannot add "' + byInteger + '" to countable as it is not integer'
            );
        }

        this.add0(byInteger);
    }

    subtract(byInteger) {
        if (!Number.isInteger(byInteger)) {
            throw Error(
                'Cannot add "' + byInteger + '" to countable as it is not integer'
            );
        }

        this.subtract0(byInteger);
    }

    diff(other) {
        if (other.constructor.name !== this.constructor.name) {
            throw Error(`Given countable are not from the same type: ${typeof(other)}, ` +
                        `and ${this.constructor.name}`);
        }

        return this.diff0(other);
    }

    equals(other) {
        if (this.diff(other) === 0) {
            return true;
        }
        return false;
    }

    get Value() {
        return this._value;
    }

    // Smallest number available, used for default tag value
    static get MinCountable() {
        // Implemented in subclasses
        return new Countable(-1);
    }
}

class DateCountable extends Countable {
    constructor(value, unit = 'days') {
        super(value);

        if (moment(value) === moment.invalid) {
            throw Error('Invalid date provided! ' + value);
        }

        this._value = moment(value);
        this._unit = unit;
    }

    add0(byInteger) {
        this._value.add(byInteger, this._unit);
    }

    subtract0(byInteger) {
        this._value.subtract(byInteger, this._unit);
    }

    diff0(other) {
        return this._value.diff(other._value, this._unit);
    }

    get Value() {
        return this._value.format('YYYY-MM-DD');
    }

    static get MinCountable() {
        return new DateCountable('1970-01-01');
    }
}

module.exports = {
    'DateCountable': DateCountable,
};
