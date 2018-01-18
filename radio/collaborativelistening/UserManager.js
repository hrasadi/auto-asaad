const DBProvider = require('./DBProvider');
const DBObject = require('./DBObject');

class UserManager extends DBProvider {
    constructor(dbFileName) {
        super(dbFileName);
    }

    init() {
        this.init1();
    }

    init1() {
        let self = this;
        this.init0(() => {
            self._db.run('CREATE TABLE IF NOT EXISTS USER (Id TEXT PRIMARY_KEY, ' +
                        'DeviceType INTEGER, IP TEXT, TimeZone TEXT,' +
                        'Latitude REAL, Longitude REAL, City TEXT, unique(Id))');
        });

        this._type = User;
        this._tableName = 'User';
    }

    registerUser(user) {
        this.persist(user);
    }

    updateUser(user) {
        this.update(user);
    }
}

class User extends DBObject {
    constructor() {
        super();
    }

    get DeviceType() {
        return this.getOrNull(this._deviceType);
    }

    set DeviceType(value) {
        this._deviceType = DeviceTypeEnum[value];
    }

    get IP() {
        return this.getOrNull(this._ip);
    }

    set IP(value) {
        this._ip = value;
    }

    get TimeZone() {
        return this.getOrNull(this._timeZone);
    }

    set TimeZone(value) {
        this._timeZone = value;
    }

    get Latitude() {
        return this.getOrNull(this._latitude);
    }

    set Latitude(value) {
        this._latitude = value;
    }
    get Longitude() {
        return this.getOrNull(this._longitude);
    }

    set Longitude(value) {
        this._longitude = value;
    }

    get City() {
        return this.getOrNull(this._city);
    }

    set City(value) {
        this._city = value;
    }
}

const DeviceTypeEnum = Object.freeze({
    'Web': 0,
    'iOS': 1,
    'Android': 2,
});

module.exports = {
    'UserManager': UserManager,
    'User': User,
    'DeviceTypeEnum': DeviceTypeEnum,
};
