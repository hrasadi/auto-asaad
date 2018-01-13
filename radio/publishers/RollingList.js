const fs = require('fs');

/**
 * This class manages JSON array file, with a maximum number of entries
 */
class RollingList {
    constructor(feedName, targetDate, filePrefix, maxItems = 20) {
        this._feedName = feedName;
        this._targetDate = targetDate;
        this._filePrefix = filePrefix;
        this._listFilePath = this._filePrefix + '/' + this._feedName + '.json';
        if (maxItems == 'unlmitied' || maxItems <= 0) {
            this.maxItems = 0;
        } else {
            this._maxItems = maxItems;
        }

        this._newItems = [];
    }

    addItem(item) {
        if (item) {
            this._dirty = true;
            this._newItems.push(item);

            if (this._newItems.length > this._maxItems) {
                // remove one item from the beginning (oldest entry)
                this._newItems.splice(0, 1);
            }
        }
    }

    loadBak() {
        if (!this._bakList) {
            this._bakList = {
                'Tag': this._targetDate,
                'List': [],
            };

            if (fs.existsSync(this._listFilePath + '.bak')) {
                this._bakList = JSON.parse(fs.readFileSync(
                                        this._listFilePath + '.bak'));
                if (this._bakList.Tag != this._targetDate) {
                    // Date has changed, update the bak file
                    if (fs.existsSync(this._listFilePath)) {
                        let currentList = JSON.parse(
                                        fs.readFileSync(this._listFilePath));
                        this._bakList.Tag = this._targetDate;
                        this._bakList.List = currentList;
                        fs.writeFileSync(this._listFilePath + '.bak',
                                        JSON.stringify(this._bakList, null, 2));
                    }
                }
            } else {
                // create empty one
                fs.writeFileSync(this._listFilePath + '.bak',
                                        JSON.stringify(this._bakList, null, 2));
            }
        }
    }

    flush() {
        this.loadBak();
        this._fullList = this._bakList.List.concat(this._newItems);
        fs.writeFileSync(this._listFilePath,
                                JSON.stringify(this._fullList, null, 2));
    }

    get Items() {
        this.loadBak();

        if (this._dirty) {
            this._dirty = false;
            this._fullList = this._bakList.List.concat(this._newItems);
        }

        return this._fullList ? this._fullList : null;
    }
}

module.exports = RollingList;
