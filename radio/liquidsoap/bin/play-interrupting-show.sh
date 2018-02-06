#!/bin/sh

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
wait_time=$((60-`date +%S`))
sleep $wait_time

# Change the current program
# There is a slight code duplication here with the playback-pre-show.sh file. We may fix it later
echo "${3}" > "${1}/interrupting-show-playback.liquidsoap.lock"

# The the lineup file should be introduced as paramter
clips=`node list-interrupting-show-items.js "${1}" "${2}" "${3}"` 
echo $clips
for line in $clips; do
  # pass it to telnet
  { echo "interrupting_show_q.push $line"; sleep 1; } | telnet localhost 1221
done 

# Don't come back to the the filler when done with the show
{ echo "var.set interrupting_pre_show_enabled = false"; sleep 1; } | telnet localhost 1221 
