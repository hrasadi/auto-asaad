const Clip = require('../../entities/Clip').Clip;

const AppContext = require('../../AppContext');
const ClipUtils = require('../../ClipUtils');

const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const fs = require('fs');
const {URL} = require('url');

class Raa1ClipUtils extends ClipUtils {
    constructor(credentialsConf) {
        super();
        // Initiate AWS connection
        if (credentialsConf.AWS) {
            AWS.config.loadFromPath(AppContext.getInstance().CWD +
                                    '/' + credentialsConf.AWS);
        }
        this.s3 = new AWS.S3();
    }

    getPublicClip(clips) {
        let wrappedClip = new WrappedClip(clips);

        // Upload the file on S3
        let uploadParams = {
            'Bucket': 'vod.raa.media',
            'Key': wrappedClip.RelativePath,
        };
        wrappedClip.wrap();

        if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
            AppContext.getInstance().Logger.debug('S3 upload key is: ' +
                                                    wrappedClip.RelativePath);
        } else {
            ((w) => {
                fs.readFile(w.AbsolutePath, (err, data) => {
                    if (err) {
                        throw Error('Error reading merged file. Exception is: ' + err);
                    }
                    uploadParams.Body = data;
                    this.s3.putObject(uploadParams, (err, data) => {
                        if (err) {
                            AppContext.getInstance().Logger.error(
                                    'Error uploading file to S3. Error is: ' + err);
                        } else {
                            // Remove the temp file
                            if (w.IsWrapped) {
                                fs.unlinkSync(w.AbsolutePath);
                            }
                        }
                    });
                });
            })(wrappedClip);
        }

        return wrappedClip.PublicClip;
    }
}

class WrappedClip {
    constructor(clips) {
        this._clips = clips;

        this._absolutePath = null;
        this._relativePath = null;
        this._duration = 0;
        this._name = null;

        this._publicClip = null;

        this.initPaths();
    }

    initPaths() {
        if (this.IsWrapped) {
            this._allMediaPath = '';

            for (let clip of this._clips) {
                this._allMediaPath = this._allMediaPath + clip.Media.Path + '|';
                this._duration += clip.Media.Duration;
                if (clip.IsMainClip) {
                    this._relativePath = clip.Media.Path.replace(
                                    AppContext.getInstance('LineupGenerator')
                                    .LineupManager.MediaDirectory.BaseDir, '');
                    this._relativePath =
                        this._relativePath[0] == '/' ? this._relativePath.substring(1) :
                                                        this._relativePath;
                    this._name = this._relativePath.substring(
                                                    this._relativePath.lastIndexOf('/'));

                    this._publicClip = new Clip(clip);
                }
            }
            this._absolutePath = AppContext.getInstance().CWD + '/run/tmp/' + this._name;
        } else {
            this._absolutePath = this._clips[0].Media.Path;
            this._relativePath = this._clips[0].Media.Path.replace(
                                    AppContext.getInstance('LineupGenerator')
                                    .LineupManager.MediaDirectory.BaseDir, '');
            this._name = this._relativePath.substring(
                                    this._relativePath.lastIndexOf('/'));
            this._duration = this._clips[0].Media.Duration;

            this._publicClip = new Clip(this._clips[0]);
        }

        let vodUrl = new URL(this._relativePath, 'http://vod.raa.media/');
        vodUrl = 'https://api.raa.media/linkgenerator/podcast.mp3?src=' +
                                                Buffer.from(vodUrl.toString())
                                                .toString('base64');
        // Return the clip
        this._publicClip.Media.Path = vodUrl;
        this._publicClip.Media.Duration = this._duration;
    }

    wrap() {
        if (this.IsWrapped) {
            let wrapCmd = 'echo y | ffmpeg -i "concat:' + this._allMediaPath +
                            '" -ac 2 ' + this._absolutePath + ' 2>&1 >/dev/null';


            try {
                if (AppContext.getInstance('LineupGenerator')
                                        .GeneratorOptions.TestMode) {
                    AppContext.getInstance().Logger.debug(
                                            'Clip wrapping cmd is: ' + wrapCmd);
                } else {
                    execSync(wrapCmd);
                }
            } catch (error) {
                throw Error('Merging clips was unsuccessful. Error was: ' +
                            error.message);
            }
        }
    }

    get PublicClip() {
        return this._publicClip;
    }

    get AbsolutePath() {
        return this._absolutePath;
    }

    get RelativePath() {
        return this._relativePath;
    }

    get Name() {
        return this._name;
    }

    get Duration() {
        return this._duration;
    }

    get IsWrapped() {
        return this._clips.length > 1 ? true : false;
    }
}

module.exports = Raa1ClipUtils;
