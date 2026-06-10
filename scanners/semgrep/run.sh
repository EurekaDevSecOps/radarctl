#!/bin/bash

set -e

# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored
###

# Expand relative paths
APP_DIR=$(cd $1; pwd)
CFG_DIR=$(cd $2; pwd)
OUT_DIR=$(cd $3; pwd)

trap cleanup TERM INT

cleanup()
{
  PID=$(cat "${OUT_DIR}/semgrep.cid")
  docker stop $PID
  rm "${OUT_DIR}/semgrep.cid"
  exit 1
}

docker run --cidfile "${OUT_DIR}/semgrep.cid" --rm \
    -v "${APP_DIR}":/home/luser/app \
    -v "${CFG_DIR}":/tmp/radar-input \
    -v "${OUT_DIR}":/tmp/radar-output \
    -e SEMGREP_APP_TOKEN="${SEMGREP_APP_TOKEN}" \
    ghcr.io/eurekadevsecops/radar-semgrep 2>&1
