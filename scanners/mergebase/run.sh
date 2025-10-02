#!/bin/bash

###
# Requirements:
# (1) Execute radar by prefixing the environment variable MERGEBASE_FETCH_KEY containing the API key to fetch the latest Mergebase.
#       This is necessary because the database is contained within the jar file and not downloaded separately.
#       EXAMPLE: 
#           $ MERGEBASE_FETCH_KEY=123456789 radar scan /path/to/repo
###
# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored
###

set -e

# Expand relative paths
APP_DIR=$(cd $1; pwd)
CFG_DIR=$(cd $2; pwd)
OUT_DIR=$(cd $3; pwd)

docker run --rm \
    -v "${APP_DIR}":/home/luser/app \
    -v "${CFG_DIR}":/home/luser/input \
    -v "${OUT_DIR}":/home/luser/output \
    -e MERGEBASE_FETCH_KEY="${MERGEBASE_FETCH_KEY}" \
    ghcr.io/eurekadevsecops/mergebase 2>&1