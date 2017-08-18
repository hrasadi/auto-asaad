Utils = require('./utils');
moment = require('moment');

module.exports = function(eventsConfig) {

    this.config = eventsConfig;    

    this.EventType = {
        FAJR: 'Fajr',
        SUNRINSE: 'Sunrise',
        DHUHR: 'Dhuhr',
        ASR:'Asr',
        SUNSET: 'Sunset',
        MAGHRIB: 'Maghrib',
        MIDNIGHT: 'Midnight'
    };

    this.readTodayEvent = function(callback_fn) {
        var today = new Date();

        this.readEvent(today, callback_fn);
    }

    this.readEvent = function(referenceDate, callback_fn) {

        var DateInEpochMillis = parseInt(referenceDate.getTime() / 1000);

        self = this;
        Utils.httpGet('api.aladhan.com', 
                            '/timings/' + DateInEpochMillis + '?latitude=' + this.config.Latitude + '&longitude=' + 
                            this.config.Longitude + '&timezonestring=' + this.config.Timezone + '&method=' + 
                            this.config.CalculationMethod,
                            function(body) {
                                var parsed = JSON.parse(body);

                                events = {};
                                for (var eventType in self.EventType) {
                                    var eventTimeString = parsed.data.timings[self.EventType[eventType]];
                                    var splitted = eventTimeString.split(/[\s:]+/);
                                    var date = moment(referenceDate).format('YYYY-MM-DD');
                                    var eventTime = date + "T" + splitted[0] + ":" + splitted[1] + ":00";
                           
                                    events[self.EventType[eventType]] = eventTime;
                                }
                                // callback
                                callback_fn(referenceDate, events);
                            });
    }

    this.readCalendar = function(month, year, callback_fn) {

        Utils.httpGet('api.aladhan.com', 
                            '/calendar' + '?latitude=' + this.config.Latitude + '&longitude=' + 
                            this.config.Longitude + '&timezonestring=' + this.config.Timezone + '&method=' + 
                            this.config.CalculationMethod + '&month=' + month + '&year=' + year,
                            function(body) {
                                var parsed = JSON.parse(body);
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
