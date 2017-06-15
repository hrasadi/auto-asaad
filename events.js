module.exports = function(eventsConfig) {

    this.config = eventsConfig;    

    this.EventType = {
        FAJR: 'Fajr',
        SUNRINSE: 'Sunrise',
        DHUHR: 'Duhr',
        ASR:'Asr',
        SUNSET: 'Sunset',
        MAGHRIB: 'Maghrib',
        MIDNIGHT: 'Midnight'
    };

    this.readTodayEvent = function(eventType, callback_fn) {
        var today = new Date();

        this.readEvent(today, eventType, callback_fn);
    }

    this.readEvent = function(referenceDate, eventType, callback_fn) {
        var http = require('http');
        var moment = require('moment');

        var DateInEpochMillis = parseInt(referenceDate.getTime() / 1000);


        http.get({
                hostname: 'api.aladhan.com',
                port: 80,
                path: '/timings/' + DateInEpochMillis + '?latitude=' + this.config.Latitude + '&longitude=' + this.config.Longitude + '&timezonestring=' + this.config.Timezone + '&method=' + this.config.CalculationMethod,
                agent: false // create a new agent just for this one request
            },
            function(response) {
                var body = '';
                response.on('data', function(d) {
                    body += d;
                });

                response.on('end', function() {
                    var parsed = JSON.parse(body);
                    var moment = require('moment-timezone');

                    var eventTimeString = parsed.data.timings[eventType];
                    var splitted = eventTimeString.split(/[\s:]+/);

                    var date = moment(referenceDate).format('YYYY-MM-DD');
                    var eventTime = date + "T" + splitted[0] + ":" + splitted[1] + ":00";

                    // callback
                    callback_fn(eventTime);
                });
            }
        );
    }
}
