#!/bin/sh

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
wait_time=$((60-`date +%M`))
sleep $wait_time

# change the current program
# There is a slight code duplication here with the playback-show.sh file. We may fix it later
echo "${2}" > "${1}.program.iter"

# The the lineup file should be introduced as paramter
clips=`node list-preshow-items ${1} ${2}` 
for line in $clips; do
  # pass it to telnet
  { echo "pre_show_q.push $line"; sleep 1; } | telnet localhost 1234
done 

# Now start playback
{ echo "var.set start_pre_show = true"; sleep 1; } | telnet localhost 1234 

