#!/bin/bash

{ echo "var.set current_lineup_file = \"${1}\""; sleep 1; } | telnet localhost 1234 

