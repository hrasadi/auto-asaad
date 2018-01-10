const Context = require('../Context');

const Clip = require('../model/Clip').Clip;

let addClip = (targetEntity, params) => {
    // Create the clip
    if (!params.Media) {
        Context.Logger.warn('AddClip cannot be completed because the params does not' +
                                    ' contain a valid media. Params is: ' + params);
        return null;
    }
    if (!params.At) {
        params.At = 'End';
    }

    let media = Context.RadioApp.ObjectBuilder.buildMedia(params.Media);
    media = media.plan();
    media = media.compile();

    let targetProgram = null;
    if (targetEntity.constructor.name.includes('Box')) {
        // Find the program (first or last) add the clip to it
        if (params.At.toLowerCase === 'start') {
            targetProgram = targetEntity.Programs[0];
        } else {
            targetProgram = targetEntity.Programs[targetEntity.Programs.length - 1];
        }
    } else if (targetEntity.constructor.name.includes('Program')) {
        targetProgram = targetEntity;
    } else {
        Context.Logger.warn('AddClip is currently supported for boxes only');
    }

    if (targetProgram) {
        let clipToAdd = new Clip();
        clipToAdd.Media = media;
        targetProgram.Show.appendClip(clipToAdd);

        targetProgram._parentBox.readjustTiming();
    }
};

module.exports = addClip;
