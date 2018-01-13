const SerializableObject = require('./SerializableObject') {
    
}
class User extends SerializableObject {
    get UserId() {
        return this.getOrNull(this._userId);
    }

    set UserId(value) {
        this._userId = value;
    }

    get DeviceType() {
        return this.getOrNull(this._deviceType);
    }

    set DeviceType(value) {
        this._deviceType = value;
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

    get Location() {
        return this.getOrNull(this._location);
    }

    set Location(value) {
        this._location = value;
    }
}

class Location {
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

module.exports = {
    'User': User,
    'Location': Location,
}