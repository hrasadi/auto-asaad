const fs = require('fs');
const moment = require('moment');

/**
 * This class manages JSON array file, with a maximum number of entries
 */
class RollingList {
    constructor(feedName, targetDate, filePrefix, maxItems = 20) {
        this._feedName = feedName;
        this._targetDate = targetDate;
        this._filePrefix = filePrefix;
        this._maxItems = maxItems;

        this.reload();
    }

    addItem(item) {
        if (item) {
            this._items.push(item);

            if (this._items.length > this._maxItems) {
                // remove one item from the beginning (oldest entry)
                this._items.splice(0, 1);
            }
        }
    }

    reload() {
        let previousListFilePath = this._filePrefix + '/' + this._feedName +
                                        '-' + moment(this._targetDate)
                                        .subtract(1, 'days')
                                        .format('YYYY-MM-DD') + '.json';

        if (!fs.existsSync(previousListFilePath)) {
            this._items = [];
        } else {
            this._items = JSON.parse(fs.readFileSync(previousListFilePath));
        }
    }

    flush() {
        let listFilePath = this._filePrefix + '/' +
                            this._feedName + '-' + this._targetDate + '.json';

        fs.writeFileSync(listFilePath, JSON.stringify(this._items, null, 2));
    }

    get Items() {
        return this._items;
    }
}

module.exports = RollingList;
