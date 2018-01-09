const Entity = require('./Entity');

const Context = require('../Context');

const Publishing = require('./Publishing');

const LivePlaybackSchedulerMeta = require('./LivePlaybackSchedulerMeta');

const S = require('./Show');
const ShowTemplate = S.ShowTemplate;
const PreShowTemplate = S.PreShowTemplate;
const PreShowPlan = S.PreShowPlan;
const ShowPlan = S.ShowPlan;

const moment = require('moment');

class BaseProgram extends Entity {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get ProgramId() {
        return this.getOrNull(this._programId);
    }

    set ProgramId(value) {
        this._programId = value;
    }

    get Title() {
        return this.getOrNull(this._title);
    }

    set Title(value) {
        this._title = value;
    }

    get Publishing() {
        return this.getOrElse(this._publishing, new Publishing());
    }

    set Publishing(value) {
        if (value) {
            this._publishing = new Publishing(value);
        }
    }
}
class ProgramTemplate extends BaseProgram {
    static createTemplate(json, parent) {
        if (json.ProgramType === 'Premiere') {
            return new PremiereProgramTemplate(json, parent);
        } else if (json.ProgramType === 'Replay') {
            return new ReplayProgramTemplate(json, parent);
        }
    }

    constructor(jsonOrOther, parent = null) {
        super(jsonOrOther);

        // REFERENCES
        this._parentBoxTemplate = parent;
    }

    get ProgramType() {
        return this._programType;
    }

    set ProgramType(value) {
        this._programType = value;
    }

    get PremiereDate() {
        let result = this.getOrNull(this._premiereDate);
        if (result) {
            result = moment(result);
        }
        return result;
    }

    set PremiereDate(value) {
        this._premiereDate = value;
    }

    /**
     * Path to program cover image (used in feed cards and podcasts)
     */
    get CoverArt() {
        return this.getOrNull(this._coverArt);
    }

    set CoverArt(value) {
        this._coverArt = value;
    }
}
class PremiereProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    plan(targetDate, parent) {
        // Plan a new episode
        let plannedPreShow = null;
        let plannedShow = null;

        if (this.PreShowTemplate) {
            plannedPreShow = this.PreShowTemplate.plan(targetDate, parent);
        }

        if (this.ShowTemplate) {
            plannedShow = this.ShowTemplate.plan(targetDate, parent);
        }

        if (!plannedShow) {
            return null;
        }

        let plannedProgram = new ProgramPlan(this, parent);
        plannedProgram.PreShowPlan = plannedPreShow;
        plannedProgram.ShowPlan = plannedShow;

        return plannedProgram;
    }

    get PreShowTemplate() {
        return this.getOrNull(this._preShowTemplate);
    }

    set PreShowTemplate(value) {
        if (value) {
            this._preShowTemplate = new PreShowTemplate(value, this);
        }
    }

    get ShowTemplate() {
        return this.getOrNull(this._showTemplate);
    }

    set ShowTemplate(value) {
        if (value) {
            this._showTemplate = new ShowTemplate(value, this);
        }
    }
}

class ReplayProgramTemplate extends ProgramTemplate {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    plan(targetDate, parent) {
        let originalAiringDate =
                moment(targetDate)
                .subtract(this.OriginalAiringOffset, 'days')
                .format('YYYY-MM-DD');

        // If offset == 0, we are replaying from today
        let originalAiringLineupPlan =
                !this.OriginalAiringOffset ? parent._parentLineupPlan :
                Context.LineupManager
                .getLineupPlan(originalAiringDate);

        if (!originalAiringLineupPlan ||
            !originalAiringLineupPlan.Version ||
            originalAiringLineupPlan.Version !== '3.0') {
            // Not supported! Format too old or
            // original lineup does not exist at all
            return null;
        }

        let originalBoxPlan =
            originalAiringLineupPlan.getBoxPlan(this.OriginalBoxId);
        if (!originalBoxPlan) {
            return null;
        }

        // Now check for the programs in the original airing and
        // find the target programs
        // Apply include filter
        let replayProgramPlans = [];
        for (let programPlan of originalBoxPlan.ProgramPlans) {
            let replayEligible = false;

            // Apply the include filter (no include section means *)
            if (!this.Include || this.Include.includes(programPlan.ProgramId)) {
                replayEligible = true;
            }

            // Apply the exclude filter (no include section means null)
            if (this.Exclude && this.Exclude.includes(programPlan.ProgramId)) {
                replayEligible = false;
            }

            if (replayEligible) {
                let replayProgram = new ProgramPlan(programPlan, parent);
                if (replayProgram) {
                    replayProgram.pruneProgramPlan();

                    replayProgram.ProgramId =
                                        programPlan.ProgramId + '_Replay';
                    replayProgram.Title = programPlan.Title + ' - تکرار';
                    // Replat program should not inherit properties
                    // from original program
                    replayProgram.Publishing = this.Publishing;
                    replayProgramPlans.push(replayProgram);
                }
            }
        }

        if (replayProgramPlans.length == 0) {
            return null;
        }

        return replayProgramPlans;
    }

    get OriginalAiringOffset() {
        return this.getOrNull(this._originalAiringOffset);
    }

    set OriginalAiringOffset(value) {
        this._originalAiringOffset = parseInt(value);
    }

    get OriginalBoxId() {
        return this.getOrNull(this._originalBoxId);
    }

    set OriginalBoxId(value) {
        this._originalBoxId = value;
    }

    get Include() {
        return this.getOrNull(this._include);
    }

    set Include(value) {
        this._include = value;
    }

    get Exclude() {
        return this.getOrNull(this._exclude);
    }

    set Exclude(value) {
        this._exclude = value;
    }
}

class ProgramPlan extends BaseProgram {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentBoxPlan = parent;
    }

    compile(startTimeMoment, parent) {
        let compiledProgram = Context.LineupManager
                                .RadioApp.ObjectBuilder
                                .buildProgram(this, parent);

        let compiledPreShow = null;
        if (this.PreShowPlan) {
            compiledPreShow = this.PreShowPlan.compile(this, compiledProgram);
        }
        let compiledShow = this.ShowPlan.compile(this, compiledProgram);

        if (!compiledShow) {
            return null;
        }

        compiledProgram.PreShow = compiledPreShow;
        compiledProgram.Show = compiledShow;

        let compiledProgramMetadata = new Metadata();

        if (compiledPreShow) {
            compiledProgramMetadata.PreShowStartTime =
                                moment(startTimeMoment)
                                .subtract(compiledPreShow.Duration, 'seconds');
        }
        compiledProgramMetadata.ShowStartTime = moment(startTimeMoment);
        // End time is only dependent to show
        compiledProgramMetadata.EndTime =
                             moment(startTimeMoment)
                            .add(compiledShow.Duration, 'seconds');

        if (this._parentBoxPlan.IsFloating) {
            compiledProgram.Priority = 'High';
        }
        compiledProgram.Metadata = compiledProgramMetadata;
        return compiledProgram;
    }

    /**
     * Removes all clips except the main clip.
     * Also removes the preshow if any.
     */
    pruneProgramPlan() {
        this.PreShowPlan = null;
        this.ShowPlan.pruneClipPlans();
    }

    get PreShowPlan() {
        return this.getOrNull(this._preShowPlan);
    }

    set PreShowPlan(value) {
        if (value) {
            this._preShowPlan = new PreShowPlan(value);
        }
    }

    get ShowPlan() {
        return this.getOrNull(this._showPlan);
    }

    set ShowPlan(value) {
        if (value) {
            this._showPlan = new ShowPlan(value);
        }
    }
}

class Program extends BaseProgram {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        this._parentBox = parent;
    }

    publish(targetDate) {
        // Publish in podcast
        let mergedClip = Context.LineupManager.RadioApp
                                .Utils.getPublicClip(this.Show.Clips);
        let programToPublish = Context.LineupManager
                                .RadioApp.ObjectBuilder.buildProgram(this);
        programToPublish.Show.Clips = [mergedClip];
        programToPublish.Metadata.Duration = programToPublish.Show.Duration;

        if (this.Publishing.Podcast) {
            Context.LineupManager.RadioApp.Publishers
                    .PodcastPublisher.publish(programToPublish, targetDate);
        }
        // Publish in Archive
        if (this.Publishing.Archive) {
            Context.LineupManager.RadioApp.Publishers
                    .ArchivePublisher.publish(programToPublish, targetDate);
        }
        // Publish social feed
        if (this.Publishing.SocialListeningMode === 'Social') {

        } else if (this.Publishing.SocialListeningMode === 'Social') {
            // Schedule for personal feed

        }
    }

    schedule(targetDate, boxIdx, programIdx) {
        if (this.Priority != 'High') {
            throw Error('Logic error: scheduling on programs is only valid' +
                        'when program is interrrupting');
        }
        this.doScheduleProgram(targetDate, boxIdx, programIdx);
    }

    // Implemented in subclasses
    doScheduleProgram(targetDate, boxIdx, programIdx) {
    }

    unschedule() {
        if (this.LivePlaybackSchedulerMeta) {
            this.doUnscheduleProgram();
        }
    }

    // Implemented in subclasses
    doUnscheduleProgram() {
    }

    split(breakAtTime, continueAtTime, breakDuration) {
        let p1 = Context.LineupManager.RadioApp
                            .ObjectBuilder.buildProgram(this, this._parentBox);
        let p2 = Context.LineupManager.RadioApp
                            .ObjectBuilder.buildProgram(this, this._parentBox);

        p1.Metadata.EndTime = moment(breakAtTime);
        p2.Metadata.StartTime = moment(continueAtTime);
        p2.Metadata.EndTime = moment(p2.Metadata.EndTime)
                                        .add(breakDuration, 'seconds');
        p2.ProgramId = p2.ProgramId + '_continue';
        p2.Title = 'ادامه‌ی ' + p2.Title;

        return [p1, p2];
    }

    get PreShow() {
        return this.getOrNull(this._preShow);
    }

    set PreShow(value) {
        if (value) {
            this._preShow = value;
        }
    }

    get Show() {
        return this.getOrNull(this._show);
    }

    set Show(value) {
        if (value) {
            this._show = value;
        }
    }

    get Metadata() {
        return this.getOrNull(this._metadata);
    }

    /**
     * @param {Metadata} value Program metadata \
     * (including calculated start and end time)
     */
    set Metadata(value) {
        if (value) {
            if (value.constructor.name == 'Metadata') {
                this._metadata = value;
            } else {
                this._metadata = new Metadata(value);
            }
        }
    }

    /**
     * Priority property specifies the queue program will be played back in.
     * One obvious use for this property is the interrupting programs.
     * These programs will be queued in another Liquidsoap queue and will
     * pause playback for the normal programs until they are finished
     */
    get Priority() {
        return this.getOrElse(this._priority, 'Normal');
    }

    set Priority(value) {
        this._priority = value;
    }

    // Only set for floating programs inside a non-floating box
    get LivePlaybackSchedulerMeta() {
        return this.getOrNull(this._livePlaybackSchedulerMeta);
    }

    set LivePlaybackSchedulerMeta(value) {
        this._livePlaybackSchedulerMeta = new LivePlaybackSchedulerMeta(value);
    }
}

class Metadata extends Entity {
    get StartTime() {
        return this.getOrNull(this.PreShowStartTime ?
                                this.PreShowStartTime : this.ShowStartTime);
    }

    set StartTime(value) {
        // Do nothing. This value should be derived from show and preshow metas
    }

    get EndTime() {
        return this.getOrNull(this._endTime);
    }

    set EndTime(value) {
        this._endTime = value;
    }

    get PreShowStartTime() {
        return this.getOrNull(this._preShowStartTime);
    }

    set PreShowStartTime(value) {
        this._preShowStartTime = value;
    }

    get ShowStartTime() {
        return this.getOrNull(this._showStartTime);
    }

    set ShowStartTime(value) {
        this._showStartTime = value;
    }

    get Duration() {
        return moment(this.EndTime)
            .diff(this.StartTime, 'seconds');
    }

    set Duration(value) {
        // Do nothing! This value should be dervied from start and end time
    }

    get LivePlaybackSchedulerMeta() {
        return this.getOrNull(this._livePlaybackSchedulerMeta);
    }

    set LivePlaybackSchedulerMeta(value) {
        this._livePlaybackSchedulerMeta = new LivePlaybackSchedulerMeta(value);
    }
}

module.exports = {
    'ProgramTemplate': ProgramTemplate,
    'ProgramPlan': ProgramPlan,
    'Program': Program,
    'PremiereProgramTemplate': PremiereProgramTemplate,
    'ReplayProgramTemplate': ReplayProgramTemplate,
};
