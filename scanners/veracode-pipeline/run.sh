#!/bin/bash

# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored

# Requirements:
#
# Environment variables VERACODE_API_KEY_ID and VERACODE_API_KEY_SECRET must be set:
# [Veracode Platform](https://docs.veracode.com/r/c_api_credentials3#generate-api-credentials).
#
# EXAMPLE:
# $ VERACODE_API_KEY_ID=123456789 VERACODE_API_KEY_SECRET=somesecret radar scan /path/to/repo
#
# Optional:
#
# (A) The repo has already been packaged for Veracode as per https://docs.veracode.com/r/compilation_packaging
#     and stored into a ZIP file somewhere within the repo. Set the environment variable VERACODE_ZIPFILE to the
#     path/to/repo/veracode-package.zip file, relative to the root folder of the repo.
#
# -or-
#
# (B) Set the environment variable VERACODE_PACKAGE_CMD to the command that can create the Veracode package ZIP.
#     We will run the command from the root of the repo. It should create veracode-package.zip and save it into
#     the root folder of the repo. We will and submit this ZIP to Veracode Pipeline for a scan.
#
#     Examples:
#     export VERACODE_PACKAGE_CMD="zip -qr veracode-package.zip lib"
#     export VERACODE_PACKAGE_CMD="npm run build && zip -qr veracode-package.zip dist"
#     export VERACODE_PACKAGE_CMD="make && zip -qr veracode-package.zip out"
#
# -or-
#
# (C) Your project does not need a build step. Omit both VERACODE_ZIPFILE and VERACODE_PACKAGE_CMD. We will
#     automatically ZIP up the repo, excluding any files referenced in .gitignore, and submit to Veracode Pipeline
#     for a scan. This is the default action if you don't set VERACODE_ZIPFILE and VERACODE_PACKAGE_CMD.
#     This is appropriate for interpreted languages (Javascript, Python, etc) that don't need to be compiled.

set -e

# Expand relative paths
APP_DIR=$(cd $1; pwd)
CFG_DIR=$(cd $2; pwd)
OUT_DIR=$(cd $3; pwd)

# Veracode Pipeline only supports linux/amd64.
docker run --platform linux/amd64 --rm \
    -v "${APP_DIR}":/opt/eureka/radar/temp/repo \
    -v "${CFG_DIR}":/opt/eureka/radar/temp/input \
    -v "${OUT_DIR}":/opt/eureka/radar/temp/output \
    -e VERACODE_API_KEY_ID="${VERACODE_API_KEY_ID}" \
    -e VERACODE_API_KEY_SECRET="${VERACODE_API_KEY_SECRET}" \
    -e VERACODE_ZIPFILE="${VERACODE_ZIPFILE}" \
    -e VERACODE_PACKAGE_CMD="${VERACODE_PACKAGE_CMD}" \
    ghcr.io/eurekadevsecops/radar-veracode-pipeline 2>&1
