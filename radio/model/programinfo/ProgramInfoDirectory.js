const ProgramInfo = require('./ProgramInfo');

const SerializableObject = require('../SerializableObject');

class ProgramInfoDirectory extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);

        this.deflate();
    }

    get deflate() {
        if (this.ProgramInfos) {
            for (let pInfo of this.ProgramInfos) {
                pInfo.deflateProgramInfo();
            }
        }
    }

    get ProgramInfos() {
        return this.getOrNull(this._programInfo);
    }

    set ProgramInfos(values) {
        if (values) {
            this._programInfos = {};
            for (let pname in values) {
                if (values.hasOwnProperty(pname)) {
                    this._programInfos[pname] = new ProgramInfo(values[pname]);
                }
            }
        }
    }
}

module.exports = ProgramInfoDirectory;
