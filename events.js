module.exports = function(eventsConfig) {

    this.utils = require('./utils');
    this.moment = require('moment');

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

        var DateInEpochMillis = parseInt(referenceDate.getTime() / 1000);

        this.utils.httpGet('api.aladhan.com', 
                            '/timings/' + DateInEpochMillis + '?latitude=' + this.config.Latitude + '&longitude=' + 
                            this.config.Longitude + '&timezonestring=' + this.config.Timezone + '&method=' + 
                            this.config.CalculationMethod,
                            function(body) {
                                var parsed = JSON.parse(body);

                                var eventTimeString = parsed.data.timings[eventType];
                                var splitted = eventTimeString.split(/[\s:]+/);

                                var date = this.moment(referenceDate).format('YYYY-MM-DD');
                                var eventTime = date + "T" + splitted[0] + ":" + splitted[1] + ":00";

                                // callback
                                callback_fn(eventTime);

                            });
    }

    this.readCalendar = function(month, year, callback_fn) {

        this.utils.httpGet('api.aladhan.com', 
                            '/calendar' + '?latitude=' + this.config.Latitude + '&longitude=' + 
                            this.config.Longitude + '&timezonestring=' + this.config.Timezone + '&method=' + 
                            this.config.CalculationMethod + '&month=' + month + '&year=' + year,
                            function(body) {
                                var parsed = JSON.parse(body);
                                var moment = require('moment-timezone');
                                parsed.data.forEach(function(day) {
                                    var fajrString = day.timings.Fajr;
                                    var sunriseString = day.timings.Sunrise;
                                    var dhuhrString = day.timings.Dhuhr;
                                    var asrString = day.timings.Asr;
                                    var sunsetString = day.timings.Sunset;
                                    var maghribString = day.timings.Maghrib;
                                    var ishaString = day.timings.Isha;
                                    var midnightString = day.timings.Midnight;
                            
                                    var date = day.date.readable;                         

                                    callback_fn(date, fajrString, sunriseString, dhuhrString, asrString, sunsetString,
                                        maghribString, ishaString, midnightString);                            
                                });
                            });
    }

}
