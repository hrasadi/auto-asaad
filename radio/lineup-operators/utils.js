// This is compatible with momentjs .day() convention
var WeekDaysEnum = {
    "Sun": 0,
    "Mon": 1,
    "Tue": 2,
    "Wed": 3,
    "Thu": 4,
    "Fri": 5,
    "Sat": 6
}

var Lineup = function() {
    this.date = null,
    this.momentObj = null,
    this.lineupFilePath = "",
    this.compiledLineupFilePath = "",
    this.lineup = {},
    this.compiledLineup = {}
}

var IteratorType = {
    "Iterator": '../iterators/iterator',
    "CyclicIterator": '../iterators/cyclic-iterator',
    "PriorityIterator": '../iterators/priority-iterator',
}

var IteratorFactory = function() {    
}

IteratorFactory.build = function(iteratorType, list, persistent = false, listIteratorFile) {
    clazz = null;
    try {
        clazz = require(IteratorType[iteratorType]);
        return new clazz(list, persistent, listIteratorFile);
    } catch(e) {
        console.log(e);
        return null;
    }
}

module.exports = {
    "WeekDaysEnum": WeekDaysEnum,
    "Lineup": Lineup,
    "IteratorFactory": IteratorFactory    
}
