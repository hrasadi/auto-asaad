# Events
Events is a islamic event extractor specially to find out times for the call
for prayers. It uses the API provided by 
[alaghan.com](https://aladhan.com/prayer-times-api). Several examples on how to
use this class is available in `apps` subdirectory. Like in Messaging class, a 
configuration object should be passed to Events during initialization. 

## API

It worth noting the public interface of this class. Many of the functions accept
a value for eventType, which is an enumeration that identified which event we 
are looking for. Here is the definition of this enum:

```javacsript
EventType = {
    FAJR: 'Fajr',
    SUNRINSE: 'Sunrise',
    DHUHR: 'Duhr',
    ASR:'Asr',
    SUNSET: 'Sunset',
    MAGHRIB: 'Maghrib',
    MIDNIGHT: 'Midnight'
};
```
Therefore, you can access a value using a statement like `events.EventType.FAJR`.

The public API calls are as follows:

* `readTodayEvent(eventType, callback_fn)`
* `readEvent(referenceDate, eventType, callback_fn)`

	Both of the above stated calls, read the information from aladhan.com server and 
	call the `callback_fn(eventTime)`

* `readCalendar(month, year, callback_fn)`
	The `callback_fn` function callback accepts a date string and all the event times 
	for that day in this order:

	```
	callback = function(date, fajrString, sunriseString, dhuhrString, asrString, sunsetString,
		maghribString, ishaString, midnightString) { // CALLBACK BODY }
	```



