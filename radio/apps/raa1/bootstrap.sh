#!/bin/bash

DEFAULT_CWD=`pwd`

echo "Directory to bootstrap [$DEFAULT_CWD]:"
read CWD

if [ "x$CWD" == "x" ]; then
    CWD=$DEFAULT_CWD
fi

echo 'Starting now...'

mkdir -p "$CWD/run/archive"
mkdir -p "$CWD/run/counter"
mkdir -p "$CWD/run/db"
mkdir -p "$CWD/run/lineup"
mkdir -p "$CWD/run/logs"
mkdir -p "$CWD/run/podcast"
mkdir -p "$CWD/run/rss"
mkdir -p "$CWD/run/tmp"

DBPATH="$CWD/run/db/`jq  -r '.CollaborativeListening.FeedDBFile' $1`"
HISTORY_DBPATH="$CWD/run/db/`jq  -r '.CollaborativeListening.FeedHistoryDBFile' $1`"

# Touch DB files
sqlite3 $DBPATH ".databases"
sqlite3 $HISTORY_DBPATH ".databases"
