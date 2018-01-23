const Media = require('../entities/media/Media');

const execSync = require('child_process').execSync;

class LiquidsoapMedia extends Media {
    constructor(jsonOrOther, parent) {
        super(jsonOrOther, parent);
    }

    compile() {
        let compiledMedia = new LiquidsoapMedia(this, this._parentMediaGroup);

        let cmd = 'mp3info -p "%S" ' + this.Path;
        compiledMedia.Duration = parseFloat(execSync(cmd, {
                    encoding: 'utf-8',
                }));

        return compiledMedia;
    }
}

module.exports = LiquidsoapMedia;
