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

docker run --rm \
    -v "${APP_DIR}":/app \
    -v "${CFG_DIR}":/tmp/radar-input \
    -v "${OUT_DIR}":/tmp/radar-output \
    -e SRCCLR_API_TOKEN=${SRCCLR_API_TOKEN} \
    ghcr.io/eurekadevsecops/veracode-sca