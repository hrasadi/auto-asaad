const AppContext = require('../AppContext');

const AsyncDB = require('../AsyncDB');

const DBObject = require('./DBObject');

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

    async init0(resolve) {
        this._db = await new AsyncDB(AppContext.getInstance().CWD +
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
        return this._db.runAsync(query.statement, query.values);
    }

    persistList(dbObjects) {
        let query = DBObject.getListInsertPreStatement(dbObjects);
        return this._db.runAsync(query.statement, query.values);
    }

    update(dbObject) {
        let query = dbObject.getUpdatePreStatement();
        return this._db.runAsync(query.statement, query.values);
    }

    entryListForEach(fromType, whereClause, onRow) {
        let query = DBObject.getSelectPreStatement(fromType, whereClause);
        return this._db.eachAsync(query.statement, query.values, onRow);
    }

    entryListForAll(fromType, whereClause) {
        let query = DBObject.getSelectPreStatement(fromType, whereClause);
        return this._db.allAsync(query.statement, query.values);
    }
}

module.exports = DBProvider;
