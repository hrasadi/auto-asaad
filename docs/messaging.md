# Messaging

Scheduling messages is not hard inherently. However, one criteria for 
auto-asaad is depeding only on online (and preferebly free) service and not to
use any hosted services. To achieve this goal, auto-asaad uses an orchestration
 of onine services. Here is a high-level outline:

 Scheduler scripts --schedules--> Google Calendar  <--read_event-- IFTTT --trigger--> hook.io --REST API--> Telegram API