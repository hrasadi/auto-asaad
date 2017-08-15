LineupManager.prototype.scheduleLineupPlayback = function(oldCompiledLineupPrograms) {

    this.today.compiledLineup.PlaylistStartIdx = 0;

    for (var i = 0; i < this.today.compiledLineup.Programs.length; i++) {
        var currentProgram = this.today.compiledLineup.Programs[i];

        // if the program is explicitly marked for scheduling (StartTime is
        // specified for it), do it!
        if (currentProgram.Show.StartTime) {
            // Note that we only schedule programs with a future start times.
            // Hence, we are not prune to scheduling problems if admins modify the
            // lineup midway throughout the day
            if (currentProgram.Show.StartTime.isAfter(moment())) {
                this.schedulePlayback(currentProgram, i);
            } else {
                this.today.compiledLineup.PlaylistStartIdx = i + 1;
                this.logger.warn("Program " + currentProgram.Id + " start time is already passed. Hence I do not schedule it.");
            }
        }
    }

    // unschedule the old programs
    if (oldCompiledLineupPrograms) {
        for (var i = 0; i < oldCompiledLineupPrograms.length; i++) {
            this.unschedulePlayback(oldCompiledLineupPrograms[i]);
        }
    }

    // Let managers do any additional work after scheduling programs is completed (e.g. inform update of lineup to liquidsoap)
    this.onSchedulingComplete();
}

// implemented in subclasses
LineupManager.prototype.onSchedulingComplete = function() {
    console.log("Not implemented!");
}

// implemented in subclasses
LineupManager.prototype.schedulePlayback = function(currentProgram, currentProgramIdx) {
    console.log("Not implemented!");
}

// implemented in subclasses
LineupManager.prototype.unschedulePlayback = function(program) {
    console.log("Not implemented!");
}
