const AppContext = require('../AppContext');

const Clip = require('../entities/Clip').Clip;
const Media = require('../entities/media/Media');

let addClip = (targetEntity, params) => {
    // Create the clip
    if (!params.Media) {
        AppContext.getInstance().Logger
                                .warn('AddClip cannot be completed because the params' +
                                 'does not contain a valid media. Params is: ' + params);
        return null;
    }
    if (!params.At) {
        params.At = 'End';
    }

    let media = AppContext.getInstance().ObjectBuilder.buildOfType(Media, params.Media);
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
        AppContext.getInstance().Logger
                                .warn('AddClip is currently supported for boxes only');
    }

    if (targetProgram) {
        let clipToAdd = new Clip(null, targetProgram);
        clipToAdd.Media = media;

        targetProgram.Show.appendClip(clipToAdd);

        targetProgram._parentBox.readjustTiming();
    }
};

module.exports = addClip;
