#!/bin/bash

{ echo "var.set pre_program_filler = \"${1}\""; sleep 1; } | telnet localhost 1234 

