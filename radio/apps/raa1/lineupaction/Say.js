const addClip = require('../../../lineupaction/AddClip');

const Context = require('../../../Context');

const request = require('sync-request');
const queryString = require('query-string');
const fs = require('fs');
const md5 = require('md5');

let say = (targetEntity, params) => {
    if (!params.Text) {
        Context.Logger.warn('Say action cannot be completed because the params does not' +
                            ' contain a valid \'Text\'. Params is: ' + params);
        return;
    }
    if (!params.At) {
        params.At = 'End';
    }

    let textHash = md5(params.Text);
    let ttsFilePath = Context.CWD + '/run/tts-cache/' + textHash + '.mp3';

    if (Context.NoTTS) {
        Context.Logger.debug('Say action text is: "' + params.Text +
                                '" with md5 hash: ' + textHash);
        return;
    }

    // Check cache first
    if (!fs.existsSync(ttsFilePath)) {
        // If not in cache, download
        let qs = {
            'APIKey': Context.RadioApp.Config.Credentials.ArianaAPIKey,
            'Format': 'mp3/32/m',
        };
        qs.Text = params.Text;

        let res = request('GET',
                        'http://api.farsireader.com/ArianaCloudService/ReadTextGET?' +
                        queryString.stringify(qs));

        if (res.statusCode > 400) {
            Context.Logger.warn('TTS request failed with error: ' + res.statusCode +
                                                                ' ' + res.getBody());
            return;
        }

        fs.writeFileSync(ttsFilePath, res.getBody());
    }

    // Now having the file, append it to entity
    params.Media = {};
    params.Media.Path = ttsFilePath;
    params.Media.IsAbsolutePath = true;

    addClip(targetEntity, params);
};

module.exports = say;
