const StartTimeCalculatorManager =
                    require('../../../starttimecalculator/StartTimeCalculatorManager');

const AdhanStartTimeCalculator = require('./AdhanStartTimeCalculator');

class Raa1StartTimeCalculatorManager extends StartTimeCalculatorManager {
    constructor(adhanConf) {
        super();

        this.registerCalculator('Adhan', new AdhanStartTimeCalculator(adhanConf));
    }
}

module.exports = Raa1StartTimeCalculatorManager;
