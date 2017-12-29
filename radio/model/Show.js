const SerializableObject = require('./SerializableObject');

const Context = require('../Context');

const C = require('./Clip');
const ClipTemplate = C.ClipTemplate;
const ClipPlan = C.ClipPlan;
const Clip = C.Clip;

class ShowTemplate extends SerializableObject {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther);

        // Used to build iterator Id
        this._type = 'Show';

        // REFERENCES
        this._parentProgramTemplate = parent;
    }

    plan(targetDateMoment) {
        if (!this.ClipTemplates) {
            return null;
        }


        for (let clipTemplate of this.ClipTemplates) {
            // resolve the media file path before writing down to lineup
            var media = {};
            Object.assign(media, this.getMedia(programTemplate, targetDateMoment, programOrBoxId, 'Show', i));
            if (media.Path != undefined) {
                media.Path = this.config.Media.BaseDir + "/" + media.Path;
                if (programTemplate.Show.Clips[i].IsMainClip) {
                    media.IsMainClip = true;
                }
                program.Show.Clips.push(media);
                
                this.context.logger().debug("   * From " + programTemplate.Show.Clips[i].MediaGroup + " I have selected: " + media.Path);
            } else {
                // If the main clip of a program is empty, the whole program should not be planned
                if (programTemplate.Show.Clips[i].IsMainClip) {
                    return false;
                }
            }
        }
    
        if (program.Show.Clips.length == 0) {
            return false;
        }
        return true;
    
    }

    getMedia(targetDateMoment, clipIndex) {
        let iteratorId = this._parentProgramTemplate.ProgramId + '-' +
            this._parentProgramTemplate._parentBoxTemplate.BoxId + '-' +
            this._type + '-' + clipIndex;

        let persistentIteratorFilePath = Context.CWD + '/run/iterator' + iteratorId + '.iterator';
    
        let iterator = null;
        if (this.planningMode == 'current' && this.context.options.mode == 'deploy') { // no side-effect in test-mode
            iterator = Utils.IteratorFactory.build(programTemplate[showType].Clips[clipIdx].Policy, 
                                                           this.config.Media[programTemplate[showType].Clips[clipIdx].MediaGroup],
                                                           true, persistentIteratorFilePath);            
        } else {
            // planning mode is 'future' (or test mode)
            if (!this.iterators[iteratorId]) {
                iterator = Utils.IteratorFactory.build(programTemplate[showType].Clips[clipIdx].Policy, 
                                                               this.config.Media[programTemplate[showType].Clips[clipIdx].MediaGroup],
                                                               false, persistentIteratorFilePath);
                this.iterators[iteratorId] = iterator;
            } else {
                iterator = this.iterators[iteratorId];
            }
        }
        
        offset = programTemplate[showType].Clips[clipIdx].Offset ? 
                                        parseInt(programTemplate[showType].Clips[clipIdx].Offset) : undefined;
        return iterator.next(this.tag(targetDateMoment), offset);
    }
    

    get ClipTemplates() {
        return this.getOrNull(this._clipTemplates);
    }

    set ClipTemplates(values) {
        if (typeof values !== 'undefined' && values) {
            this._clipTemplates = [];
            for (let value of values) {
                let clipTemplate = new ClipTemplate(value);
                this._clips.push(clipTemplate);
            }
        }
    }
}

class PreShowTemplate extends ShowTemplate {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);

        // Used to build iterator Id
        this._type = 'PreShow';
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
