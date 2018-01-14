const SerializableObject = require('../SerializableObject');

const AppContext = require('../../AppContext');

const fs = require('fs');

class ProgramInfo extends SerializableObject {
    constructor(jsonOrOther, id) {
        super(jsonOrOther);

        this.ProgramId = id;
    }

    deflateProgramInfo() {
        if (this.ProgramInfoFilePath) {
            let absPath = AppContext.getInstance().CWD + '/conf/pinfo/' +
                                                         this.ProgramInfoFilePath;
            let pInfoJSON = JSON.parse(fs.readFileSync(absPath));
            Object.assign(this, pInfoJSON);
        }
    }

    get ProgramInfoFilePath() {
        return this.getOrNull(this._programInfoFilePath);
    }

    set ProgramInfoFilePath(value) {
        this._programInfoFilePath = value;
    }

    get ProgramId() {
        return this.getOrNull(this._programId);
    }

    set ProgramId(value) {
        this._programId = value;
    }

    get Title() {
        return this.getOrNull(this._title);
    }

    set Title(value) {
        this._title = value;
    }

    get About() {
        return this.getOrNull(this._about);
    }

    set About(value) {
        this._about = value;
    }

    get Thumbnail() {
        return this.getOrNull(this._thumbnail);
    }

    set Thumbnail(value) {
        this._thumbnail = value;
    }

    get CoverArt() {
        return this.getOrNull(this._coverArt);
    }

    set CoverArt(value) {
        this._coverArt = value;
    }
}

module.exports = ProgramInfo;
