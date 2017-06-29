#!/bin/sh

# The the lineup file should be introduced as paramter

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
wait_time=$((60-`date +%M`))
sleep $wait_time

{ echo "var.set start_pre_show = false"; sleep 1; } | telnet localhost 1234 

touch "${1}.show.lock"

# Change the current program
# There is a slight code duplication here with the playback-pre-show.sh file. We may fix it later
echo "${2}" > "${1}.program.iter"

