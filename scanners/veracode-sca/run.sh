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

# Cross-platform stat: macOS uses -f, Linux uses -c
stat_uid_gid() {
  if stat -c "%u:%g" . >/dev/null 2>&1; then
    stat -c "%u:%g" "$1"     # Linux (GNU stat)
  else
    stat -f "%u:%g" "$1"     # macOS (BSD stat)
  fi
}

# Veracode SCA only supports linux/amd64.
docker run --platform linux/amd64 --rm \
    --user "$(stat_uid_gid "${APP_DIR}")" \
    -v "${APP_DIR}":/home/luser/app \
    -v "${CFG_DIR}":/home/luser/radar-input \
    -v "${OUT_DIR}":/home/luser/radar-output \
    -e SRCCLR_API_TOKEN=${SRCCLR_API_TOKEN} \
    ghcr.io/eurekadevsecops/radar-veracode-sca 2>&1
