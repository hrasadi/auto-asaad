# Architectural Overview
Auto-asaad is basically a set of scripts that provide various features to develop
social media bots. The initial focus of auto-asaad was messaging platforms 
(and specially Telegram). However, the scripts can easily get expanded to support a 
larger variaty of platforms.

The main use-case for auto-asaad can be stated as follows:

_We want to automatically notify our service subscribers on specific point(s)
in time by sending them messages with customized text. The time for sending 
the messages may also change every day and is not necessarily fixed._

A very basic example would be to send a message every week to fill your audience 
with the news headlines.

The notification features have been implemented in two main classes, namely
[_messaging_](./messaging.md) and [_events_](./events.md).