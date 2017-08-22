/** LineupManager is the heart of Radio auto-asaad. It is a deamon responsible
for creating lineups for the Liquidsoap and schedule their playback. The
workflow in this class in a nutshell is as follows:

1- Generate a basic lineup based on the informatio provided in LineupTemplate
section of the config file. Store it in 'lineups' folder
2- Calculate the precise program timing and validate it to make sure to
overlapping happens
3- Generate a compiled version of the lineup that contains metadata information
about scheduling and other system-related info
3- Watch the lineup file (uncompiled version) for changes. If a change occurs
(by readio admin) the lineup should be recompiled and scheduled items must
be updated accordingly.

Note: We provide radio admins a set of web-service and/or script handlers
to modify the program lineups.
**/

var fs = require('fs');

var Utils = require('../utils');
var Logger = require('../logger');

var StagedExecutor = require('./staged-executor').StagedExecutor;
var Stage = require('./staged-executor').Stage;

var PartialConfigFlattener = require('./lineup-operators/partial-config-flattener').PartialConfigFlattener;
var LineupPlanner = require('./lineup-operators/lineup-planner').LineupPlanner;
var LineupCompiler = require('./lineup-operators/lineup-compiler').LineupCompiler;
var Scheduler = require('./lineup-operators/scheduler').Scheduler;
var PostOperator = require('./lineup-operators/post-operator').PostOperator;

var LineupManager = function(radioConfig, cwd, radioObj) {
    StagedExecutor.call(this);

    this.moment = require('moment');
    // Custom format so that files are easier to read
    this.moment.prototype.toJSON = function() {
        return this.format();
    }

    this.config = radioConfig;
    this.cwd = cwd;
    // This is the radio object who calls us, should implement any
    // radio specific logic in the form of callbacks.
    this.radio = radioObj;

    this.initStages();
}

Utils.inheritsFrom(LineupManager, StagedExecutor);

LineupManager.prototype.init = function(options) {
    this.serviceLogger = new Logger(this.cwd + "/logs/service.log");

    this.options = {};

    this.options.futureLineupsCount = (options.futureLineupsCount != undefined) ? options.futureLineupsCount : 4;
    this.options.verbose = (options.verbose != undefined) ? true : false;    
    this.options.mode = options.test != undefined ? 'test' : 'deploy';
    this.options.lineupFilePathPrefix = this.cwd + "/lineups/" + this.radio.id + "-";
    this.options.currentDayMoment = (options.targetDate != undefined) ? this.moment(options.targetDate) : this.moment();
    this.options.scheduling = options.scheduling;

    // In deploy mode
    var self = this;
    var lineupWatcher = function() {
        // Watch the lineup file for changes
        try {
            // if current lineup is not set, we will resume in the catch clause
            var currentLineupFilePath = self.getStage("LineupPlanner").generateLineupFilePath(self.options.currentDayMoment);
            // For the current day, we should regenerate everything once (at 12am) and then lock the lineup. This is to
            // reflect any more changes made to the templates and/or planned lineup during the day (note that this then-future 
            // lineup file is first generated a few days back)
            // In case admin wants to lock a lineup before 12am, a [/lineupFilePath].lock file should be generated
            if (!fs.existsSync(currentLineupFilePath + ".lock")) {
                throw "Only locked lineups will be watched, regenerate and lock then come back!";
            }
            self.lineupFileWatcher = fs.watch(currentLineupFilePath,
                function(eventType, fileName) {
                    if (eventType == 'change') {
                        // Read the new lineup from modified file
                        // Recompile
                        try {
                            self.execute(self.config, "LineupCompiler");
                        } catch(e) {
                            self.logger().fatal(e);
                            // Nothing will really change until the file is touched again. 
                            // Both in-memory copies of lineup and compiledLineup would be invalid during this period
                        }
                    }
                    // else?
                });
        } catch (e) {
            try {
                self.execute(self.config);
                // lock the file as current, admin can now change the lineup without re-planning lineup
                fs.writeFileSync(currentLineupFilePath + ".lock", "");
            } catch (e) {
                self.logger().fatal(e);
            }            // This is the lineup generated from template. If it has any compile errors it would be fatal. So do not catch excpetions here!
            // try again!
            lineupWatcher();
        }
    }

    var resetRadio = function(newDateMoment) {
        if (newDateMoment) {
            self.options.currentDayMoment = newDateMoment;
        }

        // unwatch the old file
        if (self.lineupFileWatcher != null) {
            self.fs.close(self.lineupFileWatcher);
        }

        self.radio.reset(self.options.currentDayMoment, function() {
            if (self.options.mode == 'deploy') {
                self.loggerObj = new Logger(self.cwd + "/logs/lm-" + self.radio.id + "-" + self.options.currentDayMoment.format("YYYY-MM-DD") + ".log");
        
                lineupWatcher();
            } else {
                // In test mode, run everything once and return
                try {
                    self.loggerObj = new Logger();
                    self.execute(self.config);
                } catch (e) {
                    self.logger().fatal(e);
                }                
            }
        });
    }

    resetRadio();

    if (self.options.mode == 'deploy') {
        // Wake up at the end of the day and reset the manager
        newDateMoment = moment(self.options.currentDayMoment).add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0).set('millis', 0);
        var nextDayStartsInMillis = newDateMoment.diff(this.moment());

        self.serviceLogger.info("Next lineup generation will happen in " + nextDayStartsInMillis + "ms");
        setTimeout(function() {
                // reset lineup manager, the file watcher will hence generate the new
                // lineup automatically.
                resetRadio(self, newDateMoment);
            }, nextDayStartsInMillis);
    }   
}

LineupManager.prototype.initStages = function() {
    this.pushStage(this.instantiatePartialConfigFlattener());
    this.pushStage(this.instantiateLineupPlanner());
    this.pushStage(this.instantiateLineupCompiler());
    this.pushStage(this.instantiateScheduler());
    this.pushStage(this.instantiatePostOperator());
}

LineupManager.prototype.logger = function() {
    return this.loggerObj;
}

LineupManager.prototype.getLineupVersion = function(lineup) {
    if (lineup.Version) {
        return lineup.Version;
    } else {
        return "1.0";
    }
}

/* the following builders can be extended by the subclasses to implement platform-specific traits of lineups */
LineupManager.prototype.instantiatePartialConfigFlattener = function() {
    return new PartialConfigFlattener();
}

LineupManager.prototype.instantiateLineupPlanner = function() {
    return new LineupPlanner();
}

LineupManager.prototype.instantiateLineupCompiler = function() {
    return new LineupCompiler();
}

LineupManager.prototype.instantiateScheduler = function() {
    return new Scheduler();
}

LineupManager.prototype.instantiatePostOperator = function() {
    return new PostOperator();
}
/**/

LineupManager.prototype.DeploymentMode = {
    STANDALONE: "standalone",
    LIQUIDSOAP: "liquidsoap"
}

LineupManager.build = function(deploymentMode, radioConfig, configFile, radioObj) {
    var clazz;
    switch (deploymentMode) {
        case LineupManager.prototype.DeploymentMode.STANDALONE:
            clazz = require('./standalone/standalone-lineup-manager');
            break;
        case LineupManager.prototype.DeploymentMode.LIQUIDSOAP:
            clazz = require('./liquidsoap/liquidsoap-lineup-manager');
            break;
    }
    return new clazz(radioConfig, configFile, radioObj);
}

module.exports = LineupManager;
