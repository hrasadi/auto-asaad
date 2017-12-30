const Context = require('../../Context');

const fs = require('fs');

class Counter {
    static createCounter(counterType, counterId, maxValue, immutable) {
        if (counterType === 'Iterator') {
            return new Counter(counterId, maxValue, immutable);
        } else if (counterType == 'CyclicIterator') {
            return new CyclicCounter(counterId, maxValue, immutable);
        }
    }

    constructor(counterId, maxValue, immutable = true) {
        this._counterId = counterId;
        this._maxValue = maxValue;
        this._immutable = immutable;

        this._counterFilePath = Context.CWD +
            '/run/counter/' + this._counterId + '.counter';
        this._counterValue = 0;
        this._tag = -1;

        if (fs.existsSync(this._counterFilePath)) {
            let data = JSON.parse(fs.readFileSync(
                    this._counterFilePath, 'utf-8'));

            this._counterValue = parseInt(data.counterValue);
            this._tag = data.tag;
        }
    }

    /*
    * The tag helps us repeat the generation for the
    * same day (in case of a problem), without risking the iterator move forward
    */
    next(requesterTag, offset) {
        if (requesterTag == undefined) {
            throw Error('Tag should be provided for all counter requests');
        }
        if (requesterTag < this._tag) {
            throw Error('Counter tag should be an increasing sequence');
        }

        if (!this._maxValue || this._maxValue == 0) {
            return null;
        }

        if (requesterTag == this._tag) {
            return this.adjustCounterByOffset(this._counterValue - 1, offset);
        } else if (this.hasNext(offset)) {
            this._counterValue++;
            this._tag = requesterTag;

            this.persist();

            return this.adjustCounterByOffset(this._counterValue - 1, offset);
        }

        return null;
    }

    hasNext(offset) {
        offset = offset ? offset : 0;
        if (this._counterValue + offset >= this._maxValue) {
            return false;
        }
        return true;
    }

    adjustCounterByOffset(base, offset) {
        if (offset) {
            return base + offset;
        } else {
            return base;
        }
    }

    reset() {
        this._counterValue = 0;
        this._tag = -1;
        this.persist();
    }

    persist() {
        if (!this._immutable) {
            let result = {
                'tag': this._tag,
                'counterValue': this._counterValue,
            };

            fs.writeFileSync(this._counterFilePath,
                JSON.stringify(result, null, 2));
        }
    }

    get CounterValue() {
        return this._counterValue;
    }

    get Tag() {
        return this._tag;
    }
}

class CyclicCounter extends Counter {
    constructor(counterId, maxValue, immutable = true) {
        super(counterId, maxValue, immutable);
    }

    next(requesterTag, offset) {
        if (requesterTag == undefined) {
            throw Error('Tag should be provided for all iterator requests');
        }
        if (requesterTag < this._tag) {
            throw Error('Iterator tag should be an increasing sequence');
        }

        if (!this._maxValue || this._maxValue == 0) {
            return null;
        }

        let result = null;
        if (requesterTag == this._tag) {
            result = this.adjustCounterByOffset(this._counterValue - 1,
                    offset);
        } else if (this.linearCounterHasNext()) {
            this._counterValue++;
            this._tag = requesterTag;

            result = this.adjustCounterByOffset(this._counterValue - 1, offset);

            this.persist();
        } else {
            this.reset();
            // Offset will be taken into consideration
            // after resetting the iterator
            result = this.next(requesterTag, offset);
        }

        return result;
    }

    adjustCounterByOffset(base, offset) {
        if (offset) {
            return (base + offset) % this._maxValue;
        } else {
            return base;
        }
    }

    linearCounterHasNext() {
        return Counter.prototype.hasNext.call(this);
    }

    hasNext() {
        if (this._maxValue && this._maxValue > 0) {
            return true;
        }
    }
}

module.exports = {
    'Counter': Counter,
    'CyclicCounter': CyclicCounter,
};
