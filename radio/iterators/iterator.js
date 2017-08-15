var fs = require('fs');

var Iterator = function(list, persistent = false, listIteratorFile) {
    this.persistent = persistent;

    this.list = list;
    
    this.listIteratorFile = listIteratorFile;
    this.iteratorValue = 0;
    this.tag = -1;
    if (fs.existsSync(this.listIteratorFile)) {
        var data = JSON.parse(fs.readFileSync(this.listIteratorFile, 'utf-8'));
        this.iteratorValue = data.iteratorValue;
        this.tag = data.tag;
    }

    this.initialized = true;
}

Iterator.prototype.clone = function(sourceIterator, persistent = false, listIteratorFile) {
    return new Iterator(sourceIterator.list, persistent, listIteratorFile);
}

/*
The tag helps us repeat the generation for the same day (in case of a problem), without risking 
the iterator move forward
*/
Iterator.prototype.next = function(requesterTag) {
    if (requesterTag == undefined) {
        throw "Tag should be provided for all requests";
    }
    if (requesterTag < this.tag) {
        throw "Tag should be an increasing sequence";
    }

    resultItem = null;
    if (requesterTag == this.tag) {
        resultItem = this.list[this.iteratorValue - 1];
    } else if (this.hasNext()) {
        resultItem = this.list[this.iteratorValue];
        
        this.iteratorValue++;
        this.tag = requesterTag;
        
        this.persistIteratorValue();            
    }
    return resultItem;
}

Iterator.prototype.get = function(index) {
    return this.list[index];
}

Iterator.prototype.hasNext = function() {
    if (!this.list || this.iteratorValue == this.list.length) {
        return false;
    }
    return true;
}

Iterator.prototype.reset = function() {
    this.iteratorValue = 0;
    this.tag = -1;
    this.persistIteratorValue();
}

Iterator.prototype.persistIteratorValue = function() {
    if (this.persistent) {
        var result = {
            "tag": this.tag,
            "iteratorValue": this.iteratorValue
        };

        fs.writeFileSync(this.listIteratorFile, JSON.stringify(result, null, 2));        
    } 
}

Iterator.build = 

module.exports = Iterator