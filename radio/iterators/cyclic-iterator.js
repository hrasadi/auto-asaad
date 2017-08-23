var Iterator = require('./iterator');

var OOUtils = require('../../utils');

var CyclicIterator = function(list, persistent = false, listIteratorFile) {
    Iterator.call(this, list, persistent, listIteratorFile);
}

OOUtils.inheritsFrom(CyclicIterator, Iterator);

CyclicIterator.prototype.clone = function(sourceIterator, persistent = false, listIteratorFile) {
    return new CyclicIterator(sourceIterator.list, persistent, listIteratorFile);
}

CyclicIterator.prototype.next = function(requesterTag, offset) {
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
        var adjustedIdx = this.adjustIteratorByOffset(this.iteratorValue - 1, offset);
        resultItem = this.list[adjustedIdx];

    } else if (this.linearListHasNext()) {
        var adjustedIdx = this.adjustIteratorByOffset(this.iteratorValue, offset);
        resultItem = this.list[adjustedIdx];
        
        this.iteratorValue++;
        this.tag = requesterTag;
        this.persistIteratorValue();
    } else {
        this.reset();
        // Offset will be taken into consideration after resetting the iterator
        resultItem = this.next(requesterTag, offset);
    }

    return resultItem;
}

CyclicIterator.prototype.adjustIteratorByOffset = function(base, offset) {
    if (offset) {
        return (base + offset) % this.list.length;
    } else {
        return base;
    }
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