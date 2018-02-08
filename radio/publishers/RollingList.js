const fs = require('fs');

/**
 * This class manages JSON array file, with a maximum number of entries
 */
class RollingList {
    constructor(feedName, filePrefix, maxItems = 20) {
        this._feedName = feedName;
        this._filePrefix = filePrefix;
        this._listFilePath = this._filePrefix + '/' + this._feedName + '.json';
        if (maxItems == 'unlimited' || maxItems <= 0) {
            this._maxItems = 0;
        } else {
            this._maxItems = maxItems;
        }

        this._uncommitedMap = {};
    }

    addItem(item, targetDate) {
        if (item) {
            if (!this._uncommitedMap[targetDate]) {
                this._uncommitedMap[targetDate] = [];
            }

            this._uncommitedMap[targetDate].push(item);
        }
    }

    loadHistroy() {
        if (!this._fullHistory) {
            if (fs.existsSync(this._listFilePath)) {
                this._fullHistory = JSON.parse(
                    fs.readFileSync(this._listFilePath, 'utf-8')
                );
            } else {
                this._fullHistory = {};
            }
        }
    }

    flush() {
        if (Object.keys(this._uncommitedMap).length > 0) {
            this.loadHistroy();

            for (let date in this._uncommitedMap) {
                if (this._uncommitedMap[date]) {
                    // Update the values for date with the new ones
                    this._fullHistory[date] = this._uncommitedMap[date];
                }
            }

            // Now sort, filter and save. Good news is that acsending string sort
            // works for us just fine
            let sortedDates = Object.keys(this._fullHistory).sort();

            // if not unlimited
            if (this._maxItems !== 0) {
                let feedCapacity = this._maxItems;
                let filteredHistory = {};
                // start from newest to oldest
                for (let date of sortedDates.reverse()) {
                    if (feedCapacity - this._fullHistory[date].length > 0) {
                        filteredHistory[date] = this._fullHistory[date];
                        feedCapacity -= this._fullHistory[date].length;
                    } else {
                        // enough, no more room to fit another day
                        break;
                    }
                }
                this._fullHistory = filteredHistory;
            }

            // Save
            fs.writeFileSync(
                this._listFilePath,
                JSON.stringify(this._fullHistory, null, 2)
            );
        }
    }

    // This is where we reassemble the items from different dates, note that
    // this function is only called once a day to update feeds, so I am not
    // worried about it doing some heavy-lifting work
    getItems(forDate) {
        // commit any uncommited changes
        this.flush();

        // We are sure that this._fullHistory is sorted based on date (older first)
        // Therefore we iterate and append values together up to the date
        let result = [];

        let includedDates = Object.keys(this._fullHistory).find((itemDate) => {
            // Dates before or equal 'forDate'
            // lexical ordering will be used
            return (itemDate.localeCompare(forDate) <= 0);
        });

        for (let date of includedDates) {
            result = result.concat(this._fullHistory[date]);
        }

        return result;
    }
}

module.exports = RollingList;
