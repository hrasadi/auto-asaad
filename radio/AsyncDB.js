const sqlite3 = require('sqlite3').verbose();

class AsyncDB {
    constructor(dbPath) {
        let self = this;
        return new Promise((resolve, reject) => {
            self._db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                }
                resolve(self);
            });
        });
    }

    runAsync(stmt, values) {
        let self = this;
        return new Promise((resolve, reject) => {
            self._db.run(stmt, values, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    allAsync(stmt, values) {
        let self = this;
        return new Promise((resolve, reject) => {
            self._db.all(stmt, values, (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    eachAsync(stmt, values, callback) {
        let self = this;
        return new Promise((resolve, reject) => {
            self._db.each(stmt, values, callback, (err, numRows) => {
                if (err) {
                    reject(err);
                }
                resolve(numRows);
            });
        });
    }

    close() {
        this._db.close();
    }
}

module.exports = AsyncDB;
