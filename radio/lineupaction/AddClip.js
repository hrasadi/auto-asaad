const Context = require('../Context');

let addClip = (targetEntity, params) => {
    // Create the clip
    if (!params.Media) {
        Context.Logger.warn('AddClip cannot be completed because the params does not' +
                                    ' contain a valid media. Params is: ' + params);
        return null;
    }

    let media = Context.LineupManager.RadioApp.ObjectBuilder.buildMedia(params.Media);
    media = media.plan();
    media = media.compile();

    if (targetEntity.constructor.name.includes('Box')) {
        // Find the last program add the clip to it
        let lastProgram = targetEntity.Programs[targetEntity.Programs.length - 1];
        lastProgram.Show.Clips.push(media);
        lastProgram.Show.Duration = lastProgram.Show.Duration + media.Duration;
    } else {
        Context.Logger.warn('AddClip is currently supported for boxes only');
    }
};

module.exports = addClip;
