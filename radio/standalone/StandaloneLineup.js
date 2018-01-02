const Lineup = require('../model/Lineup').Lineup;

class StandaloneLineup extends Lineup {
    /**
     * platform-specific lineup scheduling logic
     */
    schedule() {
        // TODO:
        this.schedule0();
    }
}

module.exports = StandaloneLineup;
