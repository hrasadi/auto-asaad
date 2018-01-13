const FeedEntry = require('./FeedEntry');

class PersonalFeedEntry extends FeedEntry {
    constructor() {
        super();
    }

    get UserId() {
        return this._userId;
    }

    set UserId(value) {
        this._uesrId = value;
    }

    get Program() {
        return this._program;
    }

    set Program(value) {
        this._program = value;
    }    
}

module.exports = PersonalFeedEntry;
