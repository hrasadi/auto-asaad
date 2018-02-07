const Clip = require('../../../entities/Clip').Clip;

const AppContext = require('../../../AppContext');
const ClipPublisher = require('../../../publishers/ClipPublisher');

const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const fs = require('fs');
const {URL} = require('url');
const md5 = require('md5');
const path = require('path');

fs.readFileAsync = (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

class Raa1ClipPublisher extends ClipPublisher {
    constructor(credentialsConf) {
        super();
        // Initiate AWS connection
        if (credentialsConf.AWS) {
            this._asyncS3 = new AsyncS3(
                AppContext.getInstance().CWD + '/' + credentialsConf.AWS,
                'vod.raa.media'
            );
        } else {
            throw Error(
                'AWS config not found! Cannot proceed' + ' with ClipPublisher constructor'
            );
        }
    }

    /**
     * Merges clips to a single one and posts it somewhere available to public
     * (e.g. Public S3)
     * @param {Clip[]} clips clips to be mereged
     * @param {String} publicClipNamingStrategy states how the public clip should
     *  be named. Options are 'MainClip', 'AllClips'
     * @return {Clip} the public clip object
     */
    async getPublicClip(clips, publicClipNamingStrategy = 'MainClip') {
        let wrappedClip = new WrappedClip(clips, publicClipNamingStrategy);

        AppContext.getInstance().Logger.debug(
            'S3 upload key is: ' + wrappedClip.RelativePath
        );
        if (
            !(
                AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode ||
                AppContext.getInstance('LineupGenerator').GeneratorOptions.NoVODUpload
            )
        ) {
            wrappedClip.wrap();
            try {
                let clipData = await fs.readFileAsync(wrappedClip.AbsolutePath);

                if (!await this._asyncS3.exists(wrappedClip.RelativePath)) {
                    await this._asyncS3.pubObject(wrappedClip.RelativePath, clipData);
                    // Remove the temp file
                    if (wrappedClip.IsWrapped) {
                        fs.unlinkSync(wrappedClip.AbsolutePath);
                    }
                }
            } catch (e) {
                throw Error('Error while uploading public clip. Inner exception is ' + e);
            }
        }

        return wrappedClip.PublicClip;
    }
}

class WrappedClip {
    constructor(clips, publicClipNamingStrategy) {
        this._clips = clips;
        this._publicClipNamingStrategy = publicClipNamingStrategy;

        this._absolutePath = null;
        this._relativePath = null;
        this._duration = 0;
        this._name = '';

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
                        AppContext.getInstance('LineupGenerator').LineupManager
                            .MediaDirectory.BaseDir,
                        ''
                    );
                    if (this._publicClipNamingStrategy == 'MainClip') {
                        this._name = this._relativePath.substring(
                            this._relativePath.lastIndexOf('/') + 1
                        );
                    }
                    this._publicClip = new Clip(clip);
                }
            }

            if (this._publicClipNamingStrategy == 'AllClips') {
                this._name = md5(this._allMediaPath) + '.mp3';
            }

            this._relativePath = path.join(this._relativePath, this._name);

            this._absolutePath =
                AppContext.getInstance().CWD + '/run/tmp/' + this._name;
        } else {
            this._absolutePath = this._clips[0].Media.Path;
            this._relativePath = this._clips[0].Media.Path.replace(
                AppContext.getInstance('LineupGenerator').LineupManager.MediaDirectory
                    .BaseDir,
                ''
            );
            this._name = this._relativePath.substring(
                this._relativePath.lastIndexOf('/') + 1);
            this._duration = this._clips[0].Media.Duration;

            this._publicClip = new Clip(this._clips[0]);
        }

        let vodUrl = new URL(this._relativePath, 'http://vod.raa.media/');
        vodUrl =
            'https://api.raa.media/linkgenerator/podcast.mp3?src=' +
            Buffer.from(vodUrl.toString()).toString('base64');
        // Return the clip
        this._publicClip.Media.Path = vodUrl;
        this._publicClip.Media.Duration = this._duration;
    }

    wrap() {
        if (this.IsWrapped) {
            let wrapCmd =
                'echo y | ffmpeg -i "concat:' +
                this._allMediaPath +
                '" -ac 2 ' +
                this._absolutePath +
                ' 2>&1 >/dev/null';

            try {
                if (AppContext.getInstance('LineupGenerator').GeneratorOptions.TestMode) {
                    AppContext.getInstance().Logger.debug(
                        'Clip wrapping cmd is: ' + wrapCmd
                    );
                } else {
                    AppContext.getInstance().Logger.info(
                        `Resource intensive process is starting: ${wrapCmd}`
                    );
                    execSync(wrapCmd);
                    AppContext.getInstance().Logger.info('External process finished.');
                }
            } catch (error) {
                throw Error(
                    'Merging clips was unsuccessful. Error was: ' + error.message
                );
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

class AsyncS3 {
    constructor(confPath, bucket) {
        AWS.config.loadFromPath(confPath);
        this._s3 = new AWS.S3();
        this._bucket = bucket;
    }

    exists(key) {
        let params = {
            Bucket: this._bucket,
            Key: this._key,
        };

        return new Promise((resolve, reject) => {
            this._s3.headObject(params, (err, metadata) => {
                if (err && err.code === 'NotFound') {
                    resolve(false); // Not found
                } else if (!err) {
                    resolve(true); // found
                } else {
                    reject(err); // error!
                }
            });
        });
    }

    pubObject(key, data) {
        let params = {
            Bucket: this._bucket,
            Key: key,
        };

        params.Body = data;
        return new Promise((resolve, reject) => {
            this.s3.putObject(params, (err, data) => {
                if (err) {
                    AppContext.getInstance().Logger.error(
                        'Error uploading file to S3. Error is: ' + err
                    );
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

module.exports = Raa1ClipPublisher;
