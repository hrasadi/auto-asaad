const DBProvider = require('./DBProvider');
const DBObject = require('./DBObject');

class UserManager extends DBProvider {
    constructor(dbFileName) {
        super(dbFileName);
    }

    init() {
        this.init1();
    }

    async init1() {
        await this.init0();
        this._db.runAsync(
            'CREATE TABLE IF NOT EXISTS "USER" (Id TEXT PRIMARY_KEY, ' +
                'DeviceType INTEGER, IP TEXT, TimeZone TEXT, Latitude REAL, ' +
                'Longitude REAL, Country TEXT, State TEXT, City TEXT, unique(Id))'
        );

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
    constructor(jsonOrOther, deviceType) {
        super(jsonOrOther);

        if (deviceType) {
            this._deviceType = DeviceTypeEnum.fromString(deviceType);
        }
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

    get Country() {
        return this.getOrNull(this._country);
    }

    set Country(value) {
        this._country = value;
    }

    get State() {
        return this.getOrNull(this._state);
    }

    set State(value) {
        this._state = value;
    }

    get City() {
        return this.getOrNull(this._city);
    }

    set City(value) {
        this._city = value;
    }
}

const DeviceTypeEnum = Object.freeze({
    Web: 0,
    iOS: 1,
    Android: 2,

    fromString(string) {
        for (let key of Object.keys(this)) {
            if (key.toLowerCase() === string) {
                return this[key];
            }
        }
    },
});

module.exports = {
    UserManager: UserManager,
    User: User,
    DeviceTypeEnum: DeviceTypeEnum,
};
