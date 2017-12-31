const SerializableObject = require('./SerializableObject');

const C = require('./Clip');
const ClipTemplate = C.ClipTemplate;

class ShowTemplate extends SerializableObject {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        // REFERENCES
        this._parentProgramTemplate = parent;
    }

    plan(targetDate) {
        let clipPlans = this.plan0(targetDate);

        if (!clipPlans) {
            return null;
        }
        let showPlan = new ShowPlan(this);
        showPlan.ClipPlans = clipPlans;    
        return showPlan;
    }

    plan0(targetDate) {
        if (!this.ClipTemplates) {
            return null;
        }

        let clipPlans = [];
        let mainClipPlanned = false;
        for (let i = 0; i < this.ClipTemplates.length; i++) {
            let clipPlan = this.ClipTemplates[i].plan(targetDate, i);

            if (clipPlan) {
                if (clipPlan.IsMainClip) {
                    mainClipPlanned = true;
                }
                clipPlans.push(clipPlan);
            }
        }
        if (clipPlans.length == 0 || !mainClipPlanned) {
            return null;
        }
        return clipPlans;
    }

    get ClipTemplates() {
        return this.getOrNull(this._clipTemplates);
    }

    set ClipTemplates(values) {
        if (typeof values !== 'undefined' && values) {
            this._clipTemplates = [];
            for (let value of values) {
                let clipTemplate = new ClipTemplate(value, this);
                this._clipTemplates.push(clipTemplate);
            }
        }
    }
}

class PreShowTemplate extends ShowTemplate {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    plan(targetDate) {
        let clipPlans = this.plan0(targetDate);

        if (!clipPlans) {
            return null;
        }

        // FillerClip
        let fillerClipPlan = null;
        if (this.FillerClipTemplate) {
            fillerClipPlan = this.FillerClipTemplate.plan(targetDate, 0);
        }

        let preShowPlan = new PreShowPlan(this);
        preShowPlan.ClipPlans = clipPlans;
        preShowPlan.FillerClipPlan = fillerClipPlan;

        return preShowPlan;
    }

    get FillerClipTemplate() {
        return this.getOrNull(this._fillerClipTemplate);
    }

    set FillerClipTemplate(value) {
        if (value) {
            this._fillerClipTemplate = value;
        }
    }
}

class ShowPlan extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    compile(parent) {
        let compiledShow = new Show(this, parent);
        return this.compile0(compiledShow);
    }

    compile0(compiledObject) {
        if (this.ClipPlans) {
            compiledObject.Clips = [];
            for (let clipPlan of this.ClipPlans) {
                let clip = clipPlan.compile(compiledObject);
                if (clip) {
                    compiledObject.Duration =
                        compiledObject.Duration + clip.Duration;
                    compiledObject.Clips.push(clip);
                }
            }
        }
    }

    get ClipPlans() {
        return this.getOrNull(this._clipPlans);
    }

    /**
     * This value should be set during planning
     * @param {ClipPlan[]} value Array of clip plans
     */
    set ClipPlans(value) {
        if (value) {
            this._clipPlans = value;
        }
    }
}

class PreShowPlan extends ShowPlan {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    compile(parent) {
        let compiledPreShow = new PreShow(this, parent);

        if (this.FillerClipPlan) {
            compiledPreShow.FillerClip =
                this.FillerClipPlan.compile(compiledPreShow);
        }

        return this.compile0(compiledPreShow);
    }

    get FillerClipPlan() {
        return this.getOrNull(this._fillerClipPlan);
    }

    set FillerClipPlan(value) {
        this._fillerClipPlan = value;
    }
}

class Show extends SerializableObject {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get Clips() {
        return this.getOrNull(this._clips);
    }

    /**
     * This value should be set during compilation
     * @param {Clip[]} value Array of clip plans
     */
    set Clips(value) {
        if (value) {
            this._clips = value;
        }
    }

    get Duration() {
        return this.getOrElse(this._duration, 0);
    }

    set Duration(value) {
        this._duration = value;
    }
}

class PreShow extends Show {
    constructor(jsonOrOther) {
        super(jsonOrOther);
    }

    get FillerClip() {
        return this.getOrNull(this._fillerClip);
    }

    set FillerClip(value) {
        this._fillerClip = value;
    }
}

module.exports = {
    'ShowTemplate': ShowTemplate,
    'PreShowTemplate': PreShowTemplate,
    'ShowPlan': ShowPlan,
    'PreShowPlan': PreShowPlan,
    'Show': Show,
    'PreShow': PreShow,
};
