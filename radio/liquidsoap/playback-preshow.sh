#!/bin/sh

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
let wait_time=60-`date +%M`
sleep $wait_time

{ echo "var.set start_pre_show = true"; sleep 1; } | telnet localhost 1234 

# change the current program
# There is a slight code duplication here with the playback-show.sh file. We may fix it later
echo "${2}" > "{$1}.program.iter"

# reset the iterators
rm "{$1}.preshow.iter"
