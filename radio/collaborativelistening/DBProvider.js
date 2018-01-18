const AppContext = require('../AppContext');
const DBObject = require('./DBObject');

const sqlite3 = require('sqlite3').verbose();

class DBProvider {
    constructor(dbFileName) {
        this._dbFileName = dbFileName;
    }

    // implemented in subclasses
    init(resolve) {
    }

    // implemented in subclasses
    init1(resolve) {
    }

    init0(resolve) {
        this._db = new sqlite3.Database(AppContext.getInstance().CWD +
                                        '/run/db/' + this._dbFileName, resolve);
    }

    // implemented in subclasses
    shutdown() {
        this.shutdown0();
    }

    shutdown0() {
        this._db.close();
    }

    persist(dbObject) {
        let query = dbObject.getInsertPreStatement();
        this._db.run(query.statement, query.values);
    }

    persistList(dbObjects) {
        let query = DBObject.getListInsertPreStatement(dbObjects);
        this._db.run(query.statement, query.values);
    }

    update(dbObject) {
        let query = dbObject.getUpdatePreStatement();
        this._db.run(query.statement, query.values);
    }

    entryListForEach(fromType, whereClause, onRow) {
        let query = DBObject.getSelectPreStatement(fromType, whereClause);
        this._db.each(query.statement, query.values, onRow);
    }

    entryListForAll(fromType, whereClause, onRows) {
        let query = DBObject.getSelectPreStatement(fromType, whereClause);
        this._db.all(query.statement, query.values, onRows);
    }
}

module.exports = DBProvider;
