#!/bin/bash

{ echo "var.set current_lineup_file = \"${1}\""; sleep 1; } | telnet localhost 1234 

# Save what program is currently played (used nowadays for the filler)
echo "${2}" > "${1}.program.iter"

