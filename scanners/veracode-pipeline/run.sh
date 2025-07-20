#!/bin/bash

###
# Requirements:
# (1) The repo has already been packaged for Veracode as per https://docs.veracode.com/r/compilation_packaging
#       and stored into 'veracode-package.zip' at the root of the repo. It can also be manually defined by setting the
#       VERACODE_ZIPFILE environment variable.
# (2) Execute radar by prefixing the environment variables VERACODE_API_KEY_ID and VERACODE_API_KEY_SECRET.
#       EXAMPLE: 
#           $ VERACODE_API_KEY_ID=123456789 VERACODE_API_KEY_SECRET=a1b2c3d4e5f6 radar scan /path/to/repo
# Optional:
# (1) Include the environment variable VERACODE_ZIPFILE to define a different path and filename fo
#       the /path/to/repo/veracode-pacakage.zip file.
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
    -e VERACODE_API_KEY_ID="${VERACODE_API_KEY_ID}" \
    -e VERACODE_API_KEY_SECRET="${VERACODE_API_KEY_SECRET}" \
    -e VERACODE_ZIPFILE="${VERACODE_ZIPFILE}" \
    ghcr.io/eurekadevsecops/veracode-pipeline