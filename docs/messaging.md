# Messaging

Scheduling messages is not hard inherently. However, one criteria for 
auto-asaad is depeding only on online (and preferebly free) service and not to
use any hosted services. To achieve this goal, auto-asaad uses an orchestration
of onine services. Here is a high-level outline:

 Scheduler scripts ==schedules==>> Google Calendar <<==read_event== IFTTT 
 ==trigger==>> hook.io ==REST API==>> Telegram API

I have used the scripts and ideas provided [here](https://unnikked.ga/a-telegram-channel-and-group-scheduler-out-of-google-calendar-ifttt-and-hook-io-93a1716417db?utm_source=ifttt)
to schedule messages. Basically, our scheduling scripts (for which you can 
find samples in _app_ subdirectory), register events in Google calendar, 
and IFTTT and scripts hosted in hook.io are responsible for sending out the 
message at the desired time.

## Configuration

The messaging class accepts its configuration in JSON format. The format for the
object should be as follows:

```json
"Messaging": {
"Google": {
  "ClientId": "YOUR_CLIENT_ID",
  "ClientSecret": "YOUR_SECRET_ID",
  "RefreshToken": "YOUR_REFERESH_TOKEN",
  "CalendarName": "YOUR_CALENDAR_NAME"
},
"Telegram": {
  "ChatIdProvider": "static",
  "ChatIds": ["CHAT_ID_TO_RECEIVE_NOTIFICATIONS"]
}
```

The Google subsection passes authentication credentials to connect to Google
calendar service and also where the events sould be persisted.

The Telegram subsection, identifies the receipients of the scheduled messages.
Currently, the only implemented ChatIdProvider method is the _static_ method, 
i.e. you should provide a list of chat ID's you want to receive the notification
directly in the configuration file. If you have a Telegram bot and want to 
obtain chat IDs, you can refer to this [article](https://core.telegram.org/bots/api#getupdates)

## API

Messaging class can be instatiating by passing the configuration object to the constructor:

```javascript
var Messaging = require('../../messaging') // Assume the CWD be apps/myapp
var messaging = new Messaging(config)
```

After initialization, the public API calls available to you are as follows:
* `createCalEvent(eventTime, summary, message)`: registers an event in Google 
calendar where:

** `eventTime`: String. This is the scheduled time for the message. It should be in the 
ISO format (`YYYY-MM-DDTHH:mm:ss`).

** `summary`: String. The summary of the event. If using Telegram scheduling, 
the convention requires you to set it to `#scheduler` literal.

** `message`: String. The body of the notification. Note that you should escape special
characters in the string. For instance a new line character should be written as `\\n` in the string