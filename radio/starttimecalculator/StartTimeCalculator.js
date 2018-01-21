class StartTimeCalculator {
    constructor() {
    }

    // Implemented in subclasses
    validate(schedulerObj) {
    }

    // Implemented in subclasses
    calculate(targetDate, schedulerObj, user) {
        return null;
    }
}

module.exports = StartTimeCalculator;
