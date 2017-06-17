module.exports = function(messagingConfig) {

    this.config = messagingConfig;

    // Telegram providers
    if (this.config.Telegram.ChatIdProvider == "static") {
        this.provideTelegramChatIds = function() {
            return this.config.Telegram.ChatIds;
        }    
    }

    this.current_token = null;

    this.renewGoogleCalToken = function(that, callback_fn) {

        var https = require('https');

        var str = 'client_id=' + this.config.Google.ClientId + '&client_secret=' + this.config.Google.ClientSecret + '&refresh_token=' + this.config.Google.RefreshToken + '&grant_type=refresh_token';

        var options = {
            hostname: 'www.googleapis.com',
            port: 443,
            path: '/oauth2/v4/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(str)
            }
        };

        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(body) {
                that.current_token = JSON.parse(body).access_token;
                callback_fn.call(that);
            })
        });

        req.on('error', function(e) {});

        req.write(str);
        req.end();
    };

    this.createCalEvent = function(eventTime, summary, message) {
        var do_create = function() {
            var https = require('https');
            var jsesc = require('jsesc');

            for (var i = 0; i < this.provideTelegramChatIds().length; i++) {
                var options = {
                    hostname: 'www.googleapis.com',
                    port: 443,
                    path: '/calendar/v3/calendars/' + this.config.Google.CalendarName + '/events?access_token=' + this.current_token,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                var req = https.request(options, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function(body) {
                    });
                });

                req.on('error', function(e) {
                    console.log(e)
                });

                var str = '{"summary": "' + summary + '", "description": "{\\\"type\\\": \\\"message\\\", \\\"data\\\": {\\\"chat_id\\\": \\\"' + this.provideTelegramChatIds()[i] + '\\\", \\\"parse_mode\\\": \\\"html\\\", \\\"text\\\": \\\"' + jsesc(message) + '\\\"}}", ' + 
                    '"start": {"dateTime": "' + eventTime + '", ' + 
                    '"timeZone": "America/New_York"}, "end": {"dateTime": "' + eventTime + '", "timeZone": "America/New_York"}}';

                req.write(str);
                req.end();
            }
        };

        if (this.current_token == null) {
            this.renewGoogleCalToken(this, do_create);
        } else {
            do_create();
        }
    }
}
