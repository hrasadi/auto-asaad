#!/bin/sh

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
wait_time=$((60-`date +%S`))
sleep $wait_time

# change the current program
# There is a slight code duplication here with the playback-show.sh file. We may fix it later
echo "${3}" > "${1}/run/interrupting-preshow-playback.liquidsoap.lock"

# stop any half-played items from before!
{ echo "interrupting_preshow_q.skip"; sleep 1; } | telnet localhost 1221 

# The the lineup file should be introduced as paramter
clips=`node list-interrupting-preshow-media.js "${1}" "${2}" "${3}"`
for line in $clips; do
  # pass it to telnet
  { echo "interrupting_preshow_q.push $line"; sleep 1; } | telnet localhost 1221
done 

# Now start playback
{ echo "var.set interrupting_pre_show_enabled = true"; sleep 1; } | telnet localhost 1221 

