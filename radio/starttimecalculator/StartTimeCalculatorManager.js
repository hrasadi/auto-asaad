const StaticStartTimeCalculator = require('./StaticStartTimeCalculator');

class StartTimeCalculatorManager {
    constructor() {
        this._calculatorMap = {};

        this.registerCalculator('Static', new StaticStartTimeCalculator());
    }

    registerCalculator(name, fn) {
        this._calculatorMap[name] = fn;
    }

    getCalculator(name) {
        return this._calculatorMap[name];
    }   
}

module.exports = StartTimeCalculatorManager;
