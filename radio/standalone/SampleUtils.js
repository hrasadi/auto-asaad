const Utils = require('../Utils');

class SampleUtils extends Utils {
    getPublicClip(clips) {
        return clips[0];
    }
}

module.exports = SampleUtils;
