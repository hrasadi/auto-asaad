const AppContext = require('../../../AppContext');

const C = require('./Countable');
const DateCountable = C.DateCountable;

const fs = require('fs');

// Max number of days that we keep history for an iterator
const MAX_HISTORY_RETAIN_DAYS = 14;

class Iterator {
    static createDateCounter(iteratorType, iteratorId, maxValue, immutable) {
        if (iteratorType === 'Linear') {
            return new Iterator(iteratorId, maxValue, DateCountable, immutable);
        } else if (iteratorType == 'Cyclic') {
            return new CyclicIterator(iteratorId, maxValue, DateCountable, immutable);
        }
    }

    constructor(iteratorId, maxValue, CountableType, immutable = true) {
        this._iteratorId = iteratorId;
        this._maxValue = maxValue;
        this._immutable = immutable;
        this._CountableType = CountableType;

        this._iteratorFilePath =
            AppContext.getInstance().CWD +
            '/run/iterator/' +
            this._iteratorId +
            '.iterator';

        this.reset();
        this._tag = this._CountableType.MinCountable;
        this._history = '';

        this.loadIterator();
    }

    loadIterator() {
        if (fs.existsSync(this._iteratorFilePath)) {
            let data = JSON.parse(fs.readFileSync(this._iteratorFilePath, 'utf-8'));

            this._iteratorPos = parseInt(data.iteratorPos);
            this._tag = new this._CountableType(data.tag);
            this._history = data.history ? data.history : '';
        }
    }

    /*
    * The tag helps us repeat the generation for the
    * same day (in case of a problem), without risking the iterator move forward
    */
    next(requesterTagValue, offset) {
        if (requesterTagValue == undefined) {
            throw Error('Tag should be provided for all counter requests');
        }

        if (!this._maxValue || this._maxValue == 0) {
            return null;
        }

        let requesterTag = new this._CountableType(requesterTagValue);

        // Easy case, same as before
        if (this._tag.equals(requesterTag)) {
            return this._iteratorPos;
        }

        if (requesterTag.diff(this._tag) > 0) {
            // New tag is ahead of us. Easy! Increase iterator and update history
            return this.doMoveAhead(requesterTag, offset);
        } else {
            // We are asking for a value from past, we must rollback
            return this.rollback(requesterTag, offset);
        }

        return null;
    }

    // Overriden in subclasses
    doMoveAhead(requesterTag, offset) {
        if (this.hasNext(offset)) {
            this._history = this.pushTagToHistory(requesterTag);
            this._iteratorPos++;
            this._tag = requesterTag;

            this.persist();

            return this.adjustByOffset(this._iteratorPos, offset);
        }
        return null;
    }

    rollback(requesterTag, offset) {
        // Here are the steps:
        // 1- Check if we have enough history to rollback
        // 2- Calculate the offset based on the history
        // 3- Adjust by offset, update values and history (obviously a cropped one now)

        let diff = this._tag.diff(requesterTag); // We expect this to be a positive int
        if (diff > this._history.length) {
            throw Error(
                `Not enough history to rollback, required ${diff}` +
                ` but history length was ${this._history.length}.`
            );
        }

        // Count number of '1's in the history substring
        let rollbackOffset = (this._history.substring(0, diff).match(/1/g) || []).length;

        // From the location of rolling back to the end of string
        this._history = this._history.substring(diff);
        this._iteratorPos = this.adjustByOffset(
            this._iteratorPos,
            rollbackOffset * (-1)
        );
        this._tag = requesterTag; // Rollback the tag value as well

        if (!this.isInBounds()) {
            throw Error('Requested iterator position found not in bound ' +
                        'when rolling back. This should not happen unless underlying ' +
                        'have been changed. We cannot proceed!');
        }

        this.persist();

        if (this.isInBounds(offset)) {
            return this.adjustByOffset(this._iteratorPos, offset);
        }

        return null;
    }

    pushTagToHistory(requesterTag) {
        // We expect this number to be positive integer
        let diff = requesterTag.diff(this._tag);
        // Pad the history with zero (for tag values no one requested a value on)
        let newHistory = '1' + '0'.repeat(diff - 1) + this._history;
        // Limit the length of history we keep
        return newHistory.substring(0, MAX_HISTORY_RETAIN_DAYS);
    }

    // Overriden by subclasses
    adjustByOffset(base, offset) {
        if (offset) {
            return base + offset;
        } else {
            return base;
        }
    }

    // Overriden by subclasses
    isInBounds(offset = 0) {
        if (this._iteratorPos + offset < this._maxValue) {
            return true;
        }
        return false;
    }

    hasNext(offset = 0) {
        if (this.isInBounds(offset + 1)) {
            return true;
        }
        return false;
    }


    reset() {
        this._iteratorPos = -1;
    }

    persist() {
        if (!this._immutable) {
            let result = {
                'tag': this._tag.Value,
                'iteratorPos': this._iteratorPos,
                'history': this._history,
            };

            fs.writeFileSync(this._iteratorFilePath, JSON.stringify(result, null, 2));
        }
    }

    get Tag() {
        return this._tag;
    }

    get IteratorPos() {
        return this._iteratorPos;
    }

    get History() {
        return this._history;
    }
}

class CyclicIterator extends Iterator {
    constructor(counterId, maxValue, CountableType, immutable = true) {
        super(counterId, maxValue, CountableType, immutable);
    }

    doMoveAhead(requesterTag, offset) {
        if (this.linearIteratorHasNext()) {
            this._history = this.pushTagToHistory(requesterTag);
            this._iteratorPos++;
            this._tag = requesterTag;

            this.persist();

            return this.adjustByOffset(this._iteratorPos, offset);
        } else {
            this.reset();
            // Offset will be taken into consideration
            // after resetting the iterator
            return this.doMoveAhead(requesterTag, offset);
        }
    }

    adjustByOffset(base, offset) {
        if (offset) {
            return this.mod(base + offset, this._maxValue);
        } else {
            return base;
        }
    }

    linearIteratorHasNext() {
        return Iterator.prototype.hasNext.call(this);
    }

    // always true unless the maxValue is not set correctly
    hasNext() {
        if (this._maxValue && this._maxValue > 0) {
            return true;
        }
    }

    // Positive mode
    mod(n, m) {
        return ((n % m) + m) % m;
    }
}

module.exports = {
    'Iterator': Iterator,
    'CyclicIterator': CyclicIterator,
};
