#!/bin/bash

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
wait_time=$((60-`date +%S`))
sleep $wait_time

# Change the current program
# There is a slight code duplication here with the playback-pre-show.sh file. We may fix it later
echo "${3}" > "${1}/run/box-playback.liquidsoap.lock"

# The the lineup file should be introduced as paramter
clips=`node list-box-media.js "${1}" "${2}" "${3}"` 
echo $clips
for line in $clips; do
  # pass it to telnet
  { echo "show_q.push $line"; sleep 1; } | telnet localhost 1221
done 
