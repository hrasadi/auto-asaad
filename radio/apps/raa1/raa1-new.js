const RadioApp = require('../../RadioApp');

const Context = require('../../Context');

const LineupManager = require('../../LineupManager');

const Raa1ActionManager = require('./lineupaction/Raa1ActionManager');

const ObjectBuilder = require('../../model/ObjectBuilder');
const StandaloneMedia = require('../../standalone/StandaloneMedia');
const StandaloneBox = require('../../standalone/StandaloneBox');
const StandaloneProgram = require('../../standalone/StandaloneProgram');

const Raa1ClipUtils = require('./Raa1ClipUtils');

const Raa1PodcastPublisher = require('./publishers/Raa1PodcastPublisher');
const Raa1ArchivePublisher = require('./publishers/Raa1ArchivePublisher');

const fs = require('fs');
const moment = require('moment');

class Raa1 extends RadioApp {
    constructor() {
        super();
        this._conf = JSON.parse(fs.readFileSync('./conf/raa1-new.conf'));
        this._manager = new LineupManager();

        Context.LineupManager = this._manager;
        Context.NoScheduling = true;

        this.initiate();
    }

    initiate() {
        this._objectBuilder = new ObjectBuilder({
            'Box': StandaloneBox,
            'Program': StandaloneProgram,
            'Media': StandaloneMedia,
        });

        this._publishers = {
            'PodcastPublisher': new Raa1PodcastPublisher(),
            'ArchivePublisher': new Raa1ArchivePublisher(),
        };

        this._actionManager = new Raa1ActionManager();

        this._utils = new Raa1ClipUtils(this._conf);

        this._manager.initiate(this._conf.Radio, this);
    }

    run() {
        this.initiate();
        let today = moment().format('YYYY-MM-DD');
        this._manager.planLineupRange(today, 3);
        this._manager.compileLineup(today);
        this._manager.publishLineup(today);
        this._manager.scheduleLineup(today);
    }
}

new Raa1().run();
