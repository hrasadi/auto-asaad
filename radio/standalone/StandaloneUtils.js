const Utils = require('../Utils');

class StandaloneUtils extends Utils {
    mergeClips(clips) {
        return clips[0];
    }
}

module.exports = StandaloneUtils;
