const ClipUtils = require('../ClipUtils');

class SampleUtils extends ClipUtils {
    getPublicClip(clips) {
        return clips[0];
    }
}

module.exports = SampleUtils;
