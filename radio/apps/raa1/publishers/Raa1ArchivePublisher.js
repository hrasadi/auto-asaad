const Context = require('../../../Context');

const RollingList = require('./RollingList');
const ArchivePublisher = require('../../../publishers/ArchivePublisher');

const fs = require('fs');
const {URL} = require('url');

class Raa1ArchivePublisher extends ArchivePublisher {
    constructor() {
        super();

        this._archiveParentFilePath =
                        Context.CWD + '/run/archive/raa1-archive.json';

        if (fs.existsSync(this._archiveParentFilePath)) {
            this._programDictionary = JSON.parse(
                    fs.readFileSync(this._archiveParentFilePath));
        } else {
            this._programDictionary = {};
        }

        this._programRollingListsDict = {};
    }

    doPublish(program, targetDate) {
        if (!this._programDictionary[program.ProgramId]) {
            this._programDictionary[program.ProgramId] =
                                    'archive/' + program.ProgramId + '.json';
        }

        if (!this._programRollingListsDict[program.ProgramId]) {
            this._programRollingListsDict[program.ProgramId] =
                    new RollingList(program.ProgramId, targetDate,
                                        Context.CWD + '/run/archive/',
                                        'unlimited');
        }

        this._programRollingListsDict[program.ProgramId].addItem(program);
    }

    commit() {
        fs.writeFileSync(this._archiveParentFilePath,
            JSON.stringify(this._programDictionary, null, 2));

        for (let program in this._programRollingListsDict) {
            if (this._programRollingListsDict.hasOwnProperty(program)) {
                this._programRollingListsDict[program].flush();
            }
        }
    }
}

module.exports = Raa1ArchivePublisher;
