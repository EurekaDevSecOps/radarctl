#!/bin/bash

set -e

trap cleanup TERM INT

cleanup()
{
  PID=$(cat $3/depscan.cid)
  docker stop $PID
  rm $3/depscan.cid
  exit 1
}

# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored
###

# Expand relative paths
APP_DIR=$(cd $1; pwd)
CFG_DIR=$(cd $2; pwd)
OUT_DIR=$(cd $3; pwd)

## Depscan Settings
# Host dir for vulnerability database
DEPSCAN_DB_DIR=${DEPSCAN_DB_DIR:="/tmp/depscan-db"}
# Max age of database in seconds. Default: 6hrs
DEPSCAN_DB_TTL=${DEPSCAN_DB_TTL:="21600"}

docker run --rm --cidfile $3/depscan.cid \
    -e VDB_HOME=/db \
    -e DEPSCAN_DB_TTL=$DEPSCAN_DB_TTL \
    -v "$DEPSCAN_DB_DIR":/db \
    -v "$APP_DIR":/app \
    -v "$OUT_DIR":/output \
    ghcr.io/eurekadevsecops/radar-depscan 2>&1
