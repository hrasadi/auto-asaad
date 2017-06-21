#!/bin/bash

# Precise start of the target minute
sleep 2 # Avoid running on xx:59, if cron starts immediately.
let wait_time=60-`date +%M`
sleep $wait_time

{ echo "var.set start_pre_program = true"; sleep 1; } | telnet localhost 1234 

