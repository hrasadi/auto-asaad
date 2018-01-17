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

    init0(resolve) {
        this._db = new sqlite3.Database(AppContext.getInstance().CWD +
                                        '/run/db/' + this._dbFileName, resolve);
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

    getEntryList(whereClause) {
        let query = DBObject.getSelectPreStatement(whereClause);
        this._db.run(query.statement, query.values);

    }
}

module.exports = DBProvider;
