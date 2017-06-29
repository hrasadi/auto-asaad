#!/bin/bash

{ echo "var.set current_lineup_file = \"${1}\""; sleep 1; } | telnet localhost 1234 

# Save where in the lineup is the first program that sould be played
echo "${2}" > "{$1}.program.iter"

# reset the iterators
rm "${1}.preshow.iter"
rm "${1}.show.iter"
rm "${1}.show.lock"