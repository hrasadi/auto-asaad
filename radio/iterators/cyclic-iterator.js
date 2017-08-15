var Iterator = require('./iterator');

var OOUtils = require('../../utils');

var CyclicIterator = function(list, persistent = false, listIteratorFile) {
    Iterator.call(this, list, persistent, listIteratorFile);
}

OOUtils.inheritsFrom(CyclicIterator, Iterator);

CyclicIterator.prototype.clone = function(sourceIterator, persistent = false, listIteratorFile) {
    return new CyclicIterator(sourceIterator.list, persistent, listIteratorFile);
}

CyclicIterator.prototype.next = function(requesterTag) {
    if (requesterTag == undefined) {
        throw "Tag should be provided for all requests";
    }
    if (requesterTag < this.tag) {
        throw "Tag should be an increasing sequence";
    }

    resultItem = null;
    
    // handle the case of empty list
    if (!this.list || this.list.length == 0) {
        return resultItem;
    }

    if (requesterTag == this.tag) {
        resultItem = this.list[this.iteratorValue - 1];
    } else if (this.linearListHasNext()) {
        resultItem = this.list[this.iteratorValue];
        
        this.iteratorValue++;
        this.tag = requesterTag;
        this.persistIteratorValue();
    } else {
        this.reset();
        resultItem = this.next(requesterTag);
    }

    return resultItem;
}

CyclicIterator.prototype.linearListHasNext = function() {
    return Iterator.prototype.hasNext.call(this);
}

CyclicIterator.prototype.hasNext = function() {
    if (this.list && this.list.length > 0) {
        return true;
    }
}

module.exports = CyclicIterator;